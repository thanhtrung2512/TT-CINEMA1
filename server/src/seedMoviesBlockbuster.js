const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const Category = require('./models/category.model');
const Movie = require('./models/movies.model');
const Room = require('./models/room.model');
const Showtime = require('./models/showtime.model');
const User = require('./models/users.model');
const Service = require('./models/service.model');
const Booking = require('./models/booking.model');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const CONNECT_URL = process.env.CONNECT_DB || 'mongodb://127.0.0.1:27017/movie2';
const UPLOAD_DIR = path.join(__dirname, 'uploads', 'movies');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Curated list of 17 blockbusters with verified TMDB poster and backdrop paths + real YouTube trailers
const blockbustersData = [
    {
        title: 'Hành Tinh Cát: Phần Hai',
        originTitle: 'Dune: Part Two',
        year: '2024',
        description: 'Paul Atreides đoàn kết với Chani và người Fremen trong cuộc chiến phục thù chống lại những kẻ âm mưu hủy diệt gia đình mình. Đối mặt với lựa chọn giữa tình yêu của cuộc đời mình và số phận của vũ trụ, anh cố gắng ngăn chặn một tương lai khủng khiếp mà chỉ mình anh có thể dự đoán.',
        posterPath: '/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg',
        backdropPath: '/xOMo8BRK7PzsHDtp2qRAE69yCH1.jpg',
        trailer: 'https://www.youtube.com/watch?v=U2Qp5pL387U',
        status: 'Đang chiếu',
        ageRating: 'T13',
        categories: ['Viễn tưởng', 'Phiêu lưu', 'Hành động'],
        details: {
            director: 'Denis Villeneuve',
            actors: 'Timothée Chalamet, Zendaya, Rebecca Ferguson, Javier Bardem',
            duration: '166 phút',
            country: 'Mỹ',
            language: 'Vietsub + Thuyết minh',
            quality: 'FHD 1080p',
            tmdbRating: '8.2/10'
        }
    },
    {
        title: 'Deadpool & Wolverine',
        originTitle: 'Deadpool & Wolverine',
        year: '2024',
        description: 'Wade Wilson (Deadpool) đang tận hưởng cuộc sống bình thường thì bỗng bị tổ chức TVA bắt đi. Anh buộc phải hợp tác với một phiên bản Wolverine khác ở một vũ trụ khác để cứu lấy dòng thời gian của chính mình khỏi bị hủy diệt hoàn toàn.',
        posterPath: '/lWVwWRLqpS1OaNg7KT0ZecSW0PK.jpg',
        backdropPath: '/yD1yeg7O587vlN35n58t7Zh0NV0.jpg',
        trailer: 'https://www.youtube.com/watch?v=73_1biulkYw',
        status: 'Đang chiếu',
        ageRating: 'T18',
        categories: ['Hành động', 'Hài hước', 'Viễn tưởng'],
        details: {
            director: 'Shawn Levy',
            actors: 'Ryan Reynolds, Hugh Jackman, Emma Corrin, Matthew Macfadyen',
            duration: '128 phút',
            country: 'Mỹ',
            language: 'Vietsub + Thuyết minh',
            quality: 'FHD 1080p',
            tmdbRating: '7.8/10'
        }
    },
    {
        title: 'Những Mảnh Ghép Cảm Xúc 2',
        originTitle: 'Inside Out 2',
        year: '2024',
        description: 'Inside Out 2 quay trở lại tâm trí của cô bé Riley khi cô bước vào tuổi dậy thì. Lúc này, ban điều hành cảm xúc của Riley chào đón những "thành viên mới" đầy rắc rối: Lo Âu, Ghen Tị, Chán Nản và Xấu Hổ, tạo nên một cuộc khủng hoảng cảm xúc mới.',
        posterPath: '/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
        backdropPath: '/stKGOmbuwcrBhK16P9FZQfpc8SM.jpg',
        trailer: 'https://www.youtube.com/watch?v=LEjhY15eCx0',
        status: 'Đang chiếu',
        ageRating: 'P',
        categories: ['Hoạt hình', 'Gia đình', 'Hài hước'],
        details: {
            director: 'Kelsey Mann',
            actors: 'Amy Poehler, Maya Hawke, Kensington Tallman, Liza Lapira',
            duration: '96 phút',
            country: 'Mỹ',
            language: 'Lồng tiếng + Vietsub',
            quality: 'FHD 1080p',
            tmdbRating: '8.6/10'
        }
    },
    {
        title: 'Godzilla x Kong: Đế Chế Mới',
        originTitle: 'Godzilla x Kong: The New Empire',
        year: '2024',
        description: 'Hai quái thú khổng lồ Godzilla và Kong phải gạt bỏ những bất hòa để cùng nhau đối đầu với một mối đe dọa mới nguy hiểm xuất hiện từ sâu trong Trái Đất Rỗng, đe dọa sự tồn vong của cả nhân loại và hai vị vua.',
        posterPath: '/1DTP1Ph4uzNO6ofRUm7eAimWoKD.jpg',
        backdropPath: '/qrw4U473Uc5nI5v6J26cxj6veds.jpg',
        trailer: 'https://www.youtube.com/watch?v=lV1OOlGwExM',
        status: 'Đang chiếu',
        ageRating: 'T13',
        categories: ['Hành động', 'Viễn tưởng', 'Phiêu lưu'],
        details: {
            director: 'Adam Wingard',
            actors: 'Rebecca Hall, Dan Stevens, Brian Tyree Henry, Kaylee Hottle',
            duration: '115 phút',
            country: 'Mỹ',
            language: 'Vietsub + Thuyết minh',
            quality: 'FHD 1080p',
            tmdbRating: '7.2/10'
        }
    },
    {
        title: 'Oppenheimer',
        originTitle: 'Oppenheimer',
        year: '2023',
        description: 'Bộ phim tiểu sử lịch sử theo chân J. Robert Oppenheimer, nhà vật lý lý thuyết người Mỹ dẫn đầu dự án Manhattan nhằm chế tạo quả bom nguyên tử đầu tiên cho phe Đồng Minh trong Thế chiến thứ hai.',
        posterPath: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
        backdropPath: '/m8J686vhuU6riZvHQ6ehR5QQm1B.jpg',
        trailer: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
        status: 'Ngừng chiếu',
        ageRating: 'T16',
        categories: ['Tâm lý', 'Tài liệu'],
        details: {
            director: 'Christopher Nolan',
            actors: 'Cillian Murphy, Emily Blunt, Matt Damon, Robert Downey Jr.',
            duration: '180 phút',
            country: 'Mỹ',
            language: 'Vietsub',
            quality: 'FHD 1080p',
            tmdbRating: '8.9/10'
        }
    },
    {
        title: 'Kẻ Trộm Mặt Trăng 4',
        originTitle: 'Despicable Me 4',
        year: '2024',
        description: 'Gru, Lucy, các con gái và thành viên mới - Gru Jr. đối mặt với một kẻ thù nguy hiểm mới tên là Maxime Le Mal và bạn gái của hắn Valentina. Gia đình Gru buộc phải đi lánh nạn, đồng thời các chú Minions cũng có cơ hội thử nghiệm siêu năng lực mới.',
        posterPath: '/wWba30w4j4j81GpdK14LhJmKhp5.jpg',
        backdropPath: '/lgkRsNds2XTRzbZliXJZsIZagj9.jpg',
        trailer: 'https://www.youtube.com/watch?v=qQlr9-rF344',
        status: 'Đang chiếu',
        ageRating: 'P',
        categories: ['Hoạt hình', 'Gia đình', 'Hài hước'],
        details: {
            director: 'Chris Renaud',
            actors: 'Steve Carell, Kristen Wiig, Will Ferrell, Sofia Vergara',
            duration: '94 phút',
            country: 'Mỹ',
            language: 'Lồng tiếng + Vietsub',
            quality: 'FHD 1080p',
            tmdbRating: '7.3/10'
        }
    },
    {
        title: 'Kung Fu Panda 4',
        originTitle: 'Kung Fu Panda 4',
        year: '2024',
        description: 'Po được chọn để trở thành Thủ lĩnh Tinh thần của Thung lũng Bình Yên và phải tìm một Thần Long Đại Hiệp mới. Trong lúc đó, một pháp sư tắc kè hoa độc ác có khả năng biến hình xuất hiện và Po phải hợp tác với chú cáo Zhen để chống lại ả.',
        posterPath: '/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg',
        backdropPath: '/1XddLEwQLqvSgZ3Wy0qn65wzOIe.jpg',
        trailer: 'https://www.youtube.com/watch?v=_inKs4EEIGM',
        status: 'Ngừng chiếu',
        ageRating: 'P',
        categories: ['Hoạt hình', 'Hài hước', 'Phiêu lưu'],
        details: {
            director: 'Mike Mitchell',
            actors: 'Jack Black, Awkwafina, Viola Davis, Dustin Hoffman',
            duration: '94 phút',
            country: 'Mỹ',
            language: 'Lồng tiếng + Vietsub',
            quality: 'FHD 1080p',
            tmdbRating: '7.1/10'
        }
    },
    {
        title: 'Người Nhện: Du Hành Vũ Trụ Nhện',
        originTitle: 'Spider-Man: Across the Spider-Verse',
        year: '2023',
        description: 'Miles Morales gặp lại Gwen Stacy và được đưa qua Đa vũ trụ, nơi anh chạm trán với Liên minh Nhện dẫn dắt bởi Miguel O\'Hara. Tại đây, Miles phải tự mình định nghĩa lại ý nghĩa của việc làm anh hùng để cứu lấy những người thân yêu.',
        posterPath: '/8vtB7CST842vQQ4t6x6n26YYv64.jpg',
        backdropPath: '/wuzZlQv9J820x4xVwR2yHhYp2q2.jpg',
        trailer: 'https://www.youtube.com/watch?v=cqGJHflJaHQ',
        status: 'Ngừng chiếu',
        ageRating: 'T13',
        categories: ['Hoạt hình', 'Hành động', 'Viễn tưởng'],
        details: {
            director: 'Joaquim Dos Santos, Kemp Powers',
            actors: 'Shameik Moore, Hailee Steinfeld, Oscar Isaac, Jake Johnson',
            duration: '140 phút',
            country: 'Mỹ',
            language: 'Vietsub',
            quality: 'FHD 1080p',
            tmdbRating: '8.4/10'
        }
    },
    {
        title: 'Joker: Điên Có Đôi',
        originTitle: 'Joker: Folie à Deux',
        year: '2024',
        description: 'Arthur Fleck đang bị giam cầm tại bệnh viện tâm thần Arkham chờ ngày xét xử. Tại đây, anh tìm thấy tình yêu đích thực và niềm đam mê âm nhạc kỳ lạ của đời mình khi gặp gỡ Harley Quinn, tạo nên cuộc nổi loạn đầy điên rồ.',
        posterPath: '/aciP8KmJ2liwbftbUqz54yPyt19.jpg',
        backdropPath: '/dj725E77y0u6xG2Gf5jF8jE6Z0B.jpg',
        trailer: 'https://www.youtube.com/watch?v=xy8aJw1vYHo',
        status: 'Sắp chiếu',
        ageRating: 'T18',
        categories: ['Tâm lý', 'Giật gân'],
        details: {
            director: 'Todd Phillips',
            actors: 'Joaquin Phoenix, Lady Gaga, Brendan Gleeson, Catherine Keener',
            duration: '138 phút',
            country: 'Mỹ',
            language: 'Vietsub',
            quality: 'FHD 1080p',
            tmdbRating: '5.6/10'
        }
    },
    {
        title: 'Vùng Đất Câm Lặng: Ngày Một',
        originTitle: 'A Quiet Place: Day One',
        year: '2024',
        description: 'Phần tiền truyện đưa khán giả quay trở lại ngày đầu tiên khi những sinh vật mù có thính giác siêu nhạy bén đổ bộ xuống Trái Đất. Bối cảnh diễn ra tại thành phố New York náo nhiệt, nơi một nhóm người lạ mặt phải cùng nhau sinh tồn trong im lặng.',
        posterPath: '/yr7NJy3NnE2c27cuMIiO2on8BIF.jpg',
        backdropPath: '/2RVZ2jOJe76E24522h7n1V56j2t.jpg',
        trailer: 'https://www.youtube.com/watch?v=YPY7J-flzE8',
        status: 'Ngừng chiếu',
        ageRating: 'T16',
        categories: ['Kinh dị', 'Giật gân', 'Viễn tưởng'],
        details: {
            director: 'Michael Sarnoski',
            actors: 'Lupita Nyong\'o, Joseph Quinn, Alex Wolff, Djimon Hounsou',
            duration: '99 phút',
            country: 'Mỹ',
            language: 'Vietsub',
            quality: 'FHD 1080p',
            tmdbRating: '6.9/10'
        }
    },
    {
        title: 'Furiosa: Chiến Binh Hoang Mạc',
        originTitle: 'Furiosa: A Mad Max Saga',
        year: '2024',
        description: 'Bộ phim tiền truyện của bom tấn Mad Max: Fury Road, xoay quanh thời trẻ của nữ chiến binh Furiosa khi cô bị bắt cóc khỏi Vùng Xanh bởi băng đảng Biker Horde của bạo chúa Dementus, trải qua nhiều năm đấu tranh để tìm đường trở về nhà.',
        posterPath: '/iADOZ8zG7laG58v5w5nUYW4ri3c.jpg',
        backdropPath: '/jeGsc2uTrue7Z6x1oagK20w5tbb.jpg',
        trailer: 'https://www.youtube.com/watch?v=XJMuhwVlca4',
        status: 'Ngừng chiếu',
        ageRating: 'T16',
        categories: ['Hành động', 'Phiêu lưu', 'Viễn tưởng'],
        details: {
            director: 'George Miller',
            actors: 'Anya Taylor-Joy, Chris Hemsworth, Tom Burke, Lachy Hulme',
            duration: '148 phút',
            country: 'Úc',
            language: 'Vietsub',
            quality: 'FHD 1080p',
            tmdbRating: '7.6/10'
        }
    },
    {
        title: 'Hành Tinh Khỉ: Vương Quốc Mới',
        originTitle: 'Kingdom of the Planet of the Apes',
        year: '2024',
        description: 'Nhiều thế nghe sau sự ra đi của Caesar, loài khỉ trở thành bá chủ Trái Đất trong khi con người bị đẩy lùi vào bóng tối. Một thủ lĩnh khỉ trẻ tuổi tên Noa bắt đầu cuộc hành trình đầy nguy hiểm cùng một cô gái loài người nhằm định đoạt tương lai của cả hai giống loài.',
        posterPath: '/gKlh3jTr448RSdKeyw5RrlHW8BM.jpg',
        backdropPath: '/fqC8tr4q3mQgnJ4EW4sz782U2CX.jpg',
        trailer: 'https://www.youtube.com/watch?v=Kdr5eednVas',
        status: 'Ngừng chiếu',
        ageRating: 'T13',
        categories: ['Viễn tưởng', 'Hành động', 'Phiêu lưu'],
        details: {
            director: 'Wes Ball',
            actors: 'Owen Teague, Freya Allan, Kevin Durand, Peter Macon',
            duration: '145 phút',
            country: 'Mỹ',
            language: 'Vietsub',
            quality: 'FHD 1080p',
            tmdbRating: '7.1/10'
        }
    },
    {
        title: 'Avatar: Dòng Chảy Của Nước',
        originTitle: 'Avatar: The Way of Water',
        year: '2022',
        description: 'Hơn một thập kỷ sau các sự kiện của phần phim đầu tiên, Jake Sully và Neytiri đã lập gia đình và sinh sống yên bình tại Pandora. Tuy nhiên, khi một mối đe dọa cũ từ RDA quay trở lại, họ buộc phải rời bỏ quê hương và tìm kiếm sự giúp đỡ từ bộ tộc biển Metkayina.',
        posterPath: '/t6HIqrRAcljUjFrSPm2rmemLHr6.jpg',
        backdropPath: '/s16XOX3a7ywjClLG7pzsAz6CcEL.jpg',
        trailer: 'https://www.youtube.com/watch?v=d9MyW72ELq0',
        status: 'Ngừng chiếu',
        ageRating: 'T13',
        categories: ['Viễn tưởng', 'Phiêu lưu', 'Hành động'],
        details: {
            director: 'James Cameron',
            actors: 'Sam Worthington, Zoe Saldana, Sigourney Weaver, Kate Winslet',
            duration: '192 phút',
            country: 'Mỹ',
            language: 'Vietsub + Thuyết minh',
            quality: 'FHD 1080p',
            tmdbRating: '7.6/10'
        }
    },
    {
        title: 'Biệt Đội Siêu Anh Hùng: Hồi Kết',
        originTitle: 'Avengers: Endgame',
        year: '2019',
        description: 'Sau thất bại thảm hại trước Thanos khiến một nửa sinh linh trong vũ trụ tan biến, các siêu anh hùng còn sống sót của nhóm Avengers phải tìm mọi cách đảo ngược tình thế, thực hiện một phi vụ du hành thời gian đầy rủi ro để khôi phục lại trật tự vũ trụ.',
        posterPath: '/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
        backdropPath: '/7RyGs7WOFhqEsYLcr4bhSq7icjS.jpg',
        trailer: 'https://www.youtube.com/watch?v=TcMBFSGVi1c',
        status: 'Ngừng chiếu',
        ageRating: 'T13',
        categories: ['Hành động', 'Viễn tưởng', 'Phiêu lưu'],
        details: {
            director: 'Anthony Russo, Joe Russo',
            actors: 'Robert Downey Jr., Chris Evans, Mark Ruffalo, Chris Hemsworth',
            duration: '181 phút',
            country: 'Mỹ',
            language: 'Vietsub + Thuyết minh',
            quality: 'FHD 1080p',
            tmdbRating: '8.3/10'
        }
    },
    {
        title: 'Robot Hoang Dã',
        originTitle: 'The Wild Robot',
        year: '2024',
        description: 'Một bộ phim hoạt hình đầy cảm xúc về chuyến phiêu lưu của Roz - một robot trợ giúp gia đình thông minh bị đắm tàu và mắc kẹt trên một hòn đảo hoang vắng. Roz phải thích nghi với môi trường khắc nghiệt, xây dựng mối quan hệ với các loài động vật hoang dã và trở thành mẹ nuôi của một chú ngỗng con mồ côi.',
        posterPath: '/w1o4B4972eh457BYyp7v2Q1IFJ6.jpg',
        backdropPath: '/vX11n6zVjP6Z7pUoRtrq2qfH1Sj.jpg',
        trailer: 'https://www.youtube.com/watch?v=677a2V7uY1E',
        status: 'Sắp chiếu',
        ageRating: 'P',
        categories: ['Hoạt hình', 'Gia đình', 'Phiêu lưu'],
        details: {
            director: 'Chris Sanders',
            actors: 'Lupita Nyong\'o, Pedro Pascal, Kit Connor, Catherine O\'Hara',
            duration: '102 phút',
            country: 'Mỹ',
            language: 'Lồng tiếng + Vietsub',
            quality: 'FHD 1080p',
            tmdbRating: '8.4/10'
        }
    },
    {
        title: 'Venom: Kèo Cuối',
        originTitle: 'Venom: The Last Dance',
        year: '2024',
        description: 'Eddie Brock và Venom đang phải chạy trốn khi bị cả hai thế giới săn đuổi. Khi vòng vây ngày càng khép lại, cặp đôi buộc phải đưa ra một quyết định tàn khốc để hạ màn cho vũ điệu cuối cùng của họ.',
        posterPath: '/kV6ceSPLK1f8cIjvqOmvnmBEMbD.jpg',
        backdropPath: '/3V4kLQg0kSqPLctI5ziYWabAZYF.jpg',
        trailer: 'https://www.youtube.com/watch?v=HyIyd9sWNHc',
        status: 'Sắp chiếu',
        ageRating: 'T13',
        categories: ['Hành động', 'Viễn tưởng', 'Phiêu lưu'],
        details: {
            director: 'Kelly Marcel',
            actors: 'Tom Hardy, Chiwetel Ejiofor, Juno Temple, Rhys Ifans',
            duration: '109 phút',
            country: 'Mỹ',
            language: 'Vietsub + Thuyết minh',
            quality: 'FHD 1080p',
            tmdbRating: '6.4/10'
        }
    },
    {
        title: 'Võ Sĩ Giác Đấu II',
        originTitle: 'Gladiator II',
        year: '2024',
        description: 'Nhiều năm sau khi chứng kiến cái chết của người anh hùng Maximus dưới tay người chú của mình, Lucius buộc phải bước vào Đấu trường La Mã sau khi quê hương của anh bị chinh phục bởi những hoàng đế độc tài tàn bạo đang cai trị Rome.',
        posterPath: '/f54mzACTFdiAxnQ30BK4GjrKzyn.jpg',
        backdropPath: '/euYIwmwkmz95mnXvufEmbL6ovhZ.jpg',
        trailer: 'https://www.youtube.com/watch?v=gT-824EwPCo',
        status: 'Sắp chiếu',
        ageRating: 'T16',
        categories: ['Hành động', 'Tâm lý', 'Phiêu lưu'],
        details: {
            director: 'Ridley Scott',
            actors: 'Paul Mescal, Pedro Pascal, Denzel Washington, Connie Nielsen',
            duration: '148 phút',
            country: 'Anh',
            language: 'Vietsub',
            quality: 'FHD 1080p',
            tmdbRating: '7.0/10'
        }
    }
];

