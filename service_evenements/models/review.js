const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReviewSchema = new Schema({
  evenementId: {
    type: Schema.Types.ObjectId,
    ref: 'Evenement',
    required: [true, 'L\'ID de l\'événement est obligatoire']
  },
  utilisateurId: {
    type: String,
    required: [true, 'L\'ID de l\'utilisateur est obligatoire']
  },
  nomUtilisateur: {
    type: String,
    required: [true, 'Le nom de l\'utilisateur est obligatoire'],
    trim: true
  },
  note: {
    type: Number,
    required: [true, 'La note est obligatoire'],
    min: [1, 'La note minimale est 1'],
    max: [5, 'La note maximale est 5'],
    validate: {
      validator: Number.isInteger,
      message: 'La note doit être un nombre entier'
    }
  },
  commentaire: {
    type: String,
    required: [true, 'Le commentaire est obligatoire'],
    minlength: [10, 'Le commentaire doit contenir au moins 10 caractères'],
    maxlength: [500, 'Le commentaire ne peut pas dépasser 500 caractères'],
    trim: true
  },
  aspects: {
    organisation: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    lieu: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    qualite: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    rapport_qualite_prix: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    }
  },
  recommande: {
    type: Boolean,
    default: true
  },
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  statut: {
    type: String,
    enum: ['publié', 'modéré', 'signalé'],
    default: 'publié'
  },
  reponseOrganisateur: {
    texte: String,
    date: Date
  }
}, {
  timestamps: true
});

ReviewSchema.index({ evenementId: 1, createdAt: -1 });
ReviewSchema.index({ utilisateurId: 1 });
ReviewSchema.index({ note: -1 });

ReviewSchema.index({ evenementId: 1, utilisateurId: 1 }, { unique: true });

ReviewSchema.methods.estPositif = function() {
  return this.note >= 4;
};

ReviewSchema.methods.noteMoyenneAspects = function() {
  const aspects = [
    this.aspects.organisation,
    this.aspects.lieu,
    this.aspects.qualite,
    this.aspects.rapport_qualite_prix
  ].filter(note => note !== null);
  
  if (aspects.length === 0) return null;
  
  const somme = aspects.reduce((acc, note) => acc + note, 0);
  return (somme / aspects.length).toFixed(2);
};

ReviewSchema.virtual('dateFormatee').get(function() {
  return this.createdAt.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

ReviewSchema.set('toJSON', { virtuals: true });
ReviewSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Review', ReviewSchema);