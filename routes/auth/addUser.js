const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // JWT kütüphanesini ekleyin
const router = express.Router();
const UserfromModel = require('../../config/models/auth');

// E-posta doğrulama fonksiyonu
function validateEmail(email) {
  const re = /^(([^<>()$$$$\\.,;:\s@"]+(\.[^<>()$$$$\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

/* POST: Kullanıcı Ekleme */
router.post('/addUser', async (req, res) => {
  try {
    // Body'den gelen kullanıcı verilerini al
    const { email, password, isActive } = req.body;

    // Zorunlu alanlar kontrolü
    if (!email || !password) {
      return res.status(400).json({ error: 'E-posta ve şifre alanları zorunludur.' });
    }

    // E-posta formatı doğrulama
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Geçersiz e-posta formatı.' });
    }

    // Şifre uzunluğu kontrolü
    if (password.length < 6) {
      return res.status(400).json({ error: 'Şifre en az 6 karakter olmalıdır.' });
    }

    // E-posta eşsizliği kontrolü
    const existingUser = await UserfromModel.User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Bu e-posta adresi zaten kayıtlı.' });
    }

    // Şifreyi hashle
    const saltRounds = 10; // Salt rounds for bcrypt
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Yeni kullanıcı oluştur ve kaydet
    const newUser = new UserfromModel.User({ email, password: hashedPassword, isActive });
    const savedUser = await newUser.save();

    // JWT oluştur
    const token = jwt.sign(
      { id: savedUser._id, email: savedUser.email },
      'your-secret-key', // Güvenli bir şekilde saklayın
      { expiresIn: '30d' } // Token süresi
    );

    // Başarılı yanıt döndür
    res.status(201).json({
      messageState: true,
      email: savedUser.email,
      isActive: savedUser.isActive,
      token // Token'ı yanıtla birlikte döndür
    });
  } catch (error) {
    console.error('Hata:', error.message);

    // Hata yanıtı
    res.status(500).json({ error: 'Kullanıcı ekleme sırasında bir hata oluştu.' });
  }
});

module.exports = router;