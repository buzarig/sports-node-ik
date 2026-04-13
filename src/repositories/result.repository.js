const { sql } = require('../db/db');

async function getAll() {
    const rows = await sql`
        SELECT game_id AS "gameId", team1_score AS "team1Score", team2_score AS "team2Score"
        FROM game_results
    `;
    return rows.map((r) => ({
        gameId: r.gameId,
        team1Score: r.team1Score,
        team2Score: r.team2Score,
    }));
}

async function getByGameId(gameId) {
    const rows = await sql`
        SELECT game_id AS "gameId", team1_score AS "team1Score", team2_score AS "team2Score"
        FROM game_results
        WHERE game_id = ${gameId}
    `;
    if (!rows.length) return null;
    const r = rows[0];
    return {
        gameId: r.gameId,
        team1Score: r.team1Score,
        team2Score: r.team2Score,
    };
}

/**
 * Бізнес-операція: оновити/створити результат і записати рядок аудиту в одній транзакції.
 * При будь-якій помилці після початку транзакції зміни відкочуються.
 */
async function saveWithAudit(gameId, team1Score, team2Score) {
    const s1 = Number(team1Score);
    const s2 = Number(team2Score);
    if (!Number.isFinite(s1) || !Number.isFinite(s2)) {
        throw new Error('Некоректні значення рахунку');
    }

    return sql.begin(async (tx) => {
        const games = await tx`
            SELECT id FROM games WHERE id = ${gameId}
        `;
        if (!games.length) {
            throw new Error('Гру не знайдено');
        }

        await tx`
            INSERT INTO game_results (game_id, team1_score, team2_score)
            VALUES (${gameId}, ${s1}, ${s2})
            ON CONFLICT (game_id) DO UPDATE SET
                team1_score = EXCLUDED.team1_score,
                team2_score = EXCLUDED.team2_score
        `;

        await tx`
            INSERT INTO result_audit (game_id, team1_score, team2_score)
            VALUES (${gameId}, ${s1}, ${s2})
        `;

        return {
            gameId,
            team1Score: s1,
            team2Score: s2,
        };
    });
}

module.exports = {
    getAll,
    getByGameId,
    saveWithAudit,
};
