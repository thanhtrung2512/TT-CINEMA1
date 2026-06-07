const Movie = require('../models/movies.model');

class MovieService {
    async createMovie(data) {
        // Nếu có JSON string, parse details
        if (typeof data.details === 'string') {
            try {
                data.details = JSON.parse(data.details);
            } catch (error) {
                // Ignore parse error
            }
        }
        if (typeof data.categories === 'string') {
            try {
                data.categories = JSON.parse(data.categories);
            } catch (error) {
                // Ignore parse error
            }
        }
        const movie = await Movie.create(data);
        return movie;
    }

    async getAllMovies(searchQuery = '') {
        const filter = searchQuery 
            ? { title: { $regex: searchQuery, $options: 'i' } } 
            : {};
        const movies = await Movie.find(filter).populate('categories', 'categoryName').sort({ createdAt: -1 });
        return movies;
    }

    async getMovieById(id) {
        const movie = await Movie.findById(id).populate('categories', 'name');
        if (!movie) {
            throw new Error('Phim không tồn tại');
        }
        return movie;
    }

    async getMovieBySlug(slug) {
        const movie = await Movie.findOne({ slug }).populate('categories', 'name');
        if (!movie) {
            throw new Error('Phim không tồn tại');
        }
        return movie;
    }

    async updateMovie(id, data) {
        if (typeof data.details === 'string') {
            try {
                data.details = JSON.parse(data.details);
            } catch (error) {}
        }
        if (typeof data.categories === 'string') {
            try {
                data.categories = JSON.parse(data.categories);
            } catch (error) {}
        }
        const movie = await Movie.findByIdAndUpdate(id, data, { new: true });
        return movie;
    }

    async deleteMovie(id) {
        const movie = await Movie.findByIdAndDelete(id);
        return movie;
    }
}

module.exports = new MovieService();
