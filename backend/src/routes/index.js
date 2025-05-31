const express = require('express');
const router = express.Router();
const upload = require('../controllers/uploadController');
const query = require('../controllers/queryController');
const process = require('../controllers/processController');
const download = require('../controllers/downloadController');

router.post('/upload', upload);
router.post('/query', query);
router.post('/process', process);
router.get('/download/:key', download);

module.exports = router;