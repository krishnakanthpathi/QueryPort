import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { X, Save, Globe, Upload, Image as ImageIcon } from 'lucide-react';

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
    // const [newImage, setNewImage] = useState(''); // Removed in favor of file upload
    const [newContributor, setNewContributor] = useState('');
    const [newImages, setNewImages] = useState<File[]>([]);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

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
        // setNewImage('');
        setNewContributor('');
        setNewImages([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (avatarInputRef.current) avatarInputRef.current.value = '';
        setAvatarFile(null);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            setError('');

            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('tagline', formData.tagline);
            data.append('skills', formData.skills);
            data.append('status', formData.status);
            data.append('category', formData.category);
            data.append('avatar', formData.avatar);
            data.append('startDate', formData.startDate);
            data.append('endDate', formData.endDate);
            data.append('budget', formData.budget.toString());

            // Append Arrays
            formData.links.forEach(link => data.append('links', link));
            formData.tags.forEach(tag => data.append('tags', tag));
            formData.contributors.forEach(contributor => data.append('contributors', contributor));

            // Existing images
            formData.images.forEach(img => data.append('images', img));

            // New Images
            newImages.forEach(file => {
                data.append('newImages', file);
            });

            // New Avatar
            if (avatarFile) {
                data.append('avatarFile', avatarFile);
            }


            if (isEditing && project?._id) {
                await api.patch(`/projects/id/${project._id}`, data);
            } else {
                await api.post('/projects', data);
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

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            setNewImages(prev => [...prev, ...files]);
        }
    };

    const removeNewImage = (index: number) => {
        setNewImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAvatarFile(e.target.files[0]);
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
                            <label className="block text-sm text-gray-400 mb-1">Project Avatar</label>
                            <div className="flex items-center gap-4">
                                {(avatarFile || formData.avatar) && (
                                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 group">
                                        <img
                                            src={avatarFile ? URL.createObjectURL(avatarFile) : formData.avatar}
                                            alt="Avatar Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            onClick={() => {
                                                setAvatarFile(null);
                                                setFormData({ ...formData, avatar: '' });
                                            }}
                                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={20} className="text-white" />
                                        </button>
                                    </div>
                                )}

                                <input
                                    type="file"
                                    ref={avatarInputRef}
                                    onChange={handleAvatarSelect}
                                    className="hidden"
                                    accept="image/*"
                                />

                                <button
                                    onClick={() => avatarInputRef.current?.click()}
                                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                                >
                                    <Upload size={16} />
                                    {avatarFile || formData.avatar ? 'Change Avatar' : 'Upload Avatar'}
                                </button>
                            </div>
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
                            <label className="block text-sm text-gray-400 mb-1">Project Images</label>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageSelect}
                                className="hidden"
                                multiple
                                accept="image/*"
                            />

                            <div className="flex flex-wrap gap-4 mb-4">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-3 transition-colors text-gray-300 hover:text-white"
                                >
                                    <Upload size={20} />
                                    <span>Upload Images</span>
                                </button>
                            </div>

                            <div className="space-y-2">
                                {/* Existing Images */}
                                {formData.images.map((img, i) => (
                                    <div key={`existing-${i}`} className="flex items-center justify-between bg-white/5 p-2 rounded-lg text-sm text-gray-300">
                                        <div className="flex items-center gap-2 truncate">
                                            <ImageIcon size={16} className="text-gray-400" />
                                            <span className="truncate max-w-[300px]">{img}</span>
                                            <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">Existing</span>
                                        </div>
                                        <button onClick={() => removeImage(img)} className="hover:text-red-400 p-1 transition-colors"><X size={14} /></button>
                                    </div>
                                ))}

                                {/* New Images */}
                                {newImages.map((file, i) => (
                                    <div key={`new-${i}`} className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 p-2 rounded-lg text-sm text-blue-200">
                                        <div className="flex items-center gap-2 truncate">
                                            <ImageIcon size={16} className="text-blue-400" />
                                            <span className="truncate max-w-[300px]">{file.name}</span>
                                            <span className="text-xs bg-blue-500/20 px-2 py-0.5 rounded text-blue-200">New</span>
                                        </div>
                                        <button onClick={() => removeNewImage(i)} className="hover:text-red-400 p-1 transition-colors"><X size={14} /></button>
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
