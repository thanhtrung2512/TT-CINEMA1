const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const modelMovie = new Schema(
    {
        title: { type: String, required: true },
        slug: { type: String, unique: true }, // URL friendly name
        description: { type: String, default: '' },
        posterUrl: { type: String, default: '' },
        backdropUrl: { type: String, default: '' },
        trailer: { type: String, default: '' },
        aiSummary: { type: String, default: null }, // Tóm tắt review bằng AI
        status: { 
            type: String, 
            enum: ['Đang chiếu', 'Sắp chiếu', 'Ngừng chiếu'], 
            default: 'Sắp chiếu' 
        },
        categories: [{ type: Schema.Types.ObjectId, ref: 'category' }], // Tham chiếu tới danh mục
        ageRating: { 
            type: String, 
            enum: ['P', 'T13', 'T16', 'T18'], 
            default: 'P' 
        },
        
        // Cấu trúc Mixed cho phép lưu linh hoạt thông tin (Đạo diễn, Diễn viên, Ngôn ngữ, Số tập, ...)
        details: { type: Schema.Types.Mixed, default: {} }
    },
    {
        timestamps: true,
    },
);

// Tự động tạo slug từ title trước khi lưu nếu chưa có
modelMovie.pre('save', function (next) {
    if (this.slug) {
        this.slug = String(this.slug).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    } else if (this.title) {
        this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    next();
});

modelMovie.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate();
    const slug = update?.slug ?? update?.$set?.slug;
    if (slug) {
        const sanitized = String(slug).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        if (update.$set) {
            update.$set.slug = sanitized;
        } else {
            update.slug = sanitized;
        }
    }
    next();
});

module.exports = mongoose.model('movie', modelMovie);
