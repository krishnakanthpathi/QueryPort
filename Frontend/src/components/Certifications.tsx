import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Calendar, Award, ExternalLink } from 'lucide-react';
import CertificationModal from './CertificationModal';
import type { Certification } from '../types';

const Certifications: React.FC = () => {
    const { user } = useAuth();
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'my'>('my');

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchCertifications = async () => {
        try {
            setLoading(true);

            if (activeTab === 'my' && !user) {
                setCertifications([]);
                setTotalPages(1);
                setLoading(false);
                return;
            }

            const endpoint = activeTab === 'my' ? '/certifications/my-certifications' : '/certifications';
            const data = await api.get(`${endpoint}?page=${page}&limit=9`);
            setCertifications(data.data.certifications);
            setTotalPages(data.totalPages || 1);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to fetch certifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCertifications();
    }, [activeTab, page, user]);

    useEffect(() => {
        setPage(1);
    }, [activeTab]);

    const openCreateModal = () => {
        setSelectedCertification(null);
        setIsModalOpen(true);
    };

    const openEditModal = (certification: Certification) => {
        setSelectedCertification(certification);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        fetchCertifications();
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this certification?")) return;

        try {
            await api.delete(`/certifications/id/${id}`);
            setCertifications(prev => prev.filter(c => c._id !== id));
        } catch (err: any) {
            alert(err.message || 'Failed to delete certification');
        }
    };

    // Check if user is owner
    const isOwner = (certification: Certification) => {
        if (!user || !certification.userId) return false;
        // userId can be object or string
        const ownerId = typeof certification.userId === 'string' ? certification.userId : certification.userId._id;
        return ownerId === user._id || ownerId === user.id;
    };



    return (
        <div className="min-h-screen pt-32 pb-12 bg-black text-white relative overflow-hidden overflow-y-auto w-full px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                            Certifications
                        </h1>
                        <p className="text-gray-400 mt-2">Showcase your professional certifications</p>
                    </div>

                    <div className="flex items-center gap-4">
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
                                My Certifications
                            </button>
                        </div>

                        {user && (
                            <button
                                onClick={openCreateModal}
                                className="bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all transform hover:scale-105 shadow-lg shadow-white/10"
                            >
                                <Plus size={20} />
                                <span className="hidden md:inline">Add Certification</span>
                            </button>
                        )}
                    </div>
                </div>

                {error && <div className="text-red-500 text-center mb-4">{error}</div>}

                {activeTab === 'my' && !user ? (
                    <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                        <h3 className="text-xl font-bold mb-2">Login to view your certifications</h3>
                        <p className="text-gray-400 mb-6">You need to be signed in to manage your certifications.</p>
                        <Link to="/login" className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors">
                            Sign In / Register
                        </Link>
                    </div>
                ) : loading && !isModalOpen && certifications.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">Loading certifications...</div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {certifications.map((certification) => (
                                <div key={certification._id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/30 transition-all duration-300 group hover:-translate-y-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-black/20 flex items-center justify-center">
                                                {certification.image ? (
                                                    <img
                                                        src={certification.image}
                                                        alt="Certification"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Award className="text-yellow-500" size={24} />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg leading-tight truncate max-w-[150px]">{certification.name}</h3>
                                                <p className="text-xs text-gray-400">
                                                    {certification.issuingOrganization}
                                                </p>
                                            </div>
                                        </div>
                                        {isOwner(certification) && (
                                            <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEditModal(certification)}
                                                    className="p-2 bg-white/10 rounded-lg hover:bg-white/20 text-white transition-colors"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(certification._id!)}
                                                    className="p-2 bg-red-500/10 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t border-white/5 pt-4 flex justify-between items-center text-xs text-gray-500">
                                        <Link
                                            to={`/certifications/${certification._id}`}
                                            className="flex items-center gap-1 text-white hover:text-blue-400 transition-colors"
                                        >
                                            <ExternalLink size={14} />
                                            View Details
                                        </Link>
                                        <div className="flex items-center gap-2 ml-auto">
                                            <Calendar size={12} />
                                            <span>{new Date(certification.issueDate).toLocaleDateString()}</span>
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

            <CertificationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                certification={selectedCertification}
            />
        </div>
    );
};

export default Certifications;
