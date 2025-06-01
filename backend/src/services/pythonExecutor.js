const { spawn } = require('child_process');
const { saveChartPath } = require('./redisService');
const path = require('path');
const fs = require('fs').promises; // Import fs.promises for async file operations

module.exports.runPython = (filename, code) => {
    return new Promise(async (resolve, reject) => {
        // Construct full path to the uploaded CSV file
        const fullCsvFilePath = path.join(__dirname, '../../uploads', filename);

        let dfJsonString = ''; // This will hold the JSON string representation of the DataFrame
        try {
            // Step 1: Read the CSV file and convert it to JSON string using read_csv_to_json.py
            const readCsvProcess = spawn('python3', [path.join(__dirname, '../../util/read_csv_to_json.py'), fullCsvFilePath]);
            let readCsvOutput = '';
            let readCsvError = '';

            readCsvProcess.stdout.on('data', (data) => {
                readCsvOutput += data.toString();
            });

            readCsvProcess.stderr.on('data', (data) => {
                readCsvError += data.toString();
            });

            await new Promise((res, rej) => {
                readCsvProcess.on('close', (code) => {
                    if (code !== 0) {
                        console.error('❌ Error reading CSV to JSON:', readCsvError);
                        // Attempt to parse error from stderr if it's JSON from the Python script
                        try {
                            const errorObj = JSON.parse(readCsvError.trim());
                            return rej(errorObj.error || `Failed to read CSV to JSON: ${readCsvError}`);
                        } catch (parseErr) {
                            return rej(`Failed to read CSV to JSON: ${readCsvError}`);
                        }
                    }
                    dfJsonString = readCsvOutput.trim(); // Get the raw JSON string from stdout
                    res();
                });
            });

            if (!dfJsonString) {
                return reject("CSV to JSON conversion returned empty data.");
            }

        } catch (err) {
            console.error('❌ Failed to prepare data for Python execution:', err);
            return reject(`Failed to prepare data for Python execution: ${err.message}`);
        }

        let safeCode = code;

        // --- FIX: Simpler and more explicit markdown fence removal ---
        safeCode = safeCode
            .split('\n')
            .filter(line => {
                const trimmedLine = line.trim();
                // Remove lines that are exactly '```python' or '```' (case-insensitive for robustness)
                if (trimmedLine.toLowerCase() === '```python' || trimmedLine === '```') {
                    return false;
                }
                // Also remove lines containing 'pd.read_csv' and any lines that become empty after trimming
                return !trimmedLine.includes('pd.read_csv') && trimmedLine !== '';
            })
            .join('\n');

        // Final trim of the entire code block
        safeCode = safeCode.trim();

        // Aggressive cleaning for invisible Unicode characters (kept as a safeguard)
        safeCode = safeCode.replace(/[\u00A0\uFEFF\u200B-\u200D\u2060\u202F]/g, ' ').replace(/[^\x00-\x7F\n\r\t ]/g, '');
        // --- END FIX ---


        console.log('👨‍💻 Final Python code being executed:\n', safeCode);

        // Debug initial char codes again for final verification
        let charCodes = [];
        for (let i = 0; i < Math.min(safeCode.length, 10); i++) {
            charCodes.push(safeCode.charCodeAt(i));
        }
        console.error(`DEBUG: safeCode initial char codes: [${charCodes.join(', ')}]`);


        const chartFileName = `chart_${Date.now()}.png`; // Generate unique chart file name
        const chartSavePathRelative = path.join('charts', chartFileName);
        const chartSavePathAbsolute = path.join(__dirname, '../../', chartSavePathRelative);

        // Ensure chart directory exists before Python script tries to save
        const chartDir = path.dirname(chartSavePathAbsolute);
        try {
            await fs.mkdir(chartDir, { recursive: true });
        } catch (dirErr) {
            console.error('❌ Failed to create chart directory:', dirErr);
            return reject('Failed to create chart directory');
        }

        // Step 2: Execute sandbox_processor.py
        // Pass dfJsonString and chartSavePathAbsolute as arguments, code via stdin
        const py = spawn('python3', [
            path.join(__dirname, '../../python/sandbox_processor.py'),
            dfJsonString,         // Argument 1: DataFrame JSON string
            chartSavePathAbsolute // Argument 2: Absolute path where chart should be saved
        ]);

        // Write the Python code to stdin
        py.stdin.write(safeCode);
        py.stdin.end();           // Close the stdin stream

        let pyOutput = '';
        let pyError = '';

        py.stdout.on('data', (data) => {
            pyOutput += data.toString();
        });

        py.stderr.on('data', (data) => {
            pyError += data.toString();
        });

        py.on('close', async (code) => {
            if (code !== 0 || pyError) { // Check for non-zero exit code or stderr output
                console.error('❌ Python sandbox error:', pyError);
                // Attempt to parse error from stderr if it's JSON from sandbox_processor.py
                try {
                    const errorObj = JSON.parse(pyError.trim());
                    return reject(errorObj.error || `Python process exited with code ${code}`);
                } catch (parseErr) {
                    return reject(pyError || `Python process exited with code ${code}`);
                }
            }

            try {
                // The sandbox_processor.py prints a JSON result to stdout. Parse it.
                const pyResult = JSON.parse(pyOutput.trim());
                if (!pyResult.success) {
                    console.error('❌ Sandbox processor reported error:', pyResult.error);
                    return reject(pyResult.error);
                }

                const key = `chart_${Date.now()}`;
                await saveChartPath(key, chartSavePathAbsolute); // Save the absolute path in Redis
                console.log('✅ Saved chart to Redis:', key, '→', chartSavePathAbsolute);
                resolve(key);
            } catch (e) {
                console.error('❌ Error parsing Python output or saving to Redis:', e);
                reject('Internal server error during chart processing');
            }
        });
    });
};