import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Trophy, RefreshCw, ChevronLeft, ChevronRight, Download, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

interface LeaderboardUser {
    _id: string;
    type?: string;
    user: {
        _id: string;
        name: string;
        username: string;
        avatar: string;
    };
    stats: {
        totalLikes: number;
        leetcode?: { solved: number };
        codeforces?: { rating: number };
        hackerrank?: { badges: number };
        github?: { contributions: number };
        cgpa?: number;
    };
}

const Leaderboard: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [downloading, setDownloading] = useState(false);

    // Active sorts array for dynamic multi-column sorting
    const [activeSorts, setActiveSorts] = useState<{ key: string; order: 'asc' | 'desc' }[]>([{ key: 'likes', order: 'desc' }]);
    const [userTypeFilter, setUserTypeFilter] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1); // Reset to page 1 on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            // Construct sortBy string
            const sortParam = activeSorts.map(s => `${s.key}:${s.order}`).join(',');
            const data = await api.get(`/leaderboard?page=${page}&limit=10&sortBy=${sortParam}&type=${userTypeFilter}&search=${debouncedSearch}`);
            setUsers(data.data);
            setTotalPages(data.totalPages);
        } catch (error: any) {
            console.error('Failed to fetch leaderboard', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, [page, activeSorts, userTypeFilter, debouncedSearch]);

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const sortParam = activeSorts.map(s => `${s.key}:${s.order}`).join(',');
            const data = await api.get(`/leaderboard?limit=100&sortBy=${sortParam}&type=${userTypeFilter}&search=${debouncedSearch}`);
            const downloadUsers: LeaderboardUser[] = data.data;

            const headers = ['Rank', 'Name', 'Username', 'Type', 'Total Likes', 'CGPA', 'LC Solved', 'CF Rating', 'HR Badges'];
            const csvContent = [
                headers.join(','),
                ...downloadUsers.map((u, i) => [
                    i + 1,
                    `"${u.user.name}"`,
                    u.user.username,
                    u.type || 'N/A',
                    u.stats.totalLikes,
                    u.stats.cgpa || 0,
                    u.stats.leetcode?.solved || 0,
                    u.stats.codeforces?.rating || 0,
                    u.stats.hackerrank?.badges || 0
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `leaderboard_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Download failed', error);
            showToast('Failed to download leaderboard', 'error');
        } finally {
            setDownloading(false);
        }
    };

    const handleSync = async () => {
        if (!user) return;
        setSyncing(true);
        try {
            await api.post('/leaderboard/sync', {});
            showToast('Stats synced successfully!', 'success');
            fetchLeaderboard(); // Refresh data
        } catch (error: any) {
            console.error('Sync failed', error);
            showToast('Failed to sync stats. Try again later.', 'error');
        } finally {
            setSyncing(false);
        }
    };

    const getRankIcon = (index: number) => {
        const rank = (page - 1) * 10 + index + 1;
        if (rank === 1) return <Trophy className="text-yellow-500" size={24} />;
        if (rank === 2) return <Trophy className="text-gray-300" size={24} />;
        if (rank === 3) return <Trophy className="text-amber-700" size={24} />;
        return <span className="font-bold text-gray-500 w-6 text-center">{rank}</span>;
    };

    const getPrimaryStat = (u: LeaderboardUser, key: string) => {
        switch (key) {
            case 'leetcode':
                return { value: u.stats?.leetcode?.solved || 0, label: 'Solved' };
            case 'codeforces':
                return { value: u.stats?.codeforces?.rating || 0, label: 'Rating' };
            case 'hackerrank':
                return { value: u.stats?.hackerrank?.badges || 0, label: 'Badges' };
            case 'cgpa':
                return { value: u.stats?.cgpa || 0, label: 'CGPA' };
            case 'likes':
            default:
                return { value: u.stats?.totalLikes || 0, label: 'Likes' };
        }
    };

    const isSortedBy = (key: string) => activeSorts.some(s => s.key === key);

    return (
        <div className="min-h-screen pt-32 pb-12 bg-black text-white px-4 relative overflow-hidden overflow-y-auto w-full">
            <div className="max-w-5xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                            Leaderboard
                        </h1>
                        <p className="text-gray-400 mt-1">Top performers across the platform</p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-xl transition-colors disabled:opacity-50"
                        >
                            <Download size={16} className={downloading ? "animate-bounce" : ""} />
                            {downloading ? 'Exporting...' : 'Export CSV'}
                        </button>
                        {user && (
                            <button
                                onClick={handleSync}
                                disabled={syncing}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-xl transition-colors disabled:opacity-50"
                            >
                                <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
                                {syncing ? 'Syncing...' : 'Sync My Stats'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-end md:items-center">
                    <div className="flex flex-wrap gap-2 bg-white/5 p-1 rounded-xl backdrop-blur-md border border-white/10 w-fit">
                        {(['likes', 'leetcode', 'codeforces', 'hackerrank', 'cgpa'] as const).map((f) => {
                            const activeIndex = activeSorts.findIndex(s => s.key === f);
                            const isActive = activeIndex !== -1;
                            const sort = activeSorts[activeIndex];

                            return (
                                <button
                                    key={f}
                                    onClick={() => {
                                        setActiveSorts(prev => {
                                            const existingIndex = prev.findIndex(s => s.key === f);
                                            if (existingIndex !== -1) {
                                                // Toggle order if clicked again
                                                const newSorts = [...prev];
                                                newSorts[existingIndex] = { ...newSorts[existingIndex], order: newSorts[existingIndex].order === 'desc' ? 'asc' : 'desc' };
                                                return newSorts;
                                            } else {
                                                // Add to end
                                                return [...prev, { key: f, order: 'desc' }];
                                            }
                                        });
                                        setPage(1);
                                    }}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize flex items-center gap-1 ${isActive ? 'bg-white/10 text-white shadow-lg border border-white/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {f === 'cgpa' ? 'CGPA' : f}
                                    {isActive && (
                                        <div className="flex items-center gap-1 ml-1">
                                            <span className="text-xs font-bold bg-blue-500/20 px-1.5 rounded-full text-blue-300">{activeIndex + 1}</span>
                                            <span className="text-xs">{sort?.order === 'desc' ? '↓' : '↑'}</span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setActiveSorts([])}
                            className="px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                            Reset
                        </button>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 bg-white/5 p-1 px-3 rounded-xl backdrop-blur-md border border-white/10">
                            <Search size={16} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search user..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent text-white text-sm outline-none border-none p-1 w-32 md:w-48 placeholder-gray-600"
                            />
                        </div>

                        <div className="flex items-center gap-2 bg-white/5 p-1 px-3 rounded-xl backdrop-blur-md border border-white/10">
                            <span className="text-gray-400 text-sm">Type:</span>
                            <select
                                value={userTypeFilter}
                                onChange={(e) => { setUserTypeFilter(e.target.value); setPage(1); }}
                                className="bg-transparent text-white text-sm outline-none border-none p-1 cursor-pointer"
                            >
                                <option value="All" className="bg-black text-white">All</option>
                                <option value="Student" className="bg-black text-white">Student</option>
                                <option value="Professional" className="bg-black text-white">Professional</option>
                                <option value="Other" className="bg-black text-white">Other</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider">
                                        <th className="p-4 w-16 text-center">Rank</th>
                                        <th className="p-4">User</th>
                                        <th className="p-4 hidden md:table-cell">Type</th>
                                        <th className="p-4 text-right">
                                            {activeSorts.length > 0 ? activeSorts.map(s => s.key === 'cgpa' ? 'CGPA' : s.key).join(' > ') : 'Stats'}
                                        </th>
                                        <th className="p-4 text-right hidden md:table-cell">Other Stats</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {users.map((u, i) => {
                                        return (
                                            <tr key={u._id} className="hover:bg-white/5 transition-colors group border-b border-white/5 last:border-0 h-20">
                                                <td className="p-4 text-center">
                                                    <div className="flex justify-center items-center h-full">
                                                        {getRankIcon(i)}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <Link to={`/u/${u.user.username}`} className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
                                                            <img src={u.user.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"} alt={u.user.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-white group-hover:text-blue-400 transition-colors">{u.user.name}</div>
                                                            <div className="text-xs text-gray-500">@{u.user.username}</div>
                                                        </div>
                                                    </Link>
                                                </td>
                                                <td className="p-4 hidden md:table-cell">
                                                    <span className={`px-2 py-1 rounded text-xs border ${u.type === 'Student' ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-blue-500/30 text-blue-400 bg-blue-500/10'}`}>
                                                        {u.type || 'Student'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    {/* Display primary stat of the first sort key, or Likes default */}
                                                    <div className="font-bold text-xl text-white">
                                                        {activeSorts.length > 0
                                                            ? getPrimaryStat(u, activeSorts[0].key).value
                                                            : u.stats.totalLikes}
                                                    </div>
                                                    <div className="text-xs text-gray-500 capitalize">
                                                        {activeSorts.length > 0
                                                            ? getPrimaryStat(u, activeSorts[0].key).label
                                                            : 'Likes'}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right hidden md:table-cell">
                                                    <div className="flex justify-end gap-4 text-xs text-gray-400">
                                                        {!isSortedBy('likes') && (
                                                            <div className="flex flex-col items-end">
                                                                <span className="font-bold text-white">{u.stats?.totalLikes || 0}</span>
                                                                <span>Likes</span>
                                                            </div>
                                                        )}
                                                        {!isSortedBy('leetcode') && (
                                                            <div className="flex flex-col items-end">
                                                                <span className="font-bold text-white">{u.stats?.leetcode?.solved || 0}</span>
                                                                <span>LC Solved</span>
                                                            </div>
                                                        )}
                                                        {!isSortedBy('codeforces') && (
                                                            <div className="flex flex-col items-end">
                                                                <span className="font-bold text-white">{u.stats?.codeforces?.rating || 0}</span>
                                                                <span>CF Rating</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {users.length === 0 && (
                                <div className="p-12 text-center text-gray-500">
                                    No users found. Be the first to join the leaderboard!
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center mt-8 gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="px-4 py-2 bg-white/5 rounded-lg text-sm flex items-center text-gray-300">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
