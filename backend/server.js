
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const Hospital = require("./models/Hospital");
const Patient = require("./models/Patient");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Sample hospital data
const sampleHospitals = [
  {
    name: "City Care Hospital",
    location: "Central City",
    departments: ["General Medicine", "Cardiology", "Orthopedics"],
  },
  {
    name: "Sunrise Medical Centre",
    location: "North Avenue",
    departments: ["General Medicine", "Pediatrics"],
  },
  {
    name: "GreenLife Hospital",
    location: "West District",
    departments: ["Cardiology", "Dermatology", "Orthopedics"],
  },
];

// Backend health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Smart OPD backend is running!",
  });
});

// Get all hospitals
app.get("/api/hospitals", async (req, res) => {
  try {
    const hospitals = await Hospital.find();

    res.json({
      success: true,
      count: hospitals.length,
      data: hospitals,
    });
  } catch (error) {
    console.error("Hospital fetching error:", error);

    res.status(500).json({
      success: false,
      message: "Could not fetch hospitals",
      error: error.message,
    });
  }
});

// Register patient and generate token
app.post("/api/patients", async (req, res) => {
  try {
    const { name, age, phone, hospitalId, department } = req.body;

    if (!name || !age || !phone || !hospitalId || !department) {
      return res.status(400).json({
        success: false,
        message: "Please provide all patient details.",
      });
    }

    const hospital = await Hospital.findById(hospitalId);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found.",
      });
    }

    if (!hospital.departments.includes(department)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department for this hospital.",
      });
    }

    const queuePosition =
      (await Patient.countDocuments({
        hospitalId,
        department,
        status: "Waiting",
      })) + 1;

    const tokenNumber = `OPD-${String(queuePosition).padStart(3, "0")}`;

    const patient = await Patient.create({
      name,
      age,
      phone,
      hospitalId,
      department,
      tokenNumber,
      queuePosition,
      status: "Waiting",
    });

    res.status(201).json({
      success: true,
      message: "Patient registered successfully!",
      data: {
        ...patient.toObject(),
        hospitalName: hospital.name,
      },
    });
  } catch (error) {
    console.error("Patient registration error:", error);

    res.status(500).json({
      success: false,
      message: "Patient registration failed.",
    });
  }
});

// Get all registered patients
app.get("/api/patients", async (req, res) => {
  try {
    const patients = await Patient.find()
      .populate("hospitalId", "name location")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: patients.length,
      data: patients,
    });
  } catch (error) {
    console.error("Patient fetching error:", error);

    res.status(500).json({
      success: false,
      message: "Could not fetch patients.",
    });
  }
});

// UPDATE PATIENT STATUS (NEW ADMIN FEATURE)
app.patch("/api/patients/:id/status", async (req, res) => {
  try {
    console.log("STATUS UPDATE REQUEST:", req.params.id, req.body);
    const { status } = req.body;

    const allowedStatuses = [
      "Waiting",
      "In Consultation",
      "Completed",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient status.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID.",
      });
    }

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    res.json({
      success: true,
      message: "Patient status updated successfully!",
      data: patient,
    });
  } catch (error) {
    console.error("Status update error:", error);

    res.status(500).json({
      success: false,
      message: "Could not update patient status.",
    });
  }
});

// Get live queue for a hospital and department
app.get("/api/queue", async (req, res) => {
  try {
    const { hospitalId, department } = req.query;

    if (!hospitalId || !department) {
      return res.status(400).json({
        success: false,
        message: "Hospital ID and department are required.",
      });
    }

    const patients = await Patient.find({
      hospitalId,
      department,
      status: { $in: ["Waiting", "In Consultation"] },
    }).sort({ queuePosition: 1 });

    res.json({
      success: true,
      count: patients.length,
      data: patients,
    });
  } catch (error) {
    console.error("Queue fetching error:", error);

    res.status(500).json({
      success: false,
      message: "Could not fetch live queue.",
    });
  }
});

// Start backend server
async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from backend/.env");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB Atlas!");

    for (const hospital of sampleHospitals) {
      await Hospital.updateOne(
        { name: hospital.name },
        { $setOnInsert: hospital },
        { upsert: true }
      );
    }

    console.log("Hospital data is ready!");

    app.listen(PORT, () => {
      console.log(`Smart OPD backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Backend startup failed:", error);
    process.exit(1);
  }
}

startServer();
