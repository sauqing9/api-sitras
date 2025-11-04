const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const axios = require("axios");
const {
  RawData,
  CalibratedData,
  Recommendation,
  ManualData,
} = require("./models/DataModel"); // Pastikan DataModel.js sudah diupdate

const app = express();
const PORT = process.env.PORT || 3001;

// --- URL API ML DIPERBARUI ---
// URL untuk Model 1 (Kalibrasi)
const ML_KALIBRASI_API_URL = "https://sauqing.pythonanywhere.com/predict";
// URL untuk Model 2 (Rekomendasi K-NN) - Ganti dengan URL Hugging Face/Render Anda
const ML_REKOMENDASI_API_URL = "https://sauqing-api-ml-sitras.hf.space/predict_rekomendasi";


// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://bimapopo81:Bima1234@sinau.q23pt.mongodb.net/pupuk-sdlp"
  )
  .then(() => {
    console.log("MongoDB connected to pupuk-sdlp database");
  })
  .catch((err) => console.log("MongoDB connection error:", err));

// Helper function to get WIB time
const getWIBTime = () => {
  const now = new Date();
  const wibTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return wibTime.toISOString();
};

// --- Helper function untuk konversi target_padi (TETAP) ---
const convertTargetPadi = (targetString) => {
  switch (targetString) {
    case "<6":
      return 1;
    case "6-8":
      return 2;
    case ">8":
      return 3;
    case "N/A":
    default:
      return 4;
  }
};

// API Routes

// Raw Data Endpoints
app.post("/api/data/raw", async (req, res) => {
  try {
    const dataWithTimestamp = { ...req.body, timestamp: getWIBTime() };
    const rawData = new RawData(dataWithTimestamp);
    await rawData.save();

    // --- INTEGRASI ML (MODEL 1: KALIBRASI) ---
    try {
      console.log("Data mentah disimpan. Memulai proses kalibrasi ML...");
      const rawVars = rawData.variables;
      const dataForML = {
        pH: rawVars.pH,
        N: rawVars.N,
        P: rawVars.P,
        K: rawVars.K,
      };
      
      const mlResponse = await axios.post(ML_KALIBRASI_API_URL, dataForML, {
        timeout: 5000,
      });

      const calibratedValues = mlResponse.data;
      console.log("Hasil kalibrasi ML diterima:", calibratedValues);

      const calibratedData = new CalibratedData({
        timestamp: rawData.timestamp,
        variables: {
          pH: calibratedValues.pH_calibrated,
          N: calibratedValues.N_calibrated,
          P: calibratedValues.P_calibrated,
          K: calibratedValues.K_calibrated,
          suhu: rawVars.suhu,
          kelembaban: rawVars.kelembaban,
          EC: rawVars.EC,
        },
      });

      await calibratedData.save();
      console.log("Data terkalibrasi berhasil disimpan ke database.");
    } catch (mlError) {
      console.error(
        `PERINGATAN: Gagal melakukan kalibrasi ML: ${mlError.message}`
      );
    }
    
    res.status(201).json({
      success: true,
      message: "Raw data saved successfully (calibration triggered)",
      data: rawData,
    });
  } catch (error) {
    console.error("Error fatal saat menyimpan data mentah:", error.message);
    res.status(400).json({
      success: false,
      message: "Error saving raw data",
      error: error.message,
    });
  }
});

app.get("/api/data/raw", async (req, res) => {
  try {
    const rawData = await RawData.findOne().sort({ timestamp: -1 });
    if (!rawData) {
      return res.status(404).json({
        success: false,
        message: "No raw data found",
      });
    }
    res.json({
      success: true,
      data: rawData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching raw data",
      error: error.message,
    });
  }
});

// ... (Endpoint GET /history, DELETE /:id, DELETE / lainnya tetap sama) ...
app.get("/api/data/raw/history", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const rawData = await RawData.find().sort({ timestamp: -1 }).limit(limit);
    res.json({
      success: true,
      data: rawData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching raw data history",
      error: error.message,
    });
  }
});
app.delete("/api/data/raw/:id", async (req, res) => {
  try {
    const rawData = await RawData.findByIdAndDelete(req.params.id);
    if (!rawData) {
      return res.status(404).json({
        success: false,
        message: "Raw data not found",
      });
    }
    res.json({
      success: true,
      message: "Raw data deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting raw data",
      error: error.message,
    });
  }
});
app.delete("/api/data/raw", async (req, res) => {
  try {
    await RawData.deleteMany({});
    res.json({
      success: true,
      message: "All raw data deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting all raw data",
      error: error.message,
    });
  }
});

