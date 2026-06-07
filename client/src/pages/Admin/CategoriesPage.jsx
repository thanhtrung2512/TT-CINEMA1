import { useState, useEffect } from 'react';
import { 
  requestGetAllCategory, 
  requestCreateCategory, 
  requestUpdateCategory, 
  requestDeleteCategory 
} from '@/config/CategoryRequest';
import { toast } from 'react-toastify';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, Tooltip } from 'antd';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [currentId, setCurrentId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await requestGetAllCategory();
      if (res && res.metadata) {
        setCategories(res.metadata);
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách danh mục');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setModalMode('add');
    form.resetFields();
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setModalMode('edit');
    setCurrentId(category._id);
    form.setFieldsValue({ categoryName: category.categoryName });
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setCurrentId(null);
  };

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      if (modalMode === 'add') {
        const res = await requestCreateCategory({ categoryName: values.categoryName });
        if (res && !res.error) {
          toast.success('Thêm danh mục thành công');
          fetchCategories();
          handleCancel();
        } else {
          toast.error(res?.message || 'Lỗi thêm danh mục');
        }
      } else {
        const res = await requestUpdateCategory({ id: currentId, categoryName: values.categoryName });
        if (res && !res.error) {
          toast.success('Cập nhật danh mục thành công');
          fetchCategories();
          handleCancel();
        } else {
          toast.error(res?.message || 'Lỗi cập nhật danh mục');
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
      const res = await requestDeleteCategory(id);
      if (res && !res.error) {
        toast.success('Xoá danh mục thành công');
        fetchCategories();
      } else {
        toast.error(res?.message || 'Lỗi khi xoá danh mục');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
    }
  };

  const columns = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      width: 80,
      render: (_, __, index) => <span className="text-gray-400">{index + 1}</span>,
    },
    {
      title: 'Tên danh mục',
      dataIndex: 'categoryName',
      key: 'categoryName',
      render: (text) => <span className="font-medium text-base text-gray-200">{text}</span>,
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 150,
      align: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Sửa">
            <Button 
              type="text" 
              icon={<Edit2 size={16} />} 
              onClick={() => openEditModal(record)}
              className="text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
            />
          </Tooltip>
          <Popconfirm
            title="Xóa danh mục"
            description="Bạn có chắc chắn muốn xoá danh mục này không?"
            onConfirm={() => handleDelete(record._id)}
            okText="Đồng ý"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa">
              <Button 
                type="text" 
                danger 
                icon={<Trash2 size={16} />} 
                className="hover:bg-red-500/10"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Quản lý danh mục</h2>
          <p className="text-sm text-gray-500">Xem, thêm, sửa, xóa các danh mục phim trên hệ thống</p>
        </div>
        <Button 
          type="primary" 
          icon={<Plus size={16} />} 
          onClick={openAddModal}
          size="large"
          className="shadow-red-glow font-medium"
        >
          Thêm danh mục
        </Button>
      </div>
      
      <div className="glass-card rounded-xl border border-white/5 overflow-hidden p-1">
        <Table 
          columns={columns} 
          dataSource={categories} 
          rowKey="_id"
          loading={loading}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: false,
          }}
          locale={{ emptyText: 'Chưa có danh mục nào' }}
        />
      </div>

      <Modal
        title={<span className="text-lg font-bold">{modalMode === 'add' ? 'Thêm Danh Mục Mới' : 'Cập Nhật Danh Mục'}</span>}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
        centered
        className="dark-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-6"
        >
          <Form.Item
            name="categoryName"
            label={<span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Tên danh mục</span>}
            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục!' }]}
          >
            <Input 
              placeholder="Ví dụ: Hành động, Viễn tưởng..." 
              size="large" 
              className="bg-[#1a1a1a] border-white/10 hover:border-white/20 focus:border-[#E50914] text-white"
            />
          </Form.Item>

          <div className="flex justify-end gap-3 mt-8">
            <Button onClick={handleCancel} size="large" className="border-white/10 text-gray-300 hover:text-white">
              Hủy
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isSubmitting} 
              size="large"
              className="font-medium"
            >
              {modalMode === 'add' ? 'Thêm mới' : 'Cập nhật'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
