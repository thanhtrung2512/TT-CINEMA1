const Groq = require('groq-sdk');
const Movie = require('../models/movies.model');
const Showtime = require('../models/showtime.model');
const ChatHistory = require('../models/chatHistory.model');

require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Lấy context phim đang chiếu từ DB để đưa vào system prompt
 */
async function buildMovieContext() {
    try {
        const movies = await Movie.find({ status: 'Đang chiếu' })
            .populate('categories', 'name')
            .select('title description categories details status posterUrl')
            .limit(20)
            .lean();

        if (!movies.length) return 'Hiện tại không có phim nào đang chiếu.';

        return movies
            .map((m) => {
                const cats = m.categories?.map((c) => c.name).join(', ') || 'Chưa phân loại';
                const director = m.details?.director || '';
                const cast = m.details?.cast || m.details?.actors || '';
                const duration = m.details?.duration || m.details?.runtime || '';
                const lang = m.details?.language || '';
                const age = m.details?.ageRating || m.details?.rated || '';
                return [
                    `Phim: "${m.title}"`,
                    `Thể loại: ${cats}`,
                    director ? `Đạo diễn: ${director}` : '',
                    cast ? `Diễn viên: ${cast}` : '',
                    duration ? `Thời lượng: ${duration} phút` : '',
                    lang ? `Ngôn ngữ: ${lang}` : '',
                    age ? `Phân loại độ tuổi: ${age}` : '',
                    m.description ? `Nội dung: ${m.description.slice(0, 200)}` : '',
                ]
                    .filter(Boolean)
                    .join('\n');
            })
            .join('\n\n---\n\n');
    } catch {
        return 'Không thể tải danh sách phim lúc này.';
    }
}

/**
 * Gọi Groq AI với lịch sử hội thoại
 */
async function chat(userMessage, history = []) {
    const movieContext = await buildMovieContext();

    const systemPrompt = `Bạn là trợ lý AI thông minh của rạp chiếu phim TT CINEMA — một hệ thống đặt vé xem phim trực tuyến.

Nhiệm vụ của bạn:
- Tư vấn phim đang chiếu phù hợp với sở thích của khách hàng
- Trả lời câu hỏi về nội dung phim, diễn viên, đạo diễn, thể loại
- Hướng dẫn cách đặt vé, chọn ghế, thanh toán
- Giải đáp về chương trình ưu đãi, voucher, quà tặng
- Gợi ý phim theo tâm trạng: hài hước, hành động, tình cảm, kinh dị, gia đình...
- Trả lời ngắn gọn, thân thiện, bằng tiếng Việt

Danh sách phim đang chiếu tại TT CINEMA:
${movieContext}

Quy tắc:
- Luôn trả lời bằng tiếng Việt
- Ưu tiên giới thiệu phim từ danh sách trên
- Nếu không biết thông tin cụ thể, hướng dẫn khách liên hệ hotline hoặc truy cập website
- Không bịa đặt thông tin suất chiếu cụ thể (giờ, phòng) vì không có dữ liệu đó
- Giữ câu trả lời dưới 200 từ, thân thiện và tự nhiên`;

    const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-10), // giới hạn 10 tin nhắn gần nhất
        { role: 'user', content: userMessage },
    ];

    const response = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages,
        temperature: 0.7,
        max_tokens: 500,
    });

    return response.choices[0]?.message?.content || 'Xin lỗi, tôi không thể trả lời lúc này.';
}

/**
 * Lấy hoặc tạo mới session chat
 */
async function getOrCreateSession({ userId, sessionId }) {
    const query = userId ? { userId } : { sessionId };
    let session = await ChatHistory.findOne(query).sort({ updatedAt: -1 });
    if (!session) {
        session = new ChatHistory(userId ? { userId } : { sessionId });
    }
    return session;
}

/**
 * Gửi tin nhắn, lưu lịch sử vào DB
 * @param {string} userMessage - Tin nhắn của user
 * @param {{ userId?, sessionId? }} identity - Định danh user hoặc guest
 */
async function chatWithHistory(userMessage, identity = {}) {
    const session = await getOrCreateSession(identity);

    // Lấy 10 tin nhắn gần nhất làm history cho AI
    const recentHistory = session.messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));

    const reply = await chat(userMessage, recentHistory);

    // Lưu vào DB (non-blocking nếu lỗi không ảnh hưởng response)
    try {
        session.addMessages(userMessage, reply);
        await session.save();
    } catch (err) {
        console.error('[ChatHistory] Save error:', err.message);
    }

    return { reply, sessionId: session._id };
}

/**
 * Lấy danh sách các phiên chat của user
 */
async function getMySessions(userId) {
    return ChatHistory.find({ userId })
        .select('title messageCount lastMessageAt createdAt')
        .sort({ updatedAt: -1 })
        .limit(20)
        .lean();
}

/**
 * Lấy chi tiết 1 phiên chat
 */
async function getSessionById(sessionId, userId) {
    const query = { _id: sessionId };
    if (userId) query.userId = userId;
    const session = await ChatHistory.findOne(query).lean();
    if (!session) throw new Error('Không tìm thấy phiên chat');
    return session;
}

/**
 * Xóa 1 phiên chat
 */
async function deleteSession(sessionId, userId) {
    await ChatHistory.findOneAndDelete({ _id: sessionId, userId });
    return { message: 'Xóa phiên chat thành công' };
}

/**
 * AI Tóm tắt đánh giá (Review) của bộ phim
 * @param {string} movieTitle - Tên phim
 * @param {Array<string>} reviews - Mảng chứa nội dung các đánh giá
 */
async function summarizeMovieReviews(movieTitle, reviews) {
    if (!reviews || reviews.length === 0) return null;

    const systemPrompt = `Bạn là một AI chuyên gia phê bình điện ảnh. Dưới đây là các đánh giá của khán giả về bộ phim "${movieTitle}".
Nhiệm vụ của bạn là đọc các đánh giá này và viết 1 đoạn văn TÓM TẮT NGẮN GỌN (khoảng 3-5 câu) về cảm nhận chung của khán giả.
Giọng văn khách quan, tổng hợp được điểm khen và chê (nếu có). Trả về TRỰC TIẾP đoạn văn, không cần mở bài hay kết luận.`;

    const userPrompt = `Các đánh giá:\n${reviews.map((r) => `- "${r}"`).join('\n')}`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.3,
            max_tokens: 300,
        });

        return completion.choices[0]?.message?.content || null;
    } catch (error) {
        console.error('[Chatbot] Summarize Review Error:', error.message);
        return null;
    }
}

module.exports = {
    chat,
    chatWithHistory,
    getMySessions,
    getSessionById,
    deleteSession,
    summarizeMovieReviews,
};
