import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Popconfirm, Tag, message, Rate } from 'antd';
import { DeleteOutlined, MessageOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { requestGetAllReviews, requestDeleteReview } from '@/config/ReviewRequest';
import dayjs from 'dayjs';

export default function ReviewManagement() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const res = await requestGetAllReviews();
            if (res?.metadata) {
                setReviews(res.metadata);
            }
        } catch (error) {
            message.error('Lỗi khi lấy danh sách đánh giá');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleDelete = async (id) => {
        try {
            await requestDeleteReview(id);
            message.success('Đã xóa đánh giá thành công');
            fetchReviews();
        } catch (error) {
            message.error('Lỗi khi xóa đánh giá');
        }
    };

    const columns = [
        {
            title: 'Khách hàng',
            dataIndex: 'userId',
            key: 'userId',
            render: (user) => (
                <div className="font-medium text-gray-200">
                    <div>{user?.fullName || 'Không rõ'}</div>
                    <div className="text-xs text-gray-400 font-normal">{user?.email}</div>
                </div>
            ),
        },
        {
            title: 'Phim',
            dataIndex: 'movieId',
            key: 'movieId',
            render: (movie) => (
                <div className="text-[#1890ff] font-medium">{movie?.title || 'Phim đã bị xóa'}</div>
            ),
        },
        {
            title: 'Số sao',
            dataIndex: 'rating',
            key: 'rating',
            render: (rating) => <Rate disabled defaultValue={rating} className="text-sm" />,
        },
        {
            title: 'Bình luận',
            dataIndex: 'comment',
            key: 'comment',
            width: '30%',
            render: (text) => <div className="text-gray-300 italic line-clamp-2">"{text}"</div>,
        },
        {
            title: 'Loại',
            dataIndex: 'isVerified',
            key: 'isVerified',
            render: (isVerified) => (
                isVerified ? 
                <Tag color="success" icon={<CheckCircleOutlined />}>Đã mua vé</Tag> : 
                <Tag color="default">Chưa mua vé</Tag>
            ),
        },
        {
            title: 'Ngày ĐG',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Popconfirm
                    title="Xóa đánh giá này?"
                    description="Hành động này không thể hoàn tác."
                    onConfirm={() => handleDelete(record._id)}
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                >
                    <Button type="primary" danger icon={<DeleteOutlined />} size="small">
                        Xóa
                    </Button>
                </Popconfirm>
            ),
        },
    ];

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <MessageOutlined /> Quản lý Bình luận
                    </h1>
                    <p className="text-gray-400 mt-1">Kiểm duyệt và xóa các bình luận vi phạm chính sách</p>
                </div>
            </div>

            <div className="bg-[#111111] border border-white/5 rounded-lg shadow-xl overflow-hidden">
                <Table
                    columns={columns}
                    dataSource={reviews}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </div>
        </div>
    );
}
