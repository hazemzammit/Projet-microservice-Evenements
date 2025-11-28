const yup = require('yup');

const createReviewSchema = yup.object().shape({
  utilisateurId: yup.string()
    .required('L\'ID de l\'utilisateur est obligatoire'),
  
  nomUtilisateur: yup.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .required('Le nom de l\'utilisateur est obligatoire'),
  
  note: yup.number()
    .integer('La note doit être un nombre entier')
    .min(1, 'La note minimale est 1')
    .max(5, 'La note maximale est 5')
    .required('La note est obligatoire'),
  
  commentaire: yup.string()
    .min(10, 'Le commentaire doit contenir au moins 10 caractères')
    .max(500, 'Le commentaire ne peut pas dépasser 500 caractères')
    .required('Le commentaire est obligatoire'),
  
  aspects: yup.object().shape({
    organisation: yup.number()
      .integer('La note doit être un nombre entier')
      .min(1, 'La note minimale est 1')
      .max(5, 'La note maximale est 5')
      .nullable(),
    
    lieu: yup.number()
      .integer('La note doit être un nombre entier')
      .min(1, 'La note minimale est 1')
      .max(5, 'La note maximale est 5')
      .nullable(),
    
    qualite: yup.number()
      .integer('La note doit être un nombre entier')
      .min(1, 'La note minimale est 1')
      .max(5, 'La note maximale est 5')
      .nullable(),
    
    rapport_qualite_prix: yup.number()
      .integer('La note doit être un nombre entier')
      .min(1, 'La note minimale est 1')
      .max(5, 'La note maximale est 5')
      .nullable()
  }).nullable(),
  
  recommande: yup.boolean()
    .default(true)
});

const updateReviewSchema = yup.object().shape({
  note: yup.number()
    .integer('La note doit être un nombre entier')
    .min(1, 'La note minimale est 1')
    .max(5, 'La note maximale est 5'),
  
  commentaire: yup.string()
    .min(10, 'Le commentaire doit contenir au moins 10 caractères')
    .max(500, 'Le commentaire ne peut pas dépasser 500 caractères'),
  
  aspects: yup.object().shape({
    organisation: yup.number()
      .integer('La note doit être un nombre entier')
      .min(1, 'La note minimale est 1')
      .max(5, 'La note maximale est 5')
      .nullable(),
    
    lieu: yup.number()
      .integer('La note doit être un nombre entier')
      .min(1, 'La note minimale est 1')
      .max(5, 'La note maximale est 5')
      .nullable(),
    
    qualite: yup.number()
      .integer('La note doit être un nombre entier')
      .min(1, 'La note minimale est 1')
      .max(5, 'La note maximale est 5')
      .nullable(),
    
    rapport_qualite_prix: yup.number()
      .integer('La note doit être un nombre entier')
      .min(1, 'La note minimale est 1')
      .max(5, 'La note maximale est 5')
      .nullable()
  }),
  
  recommande: yup.boolean()
});

const responseSchema = yup.object().shape({
  texte: yup.string()
    .min(10, 'La réponse doit contenir au moins 10 caractères')
    .max(500, 'La réponse ne peut pas dépasser 500 caractères')
    .required('Le texte de la réponse est obligatoire')
});

const validateCreate = async (req, res, next) => {
  try {
    await createReviewSchema.validate(req.body, { abortEarly: false });
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: error.errors
    });
  }
};

const validateUpdate = async (req, res, next) => {
  try {
    await updateReviewSchema.validate(req.body, { abortEarly: false });
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: error.errors
    });
  }
};

const validateResponse = async (req, res, next) => {
  try {
    await responseSchema.validate(req.body, { abortEarly: false });
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: error.errors
    });
  }
};

module.exports = {
  validateCreate,
  validateUpdate,
  validateResponse
};