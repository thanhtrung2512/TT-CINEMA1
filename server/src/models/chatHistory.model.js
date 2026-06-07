const mongoose = require('mongoose');

/**
 * ChatHistory — Lưu lịch sử hội thoại với AI chatbot
 *
 * Mỗi document là 1 cuộc hội thoại (session) của 1 user hoặc 1 guest (theo sessionId).
 * Messages được lưu dạng mảng, giới hạn 100 tin/session để tránh quá lớn.
 */
const messageSchema = new mongoose.Schema(
    {
        role:      { type: String, enum: ['user', 'assistant'], required: true },
        content:   { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const chatHistorySchema = new mongoose.Schema(
    {
        // Nếu đã đăng nhập → lưu userId; nếu là khách → lưu sessionId từ cookie/localStorage
        userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: null },
        sessionId: { type: String, default: null }, // cho khách chưa đăng nhập

        title:    { type: String, default: 'Cuộc trò chuyện mới' }, // Tự động lấy từ tin nhắn đầu tiên
        messages: { type: [messageSchema], default: [] },

        // Thống kê nhanh
        messageCount: { type: Number, default: 0 },
        lastMessageAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Index để query nhanh theo user hoặc session
chatHistorySchema.index({ userId: 1, updatedAt: -1 });
chatHistorySchema.index({ sessionId: 1, updatedAt: -1 });

// Tự cập nhật lastMessageAt và messageCount khi thêm tin nhắn
chatHistorySchema.methods.addMessages = function (userMsg, assistantMsg) {
    this.messages.push(
        { role: 'user',      content: userMsg },
        { role: 'assistant', content: assistantMsg }
    );
    // Giới hạn 200 tin/session (100 lượt hỏi-đáp)
    if (this.messages.length > 200) {
        this.messages = this.messages.slice(-200);
    }
    this.messageCount = this.messages.length;
    this.lastMessageAt = new Date();

    // Tự đặt tiêu đề từ tin nhắn đầu tiên của user
    if (this.title === 'Cuộc trò chuyện mới' && userMsg) {
        this.title = userMsg.slice(0, 60) + (userMsg.length > 60 ? '...' : '');
    }
};

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
