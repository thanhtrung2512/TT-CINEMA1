import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from '@/components/common/Navbar';
import HomePage from '@/pages/Home/HomePage';
import LoginPage from '@/pages/Auth/LoginPage';
import RegisterPage from '@/pages/Auth/RegisterPage';
import MovieDetailPage from '@/pages/Movie/MovieDetailPage';
import BookingPage from '@/pages/Booking/BookingPage';
import BookingResultPage from '@/pages/Booking/BookingResultPage';
import MyTicketsPage from '@/pages/Booking/MyTicketsPage';
import EmployeeLayout from '@/pages/Employee/EmployeeLayout';
import ScannerPage from '@/pages/Employee/ScannerPage';
import POSPage from '@/pages/Employee/POSPage';
import HistoryPage from '@/pages/Employee/HistoryPage';
import ReportPage from '@/pages/Employee/ReportPage';
import RoomMonitorPage from '@/pages/Employee/RoomMonitorPage';
import AdminLayout from '@/pages/Admin/AdminLayout';
import DashboardPage from '@/pages/Admin/DashboardPage';
import CategoriesPage from '@/pages/Admin/CategoriesPage';
import MoviesPageAdmin from '@/pages/Admin/MoviesPage';
import CinemasPageAdmin from '@/pages/Admin/CinemasPage';
import ShowtimesPage from '@/pages/Admin/ShowtimesPage';
import ServicesPage from '@/pages/Admin/ServicesPage';
import VouchersPageAdmin from '@/pages/Admin/VouchersPage';
import BookingsPage from '@/pages/Admin/BookingsPage';
import ReviewManagement from '@/pages/Admin/Review/ReviewManagement';
import GiftsPage from '@/pages/Admin/GiftsPage';
import UsersPage from '@/pages/Admin/UsersPage';
import MoviesPage from '@/pages/Movie/MoviesPage';
import CinemasPage from '@/pages/Cinema/CinemasPage';
import CinemaSchedulePage from '@/pages/Cinema/CinemaSchedulePage';
import VouchersPage from '@/pages/Voucher/VouchersPage';
import ProfilePage from '@/pages/Auth/ProfilePage';
import UserLayout from '@/pages/Auth/UserLayout';
import UserDashboardPage from '@/pages/Auth/UserDashboardPage';
import ChatHistoryPage from '@/pages/Auth/ChatHistoryPage';
import { AdminRoute, EmployeeRoute, UserRoute } from '@/components/common/RoleRoute';
import { ToastContainer } from 'react-toastify';
import { Provider } from './store/Provider';
import { ConfigProvider, theme } from 'antd';
import 'react-toastify/dist/ReactToastify.css';
import ChatbotWidget from '@/components/common/ChatbotWidget';
import Footer from '@/components/common/Footer';
import ScrollToTop from '@/components/common/ScrollToTop';

// Component layout để ẩn Navbar ở trang đăng nhập/đăng ký nếu cần
function Layout() {
    const location = useLocation();
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
    const isAdminOrEmployee = location.pathname.startsWith('/admin') || location.pathname.startsWith('/employee');

    return (
        <div className="min-h-screen bg-[#050505]">
            {!isAuthPage && !isAdminOrEmployee && <Navbar />}
            <Routes>
                {/* Auth Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* User Routes (Chỉ cho phép user thường hoặc khách) */}
                <Route element={<UserRoute />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/phim/:slug" element={<MovieDetailPage />} />
                    <Route path="/movies/now-showing" element={<MoviesPage type="now-showing" />} />
                    <Route path="/movies/coming-soon" element={<MoviesPage type="coming-soon" />} />
                    <Route path="/movies/search" element={<MoviesPage type="search" />} />
                    <Route path="/cinemas" element={<CinemasPage />} />
                    <Route path="/cinemas/:cinemaId" element={<CinemaSchedulePage />} />
                    <Route path="/vouchers" element={<VouchersPage />} />
                    <Route path="/booking/:showtimeId" element={<BookingPage />} />
                    <Route path="/booking/result" element={<BookingResultPage />} />
                    
                    <Route path="/user" element={<UserLayout />}>
                        <Route index element={<UserDashboardPage />} />
                        <Route path="profile" element={<ProfilePage />} />
                        <Route path="tickets" element={<MyTicketsPage />} />
                        <Route path="chat-history" element={<ChatHistoryPage />} />
                    </Route>
                </Route>
                
                {/* Employee Routes */}
                <Route element={<EmployeeRoute />}>
                    <Route path="/employee" element={<EmployeeLayout />}>
                        <Route path="scan" element={<ScannerPage />} />
                        <Route path="pos" element={<POSPage />} />
                        <Route path="history" element={<HistoryPage />} />
                        <Route path="report" element={<ReportPage />} />
                        <Route path="rooms" element={<RoomMonitorPage />} />
                    </Route>
                </Route>

                {/* Admin Routes */}
                <Route element={<AdminRoute />}>
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<DashboardPage />} />
                        <Route path="categories" element={<CategoriesPage />} />
                        <Route path="movies" element={<MoviesPageAdmin />} />
                        <Route path="cinemas" element={<CinemasPageAdmin />} />
                        <Route path="showtimes" element={<ShowtimesPage />} />
                        <Route path="services" element={<ServicesPage />} />
                        <Route path="vouchers" element={<VouchersPageAdmin />} />
                        <Route path="gifts" element={<GiftsPage />} />
                        <Route path="bookings" element={<BookingsPage />} />
                        <Route path="reviews" element={<ReviewManagement />} />
                        <Route path="users" element={<UsersPage />} />
                    </Route>
                </Route>
            </Routes>
            {/* Chatbot chỉ hiển thị ở trang user, không hiện ở admin/employee/login */}
            {!isAuthPage && !isAdminOrEmployee && <ChatbotWidget />}
            {!isAuthPage && !isAdminOrEmployee && <Footer />}
        </div>
    );
}

export default function App() {
    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
                token: {
                    colorPrimary: '#E50914', // Đỏ Neon của TT CINEMA
                    colorBgBase: '#050505',
                    colorBgContainer: '#111111',
                    colorBorderSecondary: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 8,
                },
            }}
        >
            <BrowserRouter>
                <ScrollToTop />
                <Provider>
                    <Layout />
                    <ToastContainer
                        position="top-right"
                        autoClose={3000}
                        theme="dark"
                        toastClassName="bg-[#111111] text-white border border-[#1a1a1a]"
                    />
                </Provider>
            </BrowserRouter>
        </ConfigProvider>
    );
}
