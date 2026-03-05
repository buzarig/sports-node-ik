const scheduleService = require('../services/schedule.service');

async function viewSchedule(req, res) {
    try {
        const schedule = await scheduleService.getFullSchedule();
        res.render('layout', {
            title: 'Розклад змагань',
            body: 'pages/schedule',
            schedule,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Помилка сервера');
    }
}

async function viewGame(req, res) {
    try {
        const game = await scheduleService.getGameById(req.params.id);
        if (!game) return res.status(404).send('Гру не знайдено');
        res.render('layout', {
            title: `${game.team1.name} vs ${game.team2.name}`,
            body: 'pages/game',
            game,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Помилка сервера');
    }
}

async function searchSchedule(req, res) {
    try {
        const query = req.query.team || '';
        const results = await scheduleService.searchByTeam(query);
        res.render('layout', {
            title: 'Пошук — ' + query,
            body: 'pages/search',
            query,
            results,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Помилка сервера');
    }
}

module.exports = { viewSchedule, viewGame, searchSchedule };
