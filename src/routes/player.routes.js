const express = require('express');
const router = express.Router();
const playerController = require('../controllers/player.controller');
const authenticateToken = require('../middlewares/auth.middleware');

// Các route bên dưới bắt buộc phải có Token hợp lệ
router.use(authenticateToken);

// Lấy thông tin bản thân (GET /api/player/me)
router.get('/me', playerController.getMyData);

// Lưu tiến trình (POST /api/player/save)
router.post('/save', playerController.saveProgress);

module.exports = router;
