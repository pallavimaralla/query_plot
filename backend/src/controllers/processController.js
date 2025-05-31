const { runPython } = require('../services/pythonExecutor');

module.exports = async (req, res) => {
    const { filename, code } = req.body;
    try {
        const resultKey = await runPython(filename, code);
        res.json({ filename: resultKey }); // Return as filename for frontend compatibility
    } catch (err) {
        res.status(500).json({ error: 'Python execution failed' });
    }
};