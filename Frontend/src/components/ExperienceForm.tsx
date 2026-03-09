import React, { useState, useEffect } from 'react';
import type { Experience } from '../types';
import { api } from '../lib/api';
import { useToast } from './Toast';

interface ExperienceFormProps {
    initialData?: Experience;
    onSave: () => void;
    onCancel: () => void;
}

const ExperienceForm: React.FC<ExperienceFormProps> = ({ initialData, onSave, onCancel }) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Experience>>({
        company: '',
        role: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
        location: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                startDate: initialData.startDate.split('T')[0],
                endDate: initialData.endDate ? initialData.endDate.split('T')[0] : '',
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, current: e.target.checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (initialData?._id) {
                await api.patch(`/experience/${initialData._id}`, formData);
                showToast('Experience updated successfully', 'success');
            } else {
                await api.post('/experience', formData);
                showToast('Experience added successfully', 'success');
            }
            onSave();
        } catch (error: any) {
            showToast(error.message || 'Failed to save experience', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                    name="company"
                    placeholder="Company / Organization"
                    value={formData.company}
                    onChange={handleChange}
                    required
                    className="w-full bg-black/50 border border-white/20 rounded p-2 focus:border-blue-400 focus:outline-none"
                />
                <input
                    name="role"
                    placeholder="Role / Job Title"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    className="w-full bg-black/50 border border-white/20 rounded p-2 focus:border-blue-400 focus:outline-none"
                />
                <input
                    name="location"
                    placeholder="Location (e.g. Remote, New York)"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full bg-black/50 border border-white/20 rounded p-2 focus:border-blue-400 focus:outline-none md:col-span-2"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-400 block mb-1">Start Date</label>
                    <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        required
                        className="w-full bg-black/50 border border-white/20 rounded p-2 focus:border-blue-400 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-400 block mb-1">End Date</label>
                    <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        disabled={formData.current}
                        className="w-full bg-black/50 border border-white/20 rounded p-2 focus:border-blue-400 focus:outline-none disabled:opacity-50"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="current"
                    checked={formData.current}
                    onChange={handleCheckboxChange}
                    className="rounded bg-black/50 border-white/20 text-blue-500 focus:ring-blue-500"
                />
                <label htmlFor="current" className="text-sm text-gray-300">I currently work here</label>
            </div>

            <textarea
                name="description"
                placeholder="Description (responsibilities, achievements)"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="w-full bg-black/50 border border-white/20 rounded p-2 focus:border-blue-400 focus:outline-none"
            />

            <div className="flex gap-4 pt-2">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Save Experience'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 bg-transparent border border-white/20 hover:bg-white/10 text-white font-bold py-2 rounded-lg transition-colors"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
};

export default ExperienceForm;
