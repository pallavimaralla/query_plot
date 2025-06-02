const { getRecentQueriesByFilename } = require('../services/postgresService');

module.exports = async (req, res) => {
    const { filename } = req.query;
    if (!filename) return res.status(400).json({ error: 'Missing filename' });

    try {
        const recentQueries = await getRecentQueriesByFilename(filename);
        res.json({ recentQueries });
    } catch (err) {
        console.error('Error fetching recent queries:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
