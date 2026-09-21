const express = require('express');
const router = express.Router();
const playerController = require('../controllers/player.controller');
const authenticateToken = require('../middlewares/auth.middleware');
const internalMiddleware = require('../middlewares/internal.middleware');

router.get('/internal/:username/equipped-recipes', internalMiddleware, playerController.getEquippedRecipes);

router.use(authenticateToken);

router.get('/me', playerController.getMyData);
router.post('/save', playerController.saveProgress);

module.exports = router;
