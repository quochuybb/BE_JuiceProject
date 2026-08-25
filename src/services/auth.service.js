const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const registerUser = async (username, password) => {
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
        throw new Error('Username already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
        username,
        password_hash,
        gold: 0,
        gem: 0,
        mmr: 1000,
        session_data: ""
    });

    return { id: newUser.id, username: newUser.username };
};

const loginUser = async (username, password) => {
    const user = await User.findOne({ where: { username } });
    if (!user) {
        throw new Error('Invalid username or password');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        throw new Error('Invalid username or password');
    }

    const payload = {
        userId: user.id,
        username: user.username
    };

    const token = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );

    return {
        token,
        user: {
            id: user.id,
            username: user.username,
            gold: user.gold,
            gem: user.gem,
            mmr: user.mmr,
            session_data: user.session_data
        }
    };
};

module.exports = {
    registerUser,
    loginUser
};
