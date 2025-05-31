const { Pool } = require('pg');
const pool = new Pool();

module.exports.saveMetadata = async (file) => {
    const query = 'INSERT INTO uploads (filename, size, uploaded_at) VALUES ($1, $2, NOW())';
    await pool.query(query, [file.filename, file.size]);
};