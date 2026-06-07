/**
 * syncMoviesFromApi.js
 * Đồng bộ phim từ https://vsmov.com/api/danh-sach/phim-moi-cap-nhat vào MongoDB
 *
 * Tính năng:
 *  - Tải ảnh về thư mục uploads/movies/ (lưu local)
 *  - Phim có nhiều phần (cùng TMDB ID) → chỉ lấy 1 phần mới nhất
 *  - Tránh trùng lặp theo slug
 *  - Hỗ trợ --page=N và --pages=N
 *
 * Cách chạy:
 *   node src/syncMoviesFromApi.js              (trang 1)
 *   node src/syncMoviesFromApi.js --page=2     (trang 2)
 *   node src/syncMoviesFromApi.js --pages=5    (trang 1→5)
 *   node src/syncMoviesFromApi.js --page=2 --pages=3  (trang 2→4)
 */

const mongoose = require('mongoose');
const axios    = require('axios');
const fs       = require('fs');
const path     = require('path');
const Movie    = require('./models/movies.model');
const Category = require('./models/category.model');
require('dotenv').config({ path: __dirname + '/../.env' });

// ─── Config ────────────────────────────────────────────────────────────────────
const API_BASE  = 'https://vsmov.com/api/danh-sach/phim-moi-cap-nhat';
const UPLOAD_DIR = path.join(__dirname, 'uploads', 'movies');
const COUNTRIES  = ['Mỹ', 'Hàn Quốc', 'Anh', 'Trung Quốc', 'Nhật Bản', 'Việt Nam', 'Thái Lan'];
const DURATIONS  = ['90 phút', '105 phút', '110 phút', '120 phút', '130 phút', '150 phút'];
const STATUS_LIST = ['Đang chiếu', 'Sắp chiếu', 'Ngừng chiếu'];

// Đọc tham số CLI
const args      = process.argv.slice(2);
const pagesArg  = args.find(a => a.startsWith('--pages='));
const pageArg   = args.find(a => a.startsWith('--page='));
const totalPages = pagesArg ? parseInt(pagesArg.split('=')[1]) : 1;
const startPage  = pageArg  ? parseInt(pageArg.split('=')[1])  : 1;

// Tạo thư mục uploads nếu chưa có
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ─── Helper ─────────────────────────────────────────────────────────────────────
function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getImageUrl(val) {
    if (typeof val === 'string' && val.startsWith('http')) return val;
    return null;
}

/**
 * Tải ảnh về local, trả về đường dẫn /uploads/movies/filename
 */
async function downloadImage(url, filename) {
    if (!url) return '';
    try {
        const filePath = path.join(UPLOAD_DIR, filename);
        const response = await axios({ url, method: 'GET', responseType: 'stream', timeout: 15000 });
        return new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);
            writer.on('finish', () => resolve(`/uploads/movies/${filename}`));
            writer.on('error', reject);
        });
    } catch (err) {
        console.warn(`      ⚠️  Không tải được ảnh: ${url} → ${err.message}`);
        return '';
    }
}

function buildDetails(item) {
    return [
        { name: 'Tên gốc',        value: item.origin_name || 'Đang cập nhật' },
        { name: 'Năm sản xuất',   value: item.year ? String(item.year) : 'Đang cập nhật' },
        { name: 'Đạo diễn',      value: 'Đang cập nhật' },
        { name: 'Diễn viên',     value: 'Đang cập nhật' },
        { name: 'Quốc gia',      value: pickRandom(COUNTRIES) },
        { name: 'Thời lượng',    value: pickRandom(DURATIONS) },
        { name: 'Ngôn ngữ',      value: 'Vietsub + Thuyết minh' },
        { name: 'Chất lượng',    value: 'FHD 1080p' },
        { name: 'Đánh giá TMDB', value: item.tmdb?.vote_average && item.tmdb.vote_average !== '0.0'
            ? `${item.tmdb.vote_average}/10` : 'N/A' },
        { name: 'Loại phim',     value: item.tmdb?.type === 'tv' ? 'Phim bộ' : 'Phim lẻ' },
    ];
}

// ─── Lọc trùng lặp: phim nhiều phần cùng TMDB ID → chỉ giữ 1 ─────────────────
/**
 * Từ mảng items API, loại bỏ các phim trùng TMDB ID.
 * Giữ lại item đầu tiên (mới nhất vì API sort theo modified desc).
 * Phim không có TMDB ID (null) thì giữ tất cả.
 */
function deduplicateSeries(items) {
    const seenTmdbIds = new Set();
    const result = [];

    for (const item of items) {
        const tmdbId = item.tmdb?.id;

        if (tmdbId && tmdbId !== null) {
            if (seenTmdbIds.has(tmdbId)) {
                // Bỏ qua các phần trùng
                continue;
            }
            seenTmdbIds.add(tmdbId);
        }

        result.push(item);
    }

    return result;
}

// ─── Fetch một trang từ API ──────────────────────────────────────────────────────
async function fetchPage(page) {
    const url = `${API_BASE}?page=${page}`;
    console.log(`  → Đang gọi: ${url}`);
    const res = await axios.get(url, { timeout: 15000 });
    if (!res.data.status) throw new Error('API trả về status = false');
    return {
        items:      res.data.items || [],
        pagination: res.data.pagination || {},
    };
}

