const Cinema = require('../models/cinema.model');

class CinemaService {
    async createCinema(data) {
        return await Cinema.create(data);
    }
    async getAllCinemas() {
        return await Cinema.find().sort({ createdAt: -1 });
    }
    async getCinemaById(id) {
        return await Cinema.findById(id);
    }
    async updateCinema(id, data) {
        return await Cinema.findByIdAndUpdate(id, data, { new: true });
    }
    async deleteCinema(id) {
        return await Cinema.findByIdAndDelete(id);
    }
}
module.exports = new CinemaService();
