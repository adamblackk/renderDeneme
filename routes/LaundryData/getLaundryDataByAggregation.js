var express = require('express');
var router = express.Router();
const LaundryDataFromModel = require('../../config/models/laundryDataModel')

router.get('/getLaundryDataByAggregation', async (req, res) => {
  try {
    // Aggregation Pipeline
    const aggregatedData = await LaundryDataFromModel.LaundryModel.aggregate([
      {
        $group: {
          _id: "$CamasirTuru", // Çamaşır türüne göre gruplama
          totalSent: { $sum: "$Adet" }, // Gönderilen toplam miktar
          totalReturned: {
            $sum: {
              $cond: [{ $eq: ["$Durum", "Dondu"] }, "$Adet", 0] // Sadece "Dondu" durumundakiler
            }
          }
        }
      },
      {
        $project: {
          _id: 0, // `_id` alanını hariç tut
          CamasirTuru: "$_id",
          totalSent: 1,
          totalReturned: 1,
          missing: { $subtract: ["$totalSent", "$totalReturned"] } // Eksik miktar
        }
      },
      { $match: { missing: { $gt: 0 } } } // Sadece eksik miktarı 0'dan büyük olanlar
    ]);

    res.status(200).json(aggregatedData); // JSON formatında döndür
  } catch (error) {
    console.error('Hata:', error.message);
    res.status(500).json({ error: 'Veri alınırken bir hata oluştu.' });
  }
});

module.exports = router;
