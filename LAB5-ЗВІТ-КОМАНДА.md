# Звіт про виконання лабораторної роботи №5  
## «Об’єктно-реляційні перетворення (ORM, Sequelize)»

**Тема проєкту:** розклад та результати спортивних змагань (продовження лаб. 3–4).  
**Стек:** Node.js, Express, EJS, PostgreSQL (Supabase), **Sequelize** + драйвер **`pg`**.

Цей документ містить **детальний опис переходу з сирого SQL на ORM** та **умовний розподіл завдань між п’ятьма членами команди** (для звіту або презентації). Розподіл є **педагогічно зручним**; у реальному проєкті межі між ролями могли перетинатися.

---

## 1. Мета та вимоги, які було закрито

Лабораторна робота №5 передбачала:

1. Використання **ORM** (на прикладі **Sequelize**) замість прямих SQL-запитів у шарі доступу до даних.
2. **Заміна компонентів доступу до даних** на реалізації, побудовані на принципах **об’єктно-реляційних відображень** (моделі, асоціації, методи репозиторіїв поверх моделей).
3. Для **хоча б однієї сутності** — повний **CRUD** (create, read, update, delete).
4. Операції **створення, оновлення та видалення** — виконуються **транзакційно**.
5. **Бізнес-операція**, на якій видно **підтвердження** транзакції при успіху та **відкат** при помилці.
6. Між сутностями — **хоча б один зв’язок** типу **один-до-багатьох** або **багато-до-багатьох** (у проєкті явно оголошені асоціації **1:N** та **1:0..1**).

**Схема БД** з лабораторної №4 (**`src/db/schema.sql`**) **не перепроєктовувалась**: таблиці `teams`, `games`, `game_results`, `result_audit` лишаються джерелом істини; Sequelize-моделі **відображають** існуючі імена таблиць і колонок через `tableName` та `field`.

---

## 2. Загальна архітектура після змін

### 2.1. Шари застосунку

| Шар | Призначення | Ключові елементи |
|-----|-------------|------------------|
| **Представлення** | HTML-сторінки (EJS) | Без змін у контракті даних: `game`, `team1`, `team2`, `result`. |
| **Контролери** | HTTP-запити та відповіді | `schedule.controller.js`, `admin.controller.js` — як у лаб. 4 (async/await до сервісу). |
| **Сервіс** | Бізнес-сценарії та збирання даних | `schedule.service.js` — **без змін** публічного API; звертається до тих самих функцій репозиторіїв. |
| **Репозиторії** | Доступ до даних через ORM | `team.repository.js`, `game.repository.js`, `result.repository.js` — виклики **Sequelize** (`findAll`, `create`, `transaction`, тощо). |
| **Моделі ORM** | Відображення таблиць на класи | **`src/models/index.js`** — `Team`, `Game`, `GameResult`, `ResultAudit` та **асоціації**. |
| **Підключення до БД** | Екземпляр Sequelize | **`src/db/sequelize.js`** — `DATABASE_URL`, SSL, пул з’єднань. |

### 2.2. Чому Sequelize

**Sequelize** дає типовий для Node.js шлях **об’єктно-реляційного мапінгу**: атрибути моделі в коді (`gameDate`, `team1Id`) відповідають колонкам БД (`game_date`, `team1_id`) через явний `field`, а **транзакції** оформлюються як **`sequelize.transaction(async (t) => { … })`**, що відповідає вимогам лабораторної щодо атомарності змін.

---

## 3. База даних: схема без змін, відображення в моделях

### 3.1. Файл `src/db/schema.sql`

Таблиці та обмеження **ті самі**, що після лаб. 4: `teams`, `games`, `game_results`, `result_audit`. Наповнення й каскади (**`ON DELETE CASCADE`** для результатів і аудиту) **зберігаються**; застосунок **не викликає** `sequelize.sync()` — створення структури лишається за SQL-скриптом.

### 3.2. Зв’язки в предметній області та в Sequelize

Логіка з лаб. 4 не змінилась; додатково зв’язки **формалізовані в коді** у **`src/models/index.js`**:

- **Команда → багато ігор (1:N)** — дві асоціації: `homeGames` (`team1_id`) та `awayGames` (`team2_id`).
- **Гра → один поточний результат (1:0..1)** — `Game.hasOne(GameResult)` / `GameResult.belongsTo(Game)`.
- **Гра → багато записів аудиту (1:N)** — `Game.hasMany(ResultAudit)` / `ResultAudit.belongsTo(Game)`.

Фрагмент оголошення моделей і асоціацій:

