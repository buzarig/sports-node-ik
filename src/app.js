const express = require('express');
const path = require('path');

const scheduleRoutes = require('./routes/schedule.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// ---- View engine (EJS) ----
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// ---- Static files ----
app.use(express.static(path.join(__dirname, 'public')));

// ---- Body parser (for POST forms) ----
app.use(express.urlencoded({ extended: true }));

// ---- Routes ----
app.use('/', scheduleRoutes);
app.use('/', adminRoutes);

// ---- 404 fallback ----
app.use((req, res) => {
    res.status(404).render('layout', {
        title: '404',
        body: 'pages/404',
    });
});

app.listen(PORT, () => {
    console.log(`Server running: http://localhost:${PORT}`);
});
