const nodemailer = require('nodemailer');
const dayjs = require('dayjs');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

function generateTicketEmailHTML(booking) {
    const showtime = booking.showtimeId;
    const movie = showtime?.movieId;
    const room = showtime?.roomId;
    const cinema = room?.cinemaId;
    const voucher = booking.voucherId;
    const user = booking.userId;

    const payMethodLabel = { Momo: 'Ví điện tử MoMo', VNPay: 'VNPay / ATM', Cash: 'Tiền mặt tại quầy' };

    const servicesHTML = (booking.services || [])
        .filter(s => s.quantity > 0 && s.serviceId)
        .map(s => `<tr>
            <td style="padding:6px 0;color:#ccc;">${s.serviceId.name}</td>
            <td style="padding:6px 0;color:#ccc;text-align:right;">x${s.quantity} — ${(s.serviceId.price * s.quantity).toLocaleString('vi-VN')}đ</td>
        </tr>`).join('');

    return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#111;border-radius:16px;overflow:hidden;border:1px solid #222;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#E50914,#8b0000);padding:32px;text-align:center;">
      <div style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-1px;">TT <span style="color:rgba(255,255,255,0.7)">CINEMA</span></div>
      <div style="color:rgba(255,255,255,0.8);font-size:14px;margin-top:6px;">Xác nhận đặt vé thành công 🎉</div>
    </div>

    <!-- Greeting -->
    <div style="padding:28px 32px 0;">
      <p style="color:#eee;font-size:16px;margin:0;">Xin chào <strong style="color:#fff;">${user?.fullName || 'Quý khách'}</strong>,</p>
      <p style="color:#aaa;font-size:14px;margin-top:8px;">Vé xem phim của bạn đã được đặt thành công. Vui lòng lưu thông tin bên dưới.</p>
    </div>

    <!-- Movie Info -->
    <div style="margin:24px 32px;background:#1a1a1a;border-radius:12px;overflow:hidden;border:1px solid #2a2a2a;">
      <div style="background:#1a1a1a;padding:20px 24px;border-bottom:1px dashed #333;">
        <div style="color:#E50914;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">🎬 Phim</div>
        <div style="color:#fff;font-size:22px;font-weight:900;">${movie?.title || 'N/A'}</div>
        <div style="color:#888;font-size:13px;margin-top:8px;">
          📍 ${cinema?.name || ''} — ${room?.name || ''}<br>
          🕐 ${dayjs(showtime?.startTime).format('HH:mm — dddd, DD/MM/YYYY')}
        </div>
      </div>

      <div style="padding:20px 24px;border-bottom:1px dashed #333;">
        <div style="color:#E50914;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">💺 Ghế đã đặt</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${(booking.seats || []).map(s => `<span style="background:#E50914;color:#fff;padding:4px 12px;border-radius:6px;font-weight:700;font-family:monospace;font-size:14px;">${s}</span>`).join('')}
        </div>
      </div>

      ${servicesHTML ? `
      <div style="padding:20px 24px;border-bottom:1px dashed #333;">
        <div style="color:#E50914;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">☕ Dịch vụ đi kèm</div>
        <table style="width:100%;border-collapse:collapse;">${servicesHTML}</table>
      </div>` : ''}

      <div style="padding:20px 24px;">
        <table style="width:100%;border-collapse:collapse;">
          ${voucher && booking.discountAmount > 0 ? `
          <tr>
            <td style="padding:4px 0;color:#aaa;font-size:13px;">Mã giảm giá (${voucher.code})</td>
            <td style="padding:4px 0;color:#4ade80;text-align:right;font-size:13px;">- ${booking.discountAmount.toLocaleString('vi-VN')}đ</td>
          </tr>` : ''}
          <tr>
            <td style="padding:4px 0;color:#aaa;font-size:13px;">Phương thức thanh toán</td>
            <td style="padding:4px 0;color:#ccc;text-align:right;font-size:13px;">${payMethodLabel[booking.paymentMethod] || booking.paymentMethod}</td>
          </tr>
          <tr style="border-top:1px solid #333;">
            <td style="padding:12px 0 4px;color:#fff;font-weight:700;font-size:16px;">Tổng đã thanh toán</td>
            <td style="padding:12px 0 4px;color:#E50914;font-weight:900;font-size:22px;text-align:right;">${(booking.totalPrice || 0).toLocaleString('vi-VN')}đ</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Booking ID -->
    <div style="margin:0 32px 24px;padding:16px;background:#0a0a0a;border-radius:8px;border:1px solid #222;text-align:center;">
      <div style="color:#666;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">Mã đặt vé</div>
      <div style="color:#E50914;font-family:monospace;font-size:14px;font-weight:700;">${booking._id}</div>
    </div>

    <!-- Footer -->
    <div style="padding:24px 32px;text-align:center;border-top:1px solid #222;">
      <p style="color:#555;font-size:12px;margin:0;">Cảm ơn bạn đã chọn TT CINEMA. Chúc bạn xem phim vui vẻ! 🍿</p>
      <p style="color:#444;font-size:11px;margin-top:8px;">© 2026 TT CINEMA. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

async function sendBookingConfirmationEmail(booking) {
    const user = booking.userId;
    if (!user?.email) return; // Không có email thì bỏ qua

    const movie = booking.showtimeId?.movieId;
    const subject = `🎬 TT CINEMA — Đặt vé "${movie?.title || 'Xem phim'}" thành công!`;

    try {
        await transporter.sendMail({
            from: `"TT CINEMA" <${process.env.FROM_EMAIL}>`,
            to: user.email,
            subject,
            html: generateTicketEmailHTML(booking),
        });
        console.log(`✅ Đã gửi email xác nhận tới ${user.email}`);
    } catch (error) {
        // Không throw để không ảnh hưởng đến luồng thanh toán
        console.error('❌ Gửi email thất bại:', error.message);
    }
}

module.exports = { sendBookingConfirmationEmail };
