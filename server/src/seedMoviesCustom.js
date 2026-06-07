/**
 * seedMoviesCustom.js
 * Seed 15 bộ phim bom tấn chiếu rạp nổi tiếng với ảnh dọc/ngang chuẩn từ TMDB tải về local.
 */

const mongoose = require('mongoose');
const axios    = require('axios');
const fs       = require('fs');
const path     = require('path');
const Movie    = require('./models/movies.model');
const Category = require('./models/category.model');
const Showtime = require('./models/showtime.model');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const UPLOAD_DIR = path.join(__dirname, 'uploads', 'movies');

// Tạo thư mục uploads nếu chưa có
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const moviesData = [
  {
    title: 'Hành Tinh Cát: Phần Hai',
    originTitle: 'Dune: Part Two',
    year: '2024',
    description: 'Paul Atreides đoàn kết với Chani và người Fremen trong cuộc chiến phục thù chống lại những kẻ âm mưu hủy diệt gia đình mình. Đối mặt với lựa chọn giữa tình yêu của cuộc đời mình và số phận của vũ trụ, anh cố gắng ngăn chặn một tương lai khủng khiếp mà chỉ mình anh có thể dự đoán.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/cz16qqG43RJl9t4qi2qgd9Sbv2Q.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/xOMo8BRK7PzsHDtp2qRAE69yCH1.jpg',
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
    posterUrl: 'https://image.tmdb.org/t/p/w500/8cdWv56Z1yE1aojxl5tM2iz66KG.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/yD1yeg7O587vlN35n58t7Zh0NV0.jpg',
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
    posterUrl: 'https://image.tmdb.org/t/p/w500/vpnVM9B6m647mg1tpO6wEsVZx69.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/stKGOmbuwcrBhK16P9FZQfpc8SM.jpg',
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
    posterUrl: 'https://image.tmdb.org/t/p/w500/v4uxGZ4n57lWj727h8Vv15liv7M.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/qrw4U473Uc5nI5v6J26cxj6veds.jpg',
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
    posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv2wSbsysLYlhRBgjlbzwmZ5H.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/m8J686vhuU6riZvHQ6ehR5QQm1B.jpg',
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
    posterUrl: 'https://image.tmdb.org/t/p/w500/wWba30w4j4j81GpdK14LhJmKhp5.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/lgkRsNds2XTRzbZliXJZsIZagj9.jpg',
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
    posterUrl: 'https://image.tmdb.org/t/p/w500/kDp1vUBUPm078cz618KrLwzOVQW.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/1XddLEwQLqvSgZ3Wy0qn65wzOIe.jpg',
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
    posterUrl: 'https://image.tmdb.org/t/p/w500/8vtB7CST842vQQ4t6x6n26YYv64.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/wuzZlQv9J820x4xVwR2yHhYp2q2.jpg',
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
    posterUrl: 'https://image.tmdb.org/t/p/w500/aciP8KmJ2liwbftbUqz54yPyt19.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/dj725E77y0u6xG2Gf5jF8jE6Z0B.jpg',
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
    posterUrl: 'https://image.tmdb.org/t/p/w500/yr7NJy3NnE2c27cuMIiO2on8BIF.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/2RVZ2jOJe76E24522h7n1V56j2t.jpg',
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
    posterUrl: 'https://image.tmdb.org/t/p/w500/iADOZ8zG7laG58v5w5nUYW4ri3c.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/jeGsc2uTrue7Z6x1oagK20w5tbb.jpg',
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
    description: 'Nhiều thế hệ sau sự ra đi của Caesar, loài khỉ trở thành bá chủ Trái Đất trong khi con người bị đẩy lùi vào bóng tối. Một thủ lĩnh khỉ trẻ tuổi tên Noa bắt đầu cuộc hành trình đầy nguy hiểm cùng một cô gái loài người nhằm định đoạt tương lai của cả hai giống loài.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/gKlh3jTr448RSdKeyw5RrlHW8BM.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/fqC8tr4q3mQgnJ4EW4sz782U2CX.jpg',
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
    posterUrl: 'https://image.tmdb.org/t/p/w500/t6HIqrRAcljUjFrSPm2rmemLHr6.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/s16XOX3a7ywjClLG7pzsAz6CcEL.jpg',
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
    posterUrl: 'https://image.tmdb.org/t/p/w500/or06umiXVj75J6uIsjCkiSUtabC.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/7RyGs7WOFhqEsYLcr4bhSq7icjS.jpg',
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
    posterUrl: 'https://image.tmdb.org/t/p/w500/w1o4B4972eh457BYyp7v2Q1IFJ6.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/vX11n6zVjP6Z7pUoRtrq2qfH1Sj.jpg',
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
    posterUrl: 'https://image.tmdb.org/t/p/w500/kV6ceSPLK1f8cIjvqOmvnmBEMbD.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/3V4kLQg0kSqPLctI5ziYWabAZYF.jpg',
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
    posterUrl: 'https://image.tmdb.org/t/p/w500/f54mzACTFdiAxnQ30BK4GjrKzyn.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/euYIwmwkmz95mnXvufEmbL6ovhZ.jpg',
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
        // Trả về trực tiếp URL ngoài để fallback nếu lỗi tải
        return url;
    }
}

