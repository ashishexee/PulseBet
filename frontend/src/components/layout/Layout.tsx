import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        <div className="min-h-screen bg-[var(--bg-dark)]">
            <Header toggleSidebar={toggleSidebar} />
            <div className="flex">
                <aside
                    className={`sticky top-[60px] h-[calc(100vh-60px)] overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-[240px] opacity-100' : 'w-0 opacity-0'
                        }`}
                >
                    <Sidebar />
                </aside>
                <main className="flex-1 p-6 pt-20 overflow-x-hidden">
                    <div className="max-w-[1200px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
