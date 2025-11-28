const Evenement = require('../models/evenement');

async function createEvenement(req, res) {
  try {
    const evenement = new Evenement(req.body);
    await evenement.save();
    
    res.status(201).json({
      success: true,
      message: 'Événement créé avec succès',
      data: evenement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'événement',
      error: error.message
    });
  }
}

async function getAllEvenements(req, res) {
  try {
    const evenements = await Evenement.find().sort({ dateDebut: 1 });
    
    res.status(200).json({
      success: true,
      count: evenements.length,
      data: evenements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des événements',
      error: error.message
    });
  }
}

async function getEvenementById(req, res) {
  try {
    const evenement = await Evenement.findById(req.params.id);
    
    if (!evenement) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }
    
    res.status(200).json({
      success: true,
      data: evenement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'événement',
      error: error.message
    });
  }
}

async function updateEvenement(req, res) {
  try {
    const evenement = await Evenement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!evenement) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Événement mis à jour avec succès',
      data: evenement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'événement',
      error: error.message
    });
  }
}


async function deleteEvenement(req, res) {
  try {
    const Review = require('../models/review');
    
    const nombreAvis = await Review.countDocuments({ evenementId: req.params.id });
    const evenement = await Evenement.findByIdAndDelete(req.params.id);
    
    if (!evenement) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Événement supprimé avec succès',
      details: {
        evenement: evenement.titre,
        avisSupprimes: nombreAvis
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'événement',
      error: error.message
    });
  }
}


