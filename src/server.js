const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB, sequelize } = require('./config/database');
const { connectRedis } = require('./config/redis');
const authRoutes = require('./routes/auth.routes');
const playerRoutes = require('./routes/player.routes');
const matchRoutes = require('./routes/match.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/player', playerRoutes);
app.use('/api/match', matchRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: "Welcome to JuiceMatch Backend API!" });
});

// Khởi động Server
const startServer = async () => {
    // Kết nối DB
    await connectDB();
    await connectRedis();

    // Tự động tạo bảng nếu chưa có (Dùng trong lúc dev)
    // sequelize.sync({ alter: true }) có thể làm thay đổi cấu trúc bảng
    await sequelize.sync(); 
    
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}.`);
    });
};

startServer();
