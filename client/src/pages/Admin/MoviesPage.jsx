import { useState, useEffect } from 'react';
import { 
  requestGetAllMovies, 
  requestCreateMovie, 
  requestUpdateMovie, 
  requestDeleteMovie 
} from '@/config/MovieRequest';
import { requestGetAllCategory } from '@/config/CategoryRequest';
import { toast } from 'react-toastify';
import { Plus, Edit2, Trash2, UploadCloud, Film, Minus } from 'lucide-react';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, Tooltip, Select, Upload, Tag } from 'antd';
import dayjs from 'dayjs';
import { getMediaUrl } from '@/utils/media';

export default function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [currentId, setCurrentId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form] = Form.useForm();

  const [posterFile, setPosterFile] = useState(null);
  const [backdropFile, setBackdropFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const [backdropPreview, setBackdropPreview] = useState(null);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const res = await requestGetAllMovies();
      if (res && res.metadata) {
        setMovies(res.metadata);
        setFilteredMovies(res.metadata);
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách phim');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await requestGetAllCategory();
      if (res && res.metadata) {
        setCategories(res.metadata);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchMovies();
    fetchCategories();
  }, []);

  // Xử lý tìm kiếm (Client-side)
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredMovies(movies);
    } else {
      const lowerSearch = searchText.toLowerCase();
      setFilteredMovies(
        movies.filter(movie => 
          movie.title?.toLowerCase().includes(lowerSearch) || 
          movie.slug?.includes(lowerSearch)
        )
      );
    }
  }, [searchText, movies]);

  const openAddModal = () => {
    setModalMode('add');
    form.resetFields();
    setPosterFile(null);
    setBackdropFile(null);
    setPosterPreview(null);
    setBackdropPreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (movie) => {
    setModalMode('edit');
    setCurrentId(movie._id);
    
    // Parse details array into form
    const formValues = {
      title: movie.title,
      slug: movie.slug,
      description: movie.description,
      trailer: movie.trailer,
      status: movie.status,
      categories: movie.categories?.map(c => c._id),
      details: Array.isArray(movie.details) ? movie.details : [],
    };

    form.setFieldsValue(formValues);
    setPosterFile(null);
    setBackdropFile(null);
    setPosterPreview(movie.posterUrl ? getMediaUrl(movie.posterUrl) : null);
    setBackdropPreview(movie.backdropUrl ? getMediaUrl(movie.backdropUrl) : null);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setCurrentId(null);
    setPosterFile(null);
    setBackdropFile(null);
    setPosterPreview(null);
    setBackdropPreview(null);
  };

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', values.title);
      if (values.slug?.trim()) {
        formData.append('slug', values.slug.trim());
      }
      formData.append('description', values.description || '');
      formData.append('trailer', values.trailer || '');
      formData.append('status', values.status || 'Sắp chiếu');
      
      // Mongoose expects an array of ObjectIds or JSON array string for ref arrays
      formData.append('categories', JSON.stringify(values.categories || []));

      // Pack details array
      const details = values.details || [];
      formData.append('details', JSON.stringify(details));

      if (posterFile) {
        formData.append('poster', posterFile);
      }
      if (backdropFile) {
        formData.append('backdrop', backdropFile);
      }

      if (modalMode === 'add') {
        const res = await requestCreateMovie(formData);
        if (res && !res.error) {
          toast.success('Thêm phim thành công');
          fetchMovies();
          handleCancel();
        } else {
          toast.error(res?.message || 'Lỗi thêm phim');
        }
      } else {
        const res = await requestUpdateMovie(currentId, formData);
        if (res && !res.error) {
          toast.success('Cập nhật phim thành công');
          fetchMovies();
          handleCancel();
        } else {
          toast.error(res?.message || 'Lỗi cập nhật phim');
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
      const res = await requestDeleteMovie(id);
      if (res && !res.error) {
        toast.success('Xoá phim thành công');
        fetchMovies();
      } else {
        toast.error(res?.message || 'Lỗi khi xoá phim');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
    }
  };

  const columns = [
    {
      title: 'Poster',
      dataIndex: 'posterUrl',
      key: 'posterUrl',
      width: 100,
      render: (url) => (
        url ? <img src={getMediaUrl(url)} alt="poster" className="w-12 h-16 object-cover rounded-md border border-white/10" />
            : <div className="w-12 h-16 bg-white/5 rounded-md flex items-center justify-center"><Film size={16} className="text-gray-500"/></div>
      ),
    },
    {
      title: 'Tên phim',
      dataIndex: 'title',
      key: 'title',
      render: (text) => <span className="font-bold text-base text-gray-200">{text}</span>,
    },
    {
      title: 'Thể loại',
      dataIndex: 'categories',
      key: 'categories',
      render: (categories) => (
        <div className="flex flex-wrap gap-1">
          {categories?.map(c => <Tag color="blue" key={c._id} className="border-blue-500/20 bg-blue-500/10 text-blue-400">{c.categoryName}</Tag>)}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = status === 'Đang chiếu' ? 'success' : status === 'Ngừng chiếu' ? 'error' : 'warning';
        return <Tag color={color}>{status}</Tag>;
      }
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
            title="Xóa phim"
            description="Bạn có chắc chắn muốn xoá phim này không?"
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
          <h2 className="text-2xl font-bold text-white mb-1">Quản lý phim</h2>
          <p className="text-sm text-gray-500">Thêm, sửa, xóa và quản lý trạng thái chiếu của các bộ phim</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Input.Search
            placeholder="Tìm kiếm tên phim..."
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            size="large"
            className="search-dark"
          />
          <Button 
            type="primary" 
            icon={<Plus size={16} />} 
            onClick={openAddModal}
            size="large"
            className="shadow-red-glow font-medium"
          >
            Thêm phim mới
          </Button>
        </div>
      </div>
      
      <div className="glass-card rounded-xl border border-white/5 overflow-hidden p-1">
        <Table 
          columns={columns} 
          dataSource={filteredMovies} 
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: 'Chưa có phim nào' }}
        />
      </div>

      <Modal
        title={<span className="text-lg font-bold">{modalMode === 'add' ? 'Thêm Phim Mới' : 'Cập Nhật Phim'}</span>}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
        centered
        width={800}
        className="dark-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Form.Item
              name="title"
              label={<span className="text-gray-400 text-xs font-semibold uppercase">Tên phim</span>}
              rules={[{ required: true, message: 'Vui lòng nhập tên phim!' }]}
            >
              <Input placeholder="Nhập tên phim..." size="large" className="bg-[#1a1a1a] border-white/10 text-white" />
            </Form.Item>

            <Form.Item
              name="slug"
              label={<span className="text-gray-400 text-xs font-semibold uppercase">Slug URL (VD: phim-abc-123)</span>}
              tooltip="Dùng cho đường dẫn /phim/slug. Nếu để trống sẽ tự tạo từ tên phim."
            >
              <Input placeholder="phim-ten-phim" size="large" className="bg-[#1a1a1a] border-white/10 text-white" />
            </Form.Item>

            <Form.Item
              name="categories"
              label={<span className="text-gray-400 text-xs font-semibold uppercase">Thể loại</span>}
              rules={[{ required: true, message: 'Vui lòng chọn thể loại!' }]}
            >
              <Select
                mode="multiple"
                size="large"
                placeholder="Chọn thể loại..."
                className="bg-[#1a1a1a]"
                options={categories.map(c => ({ label: c.categoryName, value: c._id }))}
              />
            </Form.Item>

            <Form.Item
              name="status"
              label={<span className="text-gray-400 text-xs font-semibold uppercase">Trạng thái</span>}
              initialValue="Sắp chiếu"
            >
              <Select
                size="large"
                options={[
                  { label: 'Đang chiếu', value: 'Đang chiếu' },
                  { label: 'Sắp chiếu', value: 'Sắp chiếu' },
                  { label: 'Ngừng chiếu', value: 'Ngừng chiếu' },
                ]}
              />
            </Form.Item>

            <Form.Item
              name="trailer"
              label={<span className="text-gray-400 text-xs font-semibold uppercase">Link Trailer (Youtube)</span>}
            >
              <Input placeholder="https://youtube.com/..." size="large" className="bg-[#1a1a1a] border-white/10 text-white" />
            </Form.Item>
          </div>

          <div className="mt-4 mb-2">
            <label className="block text-gray-400 text-xs font-semibold uppercase mb-2">Các thuộc tính mở rộng (Đạo diễn, Diễn viên, Thời lượng...)</label>
            <Form.List name="details">
              {(fields, { add, remove }) => (
                <div className="space-y-3">
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} className="flex gap-3 items-start">
                      <Form.Item
                        {...restField}
                        name={[name, 'name']}
                        rules={[{ required: true, message: 'Nhập tên' }]}
                        className="mb-0 flex-1"
                      >
                        <Input placeholder="Tên thuộc tính (VD: Đạo diễn)" size="large" className="bg-[#1a1a1a] border-white/10 text-white" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'value']}
                        rules={[{ required: true, message: 'Nhập giá trị' }]}
                        className="mb-0 flex-[2]"
                      >
                        <Input placeholder="Giá trị (VD: Trần Vĩ Hùng)" size="large" className="bg-[#1a1a1a] border-white/10 text-white" />
                      </Form.Item>
                      <Button 
                        type="text" 
                        danger 
                        icon={<Trash2 size={18} />} 
                        onClick={() => remove(name)} 
                        className="mt-1 hover:bg-red-500/10"
                      />
                    </div>
                  ))}
                  <Button 
                    type="dashed" 
                    onClick={() => add()} 
                    block 
                    icon={<Plus size={16} />} 
                    className="border-white/20 text-gray-400 hover:text-white hover:border-white/40 h-10 mt-2"
                  >
                    Thêm thuộc tính
                  </Button>
                </div>
              )}
            </Form.List>
          </div>

          <Form.Item
            name="description"
            label={<span className="text-gray-400 text-xs font-semibold uppercase mt-4 block">Mô tả phim</span>}
          >
            <Input.TextArea rows={3} placeholder="Nhập nội dung phim..." className="bg-[#1a1a1a] border-white/10 text-white" />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            <div>
              <label className="block text-gray-400 text-xs font-semibold uppercase mb-2">Ảnh Poster (Dọc)</label>
              {posterPreview && (
                <div className="mb-3 rounded-lg overflow-hidden border border-white/10 w-32">
                  <img src={posterPreview} alt="Poster preview" className="w-full h-auto object-cover" />
                </div>
              )}
              <Upload
                listType="picture-card"
                maxCount={1}
                showUploadList={false}
                beforeUpload={(file) => {
                  setPosterFile(file);
                  setPosterPreview(URL.createObjectURL(file));
                  return false;
                }}
                onRemove={() => {
                  setPosterFile(null);
                  setPosterPreview(null);
                }}
              >
                <div className="flex flex-col items-center justify-center text-gray-500 hover:text-white">
                  <UploadCloud size={24} className="mb-2" />
                  <span className="text-xs">{posterPreview ? 'Đổi ảnh' : 'Tải ảnh lên'}</span>
                </div>
              </Upload>
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-semibold uppercase mb-2">Ảnh Backdrop (Ngang)</label>
              {backdropPreview && (
                <div className="mb-3 rounded-lg overflow-hidden border border-white/10 w-full max-w-xs">
                  <img src={backdropPreview} alt="Backdrop preview" className="w-full h-auto object-cover" />
                </div>
              )}
              <Upload
                listType="picture-card"
                maxCount={1}
                showUploadList={false}
                beforeUpload={(file) => {
                  setBackdropFile(file);
                  setBackdropPreview(URL.createObjectURL(file));
                  return false;
                }}
                onRemove={() => {
                  setBackdropFile(null);
                  setBackdropPreview(null);
                }}
                className="w-full"
              >
                <div className="flex flex-col items-center justify-center text-gray-500 hover:text-white">
                  <UploadCloud size={24} className="mb-2" />
                  <span className="text-xs">{backdropPreview ? 'Đổi ảnh' : 'Tải ảnh lên'}</span>
                </div>
              </Upload>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/10">
            <Button onClick={handleCancel} size="large" className="border-white/10 text-gray-300 hover:text-white">
              Hủy
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isSubmitting} 
              size="large"
              className="font-medium px-8 shadow-red-glow"
            >
              {modalMode === 'add' ? 'Thêm Phim' : 'Lưu Thay Đổi'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
