import { useState, useEffect, useCallback } from 'react';

// Interface for the injected Linera provider (Checko)
interface LineraProvider {
    request: (args: { method: string; params?: any }) => Promise<any>;
}

declare global {
    interface Window {
        linera?: LineraProvider;
    }
}

export const useChecko = () => {
    const [provider, setProvider] = useState<LineraProvider | null>(null);
    const [account, setAccount] = useState<string | null>(null);
    const [chainId, setChainId] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const checkProvider = () => {
            if (window.linera) {
                setProvider(window.linera);
            }
        };

        checkProvider();
        window.addEventListener('load', checkProvider);
        return () => window.removeEventListener('load', checkProvider);
    }, []);

    const connect = useCallback(async () => {
        if (!provider) {
            alert("Checko wallet not found! Please install the extension.");
            return;
        }
        try {
            // Request account access
            // Note: Method names depend on the specific wallet standard. 
            // Using generic 'eth_requestAccounts' style or Linera specific if documented.
            // For Linera: often just getting the signer info is enough.
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            if (accounts && accounts.length > 0) {
                setAccount(accounts[0]);
                setIsConnected(true);
            }

            // Fetch current Chain ID if possible
            // const chain = await provider.request({ method: 'linera_chain' });
            // setChainId(chain);

        } catch (error) {
            console.error("Connection failed:", error);
        }
    }, [provider]);

    const graphQLMutation = useCallback(async (query: string, variables: any = {}) => {
        if (!provider) throw new Error("Wallet not connected");

        // This connects to the wallet which proxies the request to the Linera node
        // and signs the block proposal.
        return await provider.request({
            method: 'linera_graphql_mutation',
            params: {
                query,
                variables,
                applicationId: import.meta.env.VITE_LINERA_APP_ID,
            },
        });
    }, [provider]);

    const graphQLQuery = useCallback(async (query: string, variables: any = {}) => {
        if (!provider) throw new Error("Wallet not connected");
        // Read-only query to the Service
        return await provider.request({
            method: 'linera_graphql_query',
            params: {
                query,
                variables,
                applicationId: import.meta.env.VITE_LINERA_APP_ID,
            },
        });
    }, [provider]);

    return {
        provider,
        account,
        chainId,
        isConnected,
        connect,
        graphQLMutation,
        graphQLQuery
    };
};
