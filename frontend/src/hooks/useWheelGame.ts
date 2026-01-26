import { useState, useCallback } from 'react';
import { useLineraWallet } from './useLineraWallet';
import { usePulseToken } from './usePulseToken';

const WHEEL_APP_ID = import.meta.env.VITE_WHEEL_APP_ID;

export const useWheelGame = () => {
    const { client, chainId, owner } = useLineraWallet();
    const [loading, setLoading] = useState(false);
    const { refreshBalance } = usePulseToken();

    const spinWheel = useCallback(async (betAmount: number): Promise<number | null> => {
        if (!client || !chainId || !owner) {
            console.error("Wallet not connected");
            return null;
        }

        if (!WHEEL_APP_ID) {
            console.error("WHEEL_APP_ID not found in environment variables");
            return null;
        }

        setLoading(true);
        try {
            // 1. Send Mutation
            const mutation = `mutation {
                spinWheel(amount: ${betAmount}, owner: "${owner}")
            }`;

            const chain = await client.chain(chainId);
            const app = await chain.application(WHEEL_APP_ID);

            const requestBody = JSON.stringify({ query: mutation });
            console.log("Spin Mutation:", requestBody);

            const responseJson = await app.query(requestBody, { owner });
            const result = JSON.parse(responseJson);
            console.log("Spin Mutation Result:", result);

            // 2. Query State for Result
            // We need to fetch the active game state to see where the wheel effectively landed.
            const queryState = `{
                activeGame {
                    resultSegment
                    multiplier
                    payout
                }
            }`;

            const stateRequestBody = JSON.stringify({ query: queryState });
            const stateResponseJson = await app.query(stateRequestBody);
            const stateResult = JSON.parse(stateResponseJson);
            console.log("Spin State Result:", stateResult);

            let segmentIndex = -1;
            if (stateResult?.data?.activeGame?.resultSegment !== undefined) {
                segmentIndex = stateResult.data.activeGame.resultSegment;
            }

            // Update balance immediately to reflect the transaction impact (atomic deduction + potential win)
            refreshBalance();

            return segmentIndex;

        } catch (error) {
            console.error("Spin Error:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [client, chainId, owner]);

    return {
        spinWheel,
        loading
    };
};
