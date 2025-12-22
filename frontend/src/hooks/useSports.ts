import { useState, useCallback, useEffect } from 'react';
import { useLineraWallet } from './useLineraWallet';

export interface LiveBet {
    id: string;
    question: string;
    odds: number;
    endTime: number; // microseconds
    status: 'Open' | 'Closed' | 'Resolved';
    result: boolean | null;
}

export const useSportsGame = () => {
    const { client, chainId, owner, getApplication } = useLineraWallet();
    const [liveBets, setLiveBets] = useState<LiveBet[]>([]);
    const [loading, setLoading] = useState(false);

    const APP_ID = import.meta.env.VITE_SPORTS_APP_ID;
    const ORACLE_CHAIN_ID = import.meta.env.VITE_ORACLE_CHAIN_ID;

    const fetchLiveBets = useCallback(async () => {
        if (!client || !chainId || !APP_ID) return;

        // Query matches the struct field name in Rust (QueryRoot { bets })
        const query = `
                getAllBets {
                    id
                    question
                    odds
                    endTime
                    status
                    result
                
            }
        `;

        try {
            const chainIdToQuery = ORACLE_CHAIN_ID || chainId; 
            
            const chain = await client.chain(chainIdToQuery);
            const app = await getApplication(APP_ID);
            const responseJson = await app.query(JSON.stringify({ query }));
            const response = JSON.parse(responseJson);
            if (response.data?.bets) {
                // Reverse to show newest first
                setLiveBets(response.data.bets.reverse());
            }
        } catch (e) {
            console.error("Failed to fetch bets:", e);
        }
    }, [client, chainId, APP_ID,ORACLE_CHAIN_ID, getApplication]);

    const placeBet = async (betId: string, amount: number, prediction: boolean) => {
        if (!owner || !APP_ID) return;
        setLoading(true);
        
        const mutation = `
            mutation {
                placeBet(betId: ${betId}, amount: ${amount}, prediction: ${prediction}, owner: "${owner}")
            }
        `;

        try {
            const app = await getApplication(APP_ID);
            await app.query(JSON.stringify({ query: mutation }));
            await fetchLiveBets(); // Refresh list immediately
        } catch (e) {
            console.error("Place bet failed:", e);
            alert("Failed to place bet. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    const claimWinnings = async (betId: string) => {
        if (!owner || !APP_ID) return;
        setLoading(true);

        const mutation = `
            mutation {
                claim(betId: ${betId}, owner: "${owner}")
            }
        `;

        try {
            const app = await getApplication(APP_ID);
            await app.query(JSON.stringify({ query: mutation }));
            await fetchLiveBets();
            alert("Winnings claimed successfully (if any)!");
        } catch (e) {
            console.error("Claim failed:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLiveBets();
        const interval = setInterval(fetchLiveBets, 2000); // Poll every 2s for live updates
        return () => clearInterval(interval);
    }, [fetchLiveBets]);

    return {
        liveBets,
        loading,
        placeBet,
        claimWinnings
    };
};