// Calibrated Data Endpoints
app.post("/api/data/calibrated", async (req, res) => {
  try {
    const dataWithTimestamp = {
      ...req.body,
      timestamp: getWIBTime(),
    };
    const calibratedData = new CalibratedData(dataWithTimestamp);
    await calibratedData.save();
    res.status(201).json({
      success: true,
      message: "Calibrated data saved successfully",
      data: calibratedData,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error saving calibrated data",
      error: error.message,
    });
  }
});

app.get("/api/data/calibrated", async (req, res) => {
  try {
    const calibratedData = await CalibratedData.findOne().sort({
      timestamp: -1,
    });
    if (!calibratedData) {
      return res.status(404).json({
        success: false,
        message: "No calibrated data found",
      });
    }
    res.json({
      success: true,
      data: calibratedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching calibrated data",
      error: error.message,
    });
  }
});

app.get("/api/data/calibrated/history", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const calibratedData = await CalibratedData.find()
      .sort({ timestamp: -1 })
      .limit(limit);
    res.json({
      success: true,
      data: calibratedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching calibrated data history",
      error: error.message,
    });
  }
});

app.delete("/api/data/calibrated/:id", async (req, res) => {
  try {
    const calibratedData = await CalibratedData.findByIdAndDelete(
      req.params.id
    );
    if (!calibratedData) {
      return res.status(404).json({
        success: false,
        message: "Calibrated data not found",
      });
    }
    res.json({
      success: true,
      message: "Calibrated data deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting calibrated data",
      error: error.message,
    });
  }
});
app.delete("/api/data/calibrated", async (req, res) => {
  try {
    await CalibratedData.deleteMany({});
    res.json({
      success: true,
      message: "All calibrated data deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting all calibrated data",
      error: error.message,
    });
  }
});

// Recommendation Endpoints

// --- PERBAIKAN: ENDPOINT BARU UNTUK TAB INPUT ---
// Hanya memanggil ML API dan mengembalikan hasilnya, tidak menyimpan ke DB.
// (Penyimpanan ditangani oleh /api/recommendation/ml)
app.post("/api/recommendation/input", async (req, res) => {
  try {
    const payloadForML = req.body; // P, N, K, jenis_tanaman, target_padi

    console.log("Menerima request /input, memanggil ML API Rekomendasi...");
    const mlResponse = await axios.post(ML_REKOMENDASI_API_URL, payloadForML, {
      timeout: 5000 
    });

    if (!mlResponse.data || !mlResponse.data.success) {
      throw new Error("ML API call was not successful or returned no data");
    }
    
    // Langsung teruskan respons dari ML API (yang berisi { success: true, data: {...} })
    res.json(mlResponse.data);

  } catch (error) {
    console.error("Error in /recommendation/input:", error.message);
    res.status(400).json({
      success: false,
      message: "Error calling ML recommendation engine",
      error: error.message,
    });
  }
});


