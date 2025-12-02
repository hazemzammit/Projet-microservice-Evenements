const yup = require('yup');

const validateExperience = async (req, res, next) => {
  try {
    const schema = yup.object().shape({
      userId: yup
        .string()
        .required("L'identifiant utilisateur est obligatoire"),

      eventId: yup
        .string()
        .nullable()
        .optional(),

      content: yup
        .string()
        .min(10, "Le contenu doit contenir au moins 10 caractères")
        .required("Le contenu est obligatoire"),

      rating: yup
        .number()
        .min(1, "La note minimale est 1")
        .max(5, "La note maximale est 5")
        .required("La note est obligatoire"),

      imageUrl: yup
        .string()
        .url("L'image doit être une URL valide")
        .nullable()
        .optional(),

      status: yup
        .string()
        .oneOf(["visible", "hidden", "reported"])
        .default("visible")
        .optional()
    });

    await schema.validate(req.body, { abortEarly: false });
    next();

  } catch (err) {
    console.log(err);
    res.status(400).json({
      message: "Erreur de validation",
      errors: err.errors
    });
  }
};

module.exports = { validateExperience };
