const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const modelUser = new Schema(
    {
        fullName: { type: String, require: true },
        email: { type: String, require: true },
        password: { type: String, require: true },
        isAdmin: { type: Boolean, default: false },
        isEmployee: { type: Boolean, default: false },
        address: { type: String, require: false, default: '' },
        phone: { type: String, require: false, default: '' },
        birthDay: { type: Date, require: false, default: null },
        typeLogin: { type: String, enum: ['email', 'google'] },
        avatar: { type: String, require: false, default: '' },
        membershipTier: { type: String, enum: ['Thành viên', 'Bạc', 'Vàng', 'Kim Cương'], default: 'Thành viên' },
        totalSpent: { type: Number, default: 0 },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('user', modelUser);
