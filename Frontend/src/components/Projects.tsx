import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Globe, Calendar, X, Save, Folder } from 'lucide-react';
import { DEFAULT_AVATAR_URL } from '../constants';

// Define Project Type locally since we couldn't find the central types file
interface Project {
    _id: string;
    userId: {
        _id: string;
        name: string;
        username: string;
        avatar: string;
    } | string; // It might be populated or just ID
    title: string;
    description: string;
    status: 'draft' | 'published';
    category?: 'personal' | 'professional' | 'others';
    links?: string[];
    tags?: string[];
    tagline?: string;
    skills?: string;
    images?: string[];
    avatar?: string;
    startDate?: string; // Date string
    endDate?: string; // Date string
    budget?: number;
    contributors?: string[];
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    createdAt: string;
    updatedAt: string;
}

const Projects: React.FC = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        tagline: '',
        skills: '',
        status: 'published',
        category: 'personal',
        links: [] as string[],
        tags: [] as string[],
        images: [] as string[],
        avatar: '',
        startDate: '',
        endDate: '',
        budget: 0,
        contributors: [] as string[],
    });
    const [newLink, setNewLink] = useState('');
    const [newTag, setNewTag] = useState('');
    const [newImage, setNewImage] = useState('');
    const [newContributor, setNewContributor] = useState('');

    const fetchProjects = async () => {
        try {
            setLoading(true);
            // Default to fetching all projects
            const data = await api.get('/projects');
            setProjects(data.data.projects);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            tagline: '',
            skills: '',
            status: 'published',
            category: 'personal',
            links: [],
            tags: [],
            images: [],
            avatar: '',
            startDate: '',
            endDate: '',
            budget: 0,
            contributors: [],
        });
        setNewLink('');
        setNewTag('');
        setNewImage('');
        setNewContributor('');
        setIsEditing(false);
        setCurrentProjectId(null);
    };

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (project: Project) => {
        setFormData({
            title: project.title,
            description: project.description,
            tagline: project.tagline || '',
            skills: project.skills || '',
            status: project.status as string,
            category: project.category || 'personal',
            links: project.links || [],
            tags: project.tags || [],
            images: project.images || [],
            avatar: project.avatar || '',
            startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
            endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
            budget: project.budget || 0,
            contributors: project.contributors || [],
        });
        setIsEditing(true);
        setCurrentProjectId(project._id);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            if (isEditing && currentProjectId) {
                // Update
                const res = await api.patch(`/projects/id/${currentProjectId}`, formData);
                setProjects(prev => prev.map(p => p._id === currentProjectId ? res.data.project : p));
            } else {
                // Create
                const res = await api.post('/projects', formData);
                // Add to start of list
                setProjects(prev => [res.data.project, ...prev]);
            }
            setIsModalOpen(false);
            resetForm();
        } catch (err: any) {
            setError(err.message || 'Failed to save project');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (projectId: string) => {
        if (!window.confirm("Are you sure you want to delete this project?")) return;

        try {
            await api.delete(`/projects/id/${projectId}`);
            setProjects(prev => prev.filter(p => p._id !== projectId));
        } catch (err: any) {
            alert(err.message || 'Failed to delete project');
        }
    };

    // Helper to manage arrays in form
    const addLink = () => {
        if (newLink && !formData.links.includes(newLink)) {
            setFormData({ ...formData, links: [...formData.links, newLink] });
            setNewLink('');
        }
    };
    const removeLink = (link: string) => {
        setFormData({ ...formData, links: formData.links.filter(l => l !== link) });
    };

    const addTag = () => {
        if (newTag && !formData.tags.includes(newTag)) {
            setFormData({ ...formData, tags: [...formData.tags, newTag] });
            setNewTag('');
        }
    };
    const removeTag = (tag: string) => {
        setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
    };

    const addImage = () => {
        if (newImage && !formData.images.includes(newImage)) {
            setFormData({ ...formData, images: [...formData.images, newImage] });
            setNewImage('');
        }
    };
    const removeImage = (img: string) => {
        setFormData({ ...formData, images: formData.images.filter(i => i !== img) });
    };

    const addContributor = () => {
        if (newContributor && !formData.contributors.includes(newContributor)) {
            setFormData({ ...formData, contributors: [...formData.contributors, newContributor] });
            setNewContributor('');
        }
    };
    const removeContributor = (contributor: string) => {
        setFormData({ ...formData, contributors: formData.contributors.filter(c => c !== contributor) });
    };

    // Check if user is owner safely
    const isOwner = (project: Project) => {
        if (!user || !project.userId) return false;
        // userId can be object or string
        const projectUserId = typeof project.userId === 'string' ? project.userId : project.userId._id;
        return projectUserId === user._id || projectUserId === user.id; // user object usually has _id but sometimes id field
    };

    return (
        <div className="min-h-screen pt-32 pb-12 bg-black text-white relative overflow-hidden overflow-y-auto w-full px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                            Projects
                        </h1>
                        <p className="text-gray-400 mt-2">Discover what others are building</p>
                    </div>
                    {user && (
                        <button
                            onClick={openCreateModal}
                            className="bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all transform hover:scale-105 shadow-lg shadow-white/10"
                        >
                            <Plus size={20} />
                            Create Project
                        </button>
                    )}
                </div>

                {loading && !isModalOpen && projects.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">Loading projects...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <div key={project._id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/30 transition-all duration-300 group hover:-translate-y-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                                            <img
                                                src={
                                                    (project.userId && typeof project.userId !== 'string' && project.userId.avatar)
                                                        ? project.userId.avatar
                                                        : DEFAULT_AVATAR_URL
                                                }
                                                alt="Owner"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg leading-tight truncate max-w-[150px]">{project.title}</h3>
                                            <p className="text-xs text-gray-400">
                                                by {
                                                    (project.userId && typeof project.userId !== 'string')
                                                        ? project.userId.name
                                                        : 'Unknown'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    {isOwner(project) && (
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEditModal(project)}
                                                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 text-white transition-colors"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(project._id)}
                                                className="p-2 bg-red-500/10 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <p className="text-gray-300 text-sm mb-4 line-clamp-3 h-[60px]">
                                    {project.description}
                                </p>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {project.tags?.slice(0, 3).map((tag, i) => (
                                        <span key={i} className="text-xs bg-white/5 border border-white/5 px-2 py-1 rounded-md text-gray-400">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>

                                <div className="border-t border-white/5 pt-4 flex justify-between items-center text-xs text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <Folder size={12} />
                                        <span className="capitalize">{project.category}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar size={12} />
                                        <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#0a0a0a] z-10">
                            <h2 className="text-2xl font-bold">{isEditing ? 'Edit Project' : 'Create Project'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Project Title</label>
                                    <input
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/40 focus:outline-none transition-colors"
                                        placeholder="e.g. My Awesome App"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Tagline</label>
                                    <input
                                        value={formData.tagline}
                                        onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/40 focus:outline-none transition-colors"
                                        placeholder="Short catchy tagline"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/40 focus:outline-none transition-colors appearance-none"
                                        >
                                            <option value="draft" className="bg-black">Draft</option>
                                            <option value="published" className="bg-black">Published</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/40 focus:outline-none transition-colors appearance-none"
                                        >
                                            <option value="personal" className="bg-black">Personal</option>
                                            <option value="professional" className="bg-black">Professional</option>
                                            <option value="others" className="bg-black">Others</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Skills */}
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Skills (comma separated)</label>
                                    <input
                                        value={formData.skills}
                                        onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/40 focus:outline-none transition-colors"
                                        placeholder="React, Node.js, AI..."
                                    />
                                </div>

                                {/* Dates and Budget */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/40 focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">End Date</label>
                                        <input
                                            type="date"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/40 focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Budget ($)</label>
                                        <input
                                            type="number"
                                            value={formData.budget}
                                            onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/40 focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Description</label>
                                    <textarea
                                        rows={4}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/40 focus:outline-none transition-colors"
                                        placeholder="Describe your project..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Project Avatar URL</label>
                                    <input
                                        value={formData.avatar}
                                        onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/40 focus:outline-none transition-colors"
                                        placeholder="https://..."
                                    />
                                </div>

                                {/* Tags Input */}
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Tags</label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addTag()}
                                            className="flex-1 bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/40 focus:outline-none transition-colors"
                                            placeholder="Add a tag..."
                                        />
                                        <button onClick={addTag} className="bg-white/10 hover:bg-white/20 px-4 rounded-lg font-medium transition-colors">Add</button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.tags.map((tag, i) => (
                                            <span key={i} className="flex items-center gap-1 bg-blue-500/20 text-blue-200 border border-blue-500/30 px-3 py-1 rounded-full text-sm">
                                                {tag}
                                                <button onClick={() => removeTag(tag)} className="hover:text-white"><X size={12} /></button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Images Input */}
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Project Images (URLs)</label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            value={newImage}
                                            onChange={(e) => setNewImage(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addImage()}
                                            className="flex-1 bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/40 focus:outline-none transition-colors"
                                            placeholder="https://..."
                                        />
                                        <button onClick={addImage} className="bg-white/10 hover:bg-white/20 px-4 rounded-lg font-medium transition-colors">Add</button>
                                    </div>
                                    <div className="space-y-2">
                                        {formData.images.map((img, i) => (
                                            <div key={i} className="flex items-center justify-between bg-white/5 p-2 rounded-lg text-sm text-gray-300">
                                                <div className="flex items-center gap-2 truncate">
                                                    <span className="truncate max-w-[300px]">{img}</span>
                                                </div>
                                                <button onClick={() => removeImage(img)} className="hover:text-white p-1"><X size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Contributors Input */}
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Contributors</label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            value={newContributor}
                                            onChange={(e) => setNewContributor(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addContributor()}
                                            className="flex-1 bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/40 focus:outline-none transition-colors"
                                            placeholder="Contributor Name"
                                        />
                                        <button onClick={addContributor} className="bg-white/10 hover:bg-white/20 px-4 rounded-lg font-medium transition-colors">Add</button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.contributors.map((contributor, i) => (
                                            <span key={i} className="flex items-center gap-1 bg-purple-500/20 text-purple-200 border border-purple-500/30 px-3 py-1 rounded-full text-sm">
                                                {contributor}
                                                <button onClick={() => removeContributor(contributor)} className="hover:text-white"><X size={12} /></button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Links Input */}
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Links</label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            value={newLink}
                                            onChange={(e) => setNewLink(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addLink()}
                                            className="flex-1 bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/40 focus:outline-none transition-colors"
                                            placeholder="https://..."
                                        />
                                        <button onClick={addLink} className="bg-white/10 hover:bg-white/20 px-4 rounded-lg font-medium transition-colors">Add</button>
                                    </div>
                                    <div className="space-y-2">
                                        {formData.links.map((link, i) => (
                                            <div key={i} className="flex items-center justify-between bg-white/5 p-2 rounded-lg text-sm text-gray-300">
                                                <div className="flex items-center gap-2 truncate">
                                                    <Globe size={14} />
                                                    <span className="truncate max-w-[300px]">{link}</span>
                                                </div>
                                                <button onClick={() => removeLink(link)} className="hover:text-white p-1"><X size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="text-red-400 bg-red-400/10 p-3 rounded-lg text-sm border border-red-400/20">
                                    {error}
                                </div>
                            )}

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={handleSave}
                                    className="flex-1 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors flex justify-center items-center gap-2"
                                >
                                    {loading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
                                    {isEditing ? 'Save Changes' : 'Create Project'}
                                </button>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 border border-white/20 py-3 rounded-xl font-medium hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;
