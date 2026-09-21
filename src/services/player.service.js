const User = require('../models/user.model');

const getPlayerData = async (userId) => {
    const user = await User.findByPk(userId, {
        attributes: ['id', 'username', 'gold', 'gem', 'mmr', 'session_data'] // Không trả về password_hash
    });

    if (!user) {
        throw new Error('User not found');
    }

    return user;
};

const saveProgress = async (userId, sessionData) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new Error('User not found');
    }

    user.session_data = sessionData;
    await user.save();
    return true;
};
const getEquippedRecipes = async (username) => {
    const user = await User.findOne({
        where: { username: username },
        attributes: ['session_data']
    });
    if (!user) {
        throw new Error('User not found');
    }
    if (!user.session_data) {
        return [];
    }
    try {
        const sessionData = JSON.parse(user.session_data);
        const recipeIDs = sessionData.recipeListIDs || [];
        return recipeIDs;
    } catch (error) {
        console.error(`[PlayerService] Failed to parse session_data for ${username}:`, error);
        return [];
    }
};

module.exports = {
    getPlayerData,
    saveProgress,
    getEquippedRecipes
};
