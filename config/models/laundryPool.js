const mongoose = require('mongoose');

// Kullanıcı Şeması
const LaundryPoolSchema = new mongoose.Schema({
    IslemID: {
      type: Number,
      required: true,
      unique: true // Ensures each IslemID is unique
    },
    CikisTarihi: {
      type: String,
      required: true
    },
    DonusTarihi: {
      type: String
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
const LaundryPoolModel = mongoose.model('laundryPool', LaundryPoolSchema,'laundryPool');

module.exports = {LaundryPoolModel};
