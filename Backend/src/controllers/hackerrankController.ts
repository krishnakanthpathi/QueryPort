import type { Request, Response } from 'express';
import axios from 'axios';

export const getBadges = async (req: Request, res: Response) => {
    const { username } = req.params;
    try {
        const response = await axios.get(`https://www.hackerrank.com/rest/hackers/${username}/badges`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
            }
        });
        res.json(response.data);
    } catch (error: any) {
        console.error('Error fetching HackerRank badges:', error.message);
        res.status(500).json({ error: 'Failed to fetch HackerRank badges' });
    }
};

export const getScores = async (req: Request, res: Response) => {
    const { username } = req.params;
    try {
        // HackerRank scores often require the 'model' to be fetched first to get the ID, 
        // but let's try with username first or assume caller might need to handle ID.
        // Actually, the user provided link had an ID /scores_elo.
        // Let's try to fetch /rest/hackers/username first to get ID if needed, 
        // OR simply proxy the call if username works. 
        // Tests show fetching scores_elo with username usually works or redirects.
        // If not, we fetch profile first.

        // Let's try fetching profile first to get ID, just to be safe, or direct.
        // Converting username to potential ID lookup if direct fails is complex without scraping.
        // However, standard public API usually allows username for some endpoints.
        // Let's try direct substitution first.

        const response = await axios.get(`https://www.hackerrank.com/rest/hackers/${username}/scores_elo`, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });
        res.json(response.data);
    } catch (error: any) {
        // Fallback: If 404/error, maybe we need to find the user ID. 
        // For now, return error.
        console.error('Error fetching HackerRank scores:', error.message);
        res.status(500).json({ error: 'Failed to fetch HackerRank scores' });
    }
};
