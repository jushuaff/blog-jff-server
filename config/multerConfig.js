const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the uploads directory exists
const uploadDir = './public/uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const productName = req.body.name.replace(/\s+/g, '-').toLowerCase();
        const dateCreated = new Date().toISOString().split('T')[0];
        const fileName = `${productName}-${dateCreated}${ext}`;
        cb(null, fileName);
    }
});

// Ensure you have the right limits and filters
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

module.exports = upload;
