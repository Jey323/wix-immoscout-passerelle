const axios = require('axios');
const cheerio = require('cheerio');

// !! IMPORTANT : Remplacez ceci par l'URL EXACTE de la page ImmoScout
// où les biens de votre amie sont listés (sa page profil ou agence)
const IMMOSCOUT_PROFILE_URL = 'https://www.immoscout24.ch/regie/h268686/s-immobilier-sarl';

exports.handler = async function(event, context) {
    try {
        const { data } = await axios.get(IMMOSCOUT_PROFILE_URL, {
            headers: {
                // --- En-têtes importants pour essayer de ressembler à un navigateur ---
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36', // Un User-Agent de Chrome récent
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7', // Adaptez si besoin (ex: de-CH)
                'Accept-Encoding': 'gzip, deflate, br', // Indique qu'on accepte la compression
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none', // Ou 'cross-site' si la navigation vient d'ailleurs
                'Sec-Fetch-User': '?1',
                'Cache-Control': 'max-age=0',
                // Ajouter un Referer peut parfois aider, mais peut aussi être suspect si mal utilisé
                // 'Referer': 'https://www.google.com/',
            }
        });

        const $ = cheerio.load(data);

        // ... (Le reste de votre code d'extraction avec Cheerio reste identique) ...
        const properties = [];
        $('.result-list-entry__data, .result-list-item__infos--standard').each((index, element) => {
             // ... (votre logique d'extraction ici) ...
             const $element = $(element);
             const title = $element.find('h3 a, .heading-2 a').first().text().trim();
             const price = $element.find('.font-bold.font-xl-s').first().text().trim();
             let imageUrl = $element.find('.result-list-entry__gallery img').attr('src') || $element.find('.result-list-entry__gallery img').attr('data-src');
             let propertyUrl = $element.find('a.result-list-entry__link, a.result-list-item__link').attr('href');

             if (propertyUrl && !propertyUrl.startsWith('http')) {
                 propertyUrl = new URL(propertyUrl, 'https://www.immoscout24.ch').href;
             }
              if (imageUrl && imageUrl.startsWith('/')) {
                  imageUrl = new URL(imageUrl, 'https://www.immoscout24.ch').href;
              }

             if (title && propertyUrl) {
                 properties.push({
                     title: title,
                     price: price || 'Prix sur demande',
                     imageUrl: imageUrl || null,
                     url: propertyUrl
                 });
             }
        });


        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify(properties),
        };

    } catch (error) {
        console.error('Erreur de scraping:', error.message);
        // Si l'erreur vient d'axios et a une réponse (comme le 403)
        if (error.response) {
             console.error('Status Code:', error.response.status);
             console.error('Headers:', error.response.headers);
             // Retourner un message plus spécifique si possible
              return {
                statusCode: error.response.status, // Renvoyer le code d'erreur réel
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({ error: 'ImmoScout a refusé l\'accès (Probablement blocage de bot).', details: `Request failed with status code ${error.response.status}` }),
             };
        }
        // Erreur générique si autre chose s'est mal passé
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