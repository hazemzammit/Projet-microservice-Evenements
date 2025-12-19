const yup = require('yup');

const createEvenementSchema = yup.object().shape({
  titre: yup.string()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(100, 'Le titre ne peut pas dépasser 100 caractères')
    .required('Le titre est obligatoire'),
  
  description: yup.string()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .required('La description est obligatoire'),
  
  dateDebut: yup.date()
    .min(new Date(), 'La date de début doit être dans le futur')
    .required('La date de début est obligatoire'),
  
  dateFin: yup.date()
    .min(yup.ref('dateDebut'), 'La date de fin doit être après la date de début')
    .required('La date de fin est obligatoire'),
  
  lieu: yup.object().shape({
    ville: yup.string().required('La ville est obligatoire'),
    adresse: yup.string().required('L\'adresse est obligatoire'),
    codePostal: yup.string()
      .matches(/^[0-9]{4}$/, 'Le code postal doit contenir 4 chiffres')
      .required('Le code postal est obligatoire')
  }).required('Le lieu est obligatoire'),
  
  categorie: yup.string()
    .oneOf(
      ['Concert', 'Conférence', 'Sport', 'Festival', 'Théâtre', 'Exposition', 'Formation', 'Autre'],
      'Catégorie invalide'
    )
    .required('La catégorie est obligatoire'),
  
  capaciteMax: yup.number()
    .integer('La capacité doit être un nombre entier')
    .min(1, 'La capacité doit être au moins 1')
    .required('La capacité maximale est obligatoire'),
  
  prix: yup.number()
    .min(0, 'Le prix ne peut pas être négatif')
    .required('Le prix est obligatoire'),
  
  organisateurId: yup.string()
    .required('L\'ID de l\'organisateur est obligatoire'),
  
  image: yup.string().url('L\'URL de l\'image n\'est pas valide').nullable(),
  
  tags: yup.array().of(yup.string()).nullable()
});

const updateEvenementSchema = yup.object().shape({
  titre: yup.string()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(100, 'Le titre ne peut pas dépasser 100 caractères'),
  
  description: yup.string()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(1000, 'La description ne peut pas dépasser 1000 caractères'),
  
  dateDebut: yup.date()
    .min(new Date(), 'La date de début doit être dans le futur'),
  
  dateFin: yup.date(),
  
  lieu: yup.object().shape({
    ville: yup.string(),
    adresse: yup.string(),
    codePostal: yup.string().matches(/^[0-9]{4}$/, 'Le code postal doit contenir 4 chiffres')
  }),
  
  categorie: yup.string()
    .oneOf(
      ['Concert', 'Conférence', 'Sport', 'Festival', 'Théâtre', 'Exposition', 'Formation', 'Autre'],
      'Catégorie invalide'
    ),
  
  capaciteMax: yup.number()
    .integer('La capacité doit être un nombre entier')
    .min(1, 'La capacité doit être au moins 1'),
  
  prix: yup.number().min(0, 'Le prix ne peut pas être négatif'),
  
  image: yup.string().url('L\'URL de l\'image n\'est pas valide'),
  
  statut: yup.string()
    .oneOf(['À venir', 'En cours', 'Terminé', 'Annulé'], 'Statut invalide'),
  
  tags: yup.array().of(yup.string())
});

const validateCreate = async (req, res, next) => {
  try {
    await createEvenementSchema.validate(req.body, { abortEarly: false });
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
    await updateEvenementSchema.validate(req.body, { abortEarly: false });
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
  validateUpdate
};