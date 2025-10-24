const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const {
  RawData,
  CalibratedData,
  Recommendation,
} = require("./models/DataModel");

const app = express();
const PORT = process.env.PORT || 3001;

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

// API Routes

// Raw Data Endpoints
app.post("/api/data/raw", async (req, res) => {
  try {
    const dataWithTimestamp = {
      ...req.body,
      timestamp: getWIBTime(),
    };
    const rawData = new RawData(dataWithTimestamp);
    await rawData.save();
    res.status(201).json({
      success: true,
      message: "Raw data saved successfully",
      data: rawData,
    });
  } catch (error) {
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
app.post("/api/recommendation", async (req, res) => {
  try {
    const { pH, N, K } = req.body;

    // Dummy recommendation logic
    const recommendation = {
      urea: Math.max(
        0,
        Math.min(200, 150 - parseFloat(pH) * 10 + parseFloat(N) * 2)
      ),
      sp36: Math.max(
        0,
        Math.min(150, 100 - parseFloat(pH) * 5 + parseFloat(K) * 1.5)
      ),
      kcl: Math.max(
        0,
        Math.min(100, 80 - parseFloat(pH) * 3 + parseFloat(N) * 1.2)
      ),
    };

    const recommendationData = new Recommendation({
      input: { pH, N, K },
      recommendation,
      timestamp: getWIBTime(),
    });

    await recommendationData.save();

    res.json({
      success: true,
      message: "Recommendation generated successfully",
      data: {
        recommendation,
        timestamp: recommendationData.timestamp,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error generating recommendation",
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
        pH: latestData.variables.pH,
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
    const manualData = new CalibratedData(dataWithTimestamp);
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
    const manualData = await CalibratedData.findOne({
      variables: { $exists: true },
    }).sort({ timestamp: -1 });
    if (!manualData) {
      return res.status(404).json({
        success: false,
        message: "No manual data found",
      });
    }
    res.json({
      success: true,
      data: {
        pH: manualData.variables.pH,
        N: manualData.variables.N,
        K: manualData.variables.K,
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

// AI Recommendation Endpoint
app.post("/api/recommendation/ai", async (req, res) => {
  try {
    const aiRecommendation = new Recommendation({
      ...req.body,
      timestamp: getWIBTime(),
    });
    await aiRecommendation.save();
    res.status(201).json({
      success: true,
      message: "AI recommendation saved successfully",
      data: aiRecommendation,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error saving AI recommendation",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