```58:68:src/models/index.js
// Зв’язки: команда — багато ігор (домашні / гостьові); гра — один результат; гра — багато записів аудиту.
Team.hasMany(Game, { foreignKey: 'team1Id', as: 'homeGames' });
Team.hasMany(Game, { foreignKey: 'team2Id', as: 'awayGames' });
Game.belongsTo(Team, { foreignKey: 'team1Id', as: 'team1' });
Game.belongsTo(Team, { foreignKey: 'team2Id', as: 'team2' });

Game.hasOne(GameResult, { foreignKey: 'gameId', as: 'result' });
GameResult.belongsTo(Game, { foreignKey: 'gameId', as: 'game' });

Game.hasMany(ResultAudit, { foreignKey: 'gameId', as: 'auditEntries' });
ResultAudit.belongsTo(Game, { foreignKey: 'gameId', as: 'game' });
```

---

## 4. Підключення до PostgreSQL та конфігурація

### 4.1. `src/db/sequelize.js`

Замість клієнта **`postgres`** (лаб. 4) використовується **`Sequelize`** з діалектом **`postgres`**:

```16:25:src/db/sequelize.js
const useSsl = process.env.PGSSLMODE !== 'disable';

const sequelize = new Sequelize(getDatabaseUrl(), {
    dialect: 'postgres',
    dialectOptions: useSsl
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
    logging: false,
    pool: { max: 10, idle: 20000, acquire: 30000 },
});
```

- Підвантаження **`.env`** з кореня проєкту (шлях узгоджений із попередніми лабами).
- Перевірка **`DATABASE_URL`** з повідомленням про помилку, якщо змінна відсутня.
- Для Supabase за замовчуванням увімкнено **SSL**; **`PGSSLMODE=disable`** — для локального Postgres без TLS.

### 4.2. `.env` та `.env.example`

Секрети в **`.gitignore`**, шаблон підключення в **`.env.example`** (зокрема pooler Supabase).

### 4.3. `package.json`

- **Видалено** залежність **`postgres`**.
- **Додано** **`sequelize`** та **`pg`**.
- Скрипт **`npm run db:demo-tx`** запускає **`src/db/transaction-demo.js`** — демонстрація ORM-транзакцій (відкат / підтвердження).

### 4.4. `src/app.js`

**`dotenv`** на старті застосунку — без змін; репозиторії підвантажують моделі, які тягнуть **`sequelize.js`**.

---

## 5. Репозиторії та вимоги лабораторної

### 5.1. Сутність «Гра» — повний CRUD (транзакційно)

Файл **`src/repositories/game.repository.js`**:

- **Read:** `Game.findAll`, `Game.findByPk` з мапінгом у формат для EJS (`gameDate` → `date` як `YYYY-MM-DD`).
- **Create / Update / Delete:** обгорнуті в **`sequelize.transaction`** — `Game.create`, `instance.update`, `Game.destroy`.

Приклад транзакційного створення:

```36:49:src/repositories/game.repository.js
async function create(game) {
    return sequelize.transaction(async (transaction) => {
        const created = await Game.create(
            {
                id: game.id,
                gameDate: game.date,
                team1Id: game.team1Id,
                team2Id: game.team2Id,
                location: game.location,
            },
            { transaction },
        );
        return mapGameRow(created);
    });
}
```

Видалення гри в транзакції зберігає поведінку **CASCADE** на рівні БД для `game_results` та `result_audit`.

### 5.2. Команди

Файл **`src/repositories/team.repository.js`**: **`Team.findAll`** / **`Team.findByPk`** з **`raw: true`** для простих об’єктів, сумісних із сервісом.

### 5.3. Результати та бізнес-операція

Файл **`src/repositories/result.repository.js`**:

- Читання: **`GameResult.findAll`**, **`GameResult.findByPk`**.
- **`saveWithAudit`** — одна транзакція Sequelize: перевірка існування гри, **`GameResult.upsert`**, **`ResultAudit.create`**.

```33:62:src/repositories/result.repository.js
    return sequelize.transaction(async (transaction) => {
        const game = await Game.findByPk(gameId, { transaction });
        if (!game) {
            throw new Error('Гру не знайдено');
        }

        await GameResult.upsert(
            {
                gameId,
                team1Score: s1,
                team2Score: s2,
            },
            { transaction },
        );

        await ResultAudit.create(
            {
                gameId,
                team1Score: s1,
                team2Score: s2,
            },
            { transaction },
        );

        return {
            gameId,
            team1Score: s1,
            team2Score: s2,
        };
    });
```

Помилка на будь-якому кроці після відкриття транзакції призводить до **відкату** всіх змін у межах цієї транзакції.

### 5.4. Демонстраційний скрипт

**`src/db/transaction-demo.js`** (команда **`npm run db:demo-tx`**):

