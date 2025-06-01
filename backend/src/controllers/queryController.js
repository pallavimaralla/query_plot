const { extractChartIntent } = require('../services/aiService');
const { spawn } = require('child_process'); // Import spawn
const path = require('path'); // Import path
const fs = require('fs').promises; // Import fs for potential file operations (not strictly needed here, but common)

// Corrected Function to convert CamelCase/PascalCase to snake_case (Node.js equivalent)
function camelToSnakeCase(name) {
    // This regex inserts an underscore before each uppercase letter that is preceded by a lowercase letter or digit
    // and then converts the entire string to lowercase.
    let result = name.replace(/([a-z0-9])([A-Z])/g, '$1_$2');
    // For cases like "PetalLength", it will become "petal_Length". Now handle initial uppercase and convert all to lowercase.
    result = result.replace(/([A-Z])/g, (match, p1, offset) => {
        return offset > 0 ? '_' + p1 : p1;
    });
    return result.toLowerCase().replace(/^_/, ''); // Remove any leading underscore if one was added at the very beginning
}

module.exports = async (req, res) => {
    const { query, preview, filename } = req.body; // Filename is already provided by frontend
    console.log('📨 Received query:', query);
    console.log('📦 Received filename:', filename);

    let normalizedColumns = [];
    let originalColumns = []; // Keeping this for potential future debugging/info

    try {
        if (!filename) {
            return res.status(400).json({ error: "Filename is required to process query." });
        }

        const fullCsvFilePath = path.join(__dirname, '../../uploads', filename);

        // Call the Python script to read CSV and get JSON output
        const readCsvProcess = spawn('python3', [path.join(__dirname, '../../util/read_csv_to_json.py'), fullCsvFilePath]);
        let readCsvOutput = '';
        let readCsvError = '';

        readCsvProcess.stdout.on('data', (data) => {
            readCsvOutput += data.toString();
        });

        readCsvProcess.stderr.on('data', (data) => {
            readCsvError += data.toString();
        });

        await new Promise((resolveProcess, rejectProcess) => {
            readCsvProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error('❌ Error reading CSV to JSON in queryController:', readCsvError);
                    try {
                        const errorObj = JSON.parse(readCsvError.trim());
                        return rejectProcess(errorObj.error || `Failed to read CSV in queryController: ${readCsvError}`);
                    } catch (parseErr) {
                        return rejectProcess(`Failed to read CSV in queryController: ${readCsvError}`);
                    }
                }
                const dfJsonString = readCsvOutput.trim(); // Get the raw JSON string
                if (!dfJsonString) {
                    return rejectProcess("CSV to JSON conversion returned empty data in queryController.");
                }
                const dfData = JSON.parse(dfJsonString);
                originalColumns = dfData.columns;
                // NEW: Normalize columns using the corrected camelToSnakeCase function
                normalizedColumns = originalColumns.map(col => camelToSnakeCase(col));
                resolveProcess();
            });
        });

    } catch (err) {
        console.error('❌ Failed to get column data for LLM:', err);
        return res.status(500).json({ error: `Failed to prepare dataset for LLM: ${err.message}` });
    }

    try {
        // Pass normalizedColumns to the AI service
        const pythonCode = await extractChartIntent(query, preview, normalizedColumns);
        console.log('✅ Generated Python code:\n', pythonCode);
        res.json({ code: pythonCode });
    } catch (err) {
        console.error('❌ LLM processing failed:', err.response?.data || err.message);
        res.status(500).json({ error: 'LLM processing failed' });
    }
};