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

   const mailOptions = {
  from: '"StoryLives Support" <storylivesapp@gmail.com>',
  to: email,
  subject: 'Your Password Reset Code for StoryLives',
  text: `
Hi,

We received a request to reset your password for your StoryLives account.
Your reset code is: ${resetCode}

If you did not request this, please disregard this email.

Thank you,
The StoryLives Team
`,
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
        <h2 style="color:#2c3e50;">StoryLives Password Reset</h2>
        <p>Hello,</p>
        <p>We received a request to reset the password associated with this email address.</p>
        <p>Your reset code is:</p>
        <p style="font-size: 24px; font-weight: bold; color: #007bff; background: #e6f0ff; padding: 10px 15px; border-radius: 6px; display: inline-block;">
          ${resetCode}
        </p>
        <p style="margin-top:20px;">If you didn’t request a password reset, you can safely ignore this email — no changes have been made to your account.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ccc;">
        <p style="font-size: 13px; color: #999;">
          This email was sent by StoryLives because a password reset request was made. Do not reply to this message.
        </p>
    </div>
  `
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
