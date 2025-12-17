import mongoose from "mongoose"

const SettingsSchema = new mongoose.Schema(
  {
    taxRate: {
      type: Number,
      default: 20,
      min: 0,
      max: 100,
    },
    invoicePrefix: {
      type: String,
      default: "FAC",
      uppercase: true,
      trim: true,
    },
    footerText: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
)

export default mongoose.model("Settings", SettingsSchema)
