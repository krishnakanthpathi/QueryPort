import React, { useState, useCallback } from 'react';
import { api } from '../lib/api';
import { Download, ChevronDown, ChevronUp, FileSpreadsheet } from 'lucide-react';
import { useToast } from './Toast';

interface LeaderboardUser {
    _id: string;
    type?: string;
    user: {
        _id: string;
        name: string;
        username: string;
        avatar: string;
    };
    stats: {
        totalLikes: number;
        leetcode?: { solved: number };
        codeforces?: { rating: number };
        hackerrank?: { badges: number };
        github?: { contributions: number };
        cgpa?: number;
    };
}

const SORT_OPTIONS = [
    { value: 'likes:desc', label: 'Total Likes (desc)' },
    { value: 'cgpa:desc', label: 'CGPA (desc)' },
    { value: 'leetcode:desc', label: 'LeetCode Solved (desc)' },
    { value: 'codeforces:desc', label: 'Codeforces Rating (desc)' },
    { value: 'hackerrank:desc', label: 'HackerRank Badges (desc)' },
];

const COLUMN_OPTIONS = [
    { key: 'rank', label: 'Rank' },
    { key: 'name', label: 'Name' },
    { key: 'username', label: 'Username' },
    { key: 'type', label: 'Type' },
    { key: 'totalLikes', label: 'Total Likes' },
    { key: 'cgpa', label: 'CGPA' },
    { key: 'lcSolved', label: 'LC Solved' },
    { key: 'cfRating', label: 'CF Rating' },
    { key: 'hrBadges', label: 'HR Badges' },
];

