const express = require('express');
const router = express.Router();

const slotsRoutes = require('./slots');
const scenesRoutes = require('./scenes');
const imagesRoutes = require('./images');
const playerRoutes = require('./player');
const wrapAsyncRoutes = require('../middleware/asyncRoutes');
const { requireApiKey, requireApiKeyForWrites } = require('../middleware/auth');

// Lets the frontend check a key before storing it
router.get('/auth/check', requireApiKey, (req, res) => {
  res.json({ success: true });
});

router.use(requireApiKeyForWrites);

router.use('/slots', wrapAsyncRoutes(slotsRoutes));
router.use('/scenes', wrapAsyncRoutes(scenesRoutes));
router.use('/images', wrapAsyncRoutes(imagesRoutes));
router.use('/player', wrapAsyncRoutes(playerRoutes));

module.exports = router;
