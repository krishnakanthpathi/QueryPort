import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { Profile as ProfileType, Project, Achievement, Certification } from '../types';
import { Edit2, MapPin, Save, X, Globe, FileText, Upload, Code, ExternalLink, Award, Heart } from 'lucide-react'; // Added icons
import { DEFAULT_AVATAR_URL } from '../constants';
import CodingHeatmaps from './CodingHeatmaps';
import { useParams, useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
    const { user } = useAuth();
    const { username } = useParams<{ username: string }>(); // Get username from URL
    const navigate = useNavigate();

    // Derived state for mode
    const isPublicView = !!username;
    // If viewing own public profile, we define it as "Public View" but maybe we want to allow edit?
    // For now, strict separation: /u/:username is READ ONLY. /profile is EDIT.

    const [profile, setProfile] = useState<ProfileType | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [certifications, setCertifications] = useState<Certification[]>([]);

    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');

    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        bio: '',
        title: '',
        locations: '',
        resume: '',
        avatar: '',
        socialLinks: [] as { platform: string; url: string }[],
        codingProfiles: {
            github: '',
            leetcode: '',
            codeforces: '',
            hackerrank: '',
            codechef: ''
        }
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Reset state on new fetch to avoid stale data during navigation
                setLoading(true);
                setError('');
                setProfile(null);
                setProjects([]);
                setAchievements([]);
                setCertifications([]);

                let data;

                if (isPublicView) {
                    // Public Profile Fetch
                    data = await api.get(`/profile/u/${username}`);
                    // The public endpoint returns { profile, projects, achievements, certifications}
                    setProjects(data.data.projects || []);
                    setAchievements(data.data.achievements || []);
                    setCertifications(data.data.certifications || []);
                } else {
                    // My Profile Fetch (Private)
                    data = await api.get('/profile/me');
                    // /me currently matches only profile (unless we update it too, but we kept it simple)
                    // We clear others to avoid stale state if switching users theoretically
                    setProjects([]);
                    setAchievements([]);
                    setCertifications([]);
                }

                setProfile(data.data.profile);

                // Initialize form data (Only needed if NOT public view or if we allow editing own public profile)
                if (!isPublicView && data.data.profile) {
                    const profileData = data.data.profile;
                    setFormData({
                        bio: profileData.bio || '',
                        title: profileData.title || '',
                        locations: profileData.locations || '',
                        resume: profileData.resume || '',
                        avatar: profileData.user?.avatar || user?.avatar || '',
                        socialLinks: profileData.socialLinks || [],
                        codingProfiles: {
                            github: profileData.codingProfiles?.github || '',
                            leetcode: profileData.codingProfiles?.leetcode || '',
                            codeforces: profileData.codingProfiles?.codeforces || '',
                            hackerrank: profileData.codingProfiles?.hackerrank || '',
                            codechef: profileData.codingProfiles?.codechef || ''
                        }
                    });
                }
            } catch (err: unknown) {
                if (err instanceof Error) {
                    // If 404 in public view, it's a real error (User not found)
                    if (isPublicView) {
                        // Backend now returns 200 with fallback profile if User exists but Profile doc missing.
                        // So 404 really means User Not Found now.
                        setError('User not found');
                    }
                    // If 404 in private view, it just means profile not created yet
                    else if (!err.message?.includes('404')) {
                        console.error('Error fetching profile:', err);
                    }
                }
                // Ensure avatar defaults to current user avatar if profile fetch fails or is 404 (only for private)
                if (!isPublicView) setFormData(prev => ({ ...prev, avatar: user?.avatar || '' }));
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user, username, isPublicView]);

    const handleSave = async () => {
        try {
            setLoading(true);

            const payload = new FormData();
            payload.append('bio', formData.bio);
            payload.append('title', formData.title);
            payload.append('locations', formData.locations);
            payload.append('resume', formData.resume);
            // payload.append('socialLinks', JSON.stringify(formData.socialLinks));
            // Backend expects socialLinks as array of objects in JSON body, 
            // but for FormData, complex objects need stringification or multiple fields.
            // My backend controller update handles `if (typeof socialLinks === 'string') JSON.parse`.
            payload.append('socialLinks', JSON.stringify(formData.socialLinks));
            payload.append('codingProfiles', JSON.stringify(formData.codingProfiles));

            if (avatarFile) {
                payload.append('avatar', avatarFile);
            } else {
                if (formData.avatar) payload.append('avatar', formData.avatar);
            }

            const responseData = await api.patch('/profile/me', payload);

            const updatedProfile = responseData.data.profile;
            setProfile(updatedProfile);

            // Sync user avatar if it was updated
            if (updatedProfile.user && updatedProfile.user.avatar) {
                // Update localStorage and reload to sync context
                localStorage.setItem('queryport_user', JSON.stringify(updatedProfile.user));
                window.location.reload();
            }

            setIsEditing(false);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (e: React.MouseEvent, projectId: string) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent card navigation

        if (!user) return; // Or trigger login

        // Optimistic Update
        const targetProjectIndex = projects.findIndex(p => p._id === projectId);
        if (targetProjectIndex === -1) return;

        const targetProject = projects[targetProjectIndex];
        const currentUserId = user?._id;
        if (!currentUserId) return;

        const isLiked = targetProject.likedBy?.includes(currentUserId);

        const newLikedBy = isLiked
            ? targetProject.likedBy?.filter(id => id !== currentUserId)
            : [...(targetProject.likedBy || []), currentUserId];

        const newLikes = isLiked
            ? (targetProject.likes || 0) - 1
            : (targetProject.likes || 0) + 1;

        const updatedProject = { ...targetProject, likedBy: newLikedBy, likes: newLikes };
        const newProjects = [...projects];
        newProjects[targetProjectIndex] = updatedProject;

        setProjects(newProjects);

        try {
            await api.post(`/projects/id/${projectId}/like`, {});
            // Background sync is not strictly necessary if optimistic worked, but could re-fetch
        } catch (error) {
            console.error("Failed to like project", error);
            // Revert on error
            setProjects(projects);
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
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-3"></div>
                Loading Profile...
            </div>
        );
    }

    if (error && isPublicView) {
        return (
            <div className="min-h-screen flex items-center justify-center text-red-400">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Error</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-white/10 rounded hover:bg-white/20 text-white">Go Home</button>
                </div>
            </div>
        )
    }

    // Determine what to show: parsed profile from DB (public) or form data (private/editing)
    const displayAvatar = isPublicView ? (profile?.user?.avatar || DEFAULT_AVATAR_URL) : (formData.avatar || user?.avatar || DEFAULT_AVATAR_URL);
    const displayName = isPublicView ? profile?.user?.name : user?.name;
    const displayUsername = isPublicView ? profile?.user?.username : (user ? user.username : 'username');
    const displayEmail = isPublicView ? profile?.user?.email : user?.email;

    return (
        <div className="min-h-screen flex justify-center pt-32 pb-12 bg-black text-white relative overflow-hidden overflow-y-auto w-full">
            {/* Background - Pure Black (Removed Blobs) */}

            <div className="w-full max-w-4xl relative z-10 px-4">
                {/* Header Section */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8 flex flex-col md:flex-row items-center md:items-start gap-8 shadow-2xl">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 shadow-lg">
                            <img
                                src={displayAvatar}
                                alt="Avatar"
                                className="w-full h-full object-cover transition-all duration-300"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = DEFAULT_AVATAR_URL;
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left w-full">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                            <div>
                                <h1 className="text-3xl font-bold">{displayName}</h1>
                                <p className="text-gray-400">@{displayUsername}</p>
                                <p className="text-gray-500 text-sm mt-1">{displayEmail}</p>
                            </div>
                            {!isEditing && !isPublicView && (
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
                                <h2 className="text-xl font-medium text-gray-200 mb-2">{profile?.title || (isPublicView ? "" : "No title set")}</h2>
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
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                const file = e.target.files[0];
                                                setAvatarFile(file);
                                                setFormData({ ...formData, avatar: URL.createObjectURL(file) });
                                            }
                                        }}
                                        className="hidden"
                                        id="avatar-upload"
                                    />
                                    <label
                                        htmlFor="avatar-upload"
                                        className="flex items-center justify-center gap-2 w-full bg-white/10 border border-white/20 rounded p-2 text-white hover:bg-white/20 cursor-pointer transition-colors"
                                    >
                                        <Upload size={18} />
                                        <span>Upload New Avatar</span>
                                    </label>
                                </div>
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
                                    {profile?.bio || (isPublicView ? "No bio added yet." : "Tell us about yourself...")}
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
                            <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl">
                                <h3 className="text-xl font-bold mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
                                    <Code size={20} /> Coding Profiles
                                </h3>
                                <div className="space-y-3">
                                    <input
                                        placeholder="GitHub Username"
                                        value={formData.codingProfiles.github}
                                        onChange={(e) => setFormData({ ...formData, codingProfiles: { ...formData.codingProfiles, github: e.target.value } })}
                                        className="w-full bg-black border border-white/20 rounded p-2 text-sm text-white focus:border-white focus:outline-none"
                                    />
                                    <input
                                        placeholder="LeetCode Username"
                                        value={formData.codingProfiles.leetcode}
                                        onChange={(e) => setFormData({ ...formData, codingProfiles: { ...formData.codingProfiles, leetcode: e.target.value } })}
                                        className="w-full bg-black border border-white/20 rounded p-2 text-sm text-white focus:border-white focus:outline-none"
                                    />
                                    <input
                                        placeholder="Codeforces Handle"
                                        value={formData.codingProfiles.codeforces}
                                        onChange={(e) => setFormData({ ...formData, codingProfiles: { ...formData.codingProfiles, codeforces: e.target.value } })}
                                        className="w-full bg-black border border-white/20 rounded p-2 text-sm text-white focus:border-white focus:outline-none"
                                    />
                                    <input
                                        placeholder="HackerRank Username"
                                        value={formData.codingProfiles.hackerrank}
                                        onChange={(e) => setFormData({ ...formData, codingProfiles: { ...formData.codingProfiles, hackerrank: e.target.value } })}
                                        className="w-full bg-black border border-white/20 rounded p-2 text-sm text-white focus:border-white focus:outline-none"
                                    />
                                    <input
                                        placeholder="CodeChef Username"
                                        value={formData.codingProfiles.codechef}
                                        onChange={(e) => setFormData({ ...formData, codingProfiles: { ...formData.codingProfiles, codechef: e.target.value } })}
                                        className="w-full bg-black border border-white/20 rounded p-2 text-sm text-white focus:border-white focus:outline-none"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">Enter your usernames to generate heatmaps and badges.</p>
                                </div>
                            </section>
                        )}

                        {isEditing && (
                            <div className="flex gap-4">
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className={`flex-1 bg-white hover:bg-gray-200 text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Save
                                        </>
                                    )}
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

                {!isEditing && (
                    <div className="w-full mt-8 space-y-12">
                        {/* Coding Heatmaps */}
                        <CodingHeatmaps profiles={profile?.codingProfiles || formData.codingProfiles} />

                        {/* Projects Section - Only Show in Public View or if we want it in private too (Plan said public) */}
                        {isPublicView && projects.length > 0 && (
                            <section>
                                <h3 className="text-2xl font-bold mb-6 border-b border-white/10 pb-2 flex items-center gap-2">
                                    <ExternalLink className="text-blue-400" /> Projects
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {projects.map((project) => (
                                        <div key={project._id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/30 transition-all group">
                                            <div className="h-40 overflow-hidden relative">
                                                <img
                                                    src={project.avatar || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000&auto=format&fit=crop"}
                                                    alt={project.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                                <div className="absolute top-3 right-3 z-10">
                                                    {(() => {
                                                        const currentUserId = user?._id;
                                                        const isLiked = currentUserId ? project.likedBy?.includes(currentUserId) : false;
                                                        return (
                                                            <button
                                                                onClick={(e) => handleLike(e, project._id!)}
                                                                className={`p-2 rounded-full backdrop-blur-md transition-all ${isLiked ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-black/30 text-white hover:bg-black/50 hover:text-red-400'}`}
                                                            >
                                                                <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                                                            </button>
                                                        );
                                                    })()}
                                                </div>
                                                <div className="absolute bottom-3 left-3 flex justify-between items-end w-[calc(100%-1.5rem)]">
                                                    <span className="text-xs font-mono bg-blue-500/20 text-blue-300 px-2 py-1 rounded border border-blue-500/30">
                                                        {project.category}
                                                    </span>
                                                    <div className="flex items-center gap-1 text-xs text-gray-300 font-medium bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
                                                        <Heart size={12} fill="currentColor" className="text-red-500" /> {project.likes || 0}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-5">
                                                <h4 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{project.title}</h4>
                                                <p className="text-gray-400 text-sm line-clamp-2 mb-4">{project.description}</p>
                                                {project.skills && (
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {project.skills.split(',').slice(0, 3).map((skill, i) => (
                                                            <span key={i} className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">{skill.trim()}</span>
                                                        ))}
                                                    </div>
                                                )}
                                                <a href={`/projects/${project._id}`} className="block w-full text-center py-2 bg-white/10 hover:bg-white/20 rounded text-sm transition-colors">
                                                    View Details
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Achievements Section */}
                        {isPublicView && achievements.length > 0 && (
                            <section>
                                <h3 className="text-2xl font-bold mb-6 border-b border-white/10 pb-2 flex items-center gap-2">
                                    <Award className="text-yellow-400" /> Achievements
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {achievements.map((ach) => (
                                        <div key={ach._id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-4">
                                            <div className="w-16 h-16 rounded-lg bg-black/50 p-2 border border-white/10 flex-shrink-0">
                                                <img src={ach.image} alt={ach.title} className="w-full h-full object-contain" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg">{ach.title}</h4>
                                                <p className="text-blue-300 text-sm mb-1">{ach.organization}</p>
                                                <p className="text-gray-400 text-sm line-clamp-2">{ach.description}</p>
                                                <p className="text-gray-500 text-xs mt-2">{new Date(ach.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Certifications Section */}
                        {isPublicView && certifications.length > 0 && (
                            <section>
                                <h3 className="text-2xl font-bold mb-6 border-b border-white/10 pb-2 flex items-center gap-2">
                                    <FileText className="text-green-400" /> Certifications
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {certifications.map((cert) => (
                                        <div key={cert._id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-12 h-12 rounded bg-white p-1">
                                                    <img src={cert.image} alt={cert.issuingOrganization} className="w-full h-full object-contain" />
                                                </div>
                                                {cert.credentialUrl && (
                                                    <a href={cert.credentialUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white">
                                                        <ExternalLink size={16} />
                                                    </a>
                                                )}
                                            </div>
                                            <h4 className="font-bold">{cert.name}</h4>
                                            <p className="text-sm text-gray-400">{cert.issuingOrganization}</p>
                                            <p className="text-xs text-gray-500 mt-2">Issued: {new Date(cert.issueDate).toLocaleDateString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
