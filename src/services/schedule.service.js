const teamRepo = require('../repositories/team.repository');
const gameRepo = require('../repositories/game.repository');
const resultRepo = require('../repositories/result.repository');

/**
 * Повертає повний розклад із назвами команд та результатами
 * @returns {Promise<Array>}
 */
async function getFullSchedule() {
    const teams = teamRepo.getAllSync();

    const games = await gameRepo.getAllPromise();

    const results = await resultRepo.getAllAsync();

    // Збираємо дані разом
    return games.map((game) => {
        const team1 = teams.find((t) => t.id === game.team1Id);
        const team2 = teams.find((t) => t.id === game.team2Id);
        const result = results.find((r) => r.gameId === game.id);

        return {
            id: game.id,
            date: game.date,
            location: game.location,
            team1: team1 || { name: 'Невідома', logo: '?' },
            team2: team2 || { name: 'Невідома', logo: '?' },
            result: result || null,
        };
    });
}

/**
 * Пошук ігор за назвою команди
 * @param {string} query
 * @returns {Promise<Array>}
 */
async function searchByTeam(query) {
    const schedule = await getFullSchedule();
    const q = query.toLowerCase();
    return schedule.filter(
        (g) =>
            g.team1.name.toLowerCase().includes(q) ||
            g.team2.name.toLowerCase().includes(q),
    );
}

/**
 * Отримати одну гру за ID
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
async function getGameById(id) {
    const schedule = await getFullSchedule();
    return schedule.find((g) => g.id === id) || null;
}

function createGame(data) {
    const id = 'g' + Date.now();
    const game = {
        id,
        date: data.date,
        team1Id: data.team1Id,
        team2Id: data.team2Id,
        location: data.location,
    };
    return gameRepo.createSync(game);
}

function updateGame(id, data) {
    return gameRepo.updateSync(id, {
        date: data.date,
        team1Id: data.team1Id,
        team2Id: data.team2Id,
        location: data.location,
    });
}

function deleteGame(id) {
    return gameRepo.deleteSync(id);
}

async function saveResult(gameId, team1Score, team2Score) {
    return resultRepo.saveAsync(gameId, team1Score, team2Score);
}

function getAllTeams() {
    return teamRepo.getAllSync();
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
};
