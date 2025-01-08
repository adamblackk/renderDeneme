const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const UserfromModel = require('../../config/models/auth');

// E-posta doğrulama fonksiyonu
function validateEmail(email) {
  const re = /^(([^<>()$$$$\\.,;:\s@"]+(\.[^<>()$$$$\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

/* POST: Kullanıcı Giriş */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Zorunlu alanlar kontrolü
    if (!email || !password) {
      return res.status(400).json({ error: 'E-posta ve şifre alanları zorunludur.' });
    }

    // E-posta formatı doğrulama
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Geçersiz e-posta formatı.' });
    }

    // E-posta ile kullanıcıyı bul
    const user = await UserfromModel.User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Geçersiz e-posta veya şifre.' });
    }

    // Şifre karşılaştırması
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Geçersiz e-posta veya şifre.' });
    }

    // Başarılı yanıt döndür
    res.status(200).json({
      loginState: true,
      email:email,
    });
  } catch (error) {
    console.error('Hata:', error.message);

    // Hata yanıtı
    res.status(500).json({ error: 'Giriş sırasında bir hata oluştu.' });
  }
});

module.exports = router;