import React, { useEffect, useState } from 'react';
import { ActivityCalendar } from 'react-activity-calendar';
import { Tooltip } from 'react-tooltip';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ExternalLink, Trophy, Star, Code, Activity, TrendingUp } from 'lucide-react';
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
                const ratingRes = await fetch(`https://alfa-leetcode-api.onrender.com/${profiles.leetcode}/contest`);
                if (ratingRes.ok) {
                    const ratingData = await ratingRes.json();

                    // Update stats with contest info if available
                    if (ratingData.contestRating) {
                        setLeetcodeStats((prev: any) => ({
                            ...prev,
                            contestRating: ratingData.contestRating,
                            contestGlobalRanking: ratingData.contestGlobalRanking,
                            contestBadge: ratingData.contestBadges?.name
                        }));
                    }

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
                        <div className="flex flex-col gap-8">
                            {/* Top Section: Heatmap (Left) & Stats (Right) */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                                {/* Left: Heatmap & Activity */}
                                <div className="lg:col-span-2 bg-black/30 p-6 rounded-xl border border-white/5 flex flex-col justify-center">
                                    <h4 className="text-sm text-gray-400 mb-4 font-medium flex items-center gap-2">
                                        <Activity size={16} />
                                        Submission Activity
                                    </h4>
                                    <div className="w-full overflow-x-auto">
                                        <div className="min-w-[500px]">
                                            {loadingLeetcode ? (
                                                <div className="py-12 text-center text-gray-500 text-sm animate-pulse">Loading activity...</div>
                                            ) : getYearData(leetcodeData).length > 0 ? (
                                                <>
                                                    <ActivityCalendar
                                                        data={getYearData(leetcodeData)}
                                                        theme={{
                                                            light: ['#ebedf0', '#f0d965', '#e6c830', '#c8a815', '#a08600'],
                                                            dark: ['#2d333b', '#605210', '#a48b1d', '#d6b826', '#facc15']
                                                        }}
                                                        colorScheme="dark"
                                                        blockSize={13}
                                                        blockMargin={4}
                                                        fontSize={12}
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
                                                <div className="py-12 text-center text-gray-500 text-sm">No activity found.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Stats & Breakdown */}
                                <div className="space-y-4">
                                    {/* Total Solved Card */}
                                    {leetcodeStats && (
                                        <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-xl p-6 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <Trophy size={64} />
                                            </div>
                                            <div className="relative z-10">
                                                <div className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Total Solved</div>
                                                <div className="text-4xl font-black text-white">{leetcodeStats.totalSolved}</div>
                                                <div className="text-xs text-gray-500 mt-2">Questions conquered across all difficulties</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Difficulty Grid */}
                                    {leetcodeStats && (
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="bg-black/40 border border-emerald-500/20 rounded-lg p-3 text-center hover:bg-emerald-500/5 transition-colors">
                                                <div className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-1">Easy</div>
                                                <div className="text-lg font-bold">{leetcodeStats.easySolved}</div>
                                            </div>
                                            <div className="bg-black/40 border border-yellow-500/20 rounded-lg p-3 text-center hover:bg-yellow-500/5 transition-colors">
                                                <div className="text-yellow-400 text-[10px] font-bold uppercase tracking-wider mb-1">Medium</div>
                                                <div className="text-lg font-bold">{leetcodeStats.mediumSolved}</div>
                                            </div>
                                            <div className="bg-black/40 border border-red-500/20 rounded-lg p-3 text-center hover:bg-red-500/5 transition-colors">
                                                <div className="text-red-400 text-[10px] font-bold uppercase tracking-wider mb-1">Hard</div>
                                                <div className="text-lg font-bold">{leetcodeStats.hardSolved}</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Contest Info Card (Compact) */}
                                    {leetcodeStats?.contestRating && (
                                        <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-xl p-4 flex items-center justify-between">
                                            <div>
                                                <div className="text-orange-400 text-[10px] font-bold uppercase tracking-wider mb-1">Contest Rating</div>
                                                <div className="text-xl font-bold text-white flex items-baseline gap-2">
                                                    {Math.round(leetcodeStats.contestRating)}
                                                    {leetcodeStats.contestBadge && (
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                                                            {leetcodeStats.contestBadge}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-gray-500 mt-1">Global Rank: #{leetcodeStats.contestGlobalRanking?.toLocaleString()}</div>
                                            </div>
                                            <Trophy className="text-orange-500 opacity-80" size={24} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Bottom Section: Contest Graph */}
                            <div className="bg-black/30 p-6 rounded-xl border border-white/5 min-h-[300px]">
                                <h4 className="text-sm text-gray-400 mb-6 flex justify-between items-center">
                                    <span className="flex items-center gap-2">
                                        <TrendingUp size={16} /> Contest Rating History
                                    </span>
                                </h4>
                                {leetcodeRating.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={leetcodeRating} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                stroke="#666"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                minTickGap={30}
                                            />
                                            <YAxis
                                                stroke="#666"
                                                fontSize={12}
                                                domain={['dataMin - 100', 'dataMax + 100']}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <RechartsTooltip
                                                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                                                itemStyle={{ color: '#facc15' }}
                                                labelStyle={{ color: '#999', marginBottom: '4px' }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="rating"
                                                stroke="#facc15"
                                                strokeWidth={3}
                                                dot={false}
                                                activeDot={{ r: 6, fill: '#facc15', stroke: '#000', strokeWidth: 2 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[250px] flex flex-col items-center justify-center text-gray-500 text-sm">
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

            {/* Empty State */}
            {!profiles.github && !profiles.leetcode && !profiles.codeforces && !profiles.hackerrank && !profiles.codechef && (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 shadow-xl text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-4 text-gray-400">
                        <Code size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No coding profiles added</h3>
                    <p className="text-gray-400 max-w-md mx-auto mb-6">
                        Connect your GitHub, LeetCode, Codeforces, and other coding profiles to showcase your activity heatmaps and stats here.
                    </p>
                    <div className="text-sm text-gray-500 bg-white/5 inline-block px-4 py-2 rounded-lg border border-white/10">
                        Click <span className="text-white font-medium">Edit Profile</span> to add your usernames
                    </div>
                </div>
            )}

        </div>
    );
};

export default CodingHeatmaps;
