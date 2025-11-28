const Review = require('../models/review');
const Evenement = require('../models/evenement');
const mongoose = require('mongoose');

async function createReview(req, res) {
  try {
    const { evenementId } = req.params;
    const { utilisateurId, nomUtilisateur, note, commentaire, aspects, recommande } = req.body;

    const evenement = await Evenement.findById(evenementId);
    if (!evenement) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    if (evenement.statut !== 'Terminé') {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez noter que les événements terminés'
      });
    }

    const review = new Review({
      evenementId,
      utilisateurId,
      nomUtilisateur,
      note,
      commentaire,
      aspects,
      recommande
    });

    await review.save();

    evenement.mettreAJourNote(note);
    await evenement.save();

    res.status(201).json({
      success: true,
      message: 'Avis créé avec succès',
      data: review
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà noté cet événement'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'avis',
      error: error.message
    });
  }
}

async function getReviewsByEvenement(req, res) {
  try {
    const { evenementId } = req.params;
    const { sortBy = 'createdAt', order = 'desc', note, statut } = req.query;

    let query = { evenementId: new mongoose.Types.ObjectId(evenementId) };

    if (note) {
      query.note = parseInt(note);
    }

    if (statut) {
      query.statut = statut;
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const sortOptions = { [sortBy]: sortOrder };

    const reviews = await Review.find(query).sort(sortOptions);

    const stats = await Review.aggregate([
      { $match: { evenementId: new mongoose.Types.ObjectId(evenementId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          moyenne: { $avg: '$note' },
          note5: { $sum: { $cond: [{ $eq: ['$note', 5] }, 1, 0] } },
          note4: { $sum: { $cond: [{ $eq: ['$note', 4] }, 1, 0] } },
          note3: { $sum: { $cond: [{ $eq: ['$note', 3] }, 1, 0] } },
          note2: { $sum: { $cond: [{ $eq: ['$note', 2] }, 1, 0] } },
          note1: { $sum: { $cond: [{ $eq: ['$note', 1] }, 1, 0] } }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: reviews.length,
      statistiques: stats[0] || null,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des avis',
      error: error.message
    });
  }
}

async function getReviewById(req, res) {
  try {
    const review = await Review.findById(req.params.id)
      .populate('evenementId', 'titre dateDebut lieu');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'avis',
      error: error.message
    });
  }
}

async function updateReview(req, res) {
  try {
    const { id } = req.params;
    const { note, commentaire, aspects, recommande } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé'
      });
    }

    const ancienneNote = review.note;

    if (note !== undefined) review.note = note;
    if (commentaire !== undefined) review.commentaire = commentaire;
    if (aspects !== undefined) review.aspects = aspects;
    if (recommande !== undefined) review.recommande = recommande;

    await review.save();

    if (note !== undefined && note !== ancienneNote) {
      const evenement = await Evenement.findById(review.evenementId);
      evenement.mettreAJourNote(note, ancienneNote);
      await evenement.save();
    }

    res.status(200).json({
      success: true,
      message: 'Avis mis à jour avec succès',
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'avis',
      error: error.message
    });
  }
}

async function deleteReview(req, res) {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé'
      });
    }

    const evenementId = review.evenementId;
    const note = review.note;

    await Review.findByIdAndDelete(req.params.id);

    const evenement = await Evenement.findById(evenementId);
    if (evenement) {
      evenement.supprimerAvis(note);
      await evenement.save();
    }

    res.status(200).json({
      success: true,
      message: 'Avis supprimé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'avis',
      error: error.message
    });
  }
}

async function likeReview(req, res) {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Avis liké avec succès',
      data: { likes: review.likes }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors du like',
      error: error.message
    });
  }
}

async function addOrganisateurResponse(req, res) {
  try {
    const { texte } = req.body;

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      {
        reponseOrganisateur: {
          texte,
          date: new Date()
        }
      },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Réponse ajoutée avec succès',
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de la réponse',
      error: error.message
    });
  }
}

async function getReviewStatistics(req, res) {
  try {
    const { evenementId } = req.params;

    const stats = await Review.aggregate([
      { $match: { evenementId: new mongoose.Types.ObjectId(evenementId) } },
      {
        $facet: {
          general: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                moyenne: { $avg: '$note' },
                recommandations: { $sum: { $cond: ['$recommande', 1, 0] } }
              }
            }
          ],
          parNote: [
            {
              $group: {
                _id: '$note',
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: -1 } }
          ],
          aspects: [
            {
              $group: {
                _id: null,
                organisation: { $avg: '$aspects.organisation' },
                lieu: { $avg: '$aspects.lieu' },
                qualite: { $avg: '$aspects.qualite' },
                rapport_qualite_prix: { $avg: '$aspects.rapport_qualite_prix' }
              }
            }
          ],
          plusRecents: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
              $project: {
                nomUtilisateur: 1,
                note: 1,
                commentaire: 1,
                createdAt: 1
              }
            }
          ],
          plusLikes: [
            { $sort: { likes: -1 } },
            { $limit: 5 },
            {
              $project: {
                nomUtilisateur: 1,
                note: 1,
                commentaire: 1,
                likes: 1
              }
            }
          ]
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
}

async function getReviewsByUser(req, res) {
  try {
    const { utilisateurId } = req.params;

    const reviews = await Review.find({ utilisateurId })
      .populate('evenementId', 'titre dateDebut lieu')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des avis',
      error: error.message
    });
  }
}


async function flagReview(req, res) {
  try {
    const { id } = req.params;
    const { raison } = req.body;
    
    const review = await Review.findByIdAndUpdate(
      id,
      { statut: 'signalé' },
      { new: true }
    );
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Avis signalé avec succès',
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors du signalement',
      error: error.message
    });
  }
}

module.exports = {
  createReview,
  getReviewsByEvenement,
  getReviewById,
  updateReview,
  deleteReview,
  likeReview,
  addOrganisateurResponse,
  getReviewStatistics,
  getReviewsByUser,
  flagReview
};