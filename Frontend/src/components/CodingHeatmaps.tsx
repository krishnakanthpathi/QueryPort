import React, { useEffect, useState } from 'react';
import { ActivityCalendar } from 'react-activity-calendar';
import { Tooltip } from 'react-tooltip';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ExternalLink, Trophy, Star } from 'lucide-react';
import type { Profile } from '../types';

interface TitleProps {
    title: string;
    icon: React.ReactNode;
    username: string;
    link: string;
}

const SectionTitle: React.FC<TitleProps> = ({ title, icon, username, link }) => (
    <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-xl font-bold">{title}</h3>
        <a href={link} target="_blank" rel="noreferrer" className="text-sm text-gray-400 hover:text-white flex items-center gap-1 ml-auto transition-colors">
            @{username} <ExternalLink size={12} />
        </a>
    </div>
);

interface Props {
    profiles: NonNullable<Profile['codingProfiles']>;
}

const CodingHeatmaps: React.FC<Props> = ({ profiles }) => {
    // GitHub State
    const [githubData, setGithubData] = useState<any[]>([]);
    const [loadingGithub, setLoadingGithub] = useState(false);

    // LeetCode State
    const [leetcodeData, setLeetcodeData] = useState<any[]>([]);
    const [leetcodeStats, setLeetcodeStats] = useState<any>(null); // { totalSolved, easySolved, mediumSolved, hardSolved }
    const [leetcodeRating, setLeetcodeRating] = useState<any[]>([]);
    const [loadingLeetcode, setLoadingLeetcode] = useState(false);

    // Codeforces State
    const [codeforcesData, setCodeforcesData] = useState<any[]>([]);
    const [cfRating, setCfRating] = useState<any[]>([]);
    const [cfInfo, setCfInfo] = useState<any>(null);
    const [loadingCodeforces, setLoadingCodeforces] = useState(false);

    // Helpers
    const getYearData = (data: any[]) => {
        if (!data || data.length === 0) return [];
        const today = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        return data.filter(day => new Date(day.date) >= oneYearAgo);
    };

    // GitHub Fetch
    useEffect(() => {
        if (!profiles.github) return;
        setLoadingGithub(true);
        const fetchGithub = async () => {
            try {
                const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${profiles.github}?y=last`);
                const data = await res.json();

                if (data.contributions) {
                    const formatted = data.contributions.map((day: any) => ({
                        date: day.date,
                        count: day.count,
                        level: day.level
                    }));
                    setGithubData(formatted);
                } else if (data.error) {
                    console.error("GitHub API Error:", data.error);
                }
            } catch (e) {
                console.error("Failed to fetch GitHub data", e);
            } finally {
                setLoadingGithub(false);
            }
        };
        fetchGithub();
    }, [profiles.github]);

    // LeetCode Fetch
    useEffect(() => {
        if (!profiles.leetcode) return;
        setLoadingLeetcode(true);
        const fetchLeetcode = async () => {
            try {
                // Fetch Stats & Calendar
                const statsRes = await fetch(`https://leetcode-stats-api.herokuapp.com/${profiles.leetcode}`);
                const statsData = await statsRes.json();

                if (statsData.status === 'success') {
                    // Set Stats
                    setLeetcodeStats({
                        totalSolved: statsData.totalSolved,
                        easySolved: statsData.easySolved,
                        mediumSolved: statsData.mediumSolved,
                        hardSolved: statsData.hardSolved,
                        ranking: statsData.ranking
                    });

                    // Set Calendar
                    if (statsData.submissionCalendar) {
                        const calendar = statsData.submissionCalendar;
                        const formatted = Object.keys(calendar).map(timestamp => {
                            const date = new Date(parseInt(timestamp) * 1000).toISOString().split('T')[0];
                            return {
                                date,
                                count: calendar[timestamp],
                                level: Math.min(4, Math.ceil(calendar[timestamp] / 3))
                            };
                        }).sort((a, b) => a.date.localeCompare(b.date));
                        setLeetcodeData(formatted);
                    }
                }

                // Fetch Contest Rating History
                // Attempt to fetch from alfa-leetcode-api which often provides contest history
                const ratingRes = await fetch(`https://alfa-leetcode-api.onrender.com/user/${profiles.leetcode}/contest`);
                if (ratingRes.ok) {
                    const ratingData = await ratingRes.json();
                    if (ratingData.contestParticipation) {
                        const history = ratingData.contestParticipation.map((contest: any) => ({
                            contest: contest.contest.title,
                            rating: Math.round(contest.rating),
                            date: new Date(contest.contest.startTime * 1000).toLocaleDateString()
                        })).filter((c: any) => c.rating > 0); // Filter out 0 ratings
                        setLeetcodeRating(history);
                    }
                } else {
                    console.warn("Contest API returned error status:", ratingRes.status);
                }

            } catch (e) {
                console.error("Failed to fetch LeetCode data", e);
            } finally {
                setLoadingLeetcode(false);
            }
        };
        fetchLeetcode();
    }, [profiles.leetcode]);

    // Codeforces Fetch
    useEffect(() => {
        if (!profiles.codeforces) return;
        setLoadingCodeforces(true);
        const fetchCF = async () => {
            try {
                // Submissions for Heatmap
                const statusRes = await fetch(`https://codeforces.com/api/user.status?handle=${profiles.codeforces}`);
                const statusData = await statusRes.json();
                if (statusData.status === 'OK') {
                    const submissions = statusData.result;
                    const counts: Record<string, number> = {};
                    submissions.forEach((sub: any) => {
                        const date = new Date(sub.creationTimeSeconds * 1000).toISOString().split('T')[0];
                        counts[date] = (counts[date] || 0) + 1;
                    });
                    const formatted = Object.keys(counts).map(date => ({
                        date,
                        count: counts[date],
                        level: Math.min(4, Math.ceil(counts[date] / 2))
                    })).sort((a, b) => a.date.localeCompare(b.date));
                    setCodeforcesData(formatted);
                }

                // Rating History
                const ratingRes = await fetch(`https://codeforces.com/api/user.rating?handle=${profiles.codeforces}`);
                const ratingData = await ratingRes.json();
                if (ratingData.status === 'OK') {
                    const history = ratingData.result.map((contest: any) => ({
                        contest: contest.contestName,
                        rating: contest.newRating,
                        date: new Date(contest.ratingUpdateTimeSeconds * 1000).toLocaleDateString()
                    }));
                    setCfRating(history);
                }

                // User Info
                const infoRes = await fetch(`https://codeforces.com/api/user.info?handles=${profiles.codeforces}`);
                const infoData = await infoRes.json();
                if (infoData.status === 'OK') {
                    setCfInfo(infoData.result[0]);
                }

            } catch (e) {
                console.error("Failed to fetch Codeforces data", e);
            } finally {
                setLoadingCodeforces(false);
            }
        };
        fetchCF();
    }, [profiles.codeforces]);

    const theme = {
        light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
        dark: ['#2d333b', '#1a7f37', '#2ea043', '#4ac26b', '#7ce38b'], // Brighter Green ramp for dark mode
    };

    if (!Object.values(profiles).some(p => p)) return null;

    return (
        <div className="space-y-8 mt-12 mb-20">
            <h2 className="text-3xl font-bold border-b border-white/10 pb-4">Coding Activity</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* GitHub */}
                {profiles.github && (
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl lg:col-span-2">
                        <SectionTitle
                            title="GitHub"
                            icon={<div className="w-3 h-3 bg-white rounded-full"></div>} // Simple icon
                            username={profiles.github}
                            link={`https://github.com/${profiles.github}`}
                        />
                        <div className="w-full overflow-x-auto">
                            <div className="min-w-[500px]">
                                {loadingGithub ? (
                                    <div className="py-8 text-center text-gray-500 text-sm animate-pulse">Loading GitHub activity...</div>
                                ) : githubData.length > 0 ? (
                                    <>
                                        <ActivityCalendar
                                            // Ensure data is not filtered incorrectly. Since API returns last year, use raw data.
                                            data={githubData}
                                            theme={theme}
                                            colorScheme="dark"
                                            blockSize={12}
                                            blockMargin={4}
                                            fontSize={12}
                                            renderBlock={(block: React.ReactElement, activity: any) =>
                                                React.cloneElement(block as React.ReactElement<any>, {
                                                    'data-tooltip-id': 'github-tooltip',
                                                    'data-tooltip-content': `${activity.count} contributions on ${activity.date}`,
                                                } as any)
                                            }
                                        />
                                        <Tooltip id="github-tooltip" />
                                    </>
                                ) : (
                                    <div className="py-8 text-center text-gray-500 text-sm">
                                        No activity found.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* LeetCode */}
                {profiles.leetcode && (
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl lg:col-span-2">
                        <SectionTitle
                            title="LeetCode"
                            icon={<div className="w-3 h-3 bg-yellow-500 rounded-full"></div>}
                            username={profiles.leetcode}
                            link={`https://leetcode.com/${profiles.leetcode}`}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Stats & Heatmap */}
                            <div className="space-y-6">
                                {/* Stats Rows */}
                                {leetcodeStats && (
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-black/40 border border-emerald-500/20 rounded-lg p-3 text-center">
                                            <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">Easy</div>
                                            <div className="text-xl font-bold">{leetcodeStats.easySolved}</div>
                                        </div>
                                        <div className="bg-black/40 border border-yellow-500/20 rounded-lg p-3 text-center">
                                            <div className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-1">Medium</div>
                                            <div className="text-xl font-bold">{leetcodeStats.mediumSolved}</div>
                                        </div>
                                        <div className="bg-black/40 border border-red-500/20 rounded-lg p-3 text-center">
                                            <div className="text-red-400 text-xs font-bold uppercase tracking-wider mb-1">Hard</div>
                                            <div className="text-xl font-bold">{leetcodeStats.hardSolved}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Heatmap */}
                                <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                                    <h4 className="text-sm text-gray-400 mb-3 flex justify-between items-center">
                                        <span>Submission Activity</span>
                                        {leetcodeStats && <span className="text-xs text-white bg-white/10 px-2 py-1 rounded">Total: {leetcodeStats.totalSolved}</span>}
                                    </h4>
                                    <div className="w-full overflow-x-auto">
                                        <div className="min-w-[300px]">
                                            {loadingLeetcode ? (
                                                <div className="py-8 text-center text-gray-500 text-sm animate-pulse">Loading...</div>
                                            ) : getYearData(leetcodeData).length > 0 ? (
                                                <>
                                                    <ActivityCalendar
                                                        data={getYearData(leetcodeData)}
                                                        theme={{
                                                            light: ['#ebedf0', '#f0d965', '#e6c830', '#c8a815', '#a08600'],
                                                            dark: ['#2d333b', '#605210', '#a48b1d', '#d6b826', '#facc15'] // Brighter Golden Yellows
                                                        }}
                                                        colorScheme="dark"
                                                        blockSize={10}
                                                        blockMargin={3}
                                                        renderBlock={(block: React.ReactElement, activity: any) =>
                                                            React.cloneElement(block as React.ReactElement<any>, {
                                                                'data-tooltip-id': 'leetcode-tooltip',
                                                                'data-tooltip-content': `${activity.count} submissions on ${activity.date}`,
                                                            } as any)
                                                        }
                                                    />
                                                    <Tooltip id="leetcode-tooltip" />
                                                </>
                                            ) : (
                                                <div className="py-8 text-center text-gray-500 text-sm">No activity found.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contest Ratings */}
                            <div className="bg-black/30 p-4 rounded-xl border border-white/5 min-h-[300px]">
                                <h4 className="text-sm text-gray-400 mb-1 flex justify-between">
                                    <span>Contest Rating History</span>
                                    {/* {leetcodeRating.length > 0 && <span className="text-white font-bold">Max: {Math.max(...leetcodeRating.map(r => r.rating))}</span>} */}
                                </h4>
                                {leetcodeRating.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <LineChart data={leetcodeRating}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                            <XAxis dataKey="date" hide />
                                            <YAxis stroke="#666" domain={['dataMin - 50', 'dataMax + 50']} />
                                            <RechartsTooltip
                                                contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                                                itemStyle={{ color: '#facc15' }} // Yellow for LeetCode
                                            />
                                            <Line type="monotone" dataKey="rating" stroke="#facc15" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm">
                                        <div className="mb-2">No contest data available</div>
                                        <div className="text-xs opacity-60">
                                            {loadingLeetcode ? "Fetching data..." : "Attend contests to see your rating graph!"}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Codeforces Heatmap & Stats */}
                {profiles.codeforces && (
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl lg:col-span-2">
                        <SectionTitle
                            title="Codeforces"
                            icon={<div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
                            username={profiles.codeforces}
                            link={`https://codeforces.com/profile/${profiles.codeforces}`}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Heatmap */}
                            <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                                <h4 className="text-sm text-gray-400 mb-3">Submission Activity</h4>
                                <div className="w-full overflow-x-auto">
                                    <div className="min-w-[300px]">
                                        {loadingCodeforces ? (
                                            <div className="py-8 text-center text-gray-500 text-sm animate-pulse">Loading...</div>
                                        ) : getYearData(codeforcesData).length > 0 ? (
                                            <ActivityCalendar
                                                data={getYearData(codeforcesData)}
                                                theme={{
                                                    light: ['#ebedf0', '#1a3a5f', '#1d5a9e', '#3b8cea', '#80bfff'],
                                                    dark: ['#2d333b', '#1a3a5f', '#1d5a9e', '#3b8cea', '#80bfff']
                                                }}
                                                colorScheme="dark"
                                                blockSize={10}
                                                blockMargin={3}
                                            />
                                        ) : (
                                            <div className="py-8 text-center text-gray-500 text-sm">No activity found.</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Rating Graph */}
                            <div className="bg-black/30 p-4 rounded-xl border border-white/5 h-[300px]">
                                <h4 className="text-sm text-gray-400 mb-1 flex justify-between">
                                    <span>Contest Rating History</span>
                                    {cfInfo && <span className="text-white font-bold">Max Rating: {cfInfo.maxRating}</span>}
                                </h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={cfRating}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                        <XAxis dataKey="date" hide />
                                        <YAxis stroke="#666" domain={['auto', 'auto']} />
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Line type="monotone" dataKey="rating" stroke="#3b8cea" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Badges Section */}
            {(profiles.hackerrank || profiles.codechef) && (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl mt-8">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Trophy className="text-yellow-500" />
                        Badges & Achievements
                    </h3>
                    <div className="flex flex-wrap gap-8">
                        {profiles.hackerrank && (
                            <div className="flex flex-col items-center gap-3">
                                <a href={`https://www.hackerrank.com/${profiles.hackerrank}`} target="_blank" rel="noreferrer" className="transform hover:scale-105 transition-transform">
                                    <img
                                        src={`https://hackerrank-badge.vercel.app/api?username=${profiles.hackerrank}`}
                                        alt="HackerRank Badge"
                                        className="h-32"
                                    />
                                </a>
                                <p className="text-sm text-gray-400">HackerRank</p>
                            </div>
                        )}
                        {/* CodeChef doesn't have a reliable badge generator API. We'll use a link card. */}
                        {profiles.codechef && (
                            <a href={`https://www.codechef.com/users/${profiles.codechef}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center w-32 h-32 bg-black/40 border border-white/20 rounded-xl hover:bg-white/10 transition-colors group">
                                <Star size={32} className="text-amber-700 mb-2 group-hover:text-amber-500 transition-colors" />
                                <span className="font-bold">CodeChef</span>
                                <span className="text-xs text-gray-500 group-hover:text-gray-300">View Profile</span>
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CodingHeatmaps;