async function rechercheAvancee(req, res) {
  try {
    const {
      titre,
      categorie,
      ville,
      dateMin,
      dateMax,
      prixMin,
      prixMax,
      disponible,
      statut,
      tags,
      noteMin,
      sortBy = 'dateDebut',
      order = 'asc'
    } = req.query;

    let query = {};

    if (titre) {
      query.$or = [
        { titre: { $regex: titre, $options: 'i' } },
        { description: { $regex: titre, $options: 'i' } }
      ];
    }

    if (categorie) {
      query.categorie = categorie;
    }

    if (ville) {
      query['lieu.ville'] = { $regex: ville, $options: 'i' };
    }

    if (dateMin || dateMax) {
      query.dateDebut = {};
      if (dateMin) query.dateDebut.$gte = new Date(dateMin);
      if (dateMax) query.dateDebut.$lte = new Date(dateMax);
    }

    if (prixMin || prixMax) {
      query.prix = {};
      if (prixMin) query.prix.$gte = parseFloat(prixMin);
      if (prixMax) query.prix.$lte = parseFloat(prixMax);
    }

    if (disponible === 'true') {
      query.placesDisponibles = { $gt: 0 };
    }

    if (statut) {
      query.statut = statut;
    }

    if (tags) {
      const tagsArray = tags.split(',');
      query.tags = { $in: tagsArray };
    }

    if (noteMin) {
      query.noteMoyenne = { $gte: parseFloat(noteMin) };
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const sortOptions = { [sortBy]: sortOrder };

    const evenements = await Evenement.find(query).sort(sortOptions);

    res.status(200).json({
      success: true,
      count: evenements.length,
      filters: req.query,
      data: evenements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche',
      error: error.message
    });
  }
}

async function getStatistiques(req, res) {
  try {
    const totalEvenements = await Evenement.countDocuments();

    const parCategorie = await Evenement.aggregate([
      {
        $group: {
          _id: '$categorie',
          count: { $sum: 1 },
          capaciteTotale: { $sum: '$capaciteMax' },
          placesReservees: { $sum: '$nombreReservations' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const parStatut = await Evenement.aggregate([
      {
        $group: {
          _id: '$statut',
          count: { $sum: 1 }
        }
      }
    ]);

    const plusPopulaires = await Evenement.find({ nombreAvis: { $gt: 0 } })
      .sort({ noteMoyenne: -1, nombreAvis: -1 })
      .limit(5)
      .select('titre noteMoyenne nombreAvis nombreReservations');

    const mieuxNotes = await Evenement.find({ nombreAvis: { $gte: 3 } })
      .sort({ noteMoyenne: -1 })
      .limit(10)
      .select('titre noteMoyenne nombreAvis categorie');

    const revenus = await Evenement.aggregate([
      {
        $group: {
          _id: null,
          revenusTotal: { $sum: { $multiply: ['$prix', '$nombreReservations'] } }
        }
      }
    ]);

    const tauxMoyen = await Evenement.aggregate([
      {
        $group: {
          _id: null,
          tauxMoyen: {
            $avg: {
              $multiply: [
                { $divide: ['$nombreReservations', '$capaciteMax'] },
                100
              ]
            }
          }
        }
      }
    ]);

    const parVille = await Evenement.aggregate([
      {
        $group: {
          _id: '$lieu.ville',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalEvenements,
        parCategorie,
        parStatut,
        plusPopulaires,
        mieuxNotes,
        revenus: revenus[0]?.revenusTotal || 0,
        tauxRemplissageMoyen: tauxMoyen[0]?.tauxMoyen.toFixed(2) || 0,
        parVille
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
}

async function getEvenementsAvenir(req, res) {
  try {
    const { limit = 10 } = req.query;

    const evenements = await Evenement.find({
      dateDebut: { $gte: new Date() },
      statut: 'À venir'
    })
      .sort({ dateDebut: 1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: evenements.length,
      data: evenements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des événements à venir',
      error: error.message
    });
  }
}

async function getEvenementsByOrganisateur(req, res) {
  try {
    const { organisateurId } = req.params;

    const evenements = await Evenement.find({ organisateurId })
      .sort({ dateDebut: -1 });

    res.status(200).json({
      success: true,
      count: evenements.length,
      data: evenements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des événements',
      error: error.message
    });
  }
}

async function updateNombreReservations(req, res) {
  try {
    const { id } = req.params;
    const { nombreReservations, placesDisponibles } = req.body;

    const evenement = await Evenement.findByIdAndUpdate(
      id,
      { nombreReservations, placesDisponibles },
      { new: true, runValidators: true }
    );

    if (!evenement) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Nombre de réservations mis à jour',
      data: evenement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour',
      error: error.message
    });
  }
}

async function getTopRatedEvenements(req, res) {
  try {
    const { limit = 10, noteMin = 4 } = req.query;

    const evenements = await Evenement.find({
      noteMoyenne: { $gte: parseFloat(noteMin) },
      nombreAvis: { $gte: 3 }
    })
      .sort({ noteMoyenne: -1, nombreAvis: -1 })
      .limit(parseInt(limit))
      .select('titre description noteMoyenne nombreAvis dateDebut lieu prix categorie');

    res.status(200).json({
      success: true,
      count: evenements.length,
      data: evenements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des événements',
      error: error.message
    });
  }
}

async function annulerEvenement(req, res) {
  try {
    const evenement = await Evenement.findByIdAndUpdate(
      req.params.id,
      { statut: 'Annulé' },
      { new: true }
    );

    if (!evenement) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Événement annulé avec succès',
      data: evenement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation',
      error: error.message
    });
  }
}


async function duplicateEvenement(req, res) {
  try {
    const { id } = req.params;
    const { titre, dateDebut, dateFin } = req.body;
    
    const original = await Evenement.findById(id);
    
    if (!original) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }
    
    const duplicate = new Evenement({
      ...original.toObject(),
      _id: undefined,
      titre: titre || `${original.titre} (Copie)`,
      dateDebut: dateDebut || original.dateDebut,
      dateFin: dateFin || original.dateFin,
      nombreReservations: 0,
      noteMoyenne: 0,
      nombreAvis: 0,
      placesDisponibles: original.capaciteMax,
      createdAt: undefined,
      updatedAt: undefined
    });
    
    await duplicate.save();
    
    res.status(201).json({
      success: true,
      message: 'Événement dupliqué avec succès',
      data: duplicate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la duplication',
      error: error.message
    });
  }
}

async function bulkDeleteEvenements(req, res) {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le tableau d\'IDs est requis'
      });
    }
    
    const Review = require('../models/review');
    
    const totalReviews = await Review.countDocuments({ 
      evenementId: { $in: ids } 
    });
    
    await Review.deleteMany({ evenementId: { $in: ids } });
    
    const result = await Evenement.deleteMany({ _id: { $in: ids } });
    
    res.status(200).json({
      success: true,
      message: `${result.deletedCount} événements supprimés`,
      details: {
        evenementsSupprimes: result.deletedCount,
        avisSupprimes: totalReviews
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression en masse',
      error: error.message
    });
  }
}

async function bulkUpdateEvenements(req, res) {
  try {
    const { ids, updates } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le tableau d\'IDs est requis'
      });
    }
    
    const result = await Evenement.updateMany(
      { _id: { $in: ids } },
      { $set: updates },
      { runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} événements mis à jour`,
      details: {
        matched: result.matchedCount,
        modified: result.modifiedCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour en masse',
      error: error.message
    });
  }
}




module.exports = {
  createEvenement,
  getAllEvenements,
  getEvenementById,
  updateEvenement,
  deleteEvenement,
  
  rechercheAvancee,
  getStatistiques,
  getEvenementsAvenir,
  getEvenementsByOrganisateur,
  updateNombreReservations,
  getTopRatedEvenements,
  annulerEvenement,
  duplicateEvenement,
  bulkDeleteEvenements,
  bulkUpdateEvenements
};