const mongoose = require("mongoose");

// --- Skema RawData ---
const RawDataSchema = new mongoose.Schema(
  {
    // Field 'timestamp' manual DIHAPUS dari sini
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
  },
  {
    // TAMBAHKAN INI: Mongoose akan otomatis membuat field 'timestamp' saat data dibuat
    timestamps: { createdAt: "timestamp", updatedAt: false },
  }
);

// --- Skema CalibratedData ---
const CalibratedDataSchema = new mongoose.Schema(
  {
    // Field 'timestamp' manual DIHAPUS dari sini
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
  },
  {
    // TAMBAHKAN INI: Mongoose akan otomatis membuat field 'timestamp' saat data dibuat
    timestamps: { createdAt: "timestamp", updatedAt: false },
  }
);

// --- Skema Recommendation ---
const RecommendationSchema = new mongoose.Schema(
  {
    // Field 'timestamp' manual DIHAPUS dari sini
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
    conversion_results: {
      status_p: { type: String },
      status_k: { type: String },
      p2o5: { type: Number },
      k2o: { type: Number },
    },
  },
  {
    // TAMBAHKAN INI: Mongoose akan otomatis membuat field 'timestamp' saat data dibuat
    timestamps: { createdAt: "timestamp", updatedAt: false },
  }
);

// --- Skema ManualData ---
const ManualDataSchema = new mongoose.Schema(
  {
    // Field 'timestamp' manual DIHAPUS dari sini
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
  },
  {
    // TAMBAHKAN INI: Mongoose akan otomatis membuat field 'timestamp' saat data dibuat
    timestamps: { createdAt: "timestamp", updatedAt: false },
  }
);

module.exports = {
  RawData: mongoose.model("RawData", RawDataSchema),
  CalibratedData: mongoose.model("CalibratedData", CalibratedDataSchema),
  Recommendation: mongoose.model("Recommendation", RecommendationSchema),
  ManualData: mongoose.model("ManualData", ManualDataSchema),
};
