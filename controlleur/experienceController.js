const { get } = require('mongoose');
const mongoose = require('mongoose');
const Experience = require('../models/experience'); 
const Sentiment = require('sentiment');
const sentimentAnalyzer = new Sentiment();

async  function add (req, res) {
    try{
        const experience= new Experience(req.body)
        await experience.save();
        res.status(200).send(experience);
        
        } catch(err){
            res.send(err);
        }}

async function show(req, res)  {
    try{
        const experience= await Experience.find()
        res.send(experience);

    } catch(err){
        res.send(err);
    }
}

 async function showbyid(req, res) {
    try{
        const experience= await Experience.findById(req.params.id)
        res.send(experience);

    } catch(err){
        res.send(err);
    }
}


async function update(req, res) {
    try{
        const experience= await Experience.findByIdAndUpdate(req.params.id, req.body, {new:true})
        res.status(200).send(experience);
        
        } catch(err){
            res.send(err);
        }
    }

async function deleteexperience(req, res) {
    try{
        const experience= await Experience.findByIdAndDelete(req.params.id)
        res.status(200).send("experience deleted");
        
        } catch(err){
            res.send(err);
        }
    }


async function getStatistics(req, res) {
  try {
    // Top expériences par note (les 5 meilleures)
    const topExperiences = await Experience.find()
      .sort({ rating: -1 })
      .limit(5)
      .select('userId eventId content rating likes');

    //Nombre moyen de likes par événement
    const avgLikesPerEvent = await Experience.aggregate([
      { $group: { _id: "$eventId", avgLikes: { $avg: "$likes" } } }
    ]);

    //  Distribution des notes par événement
    const ratingDistribution = await Experience.aggregate([
      { $group: { 
          _id: { eventId: "$eventId", rating: "$rating" }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { "_id.eventId": 1, "_id.rating": -1 } }
    ]);

    res.status(200).json({
      topExperiences,
      avgLikesPerEvent,
      ratingDistribution
    });
    
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération des statistiques", error: err });
  }
}



async function likeExperience(req, res) {
  try {
    const { experienceId, userId, action } = req.body;

    if (!experienceId || !userId || !["like", "dislike"].includes(action)) {
      return res.status(400).json({ message: "experienceId, userId et action valides sont obligatoires" });
    }

    const experience = await Experience.findById(experienceId);
    if (!experience) {
      return res.status(404).json({ message: "Expérience non trouvée" });
    }

    // Initialiser le tableau likes si nécessaire
    if (!experience.likesUsers) experience.likesUsers = [];

    // Ajouter ou retirer le like
    if (action === "like") {
      if (!experience.likesUsers.includes(userId)) experience.likesUsers.push(userId);
    } else if (action === "dislike") {
      experience.likesUsers = experience.likesUsers.filter(u => u !== userId);
    }

    // Mettre à jour le nombre total de likes
    experience.likes = experience.likesUsers.length;

    await experience.save();

    res.status(200).json({ message: "Action enregistrée", likes: experience.likes });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de l'action", error: err });
  }
}

async function addComment(req, res) {
    try {
        const { userId, content } = req.body;
        const experienceId = req.params.id;

        if (!userId || !content) {
            return res.status(400).json({ message: "userId et content sont obligatoires." });
        }

        // Vérification ID valide
        if (!mongoose.Types.ObjectId.isValid(experienceId)) {
            return res.status(400).json({ message: "ID expérience invalide" });
        }

        const experience = await Experience.findById(experienceId);
        if (!experience) return res.status(404).json({ message: "Experience non trouvée." });

        // Initialiser le tableau comments si inexistant
        if (!experience.comments) experience.comments = [];

        // Analyse de sentiment
        const score = sentimentAnalyzer.analyze(content).score;
        let sentiment = 'neutral';
        if (score > 0) sentiment = 'positive';
        else if (score < 0) sentiment = 'negative';

        experience.comments.push({ userId, content, sentiment });
        await experience.save();

        res.status(200).json({ message: "Commentaire ajouté", experience });

    } catch (err) {
        console.error("Erreur addComment:", err);
        res.status(500).json({ message: "Erreur lors de l'ajout du commentaire", error: err });
    }
}


async function getComments(req, res) {
    try {
        const experienceId = req.params.id;

        const experience = await Experience.findById(experienceId);

        if (!experience) {
            return res.status(404).json({ message: "Expérience non trouvée." });
        }

        res.status(200).json({
            experienceId: experienceId,
            comments: experience.comments
        });

    } catch (err) {
        res.status(500).json({
            message: "Erreur lors de la récupération des commentaires",
            error: err
        });
    }
}




module.exports = {add,show,showbyid,update,deleteexperience,getStatistics,likeExperience,addComment,getComments};


