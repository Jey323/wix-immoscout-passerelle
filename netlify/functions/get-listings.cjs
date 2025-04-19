const { OAuth } = require('oauth');
const { parseStringPromise } = require('xml2js');

// Revenir à la syntaxe CommonJS
exports.handler = async (event, context) => {
  // 1. Récupérer les clés depuis les variables d'environnement
  const { 
    IMMO_CONSUMER_KEY,
    IMMO_CONSUMER_SECRET,
    IMMO_ACCESS_TOKEN,
    IMMO_ACCESS_TOKEN_SECRET 
  } = process.env;

  if (!IMMO_CONSUMER_KEY || !IMMO_CONSUMER_SECRET || !IMMO_ACCESS_TOKEN || !IMMO_ACCESS_TOKEN_SECRET) {
    console.error("Erreur: Variables d'environnement Immoscout manquantes.");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Configuration serveur incomplète." }),
    };
  }

  // 2. Initialiser OAuth avec les 4 clés
  const oauth = new OAuth(
    null, // requestTokenUrl - non nécessaire ici
    null, // accessTokenUrl - non nécessaire ici
    IMMO_CONSUMER_KEY,
    IMMO_CONSUMER_SECRET,
    '1.0', // Utiliser "1.0" comme vu précédemment
    null, // loginCallback - non nécessaire ici
    'HMAC-SHA1'
  );

  // 3. Définir l'URL de l'API Immoscout pour récupérer les annonces de l'utilisateur
  // Utiliser 'me' pour l'utilisateur authentifié par le token d'accès.
  // Important : Utiliser l'API de production (sans sandbox-)
  const apiUrl = 'https://rest.immobilienscout24.de/restapi/api/offer/v1.0/user/me/realestate';

  try {
    // 4. Faire la requête GET authentifiée à Immoscout
    console.log(`Appel de l'API Immoscout: ${apiUrl}`);
    const xmlData = await new Promise((resolve, reject) => {
      oauth.get(
        apiUrl,
        IMMO_ACCESS_TOKEN, // Token d'accès utilisateur
        IMMO_ACCESS_TOKEN_SECRET, // Secret du token d'accès
        (error, data, response) => {
          if (error) {
            console.error('Erreur API Immoscout:', error.statusCode, error.data);
            // Essayer de parser l'erreur si c'est du XML
            if (error.data) {
              parseStringPromise(error.data, { explicitArray: false, ignoreAttrs : true })
                .then(parsedError => reject({ statusCode: error.statusCode, body: parsedError }))
                .catch(() => reject({ statusCode: error.statusCode, body: error.data })); // Rejeter avec les données brutes si le parsing échoue
            } else {
               reject({ statusCode: error.statusCode || 500, body: "Erreur inconnue lors de la requête à Immoscout." });
            }
          } else {
            console.log('Réponse brute d\'Immoscout reçue (XML):', data);
            resolve(data); // Résoudre avec les données XML
          }
        }
      );
    });

    // 5. Parser la réponse XML en JSON
    console.log('Parsing de la réponse XML...');
    const parsedJson = await parseStringPromise(xmlData, { 
        explicitArray: false, // Ne pas créer de tableau pour les éléments uniques
        ignoreAttrs: true, // Ignorer les attributs XML (simplifie la structure)
        emptyTag: null, // Remplacer les tags vides par null
        valueProcessors: [ // Essayer de convertir les nombres et booléens
            (value, name) => {
                if (!isNaN(value) && value.trim() !== '') return Number(value);
                if (value === 'true') return true;
                if (value === 'false') return false;
                return value;
            }
        ],
        // Vous pourriez avoir besoin d'ajuster les options de parsing
        // en fonction de la structure XML exacte d'Immoscout
        // Par exemple, si les annonces sont dans realEstates.realEstateEntry
        // tagNameProcessors: [/* ... */],
    });

    console.log('Données JSON parsées:', JSON.stringify(parsedJson, null, 2));

    // 6. Extraire et formater les annonces (À adapter selon la structure réelle)
    let listings = [];
    // La structure exacte dépend de la réponse d'Immoscout.
    // Inspectez le log `parsedJson` pour voir où se trouvent les annonces.
    // Exemple possible : si les annonces sont dans un objet `realestates` contenant une liste `realEstate`
    if (parsedJson && parsedJson['realestates.realEstates'] && parsedJson['realestates.realEstates']['realEstateList'] && Array.isArray(parsedJson['realestates.realEstates']['realEstateList']['realEstateElement'])) {
        listings = parsedJson['realestates.realEstates']['realEstateList']['realEstateElement'].map(item => ({
            // Adapter ces champs aux noms réels dans le JSON parsé
            id: item['@id'] || item.id, 
            title: item.title,
            // ... autres champs dont vous avez besoin (prix, description, images, etc.)
            // price: item.price ? item.price.value : null,
            // currency: item.price ? item.price.currency : null,
            // description: item.descriptionNote ? item.descriptionNote.text : null,
            // ... etc.
        }));
    } else if (parsedJson && parsedJson['realestates.realEstates'] && parsedJson['realestates.realEstates']['realEstateList'] && parsedJson['realestates.realEstates']['realEstateList']['realEstateElement']) {
        // Cas où il n'y a qu'une seule annonce
        const item = parsedJson['realestates.realEstates']['realEstateList']['realEstateElement'];
         listings = [{
            id: item['@id'] || item.id, 
            title: item.title,
            // ... autres champs
        }];
    } else {
      console.warn("Structure JSON inattendue reçue d'Immoscout. Incapable d'extraire les annonces.", parsedJson);
    }

    // 7. Retourner la réponse JSON
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Autoriser les requêtes depuis n'importe quelle origine (pour Wix)
      },
      body: JSON.stringify(listings),
    };

  } catch (error) {
    console.error("Erreur interne du serveur:", error);
    return {
      statusCode: error.statusCode || 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: "Erreur interne du serveur lors de la récupération des annonces.",
        details: error.body || error.message // Inclure les détails si disponibles
      }),
    };
  }
}; 