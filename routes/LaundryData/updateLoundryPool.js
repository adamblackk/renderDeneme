var express = require('express');
var router = express.Router();
const LaundryDataFromModel = require('../../config/models/laundryDataModel')
const LaundryPoolFromModel = require('../../config/models/laundryPool')



router.post('/updateLaundryData', async (req, res) => {
  try {
    // İstek gövdesinden tarih dizisini al
    const { dateArray } = req.body;

    // Tarih dizisi kontrolü
    if (!dateArray || !Array.isArray(dateArray) || dateArray.length === 0) {
      return res.status(400).json({ error: 'Geçerli bir tarih dizisi sağlanmalıdır.' });
    }

   // Tarih formatının doğru şekilde olduğundan emin olmak için bir kontrol
   const formattedDates = dateArray.map(date => {
    if (isNaN(Date.parse(date))) {
      throw new Error(`Geçersiz tarih formatı: ${date}`);
    }
    return new Date(date); // MongoDB'deki Date nesnesine uygun hale getir
  });
    // Kaynak modelden Çıkış Tarihine (`CikisTarihi`) göre veri al
    const filteredData = await LaundryDataFromModel.LaundryModel.find({
      CikisTarihi: {
        $in: dateArray
      }
    }).select('-_id -__v'); // `_id` ve `__v` alanlarını hariç tut
    console.log(dateArray)
    console.log(filteredData)
    
    // Eğer veri yoksa, uyarı gönder
    if (filteredData.length === 0) {
      return res.status(404).json({ message: 'Belirtilen tarihlerde veri bulunamadı.' });
    }

    // Hedef modeli temizle
    await LaundryPoolFromModel.LaundryPoolModel.deleteMany();

    // Yeni verileri hedef modele ekle
    await LaundryPoolFromModel.LaundryPoolModel.insertMany(filteredData);
    

    // İşlem tamamlandı mesajı döndür
    res.status(200).json({
      message: 'Hedef model başarıyla güncellendi.',
      addedCount: filteredData.length,
    });
  } catch (error) {
    console.error('Hata:', error.message);
    res.status(500).json({ error: 'Veri güncellenirken bir hata oluştu.' });
  }
});
  module.exports = router;