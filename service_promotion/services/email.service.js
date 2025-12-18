import nodemailer from "nodemailer";
import dotenv from "dotenv";
import Promotion from "../models/promotion.model.js";

dotenv.config();

// Vérification des variables d'environnement
console.log("SMTP Config chargée :", {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS ? "●●●●●●●● (caché)" : "MANQUANT !"
});

const transporter = nodemailer.createTransport({  // ← createTransport SANS "er"
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: false, // true pour 465, false pour 587 (TLS)
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false // Utile en dev local si certificat auto-signé
    }
});

// Vérification de la connexion au démarrage
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ Erreur de configuration SMTP :", error.message);
    } else {
        console.log("✅ Serveur SMTP prêt à envoyer des emails");
    }
});

// Envoi d'une promotion par email
export const sendPromotionEmail = async (emails, promotionId) => {
    const promotion = await Promotion.findById(promotionId).select("name description discountValue discountType endDate");
    if (!promotion) throw new Error("Promotion introuvable");

    const emailList = Array.isArray(emails) ? emails : [emails];

    const mailOptions = {
        from: process.env.EMAIL_FROM || `"Promotion App" <${process.env.EMAIL_USER}>`,
        subject: `🎉 Nouvelle Offre : ${promotion.name}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h1 style="color: #d4380d;">${promotion.name}</h1>
                <p>${promotion.description || "Profitez d'une réduction exceptionnelle !"}</p>
                <p style="font-size: 24px; color: #d4380d;">
                    <strong>${promotion.discountValue}${promotion.discountType === "percentage" ? "%" : "€"} de réduction</strong>
                </p>
                <p>Valable jusqu'au : ${promotion.endDate ? new Date(promotion.endDate).toLocaleDateString() : "sans limite"}</p>
                <p>À bientôt sur notre plateforme !</p>
            </div>
        `
    };

    for (const email of emailList) {
        try {
            await transporter.sendMail({ ...mailOptions, to: email });
            console.log(`Email envoyé à ${email}`);
        } catch (err) {
            console.error(`Échec envoi à ${email}:`, err.message);
        }
    }

    return { message: `Emails envoyés à ${emailList.length} destinataire(s)` };
};

// Envoi d'un coupon par email
export const sendCouponEmail = async (email, code, promotionId) => {
    const promotion = await Promotion.findById(promotionId).select("name discountValue discountType category");

    if (!promotion) throw new Error("Promotion introuvable");

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"Promotion App" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "🎁 Votre Coupon Exclusif !",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background: #f9f9f9;">
                <h1 style="color: #d4380d;">Félicitations !</h1>
                <p>Voici votre coupon personnel :</p>
                <div style="background: #d4380d; color: white; padding: 20px; text-align: center; font-size: 32px; border-radius: 10px; letter-spacing: 5px;">
                    <strong>${code}</strong>
                </div>
                <p style="margin-top: 20px;">
                    Profitez de <strong>${promotion.discountValue}${promotion.discountType === "percentage" ? "%" : "€"}</strong> 
                    sur la catégorie <strong>${promotion.category}</strong>
                </p>
                <p>Merci pour votre fidélité !</p>
            </div>
        `
    });

    return { message: "Coupon envoyé par email" };
};