const mongoose = require("mongoose");

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
      max: 100,
    },
    P: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    K: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    EC: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
  },
});

const RecommendationSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
  },
  input: {
    pH: {
      type: Number,
      required: true,
    },
    N: {
      type: Number,
      required: true,
    },
    K: {
      type: Number,
      required: true,
    },
  },
  recommendation: {
    urea: {
      type: Number,
      required: true,
    },
    sp36: {
      type: Number,
      required: true,
    },
    kcl: {
      type: Number,
      required: true,
    },
  },
});

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
    pH: {
      type: Number,
      min: 0,
      max: 14,
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
