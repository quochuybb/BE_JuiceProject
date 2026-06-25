const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    // 1. Lấy token từ header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Định dạng: "Bearer <token>"

    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    // 2. Xác thực token
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
        if (err) {
            return res.status(403).json({ message: "Invalid or expired token." });
        }

        // 3. Gắn thông tin user vào request để các hàm sau sử dụng
        req.user = decodedUser; 
        next(); // Cho phép đi tiếp vào Controller
    });
};

module.exports = authenticateToken;
