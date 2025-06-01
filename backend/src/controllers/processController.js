const { runPython } = require('../services/pythonExecutor');

module.exports = async (req, res) => {
    const { filename, code } = req.body;
    console.log('📦 Received filename:', filename);
    try {
        const resultKey = await runPython(filename, code);
        if (!resultKey) {
            console.error('❌ No chart key returned from runPython');
            return res.status(500).json({ error: 'No chart key returned from backend.' });
        }
        console.log('Returning key:', resultKey);
        res.status(200).json({ key: resultKey });
    } catch (err) {
        console.error('❌ Python sandbox error:', err);
        res.status(500).json({ error: 'Python execution failed' });
    }
};