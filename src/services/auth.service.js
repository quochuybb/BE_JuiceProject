const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Hàm đăng ký
const registerUser = async (username, password) => {
    // 1. Kiểm tra username đã tồn tại chưa
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
        throw new Error('Username already exists');
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 3. Tạo user mới trong DB
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

// Hàm đăng nhập
const loginUser = async (username, password) => {
    // 1. Tìm user
    const user = await User.findOne({ where: { username } });
    if (!user) {
        throw new Error('Invalid username or password');
    }

    // 2. Kiểm tra password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        throw new Error('Invalid username or password');
    }

    // 3. Tạo JWT Token
    const payload = {
        userId: user.id,
        username: user.username
    };

    const token = jwt.sign(
        payload, 
        process.env.JWT_SECRET, 
        { expiresIn: '24h' } // Token sống 24 giờ
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
