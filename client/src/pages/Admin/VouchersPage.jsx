import { useState, useEffect } from 'react';
import {
    requestGetAllVouchers,
    requestCreateVoucher,
    requestUpdateVoucher,
    requestDeleteVoucher,
} from '@/config/VoucherRequest';
import { toast } from 'react-toastify';
import { Plus, Edit2, Trash2, Ticket } from 'lucide-react';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, InputNumber, Select, Switch, DatePicker, Tag } from 'antd';
import dayjs from 'dayjs';

export default function VouchersPage() {
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [currentId, setCurrentId] = useState(null);
    const [form] = Form.useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Watch discountType to show/hide maxDiscount field
    const discountType = Form.useWatch('discountType', form);

    const fetchVouchers = async () => {
        try {
            setLoading(true);
            const res = await requestGetAllVouchers();
            if (res && res.metadata) setVouchers(res.metadata);
        } catch (error) {
            toast.error('Lỗi khi tải danh sách Voucher');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVouchers();
    }, []);

    const openModal = (mode, voucher = null) => {
        setModalMode(mode);
        if (mode === 'edit' && voucher) {
            setCurrentId(voucher._id);
            form.setFieldsValue({
                ...voucher,
                dateRange: [dayjs(voucher.validFrom), dayjs(voucher.validTo)]
            });
        } else {
            form.resetFields();
            form.setFieldsValue({
                discountType: 'percent',
                minOrderValue: 0,
                maxDiscount: 0,
                usageLimit: 100,
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (values) => {
        setIsSubmitting(true);
        try {
            const data = {
                code: values.code,
                discountType: values.discountType,
                discountValue: values.discountValue,
                minOrderValue: values.minOrderValue,
                maxDiscount: values.discountType === 'percent' ? values.maxDiscount : 0,
                usageLimit: values.usageLimit,
                isActive: values.isActive,
                validFrom: values.dateRange[0].toISOString(),
                validTo: values.dateRange[1].toISOString(),
            };

            if (modalMode === 'add') {
                const res = await requestCreateVoucher(data);
                if (res && !res.error) {
                    toast.success('Thêm Voucher thành công');
                    fetchVouchers();
                    setIsModalOpen(false);
                }
            } else {
                const res = await requestUpdateVoucher(currentId, data);
                if (res && !res.error) {
                    toast.success('Cập nhật Voucher thành công');
                    fetchVouchers();
                    setIsModalOpen(false);
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || 'Có lỗi xảy ra!');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await requestDeleteVoucher(id);
            if (res && !res.error) {
                toast.success('Xoá Voucher thành công');
                fetchVouchers();
            }
        } catch (error) {
            toast.error('Lỗi xóa Voucher');
        }
    };

    const columns = [
        {
            title: 'Mã giảm giá',
            dataIndex: 'code',
            key: 'code',
            render: (text) => <Tag color="blue" className="font-bold text-sm px-3 py-1">{text}</Tag>,
        },
        {
            title: 'Mức giảm',
            key: 'discount',
            render: (_, record) => {
                if (record.discountType === 'percent') {
                    return <span className="text-[#E50914] font-bold">{record.discountValue}%</span>;
                }
                return <span className="text-[#E50914] font-bold">{record.discountValue.toLocaleString('vi-VN')}đ</span>;
            }
        },
        {
            title: 'Hạn mức',
            key: 'limits',
            render: (_, record) => (
                <div className="text-xs text-gray-400">
                    <div>Đơn tối thiểu: {record.minOrderValue.toLocaleString('vi-VN')}đ</div>
                    {record.discountType === 'percent' && record.maxDiscount > 0 && (
                        <div>Giảm tối đa: {record.maxDiscount.toLocaleString('vi-VN')}đ</div>
                    )}
                </div>
            )
        },
        {
            title: 'Thời hạn',
            key: 'validity',
            render: (_, record) => (
                <div className="text-xs text-gray-300">
                    <div>Từ: {dayjs(record.validFrom).format('DD/MM/YYYY HH:mm')}</div>
                    <div>Đến: {dayjs(record.validTo).format('DD/MM/YYYY HH:mm')}</div>
                </div>
            )
        },
        {
            title: 'Sử dụng',
            key: 'usage',
            render: (_, record) => (
                <div className="text-sm">
                    <span className="text-white">{record.usedCount}</span> / <span className="text-gray-500">{record.usageLimit}</span>
                </div>
            )
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive) => (
                <Tag color={isActive ? 'success' : 'default'}>{isActive ? 'Hoạt động' : 'Đã tắt'}</Tag>
            )
        },
        {
            title: 'Hành động',
            key: 'action',
            align: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="text"
                        icon={<Edit2 size={16} />}
                        onClick={() => openModal('edit', record)}
                        className="text-blue-500 hover:text-blue-400"
                    />
                    <Popconfirm title="Xóa Voucher này?" onConfirm={() => handleDelete(record._id)}>
                        <Button type="text" danger icon={<Trash2 size={16} />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="animate-fade-up">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                        <Ticket className="text-[#E50914]" />
                        Mã Giảm Giá (Voucher)
                    </h2>
                    <p className="text-sm text-gray-500">Quản lý các chương trình khuyến mãi và mã giảm giá</p>
                </div>
                <Button
                    type="primary"
                    icon={<Plus size={16} />}
                    onClick={() => openModal('add')}
                    size="large"
                    className="shadow-red-glow font-medium"
                >
                    Tạo Mã Mới
                </Button>
            </div>

            <div className="glass-card rounded-xl border border-white/5 p-1 mt-4">
                <Table
                    columns={columns}
                    dataSource={vouchers}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 800 }}
                />
            </div>

            <Modal
                title={
                    <span className="text-lg font-bold">{modalMode === 'add' ? 'Tạo Mã Giảm Giá' : 'Cập Nhật Mã Giảm Giá'}</span>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                destroyOnClose
                className="dark-modal"
                width={600}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-6">
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="code" label="Mã Code (Tự nhập)" rules={[{ required: true }]}>
                            <Input
                                placeholder="VD: FLIX50"
                                size="large"
                                className="bg-[#1a1a1a] border-white/10 text-white uppercase"
                                style={{ textTransform: 'uppercase' }}
                            />
                        </Form.Item>
                        <Form.Item name="discountType" label="Loại giảm giá" rules={[{ required: true }]}>
                            <Select size="large" className="dark-select">
                                <Select.Option value="percent">Giảm theo %</Select.Option>
                                <Select.Option value="fixed">Giảm tiền mặt trực tiếp</Select.Option>
                            </Select>
                        </Form.Item>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item 
                            name="discountValue" 
                            label={discountType === 'percent' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (đ)'} 
                            rules={[{ required: true }]}
                        >
                            <InputNumber
                                min={1}
                                max={discountType === 'percent' ? 100 : 1000000}
                                size="large"
                                className="w-full bg-[#1a1a1a] border-white/10 text-white"
                            />
                        </Form.Item>
                        <Form.Item name="minOrderValue" label="Đơn tối thiểu (đ)">
                            <InputNumber
                                min={0}
                                step={10000}
                                size="large"
                                className="w-full bg-[#1a1a1a] border-white/10 text-white"
                            />
                        </Form.Item>
                    </div>

                    {discountType === 'percent' && (
                        <Form.Item name="maxDiscount" label="Giảm tối đa (đ) (0: Không giới hạn)">
                            <InputNumber
                                min={0}
                                step={10000}
                                size="large"
                                className="w-full bg-[#1a1a1a] border-white/10 text-white"
                            />
                        </Form.Item>
                    )}

                    <Form.Item name="dateRange" label="Thời gian áp dụng" rules={[{ required: true }]}>
                        <DatePicker.RangePicker 
                            showTime 
                            format="YYYY-MM-DD HH:mm"
                            size="large" 
                            className="w-full dark-picker" 
                        />
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="usageLimit" label="Số lượt tối đa">
                            <InputNumber
                                min={1}
                                size="large"
                                className="w-full bg-[#1a1a1a] border-white/10 text-white"
                            />
                        </Form.Item>
                        <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
                            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                        </Form.Item>
                    </div>

                    <Button type="primary" htmlType="submit" loading={isSubmitting} size="large" block className="mt-4">
                        {modalMode === 'add' ? 'Tạo Mã Giảm Giá' : 'Lưu Thay Đổi'}
                    </Button>
                </Form>
            </Modal>
        </div>
    );
}