// --- PERBAIKAN: ENDPOINT INI MEMANGGIL ML API & MENYIMPAN ---
// (Dipanggil oleh Dashboard & tab Rekomendasi Data)
app.post("/api/recommendation", async (req, res) => {
  try {
    const { P, N, K, jenis_tanaman, target_padi } = req.body;

    const payloadForML = {
      P: parseFloat(P),
      N: parseFloat(N),
      K: parseFloat(K),
      jenis_tanaman: jenis_tanaman,
      target_padi: target_padi,
    };

    console.log("Menerima request /recommendation, memanggil ML API...");
    const mlResponse = await axios.post(ML_REKOMENDASI_API_URL, payloadForML, {
      timeout: 5000 
    });

    if (!mlResponse.data || !mlResponse.data.success) {
      throw new Error("ML API call was not successful");
    }
    
    // Ambil data dari ML API
    const { recommendations, reasons, tips, conversion_results } = mlResponse.data.data;
    
    const convertedTargetPadi = convertTargetPadi(target_padi);

    const recommendationData = new Recommendation({
      input: {
        P: parseFloat(P),
        N: parseFloat(N),
        K: parseFloat(K),
        jenis_tanaman: jenis_tanaman,
        target_padi: convertedTargetPadi,
      },
      recommendation: recommendations,
      reasons,
      tips,
      conversion_results, // <-- SIMPAN HASIL KONVERSI
      timestamp: getWIBTime(),
    });

    await recommendationData.save();

    // Kembalikan data yang dibutuhkan frontend
    res.json({
      success: true,
      message: "Recommendation generated and saved successfully",
      data: {
        recommendation: recommendations,
        timestamp: recommendationData.timestamp,
        conversion_results: conversion_results // <-- KIRIM HASIL KONVERSI
      },
    });
  } catch (error) {
    console.error("Error generating ML recommendation:", error.message);
    res.status(400).json({
      success: false,
      message: "Error generating ML recommendation",
      error: error.message,
    });
  }
});

app.get("/api/recommendation/history", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const recommendations = await Recommendation.find()
      .sort({ timestamp: -1 })
      .limit(limit);
    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching recommendation history",
      error: error.message,
    });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// Get latest calibrated data for auto-populate
app.get("/api/latest/calibrated", async (req, res) => {
  try {
    const latestData = await CalibratedData.findOne().sort({ timestamp: -1 });
    if (!latestData) {
      return res.status(404).json({
        success: false,
        message: "No calibrated data found",
      });
    }
    res.json({
      success: true,
      data: {
        P: latestData.variables.P,
        N: latestData.variables.N,
        K: latestData.variables.K,
        timestamp: latestData.timestamp,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching latest calibrated data",
      error: error.message,
    });
  }
});

// Manual Data Endpoints
app.post("/api/data/manual", async (req, res) => {
  try {
    const dataWithTimestamp = {
      ...req.body,
      timestamp: getWIBTime(),
    };
    const manualData = new ManualData(dataWithTimestamp);
    await manualData.save();
    res.status(201).json({
      success: true,
      message: "Manual data saved successfully",
      data: manualData,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error saving manual data",
      error: error.message,
    });
  }
});

app.get("/api/data/manual", async (req, res) => {
  try {
    const manualData = await ManualData.findOne({
      extractedData: { $exists: true },
    }).sort({ timestamp: -1 });

    if (!manualData || !manualData.extractedData) {
      return res.status(404).json({
        success: false,
        message: "No manual data found with extracted values",
      });
    }
    res.json({
      success: true,
      data: {
        P: manualData.extractedData.P,
        N: manualData.extractedData.N,
        K: manualData.extractedData.K,
        timestamp: manualData.timestamp,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching manual data",
      error: error.message,
    });
  }
});

// --- PERBAIKAN: Endpoint /ml UNTUK MENYIMPAN DATA DARI TAB INPUT ---
app.post("/api/recommendation/ml", async (req, res) => {
  try {
    // Data ini dikirim dari 'getMlRecommendation' di frontend
    const { input, recommendations, reasons, tips, conversion_results } = req.body;

    if (!input || typeof input.target_padi === "undefined") {
      return res.status(400).json({
        success: false,
        message: "Input data is missing or incomplete.",
      });
    }

    const convertedTargetPadi = convertTargetPadi(input.target_padi);

    const mlRecommendation = new Recommendation({
      input: {
        P: input.P,
        N: input.N,
        K: input.K,
        jenis_tanaman: input.jenis_tanaman,
        target_padi: convertedTargetPadi,
      },
      recommendation: recommendations,
      reasons: reasons,
      tips: tips,
      conversion_results: conversion_results, // <-- SIMPAN HASIL KONVERSI
      timestamp: getWIBTime(),
    });

    await mlRecommendation.save();
    res.status(201).json({
      success: true,
      message: "ML recommendation saved successfully",
      data: mlRecommendation,
    });
  } catch (error) {
    console.error("Error saving ML recommendation:", error.message);
    res.status(400).json({
      success: false,
      message: "Error saving ML recommendation",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

