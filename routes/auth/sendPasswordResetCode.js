const express = require('express');
const router = express.Router();
const sendMail = require('../../config/utils/sendMail'); 
const UserfromModel = require('../../config/models/auth');
const TempPasswordResetCodeFromModel = require('../../config/models/tempPasswordResetCodeModel')



// E-posta doğrulama fonksiyonu
function validateEmail(email) {
    const re = /^(([^<>()$$$$\\.,;:\s@"]+(\.[^<>()$$$$\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }


router.post('/sendResetCode', async (req, res) => {
    const { email } = req.body;

    // E-posta adresinin geçerli olup olmadığını kontrol et
    if (!email || !validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email address' });
    }

    // Kullanıcının var olup olmadığını kontrol et
    const user = await UserfromModel.User.findOne({ email });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    // 6 haneli rastgele bir doğrulama kodu oluştur
    const resetCode = Math.floor(100000 + Math.random() * 900000);

    // Kodun süresini belirle (ör. 10 dakika)
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    // Kod ve süreyi veritabanına kaydet
    await TempPasswordResetCodeFromModel.updateOne(
        { email },
        { $set: { resetCode, expiry } },
        { upsert: true } // Kayıt yoksa oluştur
    );

    // E-posta ile doğrulama kodunu gönder
    const mailOptions = {
        from: 'admblck50@gmail.com',
        to: email,
        subject: 'Password Reset Code',
        text: `Your password reset code is: ${resetCode}`,
        html: `<p>Your password reset code is: <b>${resetCode}</b></p>`
    };

    try {
        await sendMail.mailTransporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Reset code sent to email' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});


module.exports = router
