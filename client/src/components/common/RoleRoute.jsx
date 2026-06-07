import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '@/hooks/useStore';
import Cookies from 'js-cookie';

export function AdminRoute() {
    const { dataUser } = useStore();
    const isLogged = Cookies.get('logged');

    if (!isLogged) return <Navigate to="/login" replace />;
    
    // Đợi fetch dataUser
    if (Object.keys(dataUser).length === 0) return <div className="min-h-screen bg-[#050505]"></div>;

    if (!dataUser.isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}

export function EmployeeRoute() {
    const { dataUser } = useStore();
    const isLogged = Cookies.get('logged');

    if (!isLogged) return <Navigate to="/login" replace />;
    
    // Đợi fetch dataUser
    if (Object.keys(dataUser).length === 0) return <div className="min-h-screen bg-[#050505]"></div>;

    // Không phải admin và không phải employee -> user thường
    if (!dataUser.isAdmin && !dataUser.isEmployee) {
        return <Navigate to="/" replace />;
    }

    // Nếu là admin nhưng KHÔNG được cấp quyền employee cụ thể, ta cấm vào EmployeePage (theo yêu cầu "admin chỉ ở trang admin")
    if (dataUser.isAdmin && !dataUser.isEmployee) {
        return <Navigate to="/admin" replace />;
    }

    return <Outlet />;
}

export function UserRoute() {
    const { dataUser } = useStore();
    const isLogged = Cookies.get('logged');

    if (isLogged) {
        // Đợi fetch dataUser
        if (Object.keys(dataUser).length === 0) return <div className="min-h-screen bg-[#050505]"></div>;

        // Nếu là admin thì bắt buộc vào admin
        if (dataUser.isAdmin) return <Navigate to="/admin" replace />;
        
        // Nếu là employee thì bắt buộc vào employee
        if (dataUser.isEmployee) return <Navigate to="/employee/scan" replace />;
    }

    return <Outlet />;
}
