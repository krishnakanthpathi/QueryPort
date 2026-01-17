
import React, { useEffect, useState } from 'react';
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

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');

    const fetchSkills = async () => {
        try {
            setLoading(true);
            // Fetch All Skills
            const allRes = await api.get('/skills');
            setSkills(allRes.data.skills);

            // Fetch My Skills
            if (user) {
                const myRes = await api.get('/skills/my-skills');
                setUserSkills(myRes.data.skills);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch skills');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSkills();
    }, [user]);

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
                        {user && (
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
                        )}

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

                {loading && skills.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">Loading skills...</div>
                ) : (
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
