const VoucherService = require('../services/voucher.service');
const { OK } = require('../core/success.response');

class VoucherController {
    async createVoucher(req, res) {
        const voucher = await VoucherService.createVoucher(req.body);
        new OK({ message: 'Tạo mã giảm giá thành công', metadata: voucher }).send(res);
    }

    async getAllVouchers(req, res) {
        const vouchers = await VoucherService.getAllVouchers();
        new OK({ message: 'Lấy danh sách mã giảm giá thành công', metadata: vouchers }).send(res);
    }

    async getActiveVouchers(req, res) {
        const vouchers = await VoucherService.getActiveVouchers();
        new OK({ message: 'Lấy danh sách mã giảm giá hoạt động', metadata: vouchers }).send(res);
    }

    async getVoucherById(req, res) {
        const voucher = await VoucherService.getVoucherById(req.params.id);
        new OK({ message: 'Lấy thông tin mã giảm giá thành công', metadata: voucher }).send(res);
    }

    async updateVoucher(req, res) {
        const voucher = await VoucherService.updateVoucher(req.params.id, req.body);
        new OK({ message: 'Cập nhật mã giảm giá thành công', metadata: voucher }).send(res);
    }

    async deleteVoucher(req, res) {
        const voucher = await VoucherService.deleteVoucher(req.params.id);
        new OK({ message: 'Xóa mã giảm giá thành công', metadata: voucher }).send(res);
    }

    async applyVoucher(req, res) {
        const { code, orderValue } = req.body;
        const result = await VoucherService.applyVoucher(code, orderValue);
        new OK({ message: 'Áp dụng mã giảm giá thành công', metadata: result }).send(res);
    }
}

module.exports = new VoucherController();
