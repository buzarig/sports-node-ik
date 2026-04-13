const scheduleService = require('../services/schedule.service');

async function dashboard(req, res) {
    try {
        const schedule = await scheduleService.getFullSchedule();
        res.render('layout', {
            title: 'Адмін-панель',
            body: 'pages/admin/dashboard',
            schedule,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Помилка сервера');
    }
}

async function createForm(req, res) {
    try {
        const teams = await scheduleService.getAllTeams();
        res.render('layout', {
            title: 'Нова гра',
            body: 'pages/admin/form',
            game: null,
            teams,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Помилка сервера');
    }
}

async function createGame(req, res) {
    try {
        await scheduleService.createGame(req.body);
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.status(500).send('Помилка сервера');
    }
}

async function editForm(req, res) {
    try {
        const game = await scheduleService.getGameById(req.params.id);
        if (!game) return res.status(404).send('Гру не знайдено');
        const teams = await scheduleService.getAllTeams();
        res.render('layout', {
            title: 'Редагувати гру',
            body: 'pages/admin/form',
            game,
            teams,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Помилка сервера');
    }
}

async function updateGame(req, res) {
    try {
        const updated = await scheduleService.updateGame(req.params.id, req.body);
        if (!updated) return res.status(404).send('Гру не знайдено');
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.status(500).send('Помилка сервера');
    }
}

async function deleteGame(req, res) {
    try {
        await scheduleService.deleteGame(req.params.id);
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.status(500).send('Помилка сервера');
    }
}

async function resultForm(req, res) {
    try {
        const game = await scheduleService.getGameById(req.params.id);
        if (!game) return res.status(404).send('Гру не знайдено');
        res.render('layout', {
            title: 'Результат — ' + game.team1.name + ' vs ' + game.team2.name,
            body: 'pages/admin/result',
            game,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Помилка сервера');
    }
}

async function saveResult(req, res) {
    try {
        await scheduleService.saveResult(
            req.params.id,
            req.body.team1Score,
            req.body.team2Score,
        );
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.status(500).send('Помилка сервера');
    }
}

module.exports = {
    dashboard,
    createForm,
    createGame,
    editForm,
    updateGame,
    deleteGame,
    resultForm,
    saveResult,
};
