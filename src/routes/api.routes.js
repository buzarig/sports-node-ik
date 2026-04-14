const express = require('express');
const apiGames = require('../controllers/api.games.controller');

const router = express.Router();

/** Ресурс «Гра»: повний CRUD + у list — фільтрація та пагінація */
router.get('/games', apiGames.list);
router.get('/games/:id', apiGames.getById);
router.post('/games', apiGames.create);
router.put('/games/:id', apiGames.update);
router.delete('/games/:id', apiGames.remove);

module.exports = router;
