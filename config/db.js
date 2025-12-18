import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("✅ MongoDB connecté");
    } catch (err) {
        console.error("❌ Erreur connexion DB:", err.message);
        process.exit(1);
    }
};