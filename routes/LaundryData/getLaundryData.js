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

module.exports = router;
