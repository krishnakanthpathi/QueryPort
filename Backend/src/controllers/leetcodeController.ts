import type { Request, Response } from 'express';
import axios from 'axios';

export const getLeetCodeData = async (req: Request, res: Response) => {
    const { query, variables } = req.body;

    try {
        const response = await axios.post('https://leetcode.com/graphql',
            { query, variables },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Referer': 'https://leetcode.com',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            }
        );

        res.json(response.data);
    } catch (error: any) {
        console.error('Error fetching LeetCode data:', error.message);
        res.status(500).json({ error: 'Failed to fetch LeetCode data' });
    }
};
