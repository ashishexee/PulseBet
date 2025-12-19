import { Menu, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
    toggleSidebar: () => void;
}

export const Header = ({ toggleSidebar }: HeaderProps) => {
    return (
        <header className="h-[60px] flex items-center justify-between px-4 bg-[var(--bg-darker)] shadow-md sticky top-0 z-50 border-b border-[#213743]">
            {/* Left Section: Menu + Logo */}
            <div className="flex items-center gap-4">
                <button onClick={toggleSidebar} className="text-[var(--text-secondary)] hover:text-white transition-colors">
                    <Menu size={20} />
                </button>
                <div className="flex items-center gap-2">
                    <Link to="/">
                        <span className="text-2xl font-bold italic tracking-tight text-white select-none cursor-pointer">PulseBet</span>
                    </Link>
                </div>
            </div>

            {/* Right Section: Connect Wallet */}
            <div className="flex items-center gap-3">
                <button className="bg-[var(--primary-blue)] text-white px-4 py-2 rounded-[4px] font-semibold hover:bg-[var(--primary-blue-hover)] transition-colors text-sm shadow-[0_4px_14px_0_rgb(0,118,255,0.39)] flex items-center gap-2">
                    <Wallet size={16} />
                    Connect Wallet
                </button>
            </div>
        </header>
    );
};
