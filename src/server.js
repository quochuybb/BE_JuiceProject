const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB, sequelize } = require('./config/database');
const { connectRedis } = require('./config/redis');
const authRoutes = require('./routes/auth.routes');
const playerRoutes = require('./routes/player.routes');
const matchRoutes = require('./routes/match.routes');
const matchMaking = require('./services/match.service');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/player', playerRoutes);
app.use('/api/match', matchRoutes);

app.get('/', (req, res) => {
    res.json({ message: "Welcome to JuiceMatch Backend API!" });
});

const startServer = async () => {
    await connectDB();
    await connectRedis();

    await sequelize.sync();

    setInterval(async () => {
        console.log("Matching...");
        await matchMaking.matchMaking();
    }, 2000);

    app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}.`);
    });
};

startServer();
