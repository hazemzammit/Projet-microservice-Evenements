import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String, required: true, unique: true },
    // Ajoute d'autres champs si besoin (ex: password avec bcrypt)
});

export default mongoose.model("User", userSchema);