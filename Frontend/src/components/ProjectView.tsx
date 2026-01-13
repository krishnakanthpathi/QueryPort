import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { ArrowLeft, Calendar, Globe, User, DollarSign, Clock, Layers, FileText, Folder, ThumbsUp, Eye } from 'lucide-react';
import { DEFAULT_AVATAR_URL } from '../constants';

interface Project {
    _id: string;
    userId: {
        _id: string;
        name: string;
        username: string;
        avatar: string;
    } | string;
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
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    createdAt: string;
    updatedAt: string;
}

const ProjectView: React.FC = () => {
    const { projectId } = useParams();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const data = await api.get(`/projects/id/${projectId}`);
                setProject(data.data.project);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch project');
            } finally {
                setLoading(false);
            }
        };

        if (projectId) {
            fetchProject();
        }
    }, [projectId]);

    if (loading) return <div className="min-h-screen pt-32 text-center text-white">Loading...</div>;
    if (error || !project) return <div className="min-h-screen pt-32 text-center text-red-500">{error || 'Project not found'}</div>;

    const ownerName = typeof project.userId !== 'string' ? project.userId.name : 'Unknown';
    const ownerAvatar = typeof project.userId !== 'string' && project.userId.avatar ? project.userId.avatar : DEFAULT_AVATAR_URL;

    return (
        <div className="min-h-screen pt-24 pb-12 bg-black text-white px-4 relative overflow-hidden overflow-y-auto w-full">
            <div className="max-w-5xl mx-auto relative z-10">
                <Link to="/projects" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft size={20} />
                    Back to Projects
                </Link>

                {/* Hero Section */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Layers size={200} />
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 relative z-10">
                        <div className="w-32 h-32 md:w-48 md:h-48 rounded-2xl overflow-hidden border-4 border-white/10 shrink-0 bg-black/40">
                            <img
                                src={project.avatar || DEFAULT_AVATAR_URL}
                                alt={project.title}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="flex-1">
                            <div className="flex flex-wrap gap-2 mb-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${project.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                    {project.status}
                                </span>
                                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 flex items-center gap-1">
                                    <Folder size={12} /> {project.category}
                                </span>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-bold mb-2">{project.title}</h1>
                            {project.tagline && <p className="text-xl text-gray-400 font-light mb-4">{project.tagline}</p>}

                            <div className="flex items-center gap-4 mt-6">
                                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full hover:bg-white/10 transition-colors cursor-default">
                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
                                        <img src={ownerAvatar} alt={ownerName} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="text-sm">
                                        <p className="text-gray-400 text-xs">Created by</p>
                                        <p className="font-medium leading-none">{ownerName}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 text-sm text-gray-400 hidden sm:flex">
                                    <div className="flex items-center gap-1"><Eye size={16} /> {project.views || 0}</div>
                                    <div className="flex items-center gap-1"><ThumbsUp size={16} /> {project.likes || 0}</div>
                                    {/* <div className="flex items-center gap-1"><MessageSquare size={16}/> {project.comments || 0}</div> */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-8">
                        {/* Description */}
                        <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><FileText size={20} className="text-gray-400" /> About Project</h3>
                            <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {project.description}
                            </div>
                        </section>

                        {/* Images Gallery */}
                        {project.images && project.images.length > 0 && (
                            <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Layers size={20} className="text-gray-400" /> Gallery</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {project.images.map((img, i) => (
                                        <div key={i} className="rounded-lg overflow-hidden border border-white/10 aspect-video hover:opacity-90 transition-opacity cursor-pointer">
                                            <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Details Card */}
                        <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4">
                            <h3 className="text-lg font-bold mb-4 border-b border-white/10 pb-2">Details</h3>

                            {project.startDate && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400 flex items-center gap-2"><Calendar size={14} /> Start Date</span>
                                    <span>{new Date(project.startDate).toLocaleDateString()}</span>
                                </div>
                            )}
                            {project.endDate && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400 flex items-center gap-2"><Clock size={14} /> Due Date</span>
                                    <span>{new Date(project.endDate).toLocaleDateString()}</span>
                                </div>
                            )}
                            {project.budget && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400 flex items-center gap-2"><DollarSign size={14} /> Budget</span>
                                    <span className="text-green-400 font-bold">${project.budget.toLocaleString()}</span>
                                </div>
                            )}

                            <div className="pt-4 border-t border-white/10">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Tech Stack</h4>
                                <div className="flex flex-wrap gap-2">
                                    {project.skills ? project.skills.split(',').map((skill, i) => (
                                        <span key={i} className="text-xs bg-white/10 text-gray-300 px-2 py-1 rounded">
                                            {skill.trim()}
                                        </span>
                                    )) : <span className="text-gray-500 text-xs italic">No skills listed</span>}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {project.tags && project.tags.length > 0 ? project.tags.map((tag, i) => (
                                        <span key={i} className="text-xs border border-white/20 text-gray-400 px-2 py-1 rounded-full">
                                            #{tag}
                                        </span>
                                    )) : <span className="text-gray-500 text-xs italic">No tags</span>}
                                </div>
                            </div>
                        </section>

                        {/* Links */}
                        <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-4 border-b border-white/10 pb-2">Links</h3>
                            <div className="space-y-2">
                                {project.links && project.links.length > 0 ? project.links.map((link, i) => (
                                    <a key={i} href={link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm truncate transition-colors bg-white/5 p-2 rounded">
                                        <Globe size={14} />
                                        <span className="truncate">{link}</span>
                                    </a>
                                )) : <p className="text-gray-500 text-sm italic">No links added</p>}
                            </div>
                        </section>

                        {/* Contributors */}
                        <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-4 border-b border-white/10 pb-2">Contributors</h3>
                            <div className="flex flex-wrap gap-2">
                                {project.contributors && project.contributors.length > 0 ? project.contributors.map((c, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-white/5 p-2 rounded-lg text-sm">
                                        <User size={14} className="text-purple-400" />
                                        <span>{c}</span>
                                    </div>
                                )) : <p className="text-gray-500 text-sm italic">No contributors yet</p>}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectView;
