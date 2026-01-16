import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { ArrowLeft, Calendar, Edit2, Trash2, Award, ExternalLink, Linkedin, Link as LinkIcon, Check, Twitter, FileText } from 'lucide-react';
import { DEFAULT_AVATAR_URL } from '../constants';
import { useAuth } from '../context/AuthContext';
import CertificationModal from './CertificationModal';
import type { Certification } from '../types';

const CertificationView: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [certification, setCertification] = useState<Certification | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const fetchCertification = async () => {
        try {
            const data = await api.get(`/certifications/id/${id}`);
            setCertification(data.data.certification);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch certification');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchCertification();
        }
    }, [id]);

    const isOwner = () => {
        if (!user || !certification || !certification.userId) return false;
        const ownerId = typeof certification.userId === 'string' ? certification.userId : certification.userId._id;
        return ownerId === user._id || ownerId === user.id;
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this certification?")) return;
        try {
            await api.delete(`/certifications/id/${id}`);
            navigate('/certifications');
        } catch (err: any) {
            alert(err.message || 'Failed to delete certification');
        }
    }

    const copyToClipboard = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const ensureAbsoluteUrl = (url: string) => {
        if (!url) return '';
        const cleanUrl = url.trim();
        if (cleanUrl.match(/^https?:\/\//i)) {
            return cleanUrl;
        }
        return `https://${cleanUrl}`;
    };

    if (loading) return <div className="min-h-screen pt-32 text-center text-white">Loading...</div>;
    if (error || !certification) return <div className="min-h-screen pt-32 text-center text-red-500">{error || 'Certification not found'}</div>;

    const ownerName = certification.userId && typeof certification.userId !== 'string' ? certification.userId.name : 'Unknown';
    const ownerAvatar = certification.userId && typeof certification.userId !== 'string' && certification.userId.avatar ? certification.userId.avatar : DEFAULT_AVATAR_URL;

    return (
        <div className="min-h-screen pt-32 pb-12 bg-black text-white px-4 relative overflow-hidden overflow-y-auto w-full">
            <div className="max-w-4xl mx-auto relative z-10">
                <div className="flex justify-between items-start mb-8">
                    <Link to="/certifications" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                        Back to Certifications
                    </Link>

                    {isOwner() && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors font-medium"
                            >
                                <Edit2 size={16} /> <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors font-medium"
                            >
                                <Trash2 size={16} /> <span className="hidden sm:inline">Delete</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="aspect-video w-full bg-black/40 flex items-center justify-center p-8">
                                {certification.image ? (
                                    <img
                                        src={certification.image}
                                        alt={certification.name}
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <Award size={100} className="text-yellow-500 opacity-50" />
                                )}
                            </div>

                            <div className="p-8">
                                <h1 className="text-3xl md:text-4xl font-bold mb-2">{certification.name}</h1>
                                <p className="text-xl text-blue-400 font-medium mb-6">{certification.issuingOrganization}</p>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <Calendar className="text-gray-500" size={20} />
                                        <span>Issued: {new Date(certification.issueDate).toLocaleDateString()}</span>
                                    </div>
                                    {certification.credentialId && (
                                        <div className="flex items-center gap-3 text-gray-300">
                                            <FileText className="text-gray-500" size={20} />
                                            <span>Credential ID: {certification.credentialId}</span>
                                        </div>
                                    )}
                                </div>

                                {certification.credentialUrl && (
                                    <a
                                        href={ensureAbsoluteUrl(certification.credentialUrl)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors"
                                    >
                                        <ExternalLink size={18} />
                                        View Credential
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Creator Card */}
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Earner</h3>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20">
                                    <img src={ownerAvatar} alt={ownerName} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <p className="font-bold text-lg">{ownerName}</p>
                                    <p className="text-xs text-gray-400">@{certification.userId && typeof certification.userId !== 'string' ? certification.userId.username : 'user'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Share Card */}
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4">
                            <div className="pt-2">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Share</h3>
                                <div className="flex gap-2">
                                    <button onClick={copyToClipboard} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-gray-300 transition-colors relative group">
                                        {copied ? <Check size={18} className="text-green-400" /> : <LinkIcon size={18} />}
                                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            {copied ? 'Copied!' : 'Copy Link'}
                                        </span>
                                    </button>
                                    <a href={`https://twitter.com/intent/tweet?text=Check out this certification by ${ownerName}: ${certification.name}&url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors">
                                        <Twitter size={18} />
                                    </a>
                                    <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-700/10 rounded-lg hover:bg-blue-700/20 text-blue-600 transition-colors">
                                        <Linkedin size={18} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <CertificationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={fetchCertification}
                certification={certification}
            />
        </div>
    );
};

export default CertificationView;
