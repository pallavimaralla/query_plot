const { getChartPath } = require('../services/redisService');
const path = require('path');

module.exports = async (req, res) => {
    const key = req.params.key;
    const filePath = await getChartPath(key);
    if (filePath) {
        res.download(path.resolve(filePath));
    } else {
        res.status(404).json({ error: 'Chart not found' });
    }
};
