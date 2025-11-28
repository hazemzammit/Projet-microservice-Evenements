const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EvenementSchema = new Schema({
  titre: {
    type: String,
    required: [true, 'Le titre est obligatoire'],
    trim: true,
    minlength: [3, 'Le titre doit contenir au moins 3 caractères'],
    maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    required: [true, 'La description est obligatoire'],
    minlength: [10, 'La description doit contenir au moins 10 caractères'],
    maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
  },
  dateDebut: {
    type: Date,
    required: [true, 'La date de début est obligatoire'],
    validate: {
      validator: function(value) {
        return value >= new Date();
      },
      message: 'La date de début doit être dans le futur'
    }
  },
  dateFin: {
    type: Date,
    required: [true, 'La date de fin est obligatoire'],
    validate: {
      validator: function(value) {
        return value > this.dateDebut;
      },
      message: 'La date de fin doit être après la date de début'
    }
  },
  lieu: {
    ville: {
      type: String,
      required: [true, 'La ville est obligatoire']
    },
    adresse: {
      type: String,
      required: [true, 'L\'adresse est obligatoire']
    },
    codePostal: {
      type: String,
      required: [true, 'Le code postal est obligatoire']
    }
  },
  categorie: {
    type: String,
    required: [true, 'La catégorie est obligatoire'],
    enum: {
      values: ['Concert', 'Conférence', 'Sport', 'Festival', 'Théâtre', 'Exposition', 'Formation', 'Autre'],
      message: '{VALUE} n\'est pas une catégorie valide'
    }
  },
  capaciteMax: {
    type: Number,
    required: [true, 'La capacité maximale est obligatoire'],
    min: [1, 'La capacité doit être au moins 1'],
    validate: {
      validator: Number.isInteger,
      message: 'La capacité doit être un nombre entier'
    }
  },
  placesDisponibles: {
    type: Number,
    min: 0,
    validate: {
      validator: function(value) {
        return value <= this.capaciteMax;
      },
      message: 'Les places disponibles ne peuvent pas dépasser la capacité maximale'
    }
  },
  prix: {
    type: Number,
    required: [true, 'Le prix est obligatoire'],
    min: [0, 'Le prix ne peut pas être négatif']
  },
  organisateurId: {
    type: String,
    required: [true, 'L\'ID de l\'organisateur est obligatoire']
  },
  image: {
    type: String,
    default: 'default-event.jpg'
  },
  statut: {
    type: String,
    enum: ['À venir', 'En cours', 'Terminé', 'Annulé'],
    default: 'À venir'
  },
  tags: [{
    type: String,
    trim: true
  }],
  nombreReservations: {
    type: Number,
    default: 0,
    min: 0
  },
  noteMoyenne: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  nombreAvis: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

EvenementSchema.index({ titre: 'text', description: 'text' });
EvenementSchema.index({ dateDebut: 1 });
EvenementSchema.index({ categorie: 1 });
EvenementSchema.index({ 'lieu.ville': 1 });
EvenementSchema.index({ noteMoyenne: -1 });

EvenementSchema.pre('save', function(next) {
  if (this.isNew && !this.placesDisponibles) {
    this.placesDisponibles = this.capaciteMax;
  }
  next();
});

EvenementSchema.virtual('tauxRemplissage').get(function() {
  return ((this.nombreReservations / this.capaciteMax) * 100).toFixed(2);
});

EvenementSchema.methods.mettreAJourNote = function(nouvelleNote, ancienneNote = null) {
  if (ancienneNote !== null) {
    const totalPoints = this.noteMoyenne * this.nombreAvis;
    const nouveauTotal = totalPoints - ancienneNote + nouvelleNote;
    this.noteMoyenne = (nouveauTotal / this.nombreAvis).toFixed(2);
  } else {
    const totalPoints = this.noteMoyenne * this.nombreAvis;
    this.nombreAvis += 1;
    this.noteMoyenne = ((totalPoints + nouvelleNote) / this.nombreAvis).toFixed(2);
  }
};

EvenementSchema.methods.supprimerAvis = function(note) {
  if (this.nombreAvis > 0) {
    const totalPoints = this.noteMoyenne * this.nombreAvis;
    this.nombreAvis -= 1;
    if (this.nombreAvis === 0) {
      this.noteMoyenne = 0;
    } else {
      this.noteMoyenne = ((totalPoints - note) / this.nombreAvis).toFixed(2);
    }
  }
};


EvenementSchema.pre('findOneAndDelete', async function(next) {
  try {
    const evenementId = this.getQuery()._id;
    
    const Review = require('./review');
    await Review.deleteMany({ evenementId });
    
    console.log(`Avis supprimés pour l'événement ${evenementId}`);
    next();
  } catch (error) {
    console.error('Erreur lors de la suppression en cascade:', error);
    next(error);
  }
});

EvenementSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    const Review = require('./review');
    await Review.deleteMany({ evenementId: this._id });
    
    console.log(`Avis supprimés pour l'événement ${this._id}`);
    next();
  } catch (error) {
    console.error('Erreur lors de la suppression en cascade:', error);
    next(error);
  }
});


EvenementSchema.set('toJSON', { virtuals: true });
EvenementSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Evenement', EvenementSchema);