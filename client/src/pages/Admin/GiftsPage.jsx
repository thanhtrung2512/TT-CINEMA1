import React, { useEffect, useState } from 'react';
import { Button, Modal, Form, Input, InputNumber, Select, Switch, Space, Popconfirm, message } from 'antd';
import {
    Gift,
    Plus,
    Pencil,
    Trash2,
    Sparkles,
    Settings2,
    ShoppingCart,
    Repeat,
    TrendingUp,
    DollarSign,
    Check,
} from 'lucide-react';
import { requestGetAllGifts, requestCreateGift, requestUpdateGift, requestDeleteGift } from '@/config/GiftRequest';
import dayjs from 'dayjs';

const { Option } = Select;

const TRIGGERS = [
    {
        key: 'per_order',
        label: 'Mỗi đơn đạt mức',
        sub: 'Áp dụng cho từng đơn hàng',
        Icon: ShoppingCart,
        color: '#3b82f6',
    },
    {
        key: 'nth_booking',
        label: 'Lần đặt vé thứ N',
        sub: 'Tặng khi đủ số lần quy định',
        Icon: Repeat,
        color: '#a855f7',
    },
    {
        key: 'cumulative_spend',
        label: 'Tích lũy chi tiêu',
        sub: 'Tặng 1 lần khi đạt mốc',
        Icon: TrendingUp,
        color: '#f59e0b',
    },
];

