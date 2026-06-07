const modelUser = require('../models/users.model');
const modelApiKey = require('../models/apiKey.model');
// const modelOtp = require('../models/otp.model');
// const modelMessageChatbot = require('../models/messageChatbot.model');
// const { askHotelAssistant } = require('../utils/chatbot');

const { createToken, createRefreshToken, createApiKey, verifyToken } = require('../utils/jwt');
const { jwtDecode } = require('jwt-decode');
const jwt = require('jsonwebtoken');

const { ConflictRequestError, BadRequestError } = require('../core/error.response');

const otpGenerator = require('otp-generator');
const bcrypt = require('bcrypt');
const CryptoJS = require('crypto-js');
const SendMailForgotPassword = require('../utils/sendMailForgotPassword');

class UserService {
    async createUser(data) {
        const { fullName, email, password, phone, address } = data;
        const findUser = await modelUser.findOne({ email });
        if (findUser) {
            throw new ConflictRequestError('Email đã tồn tại');
        }

        const saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds);
        const passwordHash = bcrypt.hashSync(password, salt);

        // Tạo user mới
        const newUser = await modelUser.create({
            fullName,
            email,
            password: passwordHash,
            phone: phone || '',
            address: address || '',
            typeLogin: 'email',
        });

        // Tạo API key và token
        await createApiKey(newUser._id);
        const token = await createToken({ id: newUser._id });
        const refreshToken = await createRefreshToken({ id: newUser._id });

