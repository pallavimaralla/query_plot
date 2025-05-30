const axios = require('axios');

/**
 * Generates Python code from a user query and dataset preview using a local Ollama model.
 * Assumes Ollama is running a model like CodeLlama on http://localhost:11434.
 * The returned code should not include pd.read_csv; the backend already loads the file.
 */

module.exports.extractChartIntent = async (query, preview) => {
    const prompt = `You are a Python data visualization expert.

You are given a dataset preview and a user query.

Assume the dataset is already loaded into a Pandas DataFrame called 'df'.
Do NOT include any line that reads or loads a CSV file (e.g., pd.read_csv).

Just generate Python code using pandas and matplotlib to fulfill the query.

Dataset Preview:
${preview}

User Query:
${query}

Only return the Python code. No explanations, no comments.`;

    try {
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'codellama',
            prompt: prompt,
            stream: false
        });

        const code = response.data.response.trim();
        console.log('✅ Code generated by CodeLlama:\n', code);
        return code;
    } catch (err) {
        console.error('❌ Ollama LLM processing failed:', err.response?.data || err.message);
        throw new Error('LLM processing failed');
    }
};
