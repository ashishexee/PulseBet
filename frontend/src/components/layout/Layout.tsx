import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        <div className="min-h-screen bg-zinc-950 selection:bg-white selection:text-black">
            <Header toggleSidebar={toggleSidebar} />
            <div className="flex">
                <aside
                    className={`sticky top-[60px] h-[calc(100vh-60px)] overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-[240px]' : 'w-[80px]'
                        }`}
                >
                    <Sidebar onClose={() => setSidebarOpen(false)} collapsed={!sidebarOpen} />
                </aside>
                <main className="flex-1 pt-16 overflow-x-hidden">
                    <div className="w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
