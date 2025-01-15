const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const UserfromModel = require('../../config/models/auth'); // Kullanıcı modeli


// E-posta doğrulama fonksiyonu
function validateEmail(email) {
    const re = /^(([^<>()$$$$\\.,;:\s@"]+(\.[^<>()$$$$\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }
/* POST: Şifre Yenileme */
router.post('/refreshPassword', async (req, res) => {
  try {
    // İstekten gelen e-posta ve yeni şifre
    const { email, newPassword } = req.body;

    // 1. Zorunlu alanların kontrolü
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'E-posta ve yeni şifre alanları zorunludur.' });
    }

    // 2. E-posta formatını kontrol et
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Geçersiz e-posta formatı.' });
    }

    // 3. Şifre uzunluğu ve karmaşıklık kontrolü
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Şifre en az 6 karakter olmalıdır.' });
    }


    // 4. Kullanıcının var olup olmadığını kontrol et
    const user = await UserfromModel.User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    // 5. Şifreyi hashle
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 6. Kullanıcının şifresini güncelle
    user.password = hashedPassword;
    await user.save();

    // 7. Başarılı yanıt döndür
    res.status(200).json({ 
      message: 'Şifreniz başarıyla yenilendi. Yeni şifrenizle giriş yapabilirsiniz.' 
    });
  } catch (error) {
    console.error('Hata:', error.message);

    // Hata durumunda yanıt döndür
    res.status(500).json({ error: 'Şifre yenileme sırasında bir hata oluştu.' });
  }
});



module.exports = router;
