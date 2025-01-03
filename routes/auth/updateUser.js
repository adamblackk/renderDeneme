const express = require('express');
const router = express.Router();
const UserfromModel = require('../../config/models/auth');

// E-posta doğrulama fonksiyonu
function validateEmail(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

/* PUT: Kullanıcı isActive Durumunu Güncelle */
router.put('/updateUser', async (req, res) => {
  try {
    const { email, isActive } = req.body;

    // E-posta kontrolü
    if (!email) {
      return res.status(400).json({ error: 'E-posta alanı zorunludur.' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Geçersiz e-posta formatı.' });
    }

    // isActive kontrolü
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive alanı boolean olmalıdır.' });
    }

    // Kullanıcıyı bul ve isActive durumunu güncelle
    const updatedUser = await UserfromModel.User.findOneAndUpdate(
      { email },               // Şart: E-posta eşleşmesi
      { $set: { isActive } },  // Güncellenecek alan
      { new: true }            // Güncellenmiş dökümana ihtiyaç
    );

    // Kullanıcı bulunamazsa
    if (!updatedUser) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    // Başarılı yanıt
    res.status(200).json({
      message: `Kullanıcı isActive durumu başarıyla ${isActive ? 'true' : 'false'} olarak güncellendi.`,
      
    });
  } catch (error) {
    console.error('Hata:', error.message);

    // Hata yanıtı
    res.status(500).json({ error: 'Kullanıcı güncelleme sırasında bir hata oluştu.' });
  }
});

module.exports = router;
