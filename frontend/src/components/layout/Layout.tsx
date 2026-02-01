import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Toaster } from 'sonner';

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
                    <div className="flex-1 overflow-y-auto overflow-x-hidden pt-20 lg:pt-0 pb-20 lg:pb-0 scrollbar-hide">
                        {children}
                        <Toaster position="bottom-center" theme="dark" invert richColors />
                    </div>
                </main>
            </div>
        </div>
    );
};
