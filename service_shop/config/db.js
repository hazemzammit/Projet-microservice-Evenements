const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ MONGO_URI n'est pas défini. Vérifie ton fichier .env à la racine !");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri); // <- plus besoin de useNewUrlParser et useUnifiedTopology
    console.log('✅ MongoDB connected...');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
