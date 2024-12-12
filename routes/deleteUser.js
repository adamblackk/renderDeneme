const express = require('express');
const router = express.Router();
const UserfromModel = require('../config/models/auth')


router.delete('/deleteUser', async (req, res) => {
    try {
      const { email } = req.body; // Silinecek kullanıcının email bilgisi
  
      // Kullanıcıyı sil
      const result = await UserfromModel.User.deleteOne({ email: email });
  
      // Eğer hiçbir kullanıcı bulunamazsa
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
      }
  
      // Başarılı yanıt
      res.status(200).json({ message: 'Kullanıcı başarıyla silindi.' });
    } catch (error) {
      console.error('Hata:', error.message);
  
      // Hata yanıtı
      res.status(500).json({ error: 'Kullanıcı silme sırasında bir hata oluştu.' });
    }
  });

  module.exports = router;
  