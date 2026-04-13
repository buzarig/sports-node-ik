-- Лабораторна 4: PostgreSQL (Supabase).
-- Якщо в Node помилка "relation game_results does not exist" — цей скрипт ще не виконано
-- в ТОМУ Ж проєкті Supabase, що й DATABASE_URL у .env.
--
-- Supabase Dashboard → твій проєкт → SQL → New query → вставити ВЕСЬ файл → Run.
-- Перевірка: Table editor → мають з’явитися teams, games, game_results, result_audit.
--
-- Увага: DROP TABLE видаляє старі дані в цих таблицях (для чистої ініціалізації).

DROP TABLE IF EXISTS result_audit CASCADE;
DROP TABLE IF EXISTS game_results CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

CREATE TABLE teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    logo TEXT NOT NULL DEFAULT ''
);

CREATE TABLE games (
    id TEXT PRIMARY KEY,
    game_date DATE NOT NULL,
    team1_id TEXT NOT NULL REFERENCES teams (id),
    team2_id TEXT NOT NULL REFERENCES teams (id),
    location TEXT NOT NULL,
    CONSTRAINT games_different_teams CHECK (team1_id <> team2_id)
);

CREATE TABLE game_results (
    game_id TEXT PRIMARY KEY REFERENCES games (id) ON DELETE CASCADE,
    team1_score INTEGER NOT NULL,
    team2_score INTEGER NOT NULL,
    CONSTRAINT game_results_non_negative CHECK (
        team1_score >= 0
        AND team2_score >= 0
    )
);

-- Журнал для бізнес-операції «зберегти результат»: записується в одній транзакції з game_results.
CREATE TABLE result_audit (
    id SERIAL PRIMARY KEY,
    game_id TEXT NOT NULL REFERENCES games (id) ON DELETE CASCADE,
    team1_score INTEGER NOT NULL,
    team2_score INTEGER NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO teams (id, name, city, logo)
VALUES
    ('t1', 'Динамо Київ', 'Київ', ''),
    ('t2', 'Шахтар Донецьк', 'Донецьк', ''),
    ('t3', 'Зоря Луганськ', 'Луганськ', ''),
    ('t4', 'Ворскла Полтава', 'Полтава', ''),
    ('t5', 'Десна Чернігів', 'Чернігів', ''),
    ('t6', 'Колос Ковалівка', 'Ковалівка', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO games (id, game_date, team1_id, team2_id, location)
VALUES
    ('g1', '2026-09-14', 't1', 't2', 'НСК Олімпійський'),
    ('g2', '2029-07-15', 't1', 't5', 'Славутич-Арена'),
    ('g3', '2026-09-21', 't5', 't6', 'Стадіон ім. Гагаріна'),
    ('g4', '2026-09-28', 't2', 't3', 'Арена Львів'),
    ('g5', '2026-10-05', 't1', 't4', 'НСК Олімпійський'),
    ('g6', '2026-10-12', 't6', 't1', 'Колос Арена'),
    ('g7', '2026-10-19', 't4', 't5', 'Ворскла Стадіон'),
    ('g8', '2026-10-26', 't3', 't1', 'Славутич-Арена')
ON CONFLICT (id) DO NOTHING;

INSERT INTO game_results (game_id, team1_score, team2_score)
VALUES
    ('g1', 2, 1),
    ('g2', 4, 2),
    ('g3', 3, 2)
ON CONFLICT (game_id) DO UPDATE
SET
    team1_score = EXCLUDED.team1_score,
    team2_score = EXCLUDED.team2_score;
