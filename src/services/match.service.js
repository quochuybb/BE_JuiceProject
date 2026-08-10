const { redisClient } = require('../config/redis');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/user.model');

// Hàm xử lý nghiệp vụ tìm trận
const addToMatchmakingQueue = async (userId) => {
    // 1. Nhét vào cuối hàng đợi
    await redisClient.rPush('matchmaking_queue', userId);

    // 2. Ghi chú trạng thái, lưu thêm thời gian lúc bắt đầu tìm
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
    if (!statusData || !statusData.status) {
        return { status: 'none' }; // Chưa tìm trận
    }
    return statusData;
};

const matchMaking = async () => {
    if (await redisClient.lLen('matchmaking_queue') < 2) return;
    const listQueue = await redisClient.lRange("matchmaking_queue", 0, -1);

    const waitingPlayers = [];

    // Lặp qua từng người trong hàng đợi
    for (const userId of listQueue) {
        // 1. Lấy thông tin thời gian chờ từ Redis
        const statusData = await redisClient.hGetAll(`match_status:${userId}`);

        // Nếu user đã hủy tìm trận hoặc trạng thái không phải searching thì bỏ qua
        if (!statusData || statusData.status !== 'searching') continue;

        // 2. Query Postgres để lấy chỉ số MMR của user
        const userDb = await User.findOne({ where: { username: userId } });
        if (!userDb) continue;

        // 3. Gói tất cả vào một Object và ném vào mảng waitingPlayers
        waitingPlayers.push({
            userId: userId,
            time_queued: parseInt(statusData.time_queued), // Biến chuỗi text thành số nguyên
            mmr: userDb.mmr
        });
    }

    // (Bước 4: Thuật toán ghép cặp sẽ viết tiếp ở đây)
    const matchedUsers = new Set(); // Dùng để đánh dấu những người đã ghép thành công trong đợt quét này

    for (let i = 0; i < waitingPlayers.length; i++) {
        const player1 = waitingPlayers[i];

        // Bỏ qua nếu player1 đã được ghép cặp rồi
        if (matchedUsers.has(player1.userId)) continue;

        const waitTime1 = Date.now() - player1.time_queued;

        // Nếu đợi quá 60 giây (60000 mili-giây), cho timeout
        if (waitTime1 > 60000) {
            // LƯU Ý LỖI: removeFromMatchmakingQueue là hàm bất đồng bộ, cậu quên chữ 'await' ở bản nháp!
            await removeFromMatchmakingQueue(player1.userId);
            continue; // Bỏ qua người này, xét người tiếp theo
        }

        // Tính độ giãn MMR cho player 1: cơ bản là 100, cứ mỗi 10 giây (10000 ms) chờ thêm thì nới rộng thêm 50 điểm
        const maxDiff1 = 100 + Math.floor(waitTime1 / 10000) * 50;

        // Bắt đầu vòng lặp thứ 2 để tìm Player 2 (chỉ lấy những người đứng sau player1 trong mảng)
        for (let j = i + 1; j < waitingPlayers.length; j++) {
            const player2 = waitingPlayers[j];

            if (matchedUsers.has(player2.userId)) continue;

            const waitTime2 = Date.now() - player2.time_queued;
            const maxDiff2 = 100 + Math.floor(waitTime2 / 10000) * 50;

            // Tìm độ chênh lệch tối đa cho phép giữa 2 người (ai đợi lâu hơn thì lấy MaxDiff của người đó làm chuẩn)
            const allowedDiff = Math.max(maxDiff1, maxDiff2);
            
            // Lấy trị tuyệt đối khoảng cách điểm thực tế của 2 người
            const actualDiff = Math.abs(player1.mmr - player2.mmr);

            // KIỂM TRA ĐIỀU KIỆN GHÉP CẶP
            if (actualDiff <= allowedDiff) {
                // TÌM THẤY TRẬN!
                const roomId = uuidv4(); // Sinh mã phòng ngẫu nhiên từ thư viện uuid

                // 1. Cập nhật hồ sơ Redis cho Player 1
                await redisClient.hSet(`match_status:${player1.userId}`, {
                    status: 'match_found',
                    roomId: roomId,
                    serverIp: '127.0.0.1', 
                    serverPort: '7777',
                    opponentName: player2.userId,
                    opponentMMR: player2.mmr
                });

                // 2. Cập nhật hồ sơ Redis cho Player 2
                await redisClient.hSet(`match_status:${player2.userId}`, {
                    status: 'match_found',
                    roomId: roomId,
                    serverIp: '127.0.0.1',
                    serverPort: '7777',
                    opponentName: player1.userId,
                    opponentMMR: player1.mmr
                });

                // 3. Đá cả 2 ra khỏi hàng đợi Queue
                await redisClient.lRem('matchmaking_queue', 0, player1.userId);
                await redisClient.lRem('matchmaking_queue', 0, player2.userId);

                // 4. Đánh dấu cả 2 đã ghép xong để không bị đem đi ghép tiếp ở các vòng lặp sau
                matchedUsers.add(player1.userId);
                matchedUsers.add(player2.userId);

                console.log(`[Matchmaking] Đã ghép thành công: ${player1.userId} vs ${player2.userId} (Phòng: ${roomId})`);
                
                // Đã tìm được đối thủ cho player1 rồi thì break vòng lặp j, chuyển sang i tiếp theo
                break; 
            }
        }
    }
}

const submitMatchResult = async (winnerId, loserId) => {
    // 1. Tìm trong DB
    const winner = await User.findOne({ where: { username: winnerId } });
    const loser = await User.findOne({ where: { username: loserId } });

    if (!winner || !loser) {
        throw new Error('Không tìm thấy người chơi');
    }

    // 2. Tính toán MMR (Đơn giản: Thắng +25, Thua -25)
    winner.mmr += 25;
    loser.mmr = Math.max(0, loser.mmr - 25); // Đảm bảo MMR không bị âm

    // 3. Lưu vào DB
    await winner.save();
    await loser.save();

    // 4. Xóa trạng thái trận đấu trên Redis để người chơi có thể tìm trận mới
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