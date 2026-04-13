/**
 * Демонстрація для звіту: успішна транзакція vs відкат при помилці.
 * Запуск: npm run db:demo-tx
 *
 * Передумова: виконано schema.sql, у .env задано DATABASE_URL.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const { sql } = require('./db');

async function main() {
    const testGameId = 'g4';

    const [before] = await sql`
        SELECT team1_score, team2_score FROM game_results WHERE game_id = ${testGameId}
    `;
    console.log('До демо: результат g4 у БД =', before || '(немає запису)');

    console.log('\n--- Сценарій А: помилка всередині транзакції → відкат ---');
    try {
        await sql.begin(async (tx) => {
            await tx`
                INSERT INTO game_results (game_id, team1_score, team2_score)
                VALUES (${testGameId}, 9, 9)
                ON CONFLICT (game_id) DO UPDATE SET
                    team1_score = EXCLUDED.team1_score,
                    team2_score = EXCLUDED.team2_score
            `;
            await tx`
                INSERT INTO result_audit (game_id, team1_score, team2_score)
                VALUES ('__no_such_game__', 9, 9)
            `;
        });
    } catch (e) {
        console.log('Очікувана помилка (FK):', e.message);
    }

    const [afterFail] = await sql`
        SELECT team1_score, team2_score FROM game_results WHERE game_id = ${testGameId}
    `;
    console.log('Після невдалої транзакції g4 =', afterFail || '(немає запису)');
    console.log(
        '→ Зміна результату не збереглась (відкат).\n',
    );

    console.log('--- Сценарій Б: обидва кроки успішні → підтвердження ---');
    await sql.begin(async (tx) => {
        await tx`
            INSERT INTO game_results (game_id, team1_score, team2_score)
            VALUES (${testGameId}, 5, 4)
            ON CONFLICT (game_id) DO UPDATE SET
                team1_score = EXCLUDED.team1_score,
                team2_score = EXCLUDED.team2_score
        `;
        await tx`
            INSERT INTO result_audit (game_id, team1_score, team2_score)
            VALUES (${testGameId}, 5, 4)
        `;
    });

    const [afterOk] = await sql`
        SELECT team1_score, team2_score FROM game_results WHERE game_id = ${testGameId}
    `;
    console.log('Після успішної транзакції g4 =', afterOk);

    const auditCount = await sql`
        SELECT count(*)::int AS c FROM result_audit WHERE game_id = ${testGameId}
    `;
    console.log('Записів у result_audit для g4:', auditCount[0].c);

    await sql.end({ timeout: 5 });
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
