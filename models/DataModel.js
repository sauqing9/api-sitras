const mongoose = require("mongoose");

// Skema RawData (Tidak Berubah)
const RawDataSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
  },
  variables: {
    pH: {
      type: Number,
      required: true,
      min: 0,
      max: 14,
    },
    suhu: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    kelembaban: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    N: {
      type: Number,
      required: true,
      min: 0,
      max: 1000,
    },
    P: {
      type: Number,
      required: true,
      min: 0,
      max: 1000,
    },
    K: {
      type: Number,
      required: true,
      min: 0,
      max: 1000,
    },
    EC: {
      type: Number,
      required: true,
      min: 0,
      max: 2000,
    },
  },
});

// Skema CalibratedData (Tidak Berubah)
const CalibratedDataSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
  },
  variables: {
    pH: {
      type: Number,
      required: true,
      min: 0,
      max: 14,
    },
    suhu: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    kelembaban: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    N: {
      type: Number,
      required: true,
      min: 0,
      max: 1000,
    },
    P: {
      type: Number,
      required: true,
      min: 0,
      max: 1000,
    },
    K: {
      type: Number,
      required: true,
      min: 0,
      max: 1000,
    },
    EC: {
      type: Number,
      required: true,
      min: 0,
      max: 2000,
    },
  },
});

// --- PERUBAHAN PADA RecommendationSchema ---
const RecommendationSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
  },
  input: {
    P: { type: Number, required: true },
    N: { type: Number, required: true },
    K: { type: Number, required: true },
    jenis_tanaman: { type: String, required: true, default: "Padi" },
    target_padi: { type: Number, required: true, enum: [1, 2, 3, 4], default: 4 },
  },
  recommendation: {
    urea: { type: Number, required: true },
    sp36: { type: Number, required: true },
    kcl: { type: Number, required: true },
  },
  reasons: {
    info: { type: String },
  },
  tips: {
    type: String,
  },
  // --- TAMBAHAN BARU ---
  // Menyimpan hasil konversi P/K dari ML API
  conversion_results: {
    status_p: { type: String },
    status_k: { type: String },
    p2o5: { type: Number },
    k2o: { type: Number },
  },
});

// Skema ManualData (Tidak Berubah)
const ManualDataSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    enum: ["text", "file"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    default: null,
  },
  fileType: {
    type: String,
    default: null,
  },
  extractedData: {
    P: {
      type: Number,
      min: 0,
      max: 100,
    },
    N: {
      type: Number,
      min: 0,
      max: 100,
    },
    K: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  aiAnalysis: {
    type: String,
    default: null,
  },
});

module.exports = {
  RawData: mongoose.model("RawData", RawDataSchema),
  CalibratedData: mongoose.model("CalibratedData", CalibratedDataSchema),
  Recommendation: mongoose.model("Recommendation", RecommendationSchema),
  ManualData: mongoose.model("ManualData", ManualDataSchema),
};
