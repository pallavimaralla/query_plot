const { getChartPath } = require('../services/redisService');
const path = require('path');

module.exports = async (req, res) => {
    const key = req.params.key;
    if (!key) {
        return res.status(400).json({ error: 'No chart key provided' });
    }
    const filePath = await getChartPath(key);
    if (filePath) {
        res.download(path.resolve(filePath));
    } else {
        res.status(404).json({ error: 'Chart not found' });
    }
};
