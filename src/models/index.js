const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const Team = sequelize.define(
    'Team',
    {
        id: { type: DataTypes.STRING, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        city: { type: DataTypes.STRING, allowNull: false },
        logo: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    },
    { tableName: 'teams', timestamps: false },
);

const Game = sequelize.define(
    'Game',
    {
        id: { type: DataTypes.STRING, primaryKey: true },
        gameDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'game_date' },
        team1Id: { type: DataTypes.STRING, allowNull: false, field: 'team1_id' },
        team2Id: { type: DataTypes.STRING, allowNull: false, field: 'team2_id' },
        location: { type: DataTypes.STRING, allowNull: false },
    },
    { tableName: 'games', timestamps: false },
);

const GameResult = sequelize.define(
    'GameResult',
    {
        gameId: {
            type: DataTypes.STRING,
            primaryKey: true,
            field: 'game_id',
        },
        team1Score: { type: DataTypes.INTEGER, allowNull: false, field: 'team1_score' },
        team2Score: { type: DataTypes.INTEGER, allowNull: false, field: 'team2_score' },
    },
    { tableName: 'game_results', timestamps: false },
);

const ResultAudit = sequelize.define(
    'ResultAudit',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        gameId: { type: DataTypes.STRING, allowNull: false, field: 'game_id' },
        team1Score: { type: DataTypes.INTEGER, allowNull: false, field: 'team1_score' },
        team2Score: { type: DataTypes.INTEGER, allowNull: false, field: 'team2_score' },
        recordedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'recorded_at',
            defaultValue: DataTypes.NOW,
        },
    },
    { tableName: 'result_audit', timestamps: false },
);

// Зв’язки: команда — багато ігор (домашні / гостьові); гра — один результат; гра — багато записів аудиту.
Team.hasMany(Game, { foreignKey: 'team1Id', as: 'homeGames' });
Team.hasMany(Game, { foreignKey: 'team2Id', as: 'awayGames' });
Game.belongsTo(Team, { foreignKey: 'team1Id', as: 'team1' });
Game.belongsTo(Team, { foreignKey: 'team2Id', as: 'team2' });

Game.hasOne(GameResult, { foreignKey: 'gameId', as: 'result' });
GameResult.belongsTo(Game, { foreignKey: 'gameId', as: 'game' });

Game.hasMany(ResultAudit, { foreignKey: 'gameId', as: 'auditEntries' });
ResultAudit.belongsTo(Game, { foreignKey: 'gameId', as: 'game' });

module.exports = {
    sequelize,
    Team,
    Game,
    GameResult,
    ResultAudit,
};
