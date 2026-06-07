const MovieService = require('../services/movie.service');
const { OK } = require('../core/success.response');

class MovieController {
    async createMovie(req, res) {
        const data = { ...req.body };

        // Xử lý file ảnh (multer)
        if (req.files) {
            if (req.files.poster && req.files.poster.length > 0) {
                data.posterUrl = `/uploads/movies/${req.files.poster[0].filename}`;
            }
            if (req.files.backdrop && req.files.backdrop.length > 0) {
                data.backdropUrl = `/uploads/movies/${req.files.backdrop[0].filename}`;
            }
        }

        const movie = await MovieService.createMovie(data);
        new OK({ message: 'Tạo phim thành công', metadata: movie }).send(res);
    }

    async getAllMovies(req, res) {
        const { search } = req.query;
        const movies = await MovieService.getAllMovies(search);
        new OK({ message: 'Lấy danh sách phim thành công', metadata: movies }).send(res);
    }

    async getMovieById(req, res) {
        const { id } = req.params;
        const movie = await MovieService.getMovieById(id);
        new OK({ message: 'Lấy thông tin phim thành công', metadata: movie }).send(res);
    }

    async getMovieBySlug(req, res) {
        const { slug } = req.params;
        const movie = await MovieService.getMovieBySlug(slug);
        new OK({ message: 'Lấy thông tin phim thành công', metadata: movie }).send(res);
    }

    async updateMovie(req, res) {
        const { id } = req.params;
        const data = { ...req.body };

        // Xử lý file ảnh (nếu có cập nhật ảnh mới)
        if (req.files) {
            if (req.files.poster && req.files.poster.length > 0) {
                data.posterUrl = `/uploads/movies/${req.files.poster[0].filename}`;
            }
            if (req.files.backdrop && req.files.backdrop.length > 0) {
                data.backdropUrl = `/uploads/movies/${req.files.backdrop[0].filename}`;
            }
        }

        const movie = await MovieService.updateMovie(id, data);
        new OK({ message: 'Cập nhật phim thành công', metadata: movie }).send(res);
    }

    async deleteMovie(req, res) {
        const { id } = req.params;
        const movie = await MovieService.deleteMovie(id);
        new OK({ message: 'Xóa phim thành công', metadata: movie }).send(res);
    }
}

module.exports = new MovieController();
