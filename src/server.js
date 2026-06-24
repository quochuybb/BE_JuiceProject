const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: "Welcome to JuiceMatch Backend API!" });
});

// Khởi động Server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}.`);
});
