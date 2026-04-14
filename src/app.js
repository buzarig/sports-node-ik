require('dotenv').config();

const express = require('express');
const path = require('path');

const scheduleRoutes = require('./routes/schedule.routes');
const adminRoutes = require('./routes/admin.routes');
const apiRoutes = require('./routes/api.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// ---- View engine (EJS) ----
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// ---- Static files ----
app.use(express.static(path.join(__dirname, 'public')));

// ---- Body parser (for POST forms) ----
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ---- Routes ----
app.use('/', scheduleRoutes);
app.use('/', adminRoutes);
app.use('/api', apiRoutes);

// ---- 404 fallback ----
app.use((req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Ресурс не знайдено' });
    }
    res.status(404).render('layout', {
        title: '404',
        body: 'pages/404',
    });
});

app.listen(PORT, () => {
    console.log(`Server running: http://localhost:${PORT}`);
});
