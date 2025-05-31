const multer = require('multer');
const path = require('path');
const { saveMetadata } = require('../services/postgresService');

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        console.log('📥 Incoming file:', file.originalname);
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage }).single('file');

module.exports = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error('❌ Upload error:', err);
            return res.status(500).json({ error: 'Upload failed' });
        }

        console.log('✅ File uploaded successfully:', req.file?.filename);
        try {
            await saveMetadata(req.file);
        } catch (metaErr) {
            console.error('❌ Error saving metadata:', metaErr);
        }

        res.status(200).json({ filename: req.file.filename });
    });
};
