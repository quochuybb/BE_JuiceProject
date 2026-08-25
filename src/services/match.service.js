const { redisClient } = require('../config/redis');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/user.model');

const addToMatchmakingQueue = async (userId) => {
    await redisClient.rPush('matchmaking_queue', userId);

    await redisClient.hSet(`match_status:${userId}`, {
        status: 'searching',
        time_queued: Date.now().toString()
    });
};

const removeFromMatchmakingQueue = async (userId) => {
    await redisClient.lRem('matchmaking_queue', 0, userId);
    await redisClient.del(`match_status:${userId}`);
};

const getMatchStatus = async (userId) => {
    const statusData = await redisClient.hGetAll(`match_status:${userId}`);
    console.log(`[Match Status] User: ${userId}`, statusData);
    if (!statusData || !statusData.status) {
        return { status: 'none' };
    }
    return statusData;
};

const matchMaking = async () => {
    if (await redisClient.lLen('matchmaking_queue') < 2) return;
    const listQueue = await redisClient.lRange("matchmaking_queue", 0, -1);

    const waitingPlayers = [];

    for (const userId of listQueue) {
        const statusData = await redisClient.hGetAll(`match_status:${userId}`);

        if (!statusData || statusData.status !== 'searching') continue;

        const userDb = await User.findOne({ where: { username: userId } });
        if (!userDb) continue;

        waitingPlayers.push({
            userId: userId,
            time_queued: parseInt(statusData.time_queued),
            mmr: userDb.mmr
        });
    }

    const matchedUsers = new Set();

    for (let i = 0; i < waitingPlayers.length; i++) {
        const player1 = waitingPlayers[i];

        if (matchedUsers.has(player1.userId)) continue;

        const waitTime1 = Date.now() - player1.time_queued;

        if (waitTime1 > 60000) {
            await removeFromMatchmakingQueue(player1.userId);
            continue;
        }

        const maxDiff1 = 100 + Math.floor(waitTime1 / 10000) * 50;

        for (let j = i + 1; j < waitingPlayers.length; j++) {
            const player2 = waitingPlayers[j];

            if (matchedUsers.has(player2.userId)) continue;

            const waitTime2 = Date.now() - player2.time_queued;
            const maxDiff2 = 100 + Math.floor(waitTime2 / 10000) * 50;

            const allowedDiff = Math.max(maxDiff1, maxDiff2);

            const actualDiff = Math.abs(player1.mmr - player2.mmr);

            if (actualDiff <= allowedDiff) {
                const roomId = uuidv4();

                await redisClient.hSet(`match_status:${player1.userId}`, {
                    status: 'match_found',
                    roomId: roomId,
                    serverIp: '127.0.0.1',
                    serverPort: '7777',
                    opponentName: player2.userId,
                    opponentMMR: player2.mmr
                });

                await redisClient.hSet(`match_status:${player2.userId}`, {
                    status: 'match_found',
                    roomId: roomId,
                    serverIp: '127.0.0.1',
                    serverPort: '7777',
                    opponentName: player1.userId,
                    opponentMMR: player1.mmr
                });

                await redisClient.lRem('matchmaking_queue', 0, player1.userId);
                await redisClient.lRem('matchmaking_queue', 0, player2.userId);

                matchedUsers.add(player1.userId);
                matchedUsers.add(player2.userId);

                console.log(`[Matchmaking] Đã ghép thành công: ${player1.userId} vs ${player2.userId} (Phòng: ${roomId})`);

                break;
            }
        }
    }
}

const submitMatchResult = async (winnerId, loserId) => {
    const winner = await User.findOne({ where: { username: winnerId } });
    const loser = await User.findOne({ where: { username: loserId } });

    if (!winner || !loser) {
        throw new Error('Not found player');
    }

    winner.mmr += 25;
    loser.mmr = Math.max(0, loser.mmr - 25);
    await winner.save();
    await loser.save();

    await redisClient.del(`match_status:${winnerId}`);
    await redisClient.del(`match_status:${loserId}`);

    return {
        winnerMmr: winner.mmr,
        loserMmr: loser.mmr
    };
};

module.exports = {
    addToMatchmakingQueue,
    removeFromMatchmakingQueue,
    getMatchStatus,
    matchMaking,
    submitMatchResult
};