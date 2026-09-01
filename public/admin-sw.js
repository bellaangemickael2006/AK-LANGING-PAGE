// Service worker volontairement minimal : aucune interception des requêtes
// (pas de cache pour les données Sheets/API), juste ce qu'il faut pour que
// les navigateurs considèrent l'espace admin comme installable. Un cache des
// données admin serait risqué (personnel du cabinet voyant des données
// obsolètes hors-ligne) — non souhaité ici.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