        return { token, refreshToken };
    }

    async authUser(id) {
        const findUser = await modelUser.findById(id);
        if (!findUser) {
            throw new BadRequestError('User không tồn tại');
        }
        const userString = JSON.stringify(findUser);
        const auth = CryptoJS.AES.encrypt(userString, process.env.SECRET_CRYPTO).toString();
        return auth;
    }

    async login(data) {
        const { email, password } = data;
        const user = await modelUser.findOne({ email });
        if (!user) {
            throw new BadRequestError('Tài khoản hoặc mật khẩu không chính xác');
        }
        if (user.typeLogin === 'google') {
            throw new BadRequestError('Tài khoản đăng nhập bằng google');
        }

        const checkPassword = bcrypt.compareSync(password, user.password);
        if (!checkPassword) {
            throw new BadRequestError('Tài khoản hoặc mật khẩu không chính xác');
        }
        await createApiKey(user._id);
        const token = await createToken({ id: user._id });
        const refreshToken = await createRefreshToken({ id: user._id });
        return { token, refreshToken };
    }

    async logout(id) {
        await modelApiKey.deleteMany({ userId: id });
        return { status: 200 };
    }

    async refreshToken(refreshToken) {
        const decoded = await verifyToken(refreshToken);

        const user = await modelUser.findOne({ _id: decoded.id });

        const token = await createToken({ id: user._id });
        return { token };
    }

    async getAllUser() {
        const data = await modelUser.find();
        return data;
    }

    async updateUserAdmin(id, data) {
        const { fullName, email, phone, address, isAdmin, typeLogin } = data;
        const user = await modelUser.findOne({ _id: id });
        if (!user) {
            throw new BadRequestError('Tài khoản không tồn tại');
        }
        user.fullName = fullName;
        user.email = email;
        user.phone = phone;
        user.address = address;
        user.isAdmin = isAdmin;
        user.typeLogin = typeLogin;
        await user.save();
        return user;
    }

    async deleteUser(id) {
        const user = await modelUser.findOne({ _id: id });
        if (!user) {
            throw new BadRequestError('Tài khoản không tồn tại');
        }
        await user.deleteOne();
        return user;
    }

    async changePassword(id, data) {
        const { currentPassword, newPassword } = data;
        const user = await modelUser.findOne({ _id: id });
        if (!user) {
            throw new BadRequestError('Người dùng không tồn tại');
        }
        const isPasswordValid = bcrypt.compareSync(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new BadRequestError('Mật khẩu hiện tại không chính xác');
        }
        const saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds);
        const passwordHash = bcrypt.hashSync(newPassword, salt);
        user.password = passwordHash;
        await user.save();
        return user;
    }

    async updateUser(id, data) {
        const { fullName, address, phone, birthDay, email } = data;
        const user = await modelUser.findOne({ _id: id });
        if (!user) {
            throw new BadRequestError('Người dùng không tồn tại');
        }
        user.fullName = fullName;
        user.address = address;
        user.phone = phone;
        user.birthDay = birthDay;
        user.email = email;
        await user.save();
        return user;
    }

    async uploadAvatar(id, filename) {
        const user = await modelUser.findOne({ _id: id });
        if (!user) {
            throw new BadRequestError('Người dùng không tồn tại');
        }
        user.avatar = `/uploads/avatars/${filename}`; // Lưu lại đường dẫn tương đối thay vì chỉ tên file
        await user.save();
        return user;
    }

    async addTotalSpentAndCheckTier(userId, amount) {
        if (!userId) return null;
        const user = await modelUser.findById(userId);
        if (!user) return null;

        user.totalSpent = (user.totalSpent || 0) + amount;

        // Logic xếp hạng thành viên:
        // < 1 triệu: Thành viên
        // 1tr - 3tr: Bạc
        // 3tr - 10tr: Vàng
        // >= 10tr: Kim Cương
        if (user.totalSpent >= 10000000) {
            user.membershipTier = 'Kim Cương';
        } else if (user.totalSpent >= 3000000) {
            user.membershipTier = 'Vàng';
        } else if (user.totalSpent >= 1000000) {
            user.membershipTier = 'Bạc';
        } else {
            user.membershipTier = 'Thành viên';
        }

        await user.save();
        return user;
    }

    async loginGoogle(credential) {
        const dataToken = jwtDecode(credential);
        const user = await modelUser.findOne({ email: dataToken.email });

        if (user) {
            await createApiKey(user._id);
            const token = await createToken({ id: user._id });
            const refreshToken = await createRefreshToken({ id: user._id });
            return { token, refreshToken };
        } else {
            const newUser = await modelUser.create({
                email: dataToken.email,
                typeLogin: 'google',
                fullName: dataToken.name,
            });
            await createApiKey(newUser._id);
            const token = await createToken({ id: newUser._id });
            const refreshToken = await createRefreshToken({ id: newUser._id });
            return { token, refreshToken };
        }
    }

    async forgotPassword(email) {
        const user = await modelUser.findOne({ email });
        if (!user) {
            throw new BadRequestError('Tài khoản không tồn tại');
        }

        const token = jwt.sign({ id: user._id }, process.env.SECRET_CRYPTO, { expiresIn: '5m' });

        const otp = otpGenerator.generate(6, {
            digits: true,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false,
        });

        const saltRounds = 10;

        const otpHash = bcrypt.hashSync(otp, saltRounds);

        await modelOtp.create({ email: user.email, otp: otpHash });

        await SendMailForgotPassword(user.email, otp);

        return { token, otp };
    }

    async resetPassword(token, otpUser, newPassword) {
        const decoded = jwt.verify(token, process.env.SECRET_CRYPTO);
        const user = await modelUser.findOne({ _id: decoded.id });

        if (!user) {
            throw new BadRequestError('Tài khoản không tồn tại');
        }
        const findOtp = await modelOtp.findOne({ email: user.email }).sort({ createdAt: -1 });

        if (!findOtp) {
            throw new BadRequestError('Mã OTP không hợp lệ');
        }

        const checkOtp = bcrypt.compareSync(otpUser, findOtp.otp);
        if (!checkOtp) {
            throw new BadRequestError('Mã OTP không hợp lệ');
        }
        const saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds);
        const passwordHash = bcrypt.hashSync(newPassword, salt);
        user.password = passwordHash;
        await user.save();
        return user;
    }

    async chatbot(question, userId) {
        const response = await askHotelAssistant(question);

        await modelMessageChatbot.create({
            userId: userId,
            sender: 'user',
            content: question,
        });

        await modelMessageChatbot.create({
            userId: userId,
            sender: 'bot',
            content: response,
        });

        return response;
    }

    async getMessageChatbot(userId) {
        const messageChatbot = await modelMessageChatbot.find({ userId });
        return messageChatbot;
    }

    // ── Admin methods ─────────────────────────────────────────

    async getAllUser() {
        const users = await modelUser.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .lean();
        return users;
    }

    async updateUserAdmin(id, data) {
        const { fullName, email, phone, address, isAdmin, isEmployee, membershipTier } = data;
        const updated = await modelUser.findByIdAndUpdate(
            id,
            { fullName, email, phone, address, isAdmin, isEmployee, membershipTier },
            { new: true, select: '-password' }
        );
        if (!updated) throw new BadRequestError('Không tìm thấy người dùng');
        return updated;
    }

    async deleteUser(id) {
        const deleted = await modelUser.findByIdAndDelete(id);
        if (!deleted) throw new BadRequestError('Không tìm thấy người dùng');
        return deleted;
    }
}

module.exports = new UserService();
