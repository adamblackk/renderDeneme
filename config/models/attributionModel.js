
const mongoose = require('mongoose');

const attributionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  originalAuthor: { type: String, required: true },
  sourcePlatform: { type: String, required: true },
  sourceTitle: { type: String, required: true },
  sourceUrl: { type: String },
  licenseName: { type: String, required: true },
  licenseShort: { type: String },
  licenseUrl: { type: String },
  modifiedFromOriginal: { type: Boolean, default: false },
  description: { type: String }  // ✅ yeni alan
});


module.exports = mongoose.model('Attribution', attributionSchema);
