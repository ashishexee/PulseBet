export interface GameEvent {
    sport: 'Cricket' | 'Football';
    matchId: number;
    matchTitle: string;
    event: {
        type: string;
        commentary: string;
    };
    score: string;
}

export class SportsFeed {
    private cricketMatch = {
        id: 101,
        teams: "India vs Australia",
        score: "182/4",
        over: 18.2,
    };

    private footballMatch = {
        id: 202,
        teams: "Liverpool vs Man City",
        score: "1-1",
        time: 88,
    };

    getLiveCricketEvent(): GameEvent {
        // Simulate over progression
        this.cricketMatch.over = parseFloat((this.cricketMatch.over + 0.1).toFixed(1));
        if (this.cricketMatch.over % 1 > 0.5) {
            this.cricketMatch.over = Math.ceil(this.cricketMatch.over);
        }

        const events = [
            { type: "normal", commentary: "Single taken to deep mid-wicket." },
            { type: "six", commentary: "HUGE HIT! Kohli smashes it over long-on for SIX!" },
            { type: "wicket", commentary: "OUT! Caught at the boundary! The batter has to go." },
            { type: "quiet", commentary: "Dot ball. Great bowling." },
        ];
        
        // Weighted random
        const rand = Math.random();
        const event = rand < 0.1 ? events[1] : rand < 0.2 ? events[2] : events[0];

        return {
            sport: 'Cricket',
            matchId: this.cricketMatch.id,
            matchTitle: this.cricketMatch.teams,
            event: event ? event : { type: 'unknown', commentary: 'No commentary' },
            score: `${this.cricketMatch.score} (${this.cricketMatch.over})`
        };
    }

    getLiveFootballEvent(): GameEvent {
        this.footballMatch.time += 1;
        
        const events = [
            { type: "corner", commentary: "Corner for Liverpool. Alexander-Arnold to take it." },
            { type: "foul", commentary: "Bad tackle! Referee reaches for his pocket..." },
            { type: "goal", commentary: "GOAAAL! What a finish!" },
            { type: "possession", commentary: "Man City passing it around the back." },
        ];

        const rand = Math.random();
        const event = rand < 0.2 ? events[0] : rand < 0.25 ? events[2] : events[3];

        return {
            sport: 'Football',
            matchId: this.footballMatch.id,
            matchTitle: this.footballMatch.teams,
            event: event ? event : { type: 'unknown', commentary: 'No commentary' },
            score: `${this.footballMatch.score} (${this.footballMatch.time}')`
        };
    }
}