const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đảm bảo thư mục tồn tại
const uploadDir = 'src/uploads/movies';
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
const movieController = require('../controller/movie.controller');

// Cấu hình upload 2 field: poster và backdrop
const cpUpload = upload.fields([
    { name: 'poster', maxCount: 1 },
    { name: 'backdrop', maxCount: 1 }
]);

router.post('/create', authUser, cpUpload, asyncHandler(movieController.createMovie));
router.get('/all', asyncHandler(movieController.getAllMovies));
router.get('/:id', asyncHandler(movieController.getMovieById));
router.get('/slug/:slug', asyncHandler(movieController.getMovieBySlug));
router.post('/update/:id', authUser, cpUpload, asyncHandler(movieController.updateMovie));
router.delete('/delete/:id', authUser, asyncHandler(movieController.deleteMovie));

module.exports = router;
