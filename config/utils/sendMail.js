const nodemailer = require('nodemailer');

// Transporter yapılandırması
const mailTransporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'admblck50@gmail.com', // Gönderen e-posta adresiniz
    pass: 'lemriqkhazvqmwyo'  // Gmail şifreniz veya uygulama şifreniz
  }
});




// Fonksiyonu çağır
module.exports = { mailTransporter}
