import { useState, useCallback, useEffect, createContext, useContext, useRef } from 'react';
import { Wallet } from "ethers"; // For generating mnemonic
import { PrivateKey } from "@linera/signer";
import { initialize, Client, Faucet } from "@linera/client";

// Define the context type
interface LineraWalletContextType {
    isReady: boolean;
    isConnected: boolean;
    isConnecting: boolean;
    chainId: string | null;
    owner: string | null;
    balance: string | null;
    client: any | null;
    getApplication: (applicationId: string) => Promise<any>;
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
    const [balance, setBalance] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Key fix: Use state for client to trigger re-renders in consumers
    const [clientInstance, setClientInstance] = useState<any>(null);

    // Refs for internal logic that doesn't need to trigger re-renders itself
    const clientRef = useRef<any>(null);
    const initRef = useRef(false);

    const fetchBalance = useCallback(async () => {
        if (!chainId || !clientRef.current) return;
        try {
            const chain = await clientRef.current.chain(chainId);
            const bal = await chain.balance();
            setBalance(bal?.toString() || "0");
        } catch (e) {
            console.warn("Client fetch failed:", e);
        }
    }, [chainId]);

    // Poll for balance updates
    useEffect(() => {
        if (isConnected && chainId) {
            fetchBalance();
            const interval = setInterval(fetchBalance, 5000);
            return () => clearInterval(interval);
        }
    }, [isConnected, chainId, fetchBalance]);

    const initializeWallet = async () => {
        if (initRef.current) return;
        initRef.current = true;

        setIsConnecting(true);
        try {
            if (!window.crossOriginIsolated) {
                const errorMsg = "Linera Requirements: App is not Cross-Origin Isolated. Wasm threads will fail.";
                console.error(errorMsg);
                setError("Missing Server Headers (Restart Required)");
                return;
            }

            await initialize();
            setIsReady(true);
            console.log("Linera WASM initialized");

            let mnemonic = localStorage.getItem('linera_mnemonic');
            if (!mnemonic) {
                const generated = Wallet.createRandom();
                const phrase = generated.mnemonic?.phrase;
                if (!phrase) throw new Error('Failed to generate mnemonic');
                mnemonic = phrase;
                localStorage.setItem('linera_mnemonic', mnemonic);
                console.log("Created new Burner Wallet");
            } else {
                console.log("Loaded existing Burner Wallet");
            }

            const signer = PrivateKey.fromMnemonic(mnemonic);
            const addr = (signer as any).wallet.address;
            setOwner(addr);
            console.log("Signer Address:", addr);

            const faucetUrl = import.meta.env.VITE_LINERA_FAUCET_URL || "https://faucet.testnet-conway.linera.net";
            console.log("Using Faucet:", faucetUrl);
            const faucet = new Faucet(faucetUrl);
            console.log("Creating/Resuming Wallet...");
            const wallet = await faucet.createWallet();

            console.log("Claiming Chain...");
            const chain = await faucet.claimChain(wallet, addr);

            setChainId(chain);
            localStorage.setItem("linera_chain_id", chain);
            console.log("Chain ID:", chain);

            console.log("Initializing Client...");
            setIsConnected(true);
            setIsConnecting(false);
            (async () => {
                try {
                    const newClient = await new Client(wallet, signer, null)
                    clientRef.current = newClient;
                    setClientInstance(newClient);
                    console.log("Client Ready!");
                    fetchBalance();
                } catch (err: any) {
                    console.error("Client Init Failed:", err);
                    setError("Client Synchronization Failed. Check console.");
                }
            })();

        } catch (e: any) {
            console.error("Initialization Failed:", e);
            setError(e.message || "Failed to initialize wallet");
            setIsConnecting(false);
        }
    };

    useEffect(() => {
        initializeWallet();
    }, []);

    // Manual connect/disconnect becomes a reset or no-op since we auto-connect burner
    const connect = async () => {
        // Force re-init?
        window.location.reload();
    };

    const disconnect = useCallback(() => {
        // Clear mnemonic to "logout"
        localStorage.removeItem("linera_mnemonic");
        window.location.reload();
    }, []);

    const getApplication = useCallback(async (applicationId: string) => {
        if (!clientRef.current || !chainId) {
            throw new Error("Client not ready or chain ID missing");
        }
        const chain = await clientRef.current.chain(chainId);
        return await chain.application(applicationId);
    }, [chainId]);

    const requestFaucet = useCallback(async () => {
        // Burner wallet request logic (re-claim chain usually grants funds)
        if (!owner || !clientRef.current) return;
        try {
            const faucetUrl = import.meta.env.VITE_LINERA_FAUCET_URL || "https://faucet.testnet-conway.linera.net";
            const faucet = new Faucet(faucetUrl);
            const wallet = await faucet.createWallet();
            const chain = await faucet.claimChain(wallet, owner); // This often grants 10 tokens

            console.log("Funds requested, chain updated:", chain);
            fetchBalance();
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to request faucet funds");
        }
    }, [owner, fetchBalance]);

    return (
        <LineraWalletContext.Provider value={{
            isReady,
            isConnected,
            isConnecting,
            chainId,
            owner,
            balance,
            client: clientInstance, // Use state here!
            getApplication,
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
