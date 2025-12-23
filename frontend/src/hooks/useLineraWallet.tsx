import { useState, useCallback, useEffect, createContext, useContext, useRef } from 'react';
import { Wallet } from "ethers";
import { PrivateKey } from "@linera/signer";
import { initialize, Client, Faucet } from "@linera/client";

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

    const [clientInstance, setClientInstance] = useState<any>(null);

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
                    const envUrl = import.meta.env.VITE_LINERA_NODE_URL?.trim();
                    const nodeUrl = envUrl || "https://testnet-conway.linera.net";
                    console.log("Using Node URL:", nodeUrl);
                    const options = { validators: [nodeUrl] };
                    const newClient = await new Client(wallet, signer, options as any);
                    clientRef.current = newClient;
                    setClientInstance(newClient);
                    console.log("Client Ready!");
                    fetchBalance();
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

    const connect = async () => {
        window.location.reload();
    };

    const disconnect = useCallback(async () => {
        console.log("Resetting Network...");
        localStorage.clear(); // Clear all local storage to be safe

        try {
            if (window.indexedDB && window.indexedDB.databases) {
                const dbs = await window.indexedDB.databases();
                const promises = dbs.map(db => {
                    if (db.name) {
                        return new Promise<void>((resolve, reject) => {
                            console.log("Deleting DB:", db.name);
                            const req = window.indexedDB.deleteDatabase(db.name!);
                            req.onsuccess = () => resolve();
                            req.onerror = () => reject("Failed to delete " + db.name);
                            req.onblocked = () => {
                                console.warn("Delete blocked: " + db.name);
                                resolve(); // Proceed anyway
                            };
                        });
                    }
                    return Promise.resolve();
                });
                await Promise.all(promises);
            }
        } catch (e) {
            console.warn("Could not clear IndexedDB:", e);
        }

        console.log("Reset Complete. Reloading...");
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
        if (!owner || !clientRef.current) return;
        try {
            const faucetUrl = import.meta.env.VITE_LINERA_FAUCET_URL || "https://faucet.testnet-conway.linera.net";
            const faucet = new Faucet(faucetUrl);
            const wallet = await faucet.createWallet();
            const chain = await faucet.claimChain(wallet, owner);

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
            client: clientInstance,
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
