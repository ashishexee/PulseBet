import { useCallback, useEffect, useState } from 'react';
import { useLineraWallet } from './useLineraWallet';

const PULSE_TOKEN_APP_ID = import.meta.env.VITE_PULSE_TOKEN_APP_ID;

export const usePulseToken = () => {
    const { getApplication, client, chainId, owner } = useLineraWallet();
    const [tokenBalance, setTokenBalance] = useState<string | null>(null);

    const fetchTokenBalance = useCallback(async () => {
        if (!client || !chainId || !PULSE_TOKEN_APP_ID || !owner) return;

        try {
            const query = `{ balance(owner: "${owner}") }`;

            // async-graphql expects: {"query": "..."} not just the raw query string
            const requestBody = JSON.stringify({ query });
            const app = await getApplication(PULSE_TOKEN_APP_ID);
            const result = await app.query(requestBody);

            console.log("PulseToken Balance:", result);
            const data = JSON.parse(result);
            setTokenBalance(data?.balance?.toString() || "0");
        } catch (e) {
            // console.error("Failed to fetch PulseToken balance:", e);
        }
    }, [getApplication, chainId, owner, client]);

    const mint = useCallback(async (amount: string) => {
        if (!client || !chainId || !PULSE_TOKEN_APP_ID || !owner) {
            throw new Error("Wallet not connected or Token App ID missing");
        }

        const mutation = `
            mutation {
                mint(owner: "${owner}", amount: "${amount}")
            }
        `;

        // async-graphql expects: {"query": "..."} not just the raw query string
        const requestBody = JSON.stringify({ query: mutation });
        const app = await getApplication(PULSE_TOKEN_APP_ID);
        await app.query(requestBody);

        await fetchTokenBalance();
    }, [getApplication, client, chainId, owner, fetchTokenBalance]);

    useEffect(() => {
        fetchTokenBalance();
        const interval = setInterval(fetchTokenBalance, 5000);
        return () => clearInterval(interval);
    }, [fetchTokenBalance]);

    const isReady = !!(client && chainId && owner && PULSE_TOKEN_APP_ID);

    return {
        tokenBalance,
        mint,
        appId: PULSE_TOKEN_APP_ID,
        isReady
    };
};
