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

function createForm(req, res) {
    const teams = scheduleService.getAllTeams();
    res.render('layout', {
        title: 'Нова гра',
        body: 'pages/admin/form',
        game: null,
        teams,
    });
}

function createGame(req, res) {
    scheduleService.createGame(req.body);
    res.redirect('/admin');
}

async function editForm(req, res) {
    try {
        const game = await scheduleService.getGameById(req.params.id);
        if (!game) return res.status(404).send('Гру не знайдено');
        const teams = scheduleService.getAllTeams();
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

function updateGame(req, res) {
    scheduleService.updateGame(req.params.id, req.body);
    res.redirect('/admin');
}

function deleteGame(req, res) {
    scheduleService.deleteGame(req.params.id);
    res.redirect('/admin');
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
