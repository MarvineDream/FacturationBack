import mongoose from "mongoose"

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    actif: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

// --- Virtuals utiles ---
userSchema.virtual("id").get(function () {
  return this._id.toString()
})

userSchema.virtual("isActive").get(function () {
  return this.actif
})

// --- Cascade delete (factures + clients créés par cet utilisateur) ---
userSchema.pre("findOneAndDelete", async function (next) {
  try {
    const userId = this.getQuery()["_id"]
    if (!userId) return next()

    console.log(`[Cascade Delete] Suppression des données liées à l'utilisateur ${userId}…`)

    const Invoice = mongoose.model("Invoice")
    const Client = mongoose.model("Client")

    await Invoice.deleteMany({ createdBy: userId })
    await Client.deleteMany({ createdBy: userId })

    console.log(`[Cascade Delete] ✅ Factures et clients supprimés.`)
    next()
  } catch (err) {
    console.error("[Cascade Delete] ❌ Erreur :", err)
    next(err)
  }
})

const User = mongoose.models.User || mongoose.model("User", userSchema)
export default User
