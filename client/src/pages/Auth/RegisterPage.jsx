import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { requestRegister } from '@/config/UserRequest';
import { toast } from 'react-toastify';
import Navbar from '../../components/common/Navbar';

export default function RegisterPage() {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        confirmPassword: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp!');
            setLoading(false);
            return;
        }

        try {
            const res = await requestRegister({
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                password: formData.password,
            });
            if (res && !res.error) {
                toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
                navigate('/login');
            } else {
                toast.error(res?.message || 'Đăng ký thất bại');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
            style={{
                backgroundImage: 'url(/posters/dune.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <Navbar />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm z-0" />

            {/* Auth Card */}
            <div className="relative z-10 w-full max-w-md p-8 glass-card animate-fade-up mt-16">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black tracking-tight text-white mb-2">Tạo Tài Khoản</h2>
                    <p className="text-sm text-gray-400">Trải nghiệm điện ảnh đỉnh cao ngay hôm nay</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            Họ và tên
                        </label>
                        <input
                            type="text"
                            name="fullName"
                            required
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Nhập họ và tên..."
                            className="input-dark"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="example@gmail.com"
                            className="input-dark"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            Số điện thoại
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="0912345678"
                            className="input-dark"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            Địa chỉ
                        </label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Nhập địa chỉ của bạn..."
                            className="input-dark"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            Mật khẩu
                        </label>
                        <input
                            type="password"
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className="input-dark"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            Xác nhận mật khẩu
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            required
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className="input-dark"
                        />
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <svg
                                    className="animate-spin h-4 w-4 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                Đang xử lý...
                            </span>
                        ) : (
                            'Đăng Ký'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-400">
                    Đã có tài khoản?{' '}
                    <Link to="/login" className="text-white font-medium hover:text-[#E50914] transition-colors">
                        Đăng nhập
                    </Link>
                </div>
            </div>
        </div>
    );
}
