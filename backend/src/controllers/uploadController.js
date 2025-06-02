const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { saveMetadata } = require('../services/postgresService');

// Store uploaded files with a timestamped filename
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: function (req, file, cb) {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext);
        const newFilename = `${timestamp}-${base}${ext}`;
        cb(null, newFilename);
    }
});

const upload = multer({ storage: storage }).single('file');

module.exports = (req, res) => {
    upload(req, res, async function (err) {
        if (err) {
            console.error('❌ Multer error:', err);
            return res.status(500).json({ error: 'File upload failed.' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        const file = req.file;
        console.log('📥 Incoming file:', file.originalname);
        console.log('✅ File uploaded successfully:', file.filename);

        try {
            // Save metadata using the original filename
            await saveMetadata(file.filename, file.originalname);
        } catch (error) {
            console.error('❌ Error saving metadata:', error);
        }

        // Return the timestamped filename to the frontend
        res.status(200).json({ filename: file.filename, originalFilename: file.originalname});
    });
};
