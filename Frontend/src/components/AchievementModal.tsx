import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { X, Save, Upload } from 'lucide-react';
import type { Achievement } from '../types';

interface AchievementModalProps {
    isOpen: boolean;
    onClose: () => void;
    achievement?: Achievement | null;
    onSave: () => void;
}

const AchievementModal: React.FC<AchievementModalProps> = ({ isOpen, onClose, achievement, onSave }) => {
    const isEditing = !!achievement;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        organization: '',
        date: '',
        url: '',
        image: '',
    });

    const [imageFile, setImageFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (achievement) {
            setFormData({
                title: achievement.title,
                description: achievement.description,
                organization: achievement.organization,
                date: achievement.date ? new Date(achievement.date).toISOString().split('T')[0] : '',
                url: achievement.url || '',
                image: achievement.image || '',
            });
        } else {
            resetForm();
        }
    }, [achievement, isOpen]);

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            organization: '',
            date: '',
            url: '',
            image: '',
        });
        setImageFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            setError('');

            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('organization', formData.organization);
            data.append('date', formData.date);
            data.append('url', formData.url);

            // Existing image URL if no new file
            data.append('image', formData.image);

            // New Image File
            if (imageFile) {
                data.append('image', imageFile);
            }

            if (isEditing && achievement?._id) {
                await api.patch(`/achievements/id/${achievement._id}`, data);
            } else {
                await api.post('/achievements', data);
            }
            onSave();
            onClose();
            resetForm();
        } catch (err: any) {
            setError(err.message || 'Failed to save achievement');
        } finally {
            setLoading(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#0a0a0a] z-10">
                    <h2 className="text-2xl font-bold">{isEditing ? 'Edit Achievement' : 'Add Achievement'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Title</label>
                            <input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/40 focus:outline-none transition-colors"
                                placeholder="e.g. Hackathon Winner"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Organization</label>
                            <input
                                value={formData.organization}
                                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/40 focus:outline-none transition-colors"
                                placeholder="e.g. Google"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/40 focus:outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">URL (Optional)</label>
                                <input
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/40 focus:outline-none transition-colors"
                                    placeholder="https://..."
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
                                placeholder="Describe your achievement..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Image</label>
                            <div className="flex items-center gap-4">
                                {(imageFile || formData.image) && (
                                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 group">
                                        <img
                                            src={imageFile ? URL.createObjectURL(imageFile) : formData.image}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            onClick={() => {
                                                setImageFile(null);
                                                setFormData({ ...formData, image: '' });
                                            }}
                                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={20} className="text-white" />
                                        </button>
                                    </div>
                                )}

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageSelect}
                                    className="hidden"
                                    accept="image/*"
                                />

                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                                >
                                    <Upload size={16} />
                                    {imageFile || formData.image ? 'Change Image' : 'Upload Image'}
                                </button>
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
                            {isEditing ? 'Save Changes' : 'Add Achievement'}
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

export default AchievementModal;
