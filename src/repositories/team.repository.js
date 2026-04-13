const { sql } = require('../db/db');

async function getAll() {
    return sql`
        SELECT id, name, city, logo
        FROM teams
        ORDER BY name
    `;
}

async function getById(id) {
    const rows = await sql`
        SELECT id, name, city, logo
        FROM teams
        WHERE id = ${id}
    `;
    return rows[0] || null;
}

module.exports = { getAll, getById };
