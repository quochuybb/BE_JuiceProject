const User = require('../models/user.model');

// Lấy thông tin người chơi bằng ID
const getPlayerData = async (userId) => {
    const user = await User.findByPk(userId, {
        attributes: ['id', 'username', 'gold', 'gem', 'mmr', 'session_data'] // Không trả về password_hash
    });

    if (!user) {
        throw new Error('User not found');
    }

    return user;
};

// Cập nhật session_data
const saveProgress = async (userId, sessionData) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new Error('User not found');
    }

    user.session_data = sessionData;
    await user.save();
    return true;
};

module.exports = {
    getPlayerData,
    saveProgress
};
