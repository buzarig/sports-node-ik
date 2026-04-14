const teamRepo = require('../repositories/team.repository');
const gameRepo = require('../repositories/game.repository');
const resultRepo = require('../repositories/result.repository');

async function getFullSchedule() {
    const [teams, games, results] = await Promise.all([
        teamRepo.getAll(),
        gameRepo.getAll(),
        resultRepo.getAll(),
    ]);

    return games.map((game) => {
        const team1 = teams.find((t) => t.id === game.team1Id);
        const team2 = teams.find((t) => t.id === game.team2Id);
        const result = results.find((r) => r.gameId === game.id);

        return {
            id: game.id,
            date: game.date,
            location: game.location,
            team1: team1 || { id: game.team1Id, name: 'Невідома', logo: '?' },
            team2: team2 || { id: game.team2Id, name: 'Невідома', logo: '?' },
            result: result || null,
        };
    });
}

async function searchByTeam(query) {
    const schedule = await getFullSchedule();
    const q = query.toLowerCase();
    return schedule.filter(
        (g) =>
            g.team1.name.toLowerCase().includes(q) ||
            g.team2.name.toLowerCase().includes(q),
    );
}

async function getGameById(id) {
    const schedule = await getFullSchedule();
    return schedule.find((g) => g.id === id) || null;
}

async function createGame(data) {
    const id = 'g' + Date.now();
    const game = {
        id,
        date: data.date,
        team1Id: data.team1Id,
        team2Id: data.team2Id,
        location: data.location,
    };
    return gameRepo.create(game);
}

async function updateGame(id, data) {
    return gameRepo.update(id, {
        date: data.date,
        team1Id: data.team1Id,
        team2Id: data.team2Id,
        location: data.location,
    });
}

async function deleteGame(id) {
    return gameRepo.remove(id);
}

async function saveResult(gameId, team1Score, team2Score) {
    return resultRepo.saveWithAudit(gameId, team1Score, team2Score);
}

async function getAllTeams() {
    return teamRepo.getAll();
}

function formatGameDate(dateVal) {
    let d = dateVal;
    if (d instanceof Date) {
        d = d.toISOString().slice(0, 10);
    } else if (typeof d === 'string') {
        d = d.slice(0, 10);
    }
    return d;
}

/**
 * Сторінкований список ігор з фільтрами (REST): team/q, dateFrom, dateTo, page, limit.
 */
async function getGamesPaginated(query) {
    const { rows, total, page, limit } = await gameRepo.findPaginated({
        page: query.page,
        limit: query.limit,
        teamName: query.team || query.q,
        dateFrom: query.dateFrom || undefined,
        dateTo: query.dateTo || undefined,
    });

    const ids = rows.map((r) => (typeof r.get === 'function' ? r.get('id') : r.id));
    const resultsList = await resultRepo.getByGameIds(ids);
    const byGame = new Map(resultsList.map((r) => [r.gameId, r]));

    const data = rows.map((row) => {
        const plain = typeof row.get === 'function' ? row.get({ plain: true }) : row;
        const res = byGame.get(plain.id);
        return {
            id: plain.id,
            date: formatGameDate(plain.gameDate),
            location: plain.location,
            team1: plain.team1 || null,
            team2: plain.team2 || null,
            result: res
                ? { team1Score: res.team1Score, team2Score: res.team2Score }
                : null,
        };
    });

    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages,
        },
    };
}

module.exports = {
    getFullSchedule,
    searchByTeam,
    getGameById,
    createGame,
    updateGame,
    deleteGame,
    saveResult,
    getAllTeams,
    getGamesPaginated,
};
