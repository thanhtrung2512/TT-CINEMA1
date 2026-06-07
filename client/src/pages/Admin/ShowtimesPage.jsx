import { useState, useEffect } from 'react';
import { requestGetAllShowtimes, requestCreateShowtime, requestDeleteShowtime } from '@/config/ShowtimeRequest';
import { requestGetAllMovies } from '@/config/MovieRequest';
import { requestGetAllCinemas } from '@/config/CinemaRequest';
import { requestGetAllRooms } from '@/config/RoomRequest';
import { toast } from 'react-toastify';
import { Plus, Trash2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Table, Button, Modal, Form, Space, Popconfirm, Select, DatePicker, InputNumber, Tag } from 'antd';
import dayjs from 'dayjs';

export default function ShowtimesPage() {
    const [showtimes, setShowtimes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form] = Form.useForm();

    // Data sources for selectors
    const [movies, setMovies] = useState([]);
    const [cinemas, setCinemas] = useState([]);
    const [rooms, setRooms] = useState([]);

    // Filter state for modal
    const [selectedCinemaId, setSelectedCinemaId] = useState(null);

    // Filter state for Table
    const [filterDate, setFilterDate] = useState(dayjs());
    const [filterMovieId, setFilterMovieId] = useState(null);
    const [filterCinemaId, setFilterCinemaId] = useState(null);

  // Auto Generate Showtimes (Smart Gap-Filling)
  const handleAutoGenerate = () => {
      const movieId = form.getFieldValue('movieId');
      const roomId = form.getFieldValue('roomId');
      const datesVal = form.getFieldValue('dates');

      if (!movieId || !roomId || !datesVal || datesVal.length === 0) {
          toast.warning('Vui lòng chọn Phim, Phòng chiếu và ít nhất 1 Ngày chiếu trước khi tự động xếp lịch!');
          return;
      }
      
      const selectedMovie = movies.find(m => m._id === movieId);
      let durationMinutes = 120; // Default
      if (selectedMovie && selectedMovie.details) {
          const durationDetail = selectedMovie.details.find(d => d.name.toLowerCase().includes('thời lượng'));
          if (durationDetail && durationDetail.value) {
              const match = durationDetail.value.match(/\d+/);
              if (match) durationMinutes = parseInt(match[0]);
          }
      }
      
      const totalSlotMinutes = durationMinutes + 15; // Phim + 15p dọn rạp
      // Lấy ngày đầu tiên trong khoảng thời gian đã chọn làm mốc để dò lịch trống
      const baseDate = datesVal[0].format('YYYY-MM-DD');

      // Lấy danh sách các suất chiếu ĐÃ CÓ của phòng này trong ngày này
      const existingShowtimes = showtimes.filter(st => {
          if (st.roomId?._id !== roomId) return false;
          return dayjs(st.startTime).format('YYYY-MM-DD') === baseDate;
      });
      
      let current = dayjs(`${baseDate} 08:00`, 'YYYY-MM-DD HH:mm'); // Bắt đầu từ 08:00
      const endOfDay = dayjs(`${baseDate} 23:30`, 'YYYY-MM-DD HH:mm'); // Kết thúc trước 23:30
      
      const autoTimes = [];
      
      while (current.isBefore(endOfDay)) {
          const endTime = current.add(totalSlotMinutes, 'minute'); // Đã bao gồm dọn rạp
          
          // Kiểm tra xem khoảng [current, endTime] có đè lên suất chiếu nào không
          const overlap = existingShowtimes.find(st => {
              const stStart = dayjs(st.startTime);
              const stEnd = dayjs(st.endTime).add(15, 'minute'); // Phim cũ cũng cần dọn rạp
              return current.isBefore(stEnd) && endTime.isAfter(stStart);
          });
          
          if (overlap) {
              // Nếu đè, bỏ qua đoạn này và nhảy cóc đến khi phim kia chiếu xong (+ dọn rạp)
              current = dayjs(overlap.endTime).add(15, 'minute');
              // Làm tròn lên phút chẵn (bội của 10)
              const remainder = current.minute() % 10;
              if (remainder !== 0) {
                  current = current.add(10 - remainder, 'minute');
              }
          } else {
              // Không đè, ta lấy khung giờ này!
              autoTimes.push(current.format('HH:mm'));
              // Tiến thời gian đến suất tiếp theo
              current = current.add(totalSlotMinutes, 'minute');
              const remainder = current.minute() % 10;
              if (remainder !== 0) {
                  current = current.add(10 - remainder, 'minute');
              }
          }
      }
      
      if (autoTimes.length === 0) {
          toast.warning('Phòng này đã kín lịch trong ngày, không còn chỗ trống!');
          return;
      }

      form.setFieldsValue({ startTimes: autoTimes });
      toast.info(`Đã tìm thấy khoảng trống và xếp được ${autoTimes.length} suất chiếu!`);
  };

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [showtimesRes, moviesRes, cinemasRes] = await Promise.all([
                requestGetAllShowtimes(),
                requestGetAllMovies(),
                requestGetAllCinemas(),
            ]);

            if (showtimesRes && showtimesRes.metadata) setShowtimes(showtimesRes.metadata);
            if (moviesRes && moviesRes.metadata) setMovies(moviesRes.metadata);
            if (cinemasRes && cinemasRes.metadata) setCinemas(cinemasRes.metadata);
        } catch (error) {
            toast.error('Lỗi khi tải dữ liệu ban đầu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    // Fetch rooms when a cinema is selected in the Add form
    useEffect(() => {
        if (selectedCinemaId) {
            const fetchRooms = async () => {
                const res = await requestGetAllRooms(selectedCinemaId);
                if (res && res.metadata) {
                    setRooms(res.metadata);
                }
            };
            fetchRooms();
        } else {
            setRooms([]);
            form.setFieldsValue({ roomId: null });
        }
    }, [selectedCinemaId, form]);

    const handleCinemaChange = (value) => {
        setSelectedCinemaId(value);
    };

    const openModal = () => {
        form.resetFields();
        setSelectedCinemaId(null);
        setIsModalOpen(true);
    };

    const handleSubmit = async (values) => {
        setIsSubmitting(true);
        try {
            // Tìm bộ phim để lấy thời lượng
            const selectedMovie = movies.find(m => m._id === values.movieId);
            let durationMinutes = 120; // Default fallback
            if (selectedMovie && selectedMovie.details) {
                const durationDetail = selectedMovie.details.find(d => d.name.toLowerCase().includes('thời lượng'));
                if (durationDetail && durationDetail.value) {
                    const match = durationDetail.value.match(/\d+/);
                    if (match) durationMinutes = parseInt(match[0]);
                }
            }
            
            // Tính toán thêm 15 phút dọn dẹp rạp (cleaning time)
            const totalSlotMinutes = durationMinutes + 15;

            // Sắp xếp các giờ chiếu tăng dần
            const sortedTimes = [...values.startTimes].sort();
            
            // Sinh ra mảng các ngày nằm giữa ngày bắt đầu và ngày kết thúc
            const dateList = [];
            let currDate = values.dates[0].clone().startOf('day');
            const endDate = values.dates[1].clone().startOf('day');
            while (!currDate.isAfter(endDate, 'day')) {
                dateList.push(currDate);
                currDate = currDate.add(1, 'day');
            }
            
            let successCount = 0;
            
            // Lặp qua từng NGÀY trong khoảng thời gian đã chọn
            for (const d of dateList) {
                const baseDate = d.format('YYYY-MM-DD');
                
                // 1. Validate chống chéo giờ TRÊN FRONTEND cho ngày này
                let isOverlap = false;
                for (let i = 0; i < sortedTimes.length - 1; i++) {
                    const timeA = dayjs(`${baseDate} ${sortedTimes[i]}`, 'YYYY-MM-DD HH:mm');
                    const timeB = dayjs(`${baseDate} ${sortedTimes[i+1]}`, 'YYYY-MM-DD HH:mm');
                    
                    if (timeB.isBefore(timeA.add(totalSlotMinutes, 'minute'))) {
                        toast.error(`Ngày ${baseDate}: Suất ${sortedTimes[i]} và ${sortedTimes[i+1]} bị đè lên nhau.`);
                        isOverlap = true;
                        break;
                    }
                }
                
                if (isOverlap) continue; // Bỏ qua ngày này nếu bị đè cấu hình, chạy ngày tiếp theo
    
                // 2. Chạy tuần tự tạo suất chiếu cho ngày này
                for (const timeStr of sortedTimes) {
                    const startTime = dayjs(`${baseDate} ${timeStr}`, 'YYYY-MM-DD HH:mm');
                    const endTime = startTime.add(durationMinutes, 'minute');
                    
                    const data = {
                        movieId: values.movieId,
                        roomId: values.roomId,
                        price: values.price,
                        startTime: startTime.toISOString(),
                        endTime: endTime.toISOString(),
                    };
                    
                    try {
                        await requestCreateShowtime(data);
                        successCount++;
                    } catch (e) {
                        toast.error(`Lỗi tạo suất ${timeStr} ngày ${baseDate}: Trùng lịch hệ thống.`);
                    }
                }
            }
            
            toast.success(`Đã tạo thành công tổng cộng ${successCount} suất chiếu!`);
            fetchInitialData();
            setIsModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo suất chiếu!');
            // Reload lại data để hiện những suất đã tạo thành công trước khi bị lỗi
            fetchInitialData();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await requestDeleteShowtime(id);
            if (res && !res.error) {
                toast.success('Xoá suất chiếu thành công');
                fetchInitialData();
            }
        } catch (error) {
            toast.error('Lỗi xóa suất chiếu');
        }
    };

    const columns = [
        {
            title: 'Phim',
            key: 'movie',
            render: (_, record) => (
                <div className="flex items-center gap-3">
                    <img
                        src={`${import.meta.env.VITE_API_URL}${record.movie?.posterUrl}`}
                        alt="poster"
                        className="w-10 h-14 object-cover rounded shadow"
                    />
                    <span className="text-white font-medium max-w-[200px] truncate" title={record.movie?.title}>
                        {record.movie?.title}
                    </span>
                </div>
            ),
        },
        {
            title: 'Rạp & Phòng',
            key: 'location',
            render: (_, record) => (
                <div>
                    <div className="text-white font-medium">{record.room?.cinemaId?.name}</div>
                    <div className="text-xs text-gray-400">{record.room?.name}</div>
                </div>
            ),
        },
        {
            title: 'Ngày chiếu',
            key: 'date',
            render: (_, record) => (
                <div className="flex items-center gap-1 text-gray-300">
                    <CalendarIcon size={14} />
                    {dayjs(record.date).format('DD/MM/YYYY')}
                </div>
            ),
        },
        {
            title: 'Các khung giờ',
            key: 'slots',
            render: (_, record) => (
                <div className="flex flex-wrap gap-2 max-w-[400px]">
                    {record.slots.map(slot => {
                        const total = slot.seats?.length || 0;
                        const booked = slot.seats?.filter((s) => s.status === 'Booked').length || 0;
                        let color = 'default';
                        if (booked > 0 && booked < total) color = 'warning';
                        if (booked === total && total > 0) color = 'error';

                        return (
                            <Popconfirm 
                                key={slot._id}
                                title="Xóa suất chiếu này?" 
                                onConfirm={() => handleDelete(slot._id)}
                            >
                                <Tag 
                                    color={color} 
                                    className="cursor-pointer hover:opacity-80 transition-opacity m-0 text-sm py-1 px-2"
                                    title={`Đã đặt: ${booked}/${total}`}
                                >
                                    {dayjs(slot.startTime).format('HH:mm')}
                                </Tag>
                            </Popconfirm>
                        );
                    })}
                </div>
            ),
        },
        {
            title: 'Giá vé',
            dataIndex: 'price',
            key: 'price',
            render: (val) => <span className="font-bold">{val?.toLocaleString('vi-VN')}đ</span>,
        },
        {
            title: 'Hành động',
            key: 'action',
            align: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Popconfirm 
                        title={`Xóa TOÀN BỘ ${record.slots.length} suất chiếu trong ngày này?`} 
                        onConfirm={() => {
                            // Gọi hàm xóa tất cả slots trong record
                            record.slots.forEach(slot => handleDelete(slot._id));
                        }}
                    >
                        <Button type="text" danger icon={<Trash2 size={16} />} title="Xóa cả ngày" />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // Gom nhóm showtimes
    const groupedShowtimes = Object.values(showtimes.reduce((acc, st) => {
        const dateStr = dayjs(st.startTime).format('YYYY-MM-DD');
        const movieId = st.movieId?._id;
        const roomId = st.roomId?._id;
        if (!movieId || !roomId) return acc;

        const key = `${movieId}_${roomId}_${dateStr}`;
        if (!acc[key]) {
            acc[key] = {
                _id: key,
                movie: st.movieId,
                room: st.roomId,
                date: dateStr,
                price: st.price,
                slots: []
            };
        }
        acc[key].slots.push(st);
        return acc;
    }, {})).sort((a, b) => new Date(b.date) - new Date(a.date));

    // Sắp xếp các slot bên trong mỗi nhóm theo giờ tăng dần
    groupedShowtimes.forEach(group => {
        group.slots.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    });

    // Áp dụng bộ lọc cho Table
    let displayData = groupedShowtimes;
    if (filterDate) {
        const dateStr = filterDate.format('YYYY-MM-DD');
        displayData = displayData.filter(item => item.date === dateStr);
    }
    if (filterMovieId) {
        displayData = displayData.filter(item => item.movie?._id === filterMovieId);
    }
    if (filterCinemaId) {
        displayData = displayData.filter(item => item.room?.cinemaId?._id === filterCinemaId);
    }

    return (
        <div className="animate-fade-up">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Quản lý Suất Chiếu</h2>
                    <p className="text-sm text-gray-500">Phân bổ phim vào các phòng chiếu theo thời gian</p>
                </div>
                <Button
                    type="primary"
                    icon={<Plus size={16} />}
                    onClick={openModal}
                    size="large"
                    className="shadow-red-glow font-medium"
                >
                    Tạo Suất Chiếu
                </Button>
            </div>

            {/* Thanh công cụ lọc */}
            <div className="glass-card rounded-xl border border-white/5 p-4 mt-4 mb-4 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs text-gray-400 mb-1">Lọc theo Ngày chiếu</label>
                    <DatePicker 
                        format="DD/MM/YYYY" 
                        size="large" 
                        className="w-full bg-[#1a1a1a] border-white/10 text-white" 
                        onChange={setFilterDate} 
                        value={filterDate}
                        placeholder="Tất cả các ngày"
                    />
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs text-gray-400 mb-1">Lọc theo Phim</label>
                    <Select 
                        size="large" 
                        className="w-full bg-[#1a1a1a]" 
                        placeholder="Tất cả các phim"
                        allowClear
                        showSearch
                        optionFilterProp="children"
                        onChange={setFilterMovieId}
                        value={filterMovieId}
                        options={movies.map(m => ({ label: m.title, value: m._id }))}
                    />
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs text-gray-400 mb-1">Lọc theo Rạp</label>
                    <Select 
                        size="large" 
                        className="w-full bg-[#1a1a1a]" 
                        placeholder="Tất cả rạp"
                        allowClear
                        onChange={setFilterCinemaId}
                        value={filterCinemaId}
                        options={cinemas.map(c => ({ label: c.name, value: c._id }))}
                    />
                </div>
                <Button 
                    size="large" 
                    onClick={() => { setFilterDate(null); setFilterMovieId(null); setFilterCinemaId(null); }}
                >
                    Xóa lọc
                </Button>
            </div>

            <div className="glass-card rounded-xl border border-white/5 p-1">
                <Table
                    columns={columns}
                    dataSource={displayData}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </div>

            <Modal
                title={<span className="text-lg font-bold">Thêm Suất Chiếu Mới</span>}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                destroyOnClose
                className="dark-modal"
                width={600}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-6">
                    <Form.Item
                        name="movieId"
                        label="Chọn Phim"
                        rules={[{ required: true, message: 'Vui lòng chọn phim' }]}
                    >
                        <Select
                            size="large"
                            showSearch
                            placeholder="Tìm và chọn phim..."
                            optionFilterProp="children"
                            options={movies.map((m) => ({ label: m.title, value: m._id }))}
                            className="bg-[#1a1a1a]"
                        />
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item label="Chọn Rạp">
                            <Select
                                size="large"
                                placeholder="Chọn rạp phim..."
                                onChange={handleCinemaChange}
                                options={cinemas.map((c) => ({ label: c.name, value: c._id }))}
                                className="bg-[#1a1a1a]"
                            />
                        </Form.Item>

                        <Form.Item
                            name="roomId"
                            label="Chọn Phòng Chiếu"
                            rules={[{ required: true, message: 'Vui lòng chọn phòng' }]}
                        >
                            <Select
                                size="large"
                                disabled={!selectedCinemaId}
                                placeholder="Chọn phòng..."
                                options={rooms.map((r) => ({
                                    label: `${r.name} (Sức chứa: ${r.capacity})`,
                                    value: r._id,
                                }))}
                                className="bg-[#1a1a1a]"
                            />
                        </Form.Item>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="dates"
                            label="Khoảng ngày chiếu (Từ ngày - Đến ngày)"
                            rules={[{ required: true, message: 'Vui lòng chọn khoảng thời gian' }]}
                        >
                            <DatePicker.RangePicker
                                format="DD/MM/YYYY"
                                size="large"
                                className="w-full bg-[#1a1a1a] border-white/10 text-white"
                                placeholder={['Ngày bắt đầu', 'Ngày kết thúc']}
                            />
                        </Form.Item>

                        <Form.Item
                            name="price"
                            label="Giá vé cơ bản (VNĐ)"
                            rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
                        >
                            <InputNumber
                                min={0}
                                step={1000}
                                style={{ width: '100%' }}
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                                size="large"
                                className="w-full bg-[#1a1a1a] border-white/10 text-white"
                            />
                        </Form.Item>
                    </div>

                    <Form.Item
                        label="Các khung giờ chiếu"
                        required
                    >
                        <div className="flex gap-2 items-start">
                            <Form.Item
                                name="startTimes"
                                noStyle
                                rules={[{ required: true, message: 'Vui lòng nhập giờ chiếu' }]}
                            >
                                <Select
                                    mode="tags"
                                    size="large"
                                    placeholder="VD: 09:00, 14:30"
                                    className="bg-[#1a1a1a] flex-1"
                                    tokenSeparators={[',']}
                                    open={false} // Disable dropdown since we use tags or auto-generate
                                />
                            </Form.Item>
                            <Button 
                                onClick={handleAutoGenerate} 
                                size="large" 
                                type="dashed"
                                className="border-white/20 text-gray-300 hover:text-white hover:border-white h-auto py-2"
                            >
                                Tự động xếp lịch
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Gõ giờ và Enter, hoặc bấm "Tự động xếp lịch" để lấp đầy từ 08:00 sáng đến khuya.</p>
                    </Form.Item>

                    <Button type="primary" htmlType="submit" loading={isSubmitting} size="large" block className="mt-4">
                        Tạo Suất Chiếu
                    </Button>
                </Form>
            </Modal>
        </div>
    );
}
