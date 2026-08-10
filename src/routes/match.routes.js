const express = require('express');
const router = express.Router();
const matchController = require('../controllers/match.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Các đường dẫn này yêu cầu phải có Token hợp lệ
router.post('/find', authMiddleware, matchController.findMatch);
router.post('/cancel', authMiddleware, matchController.cancelMatch);
router.get('/status', authMiddleware, matchController.getMatchStatus);

// Đường dẫn nội bộ dành riêng cho Dedicated Server gọi (Không yêu cầu Token của user)
router.post('/internal/result', matchController.submitMatchResult);

module.exports = router;
