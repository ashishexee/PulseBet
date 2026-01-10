import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const hasOpenedOnce = localStorage.getItem('sidebar_auto_opened');
        if (location.pathname === '/' && !hasOpenedOnce) {
            setSidebarOpen(true);
            localStorage.setItem('sidebar_auto_opened', 'true');
        }
    }, [location.pathname]);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        <div className="min-h-screen bg-zinc-950 selection:bg-white selection:text-black">
            <Header toggleSidebar={toggleSidebar} />
            <div className="relative">
                <aside
                    className={`fixed top-16 left-0 h-[calc(100vh-4rem)] z-[49] overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-[240px]' : 'w-[80px]'
                        }`}
                >
                    <Sidebar onClose={() => setSidebarOpen(false)} collapsed={!sidebarOpen} />
                </aside>
                <main className={`flex-1 pt-16 transition-all duration-300 ease-in-out overflow-x-hidden min-h-screen ${sidebarOpen ? 'ml-[240px]' : 'ml-[80px]'}`}>
                    <div className="w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
