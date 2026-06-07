const { chatWithHistory, getMySessions, getSessionById, deleteSession } = require('../services/chatbot.service');
const { OK } = require('../core/success.response');

class ChatbotController {
    /**
     * Gửi tin nhắn — lưu lịch sử vào DB
     * Body: { message, sessionId? }
     * Auth: optional — nếu đã login dùng userId, nếu chưa dùng sessionId từ client
     */
    async chat(req, res) {
        const { message, sessionId } = req.body;
        if (!message?.trim()) {
            return res.status(400).json({ message: 'Vui lòng nhập nội dung tin nhắn' });
        }

        // Xác định identity: user đã login hoặc guest
        const identity = req.user?.id
            ? { userId: req.user.id }
            : { sessionId: sessionId || `guest_${Date.now()}` };

        const { reply, sessionId: savedSessionId } = await chatWithHistory(message.trim(), identity);

        new OK({ message: 'OK', metadata: { reply, sessionId: savedSessionId } }).send(res);
    }

    /**
     * Lấy danh sách phiên chat của user đã đăng nhập
     */
    async getMySessions(req, res) {
        const sessions = await getMySessions(req.user.id);
        new OK({ message: 'Lịch sử trò chuyện', metadata: sessions }).send(res);
    }

    /**
     * Lấy toàn bộ tin nhắn trong 1 phiên
     */
    async getSession(req, res) {
        const session = await getSessionById(req.params.id, req.user?.id);
        new OK({ message: 'Chi tiết phiên chat', metadata: session }).send(res);
    }

    /**
     * Xóa 1 phiên chat
     */
    async deleteSession(req, res) {
        const result = await deleteSession(req.params.id, req.user.id);
        new OK({ message: result.message }).send(res);
    }
}

module.exports = new ChatbotController();
