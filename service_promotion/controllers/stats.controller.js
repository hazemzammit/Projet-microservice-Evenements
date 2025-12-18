import { getStatsService } from "../services/stats.service.js";

export const getStats = async (req, res) => {
    try {
        const stats = await getStatsService();
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};