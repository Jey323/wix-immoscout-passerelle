// Fichier: netlify/functions/get-listings.cjs

console.log("Chargement du fichier get-listings.cjs");

exports.handler = function(event, context, callback) {
  console.log("Exécution du handler ultra-minimal !");
  
  const response = {
    statusCode: 200,
    headers: { 'Content-Type': 'text/plain' },
    body: "Handler ultra-minimal OK",
  };

  // Utilisation du callback pour la compatibilité avec d'anciens runtimes
  callback(null, response);
};

console.log("Handler exporté depuis get-listings.cjs"); 