const express = require('express');
const router = express.Router();

const slotsRoutes = require('./slots');
const scenesRoutes = require('./scenes');
const imagesRoutes = require('./images');

router.use('/slots', slotsRoutes);
router.use('/scenes', scenesRoutes);
router.use('/images', imagesRoutes);

module.exports = router;
