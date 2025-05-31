const { extractChartIntent } = require('../services/aiService');

module.exports = async (req, res) => {
    const { query, preview } = req.body;
    console.log('📨 Received query:', query);

    try {
        const pythonCode = await extractChartIntent(query, preview);
        console.log('✅ Generated Python code:\n', pythonCode);
        res.json({ code: pythonCode });
    } catch (err) {
        console.error('❌ LLM processing failed:', err.response?.data || err.message);
        res.status(500).json({ error: 'LLM processing failed' });
    }
};