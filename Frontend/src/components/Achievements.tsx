import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Calendar, Award, ExternalLink } from 'lucide-react';
import AchievementModal from './AchievementModal';
import type { Achievement } from '../types';

const Achievements: React.FC = () => {
    const { user } = useAuth();
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchAchievements = async () => {
        try {
            setLoading(true);
            const endpoint = activeTab === 'my' ? '/achievements/my-achievements' : '/achievements';
            const data = await api.get(`${endpoint}?page=${page}&limit=9`);
            setAchievements(data.data.achievements);
            setTotalPages(data.totalPages || 1);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch achievements');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAchievements();
    }, [activeTab, page]);

    useEffect(() => {
        setPage(1);
    }, [activeTab]);

    const openCreateModal = () => {
        setSelectedAchievement(null);
        setIsModalOpen(true);
    };

    const openEditModal = (achievement: Achievement) => {
        setSelectedAchievement(achievement);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        fetchAchievements();
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this achievement?")) return;

        try {
            await api.delete(`/achievements/id/${id}`);
            setAchievements(prev => prev.filter(a => a._id !== id));
        } catch (err: any) {
            alert(err.message || 'Failed to delete achievement');
        }
    };

    // Check if user is owner
    const isOwner = (achievement: Achievement) => {
        if (!user || !achievement.userId) return false;
        // userId can be object or string
        const ownerId = typeof achievement.userId === 'string' ? achievement.userId : achievement.userId._id;
        return ownerId === user._id || ownerId === user.id;
    };

    return (
        <div className="min-h-screen pt-32 pb-12 bg-black text-white relative overflow-hidden overflow-y-auto w-full px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                            Achievements
                        </h1>
                        <p className="text-gray-400 mt-2">Showcase your awards and certifications</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {user && (
                            <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                                <button
                                    onClick={() => setActiveTab('all')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'all'
                                        ? 'bg-white text-black shadow-lg'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setActiveTab('my')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'my'
                                        ? 'bg-white text-black shadow-lg'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    My Achievements
                                </button>
                            </div>
                        )}

                        {user && (
                            <button
                                onClick={openCreateModal}
                                className="bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all transform hover:scale-105 shadow-lg shadow-white/10"
                            >
                                <Plus size={20} />
                                <span className="hidden md:inline">Add Achievement</span>
                            </button>
                        )}
                    </div>
                </div>

                {error && <div className="text-red-500 text-center mb-4">{error}</div>}

                {loading && !isModalOpen && achievements.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">Loading achievements...</div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {achievements.map((achievement) => (
                                <div key={achievement._id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/30 transition-all duration-300 group hover:-translate-y-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-black/20 flex items-center justify-center">
                                                {achievement.image ? (
                                                    <img
                                                        src={achievement.image}
                                                        alt="Achievement"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Award className="text-yellow-500" size={24} />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg leading-tight truncate max-w-[150px]">{achievement.title}</h3>
                                                <p className="text-xs text-gray-400">
                                                    {achievement.organization}
                                                </p>
                                            </div>
                                        </div>
                                        {isOwner(achievement) && (
                                            <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEditModal(achievement)}
                                                    className="p-2 bg-white/10 rounded-lg hover:bg-white/20 text-white transition-colors"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(achievement._id!)}
                                                    className="p-2 bg-red-500/10 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-gray-300 text-sm mb-4 line-clamp-3 h-[60px]">
                                        {achievement.description}
                                    </p>

                                    <div className="border-t border-white/5 pt-4 flex justify-between items-center text-xs text-gray-500">
                                        <Link
                                            to={`/achievements/${achievement._id}`}
                                            className="flex items-center gap-1 text-white hover:text-blue-400 transition-colors"
                                        >
                                            <ExternalLink size={14} />
                                            View Details
                                        </Link>
                                        <div className="flex items-center gap-2 ml-auto">
                                            <Calendar size={12} />
                                            <span>{new Date(achievement.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex justify-center mt-8 gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 bg-white/10 rounded-lg disabled:opacity-50 hover:bg-white/20 transition-colors"
                                >
                                    Previous
                                </button>
                                <span className="px-4 py-2 text-gray-400">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 bg-white/10 rounded-lg disabled:opacity-50 hover:bg-white/20 transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <AchievementModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                achievement={selectedAchievement}
            />
        </div>
    );
};

export default Achievements;
