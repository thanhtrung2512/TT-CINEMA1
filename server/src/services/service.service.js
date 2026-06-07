const ServiceModel = require('../models/service.model');

class ServiceLogic {
    async createService(data) {
        return await ServiceModel.create(data);
    }
    async getAllServices() {
        return await ServiceModel.find().sort({ createdAt: -1 });
    }
    async getServiceById(id) {
        return await ServiceModel.findById(id);
    }
    async updateService(id, data) {
        return await ServiceModel.findByIdAndUpdate(id, data, { new: true });
    }
    async deleteService(id) {
        return await ServiceModel.findByIdAndDelete(id);
    }
}
module.exports = new ServiceLogic();
