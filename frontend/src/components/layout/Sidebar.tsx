import {
    Pickaxe,
    Coins,
    Brain
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
    onClose?: () => void;
    collapsed?: boolean;
}

export const Sidebar = ({ onClose, collapsed = false }: SidebarProps) => {
    const location = useLocation();

    const navItems = [
        { icon: <Pickaxe size={20} />, label: 'Mines', path: '/games/mining' },
        { icon: <Coins size={20} />, label: 'Faucets', path: '/mining/faucets' },
        { icon: <Brain size={20} />, label: 'Memory', path: '/games/memory' }
    ];

    const isActive = (path?: string) => path && location.pathname === path;

    return (
        <div className={`h-full bg-zinc-900 flex flex-col py-6 border-r border-zinc-800 shrink-0 transition-all duration-300 w-full`}>



            <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-4'}`}>
                <ul className="space-y-2">
                    {navItems.map((item, index) => (
                        <li key={index}>
                            <Link
                                to={item.path || '#'}
                                onClick={onClose}
                                className={`flex items-center ${collapsed ? 'justify-center px-0' : 'px-4'} py-3 transition-all rounded-xl border group relative ${isActive(item.path) ? 'bg-zinc-800 border-zinc-700 text-white' : 'border-transparent text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}
                                title={collapsed ? item.label : ''}
                            >
                                <div className={`${isActive(item.path) ? 'text-white' : 'text-zinc-500 group-hover:text-white transition-colors'}`}>
                                    {item.icon}
                                </div>
                                {!collapsed && <span className="font-medium text-sm tracking-wide ml-3 animate-fade-in">{item.label}</span>}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
};
