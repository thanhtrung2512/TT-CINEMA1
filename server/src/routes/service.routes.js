const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'src/uploads/services';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.fieldname + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

const { asyncHandler, authUser } = require('../auth/checkAuth');
const serviceController = require('../controller/service.controller');

router.post('/create', authUser, upload.single('image'), asyncHandler(serviceController.createService));
router.get('/all', asyncHandler(serviceController.getAllServices));
router.post('/update/:id', authUser, upload.single('image'), asyncHandler(serviceController.updateService));
router.delete('/delete/:id', authUser, asyncHandler(serviceController.deleteService));

module.exports = router;