async function seedData() {
    try {
        const dbUri = process.env.CONNECT_DB || 'mongodb://127.0.0.1:27017/movie2';
        console.log(`🔗 Đang kết nối MongoDB: ${dbUri}`);
        await mongoose.connect(dbUri);
        console.log('✅ Kết nối MongoDB thành công!');

        // Lấy danh sách danh mục hiện có
        const dbCategories = await Category.find();
        if (dbCategories.length === 0) {
            console.error('❌ Không có thể loại nào trong DB. Vui lòng chạy kịch bản seed thể loại trước (node src/seed.js).');
            process.exit(1);
        }
        console.log(`📂 Tìm thấy ${dbCategories.length} thể loại trong DB.`);

        // Tạo map danh mục để tìm nhanh hơn
        const categoryMap = {};
        dbCategories.forEach(cat => {
            categoryMap[cat.categoryName.toLowerCase()] = cat._id;
        });

        // Xóa dữ liệu phim cũ
        console.log('🧹 Đang xóa dữ liệu phim cũ...');
        const deleteMoviesResult = await Movie.deleteMany({});
        console.log(`❌ Đã xóa ${deleteMoviesResult.deletedCount} phim.`);

        // Xóa suất chiếu cũ (tránh lỗi khóa ngoại chiếu tới phim không tồn tại)
        console.log('🧹 Đang xóa toàn bộ suất chiếu cũ...');
        const deleteShowtimesResult = await Showtime.deleteMany({});
        console.log(`❌ Đã xóa ${deleteShowtimesResult.deletedCount} suất chiếu.`);

        console.log(`🚀 Bắt đầu xử lý ${moviesData.length} phim bom tấn...`);

        for (let i = 0; i < moviesData.length; i++) {
            const item = moviesData[i];
            console.log(`  [${i + 1}/${moviesData.length}] Đang xử lý: ${item.title}...`);

            // Tìm IDs danh mục cho phim này
            const catIds = [];
            for (const catName of item.categories) {
                const normalized = catName.toLowerCase();
                if (categoryMap[normalized]) {
                    catIds.push(categoryMap[normalized]);
                } else {
                    // Thử tìm xem có danh mục nào chứa từ khóa không
                    const found = Object.keys(categoryMap).find(k => k.includes(normalized) || normalized.includes(k));
                    if (found) {
                        catIds.push(categoryMap[found]);
                    }
                }
            }

            // Tải ảnh về local
            const ts = Date.now() + i;
            
            const posterExt = path.extname(item.posterUrl.split('?')[0]) || '.jpg';
            const backdropExt = path.extname(item.backdropUrl.split('?')[0]) || '.jpg';

            console.log(`      📥 Đang tải ảnh poster và backdrop...`);
            const [localPosterUrl, localBackdropUrl] = await Promise.all([
                downloadImage(item.posterUrl, `poster_custom_${ts}${posterExt}`),
                downloadImage(item.backdropUrl, `backdrop_custom_${ts}${backdropExt}`)
            ]);

            // Cấu trúc details theo định dạng mảng { name, value } để client hiển thị
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
                    .replace(/[\u0300-\u036f]/g, '') // Khử dấu tiếng Việt
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

            await movie.save();
            console.log(`      ✅ Đã lưu phim thành công!`);
        }

        console.log('\n🎉 Hoàn thành quá trình thêm phim chất lượng cao thành công!');
        mongoose.connection.close();
    } catch (error) {
        console.error('💥 Lỗi nghiêm trọng khi seed phim:', error);
        process.exit(1);
    }
}

seedData();
