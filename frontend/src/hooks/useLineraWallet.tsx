import { useState, useCallback, useEffect, createContext, useContext, useRef } from 'react';
import { initialize, Client, Faucet } from "@linera/client";
import * as linera from "@linera/client";

interface LineraWalletContextType {
    isReady: boolean;
    isConnected: boolean;
    isConnecting: boolean;
    chainId: string | null;
    owner: string | null;
    autosignerOwner: string | null;
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
    const [autosignerOwner, setAutosignerOwner] = useState<string | null>(null);
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

            const storedChainId = localStorage.getItem("linera_chain_id");
            const storedOwner = localStorage.getItem("linera_owner");

            if (storedChainId && storedOwner) {
                console.log("Found previous session, auto-reconnecting...");
                try {
                    const { MetaMask } = await import('../utils/metamask');
                    const metaMaskSigner = new MetaMask();
                    const faucet = new Faucet(import.meta.env.VITE_LINERA_FAUCET_URL || "https://faucet.testnet-conway.linera.net");
                    const wallet = await faucet.createWallet();

                    const autosigner = linera.signer.PrivateKey.createRandom();
                    const autosignerAddr = autosigner.address();

                    const compositeSigner = new linera.signer.Composite(autosigner, metaMaskSigner);
                    const envUrl = import.meta.env.VITE_LINERA_NODE_URL?.trim();
                    const nodeUrl = envUrl || "https://testnet-conway.linera.net";
                    const options = { validators: [nodeUrl] };
                    const newClient = await new Client(wallet, compositeSigner, options as any);

                    setOwner(storedOwner);
                    setAutosignerOwner(autosignerAddr);
                    setChainId(storedChainId);
                    clientRef.current = newClient;
                    setClientInstance(newClient);
                    setIsConnected(true);
                    console.log("✅ Auto-reconnected with fresh autosigner!");

                    try {
                        const chainHandle = await newClient.chain(storedChainId);
                        await chainHandle.addOwner(autosigner.address());
                        wallet.setOwner(storedChainId, autosigner.address());
                    } catch (ownerErr) {
                        console.warn("Could not register autosigner:", ownerErr);
                    }

                    try {
                        const chainHandle = await newClient.chain(storedChainId);
                        const bal = await chainHandle.balance();
                        setBalance(bal?.toString() || "0");
                    } catch (e) {
                        console.warn("Balance fetch failed:", e);
                    }
                } catch (reconnectErr) {
                    console.warn("Auto-reconnect failed:", reconnectErr);
                    localStorage.removeItem("linera_owner");
                }
            }

        } catch (e: any) {
            console.error("Initialization Failed:", e);
            setError(e.message || "Failed to initialize wallet");
        }
    };

    useEffect(() => {
        initializeWallet();
    }, []);

    const connect = async () => {
        setIsConnecting(true);
        setError(null);
        try {
            console.log("Connecting with MetaMask...");

            const { MetaMask } = await import('../utils/metamask');
            const metaMaskSigner = new MetaMask();

            const metaMaskAddr = await metaMaskSigner.address();
            console.log("MetaMask Address:", metaMaskAddr);
            setOwner(metaMaskAddr);

            const defaultProxy = typeof window !== 'undefined' ? window.location.origin + "/faucet-proxy" : "https://faucet.testnet-conway.linera.net";
            const faucetUrl = import.meta.env.VITE_LINERA_FAUCET_URL || defaultProxy;
            const faucet = new Faucet(faucetUrl);
            const wallet = await faucet.createWallet();

            const chain = await faucet.claimChain(wallet, metaMaskAddr);
            localStorage.setItem("linera_owner", metaMaskAddr);
            localStorage.setItem("linera_chain_id", chain);
            console.log("Chain ID:", chain);

            setChainId(chain);

            console.log("Creating autosigner for background operations...");
            const autosigner = linera.signer.PrivateKey.createRandom();
            const autosignerAddr = autosigner.address();
            console.log("Autosigner Address:", autosignerAddr);
            setAutosignerOwner(autosignerAddr);

            console.log("Initializing Client with Composite Signer...");
            const envUrl = import.meta.env.VITE_LINERA_NODE_URL?.trim();
            const nodeUrl = envUrl || "https://testnet-conway.linera.net";

            const options = { validators: [nodeUrl] };
            const compositeSigner = new linera.signer.Composite(autosigner, metaMaskSigner);
            const newClient = await new Client(wallet, compositeSigner, options as any);

            clientRef.current = newClient;
            setClientInstance(newClient);
            setIsConnected(true);
            console.log("Client Ready with Composite Signer!");

            try {
                console.log("Registering autosigner as chain owner...");
                const chainHandle = await newClient.chain(chain);
                chainHandle.addOwner(autosigner.address());
                wallet.setOwner(chain, autosigner.address());
                console.log("Autosigner registered and set as default owner");
                console.log("MetaMask owner (for user mutations):", metaMaskAddr);
            } catch (ownerErr) {
                console.warn("Could not register autosigner as owner (non-fatal):", ownerErr);
            }

            (async () => {
                if (chain && newClient) {
                    try {
                        const chainHandle = await newClient.chain(chain);
                        const bal = await chainHandle.balance();
                        setBalance(bal?.toString() || "0");
                        console.log("Initial Balance:", bal);
                    } catch (e) {
                        console.warn("Initial Balance Fetch Failed", e);
                    }
                }
            })();
        } catch (e: any) {
            console.error("Connection Failed:", e);
            const fatalErrors = [
                "out of order",
                "Blob not found",
                "Worker operation failed",
                "Missing dependency"
            ];

            const isFatal = fatalErrors.some(err => e.message?.includes(err) || e.toString().includes(err));

            if (isFatal) {
                console.error("FATAL SYNC ERROR DETECTED. INITIATING AUTO-RESET...");
                setError("Critical Sync Error Detected. Resetting Network...");
                await disconnect(); // This clears IndexedDB and reloads
                return;
            }

            setError(e.message || "Connection failed");
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnect = useCallback(async () => {
        console.log("Resetting Network & Clearing Storage...");
        localStorage.clear();

        const dbsToDelete = ['linera', 'linera_testnet', 'linera_db', 'linera-wasm'];

        try {
            if (window.indexedDB && window.indexedDB.databases) {
                const dbs = await window.indexedDB.databases();
                dbs.forEach(db => {
                    if (db.name) dbsToDelete.push(db.name);
                });
            }
        } catch (e) {
            console.warn("Could not list databases, using default list", e);
        }

        const uniqueDBs = [...new Set(dbsToDelete)];
        const promises = uniqueDBs.map(name => {
            return new Promise<void>((resolve) => {
                console.log(`Deleting DB: ${name}`);
                const req = window.indexedDB.deleteDatabase(name);
                req.onsuccess = () => resolve();
                req.onerror = () => {
                    console.warn(`Failed to delete ${name}`);
                    resolve(); // Resolve anyway to continue
                };
                req.onblocked = () => {
                    console.warn(`Delete blocked: ${name} - Close other tabs!`);
                    resolve();
                };
            });
        });

        await Promise.all(promises);
        console.log("Reset Complete. Reloading in 500ms...");
        setTimeout(() => {
            window.location.reload();
        }, 500);
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
            autosignerOwner,
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
