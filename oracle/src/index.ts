import { SportsFeed } from './mockFeed.js';
import type { GameEvent } from './mockFeed.js';
import fetch from 'node-fetch'; 

// CONFIGURATION
const NODE_URL = "http://localhost:8080";
// You will get this ID after running: linera project publish-and-create sports
const SPORTS_APP_ID = "f04c0379a556f71b8f47d29790e0b62d3b1d9b30075c853db26d36933beac86a"; 
const CHAIN_ID = "8fd4233c5d03554f87d47a711cf70619727ca3d148353446cab81fb56922c9b7"; 
const feed = new SportsFeed();

// Construct the direct URL to the application on the specific chain
const APP_URL = `${NODE_URL}/chains/${CHAIN_ID}/applications/${SPORTS_APP_ID}`;

interface BetProposal {
    question: string;
    odds: number;
    duration: number; // seconds
    type: 'six' | 'wicket' | 'corner';
}

interface PendingBet {
    id: string;
    type: 'six' | 'wicket' | 'corner';
    expiry: number;
}

// Local memory to track active bets
let pendingBets: PendingBet[] = [];

function generateAiBet(game: GameEvent): BetProposal | null {
    console.log(`\n[${game.sport}] ${game.score} - ${game.event.commentary}`);

    if (game.sport === 'Cricket') {
        if (game.event.type === 'six') {
            return {
                question: "Will there be another SIX in this over?",
                odds: 250, // 2.5x
                duration: 60,
                type: 'six'
            };
        } else if (game.event.type === 'wicket') {
             return {
                question: "Will the next batter score a boundary?",
                odds: 180, // 1.8x
                duration: 120,
                type: 'wicket'
            };
        }
    } else if (game.sport === 'Football') {
        if (game.event.type === 'corner') {
            return {
                question: "Will a GOAL be scored from this Corner?",
                odds: 380, // 3.8x
                duration: 45,
                type: 'corner'
            };
        }
    }
    return null;
}

// Helper to get the ID of the bet we just created
async function getLatestBetId(): Promise<string | null> {
    const query = `
        query {
            getAllBets {
                id
            }
        }
    `;

    try {
        const response = await fetch(APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        const json = await response.json() as any;
        if (json.errors) {
            console.error("❌ GraphQL Query Error:", JSON.stringify(json.errors, null, 2));
        }
        
        // Correct path for direct app query
        const bets = json.data?.getAllBets;
        console.log("Fetched bets:", bets);
        
        if (bets && bets.length > 0) {
            // Return the ID of the last bet in the list
            return bets[bets.length - 1].id;
        }
    } catch (e) {
        console.error("Failed to fetch bet ID:", e);
    }
    return null;
}

async function sendToLinera(bet: BetProposal) {
    console.log(`⚡ [ORACLE] Generated Bet: "${bet.question}" (Odds: ${bet.odds}x)`);
    
    // Correct mutation syntax (single wrapper)
    const query = `
        mutation {
            postLiveBet(question: "${bet.question}", odds: ${bet.odds}, duration: ${bet.duration})
        }
    `;

    try {
        const response = await fetch(APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });

        const text = await response.text();
        if (!text) return;

        const json = JSON.parse(text);
        if (json.errors?.length) {
            console.error("❌ Linera Error:", JSON.stringify(json.errors, null, 2));
        } else {
            console.log("✅ Bet successfully posted to blockchain!");
            
            // Fetch the ID of the bet we just created to track it locally
            const id = await getLatestBetId();
            console.log("bet id - ",id);
            if (id) {
                pendingBets.push({
                    id,
                    type: bet.type,
                    expiry: Date.now() + (bet.duration * 1000)
                });
                console.log(`📝 Tracking Bet #${id} for resolution (Expires in ${bet.duration}s)`);
            }
        }

    } catch (e) {
        const errorMessage = (e as Error).message || String(e);
        console.error("❌ Connection failed:", errorMessage);
    }
}

async function resolveBetOnChain(betId: string, result: boolean) {
    console.log(`⚖️ [ORACLE] Resolving Bet #${betId} -> ${result ? "WIN" : "LOSS"}`);
    
    const query = `
        mutation {
            resolveBet(betId: ${betId}, result: ${result})
        }
    `;

    try {
        await fetch(APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        console.log(`✅ Resolution submitted for Bet #${betId}`);
    } catch (e) {
        console.error(`❌ Failed to resolve bet #${betId}:`, e);
    }
}

async function processPendingBets(latestEvent: GameEvent) {
    const now = Date.now();
    const remainingBets: PendingBet[] = [];

    for (const bet of pendingBets) {
        let resolved = false;
        let result = false;

        // 1. Check for Winning Condition based on Event Type
        if (bet.type === 'six' && latestEvent.event.type === 'six') {
            resolved = true;
            result = true;
        } else if (bet.type === 'wicket') {
             // Simplified logic: If a boundary happens, WIN.
             if (latestEvent.event.commentary.includes("Boundary") || latestEvent.event.type === 'six') {
                 resolved = true;
                 result = true;
             }
        } else if (bet.type === 'corner' && latestEvent.event.type === 'goal') {
            resolved = true;
            result = true;
        }

        // 2. Check for Expiry (Loss)
        // If time runs out and we haven't resolved as True yet, it's a Loss.
        if (!resolved && now > bet.expiry) {
            resolved = true;
            result = false; 
        }

        if (resolved) {
            await resolveBetOnChain(bet.id, result);
        } else {
            remainingBets.push(bet);
        }
    }

    // Update the list to only keep unresolved bets
    pendingBets = remainingBets;
}
async function debugSchema() {
    console.log("🕵️ Inspecting Blockchain Schema...");
    const query = `
        query {
            __schema {
                queryType {
                    fields {
                        name
                    }
                }
            }
        }
    `;

    try {
        const response = await fetch(APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        
        // Print the RAW text first in case it's an error page
        const text = await response.text(); 
        console.log("📜 Raw Response:", text);

        const json = JSON.parse(text);
        const fields = json.data?.__schema?.queryType?.fields;
        
        console.log("✅ AVAILABLE QUERIES:", JSON.stringify(fields, null, 2));
    } catch (e) {
        console.error("❌ Inspection failed:", e);
    }
}


async function main() {
    console.log("🔮 PulseBet Oracle (TypeScript) is running...");
    // Call this at the start of your main()
debugSchema();
    
    setInterval(async () => {
        // Randomly pick a sport
        const isCricket = Math.random() > 0.5;
        const event = isCricket ? feed.getLiveCricketEvent() : feed.getLiveFootballEvent();
        
        // 1. Check if we should RESOLVE existing bets based on this new event
        await processPendingBets(event);

        // 2. Check if we should create a NEW bet
        // Only create if we don't have too many pending to avoid spamming for demo
        if (pendingBets.length < 3) {
            const bet = generateAiBet(event);
            if(bet) {
await sendToLinera(bet);
}
}
}, 5000); 
}
main();