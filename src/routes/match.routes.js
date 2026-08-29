const express = require('express');
const router = express.Router();
const matchController = require('../controllers/match.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const internalMiddleware = require('../middlewares/internal.middleware');

router.post('/find', authMiddleware, matchController.findMatch);
router.post('/cancel', authMiddleware, matchController.cancelMatch);
router.get('/status', authMiddleware, matchController.getMatchStatus);

router.post('/internal/result', internalMiddleware, matchController.submitMatchResult);

module.exports = router;
