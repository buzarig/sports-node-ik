/**
 * Демонстрація транзакцій через Sequelize (ORM).
 * Запуск: npm run db:demo-tx
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const { sequelize, GameResult, ResultAudit } = require('../models');

async function main() {
    const testGameId = 'g4';

    const before = await GameResult.findByPk(testGameId, { raw: true });
    console.log('До демо: результат g4 у БД =', before || '(немає запису)');

    console.log('\n--- Сценарій А: помилка всередині транзакції → відкат ---');
    try {
        await sequelize.transaction(async (transaction) => {
            await GameResult.upsert(
                {
                    gameId: testGameId,
                    team1Score: 9,
                    team2Score: 9,
                },
                { transaction },
            );
            await ResultAudit.create(
                {
                    gameId: '__no_such_game__',
                    team1Score: 9,
                    team2Score: 9,
                },
                { transaction },
            );
        });
    } catch (e) {
        console.log('Очікувана помилка (FK):', e.message);
    }

    const afterFail = await GameResult.findByPk(testGameId, { raw: true });
    console.log('Після невдалої транзакції g4 =', afterFail || '(немає запису)');
    console.log('→ Зміна результату не збереглась (відкат).\n');

    console.log('--- Сценарій Б: обидва кроки успішні → підтвердження ---');
    await sequelize.transaction(async (transaction) => {
        await GameResult.upsert(
            {
                gameId: testGameId,
                team1Score: 5,
                team2Score: 4,
            },
            { transaction },
        );
        await ResultAudit.create(
            {
                gameId: testGameId,
                team1Score: 5,
                team2Score: 4,
            },
            { transaction },
        );
    });

    const afterOk = await GameResult.findByPk(testGameId, { raw: true });
    console.log('Після успішної транзакції g4 =', afterOk);

    const auditCount = await ResultAudit.count({ where: { gameId: testGameId } });
    console.log('Записів у result_audit для g4:', auditCount);

    await sequelize.close();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
