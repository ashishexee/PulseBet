// oracle/src/index.ts
import { SportsFeed } from './mockFeed';
import type {GameEvent}  from './mockFeed';
import fetch from 'node-fetch'; // npm install node-fetch

// CONFIGURATION
const NODE_URL = "http://localhost:8080";
// You will get this ID after running: linera project publish-and-create sports
const SPORTS_APP_ID = "f04c0379a556f71b8f47d29790e0b62d3b1d9b30075c853db26d36933beac86a"; 
const CHAIN_ID = "8fd4233c5d03554f87d47a711cf70619727ca3d148353446cab81fb56922c9b7"; 

const feed = new SportsFeed();

interface BetProposal {
    question: string;
    odds: number;
    duration: number; // seconds
}

function generateAiBet(game: GameEvent): BetProposal | null {
    console.log(`\n[${game.sport}] ${game.score} - ${game.event.commentary}`);

    if (game.sport === 'Cricket') {
        if (game.event.type === 'six') {
            return {
                question: "Will there be another SIX in this over?",
                odds: 2.5,
                duration: 60
            };
        } else if (game.event.type === 'wicket') {
             return {
                question: "Will the next batter score a boundary?",
                odds: 1.8,
                duration: 120
            };
        }
    } else if (game.sport === 'Football') {
        if (game.event.type === 'corner') {
            return {
                question: "Will a GOAL be scored from this Corner?",
                odds: 3.8,
                duration: 45
            };
        }
    }
    return null;
}

async function sendToLinera(bet: BetProposal) {
    console.log(`⚡ [ORACLE] Generated Bet: "${bet.question}" (Odds: ${bet.odds}x)`);
    
    const query = `
        mutation {
            postLiveBet(question: "${bet.question}", odds: ${bet.odds}, duration: ${bet.duration})
        }
    `;

    // Wrapping for the specific app
    const payload = {
        query: `
            mutation {
                applications(chainId: "${CHAIN_ID}") {
                    application(id: "${SPORTS_APP_ID}") {
                        ${query}
                    }
                }
            }
        `
    };

    try {
    const response = await fetch(NODE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const text = await response.text(); // 👈 read raw response first

    if (!text) {
        console.log("✅ Bet submitted (empty response from node)");
        return;
    }

    let json;
    try {
        json = JSON.parse(text);
    } catch (err) {
        console.error("❌ Invalid JSON returned:", text);
        return;
    }

    if (json.errors?.length) {
        console.error("❌ Linera Error:", JSON.stringify(json.errors, null, 2));
    } else {
        console.log("✅ Bet successfully posted to blockchain!", json);
    }

} catch (e) {
    console.error("❌ Connection failed:", e.message);
}

}

async function main() {
    console.log("🔮 PulseBet Oracle (TypeScript) is running...");
    
    setInterval(async () => {
        // Randomly pick a sport
        const isCricket = Math.random() > 0.5;
        const event = isCricket ? feed.getLiveCricketEvent() : feed.getLiveFootballEvent();
        
        const bet = generateAiBet(event);
        if (bet) {
            await sendToLinera(bet);
        }
    }, 5000); // Check every 5 seconds
}

main();