async function downloadImage(url, filename) {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return '';
    try {
        const filePath = path.join(UPLOAD_DIR, filename);
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 15000
        });
        
        return new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);
            writer.on('finish', () => resolve(`/uploads/movies/${filename}`));
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`      ⚠️ Không tải được ảnh ${url}: ${error.message}`);
        // fallback to remote URL
        return url;
    }
}

function generateSeatLayout(rooms) {
    const layout = [];
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    for (const row of rows) {
        for (let number = 1; number <= 12; number++) {
            let type = 'Thuong';
            if (row === 'G' || row === 'H' || row === 'I') {
                type = 'VIP';
            } else if (row === 'J') {
                type = 'Sweetbox';
            }
            layout.push({ row, number, type });
        }
    }
    return layout;
}

async function seedBlockbusters() {
    try {
        console.log('🔗 Đang kết nối MongoDB...');
        await mongoose.connect(CONNECT_URL);
        console.log('✅ Kết nối MongoDB thành công!');

        // 1. Kiểm tra thể loại trong database
        const dbCategories = await Category.find();
        if (dbCategories.length === 0) {
            console.error('❌ Không tìm thấy thể loại nào. Vui lòng chạy seed.js trước!');
            process.exit(1);
        }
        console.log(`📂 Tìm thấy ${dbCategories.length} thể loại trong DB.`);

        // Tạo map danh mục để tìm nhanh hơn
        const categoryMap = {};
        dbCategories.forEach(cat => {
            categoryMap[cat.categoryName.toLowerCase()] = cat._id;
        });

        // 2. Xóa phim cũ, suất chiếu cũ, và lịch sử đặt vé cũ
        console.log('🧹 Đang dọn dẹp Phim, Suất chiếu và Giao dịch cũ...');
        const movieDel = await Movie.deleteMany({});
        const showtimeDel = await Showtime.deleteMany({});
        const bookingDel = await Booking.deleteMany({});
        console.log(`❌ Đã xóa ${movieDel.deletedCount} phim, ${showtimeDel.deletedCount} suất chiếu, ${bookingDel.deletedCount} giao dịch đặt vé.`);

        // 3. Tải ảnh và chèn các phim bom tấn mới
        console.log(`🚀 Bắt đầu tải ảnh và tạo ${blockbustersData.length} phim bom tấn mới...`);
        const seededMovies = [];

        for (let i = 0; i < blockbustersData.length; i++) {
            const item = blockbustersData[i];
            console.log(`  [${i + 1}/${blockbustersData.length}] Đang xử lý: ${item.title}...`);

            // Tìm thể loại
            const catIds = [];
            for (const catName of item.categories) {
                const normalized = catName.toLowerCase();
                if (categoryMap[normalized]) {
                    catIds.push(categoryMap[normalized]);
                }
            }

            // Tải ảnh về local
            const ts = Date.now() + i;
            const posterUrlRemote = `https://image.tmdb.org/t/p/w500${item.posterPath}`;
            const backdropUrlRemote = `https://image.tmdb.org/t/p/w1280${item.backdropPath}`;

            console.log(`      📥 Đang tải poster/backdrop từ TMDB...`);
            const [localPosterUrl, localBackdropUrl] = await Promise.all([
                downloadImage(posterUrlRemote, `poster_blockbuster_${ts}.jpg`),
                downloadImage(backdropUrlRemote, `backdrop_blockbuster_${ts}.jpg`)
            ]);

            const detailsArray = [
                { name: 'Tên gốc', value: item.originTitle || 'Đang cập nhật' },
                { name: 'Năm sản xuất', value: item.year || '2024' },
                { name: 'Đạo diễn', value: item.details.director || 'Đang cập nhật' },
                { name: 'Diễn viên', value: item.details.actors || 'Đang cập nhật' },
                { name: 'Quốc gia', value: item.details.country || 'Đang cập nhật' },
                { name: 'Thời lượng', value: item.details.duration || 'Đang cập nhật' },
                { name: 'Ngôn ngữ', value: item.details.language || 'Vietsub + Thuyết minh' },
                { name: 'Chất lượng', value: item.details.quality || 'FHD 1080p' },
                { name: 'Đánh giá TMDB', value: item.details.tmdbRating || 'N/A' }
            ];

            const movie = new Movie({
                title: item.title,
                slug: item.title.toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[đĐ]/g, 'd')
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)+/g, ''),
                description: item.description,
                posterUrl: localPosterUrl,
                backdropUrl: localBackdropUrl,
                trailer: item.trailer,
                status: item.status,
                ageRating: item.ageRating,
                categories: catIds,
                details: detailsArray
            });

            const saved = await movie.save();
            seededMovies.push(saved);
            console.log(`      ✅ Đã lưu phim thành công!`);
        }

        // 4. Tạo Suất chiếu trong tương lai (5 ngày tới) cho các phim mới
        console.log('\n⏰ Đang tạo Suất chiếu tương lai...');
        const rooms = await Room.find();
        if (rooms.length === 0) {
            console.error('❌ Không tìm thấy phòng chiếu nào để tạo suất chiếu!');
            process.exit(1);
        }

        const showtimesToInsert = [];
        const today = new Date();
        const activeMovies = seededMovies.filter(m => m.status === 'Đang chiếu' || m.status === 'Sắp chiếu');

        for (const movie of activeMovies) {
            const selectedRooms = [
                rooms[Math.floor(Math.random() * rooms.length)],
                rooms[Math.floor(Math.random() * rooms.length)]
            ];

            for (const room of selectedRooms) {
                for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
                    const startTime = new Date(today);
                    startTime.setDate(today.getDate() + dayOffset);
                    const hours = [10, 14, 18, 21];
                    const selectedHour = hours[Math.floor(Math.random() * hours.length)];
                    startTime.setHours(selectedHour, 0, 0, 0);

                    const endTime = new Date(startTime);
                    endTime.setHours(startTime.getHours() + 2);

                    const prices = [75000, 85000, 95000, 120000];
                    const price = prices[Math.floor(Math.random() * prices.length)];

                    const showtimeSeats = room.seatLayout.map(seat => ({
                        row: seat.row,
                        number: seat.number,
                        type: seat.type,
                        status: 'Available',
                        userId: null
                    }));

                    // Đặt trước ngẫu nhiên 5-10 ghế
                    const numBooked = Math.floor(Math.random() * 6) + 5;
                    for (let b = 0; b < numBooked; b++) {
                        const randomIndex = Math.floor(Math.random() * showtimeSeats.length);
                        showtimeSeats[randomIndex].status = 'Booked';
                    }

                    showtimesToInsert.push({
                        movieId: movie._id,
                        roomId: room._id,
                        startTime,
                        endTime,
                        price,
                        seats: showtimeSeats
                    });
                }
            }
        }
        const showtimes = await Showtime.insertMany(showtimesToInsert);
        console.log(`✅ Đã tạo thành công ${showtimes.length} suất chiếu tương lai.`);

        // 5. Tạo lịch sử đặt vé quá khứ cho Khách Hàng Trải Nghiệm (user@gmail.com)
        console.log('\n🎟️ Đang tạo lịch sử giao dịch đặt vé quá khứ cho user@gmail.com...');
        const customer = await User.findOne({ email: 'user@gmail.com' });
        if (!customer) {
            console.error('❌ Không tìm thấy user@gmail.com để tạo lịch sử đặt vé!');
            process.exit(1);
        }

        const services = await Service.find();
        const pastBookingsToInsert = [];
        const bookingMovies = seededMovies.filter(m => m.status === 'Đang chiếu').slice(0, 3);
        const pastDays = [5, 3, 1];

        for (let i = 0; i < bookingMovies.length; i++) {
            const movie = bookingMovies[i];
            const room = rooms[Math.floor(Math.random() * rooms.length)];
            const daysAgo = pastDays[i];

            const startTime = new Date();
            startTime.setDate(today.getDate() - daysAgo);
            startTime.setHours(19, 0, 0, 0);

            const endTime = new Date(startTime);
            endTime.setHours(startTime.getHours() + 2);

            const price = 95000;
            const pastSeats = room.seatLayout.map(seat => ({
                row: seat.row,
                number: seat.number,
                type: seat.type,
                status: 'Available',
                userId: null
            }));

            const selectedSeats = [`G${5 + i}`, `G${6 + i}`];
            selectedSeats.forEach(seatCode => {
                const foundSeat = pastSeats.find(s => `${s.row}${s.number}` === seatCode);
                if (foundSeat) {
                    foundSeat.status = 'Booked';
                    foundSeat.userId = customer._id;
                }
            });

            const pastShowtime = new Showtime({
                movieId: movie._id,
                roomId: room._id,
                startTime,
                endTime,
                price,
                seats: pastSeats
            });

            await pastShowtime.save();

            const ticketPrice = 2 * price;
            const selectedService = services.length > 0 ? services[Math.floor(Math.random() * services.length)] : null;
            const serviceQty = Math.floor(Math.random() * 2) + 1;
            const serviceCost = selectedService ? selectedService.price * serviceQty : 0;
            const totalPrice = ticketPrice + serviceCost;

            const bookingData = {
                userId: customer._id,
                showtimeId: pastShowtime._id,
                seats: selectedSeats,
                totalPrice: totalPrice,
                paymentMethod: 'Momo',
                paymentTransactionId: 'TXN' + Math.floor(Math.random() * 100000000),
                status: 'Paid',
                createdAt: startTime,
                updatedAt: startTime
            };

            if (selectedService) {
                bookingData.services = [
                    {
                        serviceId: selectedService._id,
                        quantity: serviceQty
                    }
                ];
            }

            pastBookingsToInsert.push(bookingData);
        }

        const bookings = await Booking.insertMany(pastBookingsToInsert);
        console.log(`✅ Đã tạo thành công ${bookings.length} lịch sử đặt vé quá khứ.`);

        console.log('\n🎉 Quá trình làm mới dữ liệu phim bom tấn hoàn tất cực kỳ xịn xò!');
        mongoose.connection.close();
    } catch (err) {
        console.error('💥 Lỗi nghiêm trọng khi seed phim bom tấn:', err);
        mongoose.connection.close();
        process.exit(1);
    }
}

seedBlockbusters();
