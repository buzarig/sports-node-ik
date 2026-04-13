const { sql } = require('../db/db');

function mapGameRow(row) {
    if (!row) return null;
    let dateVal = row.date;
    if (dateVal instanceof Date) {
        dateVal = dateVal.toISOString().slice(0, 10);
    } else if (typeof dateVal === 'string') {
        dateVal = dateVal.slice(0, 10);
    }
    return {
        id: row.id,
        date: dateVal,
        team1Id: row.team1Id,
        team2Id: row.team2Id,
        location: row.location,
    };
}

async function getAll() {
    const rows = await sql`
        SELECT
            id,
            game_date AS date,
            team1_id AS "team1Id",
            team2_id AS "team2Id",
            location
        FROM games
        ORDER BY game_date, id
    `;
    return rows.map(mapGameRow);
}

async function getById(id) {
    const rows = await sql`
        SELECT
            id,
            game_date AS date,
            team1_id AS "team1Id",
            team2_id AS "team2Id",
            location
        FROM games
        WHERE id = ${id}
    `;
    return mapGameRow(rows[0]) || null;
}

async function create(game) {
    return sql.begin(async (tx) => {
        const rows = await tx`
            INSERT INTO games (id, game_date, team1_id, team2_id, location)
            VALUES (
                ${game.id},
                ${game.date},
                ${game.team1Id},
                ${game.team2Id},
                ${game.location}
            )
            RETURNING
                id,
                game_date AS date,
                team1_id AS "team1Id",
                team2_id AS "team2Id",
                location
        `;
        return mapGameRow(rows[0]);
    });
}

async function update(id, data) {
    return sql.begin(async (tx) => {
        const rows = await tx`
            UPDATE games
            SET
                game_date = ${data.date},
                team1_id = ${data.team1Id},
                team2_id = ${data.team2Id},
                location = ${data.location}
            WHERE id = ${id}
            RETURNING
                id,
                game_date AS date,
                team1_id AS "team1Id",
                team2_id AS "team2Id",
                location
        `;
        return mapGameRow(rows[0]) || null;
    });
}

async function remove(id) {
    return sql.begin(async (tx) => {
        const rows = await tx`
            DELETE FROM games
            WHERE id = ${id}
            RETURNING id
        `;
        return rows.length > 0;
    });
}

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
};
