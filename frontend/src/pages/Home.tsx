import { useNavigate } from "react-router-dom";
import { Pickaxe, Brain, Grid3x3, ChevronRight, Zap, Cpu, Activity, ExternalLink, Database, Palette, Type, Dices, Coins, LayoutGrid, CircleDot, Disc, Percent, ShieldCheck } from "lucide-react";

export const Home = () => {
    const navigate = useNavigate();
    const protocols = [
        {
            id: 'mines',
            title: 'Mines',
            description: 'Navigate the entropy field. High-stakes grid protocol.',
            icon: <Pickaxe className="w-6 h-6 text-white" />,
            path: '/games/mining',
            status: 'LIVE'
        },
        {
            id: 'dice',
            title: 'Dice',
            description: 'Adjust your win chance. Provably fair random number generation.',
            icon: <Dices className="w-6 h-6 text-white" />,
            path: '/games/dice',
            status: 'LIVE'
        },
        {
            id: 'coin-toss',
            title: 'Coin Toss',
            description: 'Heads or Tails. 50/50 Quantum probability matrix.',
            icon: <Coins className="w-6 h-6 text-white" />,
            path: '/games/coin-toss',
            status: 'LIVE'
        },
        {
            id: 'keno',
            title: 'Keno',
            description: 'Select your numbers. Match more to multiply your payout.',
            icon: <LayoutGrid className="w-6 h-6 text-white" />,
            path: '/games/keno',
            status: 'LIVE'
        },
        {
            id: 'plinko',
            title: 'Plinko',
            description: 'Pegboard probablity. Watch the ball fall through the pyramid.',
            icon: <CircleDot className="w-6 h-6 text-white" />,
            path: '/games/plinko',
            status: 'LIVE'
        },
        {
            id: 'wheel',
            title: 'Wheel',
            description: 'Spin the wheel of fortune. Multipliers up to 50x.',
            icon: <Disc className="w-6 h-6 text-white" />,
            path: '/games/wheel',
            status: 'LIVE'
        },
        {
            id: 'bingo',
            title: 'Bingo',
            description: '1v1 cross-chain battle. First to 5 lines wins the pot.',
            icon: <Grid3x3 className="w-6 h-6 text-white" />,
            path: '/games/bingo',
            status: 'LIVE'
        },
        {
            id: 'memory',
            title: 'Memory Protocol',
            description: 'Pattern recognition sequencing. Prove your cognitive recall.',
            icon: <Brain className="w-6 h-6 text-white" />,
            path: '/games/memory',
            status: 'LIVE'
        },
        {
            id: 'color-trading',
            title: 'Color Trading',
            description: 'Predict the winning color. High-speed probability market.',
            icon: <Palette className="w-6 h-6 text-white" />,
            path: '/games/color-trading',
            status: 'LIVE'
        },
        {
            id: 'wordle',
            title: 'Wordle',
            description: 'Decentralized linguistic decryption. Guess the 5-letter sequence.',
            icon: <Type className="w-6 h-6 text-white" />,
            path: '/games/wordle',
            status: 'LIVE'
        },
        {
            id: 'dots_and_boxes',
            title: 'Dots and Boxes',
            description: 'Decentralized grid conquest. Draw lines, complete boxes, outscore your opponent.',
            icon: <Grid3x3 className="w-6 h-6 text-white" />,
            path: '/games/dots-and-boxes',
            status: 'LIVE'
        }
    ];

    const features = [
        {
            title: "Fair & Verifiable",
            description: "Built on Linera microchains for transparent, tamper-proof gaming logic.",
            icon: <Activity className="w-5 h-5 text-zinc-400" />
        },
        {
            title: "PulseToken Native",
            description: "Earn and wager PulseToken (PT). The native utility asset of the ecosystem.",
            icon: <Cpu className="w-5 h-5 text-zinc-400" />
        },
        {
            title: "Instant Finality",
            description: "Real-time gameplay with zero latency, powered by Linera's parallel execution.",
            icon: <Zap className="w-5 h-5 text-zinc-400" />
        },
        {
            title: "0% Platform Fee",
            description: "Keep 100% of your winnings. No hidden costs or house edge on your rewards.",
            icon: <Percent className="w-5 h-5 text-zinc-400" />
        },
        {
            title: "No Middleman",
            description: "Direct P2P interaction via smart contracts. Trustless and permissionless.",
            icon: <ShieldCheck className="w-5 h-5 text-zinc-400" />
        }
    ];

    const contracts = [
        { label: "Pulse Token ID", value: import.meta.env.VITE_PULSE_TOKEN_APP_ID || "Not Configured" },
        { label: "Mines App ID", value: import.meta.env.VITE_MINES_APP_ID || "Not Configured" },
        { label: "Dice App ID", value: import.meta.env.VITE_DICE_APP_ID || "Not Configured" },
        { label: "Coin Toss App ID", value: import.meta.env.VITE_COIN_TOSS_APP_ID || "Not Configured" },
        { label: "Keno App ID", value: import.meta.env.VITE_KENO_APP_ID || "Not Configured" },
        { label: "Plinko App ID", value: import.meta.env.VITE_PLINKO_APP_ID || "Not Configured" },
        { label: "Wheel App ID", value: import.meta.env.VITE_WHEEL_APP_ID || "Not Configured" },
        { label: "Memory App ID", value: import.meta.env.VITE_MEMORY_GAME_APP_ID || "Not Configured" },
        { label: "Color Trading App ID", value: import.meta.env.VITE_COLOR_TRADING_APP_ID || "Not Configured" },
        { label: "Wordle App ID", value: import.meta.env.VITE_WORDLE_APP_ID || "Not Configured" },
        { label: "Bingo App ID", value: import.meta.env.VITE_BINGO_APP_ID || "Not Configured" },
    ];

    return (
        <div className="min-h-[calc(100vh-64px)] bg-zinc-950 font-sans selection:bg-white selection:text-black flex flex-col relative overflow-hidden">

            {/* Background Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none opacity-20">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px]"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px]"></div>
            </div>

            <div className="flex-1 flex flex-col justify-center px-6 md:px-12 py-12 max-w-[1400px] mx-auto w-full z-10">

                {/* Hero Content */}
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-10">
                        <div
                            onClick={() => navigate('/mining/faucets')}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-sm animate-fade-in-up cursor-pointer hover:bg-emerald-500/20 transition-colors"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-mono font-bold text-emerald-400 tracking-wider">
                                Mint PulseTokens for Here
                            </span>
                        </div>

                        <div className="space-y-">
                            <h1 className="flex items-center gap-4 md:gap-6 text-7xl md:text-9xl font-black tracking-tighter text-white animate-fade-in-up delay-100 leading-[0.85]">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500">PulseBet</span>
                                <img src="/assets/logo/logo_png.png" alt="PulseBet" className="w-16 h-16 md:w-32 md:h-32 object-contain" />
                            </h1>

                            <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl leading-relaxed animate-fade-in-up delay-200 font-light">
                                A Fully <strong className="text-white font-medium">Decentralized Betting Platform</strong> built on the Linera Layer-1 blockchain.
                                Wager <strong className="text-white font-medium">PulseTokens</strong> on <strong className="text-white font-medium">Games</strong> to earn rewards with instant finality.
                            </p>

                            <div className="flex flex-wrap gap-4 pt-4 animate-fade-in-up delay-300">
                                {features.map((feature, idx) => (
                                    <div key={idx} className="flex items-center gap-3 px-4 py-3 rounded-full bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm">
                                        {feature.icon}
                                        <span className="text-sm font-bold text-zinc-300">{feature.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-8 animate-fade-in-up delay-500">
                            <div className="flex items-center gap-2 text-zinc-500 text-sm font-mono uppercase tracking-widest mb-6">
                                <Activity className="w-4 h-4" /> Live Protocols
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
                                {protocols.map((protocol) => (
                                    <div
                                        key={protocol.id}
                                        onClick={() => navigate(protocol.path)}
                                        className="group cursor-pointer bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 transition-all flex items-center gap-4"
                                    >
                                        <div className="p-2 bg-zinc-950 rounded-lg group-hover:scale-110 transition-transform">
                                            {protocol.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white leading-none mb-1">{protocol.title}</h3>
                                            <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                                {protocol.status}
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-zinc-600 ml-auto group-hover:text-white group-hover:translate-x-1 transition-all" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Contract Details / Technical Specs */}
                    <div className="hidden lg:flex flex-col justify-center h-full min-h-[500px] animate-fade-in opacity-80 pl-12">
                        <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-800 p-8 w-full max-w-lg relative overflow-hidden group hover:border-zinc-700 transition-colors">
                            <div className="absolute top-0 right-0 p-24 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none"></div>

                            <div className="flex items-center gap-3 mb-6">
                                <Database className="w-5 h-5 text-zinc-400" />
                                <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">Protocol Specifications</h3>
                            </div>

                            <div className="space-y-4">
                                {contracts.map((contract, i) => (
                                    <div key={i} className="space-y-1">
                                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{contract.label}</div>
                                        <div className="font-mono text-[10px] md:text-xs text-zinc-400 break-all bg-zinc-950/50 p-2 rounded border border-zinc-900 hover:border-zinc-700 hover:text-white transition-colors cursor-text selection:bg-white selection:text-black">
                                            {contract.value}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-between items-center">
                                <div className="text-xs text-zinc-500">Network Status</div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    <span className="text-xs font-mono font-bold text-green-500">CONNECTED</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="absolute bottom-6 left-0 w-full px-12 flex justify-between items-end text-zinc-600 pointer-events-none">
                    <p className="text-xs font-mono max-w-xs">Built on Linera • Powered by PulseToken</p>
                    <a href="https://linera.io/developers" target="_blank" rel="noopener noreferrer" className="pointer-events-auto flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors">
                        DOCS <ExternalLink className="w-3 h-3" />
                    </a>
                </div>

            </div>
        </div>
    );
};
