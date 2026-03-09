import React, { useState, useRef } from 'react';
import { api } from '../lib/api';
import { X, Save } from 'lucide-react';

interface SkillModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

const SkillModal: React.FC<SkillModalProps> = ({ isOpen, onClose, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        image: '',
    });
    const [scope, setScope] = useState<'global' | 'user'>('global');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetForm = () => {
        setFormData({
            name: '',
            image: '',
        });
        setScope('global');

        if (fileInputRef.current) fileInputRef.current.value = '';
        setError('');
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            setError('Skill name is required');
            return;
        }

        try {
            setLoading(true);
            setError('');

            // Single call: find-or-create skill and attach to profile
            const payload = {
                name: formData.name.trim(),
                image: formData.image || 'https://cdn-icons-png.flaticon.com/512/3665/3665975.png',
                scope,
            };

            await api.post('/skills/add-to-profile', payload);

            onSave();
            onClose();
            resetForm();
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || 'Failed to save skill');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Add Skill</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Skill Name</label>
                            <input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/40 focus:outline-none transition-colors"
                                placeholder="e.g. React, Python"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Icon URL (Optional)</label>
                            <input
                                ref={fileInputRef}
                                value={formData.image}
                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/40 focus:outline-none transition-colors"
                                placeholder="https://..."
                            />
                        </div>

                        {formData.image && (
                            <div className="flex justify-center">
                                <img
                                    src={formData.image}
                                    alt="Preview"
                                    className="w-16 h-16 object-contain rounded-lg border border-white/10 bg-white/5 p-2"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Visibility</label>
                            <div className="flex items-center gap-3 text-sm">
                                <button
                                    type="button"
                                    onClick={() => setScope('global')}
                                    className={`flex-1 px-3 py-2 rounded-lg border text-left transition-colors ${
                                        scope === 'global'
                                            ? 'border-white/60 bg-white/10 text-white'
                                            : 'border-white/10 text-gray-300 hover:border-white/30'
                                    }`}
                                >
                                    <span className="font-medium block">Global skill</span>
                                    <span className="text-xs text-gray-400 block mt-1">
                                        Visible in the shared skills catalog
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setScope('user')}
                                    className={`flex-1 px-3 py-2 rounded-lg border text-left transition-colors ${
                                        scope === 'user'
                                            ? 'border-white/60 bg-white/10 text-white'
                                            : 'border-white/10 text-gray-300 hover:border-white/30'
                                    }`}
                                >
                                    <span className="font-medium block">My custom skill</span>
                                    <span className="text-xs text-gray-400 block mt-1">
                                        Only attached to your profile
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-400 bg-red-400/10 p-3 rounded-lg text-sm border border-red-400/20">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex-1 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Save size={18} />
                            )}
                            Add Skill
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkillModal;

