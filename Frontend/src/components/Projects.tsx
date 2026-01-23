import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Calendar, Folder, Eye } from 'lucide-react';
import { DEFAULT_AVATAR_URL } from '../constants';
import ProjectModal from './ProjectModal';

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
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const endpoint = activeTab === 'my' ? '/projects/my-projects' : '/projects';
            const data = await api.get(`${endpoint}?page=${page}&limit=9`);
            setProjects(data.data.projects);
            setTotalPages(data.totalPages || 1);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [activeTab, page]);

    useEffect(() => {
        setPage(1);
    }, [activeTab]);

    const openCreateModal = () => {
        setSelectedProject(null);
        setIsModalOpen(true);
    };

    const openEditModal = (project: Project) => {
        setSelectedProject(project);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        // Refresh list
        fetchProjects();
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

    // Check if user is owner safely
    const isOwner = (project: Project) => {
        if (!user || !project.userId) return false;
        // userId can be object or string
        const projectUserId = typeof project.userId === 'string' ? project.userId : project.userId._id;
        return projectUserId === user._id || projectUserId === user.id;
    };

    return (
        <div className="min-h-screen pt-32 pb-12 bg-black text-white relative overflow-hidden overflow-y-auto w-full px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                            Projects
                        </h1>
                        <p className="text-gray-400 mt-2">Discover what others are building</p>
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
                                    All Projects
                                </button>
                                <button
                                    onClick={() => setActiveTab('my')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'my'
                                        ? 'bg-white text-black shadow-lg'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    My Projects
                                </button>
                            </div>
                        )}

                        {user && (
                            <button
                                onClick={openCreateModal}
                                className="bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all transform hover:scale-105 shadow-lg shadow-white/10"
                            >
                                <Plus size={20} />
                                <span className="hidden md:inline">Create Project</span>
                            </button>
                        )}
                    </div>
                </div>

                {error && <div className="text-red-500 text-center mb-4">{error}</div>}

                {loading && !isModalOpen && projects.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">Loading projects...</div>
                ) : (
                    <>
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
                                            <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
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
                                        <Link to={`/projects/${project._id}`} className="flex items-center gap-1 text-white hover:text-blue-400 transition-colors">
                                            <Eye size={14} />
                                            Preview
                                        </Link>
                                        <div className="flex gap-4">
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

            <ProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                project={selectedProject}
            />
        </div>
    );
};

export default Projects;

