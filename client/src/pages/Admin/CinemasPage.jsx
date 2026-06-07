import { useState, useEffect } from 'react';
import { requestGetAllCinemas, requestCreateCinema, requestUpdateCinema, requestDeleteCinema } from '@/config/CinemaRequest';
import { requestGetAllRooms, requestCreateRoom, requestUpdateRoom, requestDeleteRoom } from '@/config/RoomRequest';
import { toast } from 'react-toastify';
import { Plus, Edit2, Trash2, MapPin, Grid } from 'lucide-react';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, Tooltip, Tabs, Select, InputNumber } from 'antd';

export default function CinemasPage() {
  const [activeTab, setActiveTab] = useState('cinemas');
  
  // Cinemas state
  const [cinemas, setCinemas] = useState([]);
  const [loadingCinemas, setLoadingCinemas] = useState(false);
  const [isCinemaModalOpen, setIsCinemaModalOpen] = useState(false);
  const [cinemaModalMode, setCinemaModalMode] = useState('add');
  const [currentCinemaId, setCurrentCinemaId] = useState(null);
  const [cinemaForm] = Form.useForm();

  // Rooms state
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [roomModalMode, setRoomModalMode] = useState('add');
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [roomForm] = Form.useForm();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- FETCH DATA ---
  const fetchCinemas = async () => {
    try {
      setLoadingCinemas(true);
      const res = await requestGetAllCinemas();
      if (res && res.metadata) setCinemas(res.metadata);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách rạp');
    } finally {
      setLoadingCinemas(false);
    }
  };

  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      const res = await requestGetAllRooms();
      if (res && res.metadata) setRooms(res.metadata);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách phòng chiếu');
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchCinemas();
    fetchRooms();
  }, []);

  // --- CINEMA HANDLERS ---
  const openCinemaModal = (mode, cinema = null) => {
    setCinemaModalMode(mode);
    if (mode === 'edit' && cinema) {
      setCurrentCinemaId(cinema._id);
      cinemaForm.setFieldsValue(cinema);
    } else {
      cinemaForm.resetFields();
    }
    setIsCinemaModalOpen(true);
  };

  const handleCinemaSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      if (cinemaModalMode === 'add') {
        const res = await requestCreateCinema(values);
        if (res && !res.error) {
          toast.success('Thêm rạp thành công');
          fetchCinemas();
          setIsCinemaModalOpen(false);
        }
      } else {
        const res = await requestUpdateCinema(currentCinemaId, values);
        if (res && !res.error) {
          toast.success('Cập nhật rạp thành công');
          fetchCinemas();
          setIsCinemaModalOpen(false);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCinema = async (id) => {
    try {
      const res = await requestDeleteCinema(id);
      if (res && !res.error) {
        toast.success('Xoá rạp thành công');
        fetchCinemas();
      }
    } catch (error) {
      toast.error('Lỗi xóa rạp');
    }
  };

  // --- ROOM HANDLERS ---
  const openRoomModal = (mode, room = null) => {
    setRoomModalMode(mode);
    if (mode === 'edit' && room) {
      setCurrentRoomId(room._id);
      roomForm.setFieldsValue({
        name: room.name,
        cinemaId: room.cinemaId?._id,
        rowsCount: 10, // Mock for simple generation
        colsCount: 10,
      });
    } else {
      roomForm.resetFields();
      roomForm.setFieldsValue({ rowsCount: 10, colsCount: 12 }); // Default 10 rows, 12 cols
    }
    setIsRoomModalOpen(true);
  };

  const handleRoomSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      // Tự động sinh seatLayout từ rows và cols
      const { rowsCount, colsCount, name, cinemaId } = values;
      const seatLayout = [];
      const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''); // Lên tới 26 hàng
      
      for (let r = 0; r < rowsCount; r++) {
        const rowStr = rowLabels[r] || `R${r}`;
        for (let c = 1; c <= colsCount; c++) {
          // Ví dụ: 2 hàng cuối là ghế VIP
          const isVip = r >= rowsCount - 2;
          seatLayout.push({
            row: rowStr,
            number: c,
            type: isVip ? 'VIP' : 'Thuong'
          });
        }
      }

      const roomData = { name, cinemaId, seatLayout };

      if (roomModalMode === 'add') {
        const res = await requestCreateRoom(roomData);
        if (res && !res.error) {
          toast.success('Thêm phòng chiếu thành công');
          fetchRooms();
          setIsRoomModalOpen(false);
        }
      } else {
        const res = await requestUpdateRoom(currentRoomId, roomData);
        if (res && !res.error) {
          toast.success('Cập nhật phòng chiếu thành công');
          fetchRooms();
          setIsRoomModalOpen(false);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRoom = async (id) => {
    try {
      const res = await requestDeleteRoom(id);
      if (res && !res.error) {
        toast.success('Xoá phòng thành công');
        fetchRooms();
      }
    } catch (error) {
      toast.error('Lỗi xóa phòng');
    }
  };

  // --- COLUMNS ---
  const cinemaColumns = [
    { title: 'Tên rạp', dataIndex: 'name', key: 'name', render: text => <span className="text-white font-medium">{text}</span> },
    { title: 'Thành phố', dataIndex: 'city', key: 'city' },
    { title: 'Địa chỉ', dataIndex: 'address', key: 'address' },
    { title: 'Hotline', dataIndex: 'hotline', key: 'hotline' },
    {
      title: 'Hành động', key: 'action', align: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="text" icon={<Edit2 size={16} />} onClick={() => openCinemaModal('edit', record)} className="text-blue-500 hover:text-blue-400" />
          <Popconfirm title="Xóa rạp" onConfirm={() => handleDeleteCinema(record._id)}>
            <Button type="text" danger icon={<Trash2 size={16} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const roomColumns = [
    { title: 'Tên phòng', dataIndex: 'name', key: 'name', render: text => <span className="text-white font-medium">{text}</span> },
    { title: 'Rạp trực thuộc', dataIndex: ['cinemaId', 'name'], key: 'cinemaName' },
    { title: 'Sức chứa', dataIndex: 'capacity', key: 'capacity', render: val => `${val} ghế` },
    {
      title: 'Hành động', key: 'action', align: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="text" icon={<Edit2 size={16} />} onClick={() => openRoomModal('edit', record)} className="text-blue-500 hover:text-blue-400" />
          <Popconfirm title="Xóa phòng chiếu" onConfirm={() => handleDeleteRoom(record._id)}>
            <Button type="text" danger icon={<Trash2 size={16} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'cinemas',
      label: <span className="flex items-center gap-2"><MapPin size={16}/> Quản lý Rạp Phim</span>,
      children: (
        <div className="glass-card rounded-xl border border-white/5 p-1 mt-4">
          <Table columns={cinemaColumns} dataSource={cinemas} rowKey="_id" loading={loadingCinemas} pagination={{ pageSize: 10 }} />
        </div>
      )
    },
    {
      key: 'rooms',
      label: <span className="flex items-center gap-2"><Grid size={16}/> Quản lý Phòng Chiếu</span>,
      children: (
        <div className="glass-card rounded-xl border border-white/5 p-1 mt-4">
          <Table columns={roomColumns} dataSource={rooms} rowKey="_id" loading={loadingRooms} pagination={{ pageSize: 10 }} />
        </div>
      )
    }
  ];

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Cơ sở vật chất</h2>
          <p className="text-sm text-gray-500">Quản lý danh sách Rạp phim và các Phòng chiếu</p>
        </div>
        <Button 
          type="primary" 
          icon={<Plus size={16} />} 
          onClick={() => activeTab === 'cinemas' ? openCinemaModal('add') : openRoomModal('add')}
          size="large"
          className="shadow-red-glow font-medium"
        >
          {activeTab === 'cinemas' ? 'Thêm Rạp mới' : 'Thêm Phòng mới'}
        </Button>
      </div>
      
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab} 
        items={tabItems} 
        className="dark-tabs"
      />

      {/* MODAL RẠP */}
      <Modal
        title={<span className="text-lg font-bold">{cinemaModalMode === 'add' ? 'Thêm Rạp Phim' : 'Cập Nhật Rạp'}</span>}
        open={isCinemaModalOpen}
        onCancel={() => setIsCinemaModalOpen(false)}
        footer={null}
        destroyOnClose
        className="dark-modal"
      >
        <Form form={cinemaForm} layout="vertical" onFinish={handleCinemaSubmit} className="mt-6">
          <Form.Item name="name" label="Tên rạp" rules={[{ required: true }]}>
            <Input placeholder="TT CINEMA Landmark 81..." size="large" className="bg-[#1a1a1a] border-white/10 text-white" />
          </Form.Item>
          <Form.Item name="city" label="Thành phố" rules={[{ required: true }]}>
            <Input placeholder="TP.HCM..." size="large" className="bg-[#1a1a1a] border-white/10 text-white" />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ cụ thể" rules={[{ required: true }]}>
            <Input placeholder="Số 1, Đường X..." size="large" className="bg-[#1a1a1a] border-white/10 text-white" />
          </Form.Item>
          <Form.Item name="hotline" label="Hotline">
            <Input placeholder="1900 xxxx" size="large" className="bg-[#1a1a1a] border-white/10 text-white" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={isSubmitting} size="large" block className="mt-4">Lưu</Button>
        </Form>
      </Modal>

      {/* MODAL PHÒNG CHIẾU */}
      <Modal
        title={<span className="text-lg font-bold">{roomModalMode === 'add' ? 'Thêm Phòng Chiếu' : 'Cấu Hình Phòng Chiếu'}</span>}
        open={isRoomModalOpen}
        onCancel={() => setIsRoomModalOpen(false)}
        footer={null}
        destroyOnClose
        className="dark-modal"
      >
        <Form form={roomForm} layout="vertical" onFinish={handleRoomSubmit} className="mt-6">
          <Form.Item name="cinemaId" label="Rạp trực thuộc" rules={[{ required: true }]}>
            <Select 
              size="large" 
              options={cinemas.map(c => ({ label: `${c.name} (${c.city})`, value: c._id }))} 
              className="bg-[#1a1a1a]" 
            />
          </Form.Item>
          <Form.Item name="name" label="Tên phòng chiếu" rules={[{ required: true }]}>
            <Input placeholder="Phòng số 1, IMAX..." size="large" className="bg-[#1a1a1a] border-white/10 text-white" />
          </Form.Item>
          
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="rowsCount" label="Số hàng ghế" rules={[{ required: true }]}>
              <InputNumber min={1} max={26} size="large" className="w-full bg-[#1a1a1a] border-white/10 text-white" />
            </Form.Item>
            <Form.Item name="colsCount" label="Số ghế mỗi hàng" rules={[{ required: true }]}>
              <InputNumber min={1} max={50} size="large" className="w-full bg-[#1a1a1a] border-white/10 text-white" />
            </Form.Item>
          </div>
          <p className="text-xs text-gray-500 mb-6">Lưu ý: Hệ thống sẽ tự động sinh ma trận ghế dựa theo thiết lập trên (2 hàng cuối mặc định là ghế VIP).</p>
          
          <Button type="primary" htmlType="submit" loading={isSubmitting} size="large" block>Lưu Cấu Hình</Button>
        </Form>
      </Modal>
    </div>
  );
}
