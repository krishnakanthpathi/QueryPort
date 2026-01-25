import React, { useState } from 'react';
import type { Education } from '../types';
import { BookOpen, Calendar, Edit2, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import EducationForm from './EducationForm';
import { api } from '../lib/api';
import { useToast } from './Toast';

interface EducationListProps {
    education: Education[];
    isEditing: boolean;
    onUpdate: () => void;
}

const EducationList: React.FC<EducationListProps> = ({ education, isEditing, onUpdate }) => {
    const { showToast } = useToast();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this education entry?')) return;
        try {
            await api.delete(`/education/${id}`);
            showToast('Education deleted successfully', 'success');
            onUpdate();
        } catch (error: any) {
            showToast(error.message || 'Failed to delete education', 'error');
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-2">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                    <BookOpen className="text-purple-400" /> Education
                </h3>
                {isEditing && !isAdding && !editingId && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 px-3 py-1 rounded-lg text-sm transition-colors"
                    >
                        <Plus size={16} /> Add Education
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="mb-8 p-4 bg-black/30 rounded-xl border border-purple-500/30">
                    <EducationForm
                        onSave={() => { setIsAdding(false); onUpdate(); }}
                        onCancel={() => setIsAdding(false)}
                    />
                </div>
            )}

            {editingId && (
                <div className="mb-8 p-4 bg-black/30 rounded-xl border border-purple-500/30">
                    <EducationForm
                        initialData={education.find(e => e._id === editingId)}
                        onSave={() => { setEditingId(null); onUpdate(); }}
                        onCancel={() => setEditingId(null)}
                    />
                </div>
            )}

            <div className="space-y-6">
                {education.map((edu) => (
                    <div key={edu._id} className="relative pl-6 border-l-2 border-white/10 last:border-0">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-purple-500 border-2 border-black"></div>

                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h4 className="text-lg font-bold text-white">{edu.institution}</h4>
                                <p className="text-purple-300">{edu.degree} in {edu.fieldOfStudy}</p>
                                <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                                    <Calendar size={14} />
                                    <span>
                                        {new Date(edu.startDate).getFullYear()} - {edu.current ? 'Present' : (edu.endDate ? new Date(edu.endDate).getFullYear() : 'N/A')}
                                    </span>
                                </div>
                                {edu.score && (
                                    <p className="text-sm text-gray-400 mt-1">Grade: <span className="text-white font-medium">{edu.score}</span></p>
                                )}

                                <button
                                    onClick={() => toggleExpand(edu._id!)}
                                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-white mt-2 transition-colors"
                                >
                                    {expandedId === edu._id ? 'Hide Details' : 'View Details'}
                                    {expandedId === edu._id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                </button>

                                {expandedId === edu._id && (
                                    <div className="mt-4 space-y-2 bg-black/20 p-4 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
                                        {edu.description && <p className="text-gray-300 text-sm mb-4">{edu.description}</p>}

                                        {edu.semesters && edu.semesters.length > 0 && (
                                            <div>
                                                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Semester Performance</h5>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                    {edu.semesters.map((sem) => (
                                                        <div key={sem.semester} className="bg-white/5 p-2 rounded text-center border border-white/5">
                                                            <div className="text-xs text-gray-500">Sem {sem.semester}</div>
                                                            <div className="font-bold text-white">{sem.sgpa} <span className="text-[10px] text-gray-600">SGPA</span></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {isEditing && (
                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => setEditingId(edu._id!)}
                                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-blue-300 transition-colors"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(edu._id!)}
                                        className="p-1.5 bg-white/10 hover:bg-red-500/20 rounded text-red-400 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {education.length === 0 && !isAdding && (
                    <div className="text-center text-gray-500 py-4 italic">
                        No education history added yet.
                    </div>
                )}
            </div>
        </section>
    );
};

export default EducationList;
