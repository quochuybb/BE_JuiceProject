const playerService = require('../services/player.service');

const getMyData = async (req, res) => {
    try {
        // req.user được tạo ra từ auth.middleware.js
        const userId = req.user.userId; 
        
        const playerData = await playerService.getPlayerData(userId);
        return res.status(200).json(playerData);

    } catch (error) {
        console.error("Get player data error:", error);
        if (error.message === 'User not found') {
            return res.status(404).json({ message: error.message });
        }
        return res.status(500).json({ message: "Internal server error" });
    }
};

const saveProgress = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { session_data } = req.body;

        await playerService.saveProgress(userId, session_data);
        return res.status(200).json({ message: "Progress saved successfully" });

    } catch (error) {
        console.error("Save progress error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = {
    getMyData,
    saveProgress
};
