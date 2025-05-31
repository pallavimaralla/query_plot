require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

app.use((req, res, next) => {
    console.log(`➡️ ${req.method} ${req.originalUrl}`);
    next();
});


app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).send('Query Plot Backend is running!');
});

app.use('/api', routes);

console.log('App routes and middleware initialized.');



module.exports = app;