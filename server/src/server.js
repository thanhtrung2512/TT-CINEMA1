require('dotenv').config();

const express = require('express');
const http = require('http');
const app = express();
const port = 3000;

const connectDB = require('./config/connectDB');
const routes = require('./routes/index.routes');
const { initSocket } = require('./config/socket');

const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
connectDB();

// Khởi động các Cron Jobs
require('./cron/booking.cron');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({ origin: process.env.URL_CLIENT, credentials: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

routes(app);

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Lỗi server',
    });
});

// Tạo HTTP server và khởi động Socket.IO
const httpServer = http.createServer(app);
initSocket(httpServer, process.env.URL_CLIENT);

httpServer.listen(port, () => {
    console.log(`Server running on port ${port} (HTTP + Socket.IO)`);
});
