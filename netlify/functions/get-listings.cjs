// Fichier: netlify/functions/get-listings.cjs

// Handler minimal pour tester si l'export est reconnu
exports.handler = async (event, context) => {
  console.log("Exécution du handler minimal !");
  
  // Simule une réponse simple
  const response = {
    message: "Le handler minimal fonctionne !"
  };

  return {
    statusCode: 200,
    headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Gardons le CORS pour la cohérence
     },
    body: JSON.stringify(response),
  };
}; 