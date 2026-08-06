const { extractChartIntent } = require('../services/aiService');
const { spawn } = require('child_process');
const path = require('path');
const { saveQuery } = require('../services/postgresService');

function camelToSnakeCase(name) {
    let result = name.replace(/([a-z0-9])([A-Z])/g, '$1_$2');
    result = result.replace(/([A-Z])/g, (match, p1, offset) => {
        return offset > 0 ? '_' + p1 : p1;
    });
    return result.toLowerCase().replace(/^_/, '');
}

module.exports = async (req, res) => {
    const { query, preview, filename, originalFilename } = req.body;


    console.log('📨 Received query:', query);
    console.log('📦 Received filename:', filename);

    if (!filename) {
        return res.status(400).json({ error: "Filename is required to process query." });
    }

    const fullCsvFilePath = path.join(__dirname, '../../uploads', filename);
    console.log("📂 CSV file path being read:", fullCsvFilePath);

    let normalizedColumns = [];
    let originalColumns = [];
    let dfData = null;

    try {
        const readCsvProcess = spawn('/opt/homebrew/bin/python3', [path.join(__dirname, '../../util/read_csv_to_json.py'), fullCsvFilePath]);
        let readCsvOutput = '';
        let readCsvError = '';

        readCsvProcess.stdout.on('data', (data) => {
            readCsvOutput += data.toString();
        });

        readCsvProcess.stderr.on('data', (data) => {
            readCsvError += data.toString();
        });

        await new Promise((resolve, reject) => {
            readCsvProcess.on('close', (code) => {
                if (code !== 0) {
                    try {
                        const errorObj = JSON.parse(readCsvError.trim());
                        return reject(errorObj.error || `Failed to read CSV: ${readCsvError}`);
                    } catch (parseErr) {
                        return reject(`Failed to read CSV: ${readCsvError}`);
                    }
                }
                dfData = JSON.parse(readCsvOutput.trim());
                originalColumns = dfData.columns;
                normalizedColumns = originalColumns.map(col => camelToSnakeCase(col));
                resolve();
            });
        });
    } catch (err) {
        console.error('❌ Failed to prepare data for Python execution:', err);
        return res.status(500).json({ error: `Failed to prepare dataset: ${err}` });
    }

    try {
        // Generate a detailed preview with sample data
        const sampleRows = dfData.data.slice(0, 3);

        const dataPreview = `
Dataset Information:
- Total rows: ${dfData.data.length}
- Columns (snake_case): ${normalizedColumns.join(', ')}

Sample Data:
${normalizedColumns.map((col, idx) => col).join(' | ')}
${sampleRows.map(row => normalizedColumns.map((_, idx) => row[idx]).join(' | ')).join('\n')}

Column Mapping (Original → Snake Case):
${originalColumns.map((orig, idx) => `${orig} → ${normalizedColumns[idx]}`).join('\n')}
`;

        const pythonCode = await extractChartIntent(query, dataPreview, normalizedColumns);
        console.log('✅ Generated Python code:\n', pythonCode);

        // Save query for original (non-timestamped) file name
        const cleanOriginalName = originalFilename || filename.split('-').slice(1).join('-');
        await saveQuery(cleanOriginalName, query, pythonCode);

        res.json({ code: pythonCode });
    } catch (err) {
        console.error('❌ LLM processing failed:', err.response?.data || err.message);
        res.status(500).json({ error: 'LLM processing failed' });
    }
};
