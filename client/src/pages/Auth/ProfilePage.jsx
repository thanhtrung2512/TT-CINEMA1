import { useState, useEffect } from 'react';
import { useStore } from '@/hooks/useStore';
import { requestUpdateUser, requestUploadAvatar, requestChangePassword } from '@/config/UserRequest';
import { User, Mail, Phone, MapPin, Camera, Save, Loader2, Key, Crown } from 'lucide-react';
import { toast } from 'react-toastify';
import { Input, Button, Spin } from 'antd';

export default function ProfilePage() {
    const { dataUser, setDataUser } = useStore();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        address: '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        if (dataUser) {
            setFormData({
                fullName: dataUser.fullName || '',
                phone: dataUser.phone || '',
                address: dataUser.address || '',
            });
        }
    }, [dataUser]);

    if (!dataUser) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <Spin size="large" />
            </div>
        );
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await requestUpdateUser(formData);
            if (res && res.metadata) {
                setDataUser(res.metadata);
                toast.success('Cập nhật thông tin thành công!');
            }
        } catch (error) {
            toast.error(error.message || 'Có lỗi xảy ra khi cập nhật thông tin');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formAvatar = new FormData();
        formAvatar.append('avatar', file);

        try {
            const res = await requestUploadAvatar(formAvatar);
            if (res && res.metadata) {
                setDataUser(res.metadata);
                toast.success('Cập nhật ảnh đại diện thành công!');
            }
        } catch (error) {
            toast.error('Lỗi khi tải ảnh lên');
        } finally {
            setUploading(false);
            e.target.value = null; // reset input
        }
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleChangePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return toast.error('Mật khẩu xác nhận không khớp!');
        }
        setChangingPassword(true);
        try {
            await requestChangePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            toast.success('Đổi mật khẩu thành công!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || 'Có lỗi xảy ra khi đổi mật khẩu');
        } finally {
            setChangingPassword(false);
        }
    };

    return (
        <div className="pb-10">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-[#E50914]/10 flex items-center justify-center">
                        <User className="text-[#E50914]" size={22} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white">Thông tin cá nhân</h1>
                        <p className="text-sm text-gray-500 mt-1">Quản lý tài khoản và thông tin liên hệ của bạn</p>
                    </div>
                </div>

                <div className="bg-[#111] border border-white/5 rounded-2xl p-8">
                    <div className="flex flex-col md:flex-row gap-10">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center shrink-0">
                            <div className="relative w-32 h-32 rounded-full border-4 border-white/10 overflow-hidden bg-[#1a1a1a] mb-4 group">
                                {dataUser.avatar ? (
                                    <img
                                        src={
                                            dataUser.avatar.startsWith('http')
                                                ? dataUser.avatar
                                                : `${import.meta.env.VITE_API_URL}${dataUser.avatar}`
                                        }
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-[#E50914] text-white text-4xl font-bold uppercase">
                                        {dataUser.fullName?.charAt(0) || 'U'}
                                    </div>
                                )}

                                {/* Overlay upload */}
                                <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    {uploading ? (
                                        <Loader2 className="animate-spin text-white mb-1" size={24} />
                                    ) : (
                                        <Camera className="text-white mb-1" size={24} />
                                    )}
                                    <span className="text-xs text-white font-medium">Thay đổi</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        disabled={uploading}
                                    />
                                </label>
                            </div>
                            <h3 className="text-white font-bold text-lg">{dataUser.fullName}</h3>
                            <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 text-yellow-500 text-xs px-3 py-1.5 rounded-full mt-2 font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                                <Crown size={14} className="mb-0.5" />
                                Hạng: {dataUser.membershipTier || 'Thành viên'}
                            </div>
                            <div className="text-gray-400 text-xs mt-2">
                                Tổng chi tiêu: <span className="text-white font-bold">{(dataUser.totalSpent || 0).toLocaleString()}đ</span>
                            </div>
                        </div>

                        {/* Form Section */}
                        <form onSubmit={handleUpdateProfile} className="flex-1 space-y-5">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1.5 ml-1">Họ và tên</label>
                                <Input
                                    size="large"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    prefix={<User size={16} className="text-gray-500 mr-2" />}
                                    className="bg-[#1a1a1a] border-white/10 text-white hover:border-[#E50914] focus:border-[#E50914]"
                                    placeholder="Nhập họ và tên..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1.5 ml-1">
                                    Email (Không thể thay đổi)
                                </label>
                                <Input
                                    size="large"
                                    value={dataUser.email}
                                    disabled
                                    prefix={<Mail size={16} className="text-gray-500 mr-2" />}
                                    className="bg-[#1a1a1a] border-white/5 text-gray-500 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1.5 ml-1">Số điện thoại</label>
                                <Input
                                    size="large"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    prefix={<Phone size={16} className="text-gray-500 mr-2" />}
                                    className="bg-[#1a1a1a] border-white/10 text-white hover:border-[#E50914] focus:border-[#E50914]"
                                    placeholder="Nhập số điện thoại..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1.5 ml-1">Địa chỉ</label>
                                <Input
                                    size="large"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    prefix={<MapPin size={16} className="text-gray-500 mr-2" />}
                                    className="bg-[#1a1a1a] border-white/10 text-white hover:border-[#E50914] focus:border-[#E50914]"
                                    placeholder="Nhập địa chỉ..."
                                />
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    loading={loading}
                                    className="bg-[#E50914] w-full border-none hover:bg-red-700 h-12 rounded-xl text-base font-bold shadow-[0_0_15px_rgba(229,9,20,0.3)]"
                                    icon={!loading && <Save size={18} />}
                                >
                                    Lưu thay đổi
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Form đổi mật khẩu */}
                <div className="bg-[#111] border border-white/5 rounded-2xl p-8 mt-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center border border-white/5">
                            <Key className="text-gray-400" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Đổi mật khẩu</h2>
                            <p className="text-xs text-gray-500">Bảo mật tài khoản của bạn</p>
                        </div>
                    </div>
                    
                    <form onSubmit={handleChangePasswordSubmit} className="space-y-5 max-w-md">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5 ml-1">Mật khẩu hiện tại</label>
                            <Input.Password
                                size="large"
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                required
                                className="bg-[#1a1a1a] border-white/10 text-white hover:border-[#E50914] focus:border-[#E50914] custom-password-input"
                                placeholder="Nhập mật khẩu hiện tại..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5 ml-1">Mật khẩu mới</label>
                            <Input.Password
                                size="large"
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                required
                                className="bg-[#1a1a1a] border-white/10 text-white hover:border-[#E50914] focus:border-[#E50914] custom-password-input"
                                placeholder="Nhập mật khẩu mới..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5 ml-1">Xác nhận mật khẩu mới</label>
                            <Input.Password
                                size="large"
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                required
                                className="bg-[#1a1a1a] border-white/10 text-white hover:border-[#E50914] focus:border-[#E50914] custom-password-input"
                                placeholder="Nhập lại mật khẩu mới..."
                            />
                        </div>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            loading={changingPassword}
                            className="bg-gray-800 text-white border-white/10 hover:bg-gray-700 hover:border-white/30 h-12 rounded-xl text-sm font-bold w-full"
                        >
                            Cập nhật mật khẩu
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
