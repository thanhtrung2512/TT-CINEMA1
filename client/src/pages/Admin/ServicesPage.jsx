import { useState, useEffect } from 'react';
import {
    requestGetAllServices,
    requestCreateService,
    requestUpdateService,
    requestDeleteService,
} from '@/config/ServiceRequest';
import { toast } from 'react-toastify';
import { Plus, Edit2, Trash2, Coffee, UploadCloud } from 'lucide-react';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, InputNumber, Upload } from 'antd';

export default function ServicesPage() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [currentId, setCurrentId] = useState(null);
    const [form] = Form.useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const res = await requestGetAllServices();
            if (res && res.metadata) setServices(res.metadata);
        } catch (error) {
            toast.error('Lỗi khi tải danh sách dịch vụ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const openModal = (mode, service = null) => {
        setModalMode(mode);
        setImageFile(null);
        if (mode === 'edit' && service) {
            setCurrentId(service._id);
            form.setFieldsValue({
                name: service.name,
                price: service.price,
                description: service.description,
            });
            setPreviewImage(service.imageUrl ? `${import.meta.env.VITE_API_URL}${service.imageUrl}` : null);
        } else {
            form.resetFields();
            setPreviewImage(null);
        }
        setIsModalOpen(true);
    };

    const handleUploadChange = (info) => {
        const file = info.file;
        if (file) {
            setImageFile(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (values) => {
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('name', values.name);
            formData.append('price', values.price);
            formData.append('description', values.description || '');

            if (imageFile) {
                formData.append('image', imageFile);
            }

            if (modalMode === 'add') {
                const res = await requestCreateService(formData);
                if (res && !res.error) {
                    toast.success('Thêm dịch vụ thành công');
                    fetchServices();
                    setIsModalOpen(false);
                }
            } else {
                const res = await requestUpdateService(currentId, formData);
                if (res && !res.error) {
                    toast.success('Cập nhật dịch vụ thành công');
                    fetchServices();
                    setIsModalOpen(false);
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await requestDeleteService(id);
            if (res && !res.error) {
                toast.success('Xoá dịch vụ thành công');
                fetchServices();
            }
        } catch (error) {
            toast.error('Lỗi xóa dịch vụ');
        }
    };

    const columns = [
        {
            title: 'Hình ảnh',
            dataIndex: 'imageUrl',
            key: 'imageUrl',
            width: 100,
            render: (text) => (
                <div className="w-16 h-16 rounded-md bg-[#1a1a1a] border border-white/10 overflow-hidden flex items-center justify-center">
                    {text ? (
                        <img
                            src={`${import.meta.env.VITE_API_URL}${text}`}
                            alt="Combo"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <Coffee size={20} className="text-gray-500" />
                    )}
                </div>
            ),
        },
        {
            title: 'Tên Combo',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <span className="text-white font-medium">{text}</span>,
        },
        {
            title: 'Giá tiền',
            dataIndex: 'price',
            key: 'price',
            render: (val) => <span className="text-[#E50914] font-bold">{val.toLocaleString('vi-VN')}đ</span>,
        },
        { title: 'Mô tả', dataIndex: 'description', key: 'description', ellipsis: true },
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
                    <Popconfirm title="Xóa dịch vụ?" onConfirm={() => handleDelete(record._id)}>
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
                    <h2 className="text-2xl font-bold text-white mb-1">Dịch vụ Bắp Nước (F&B)</h2>
                    <p className="text-sm text-gray-500">Quản lý các Combo đồ ăn và thức uống</p>
                </div>
                <Button
                    type="primary"
                    icon={<Plus size={16} />}
                    onClick={() => openModal('add')}
                    size="large"
                    className="shadow-red-glow font-medium"
                >
                    Thêm Combo Mới
                </Button>
            </div>

            <div className="glass-card rounded-xl border border-white/5 p-1 mt-4">
                <Table
                    columns={columns}
                    dataSource={services}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </div>

            <Modal
                title={
                    <span className="text-lg font-bold">{modalMode === 'add' ? 'Thêm Combo' : 'Cập Nhật Combo'}</span>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                destroyOnClose
                className="dark-modal"
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-6">
                    <Form.Item label="Hình ảnh Combo">
                        <Upload
                            listType="picture-card"
                            showUploadList={false}
                            beforeUpload={() => false}
                            onChange={handleUploadChange}
                            className="dark-upload"
                        >
                            {previewImage ? (
                                <img
                                    src={previewImage}
                                    alt="preview"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center text-gray-400">
                                    <UploadCloud size={24} className="mb-2" />
                                    <div className="text-xs">Tải ảnh lên</div>
                                </div>
                            )}
                        </Upload>
                    </Form.Item>

                    <Form.Item name="name" label="Tên Combo" rules={[{ required: true }]}>
                        <Input
                            placeholder="VD: Combo Couple 2 Bắp 1 Nước"
                            size="large"
                            className="bg-[#1a1a1a] border-white/10 text-white"
                        />
                    </Form.Item>

                    <Form.Item name="price" label="Giá (VNĐ)" rules={[{ required: true }]}>
                        <InputNumber
                            min={0}
                            step={1000}
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                            size="large"
                            style={{ width: '100%' }}
                            className="w-full bg-[#1a1a1a] border-white/10 text-white"
                        />
                    </Form.Item>

                    <Form.Item name="description" label="Mô tả">
                        <Input.TextArea
                            rows={3}
                            placeholder="Mô tả chi tiết combo..."
                            className="bg-[#1a1a1a] border-white/10 text-white"
                        />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" loading={isSubmitting} size="large" block className="mt-4">
                        Lưu Dịch Vụ
                    </Button>
                </Form>
            </Modal>
        </div>
    );
}
