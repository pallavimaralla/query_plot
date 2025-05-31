const { spawn } = require('child_process');
const { saveChartPath } = require('./redisService');
const path = require('path');

module.exports.runPython = (filename, code) => {
    return new Promise((resolve, reject) => {
        const py = spawn('python3', ['python/sandbox_processor.py', filename]);
        let output = '';
        let error = '';

        // Strip any read_csv lines from the LLM code
        const safeCode = code
            .split('\n')
            .filter(line => !line.includes('read_csv'))
            .join('\n');

        console.log('👨‍💻 Final Python code being executed:\n', safeCode);

        py.stdin.write(safeCode);
        py.stdin.end();

        py.stdout.on('data', (data) => {
            output += data.toString();
        });

        py.stderr.on('data', (data) => {
            error += data.toString();
        });

        py.on('close', async () => {
            if (error) {
                console.error('❌ Python error:', error);
                return reject(error);
            }

            const chartFile = output.trim();
            const chartPath = path.join('charts', chartFile);

            const key = `chart_${Date.now()}`;
            try {
                await saveChartPath(key, chartPath);
                console.log('✅ Saved chart to Redis:', key, '→', chartPath);
                resolve(key);
            } catch (e) {
                console.error('❌ Redis save failed:', e);
                reject('Redis error');
            }
        });
    });
};
