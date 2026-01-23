
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Check } from 'lucide-react';
import SkillModal from './SkillModal';
import type { Skill } from '../types';

const Skills: React.FC = () => {
    const { user } = useAuth();
    const [skills, setSkills] = useState<Skill[]>([]);
    const [userSkills, setUserSkills] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Redirect if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            // We can either redirect or just show the login prompt. 
            // Since we removed it from public nav, users shouldn't really be here unless they direct link.
            // The existing "My Skills" logic handles !user by showing login prompt.
            // But if "All" is selected (which is default if we didn't change it, but we did change it to default 'my' if user exists, else 'all').
            // Wait, if no user, activeTab defaults to 'all'.
            // We want to force login.
            // So if !user, we can't view ANYTHING.
        }
    }, [user, loading]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'my' | 'all'>(user ? 'my' : 'all');

    useEffect(() => {
        if (user) {
            setActiveTab('my');
        } else {
            setActiveTab('all');
        }
    }, [user]);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchSkills = async () => {
        try {
            setLoading(true);

            if (activeTab === 'my' && !user) {
                setUserSkills([]);
                setLoading(false);
                return;
            }

            // Fetch All Skills
            if (activeTab === 'all') {
                const allRes = await api.get(`/skills?page=${page}&limit=12`);
                setSkills(allRes.data.skills);
                setTotalPages(allRes.totalPages || 1);
            }

            // Fetch My Skills
            if (user) {
                const myRes = await api.get('/skills/my-skills');
                setUserSkills(myRes.data.skills);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to fetch skills');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSkills();
    }, [user, activeTab, page]);

    useEffect(() => {
        setPage(1);
    }, [activeTab]);

    const handleSave = () => {
        fetchSkills();
    };

    const handleAddToProfile = async (skillId: string) => {
        try {
            await api.post('/skills/add-to-profile', { skillId });
            // Refresh to update "My Skills" list and UI state
            fetchSkills();
        } catch (err: any) {
            alert(err.message || 'Failed to add skill');
        }
    };

    const handleRemoveFromProfile = async (skillId: string) => {
        if (!window.confirm("Remove this skill from your profile?")) return;
        try {
            await api.delete(`/skills/remove-from-profile/${skillId}`);
            // Optimistic update or refresh
            setUserSkills(prev => prev.filter(s => s._id !== skillId));
        } catch (err: any) {
            alert(err.message || 'Failed to remove skill');
        }
    };

    const isOwned = (skillId: string) => {
        return userSkills.some(s => s._id === skillId);
    };

    const displayedSkills = activeTab === 'my' ? userSkills : skills;

    return (
        <div className="min-h-screen pt-32 pb-12 bg-black text-white relative overflow-hidden overflow-y-auto w-full px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                            Skills
                        </h1>
                        <p className="text-gray-400 mt-2"> showcase your technical expertise</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                            <button
                                onClick={() => setActiveTab('my')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'my'
                                    ? 'bg-white text-black shadow-lg'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                My Skills
                            </button>
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'all'
                                    ? 'bg-white text-black shadow-lg'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                All Skills
                            </button>
                        </div>

                        {user && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all transform hover:scale-105 shadow-lg shadow-white/10"
                            >
                                <Plus size={20} />
                                <span className="hidden md:inline">Add Skill</span>
                            </button>
                        )}
                    </div>
                </div>

                {error && <div className="text-red-500 text-center mb-4">{error}</div>}

                {!user ? (
                    <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                        <h3 className="text-xl font-bold mb-2">Login to view skills</h3>
                        <p className="text-gray-400 mb-6">This feature is only available to registered users.</p>
                        <Link to="/login" className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors">
                            Sign In / Register
                        </Link>
                    </div>
                ) : null}

                {user && (
                    <>
                        {loading ? (
                            <div className="min-h-[50vh] flex flex-col items-center justify-center text-white">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-4"></div>
                                <p className="text-gray-400 animate-pulse">Loading skills...</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {displayedSkills.map((skill) => (
                                        <div key={skill._id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/30 transition-all duration-300 group hover:-translate-y-1 flex flex-col items-center text-center relative">
                                            <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 bg-black/20 flex items-center justify-center mb-4 p-2">
                                                <img
                                                    src={skill.image}
                                                    alt={skill.name}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                            <h3 className="font-bold text-lg leading-tight mb-2">{skill.name}</h3>

                                            {activeTab === 'all' && (
                                                <div className="mt-2">
                                                    {isOwned(skill._id) ? (
                                                        <span className="text-green-400 text-xs flex items-center gap-1 bg-green-400/10 px-2 py-1 rounded-full">
                                                            <Check size={12} /> Added
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleAddToProfile(skill._id)}
                                                            className="text-white text-xs flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors"
                                                        >
                                                            <Plus size={12} /> Add to Profile
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {activeTab === 'my' && (
                                                <button
                                                    onClick={() => handleRemoveFromProfile(skill._id)}
                                                    className="absolute top-4 right-4 p-2 bg-red-500/10 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Remove from profile"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {displayedSkills.length === 0 && (
                                        <div className="col-span-full text-center py-20 text-gray-500">
                                            {activeTab === 'my'
                                                ? "You haven't added any skills yet. Switch to 'All Skills' or add a new one!"
                                                : "No skills found. Be the first to create one!"}
                                        </div>
                                    )}
                                </div>

                                {activeTab === 'all' && totalPages > 1 && (
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
                    </>
                )}
            </div>

            <SkillModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
            />
        </div>
    );
};

export default Skills;
