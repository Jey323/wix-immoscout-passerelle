# Passerelle Immoscout vers Wix

## Description

Ce projet met en place un serveur API simple, hébergé sur Netlify, servant de passerelle entre les données immobilières d'un client sur Immoscout24 et son site web Wix. L'API récupère périodiquement (ou sur demande, selon l'implémentation) les biens immobiliers publiés par le client sur Immoscout et les expose via un point d'accès (endpoint) JSON public, sans authentification. Le site Wix peut ensuite interroger cette API pour afficher les biens à jour.

## Fonctionnement

1.  **Récupération des données :** Le serveur (fonction Netlify) interroge l'API Immoscout24 pour obtenir la liste des biens immobiliers associés au compte du client. (Note : L'accès à l'API Immoscout peut nécessiter des clés d'API ou une authentification spécifique qui doivent être configurées côté serveur).
2.  **Exposition via API :** Les données récupérées sont formatées et mises à disposition via un endpoint HTTP GET public sur Netlify.
3.  **Consommation par Wix :** Le site Wix utilise du code Velo (ou des fonctionnalités Wix natives si possible) pour faire une requête HTTP vers l'endpoint de l'API Netlify et afficher les informations des biens.

## Configuration

Avant le déploiement, assurez-vous de configurer les variables d'environnement nécessaires sur Netlify. Celles-ci peuvent inclure :

*   `IMMOSCOUT_API_KEY`: Votre clé API pour Immoscout.
*   `IMMOSCOUT_API_SECRET`: Votre secret API pour Immoscout.
*   `IMMOSCOUT_USERNAME` ou `CLIENT_ID`: Identifiant du compte Immoscout dont il faut récupérer les biens.

*(Adaptez ces variables en fonction de la méthode d'authentification réellement utilisée avec l'API Immoscout)*

## Déploiement sur Netlify

1.  Connectez votre dépôt Git (GitHub, GitLab, Bitbucket) à Netlify.
2.  Configurez le build command (si nécessaire, par exemple `npm install`).
3.  Indiquez le répertoire de publication (généralement `.` ou un répertoire `dist`/`public`).
4.  Configurez les variables d'environnement mentionnées ci-dessus dans les paramètres du site Netlify (`Site settings > Build & deploy > Environment`).
5.  Déployez le site. Netlify attribuera une URL publique à votre fonction API.

## Endpoint de l'API

*   **URL :** `[URL_NETLIFY]/.netlify/functions/[NOM_DE_LA_FONCTION]` (remplacez `[URL_NETLIFY]` et `[NOM_DE_LA_FONCTION]`)
*   **Méthode :** `GET`
*   **Authentification :** Aucune
*   **Réponse :** JSON contenant un tableau d'objets, chaque objet représentant un bien immobilier avec ses détails pertinents (titre, prix, description, images, etc.).

Exemple de réponse (structure indicative) :

```json
[
  {
    "id": "12345",
    "title": "Bel appartement T3 lumineux",
    "price": 350000,
    "currency": "EUR",
    "description": "...",
    "images": ["url1", "url2"],
    "address": { ... },
    // ... autres champs pertinents
  },
  {
    "id": "67890",
    "title": "Maison avec jardin",
    // ...
  }
]
```

## Utilisation sur Wix

Sur le site Wix, utilisez le code Velo by Wix pour effectuer une requête `fetch` vers l'URL de l'API Netlify. Traitez la réponse JSON pour afficher dynamiquement les biens sur les pages souhaitées.

```javascript
// Exemple Velo by Wix (à adapter)
import { fetch } from 'wix-fetch';

$w.onReady(function () {
  fetch("[URL_NETLIFY]/.netlify/functions/[NOM_DE_LA_FONCTION]", { method: 'get' })
    .then((httpResponse) => {
      if (httpResponse.ok) {
        return httpResponse.json();
      } else {
        return Promise.reject("Fetch did not succeed");
      }
    })
    .then((listings) => {
      console.log(listings);
      // Mettez ici le code pour afficher les biens dans un repeater Wix ou autre
      // $w('#myRepeater').data = listings;
    })
    .catch(err => console.error(err));
});
``` 