const { sequelize, Game, GameResult, ResultAudit } = require('../models');

async function getAll() {
    const rows = await GameResult.findAll({ raw: true });
    return rows.map((r) => ({
        gameId: r.gameId,
        team1Score: r.team1Score,
        team2Score: r.team2Score,
    }));
}

async function getByGameId(gameId) {
    const r = await GameResult.findByPk(gameId, { raw: true });
    if (!r) return null;
    return {
        gameId: r.gameId,
        team1Score: r.team1Score,
        team2Score: r.team2Score,
    };
}

/**
 * Бізнес-операція: upsert результату та запис аудиту в одній транзакції Sequelize.
 * Успіх → COMMIT; будь-яка помилка після початку → ROLLBACK.
 */
async function saveWithAudit(gameId, team1Score, team2Score) {
    const s1 = Number(team1Score);
    const s2 = Number(team2Score);
    if (!Number.isFinite(s1) || !Number.isFinite(s2)) {
        throw new Error('Некоректні значення рахунку');
    }

    return sequelize.transaction(async (transaction) => {
        const game = await Game.findByPk(gameId, { transaction });
        if (!game) {
            throw new Error('Гру не знайдено');
        }

        await GameResult.upsert(
            {
                gameId,
                team1Score: s1,
                team2Score: s2,
            },
            { transaction },
        );

        await ResultAudit.create(
            {
                gameId,
                team1Score: s1,
                team2Score: s2,
            },
            { transaction },
        );

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
