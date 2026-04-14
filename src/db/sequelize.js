const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const { Sequelize } = require('sequelize');

function getDatabaseUrl() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        throw new Error(
            'DATABASE_URL is not set. Copy .env.example to .env and fill in your connection string.',
        );
    }
    return url;
}

const useSsl = process.env.PGSSLMODE !== 'disable';

const sequelize = new Sequelize(getDatabaseUrl(), {
    dialect: 'postgres',
    dialectOptions: useSsl
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
    logging: false,
    pool: { max: 10, idle: 20000, acquire: 30000 },
});

module.exports = sequelize;
