import React, { useState, useEffect } from 'react';
import type { Education } from '../types';
import { api } from '../lib/api';
import { useToast } from './Toast';
import { Plus, Trash } from 'lucide-react';

interface EducationFormProps {
    initialData?: Education;
    onSave: () => void;
    onCancel: () => void;
}

const EducationForm: React.FC<EducationFormProps> = ({ initialData, onSave, onCancel }) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Education>>({
        institution: '',
        degree: '',
        fieldOfStudy: '',
        startDate: '',
        endDate: '',
        current: false,
        score: '',
        description: '',
        semesters: []
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
                await api.patch(`/education/${initialData._id}`, formData);
                showToast('Education updated successfully', 'success');
            } else {
                await api.post('/education', formData);
                showToast('Education added successfully', 'success');
            }
            onSave();
        } catch (error: any) {
            showToast(error.message || 'Failed to save education', 'error');
        } finally {
            setLoading(false);
        }
    };

    const addSemester = () => {
        setFormData(prev => ({
            ...prev,
            semesters: [
                ...(prev.semesters || []),
                { semester: (prev.semesters?.length || 0) + 1, sgpa: '' }
            ]
        }));
    };

    const removeSemester = (index: number) => {
        const newSemesters = [...(formData.semesters || [])];
        newSemesters.splice(index, 1);
        // Re-index semesters
        const reIndexed = newSemesters.map((s, i) => ({ ...s, semester: i + 1 }));
        setFormData(prev => ({ ...prev, semesters: reIndexed }));
    };

    const updateSemester = (index: number, field: string, value: string) => {
        const newSemesters = [...(formData.semesters || [])];
        newSemesters[index] = { ...newSemesters[index], [field]: value };
        setFormData(prev => ({ ...prev, semesters: newSemesters }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                    name="institution"
                    placeholder="Institution Name"
                    value={formData.institution}
                    onChange={handleChange}
                    required
                    className="w-full bg-black/50 border border-white/20 rounded p-2 focus:border-purple-400 focus:outline-none"
                />
                <input
                    name="degree"
                    placeholder="Degree (e.g. B.Tech)"
                    value={formData.degree}
                    onChange={handleChange}
                    required
                    className="w-full bg-black/50 border border-white/20 rounded p-2 focus:border-purple-400 focus:outline-none"
                />
                <input
                    name="fieldOfStudy"
                    placeholder="Field of Study (e.g. Computer Science)"
                    value={formData.fieldOfStudy}
                    onChange={handleChange}
                    required
                    className="w-full bg-black/50 border border-white/20 rounded p-2 focus:border-purple-400 focus:outline-none"
                />
                <input
                    name="score"
                    placeholder="Overall Grade/CGPA (e.g. 9.5)"
                    value={formData.score}
                    onChange={handleChange}
                    className="w-full bg-black/50 border border-white/20 rounded p-2 focus:border-purple-400 focus:outline-none"
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
                        className="w-full bg-black/50 border border-white/20 rounded p-2 focus:border-purple-400 focus:outline-none"
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
                        className="w-full bg-black/50 border border-white/20 rounded p-2 focus:border-purple-400 focus:outline-none disabled:opacity-50"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="current"
                    checked={formData.current}
                    onChange={handleCheckboxChange}
                    className="rounded bg-black/50 border-white/20 text-purple-500 focus:ring-purple-500"
                />
                <label htmlFor="current" className="text-sm text-gray-300">I am currently studying here</label>
            </div>

            <textarea
                name="description"
                placeholder="Description (Optional)"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="w-full bg-black/50 border border-white/20 rounded p-2 focus:border-purple-400 focus:outline-none"
            />

            {/* Semester Marks Section */}
            <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-gray-300">Semester Marks</label>
                    <button
                        type="button"
                        onClick={addSemester}
                        className="text-xs flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-purple-300 transition-colors"
                    >
                        <Plus size={12} /> Add Semester
                    </button>
                </div>

                <div className="space-y-2">
                    {formData.semesters?.map((sem, index) => (
                        <div key={index} className="flex gap-2 items-center">
                            <span className="text-sm text-gray-400 w-16">Sem {sem.semester}</span>
                            <input
                                placeholder="SGPA/Marks"
                                value={sem.sgpa}
                                onChange={(e) => updateSemester(index, 'sgpa', e.target.value)}
                                className="flex-1 bg-black/50 border border-white/20 rounded p-1.5 text-sm focus:border-purple-400 focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => removeSemester(index)}
                                className="text-red-400 hover:text-red-300 p-1"
                            >
                                <Trash size={14} />
                            </button>
                        </div>
                    ))}
                    {(!formData.semesters || formData.semesters.length === 0) && (
                        <div className="text-xs text-gray-500 italic">No semester details added.</div>
                    )}
                </div>
            </div>

            <div className="flex gap-4 pt-2">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Save Education'}
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

export default EducationForm;
