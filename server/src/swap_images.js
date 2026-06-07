const mongoose = require('mongoose');
const Movie = require('./models/movies.model');
require('dotenv').config({ path: '../.env' });

async function swapImages() {
    try {
        await mongoose.connect(process.env.CONNECT_DB || 'mongodb://localhost:27017/movie2', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        const movies = await Movie.find();
        let count = 0;
        
        for (let movie of movies) {
            // Chỉ swap nếu posterUrl chứa chữ "poster_" (do script cũ tạo ra) 
            // Wait, script cũ tạo ra file "poster_[timestamp].jpg" từ item.poster_url (chứa thumb ngang)
            // Và file "backdrop_[timestamp].jpg" từ item.thumb_url (chứa poster dọc)
            // Nên ta cứ việc swap giá trị 2 cột này cho nhau.
            
            const temp = movie.posterUrl;
            movie.posterUrl = movie.backdropUrl;
            movie.backdropUrl = temp;
            
            await movie.save();
            count++;
        }
        
        console.log(`Đã swap ảnh thành công cho ${count} phim.`);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

swapImages();
