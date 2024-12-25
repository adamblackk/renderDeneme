const mongoose = require('mongoose');

// Kullanıcı Şeması
const LaundrySchema = new mongoose.Schema({
    IslemID: {
      type: Number,
      required: true,
      unique: true // Ensures each IslemID is unique
    },
    CikisTarihi: {
      type: Date,
      required: true
    },
    DonusTarihi: {
      type: Date
    },
    OtelAdi: {
      type: String,
      required: true
    },
    CamasirTuru: {
      type: String,
      required: true
    },
    Adet: {
      type: Number,
      required: true
    },
    Durum: {
      type: String,
      required: true
    },
    EtiketID: {
      type: String,
      required: true
    },
    YikamaSirketi: {
      type: String,
      required: true
    }
  });

// Kullanıcı Modeli
const LaundryModel = mongoose.model('laundryData', LaundrySchema,'laundryData');

module.exports = {LaundryModel};
