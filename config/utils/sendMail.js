const nodemailer = require('nodemailer');
require('dotenv').config();

// Transporter yapılandırması
const mailTransporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER, // Gönderen e-posta adresiniz
    pass: process.env.EMAIL_PASS  // Gmail şifreniz veya uygulama şifreniz
  }
});




// Fonksiyonu çağır
module.exports = { mailTransporter}
