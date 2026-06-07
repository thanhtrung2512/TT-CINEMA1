import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Select, Popconfirm, Tag, Avatar, Space, Tooltip } from 'antd';
import { Users, Search, Trash2, Edit2, ShieldCheck, User, Crown, BadgeCheck, Star } from 'lucide-react';
import { apiClient } from '@/config/axiosClient';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const TIER_CONFIG = {
    'Thành viên': { color: 'default', bg: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
    'Bạc':        { color: 'default', bg: 'bg-slate-400/10 text-slate-300 border-slate-400/20' },
    'Vàng':       { color: 'gold',    bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    'Kim Cương':  { color: 'cyan',    bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
};

const ROLE_TAG = (user) => {
    if (user.isAdmin)    return <Tag color="red"    icon={<ShieldCheck size={11} className="inline mr-1" />}>Admin</Tag>;
    if (user.isEmployee) return <Tag color="orange" icon={<BadgeCheck  size={11} className="inline mr-1" />}>Nhân viên</Tag>;
    return                      <Tag color="default" icon={<User        size={11} className="inline mr-1" />}>Khách hàng</Tag>;
};

const API = '/api/users/admin/users';

export default function UsersPage() {
    const [users, setUsers]           = useState([]);
    const [loading, setLoading]       = useState(false);
    const [search, setSearch]         = useState('');
    const [roleFilter, setRoleFilter] = useState(null);
    const [tierFilter, setTierFilter] = useState(null);

    // Edit modal
    const [editUser, setEditUser]         = useState(null);
    const [isModalOpen, setIsModalOpen]   = useState(false);
    const [submitting, setSubmitting]     = useState(false);
    const [form] = Form.useForm();

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const res = await apiClient.get(API);
            setUsers(res.data?.metadata || []);
        } catch {
            toast.error('Không thể tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const openEdit = (user) => {
        setEditUser(user);
        form.setFieldsValue({
            fullName: user.fullName,
            email:    user.email,
            phone:    user.phone,
            address:  user.address,
            isAdmin:  user.isAdmin,
            isEmployee: user.isEmployee,
            membershipTier: user.membershipTier,
        });
        setIsModalOpen(true);
    };

    const handleSave = async (values) => {
        try {
            setSubmitting(true);
            await apiClient.put(`${API}/${editUser._id}`, values);
            toast.success('Cập nhật người dùng thành công!');
            setIsModalOpen(false);
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi khi cập nhật');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await apiClient.delete(`${API}/${id}`);
            toast.success('Đã xóa người dùng!');
            fetchUsers();
        } catch {
            toast.error('Lỗi khi xóa người dùng');
        }
    };

    // ── Filtered data ────────────────────────────────────────────
    const filtered = users.filter(u => {
        const q = search.toLowerCase();
        const matchSearch = !q || u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q);
        const matchRole =
            !roleFilter ||
            (roleFilter === 'admin'    && u.isAdmin) ||
            (roleFilter === 'employee' && u.isEmployee && !u.isAdmin) ||
            (roleFilter === 'user'     && !u.isAdmin && !u.isEmployee);
        const matchTier = !tierFilter || u.membershipTier === tierFilter;
        return matchSearch && matchRole && matchTier;
    });

    // ── Stats cards ──────────────────────────────────────────────
    const stats = [
        { label: 'Tổng người dùng', value: users.length,                                          icon: Users,       color: 'text-blue-400',   bg: 'bg-blue-500/10' },
        { label: 'Admin',            value: users.filter(u => u.isAdmin).length,                  icon: ShieldCheck, color: 'text-red-400',    bg: 'bg-red-500/10'  },
        { label: 'Nhân viên',        value: users.filter(u => u.isEmployee && !u.isAdmin).length, icon: BadgeCheck,  color: 'text-orange-400', bg: 'bg-orange-500/10'},
        { label: 'Kim Cương',        value: users.filter(u => u.membershipTier === 'Kim Cương').length, icon: Crown, color: 'text-cyan-400',  bg: 'bg-cyan-500/10'  },
    ];

    // ── Columns ──────────────────────────────────────────────────
    const columns = [
        {
            title: 'Người dùng',
            key: 'user',
            render: (_, u) => (
                <div className="flex items-center gap-3">
                    <Avatar
                        size={40}
                        src={u.avatar
                            ? (u.avatar.startsWith('http') ? u.avatar : `${import.meta.env.VITE_API_URL}${u.avatar}`)
                            : null}
                        className="border border-white/10 bg-[#1a1a1a] shrink-0"
                    >
                        {!u.avatar && u.fullName?.[0]?.toUpperCase()}
                    </Avatar>
                    <div className="min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{u.fullName}</p>
                        <p className="text-gray-500 text-xs truncate">{u.email}</p>
                    </div>
                </div>
            ),
        },
        {
            title: 'Vai trò',
            key: 'role',
            width: 110,
            render: (_, u) => ROLE_TAG(u),
        },
        {
            title: 'Hạng thành viên',
            key: 'tier',
            width: 140,
            render: (_, u) => {
                const cfg = TIER_CONFIG[u.membershipTier] || TIER_CONFIG['Thành viên'];
                return (
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.bg}`}>
                        {u.membershipTier || 'Thành viên'}
                    </span>
                );
            },
        },
        {
            title: 'Tổng chi tiêu',
            key: 'spent',
            width: 130,
            sorter: (a, b) => (a.totalSpent || 0) - (b.totalSpent || 0),
            render: (_, u) => (
                <span className="text-yellow-400 font-bold text-sm">
                    {(u.totalSpent || 0).toLocaleString('vi-VN')}đ
                </span>
            ),
        },
        {
            title: 'SĐT',
            dataIndex: 'phone',
            key: 'phone',
            width: 120,
            render: v => <span className="text-gray-300 text-sm">{v || '—'}</span>,
        },
        {
            title: 'Ngày tạo',
            key: 'createdAt',
            width: 110,
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
            render: (_, u) => <span className="text-gray-500 text-xs">{dayjs(u.createdAt).format('DD/MM/YYYY')}</span>,
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 100,
            align: 'right',
            render: (_, u) => (
                <Space size="small">
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            type="text"
                            icon={<Edit2 size={15} />}
                            className="text-gray-400 hover:text-white"
                            onClick={() => openEdit(u)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Xác nhận xóa người dùng này?"
                        onConfirm={() => handleDelete(u._id)}
                        okText="Xóa"
                        cancelText="Huỷ"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Xóa">
                            <Button type="text" danger icon={<Trash2 size={15} />} />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="animate-fade-up space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Quản lý Người dùng</h2>
                    <p className="text-sm text-gray-500">Quản lý tài khoản, vai trò và hạng thành viên</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(s => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} className="glass-card rounded-xl border border-white/5 p-4 flex items-center gap-4">
                            <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                                <Icon size={20} className={s.color} />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-white">{s.value}</p>
                                <p className="text-xs text-gray-500">{s.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="glass-card rounded-xl border border-white/5 p-4 flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[220px]">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Tìm theo tên, email, SĐT..."
                        className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#E50914]/50 transition-colors"
                    />
                </div>
                <Select
                    className="min-w-[160px]"
                    placeholder="Lọc vai trò"
                    allowClear
                    value={roleFilter}
                    onChange={setRoleFilter}
                    options={[
                        { value: 'admin',    label: 'Admin' },
                        { value: 'employee', label: 'Nhân viên' },
                        { value: 'user',     label: 'Khách hàng' },
                    ]}
                />
                <Select
                    className="min-w-[160px]"
                    placeholder="Lọc hạng thành viên"
                    allowClear
                    value={tierFilter}
                    onChange={setTierFilter}
                    options={Object.keys(TIER_CONFIG).map(t => ({
                        value: t,
                        label: t,
                    }))}
                />
                {(search || roleFilter || tierFilter) && (
                    <Button onClick={() => { setSearch(''); setRoleFilter(null); setTierFilter(null); }}>
                        Xóa lọc
                    </Button>
                )}
                <span className="text-gray-500 text-sm ml-auto">
                    {filtered.length}/{users.length} người dùng
                </span>
            </div>

            {/* Table */}
            <div className="glass-card rounded-xl border border-white/5 p-1">
                <Table
                    columns={columns}
                    dataSource={filtered}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 15, showSizeChanger: false }}
                    scroll={{ x: 800 }}
                />
            </div>

            {/* Edit Modal */}
            <Modal
                title={<span className="text-lg font-bold">Chỉnh sửa người dùng</span>}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                destroyOnClose
                width={520}
            >
                {editUser && (
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                        <Avatar
                            size={48}
                            src={editUser.avatar
                                ? (editUser.avatar.startsWith('http') ? editUser.avatar : `${import.meta.env.VITE_API_URL}${editUser.avatar}`)
                                : null}
                            className="bg-[#1a1a1a] border border-white/10"
                        >
                            {!editUser.avatar && editUser.fullName?.[0]?.toUpperCase()}
                        </Avatar>
                        <div>
                            <p className="text-white font-semibold">{editUser.fullName}</p>
                            <p className="text-gray-500 text-sm">{editUser.email}</p>
                        </div>
                    </div>
                )}

                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="fullName" label="Họ & Tên" rules={[{ required: true }]}>
                            <Input size="large" />
                        </Form.Item>
                        <Form.Item name="phone" label="Số điện thoại">
                            <Input size="large" />
                        </Form.Item>
                    </div>

                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                        <Input size="large" />
                    </Form.Item>

                    <Form.Item name="address" label="Địa chỉ">
                        <Input size="large" />
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="isAdmin" label="Vai trò Admin">
                            <Select size="large" options={[{ value: true, label: 'Là Admin' }, { value: false, label: 'Không phải Admin' }]} />
                        </Form.Item>
                        <Form.Item name="isEmployee" label="Vai trò Nhân viên">
                            <Select size="large" options={[{ value: true, label: 'Là Nhân viên' }, { value: false, label: 'Không phải NV' }]} />
                        </Form.Item>
                    </div>

                    <Form.Item name="membershipTier" label="Hạng thành viên">
                        <Select
                            size="large"
                            options={Object.keys(TIER_CONFIG).map(t => ({
                                value: t,
                                label: t,
                            }))}
                        />
                    </Form.Item>

                    <div className="flex gap-3 justify-end mt-2">
                        <Button onClick={() => setIsModalOpen(false)}>Huỷ</Button>
                        <Button type="primary" htmlType="submit" loading={submitting}>
                            Lưu thay đổi
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
