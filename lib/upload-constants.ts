// Partagé entre le client (vérification immédiate avant envoi) et la route
// d'upload (garde-fou serveur) — Vercel refuse toute requête de fonction
// serverless au-delà de 4,5 Mo au niveau plateforme, avant même d'exécuter
// notre code ; cette limite ne peut pas être augmentée.
export const MAX_UPLOAD_SIZE = 4 * 1024 * 1024; // 4 Mo
export const MAX_UPLOAD_SIZE_LABEL = "4 Mo";
