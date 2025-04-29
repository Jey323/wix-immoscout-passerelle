const axios = require('axios');
const cheerio = require('cheerio');

// !! IMPORTANT : Remplacez ceci par l'URL EXACTE de la page ImmoScout
// où les biens de votre amie sont listés (sa page profil ou agence)
const IMMOSCOUT_PROFILE_URL = 'https://www.immoscout24.ch/regie/h268686/s-immobilier-sarl';

exports.handler = async function(event, context) {
    try {
        // 1. Récupérer le HTML de la page ImmoScout
        const { data } = await axios.get(IMMOSCOUT_PROFILE_URL, {
             // Ajouter des headers peut parfois aider à éviter les blocages simples
             headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        // 2. Charger le HTML dans Cheerio
        const $ = cheerio.load(data);

        // 3. Identifier les Sélecteurs CSS (C'EST LA PARTIE CRUCIALE ET FRAGILE)
        //    -> Inspectez la page ImmoScout avec les outils de développement de votre navigateur
        //    -> Trouvez les éléments HTML qui contiennent chaque annonce et les infos spécifiques.
        //    -> Remplacez les '.selector-...' ci-dessous par les vrais sélecteurs CSS.

        const properties = [];
        // Exemple : si chaque bien est dans une <article class="result-list-entry">
        $('.result-list-entry__data, .result-list-item__infos--standard').each((index, element) => { // Adaptez ce sélecteur principal !
            const $element = $(element);

            // Trouvez le titre (souvent dans un h3 ou h4)
            const title = $element.find('h3 a, .heading-2 a').first().text().trim(); // Adaptez

            // Trouvez le prix (peut être dans un div/span spécifique)
            const price = $element.find('.font-bold.font-xl-s').first().text().trim(); // Adaptez

            // Trouvez l'URL de l'image principale (souvent une balise <img> dans un conteneur)
            // Attention aux images chargées dynamiquement (data-src)
            let imageUrl = $element.find('.result-list-entry__gallery img').attr('src'); // Adaptez
             if (!imageUrl) {
                imageUrl = $element.find('.result-list-entry__gallery img').attr('data-src'); // Essayer data-src
             }

            // Trouvez le lien vers l'annonce (souvent sur le titre ou l'image)
            let propertyUrl = $element.find('a.result-list-entry__link, a.result-list-item__link').attr('href'); // Adaptez

            // Assurer que l'URL est absolue
            if (propertyUrl && !propertyUrl.startsWith('http')) {
                propertyUrl = new URL(propertyUrl, 'https://www.immoscout24.ch').href; // Ajustez le domaine si nécessaire (.fr, .de)
            }

             // Assurer que l'URL de l'image est absolue si nécessaire (moins courant)
            if (imageUrl && imageUrl.startsWith('/')) {
                 imageUrl = new URL(imageUrl, 'https://www.immoscout24.ch').href; // Ajustez le domaine
            }


            // Ajouter le bien à la liste si on a les infos essentielles
            if (title && propertyUrl) {
                properties.push({
                    title: title,
                    price: price || 'Prix sur demande', // Mettre une valeur par défaut
                    imageUrl: imageUrl || null, // Peut être null si non trouvée
                    url: propertyUrl
                });
            }
        });

        // 4. Renvoyer les données en JSON
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                // Important pour permettre à Wix d'appeler cette fonction depuis le navigateur
                'Access-Control-Allow-Origin': '*', // Pour simplifier, ou mettez l'URL de votre site Wix
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify(properties),
        };

    } catch (error) {
        console.error('Erreur de scraping:', error.message);
        // Renvoyer une erreur claire
        return {
            statusCode: 500,
             headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ error: 'Impossible de récupérer les données ImmoScout.', details: error.message }),
        };
    }
};