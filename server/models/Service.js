const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

ServiceSchema.index({ title: 1 });
ServiceSchema.index({ status: 1 });

module.exports = mongoose.model("Service", ServiceSchema);
