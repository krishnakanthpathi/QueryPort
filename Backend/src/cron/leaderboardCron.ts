import cron from 'node-cron';
import { syncAllLeaderboardStats } from '../controllers/leaderboardController.js';

/** Cron schedule: every Sunday at 3:00 AM (server local time). */
const LEADERBOARD_CRON_SCHEDULE = '0 3 * * 0';

/** Delay between each user sync to avoid rate limits from LeetCode / Codeforces / HackerRank (ms). */
const DELAY_BETWEEN_USERS_MS = 2000;

let scheduledTask: cron.ScheduledTask | null = null;

/**
 * Start the weekly leaderboard sync daemon.
 * Syncs all users' stats (CGPA, LeetCode, Codeforces, HackerRank, likes) once per week.
 */
export function startLeaderboardCron(): void {
    if (scheduledTask) {
        console.log('[Leaderboard cron] Already scheduled.');
        return;
    }
    scheduledTask = cron.schedule(LEADERBOARD_CRON_SCHEDULE, async () => {
        console.log('[Leaderboard cron] Starting weekly sync...');
        try {
            await syncAllLeaderboardStats({ delayBetweenUsersMs: DELAY_BETWEEN_USERS_MS });
        } catch (err) {
            console.error('[Leaderboard cron] Weekly sync failed:', err);
        }
    });
    console.log('[Leaderboard cron] Scheduled weekly (every Sunday at 3:00 AM).');
}

/**
 * Stop the weekly leaderboard sync daemon.
 */
export function stopLeaderboardCron(): void {
    if (scheduledTask) {
        scheduledTask.stop();
        scheduledTask = null;
        console.log('[Leaderboard cron] Stopped.');
    }
}
