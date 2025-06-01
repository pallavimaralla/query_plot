const { runPython } = require('../services/pythonExecutor');

module.exports = async (req, res) => {
    const { filename, code } = req.body;
    console.log('📦 Received filename:', filename);
    try {
        const resultKey = await runPython(filename, code);
        res.status(200).json({ key: resultKey });
    } catch (err) {
        console.error('❌ Python sandbox error:', err);
        res.status(500).json({ error: 'Python execution failed' });
    }
};