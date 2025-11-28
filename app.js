const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const dbConfig = require('./config/db.json');
const evenementRoutes = require('./routes/evenementRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();
const PORT = 3001;

app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(dbConfig.url)
  .then(() => {
    console.log('Base de données connectée avec succès');
  })
  .catch(err => {
    console.error('Erreur de connexion à la base de données:', err);
    process.exit(1);
  });


app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenue sur le service Événements',    
  });
});

app.use('/api/evenements', evenementRoutes);

app.use('/api/reviews', reviewRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur serveur interne',
  });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré avec succès`);
  console.log(`Port: ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
});

process.on('SIGINT', async () => {
  console.log('\n Arrêt du serveur...');
  await mongoose.connection.close();
  console.log('Connexion à la base de données fermée');
  process.exit(0);
});

module.exports = app;