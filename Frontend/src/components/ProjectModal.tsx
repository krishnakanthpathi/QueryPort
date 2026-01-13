import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { X, Save, Globe } from 'lucide-react';

interface Project {
    _id?: string;
    title: string;
    description: string;
    tagline?: string;
    skills?: string;
    status: 'draft' | 'published';
    category?: 'personal' | 'professional' | 'others';
    links?: string[];
    tags?: string[];
    images?: string[];
    avatar?: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
    contributors?: string[];
}

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    project?: Project | null;
    onSave: () => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, project, onSave }) => {
    const isEditing = !!project;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

    useEffect(() => {
        if (project) {
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
        } else {
            resetForm();
        }
    }, [project, isOpen]);

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
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            setError('');
            if (isEditing && project?._id) {
                await api.patch(`/projects/id/${project._id}`, formData);
            } else {
                await api.post('/projects', formData);
            }
            onSave();
            onClose();
            resetForm();
        } catch (err: any) {
            setError(err.message || 'Failed to save project');
        } finally {
            setLoading(false);
        }
    };

    // Helper functions
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


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#0a0a0a] z-10">
                    <h2 className="text-2xl font-bold">{isEditing ? 'Edit Project' : 'Create Project'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
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

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Skills (comma separated)</label>
                            <input
                                value={formData.skills}
                                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/40 focus:outline-none transition-colors"
                                placeholder="React, Node.js, AI..."
                            />
                        </div>

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

                        {/* Tags */}
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

                        {/* Images */}
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

                        {/* Contributors */}
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

                        {/* Links */}
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
                            onClick={onClose}
                            className="px-6 border border-white/20 py-3 rounded-xl font-medium hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectModal;
