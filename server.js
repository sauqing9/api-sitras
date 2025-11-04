const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const axios = require("axios");
const {
  RawData,
  CalibratedData,
  Recommendation,
  ManualData,
} = require("./models/DataModel");

const app = express();
const PORT = process.env.PORT || 3001;

// --- URL API ML DIPERBARUI ---
// URL untuk Model 1 (Kalibrasi)
const ML_KALIBRASI_API_URL = "https://sauqing-api-ml-sitras.hf.space/predict";
// URL untuk Model 2 (Rekomendasi K-NN) - Menggunakan host yang sama
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
    // 1. Simpan Data Mentah (RawData)
    const dataWithTimestamp = {
      ...req.body,
      timestamp: getWIBTime(),
    };
    const rawData = new RawData(dataWithTimestamp);
    await rawData.save();

    // --- INTEGRASI ML (MODEL 1: KALIBRASI) ---
    try {
      console.log("Data mentah disimpan. Memulai proses kalibrasi ML...");
      const rawVars = rawData.variables;

      // 2. Siapkan data NPKpH untuk dikirim ke API Python
      const dataForML = {
        pH: rawVars.pH,
        N: rawVars.N,
        P: rawVars.P,
        K: rawVars.K,
      };

      // 3. Panggil API Python (ML Service) menggunakan axios
      const mlResponse = await axios.post(ML_KALIBRASI_API_URL, dataForML, {
        timeout: 5000, // Timeout 5 detik
      });

      const calibratedValues = mlResponse.data;
      console.log("Hasil kalibrasi ML diterima:", calibratedValues);

      // 4. Buat dan simpan data terkalibrasi (CalibratedData)
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
    // --- INTEGRASI ML SELESAI ---

    // 5. Kembalikan respon sukses ke ESP32
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

// --- PERBAIKAN 1: Endpoint ini sekarang memanggil ML API (Bukan Dummy Logic) ---
// (Dipanggil oleh Dashboard & tab Rekomendasi Data)
app.post("/api/recommendation", async (req, res) => {
  try {
    // 1. Ambil SEMUA data dari body
    const { P, N, K, jenis_tanaman, target_padi } = req.body;

    // 2. Siapkan payload untuk API Python
    const payloadForML = {
      P: parseFloat(P),
      N: parseFloat(N),
      K: parseFloat(K),
      jenis_tanaman: jenis_tanaman,
      target_padi: target_padi, // Kirim string, Python API akan mengonversi
    };

    // 3. Panggil API ML Python (Model 2: Rekomendasi)
    console.log("Memanggil ML API Rekomendasi dari server Node...");
    const mlResponse = await axios.post(ML_REKOMENDASI_API_URL, payloadForML, {
      timeout: 5000 
    });

    // 4. Ambil rekomendasi dari hasil ML
    // Asumsi ML API mengembalikan: { success: true, data: { recommendations: {...}, reasons: {...}, tips: "..." } }
    if (!mlResponse.data || !mlResponse.data.success) {
      throw new Error("ML API call was not successful");
    }
    
    const recommendation = mlResponse.data.data.recommendations;
    const reasons = mlResponse.data.data.reasons;
    const tips = mlResponse.data.data.tips;
    
    // 5. Konversi target_padi untuk disimpan di DB
    const convertedTargetPadi = convertTargetPadi(target_padi);

    // 6. Buat objek data baru sesuai Skema Rekomendasi
    const recommendationData = new Recommendation({
      input: {
        P: parseFloat(P),
        N: parseFloat(N),
        K: parseFloat(K),
        jenis_tanaman: jenis_tanaman,
        target_padi: convertedTargetPadi, // Simpan nilai integer
      },
      recommendation, // Ini adalah hasil dari ML
      reasons,        // Ini dari ML
      tips,           // Ini dari ML
      timestamp: getWIBTime(),
    });

    // 7. Simpan ke database
    await recommendationData.save();

    // 8. Kembalikan HANYA rekomendasi dan timestamp (sesuai kebutuhan frontend)
    res.json({
      success: true,
      message: "Recommendation generated successfully from ML model",
      data: {
        recommendation,
        timestamp: recommendationData.timestamp,
      },
    });
  } catch (error) {
    console.error("Error generating ML recommendation:", error.message); // Log error
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
        P: latestData.variables.P, // Mengirim P (Fosfor)
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

// --- PERBAIKAN 2: Endpoint diganti dari /ai menjadi /ml ---
// (Dipanggil oleh tab Rekomendasi Input saat menyimpan)
app.post("/api/recommendation/ml", async (req, res) => {
  try {
    const { input, recommendations, reasons, tips } = req.body;

    // Validasi input dasar
    if (!input || typeof input.target_padi === "undefined") {
      return res.status(400).json({
        success: false,
        message: "Input data is missing or incomplete.",
      });
    }

    // Lakukan konversi
    const convertedTargetPadi = convertTargetPadi(input.target_padi);

    // Buat objek baru secara eksplisit untuk memastikan skema
    const mlRecommendation = new Recommendation({
      input: {
        P: input.P,
        N: input.N,
        K: input.K,
        jenis_tanaman: input.jenis_tanaman,
        target_padi: convertedTargetPadi, // Gunakan nilai integer
      },
      recommendation: recommendations,
      reasons: reasons,
      tips: tips,
      timestamp: getWIBTime(),
    });

    await mlRecommendation.save();
    res.status(201).json({
      success: true,
      message: "ML recommendation saved successfully", // Pesan diubah
      data: mlRecommendation, // Variabel diubah
    });
  } catch (error) {
    console.error("Error saving ML recommendation:", error.message); // Log diubah
    res.status(400).json({
      success: false,
      message: "Error saving ML recommendation", // Pesan diubah
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
