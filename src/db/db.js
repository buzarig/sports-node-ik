const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const postgres = require('postgres');

function getConnectionString() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        throw new Error(
            'DATABASE_URL is not set. Copy .env.example to .env and fill in your connection string.',
        );
    }
    return url;
}

const ssl =
    process.env.PGSSLMODE === 'disable' ? false : 'require';

const sql = postgres(getConnectionString(), {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 30,
    ssl,
});

module.exports = { sql };