// ─── Xử lý một phim ─────────────────────────────────────────────────────────────
async function processMovie(item, categories, index) {
    const slug = item.slug || item.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    // Bỏ qua nếu đã tồn tại
    const exists = await Movie.findOne({ slug });
    if (exists) return { status: 'skip', title: item.name };

    // Random categories
    const catIds = categories.length > 0
        ? [...new Set([pickRandom(categories)._id.toString(), pickRandom(categories)._id.toString()])]
              .map(id => new mongoose.Types.ObjectId(id))
        : [];

    // Tải ảnh về local
    const ts = Date.now() + index;

    const posterRawUrl   = getImageUrl(item.poster_url) || getImageUrl(item.thumb_url);
    const backdropRawUrl = getImageUrl(item.thumb_url)  || getImageUrl(item.poster_url);

    const posterExt   = posterRawUrl   ? (path.extname(posterRawUrl.split('?')[0])   || '.jpg') : '.jpg';
    const backdropExt = backdropRawUrl ? (path.extname(backdropRawUrl.split('?')[0]) || '.jpg') : '.jpg';

    const [posterUrl, backdropUrl] = await Promise.all([
        posterRawUrl   ? downloadImage(posterRawUrl,   `poster_${ts}${posterExt}`)   : Promise.resolve(''),
        backdropRawUrl ? downloadImage(backdropRawUrl, `backdrop_${ts}${backdropExt}`) : Promise.resolve(''),
    ]);

    const movie = new Movie({
        title:       item.name,
        slug,
        description: `${item.name} – ${item.origin_name ? `(${item.origin_name}) – ` : ''}Phim năm ${item.year || 'N/A'}. Mang đến những cảnh quay mãn nhãn và cốt truyện hấp dẫn.`,
        posterUrl,
        backdropUrl,
        trailer:     '',
        status:      pickRandom(STATUS_LIST),
        categories:  catIds,
        details:     buildDetails(item),
    });

    await movie.save();
    return { status: 'inserted', title: item.name, posterUrl, backdropUrl };
}

// ─── Main ────────────────────────────────────────────────────────────────────────
async function main() {
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║   Đồng bộ phim từ vsmov.com → MongoDB (local img)   ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');
    console.log(`📁 Thư mục ảnh: ${UPLOAD_DIR}\n`);

    await mongoose.connect(process.env.CONNECT_DB || 'mongodb://localhost:27017/movie2');
    console.log('✅ Kết nối MongoDB thành công!\n');

    const categories = await Category.find().lean();
    console.log(`📂 Tìm thấy ${categories.length} thể loại trong DB.\n`);

    let totalInserted = 0;
    let totalSkipped  = 0;
    let totalDeduped  = 0;
    let totalFailed   = 0;

    for (let page = startPage; page < startPage + totalPages; page++) {
        console.log(`\n━━━━━━━━━━━━━━━━━━ Trang ${page} ━━━━━━━━━━━━━━━━━━`);

        let rawItems = [];
        try {
            const result = await fetchPage(page);
            rawItems = result.items;
            console.log(`  📋 Nhận được ${rawItems.length} phim thô (tổng API: ${result.pagination.totalItems || '?'})`);
        } catch (err) {
            console.error(`  ❌ Lỗi gọi API trang ${page}:`, err.message);
            continue;
        }

        // Lọc phim trùng phần
        const items = deduplicateSeries(rawItems);
        const deduped = rawItems.length - items.length;
        if (deduped > 0) {
            console.log(`  🔀 Đã lọc bỏ ${deduped} phim trùng phần → còn ${items.length} phim unique`);
            totalDeduped += deduped;
        }

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const prefix = `  [${String(i + 1).padStart(2)}/${items.length}]`;
            try {
                const result = await processMovie(item, categories, i);
                if (result.status === 'inserted') {
                    const imgStatus = result.posterUrl ? '🖼️' : '⚠️ no-img';
                    console.log(`${prefix} ✅ ${result.title} ${imgStatus}`);
                    totalInserted++;
                } else {
                    console.log(`${prefix} ⏭️  Bỏ qua (đã tồn tại): ${result.title}`);
                    totalSkipped++;
                }
            } catch (err) {
                console.error(`${prefix} ❌ Lỗi: ${item.name} →`, err.message);
                totalFailed++;
            }
        }
    }

    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log(`║  ✅ Thêm mới:        ${String(totalInserted).padEnd(32)}║`);
    console.log(`║  🔀 Lọc trùng phần:  ${String(totalDeduped).padEnd(32)}║`);
    console.log(`║  ⏭️  Bỏ qua (trùng):  ${String(totalSkipped).padEnd(31)}║`);
    console.log(`║  ❌ Lỗi:             ${String(totalFailed).padEnd(32)}║`);
    console.log('╚══════════════════════════════════════════════════════╝');

    await mongoose.connection.close();
    console.log('\n🔌 Đã đóng kết nối MongoDB.');
}

main().catch(err => {
    console.error('💥 Lỗi nghiêm trọng:', err);
    process.exit(1);
});
