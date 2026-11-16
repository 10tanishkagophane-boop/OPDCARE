
const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    tokenNumber: {
      type: String,
      required: true,
    },
    queuePosition: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      default: "Waiting",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Patient", patientSchema);