- **Сценарій А:** після **`GameResult.upsert`** виконується **`ResultAudit.create`** з неіснуючим `game_id` → порушення FK → **rollback**, зокрема для upsert у межах тієї ж транзакції.
- **Сценарій Б:** обидва кроки успішні → **commit**.

Ілюстрація сценарію А (ORM):

```16:35:src/db/transaction-demo.js
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
```

---

## 6. Сервісний шар і контролери

### 6.1. `src/services/schedule.service.js`

**Не змінювався** під час переходу на ORM: той самий виклик `teamRepo`, `gameRepo`, `resultRepo`. Це підтверджує, що **репозиторії зберегли публічний контракт** після заміни реалізації з SQL на Sequelize — як і планувалось ще в лаб. 4.

### 6.2. Контролери та маршрути

**`admin.controller.js`**, **`schedule.controller.js`**, **`admin.routes.js`**, **`schedule.routes.js`** — логіка HTTP без прив’язки до ORM; змін не потребували.

---

## 7. Початкові дані

Каталог **`src/data/`** із JSON-заглушками **видалено** — застосунок працює лише з **PostgreSQL**. Тестове наповнення задається **`INSERT`** у **`src/db/schema.sql`** (або вручну через адмінку).

---

## 8. Розподіл роботи між 5 членами команди (умовно)

### Учасник 1 — **«База даних»** (*Олександр*)

**Внесок:** актуальність **`src/db/schema.sql`**, перевиконання скрипта після змін у середовищі; консультації щодо FK і CASCADE для ORM-моделей.

**Результат:** стабільна схема, з якою узгоджені **`tableName`** / **`field`** у Sequelize.

---

### Учасник 2 — **«Конфігурація та залежності»** (*Марія*)

**Внесок:** **`src/db/sequelize.js`**, оновлення **`package.json`** (`sequelize`, `pg`, видалення `postgres`), перевірка **`.env`** / **`.env.example`**, **`app.js`** + dotenv.

**Результат:** єдиний екземпляр Sequelize і передбачуване SSL для Supabase / локально.

---

### Учасник 3 — **«Моделі та репозиторії Team / Game»** (*Дмитро*)

**Внесок:** **`src/models/index.js`** (визначення **`Team`**, **`Game`**, асоціації з командами); **`team.repository.js`**, **`game.repository.js`** — CRUD для гри в транзакціях, мапінг дат для в’ю.

**Результат:** виконання вимог **CRUD + транзакції** для сутності «Гра» та наявність **1:N** між командою та іграми в ORM.

---

### Учасник 4 — **«Результати, аудит, демо транзакцій»** (*Ксенія*)

**Внесок:** моделі **`GameResult`**, **`ResultAudit`** і їхні зв’язки з **`Game`**; **`result.repository.js`** з **`saveWithAudit`**; скрипт **`src/db/transaction-demo.js`** для демонстрації транзакцій.

**Результат:** бізнес-операція з **commit/rollback** і скрипт для захисту / звіту.

---

### Учасник 5 — **«Інтеграція та регресія»** (*Антон*)

**Внесок:** перевірка сценаріїв гостя та адміна після заміни шару даних; переконання, що **`schedule.service`** не потребує змін і EJS отримує ті самі структури.

**Результат:** UX без змін при повній заміні доступу до БД на ORM.

---

## 9. Підсумок для команди з 5 осіб

| № | Умовне ім’я | Основний фокус | Ключові артефакти |
|---|-------------|----------------|-------------------|
| 1 | Олександр | Схема БД, SQL, Supabase | `schema.sql` |
| 2 | Марія | Sequelize, `.env`, npm | `sequelize.js`, `package.json`, `.env.example`, `app.js` |
| 3 | Дмитро | Моделі Team/Game, CRUD, транзакції | `models/index.js` (частина), `team.repository.js`, `game.repository.js` |
| 4 | Ксенія | Результати, аудит, демо TX | `models/index.js` (частина), `result.repository.js`, `transaction-demo.js` |
| 5 | Антон | Регресія, сервіс, UI | перевірка `schedule.service.js`, контролерів, маршрутів |

---

## 10. Як відтворити середовище (чеклист)

1. У **Supabase** (або локально) виконати **`src/db/schema.sql`** у **SQL Editor**, якщо таблиць ще немає.
2. Скопіювати **`.env.example`** → **`.env`**, задати **`DATABASE_URL`**.
3. Виконати **`npm install`** (з’являться **`sequelize`** та **`pg`**).
4. Запустити **`npm run dev`** і перевірити розклад, адмінку, введення результату.
5. Для звіту: **`npm run db:demo-tx`** — очікувані повідомлення про FK у сценарії А та успішне завершення сценарію Б.

---

*Документ супроводжує лабораторну роботу №5; імена в розділі 8 можна замінити на реальні ПІБ команди.*
