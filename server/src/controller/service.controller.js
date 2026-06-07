const ServiceLogic = require('../services/service.service');
const { OK } = require('../core/success.response');

class ServiceController {
    async createService(req, res) {
        const data = { ...req.body };
        if (req.file) {
            data.imageUrl = `/uploads/services/${req.file.filename}`;
        }
        const service = await ServiceLogic.createService(data);
        new OK({ message: 'Tạo dịch vụ thành công', metadata: service }).send(res);
    }
    async getAllServices(req, res) {
        const services = await ServiceLogic.getAllServices();
        new OK({ message: 'Lấy danh sách dịch vụ thành công', metadata: services }).send(res);
    }
    async updateService(req, res) {
        const data = { ...req.body };
        if (req.file) {
            data.imageUrl = `/uploads/services/${req.file.filename}`;
        }
        const service = await ServiceLogic.updateService(req.params.id, data);
        new OK({ message: 'Cập nhật dịch vụ thành công', metadata: service }).send(res);
    }
    async deleteService(req, res) {
        const service = await ServiceLogic.deleteService(req.params.id);
        new OK({ message: 'Xoá dịch vụ thành công', metadata: service }).send(res);
    }
}
module.exports = new ServiceController();
