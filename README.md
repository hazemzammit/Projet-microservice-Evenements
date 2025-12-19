Documentation 
1. Nom du Projet : “ Eventia “
Projet de Gestion des evenements (Users, Evenements, Réservations, Shop, Promotion, 
Expérience).
2. Micro-services et Numéros de Ports
 
 
3. Service Discovery
Le Service Discovery sert à ce que chaque micro-service d’Eventia puisse se déclarer 
automatiquement dans un registre central. Grâce à ça, les autres services peuvent le 
retrouver sans connaître son adresse ou son port à l’avance.
==> Dans notre projet, nous utilisons un Registry développé en Node.js, qui joue le 
rôle d’un système de découverte (semblable à Eureka) et qui permet à tous les micro -
services — Users, Événements, Réservations, Shop, Promotion et Expérience — de 
communiquer entre eux facilement.
User Service 
( Yassin )
http://localhost:3000
Evenement Service
( Hazem )
http://localhost:3001
Expérience Service 
( Chayma)
http://localhost:3002
Réservation Service
( Ahmed )
http://localhost:3003
Shop Service 
( Haythem)
http://localhost:3004
Promotion Service 
( Hedyane)
http://localhost:3005
Implémentation du Registry
Dans Eventia, le Registry sert d’annuaire pour tous les micro-services.
Il tourne sur un seul port (4000) et chaque micro-service lui envoie une requête POST
au démarrage pour s’enregistrer.
==> Le Registry garde trois informations pour chaque service :
• Le nom du service
• Son adresse
• Son port
Adresse du Registry dans Eventia :
 ==> http://localhost:4000
 
4. Service index ”Gateway”
La Gateway est l’entrée principale de l’application.
Elle reçoit les requêtes des utilisateurs et les redirige vers le bon micro-service (user, 
évent, réservation, shop, promotion, expérience).
Adresse du Gateway dans Eventia :
 ==> http://localhost:5000
Fonctionnement de la Gateway
La Gateway reçoit les requêtes des utilisateurs et les envoie automatiquement vers le 
bon micro-service.
Elle utilise le Service Discovery pour savoir où chaque micro-service est situé.
