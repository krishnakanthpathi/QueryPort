import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { Profile as ProfileType } from '../types';
import { Edit2, MapPin, Save, X, Globe, FileText } from 'lucide-react';
import { DEFAULT_AVATAR_URL } from '../constants';

const Profile: React.FC = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<ProfileType | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        bio: '',
        title: '',
        locations: '',
        resume: '',
        avatar: '',
        socialLinks: [] as { platform: string; url: string }[],
    });

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await api.get('/profile/me');
            setProfile(data.data.profile);

            // Initialize form data
            if (data.data.profile) {
                setFormData({
                    bio: data.data.profile.bio || '',
                    title: data.data.profile.title || '',
                    locations: data.data.profile.locations || '',
                    resume: data.data.profile.resume || '',
                    avatar: user?.avatar || '',
                    socialLinks: data.data.profile.socialLinks || [],
                });
            }
        } catch (err: any) {
            // If 404, it just means no profile created yet, but we should still enable editing for user fields if we want?
            // Actually, if 404, we might not have a profile doc, but we have a user doc.
            // For now, if 404, we leave defaults.
            if (!err.message?.includes('404')) {
                console.error('Error fetching profile:', err);
            }
            // Ensure avatar defaults to current user avatar if profile fetch fails or is 404
            setFormData(prev => ({ ...prev, avatar: user?.avatar || '' }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleSave = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('talentlayer_token');
            const response = await fetch('http://localhost:8888/api/v1/profile/me', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(formData),
            });

            const responseData = await response.json();
            if (!response.ok) throw new Error(responseData.message);

            const updatedProfile = responseData.data.profile;
            setProfile(updatedProfile);

            // Sync user avatar if it was updated
            if (formData.avatar) {
                // We re-fetch or manually update the user context
                // Since the profile response populates user, we can try to use that, 
                // but simpler to just mix the new avatar into the existing user object for immediate UI feedback.
                // Ideally, we should use the user object returned from the backend, but let's see what we have.
                // responseData.data.profile.user contains the updated user doc.
                if (updatedProfile.user && updatedProfile.user.avatar) {
                    // Accessing context to update user
                    // We need to trigger a stored user update. 
                    // AuthContext doesn't expose a 'updateUser' method, but 'setUser' is internal.
                    // We can reload the window or better yet, just let the user know.
                    // Actually, to update the Navbar, we MUST update the context.
                    // Let's modify the local storage and force a reload? No, that's bad UX.
                    // I will just rely on the fact that I can't easily update context without a dedicated method 
                    // unless I expose setUser from context (which I didn't). 
                    // Wait, I can just reload the page for now or...
                    // Better: I will reload the page to ensure fresh state, OR I assume the user won't notice until next login?
                    // No, "able change the avatar" implies immediate feedback.
                    // I will add a window.location.reload() for now as a crude but effective way to sync context, 
                    // OR I can use the existing 'user' object and 'setUser' if I had it. 
                    // I'll accept that the Navbar might not update until refresh unless I implement a context update.
                    // Let's just do a window.reload() after a short toast for now, or just let it be.
                    // Update: I will check if I can modify AuthContext to expose setUser or similar?
                    // Actually, I can just update localStorage and trigger a window reload.
                    localStorage.setItem('talentlayer_user', JSON.stringify(updatedProfile.user));
                    window.location.reload();
                }
            }

            setIsEditing(false);
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    // Helper to manage social links in form
    const updateSocialLink = (index: number, key: 'platform' | 'url', value: string) => {
        const newLinks = [...formData.socialLinks];
        newLinks[index] = { ...newLinks[index], [key]: value };
        setFormData({ ...formData, socialLinks: newLinks });
    };

    const addSocialLink = () => {
        setFormData({ ...formData, socialLinks: [...formData.socialLinks, { platform: 'twitter', url: '' }] });
    };

    const removeSocialLink = (index: number) => {
        const newLinks = [...formData.socialLinks];
        newLinks.splice(index, 1);
        setFormData({ ...formData, socialLinks: newLinks });
    };

    if (loading && !profile && !isEditing) {
        return <div className="min-h-screen pt-24 text-center text-white">Loading profile...</div>;
    }

    return (
        <div className="min-h-screen flex justify-center pt-32 pb-12 bg-black text-white relative overflow-hidden overflow-y-auto w-full">
            {/* Background - Pure Black (Removed Blobs) */}

            <div className="w-full max-w-4xl relative z-10 px-4">
                {/* Header Section */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8 flex flex-col md:flex-row items-center md:items-start gap-8 shadow-2xl">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 shadow-lg">
                            <img
                                src={formData.avatar || user?.avatar || DEFAULT_AVATAR_URL}
                                alt="Avatar"
                                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300"
                            />
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left w-full">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                            <div>
                                <h1 className="text-3xl font-bold">{user?.name}</h1>
                                <p className="text-gray-400">@{user ? (user as any).username : 'username'}</p>
                            </div>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="mt-4 md:mt-0 flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors font-medium"
                                >
                                    <Edit2 size={18} />
                                    <span>Edit Profile</span>
                                </button>
                            )}
                        </div>

                        {!isEditing ? (
                            <>
                                <h2 className="text-xl font-medium text-gray-200 mb-2">{profile?.title || "No title set"}</h2>
                                <div className="flex items-center justify-center md:justify-start gap-2 text-gray-400 mb-6">
                                    <MapPin size={16} />
                                    <span>{profile?.locations || "No location set"}</span>
                                </div>
                                {profile?.resume && (
                                    <div className="flex items-center justify-center md:justify-start gap-2 text-gray-400 mb-2">
                                        <a href={profile.resume} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                                            <FileText size={16} />
                                            <span className="underline decoration-dotted">View Resume</span>
                                        </a>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="space-y-4 w-full">
                                <input
                                    type="text"
                                    placeholder="Avatar URL"
                                    value={formData.avatar}
                                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                                    className="w-full bg-black border border-white/20 rounded p-2 text-white focus:border-white focus:outline-none transition-colors"
                                />
                                <input
                                    type="text"
                                    placeholder="Professional Title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-black border border-white/20 rounded p-2 text-white focus:border-white focus:outline-none transition-colors"
                                />
                                <input
                                    type="text"
                                    placeholder="Location (e.g. New York, Remote)"
                                    value={formData.locations}
                                    onChange={(e) => setFormData({ ...formData, locations: e.target.value })}
                                    className="w-full bg-black border border-white/20 rounded p-2 text-white focus:border-white focus:outline-none transition-colors"
                                />
                                <input
                                    type="text"
                                    placeholder="Resume URL (e.g. Google Drive Link)"
                                    value={formData.resume}
                                    onChange={(e) => setFormData({ ...formData, resume: e.target.value })}
                                    className="w-full bg-black border border-white/20 rounded p-2 text-white focus:border-white focus:outline-none transition-colors"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Main Info */}
                    <div className="md:col-span-2 space-y-8">
                        <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl">
                            <h3 className="text-xl font-bold mb-4 border-b border-white/10 pb-2">About Me</h3>
                            {!isEditing ? (
                                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {profile?.bio || "Tell us about yourself..."}
                                </p>
                            ) : (
                                <textarea
                                    rows={6}
                                    placeholder="Write a short bio..."
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-white focus:outline-none transition-colors"
                                />
                            )}
                        </section>
                    </div>

                    {/* Sidebar */}
                    <div className="md:col-span-1 space-y-8">
                        <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl">
                            <h3 className="text-xl font-bold mb-4 border-b border-white/10 pb-2">Connect</h3>
                            <div className="space-y-4">
                                {!isEditing ? (
                                    profile?.socialLinks && profile.socialLinks.length > 0 ? (
                                        profile.socialLinks.map((link, i) => (
                                            <a
                                                key={i}
                                                href={link.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors bg-white/5 p-3 rounded-lg border border-white/5 hover:border-white/30"
                                            >
                                                <Globe size={18} />
                                                <span className="truncate">{link.platform}</span>
                                            </a>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 italic">No social links added.</p>
                                    )
                                ) : (
                                    <div className="space-y-3">
                                        {formData.socialLinks.map((link, i) => (
                                            <div key={i} className="flex gap-2">
                                                <input
                                                    placeholder="Platform"
                                                    value={link.platform}
                                                    onChange={(e) => updateSocialLink(i, 'platform', e.target.value)}
                                                    className="w-1/3 bg-black border border-white/20 rounded p-2 text-sm text-white focus:border-white focus:outline-none"
                                                />
                                                <input
                                                    placeholder="URL"
                                                    value={link.url}
                                                    onChange={(e) => updateSocialLink(i, 'url', e.target.value)}
                                                    className="w-full bg-black border border-white/20 rounded p-2 text-sm text-white focus:border-white focus:outline-none"
                                                />
                                                <button onClick={() => removeSocialLink(i)} className="text-gray-500 hover:text-white transition-colors">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={addSocialLink}
                                            className="w-full mt-2 py-2 text-sm border border-dashed border-gray-600 text-gray-400 rounded hover:border-white hover:text-white transition-colors"
                                        >
                                            + Add Social Link
                                        </button>
                                    </div>
                                )}
                            </div>
                        </section>

                        {isEditing && (
                            <div className="flex gap-4">
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="flex-1 bg-white hover:bg-gray-200 text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg"
                                >
                                    <Save size={18} />
                                    Save
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="flex-1 bg-transparent border border-white/20 hover:bg-white/10 text-white font-bold py-3 rounded-lg transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                        {error && (
                            <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
