import { useState, useCallback, useEffect, createContext, useContext, useRef } from 'react';
import { MetaMask } from "../utils/metamask";

// Helper to bypass Webpack for the browser client
const dynamicImport = (path: string) =>
    (new Function("p", "return import(p);"))(path) as Promise<any>;

// Define the context type
interface LineraWalletContextType {
    isReady: boolean;
    isConnected: boolean;
    isConnecting: boolean;
    chainId: string | null;
    owner: string | null;
    balance: string | null;
    client: any | null;
    connect: () => Promise<void>;
    disconnect: () => void;
    requestFaucet: () => Promise<void>;
    error: string | null;
}

const LineraWalletContext = createContext<LineraWalletContextType | undefined>(undefined);

export const LineraWalletProvider = ({ children }: { children: React.ReactNode }) => {
    const [isReady, setIsReady] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [owner, setOwner] = useState<string | null>(null);
    const [chainId, setChainId] = useState<string | null>(null);
    // Note: Reference impl didn't expose balance in context, only chainId.
    // I will keep balance state but it might need manual fetch if not in reference logic.
    const [balance, setBalance] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const clientRef = useRef<any>(null);
    const lineraModule = useRef<any>(null);

    // 1. Initialize WASM logic on mount
    useEffect(() => {
        const initWasm = async () => {
            // Check for Cross-Origin Isolation (Required for SharedArrayBuffer)
            if (!window.crossOriginIsolated) {
                const errorMsg = "Linera Requirements: App is not Cross-Origin Isolated. Wasm threads will fail. PLEASE RESTART VITE SERVER (`npm run dev`) to apply header changes.";
                console.error(errorMsg);
                setError("Missing Server Headers (Restart Required)");
                return;
            }

            try {
                // Dynamically import from public/js folder
                const linera = await dynamicImport("/js/@linera/client/linera.js");
                await linera.default();
                lineraModule.current = linera;
                setIsReady(true);
                console.log("Linera WASM initialized");
            } catch (err: any) {
                console.error("Failed to load Linera WASM:", err);
                setError("Failed to load Linera Core");
            }
        };
        initWasm();
    }, []);

    const fetchBalance = useCallback(async () => {
        if (!clientRef.current || !chainId) return;
        try {
            const chain = await clientRef.current.chain(chainId);
            const bal = await chain.balance();
            // The balance might return as a complex object or string depending on version.
            // Based on useMinesGame, it seems to be a valid value for setBalance.
            setBalance(bal?.toString() || "0");
        } catch (e) {
            console.error("Failed to fetch balance:", e);
        }
    }, [chainId]); // clientRef is stable

    // 3. Poll for balance updates
    useEffect(() => {
        if (isConnected && chainId) {
            fetchBalance();
            const interval = setInterval(fetchBalance, 5000); // 5s poll
            return () => clearInterval(interval);
        }
    }, [isConnected, chainId, fetchBalance]);

    // 2. Auto-Connect Effect
    useEffect(() => {
        if (isReady && localStorage.getItem("linera_auto_connect") === "true") {
            connect();
        }
    }, [isReady]);

    const connect = useCallback(async () => {
        if (!lineraModule.current) return;
        setIsConnecting(true);
        setError(null);

        try {
            const linera = lineraModule.current;
            const faucetUrl = import.meta.env.VITE_LINERA_FAUCET_URL ?? "https://faucet.testnet-conway.linera.net";
            console.log("Using Faucet:", faucetUrl);

            // Initialize Faucet
            const faucet = await new linera.Faucet(faucetUrl);

            // Connect to MetaMask
            const signer = new MetaMask();

            // This will prompt if not already connected
            const addr = await signer.address();
            setOwner(addr);
            console.log("MetaMask connected:", addr);

            // Create Wallet (needed for Client structure)
            console.log("Creating local wallet container...");
            const wallet = await faucet.createWallet();

            let chain = localStorage.getItem("linera_chain_id");
            if (!chain) {
                console.log("No stored chain, claiming new one...");
                chain = await faucet.claimChain(wallet, addr); // returns string
                localStorage.setItem("linera_chain_id", chain as string);
            } else {
                console.log("Resuming session for chain:", chain);
            }

            const validChain = chain as string;

            setChainId(validChain);
            console.log("Chain ID:", validChain);

            setIsConnected(true);

            // Create Client
            console.log("Initializing Client...");
            const newClient = await new linera.Client(wallet, signer, null);
            clientRef.current = newClient;
            console.log("Client Initialized");

            // Initial Fetch
            // We need to wait a tick or use the new client ref directly
            // But fetchBalance uses clientRef.current which is now set.
            // Let's call it direct or let the effect handle it.
            // The effect depends on `isConnected` and `chainId`, which are set.
            // So it should trigger automatically.

            // Success state part 2
            localStorage.setItem("linera_auto_connect", "true");
            localStorage.setItem("linera_chain_id", validChain);

            // setBalance("0") <- Removed, let fetch logic handle it.

        } catch (err: any) {
            console.error("Connection failed:", err);
            setError(err?.message ?? "Failed to connect wallet");
            localStorage.removeItem("linera_auto_connect");
        } finally {
            setIsConnecting(false);
        }
    }, [isReady]);

    const disconnect = useCallback(() => {
        setIsConnected(false);
        setOwner(null);
        setChainId(null);
        setBalance(null);
        clientRef.current = null;
        localStorage.removeItem("linera_auto_connect");
        localStorage.removeItem("linera_chain_id");
    }, []);

    const requestFaucet = useCallback(async () => {
        if (!lineraModule.current || !owner) return;

        try {
            const linera = lineraModule.current;
            const faucetUrl = import.meta.env.VITE_LINERA_FAUCET_URL ?? "https://faucet.testnet-conway.linera.net";
            const faucet = await new linera.Faucet(faucetUrl);
            const signer = new MetaMask();

            // We essentially re-claim a chain and update persistence
            // In Testnet, this often grants a new chain with initial funds (e.g. 10 tokens), or tops up.
            console.log("Requesting funds (re-claiming chain)...");
            const wallet = await faucet.createWallet();
            // Clear local storage before fetching new chain
            localStorage.removeItem("linera_chain_id");
            const chain = await faucet.claimChain(wallet, owner);

            // Update State
            setChainId(chain);
            // setBalance("10") <- Removed, use fetchBalance
            localStorage.setItem("linera_chain_id", chain);

            console.log("Funds requested. New Chain ID/State:", chain);

            // Re-bind client to new wallet/chain
            const newClient = await new linera.Client(wallet, signer, null);
            clientRef.current = newClient;

            // Trigger fetch immediately
            // We can't call fetchBalance easily here as it depends on state that might not be flushed.
            // But updating `chainId` triggers the effect re-run which calls `fetchBalance`.

        } catch (e: any) {
            console.error("Faucet request failed:", e);
            throw e;
        }
    }, [owner, isReady]);

    return (
        <LineraWalletContext.Provider value={{
            isReady,
            isConnected,
            isConnecting,
            chainId,
            owner,
            balance,
            client: clientRef.current,
            connect,
            disconnect,
            requestFaucet,
            error
        }}>
            {children}
        </LineraWalletContext.Provider>
    );
};

export const useLineraWallet = () => {
    const context = useContext(LineraWalletContext);
    if (!context) {
        throw new Error("useLineraWallet must be used within a LineraWalletProvider");
    }
    return context;
};
