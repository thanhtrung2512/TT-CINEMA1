const GiftService = require('../services/gift.service');
const { OK, Created } = require('../core/success.response');

class GiftController {
    // Admin
    async createGift(req, res) {
        const gift = await GiftService.createGift(req.body);
        new Created({ message: 'Tạo quà tặng thành công', metadata: gift }).send(res);
    }

    async getAllGifts(req, res) {
        const gifts = await GiftService.getAllGifts();
        new OK({ message: 'Danh sách quà tặng', metadata: gifts }).send(res);
    }

    async getGiftById(req, res) {
        const gift = await GiftService.getGiftById(req.params.id);
        new OK({ message: 'Chi tiết quà tặng', metadata: gift }).send(res);
    }

    async updateGift(req, res) {
        const gift = await GiftService.updateGift(req.params.id, req.body);
        new OK({ message: 'Cập nhật quà tặng thành công', metadata: gift }).send(res);
    }

    async deleteGift(req, res) {
        const result = await GiftService.deleteGift(req.params.id);
        new OK({ message: result.message }).send(res);
    }

    // User
    async getMyGifts(req, res) {
        const gifts = await GiftService.getMyGifts(req.user.id);
        new OK({ message: 'Quà tặng của bạn', metadata: gifts }).send(res);
    }
}

module.exports = new GiftController();
