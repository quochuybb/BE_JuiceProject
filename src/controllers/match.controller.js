const matchService = require('../services/match.service');

exports.findMatch = async (req, res) => {
    try {
        const userId = req.user.username;

        await matchService.addToMatchmakingQueue(userId);

        console.log(`[Matchmaking] ${userId} đã vào hàng chờ.`);
        res.json({ message: "Đã vào hàng chờ" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi Server" });
    }
};

exports.cancelMatch = async (req, res) => {
    try {
        const userId = req.user.username;

        await matchService.removeFromMatchmakingQueue(userId);

        console.log(`[Matchmaking] ${userId} đã hủy tìm trận.`);
        res.json({ message: "Đã hủy tìm trận" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi Server" });
    }
};

exports.getMatchStatus = async (req, res) => {
    try {
        const userId = req.user.username;

        const statusData = await matchService.getMatchStatus(userId);

        res.json(statusData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi Server" });
    }
};

exports.submitMatchResult = async (req, res) => {
    try {
        const { winnerId, loserId } = req.body;

        if (!winnerId || !loserId) {
            return res.status(400).json({ message: "Thiếu winnerId hoặc loserId" });
        }

        const result = await matchService.submitMatchResult(winnerId, loserId);

        console.log(`[MatchResult] Trận đấu kết thúc. ${winnerId} thắng ${loserId}.`);
        res.json({ message: "Cập nhật kết quả thành công", data: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi Server", error: error.message });
    }
};
