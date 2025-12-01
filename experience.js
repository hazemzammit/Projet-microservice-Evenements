const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const ExperienceSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },

    eventId: {
        type: String,
        default: null   // l’expérience peut ne pas être liée à un event
    },

    content: {
        type: String,
        required: true
    },

    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },

    imageUrl: {
        type: String,
        default: null
    },

    status: {
        type: String,
        enum: ['visible', 'hidden', 'reported'],
        default: 'visible'
    },

    likes: { 
        type: Number,
        default: 0 
    },

    likesUsers: {
        type: [String], 
        default: [] 
    }, // stocke les userId qui ont liké

    comments: [{
    userId: { type: String, required: true },
    content: { type: String, required: true },
    sentiment: { type: String, default: "neutral" },
    createdAt: { type: Date, default: Date.now }
  }],


    sentimentScore: {
        type: Number, 
        default: 0
    },

    sentimentCategory: { 
        type: String,
        enum: ['positive', 'neutral', 'negative'],
        default: 'neutral' 
    }

}, 
{
    timestamps: true  // ajoute automatiquement createdAt + updatedAt
});

module.exports = mongoose.model('Experience', ExperienceSchema);
