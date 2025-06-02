const { Pool } = require('pg');
const pool = new Pool();

module.exports.saveQuery = async (filename, queryText, generatedCode) => {
    const query = `
        INSERT INTO queries (filename, query_text, generated_code, executed_at)
        VALUES ($1, $2, $3, NOW())
    `;
    await pool.query(query, [filename, queryText, generatedCode]);
};

module.exports.getRecentQueriesByFilename = async (filename) => {
    const query = `
      SELECT query_text
      FROM queries
      WHERE filename = $1
      GROUP BY query_text
      ORDER BY MAX(executed_at) DESC
      LIMIT 5
    `;

    const result = await pool.query(query, [filename]);
    return result.rows.map(row => row.query_text);
};

module.exports.saveMetadata = async (file) => {
    const query = 'INSERT INTO uploads (filename, size, uploaded_at) VALUES ($1, $2, NOW())';
    await pool.query(query, [file.filename, file.size]);
};
