var express = require('express');
var router = express.Router();
const LaundryDataFromModel = require('../../config/models/laundryDataModel')

router.get('/getLaundryData', async (req, res) => {
  try {
    // Veritabanından tüm kullanıcıları al ve `_id` ile `__v` alanlarını hariç tut
    const users = await LaundryDataFromModel.LaundryModel.find().select('-_id -__v'); // `_id` ve `__v` hariç

    res.status(200).json(users); // JSON formatında döndür
  } catch (error) {
    console.error('Hata:', error.message);
    res.status(500).json({ error: 'Data bilgileri alınırken bir hata oluştu.' });
  }
});


// Data tarihlerini String formatına dönüştürmek için kullandım....
router.put('/updateLaundryDates', async (req, res) => {
  try {
    // Veritabanındaki tüm kayıtları al
    const users = await LaundryDataFromModel.LaundryModel.find();

    // Her bir kayıt için tarihleri güncelle
    for (const user of users) {
      const updates = {};

      // Çıkış Tarihi Güncellemesi
      if (user.CikisTarihi) {
        const cikisTarihi = new Date(user.CikisTarihi);
        const year = cikisTarihi.getFullYear();
        const month = String(cikisTarihi.getMonth() + 1).padStart(2, '0');
        const day = String(cikisTarihi.getDate()).padStart(2, '0');
        updates.CikisTarihi = `${year}-${month}-${day}`;
      }

      // Dönüş Tarihi Güncellemesi
      if (user.DonusTarihi) {
        const donusTarihi = new Date(user.DonusTarihi);
        const year = donusTarihi.getFullYear();
        const month = String(donusTarihi.getMonth() + 1).padStart(2, '0');
        const day = String(donusTarihi.getDate()).padStart(2, '0');
        updates.DonusTarihi = `${year}-${month}-${day}`;
      }

      // Veritabanında güncelleme
      await LaundryDataFromModel.LaundryModel.updateOne(
        { _id: user._id }, // Güncellenecek kaydın filtresi
        { $set: updates }  // Güncelleme işlemi
      );
    }

    res.status(200).json({ message: 'Tüm kayıtlar başarıyla güncellendi.' });
  } catch (error) {
    console.error('Hata:', error.message);
    res.status(500).json({ error: 'Tarih güncellenirken bir hata oluştu.' });
  }
});




module.exports = router;
