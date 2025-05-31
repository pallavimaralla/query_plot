const Redis = require('ioredis');
const redis = new Redis();

module.exports.getChartPath = async (key) => {
    return await redis.get(`chart:${key}`);
};

module.exports.saveChartPath = async (key, filePath) => {
    await redis.set(`chart:${key}`, filePath);
};
