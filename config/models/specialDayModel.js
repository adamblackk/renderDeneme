
const mongoose = require('mongoose');

const specialDaySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {  
    type: String,
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['SPECIAL_DAY', 'ANNOUNCEMENT'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Tarih kontrolü için middleware
specialDaySchema.pre('save', function(next) {
  if (this.startDate >= this.endDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

// İndexler
specialDaySchema.index({ startDate: 1, endDate: 1 });
specialDaySchema.index({ isActive: 1 });

// Dil bazlı modeller
const SpecialDay_tr = mongoose.model('special_days_tr', specialDaySchema);
const SpecialDay_en = mongoose.model('special_days_en', specialDaySchema);
const SpecialDay_es = mongoose.model('special_days_es', specialDaySchema);

module.exports = {
  SpecialDay_tr,
  SpecialDay_en,
  SpecialDay_es
};