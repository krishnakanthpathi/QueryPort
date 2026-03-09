import React, { useState } from 'react';
import type { Experience } from '../types';
import { Calendar, Edit2, Trash2, Plus, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import ExperienceForm from './ExperienceForm';
import { api } from '../lib/api';
import { useToast } from './Toast';

interface ExperienceListProps {
    experience: Experience[];
    isEditing: boolean;
    onUpdate: () => void;
}

const ExperienceList: React.FC<ExperienceListProps> = ({ experience, isEditing, onUpdate }) => {
    const { showToast } = useToast();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this experience entry?')) return;
        try {
            await api.delete(`/experience/${id}`);
            showToast('Experience deleted successfully', 'success');
            onUpdate();
        } catch (error: any) {
            showToast(error.message || 'Failed to delete experience', 'error');
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-2">
                <h3 className="text-2xl font-bold">Experience</h3>
                {isEditing && !isAdding && !editingId && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 px-3 py-1 rounded-lg text-sm transition-colors"
                    >
                        <Plus size={16} /> Add Experience
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="mb-8 p-4 bg-black/30 rounded-xl border border-blue-500/30">
                    <ExperienceForm
                        onSave={() => { setIsAdding(false); onUpdate(); }}
                        onCancel={() => setIsAdding(false)}
                    />
                </div>
            )}

            {editingId && (
                <div className="mb-8 p-4 bg-black/30 rounded-xl border border-blue-500/30">
                    <ExperienceForm
                        initialData={experience.find(e => e._id === editingId)}
                        onSave={() => { setEditingId(null); onUpdate(); }}
                        onCancel={() => setEditingId(null)}
                    />
                </div>
            )}

            <div className="space-y-6">
                {experience.map((exp) => (
                    <div key={exp._id} className="relative pl-6 border-l-2 border-white/10 last:border-0">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-black"></div>

                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h4 className="text-lg font-bold text-white">{exp.company}</h4>
                                <p className="text-blue-300">{exp.role}</p>
                                <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                                    <Calendar size={14} />
                                    <span>
                                        {new Date(exp.startDate).getFullYear()} - {exp.current ? 'Present' : (exp.endDate ? new Date(exp.endDate).getFullYear() : 'N/A')}
                                    </span>
                                </div>
                                {exp.location && (
                                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                                        <MapPin size={14} />
                                        <span>{exp.location}</span>
                                    </div>
                                )}

                                {exp.description && (
                                    <>
                                        <button
                                            onClick={() => toggleExpand(exp._id!)}
                                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-white mt-2 transition-colors"
                                        >
                                            {expandedId === exp._id ? 'Hide Details' : 'View Details'}
                                            {expandedId === exp._id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                        </button>

                                        {expandedId === exp._id && (
                                            <div className="mt-4 space-y-2 bg-black/20 p-4 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
                                                <p className="text-gray-300 text-sm whitespace-pre-wrap">{exp.description}</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {isEditing && (
                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => setEditingId(exp._id!)}
                                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-blue-300 transition-colors"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(exp._id!)}
                                        className="p-1.5 bg-white/10 hover:bg-red-500/20 rounded text-red-400 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {experience.length === 0 && !isAdding && (
                    <div className="text-center text-gray-500 py-4 italic">
                        No work experience added yet.
                    </div>
                )}
            </div>
        </section>
    );
};

export default ExperienceList;