const AdvancedReport: React.FC = () => {
    const { showToast } = useToast();
    const [downloading, setDownloading] = useState(false);
    const [previewCount, setPreviewCount] = useState<number | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [showMoreFilters, setShowMoreFilters] = useState(false);

    const [filters, setFilters] = useState({
        type: 'All',
        search: '',
        sortBy: 'likes:desc',
        minCgpa: '',
        maxCgpa: '',
        minLeetcode: '',
        maxLeetcode: '',
        minCodeforces: '',
        maxCodeforces: '',
        minHackerrank: '',
        maxHackerrank: '',
        minLikes: '',
        credentialId: '',
        issuingOrganization: '',
        certificationName: '',
        institution: '',
        degree: '',
        fieldOfStudy: '',
        currentStudent: false,
        company: '',
        role: '',
        hasCurrentJob: false,
        achievementOrganization: '',
        achievementTitle: '',
        projectCategory: '',
        minPublishedProjects: '',
        hasResume: false,
        hasLocation: false,
        skillId: '',
        skillSearch: '',
    });

    const [columns, setColumns] = useState<Record<string, boolean>>(
        COLUMN_OPTIONS.reduce((acc, c) => ({ ...acc, [c.key]: true }), {})
    );

    const buildQueryString = useCallback(() => {
        const params = new URLSearchParams();
        params.set('limit', '1000');
        params.set('export', '1');
        params.set('sortBy', filters.sortBy);
        if (filters.type && filters.type !== 'All') params.set('type', filters.type);
        if (filters.search.trim()) params.set('search', filters.search.trim());
        if (filters.minCgpa !== '') params.set('minCgpa', filters.minCgpa);
        if (filters.maxCgpa !== '') params.set('maxCgpa', filters.maxCgpa);
        if (filters.minLeetcode !== '') params.set('minLeetcode', filters.minLeetcode);
        if (filters.maxLeetcode !== '') params.set('maxLeetcode', filters.maxLeetcode);
        if (filters.minCodeforces !== '') params.set('minCodeforces', filters.minCodeforces);
        if (filters.maxCodeforces !== '') params.set('maxCodeforces', filters.maxCodeforces);
        if (filters.minHackerrank !== '') params.set('minHackerrank', filters.minHackerrank);
        if (filters.maxHackerrank !== '') params.set('maxHackerrank', filters.maxHackerrank);
        if (filters.minLikes !== '') params.set('minLikes', filters.minLikes);
        if (filters.credentialId.trim()) params.set('credentialId', filters.credentialId.trim());
        if (filters.issuingOrganization.trim()) params.set('issuingOrganization', filters.issuingOrganization.trim());
        if (filters.certificationName.trim()) params.set('certificationName', filters.certificationName.trim());
        if (filters.institution.trim()) params.set('institution', filters.institution.trim());
        if (filters.degree.trim()) params.set('degree', filters.degree.trim());
        if (filters.fieldOfStudy.trim()) params.set('fieldOfStudy', filters.fieldOfStudy.trim());
        if (filters.currentStudent) params.set('currentStudent', '1');
        if (filters.company.trim()) params.set('company', filters.company.trim());
        if (filters.role.trim()) params.set('role', filters.role.trim());
        if (filters.hasCurrentJob) params.set('hasCurrentJob', '1');
        if (filters.achievementOrganization.trim()) params.set('achievementOrganization', filters.achievementOrganization.trim());
        if (filters.achievementTitle.trim()) params.set('achievementTitle', filters.achievementTitle.trim());
        if (filters.projectCategory) params.set('projectCategory', filters.projectCategory);
        if (filters.minPublishedProjects !== '') params.set('minPublishedProjects', filters.minPublishedProjects);
        if (filters.hasResume) params.set('hasResume', '1');
        if (filters.hasLocation) params.set('hasLocation', '1');
        if (filters.skillId) params.set('skillId', filters.skillId);
        return params.toString();
    }, [filters]);

    const fetchPreview = async () => {
        setLoadingPreview(true);
        try {
            const qs = buildQueryString().replace('limit=1000', 'limit=1').replace('export=1', '');
            const data = await api.get(`/leaderboard?${qs}`);
            const total = (data as { total?: number }).total;
            setPreviewCount(typeof total === 'number' ? total : (data.data?.length ?? 0));
        } catch (e) {
            setPreviewCount(null);
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const qs = buildQueryString();
            const data = await api.get(`/leaderboard?${qs}`);
            const downloadUsers: LeaderboardUser[] = data.data || [];

            const activeCols = COLUMN_OPTIONS.filter(c => columns[c.key]);
            const headers = activeCols.map(c => c.label);
            const csvRows = downloadUsers.map((u, i) => {
                const row: (string | number)[] = [];
                if (columns.rank) row.push(i + 1);
                if (columns.name) row.push(`"${(u.user?.name || '').replace(/"/g, '""')}"`);
                if (columns.username) row.push(u.user?.username || '');
                if (columns.type) row.push(u.type || 'N/A');
                if (columns.totalLikes) row.push(u.stats?.totalLikes ?? 0);
                if (columns.cgpa) row.push(u.stats?.cgpa ?? 0);
                if (columns.lcSolved) row.push(u.stats?.leetcode?.solved ?? 0);
                if (columns.cfRating) row.push(u.stats?.codeforces?.rating ?? 0);
                if (columns.hrBadges) row.push(u.stats?.hackerrank?.badges ?? 0);
                return row.join(',');
            });
            const csvContent = [headers.join(','), ...csvRows].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `queryport_report_${new Date().toISOString().split('T')[0]}.csv`;
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            showToast(`Downloaded ${downloadUsers.length} rows`, 'success');
        } catch (error) {
            console.error('Download failed', error);
            showToast('Failed to download report', 'error');
        } finally {
            setDownloading(false);
        }
    };

    const updateFilter = (key: keyof typeof filters, value: string | boolean) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="min-h-screen pt-28 pb-12 bg-black text-white px-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <FileSpreadsheet className="text-emerald-400" size={28} />
                    <div>
                        <h1 className="text-2xl font-bold text-white">Advanced Report</h1>
                        <p className="text-gray-400 text-sm">Filter by stats, certifications, education, experience, and more. Export as CSV.</p>
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6">
                    {/* Basic filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Type</label>
                            <select
                                value={filters.type}
                                onChange={e => updateFilter('type', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-1 focus:ring-white/30"
                            >
                                <option value="All" className="bg-gray-900">All</option>
                                <option value="Student" className="bg-gray-900">Student</option>
                                <option value="Professional" className="bg-gray-900">Professional</option>
                                <option value="Other" className="bg-gray-900">Other</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs text-gray-400 mb-1">Search (name / username)</label>
                            <input
                                type="text"
                                value={filters.search}
                                onChange={e => updateFilter('search', e.target.value)}
                                placeholder="Search..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-1 focus:ring-white/30 placeholder-gray-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Sort by</label>
                            <select
                                value={filters.sortBy}
                                onChange={e => updateFilter('sortBy', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-1 focus:ring-white/30"
                            >
                                {SORT_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value} className="bg-gray-900">{o.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Stats ranges */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-300 mb-3">Stats (optional ranges)</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                            <div className="space-y-1">
                                <div className="text-xs text-gray-400">CGPA</div>
                                <div className="flex gap-2">
                                    <input type="number" step="any" placeholder="Min" value={filters.minCgpa} onChange={e => updateFilter('minCgpa', e.target.value)} className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500" />
                                    <input type="number" step="any" placeholder="Max" value={filters.maxCgpa} onChange={e => updateFilter('maxCgpa', e.target.value)} className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-xs text-gray-400">LeetCode solved</div>
                                <div className="flex gap-2">
                                    <input type="number" step="1" placeholder="Min" value={filters.minLeetcode} onChange={e => updateFilter('minLeetcode', e.target.value)} className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500" />
                                    <input type="number" step="1" placeholder="Max" value={filters.maxLeetcode} onChange={e => updateFilter('maxLeetcode', e.target.value)} className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-xs text-gray-400">Codeforces rating</div>
                                <div className="flex gap-2">
                                    <input type="number" step="1" placeholder="Min" value={filters.minCodeforces} onChange={e => updateFilter('minCodeforces', e.target.value)} className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500" />
                                    <input type="number" step="1" placeholder="Max" value={filters.maxCodeforces} onChange={e => updateFilter('maxCodeforces', e.target.value)} className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-xs text-gray-400">HackerRank badges</div>
                                <div className="flex gap-2">
                                    <input type="number" step="1" placeholder="Min" value={filters.minHackerrank} onChange={e => updateFilter('minHackerrank', e.target.value)} className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500" />
                                    <input type="number" step="1" placeholder="Max" value={filters.maxHackerrank} onChange={e => updateFilter('maxHackerrank', e.target.value)} className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-xs text-gray-400">Min project likes</div>
                                <input type="number" step="1" placeholder="e.g. 5" value={filters.minLikes} onChange={e => updateFilter('minLikes', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500" />
                            </div>
                        </div>
                    </div>

                    {/* More filters toggle */}
                    <div>
                        <button type="button" onClick={() => setShowMoreFilters(!showMoreFilters)} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm">
                            {showMoreFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            More filters (certification, education, experience, achievement, project, profile)
                        </button>
                        {showMoreFilters && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Certificate number (credentialId)</label>
                                    <input type="text" value={filters.credentialId} onChange={e => updateFilter('credentialId', e.target.value)} placeholder="e.g. ABC123" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Issuing organization</label>
                                    <input type="text" value={filters.issuingOrganization} onChange={e => updateFilter('issuingOrganization', e.target.value)} placeholder="e.g. AWS" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Certification name</label>
                                    <input type="text" value={filters.certificationName} onChange={e => updateFilter('certificationName', e.target.value)} placeholder="Partial match" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Institution</label>
                                    <input type="text" value={filters.institution} onChange={e => updateFilter('institution', e.target.value)} placeholder="e.g. MIT" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Degree</label>
                                    <input type="text" value={filters.degree} onChange={e => updateFilter('degree', e.target.value)} placeholder="e.g. B.Tech" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Field of study</label>
                                    <input type="text" value={filters.fieldOfStudy} onChange={e => updateFilter('fieldOfStudy', e.target.value)} placeholder="e.g. Computer Science" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="currentStudent" checked={filters.currentStudent} onChange={e => updateFilter('currentStudent', e.target.checked)} className="rounded bg-white/5 border-white/10" />
                                    <label htmlFor="currentStudent" className="text-sm text-gray-300">Current student</label>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Company</label>
                                    <input type="text" value={filters.company} onChange={e => updateFilter('company', e.target.value)} placeholder="Experience company" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Role</label>
                                    <input type="text" value={filters.role} onChange={e => updateFilter('role', e.target.value)} placeholder="Job role" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="hasCurrentJob" checked={filters.hasCurrentJob} onChange={e => updateFilter('hasCurrentJob', e.target.checked)} className="rounded bg-white/5 border-white/10" />
                                    <label htmlFor="hasCurrentJob" className="text-sm text-gray-300">Has current job</label>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Achievement organization</label>
                                    <input type="text" value={filters.achievementOrganization} onChange={e => updateFilter('achievementOrganization', e.target.value)} placeholder="Partial match" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Achievement title</label>
                                    <input type="text" value={filters.achievementTitle} onChange={e => updateFilter('achievementTitle', e.target.value)} placeholder="Partial match" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Project category</label>
                                    <select value={filters.projectCategory} onChange={e => updateFilter('projectCategory', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                                        <option value="" className="bg-gray-900">Any</option>
                                        <option value="personal" className="bg-gray-900">Personal</option>
                                        <option value="professional" className="bg-gray-900">Professional</option>
                                        <option value="others" className="bg-gray-900">Others</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Min published projects</label>
                                    <input type="number" min={1} value={filters.minPublishedProjects} onChange={e => updateFilter('minPublishedProjects', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="hasResume" checked={filters.hasResume} onChange={e => updateFilter('hasResume', e.target.checked)} className="rounded bg-white/5 border-white/10" />
                                    <label htmlFor="hasResume" className="text-sm text-gray-300">Has resume</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="hasLocation" checked={filters.hasLocation} onChange={e => updateFilter('hasLocation', e.target.checked)} className="rounded bg-white/5 border-white/10" />
                                    <label htmlFor="hasLocation" className="text-sm text-gray-300">Has location</label>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Skill (skill ID)</label>
                                    <input type="text" value={filters.skillId} onChange={e => updateFilter('skillId', e.target.value)} placeholder="Paste skill ID from Skills page" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Column selection */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-300 mb-2">CSV columns</h3>
                        <div className="flex flex-wrap gap-3">
                            {COLUMN_OPTIONS.map(c => (
                                <label key={c.key} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                    <input type="checkbox" checked={columns[c.key]} onChange={e => setColumns(prev => ({ ...prev, [c.key]: e.target.checked }))} className="rounded bg-white/5 border-white/10" />
                                    {c.label}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/10">
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-xl transition-colors disabled:opacity-50 font-medium"
                        >
                            <Download size={18} className={downloading ? 'animate-bounce' : ''} />
                            {downloading ? 'Exporting...' : 'Download CSV'}
                        </button>
                        <button
                            type="button"
                            onClick={fetchPreview}
                            disabled={loadingPreview}
                            className="px-4 py-2 bg-white/5 text-gray-300 hover:bg-white/10 rounded-xl text-sm"
                        >
                            {loadingPreview ? 'Checking...' : 'Preview count'}
                        </button>
                        {previewCount !== null && !loadingPreview && <span className="text-gray-400 text-sm">~{previewCount} rows match</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvancedReport;
