
import { NavLink, Outlet } from 'react-router-dom';

const DocsLayout = () => {
    const links = [
        { to: '/docs', label: 'Introduction', end: true },
        { to: '/docs/profile', label: 'User Profile' },
        { to: '/docs/projects', label: 'Projects' },
        { to: '/docs/achievements', label: 'Achievements' },
        { to: '/docs/leaderboard', label: 'Leaderboard' },
    ];

    return (
        <div className="min-h-screen bg-black text-white pt-32 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <aside className="w-full md:w-64 flex-shrink-0">
                    <div className="sticky top-24 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <h2 className="text-xl font-bold mb-6 text-white">
                            API Reference
                        </h2>
                        <nav className="flex flex-col space-y-2">
                            {links.map((link) => (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    end={link.end}
                                    className={({ isActive }) =>
                                        `px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${isActive
                                            ? 'bg-white/10 text-white border border-white/20'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`
                                    }
                                >
                                    {link.label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Content */}
                <main className="flex-1 min-w-0">
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm min-h-[500px]">
                        <div className="prose prose-invert max-w-none">
                            <Outlet />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DocsLayout;
