const { spawn } = require('child_process');
const { saveChartPath } = require('./redisService');
const path = require('path');
const fs = require('fs').promises;

module.exports.runPython = (filename, code) => {
    return new Promise(async (resolve, reject) => {
        const fullCsvFilePath = path.join(__dirname, '../../uploads', filename);

        let dfJsonString = '';
        try {
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
                        try {
                            const errorObj = JSON.parse(readCsvError.trim());
                            return rej(errorObj.error || `Failed to read CSV to JSON: ${readCsvError}`);
                        } catch (parseErr) {
                            return rej(`Failed to read CSV to JSON: ${readCsvError}`);
                        }
                    }
                    dfJsonString = readCsvOutput.trim();
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
        if (!safeCode) {
            throw new Error('Python code is undefined');
        }
        safeCode = safeCode
            .split('\n')
            .filter(line => {
                const trimmedLine = line.trim();
                if (trimmedLine.toLowerCase() === '```python' || trimmedLine === '```') {
                    return false;
                }
                return !trimmedLine.includes('pd.read_csv') && trimmedLine !== '';
            })
            .join('\n')
            .trim()
            .replace(/[\u00A0\uFEFF\u200B-\u200D\u2060\u202F]/g, ' ')
            .replace(/[^\x00-\x7F\n\r\t ]/g, '');

        console.log('👨‍💻 Final Python code being executed:\n', safeCode);

        const chartFileName = `chart_${Date.now()}.png`;
        const chartSavePathAbsolute = path.join(__dirname, '../../charts', chartFileName);

        try {
            await fs.mkdir(path.dirname(chartSavePathAbsolute), { recursive: true });
        } catch (dirErr) {
            console.error('❌ Failed to create chart directory:', dirErr);
            return reject('Failed to create chart directory');
        }

        const py = spawn('python3', [
            path.join(__dirname, '../../python/sandbox_processor.py'),
            dfJsonString,
            chartSavePathAbsolute
        ]);

        py.stdin.write(safeCode);
        py.stdin.end();

        let pyOutput = '';
        let pyError = '';

        py.stdout.on('data', (data) => {
            pyOutput += data.toString();
        });

        py.stderr.on('data', (data) => {
            pyError += data.toString();
        });

        py.on('close', async (code) => {
            if (code !== 0 || pyError) {
                console.error('❌ Python sandbox error:', pyError);
                try {
                    const errorObj = JSON.parse(pyError.trim());
                    return reject(errorObj.error || `Python process exited with code ${code}`);
                } catch (parseErr) {
                    return reject(pyError || `Python process exited with code ${code}`);
                }
            }

            try {
                const pyResult = JSON.parse(pyOutput.trim());
                if (!pyResult.success) {
                    console.error('❌ Sandbox processor reported error:', pyResult.error);
                    return reject(pyResult.error);
                }
                // Use chartFileName (with .png) as the key everywhere
                await saveChartPath(chartFileName, chartSavePathAbsolute);
                console.log('✅ Saved chart to Redis:', chartFileName, '→', chartSavePathAbsolute);
                resolve(chartFileName);
            } catch (e) {
                console.error('❌ Error parsing Python output or saving to Redis:', e);
                reject('Internal server error during chart processing');
            }
        });
    });
};