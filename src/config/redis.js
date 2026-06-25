const redis = require('redis');
require('dotenv').config();

const client = redis.createClient({
    url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

client.on('error', (err) => {
    console.error('❌ Redis Client Error', err);
});

client.on('connect', () => {
    console.log('✅ Connected to Redis Matchmaking Queue successfully.');
});

// Hàm khởi tạo để dùng trong server.js sau này
const connectRedis = async () => {
    try {
        await client.connect();
    } catch (error) {
        console.error('❌ Unable to connect to Redis:', error);
    }
};

module.exports = {
    redisClient: client,
    connectRedis
};
