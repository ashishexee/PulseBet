import {
    Gift,
    Users,
    Trophy,
    Newspaper,
    MessageSquare,
    Handshake,
    ShieldCheck,
    Headphones,
    Globe,
    Pickaxe
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Sidebar = () => {
    const [activeTab, setActiveTab] = useState<'casino' | 'sports'>('casino');
    const location = useLocation();

    const navItems = [
        { icon: <Pickaxe size={16} />, label: 'Mines', path: '/games/mining' }, // Added Mines
        { icon: <Gift size={16} />, label: 'Promotions', hasDropdown: true },
        { icon: <Users size={16} />, label: 'Affiliate' },
        { icon: <Trophy size={16} />, label: 'VIP Club' },
        { icon: <Newspaper size={16} />, label: 'Blog' },
        { icon: <MessageSquare size={16} />, label: 'Forum' },
    ];

    const secondaryItems = [
        { icon: <Handshake size={16} />, label: 'Sponsorships', hasDropdown: true },
        { icon: <ShieldCheck size={16} />, label: 'Responsible Gambling' },
        { icon: <Headphones size={16} />, label: 'Live Support' },
        { icon: <Globe size={16} />, label: 'Language: English', hasDropdown: true },
    ];

    // Custom function to check active path
    const isActive = (path?: string) => path && location.pathname === path;

    return (
        <div className="w-[240px] h-full bg-[#0f212e] flex flex-col py-4 overflow-y-auto border-r border-[#213743] shrink-0">

            {/* Toggle Pills */}
            <div className="px-4 mb-6">
                <div className="bg-[#071724] p-1 rounded-full flex relative">
                    <button
                        onClick={() => setActiveTab('casino')}
                        className={`flex-1 py-2 rounded-full text-xs font-bold transition-all z-10 ${activeTab === 'casino' ? 'bg-[#00e701] text-[#014201] shadow-md' : 'text-[#b1b1b1] hover:text-white'}`}
                    >
                        Casino
                    </button>
                    <button
                        onClick={() => setActiveTab('sports')}
                        className={`flex-1 py-2 rounded-full text-xs font-bold transition-all z-10 ${activeTab === 'sports' ? 'bg-[#00e701] text-[#014201] shadow-md' : 'text-[#b1b1b1] hover:text-white'}`}
                    >
                        Sports
                    </button>
                </div>
            </div>

            <nav className="flex-1">
                <ul className="space-y-1">
                    {navItems.map((item, index) => (
                        <li key={index}>
                            <Link
                                to={item.path || '#'}
                                className={`flex items-center gap-3 px-6 py-3 transition-colors rounded-r-full mr-2 ${isActive(item.path) ? 'text-white bg-[#213743]' : 'text-[var(--text-secondary)] hover:text-white hover:bg-[#213743]'}`}
                            >
                                {item.icon}
                                <span className="font-semibold">{item.label}</span>
                                {item.hasDropdown && <span className="ml-auto text-[var(--text-secondary)] text-[10px] transform scale-x-150">▼</span>}
                            </Link>
                        </li>
                    ))}
                </ul>

                <div className="my-4 border-t border-[#2f4553] mx-6"></div>

                <ul className="space-y-1">
                    {secondaryItems.map((item, index) => (
                        <li key={index}>
                            <a href="#" className="flex items-center gap-3 px-6 py-3 text-[var(--text-secondary)] hover:text-white hover:bg-[#213743] transition-colors rounded-r-full mr-2">
                                {item.icon}
                                <span className="font-semibold">{item.label}</span>
                                {item.hasDropdown && <span className="ml-auto text-[var(--text-secondary)] text-[10px] transform scale-x-150">▼</span>}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
};