// ─── Card hiển thị mỗi chương trình ──────────────────────────────
function GiftCard({ gift, onEdit, onDelete }) {
    const t = TRIGGERS.find((x) => x.key === gift.triggerType) || TRIGGERS[0];
    const { Icon, color } = t;
    const cfg = gift.voucherConfig || {};
    const discountText =
        cfg.discountType === 'percent'
            ? `Giảm ${cfg.discountValue}%${cfg.maxDiscount > 0 ? ` (tối đa ${cfg.maxDiscount.toLocaleString('vi-VN')}đ)` : ''}`
            : `Giảm ${(cfg.discountValue || 0).toLocaleString('vi-VN')}đ`;
    const conditionText =
        gift.triggerType === 'nth_booking'
            ? `Đặt vé lần thứ ${gift.nthBooking}`
            : `Đơn từ ${(gift.minOrderAmount || 0).toLocaleString('vi-VN')}đ`;

    return (
        <div className="bg-[#111] border border-white/8 rounded-2xl p-5 flex flex-col gap-4 hover:border-white/15 transition-colors">
            <div className="flex items-start gap-3">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: color + '18' }}
                >
                    <Icon size={18} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-white text-sm truncate">{gift.name}</p>
                        {gift.isActive ? (
                            <span className="text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded-full shrink-0">
                                Đang chạy
                            </span>
                        ) : (
                            <span className="text-[10px] text-gray-500 bg-gray-500/10 border border-gray-500/20 px-1.5 py-0.5 rounded-full shrink-0">
                                Tạm dừng
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{gift.description || t.sub}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/3 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Điều kiện</p>
                    <p className="text-sm font-semibold text-white">{conditionText}</p>
                    <p className="text-[11px] mt-0.5" style={{ color }}>
                        {t.label}
                    </p>
                </div>
                <div className="bg-white/3 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Phần thưởng</p>
                    <p className="text-sm font-semibold text-white">{discountText}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">HSD: {cfg.validDays} ngày</p>
                </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-white/5">
                <span className="text-xs text-gray-500">
                    Đã phát: <span className="text-white font-semibold">{gift.issuedCount}</span>
                    {gift.totalLimit > 0 && <span className="text-gray-600"> / {gift.totalLimit}</span>}
                    {gift.endDate && <span className="ml-3">Hết: {dayjs(gift.endDate).format('DD/MM/YYYY')}</span>}
                </span>
                <Space size={4}>
                    <Button
                        size="small"
                        icon={<Pencil size={12} />}
                        onClick={() => onEdit(gift)}
                        className="border-white/10 text-gray-400 hover:text-white"
                    />
                    <Popconfirm
                        title="Xác nhận xóa chương trình này?"
                        onConfirm={() => onDelete(gift._id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Button size="small" danger icon={<Trash2 size={12} />} />
                    </Popconfirm>
                </Space>
            </div>
        </div>
    );
}

// ─── Selector chọn trigger type (thay thế Radio.Button xấu) ──────
function TriggerSelector({ value, onChange }) {
    return (
        <div className="grid grid-cols-3 gap-2">
            {TRIGGERS.map(({ key, label, sub, Icon, color }) => {
                const active = value === key;
                return (
                    <button
                        key={key}
                        type="button"
                        onClick={() => onChange(key)}
                        className="relative rounded-xl border p-3 text-left transition-all cursor-pointer"
                        style={{
                            background: active ? color + '12' : 'rgba(255,255,255,0.02)',
                            borderColor: active ? color + '60' : 'rgba(255,255,255,0.08)',
                        }}
                    >
                        {active && (
                            <span
                                className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                                style={{ background: color }}
                            >
                                <Check size={10} color="#fff" strokeWidth={3} />
                            </span>
                        )}
                        <Icon size={16} className="mb-2" style={{ color: active ? color : '#6b7280' }} />
                        <p
                            className="text-xs font-semibold leading-tight"
                            style={{ color: active ? '#fff' : '#9ca3af' }}
                        >
                            {label}
                        </p>
                        <p
                            className="text-[10px] mt-0.5 leading-tight"
                            style={{ color: active ? color + 'cc' : '#6b7280' }}
                        >
                            {sub}
                        </p>
                    </button>
                );
            })}
        </div>
    );
}

// ─── Page chính ───────────────────────────────────────────────────
export default function GiftsPage() {
    const [gifts, setGifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();
    const triggerType = Form.useWatch('triggerType', form);

    useEffect(() => {
        fetchGifts();
    }, []);

    const fetchGifts = async () => {
        try {
            setLoading(true);
            const res = await requestGetAllGifts();
            setGifts(res.metadata || []);
        } catch {
            message.error('Lỗi tải danh sách');
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditing(null);
        form.resetFields();
        form.setFieldsValue({
            triggerType: 'per_order',
            rewardType: 'voucher',
            isActive: true,
            minOrderAmount: 200000,
            nthBooking: 5,
            totalLimit: 0,
            voucherConfig: {
                discountType: 'percent',
                discountValue: 10,
                validDays: 30,
                maxDiscount: 0,
                minOrderValue: 0,
            },
        });
        setModalOpen(true);
    };

    const openEdit = (gift) => {
        setEditing(gift);
        form.setFieldsValue({
            ...gift,
            startDate: gift.startDate ? dayjs(gift.startDate).format('YYYY-MM-DD') : undefined,
            endDate: gift.endDate ? dayjs(gift.endDate).format('YYYY-MM-DD') : undefined,
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setSaving(true);
            if (editing) {
                await requestUpdateGift(editing._id, values);
                message.success('Cập nhật thành công!');
            } else {
                await requestCreateGift(values);
                message.success('Tạo chương trình thành công!');
            }
            setModalOpen(false);
            fetchGifts();
        } catch (err) {
            if (err?.message) message.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await requestDeleteGift(id);
            message.success('Đã xóa');
            fetchGifts();
        } catch {
            message.error('Lỗi xóa');
        }
    };

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-2">
                        <Gift size={22} className="text-[#E50914]" />
                        Chương Trình Quà Tặng
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Tự động trao phần thưởng theo điều kiện thiết lập</p>
                </div>
                <Button
                    type="primary"
                    icon={<Plus size={15} />}
                    onClick={openCreate}
                    className="bg-[#E50914] border-0 h-9 px-5 font-semibold rounded-xl"
                >
                    Tạo chương trình
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Đang hoạt động', value: gifts.filter((g) => g.isActive).length, color: '#22c55e' },
                    { label: 'Tổng chương trình', value: gifts.length, color: '#fff' },
                    {
                        label: 'Quà đã phát',
                        value: gifts.reduce((s, g) => s + (g.issuedCount || 0), 0),
                        color: '#f59e0b',
                    },
                ].map((s) => (
                    <div key={s.label} className="bg-[#111] border border-white/8 rounded-xl p-4">
                        <p className="text-xs text-gray-500">{s.label}</p>
                        <p className="text-3xl font-black mt-1" style={{ color: s.color }}>
                            {s.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Cards */}
            {loading ? (
                <p className="text-center text-gray-500 py-16 text-sm">Đang tải...</p>
            ) : gifts.length === 0 ? (
                <div className="bg-[#111] border border-white/8 rounded-2xl py-16 text-center">
                    <Gift size={32} className="text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Chưa có chương trình nào</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {gifts.map((g) => (
                        <GiftCard key={g._id} gift={g} onEdit={openEdit} onDelete={handleDelete} />
                    ))}
                </div>
            )}

            {/* Modal */}
            <Modal
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                title={
                    <div className="flex items-center gap-2 text-white font-bold text-base">
                        <div className="w-7 h-7 rounded-lg bg-[#E50914]/15 flex items-center justify-center">
                            <Gift size={14} className="text-[#E50914]" />
                        </div>
                        {editing ? 'Chỉnh sửa chương trình' : 'Tạo chương trình quà tặng'}
                    </div>
                }
                footer={
                    <div className="flex justify-end gap-2 pt-1">
                        <Button onClick={() => setModalOpen(false)}>Hủy</Button>
                        <Button type="primary" loading={saving} onClick={handleSave} className="bg-[#E50914] border-0">
                            {editing ? 'Lưu thay đổi' : 'Tạo mới'}
                        </Button>
                    </div>
                }
                width={580}
                className="dark-modal"
            >
                <Form form={form} layout="vertical" className="mt-5 space-y-0.5">
                    {/* Tên & mô tả */}
                    <Form.Item
                        name="name"
                        label={<Label>Tên chương trình</Label>}
                        rules={[{ required: true, message: 'Bắt buộc' }]}
                    >
                        <Input placeholder="VD: Ưu đãi khách hàng thân thiết" size="large" />
                    </Form.Item>

                    <Form.Item name="description" label={<Label>Mô tả</Label>}>
                        <Input.TextArea rows={2} placeholder="Mô tả ngắn về điều kiện và phần thưởng..." />
                    </Form.Item>

                    {/* Điều kiện kích hoạt */}
                    <Form.Item
                        name="triggerType"
                        label={<Label>Điều kiện kích hoạt</Label>}
                        rules={[{ required: true }]}
                    >
                        <TriggerSelector />
                    </Form.Item>

                    {/* Input điều kiện */}
                    {triggerType === 'nth_booking' ? (
                        <Form.Item
                            name="nthBooking"
                            label={<Label>Tặng quà sau lần đặt vé thứ</Label>}
                            rules={[{ required: true }]}
                        >
                            <InputNumber min={1} className="w-full" size="large" placeholder="5" addonAfter="lần" />
                        </Form.Item>
                    ) : (
                        <Form.Item
                            name="minOrderAmount"
                            label={
                                <Label>
                                    {triggerType === 'cumulative_spend'
                                        ? 'Tổng chi tiêu tích lũy tối thiểu'
                                        : 'Giá trị đơn hàng tối thiểu'}{' '}
                                    (VNĐ)
                                </Label>
                            }
                            rules={[{ required: true, message: 'Bắt buộc' }]}
                        >
                            <InputNumber
                                min={0}
                                className="w-full"
                                size="large"
                                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(v) => v.replace(/,*/g, '')}
                                placeholder="200,000"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    )}

                    {/* Voucher config */}
                    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 mt-1">
                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Settings2 size={11} /> Phần thưởng — Voucher tự động
                        </p>
                        <div className="grid grid-cols-3 gap-3 mb-3">
                            <Form.Item
                                name={['voucherConfig', 'discountType']}
                                label={<SmallLabel>Kiểu giảm</SmallLabel>}
                                className="mb-0"
                            >
                                <Select>
                                    <Option value="percent">Phần trăm (%)</Option>
                                    <Option value="fixed">Số tiền cố định</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item
                                name={['voucherConfig', 'discountValue']}
                                label={<SmallLabel>Giá trị</SmallLabel>}
                                className="mb-0"
                            >
                                <InputNumber min={1} className="w-full" placeholder="10" />
                            </Form.Item>
                            <Form.Item
                                name={['voucherConfig', 'validDays']}
                                label={<SmallLabel>Hiệu lực (ngày)</SmallLabel>}
                                className="mb-0"
                            >
                                <InputNumber min={1} className="w-full" placeholder="30" />
                            </Form.Item>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Form.Item
                                name={['voucherConfig', 'maxDiscount']}
                                label={<SmallLabel>Giảm tối đa (đ, 0 = không giới hạn)</SmallLabel>}
                                className="mb-0"
                            >
                                <InputNumber
                                    min={0}
                                    className="w-full"
                                    placeholder="0"
                                    formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={(v) => v.replace(/,*/g, '')}
                                />
                            </Form.Item>
                            <Form.Item
                                name={['voucherConfig', 'minOrderValue']}
                                label={<SmallLabel>Đơn tối thiểu để dùng voucher (đ)</SmallLabel>}
                                className="mb-0"
                            >
                                <InputNumber
                                    min={0}
                                    className="w-full"
                                    placeholder="0"
                                    formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={(v) => v.replace(/,*/g, '')}
                                />
                            </Form.Item>
                        </div>
                    </div>

                    {/* Giới hạn & thời gian */}
                    <div className="grid grid-cols-3 gap-3 mt-1">
                        <Form.Item name="totalLimit" label={<Label>Giới hạn phát (0 = vô hạn)</Label>}>
                            <InputNumber min={0} className="w-full" placeholder="0" />
                        </Form.Item>
                        <Form.Item name="startDate" label={<Label>Ngày bắt đầu</Label>}>
                            <Input type="date" />
                        </Form.Item>
                        <Form.Item name="endDate" label={<Label>Ngày kết thúc</Label>}>
                            <Input type="date" />
                        </Form.Item>
                    </div>

                    {/* Trạng thái */}
                    <div className="flex items-center gap-3 pt-1 pb-2">
                        <Form.Item name="isActive" valuePropName="checked" className="mb-0">
                            <Switch />
                        </Form.Item>
                        <span className="text-sm text-gray-300">Kích hoạt ngay sau khi lưu</span>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}

// ─── Helper components ────────────────────────────────────────────
const Label = ({ children }) => <span className="text-gray-300 text-sm font-medium">{children}</span>;
const SmallLabel = ({ children }) => <span className="text-gray-400 text-xs">{children}</span>;
