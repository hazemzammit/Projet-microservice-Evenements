const mongoose = require('mongoose');

const connectDB = async () => {
  // Change from MONGO_URI to MONGO_URL to match docker-compose
  const uri = process.env.MONGO_URL;
  if (!uri) {
    console.error("❌ MONGO_URL n'est pas défini. Vérifie ton fichier docker-compose.yml !");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected...');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;