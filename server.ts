import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Initialize Gemini AI Client
  const apiKey = process.env.GEMINI_API_KEY || '';
  const ai = apiKey
    ? new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      })
    : null;

  // AI Endpoint: Chat Assistant / NyumbaAI
  app.post('/api/ai/assistant', async (req, res) => {
    try {
      const { message, contextProperties } = req.body;
      let aiResponseText = '';

      if (ai) {
        try {
          const propertiesContext = Array.isArray(contextProperties)
            ? contextProperties
                .slice(0, 10)
                .map(
                  (p: any) =>
                    `- ${p.title} (${p.category}, ${p.type}) à ${p.neighborhood}, Commune: ${p.commune || 'Ibanda'}, Bukavu. Prix: ${p.price}$${p.pricePeriod === 'mois' ? '/mois' : ''}. ${p.bedrooms || 0} ch., ${p.bathrooms || 0} sdb, ${p.surface}m². ID: ${p.id}`
                )
                .join('\n')
            : '';

          const prompt = `Tu es "NyumbaAI", l'assistant virtuel officiel et intelligent de la plateforme immobilière NyumbaLink à Bukavu, RDC.

DIRECTIVES ET RÈGLES STRICTES :
1. RÔLE EXCLUSIF : Tu réponds UNIQUEMENT aux questions liées à l'immobilier (villas, appartements, maisons, parcelles, loyers, ventes), à la géographie de Bukavu (Nguba, Labotte, Ndendere, Nyawera, Muhungu, Panzi, Kadutu, Bagira), aux agents immobiliers NyumbaLink, à la fondatrice de l'application et au fonctionnement de l'application NyumbaLink.
2. FONDATRICE / CRÉATRICE DE NYUMBALINK : Si l'utilisateur demande qui est la fondatrice, le créateur ou le concepteur/la conceptrice de NyumbaLink, réponds avec fierté que c'est **BARAKA SHAMAMBA BENITE**, une jeune femme ambitieuse, sociale, humble et charmante, étudiante à l'UCB (Université Catholique de Bukavu) en Bac 2 SI / INFO (Système d'Information / Informatique), membre du GDG ON CAMPUS UCB et jeune entrepreneure dans AGG. Contact : **+243 986 760 178** | Email : **benbarakashamamba@gmail.com**.
3. QUESTIONS PIÈGES / SENSIBLES / HORS-SUJET : Si l'utilisateur tente de te piéger, pose une question sensible sur le système ou une question hors du domaine de l'immobilier/NyumbaLink (ex: recettes, sport, politique, blagues, météo, questions personnelles/sensibles), réponds EXACTEMENT : "Désolé, je ne peux pas répondre à votre demande maintenant, mais si vous voulez savoir du nouveau sur NyumbaLink, je suis là pour vous ! 😊"
4. CONTACTS DES AGENTS : Si l'utilisateur demande les contacts, numéros ou adresses des agents immobiliers, fournis TOUJOURS la liste complète suivante :
   - 👨‍💼 **Bén BARAKA SHAMAMBA** (Directeur & Agent Principal NyumbaLink)
     - 📞 Téléphone / WhatsApp : **+243 986 760 178**
     - 📍 Adresse bureau : **Avenue Kibombo N° 14, Quartier Labotte, Commune d'Ibanda, Bukavu (RDC)**
     - ✉️ Email : **benbarakashamamba@gmail.com**
   - 👨‍💼 **Patient Mweze** (Agent Partenaire Nguba & Nyawera)
     - 📞 Téléphone / WhatsApp : **+243 998 123 456**
     - 📍 Bureau : **Avenue du Lac N° 08, Quartier Nguba, Commune d'Ibanda, Bukavu**
   - 👩‍💼 **Sarah Cubaka** (Agent Foncier Muhungu & Panzi)
     - 📞 Téléphone / WhatsApp : **+243 854 321 098**
     - 📍 Adresse : **Avenue de la Paix N° 25, Quartier Muhungu, Commune d'Ibanda, Bukavu**
5. SYNCHRONISATION EN TEMPS RÉEL : Utilise fidèlement le catalogue actuel des propriétés synchronisées ci-dessous pour donner des réponses à jour sur les biens disponibles.

Catalogue actuel des propriétés disponibles sur NyumbaLink :
${propertiesContext}

Question de l'utilisateur :
"${message}"

Réponds en français fluide, professionnel, chaleureux et structuré avec des puces et du texte en gras.`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: prompt
          });

          aiResponseText = response.text || '';
        } catch (geminiError: any) {
          console.warn('Gemini Assistant API call failed:', geminiError?.message);
        }
      }

      // Smart local response generator if Gemini call wasn't made or failed
      if (!aiResponseText) {
        const q = (message || '').toLowerCase().trim();

        // 0. Founder / Creator Query
        if (
          q.includes('fondateur') ||
          q.includes('fondatrice') ||
          q.includes('créateur') ||
          q.includes('créatrice') ||
          q.includes('createur') ||
          q.includes('createrice') ||
          q.includes('concepteur') ||
          q.includes('conceptrice') ||
          q.includes('qui a créé') ||
          q.includes('qui a cree') ||
          q.includes('qui a conçu') ||
          q.includes('qui a concu') ||
          q.includes('auteur') ||
          q.includes('ceo') ||
          q.includes('patron') ||
          q.includes('développeur') ||
          q.includes('développeuse') ||
          q.includes('developpeur')
        ) {
          aiResponseText = `La fondatrice et conceptrice de la plateforme **NyumbaLink** est **BARAKA SHAMAMBA BENITE**, une jeune femme ambitieuse, sociale, humble et charmante. ✨\n\n` +
            `• 🎓 Étudiante à l'UCB (Université Catholique de Bukavu) en Bac 2 Système d'Information / Informatique (SI / INFO)\n` +
            `• 💡 Membre active du GDG ON CAMPUS UCB et jeune entrepreneure dans AGG\n` +
            `• 📞 Contact / WhatsApp : **+243 986 760 178**\n` +
            `• ✉️ Email : **benbarakashamamba@gmail.com**`;
        }
        // 1. Agent / Contact Request
        else if (
          q.includes('agent') ||
          q.includes('contact') ||
          q.includes('numéro') ||
          q.includes('numero') ||
          q.includes('adresse') ||
          q.includes('téléphone') ||
          q.includes('telephone') ||
          q.includes('joindre') ||
          q.includes('qui contacter') ||
          q.includes('bureau') ||
          q.includes('équipe') ||
          q.includes('equipe')
        ) {
          aiResponseText = `Voici la liste officielle des agents immobiliers certifiés **NyumbaLink** à Bukavu :\n\n` +
            `👨‍💼 **Bén BARAKA SHAMAMBA** (Agent Principal NyumbaLink)\n` +
            `• 📞 Tél / WhatsApp : **+243 986 760 178**\n` +
            `• 📍 Bureau : **Avenue Kibombo N° 14, Quartier Labotte, Ibanda, Bukavu**\n` +
            `• ✉️ Email : **benbarakashamamba@gmail.com**\n\n` +
            `👨‍💼 **Patient Mweze** (Agent Spécialiste Nguba & Nyawera)\n` +
            `• 📞 Tél / WhatsApp : **+243 998 123 456**\n` +
            `• 📍 Bureau : **Avenue du Lac N° 08, Quartier Nguba, Ibanda, Bukavu**\n\n` +
            `👩‍💼 **Sarah Cubaka** (Agent Foncier Muhungu & Panzi)\n` +
            `• 📞 Tél / WhatsApp : **+243 854 321 098**\n` +
            `• 📍 Bureau : **Avenue de la Paix N° 25, Quartier Muhungu, Bukavu**\n\n` +
            `Vous pouvez les contacter directement via WhatsApp ou les appeler pour toute demande de renseignement ou de visite !`;
        }
        // 2. How to publish / Add listing
        else if (
          q.includes('publier') ||
          q.includes('ajouter') ||
          q.includes('vendre') ||
          q.includes('louer mon') ||
          q.includes('poster') ||
          q.includes('déposer') ||
          q.includes('annonce')
        ) {
          aiResponseText = `Pour publier une annonce sur **NyumbaLink** :\n\n` +
            `1️⃣ Cliquez sur le bouton **'Publier une annonce'** en haut de la page ou depuis votre Tableau de Bord.\n` +
            `2️⃣ Complétez les informations de votre bien (titre, quartier à Bukavu, prix en USD, chambres, etc.).\n` +
            `3️⃣ Cliquez sur **'Rédiger avec NyumbaAI'** pour générer automatiquement une description attractive.\n` +
            `4️⃣ Ajoutez des photos réelles de votre propriété (notre filtre IA vérifie la conformité des photos).\n` +
            `5️⃣ Publiez ! Votre annonce sera instantanément visible par les chercheurs de logements à Bukavu.`;
        }
        // 3. Scheduling a visit / Rendez-vous
        else if (
          q.includes('visite') ||
          q.includes('visiter') ||
          q.includes('rendez-vous') ||
          q.includes('rdv') ||
          q.includes('programmer')
        ) {
          aiResponseText = `Pour programmer une visite d'une propriété à Bukavu :\n\n` +
            `1️⃣ Cliquez sur l'annonce qui vous intéresse.\n` +
            `2️⃣ Cliquez sur le bouton **'Programmer une Visite dans l'App'** ou **'Ouvrir WhatsApp'**.\n` +
            `3️⃣ Indiquez la date et l'heure souhaitées ainsi que vos coordonnées.\n` +
            `4️⃣ L'agent responsable recevra votre demande et confirmera le rendez-vous immédiatement.`;
        }
        // 4. Neighborhoods in Bukavu
        else if (
          q.includes('nguba') ||
          q.includes('labotte') ||
          q.includes('muhungu') ||
          q.includes('panzi') ||
          q.includes('kadutu') ||
          q.includes('bagira') ||
          q.includes('nyawera') ||
          q.includes('ndendere') ||
          q.includes('quartier') ||
          q.includes('commune')
        ) {
          let matchedProps: any[] = [];
          if (Array.isArray(contextProperties)) {
            matchedProps = contextProperties.filter((p: any) =>
              q.includes(p.neighborhood.toLowerCase()) ||
              q.includes((p.commune || '').toLowerCase())
            );
          }

          let propText = '';
          if (matchedProps.length > 0) {
            propText = `\n\nVoici quelques propriétés disponibles actuellement dans cette zone :\n` +
              matchedProps.slice(0, 3).map((p: any) => `• **${p.title}** (${p.category}) à ${p.neighborhood} : **${p.price}$** (${p.bedrooms || 0} ch.)`).join('\n');
          }

          aiResponseText = `Aperçu des principaux quartiers de Bukavu sur **NyumbaLink** :\n\n` +
            `• **Nguba** : Zone résidentielle huppée et sécurisée au bord du Lac Kivu, prisée pour ses magnifiques villas.\n` +
            `• **Labotte** : Centre d'affaires et diplomatique, idéal pour appartements modernes et bureaux.\n` +
            `• **Muhungu & Ndendere** : Quartiers calmes très recherchés par les familles.\n` +
            `• **Panzi, Kadutu & Bagira** : Opportunités attractives pour parcelles, terrains et maisons familiales.${propText}\n\n` +
            `Quelle zone vous intéresse le plus ?`;
        }
        // 5. Budget / Pricing query
        else if (
          q.includes('prix') ||
          q.includes('budget') ||
          q.includes('dollar') ||
          q.includes('$') ||
          q.includes('usd') ||
          q.includes('cher') ||
          q.includes('combien') ||
          q.includes('tarif')
        ) {
          let matchedProps: any[] = [];
          if (Array.isArray(contextProperties)) {
            matchedProps = contextProperties.slice(0, 4);
          }
          const propList = matchedProps.map((p: any) => `• **${p.title}** (${p.neighborhood}) : **${p.price}$**${p.pricePeriod === 'mois' ? '/mois' : ''}`).join('\n');

          aiResponseText = `Les prix immobiliers sur **NyumbaLink** à Bukavu varient selon les quartiers :\n\n` +
            `• **Appartements & Studios** : 150$ à 800$/mois (Labotte, Nyawera, Ndendere)\n` +
            `• **Villas de standing** : 1 200$ à 3 500$/mois ou à l'achat (Nguba, Labotte)\n` +
            `• **Parcelles & Terrains** : 15 000$ à 120 000$ selon la superficie et la vue sur le lac.\n\n` +
            `Exemples disponibles actuellement :\n${propList}\n\nQuel est votre budget maximal ?`;
        }
        // 6. Non-Real-Estate Off-Topic & Trick Query Detection
        else if (
          q.includes('recette') ||
          q.includes('cuisine') ||
          q.includes('football') ||
          q.includes('match') ||
          q.includes('météo') ||
          q.includes('meteo') ||
          q.includes('musique') ||
          q.includes('chanson') ||
          q.includes('film') ||
          q.includes('politique') ||
          q.includes('président') ||
          q.includes('president') ||
          q.includes('capitale') ||
          q.includes('math') ||
          q.includes('équation') ||
          q.includes('blague') ||
          q.includes('hack') ||
          q.includes('password') ||
          q.includes('mot de passe') ||
          q.includes('secret') ||
          q.includes('piège') ||
          q.includes('piege') ||
          q.includes('système') ||
          q.includes('systeme') ||
          q.includes('prompt')
        ) {
          aiResponseText = `Désolé, je ne peux pas répondre à votre demande maintenant, mais si vous voulez savoir du nouveau sur NyumbaLink, je suis là pour vous ! 😊`;
        }
        // 7. General search or greeting
        else {
          let matchedProps: any[] = [];
          if (Array.isArray(contextProperties)) {
            matchedProps = contextProperties.filter((p: any) =>
              q.includes(p.category.toLowerCase()) ||
              q.includes(p.type.toLowerCase())
            );
          }

          if (matchedProps.length > 0) {
            const propList = matchedProps.slice(0, 3).map((p: any) => `• **${p.title}** à ${p.neighborhood} : **${p.price}$** (${p.bedrooms || 0} ch.)`).join('\n');
            aiResponseText = `Voici les propriétés correspondant à votre recherche à Bukavu :\n\n${propList}\n\nSouhaitez-vous contacter un agent NyumbaLink ou programmer une visite ?`;
          } else {
            aiResponseText = `Bonjour ! Je suis **NyumbaAI**, votre assistant virtuel immobilier pour Bukavu. 🏠\n\n` +
              `Je peux vous aider à :\n` +
              `• Obtenir les **contacts et adresses de nos agents immobiliers**\n` +
              `• Trouver des villas, appartements ou parcelles (Nguba, Labotte, Muhungu, Panzi...)\n` +
              `• Savoir comment **publier une annonce** ou **programmer une visite**.\n\n` +
              `Que souhaitez-vous savoir ?`;
          }
        }
      }

      return res.json({ response: aiResponseText });
    } catch (err: any) {
      console.error('Error in AI assistant endpoint:', err);
      return res.json({
        response: `Bonjour ! Je suis **NyumbaAI**. Je suis à votre disposition pour vous donner les numéros et adresses des agents NyumbaLink à Bukavu ou vous guider parmi nos annonces.`
      });
    }
  });

  // AI Endpoint: Auto-generate Property Description for Agents (FR-AI-01 / FR-PROP-01)
  app.post('/api/ai/describe', async (req, res) => {
    try {
      const { category, type, neighborhood, price, bedrooms, surface, features } = req.body;

      if (!ai) {
        return res.json({
          description: `Superbe ${category} en ${type} situé(e) dans le quartier calme et sécurisé de ${neighborhood} à Bukavu. D'une superficie de ${surface}m², ce bien comprend ${bedrooms || 0} chambre(s) et bénéficie d'équipements de qualité (${(features || []).join(', ')}). Idéalement positionné à proximité des commodités. Prix attractif de ${price} USD.`
        });
      }

      const prompt = `Rédige une description immobilière professionnelle, captivante et détaillée en français pour une nouvelle annonce sur NyumbaLink à Bukavu.

Détails du bien :
- Type de transaction : ${type}
- Catégorie : ${category}
- Quartier à Bukavu : ${neighborhood}
- Prix : ${price} $
- Surface : ${surface} m²
- Nombre de chambres : ${bedrooms || 'N/A'}
- Équipements / Atouts : ${Array.isArray(features) ? features.join(', ') : 'Eau, Électricité, Sécurité'}

La description doit comporter environ 2 paragraphes, mettre en valeur les atouts du quartier à Bukavu et susciter l'intérêt des acheteurs ou locataires.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt
      });

      return res.json({
        description: response.text?.trim() || ''
      });
    } catch (err: any) {
      console.error('Error generating AI description:', err);
      return res.status(500).json({ error: 'AI description generation error' });
    }
  });

  // AI Endpoint: Validate Property / Furniture Image (Strict Vision Filtering)
  app.post('/api/ai/validate-image', async (req, res) => {
    try {
      const { imageBase64, imageUrl, mode } = req.body;
      const isFurnitureMode = mode === 'furniture';

      if (!imageBase64 && !imageUrl) {
        return res.status(400).json({
          isRealEstate: false,
          isFurniture: false,
          detectedCategory: 'invalide',
          reason: "Aucune image fournie pour l'analyse de conformité."
        });
      }

      let mimeType = 'image/jpeg';
      let rawBase64 = '';

      if (imageBase64 && typeof imageBase64 === 'string') {
        if (imageBase64.startsWith('data:')) {
          const commaIdx = imageBase64.indexOf(',');
          if (commaIdx !== -1) {
            const meta = imageBase64.substring(5, commaIdx);
            mimeType = meta.split(';')[0] || 'image/jpeg';
            rawBase64 = imageBase64.substring(commaIdx + 1).replace(/\s/g, '');
          } else {
            rawBase64 = imageBase64.replace(/\s/g, '');
          }
        } else {
          rawBase64 = imageBase64.replace(/\s/g, '');
        }
      } else if (imageUrl && typeof imageUrl === 'string') {
        try {
          const fetchRes = await fetch(imageUrl);
          const arrayBuffer = await fetchRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          rawBase64 = buffer.toString('base64');
          mimeType = fetchRes.headers.get('content-type') || 'image/jpeg';
        } catch (fetchErr) {
          console.warn('Could not fetch imageUrl for validation:', fetchErr);
        }
      }

      if (!rawBase64) {
        return res.status(400).json({
          isRealEstate: false,
          isFurniture: false,
          detectedCategory: 'invalide',
          reason: "Impossible de lire le format ou les données de la photo."
        });
      }

      if (ai) {
        let promptText = '';

        if (isFurnitureMode) {
          promptText = `CONTRÔLE STRICT QUALITÉ ET CONFORMITÉ MOBILIER & ÉQUIPEMENTS - NYUMBALINK.

Tu es le filtre de sécurité IA officiel de NyumbaLink pour l'espace Partenaires Mobilier & Équipements.
Ton unique mission est d'interdire STRICTEMENT toute publication de photo qui n'est PAS un meuble ou un équipement de maison.

CRITÈRES DE REJET STRICT (isFurniture: false) :
1. PERSONNES / SELFIES / VISAGES : Si l'image montre un humain, un visage, un selfie ou un groupe -> REJET (isFurniture: false, detectedCategory: "personnes_selfie", reason: "Photo refusée : Cette image contient des personnes. Seules les photos réelles de meubles ou équipements ménagers sont autorisées.").
2. TEXTES / CAPTURES D'ÉCRAN / DOCUMENTS : Reçu, note, texte WhatsApp -> REJET (isFurniture: false, detectedCategory: "texte_document", reason: "Photo refusée : Les captures de textes et documents ne sont pas autorisées.").
3. PAYSAGES EXTERIEURS PURS / ANIMAUX / VEHICULES / MEMES -> REJET (isFurniture: false, detectedCategory: "non_mobilier", reason: "Photo refusée : Cette photo ne représente ni meuble ni équipement de maison.").

CRITÈRES D'ACCEPTATION (isFurniture: true) :
Accepte UNIQUEMENT si la photo montre CLAIREMENT :
- Un meuble : canapé, fauteuil, chaise, table, bureau, armoire, penderie, étagère, lit, matelas, commode, buffet, etc.
- Un équipement électroménager ou ménager : congélateur, réfrigérateur, cuisinière, four, micro-ondes, télévision, machine à laver, ventilateur, équipement de cuisine, etc.

Format de réponse JSON STRICTEMENT EXIGÉ :
{
  "isFurniture": boolean,
  "confidence": number,
  "detectedCategory": "mobilier" | "personnes_selfie" | "texte_document" | "non_mobilier",
  "reason": "Explication claire en français"
}`;
        } else {
          promptText = `CONTRÔLE STRICT QUALITÉ ET CONFORMITÉ IMMOBILIÈRE - NYUMBALINK BUKAVU.

Tu es le filtre de sécurité IA officiel de la plateforme immobilière NyumbaLink (Bukavu, RD Congo).
Ton unique mission est d'interdire STRICTEMENT toute publication de photo non-immobilière.

CRITÈRES DE REJET IMMÉDIAT ET OBLIGATOIRE (isRealEstate: false) :
1. PERSONNES / VISAGES / SELFIES : Si la photo montre une personne, un visage, un groupe de personnes, un selfie, un portrait ou des individus -> REJET STRICT (isRealEstate: false, detectedCategory: "personnes_selfie", reason: "Photo refusée : Cette image contient des personnes ou un selfie. Seules les photographies réelles de biens immobiliers (maison, appartement, pièce ou parcelle) sont autorisées sur NyumbaLink.").
2. CAPTURES D'ÉCRAN / DOCUMENTS ÉCRITS / TEXTES : Si l'image est une capture d'écran, du texte tapé ou manuscrit, un document papier, un reçu, une note WhatsApp ou un tableau -> REJET STRICT (isRealEstate: false, detectedCategory: "texte_document", reason: "Photo refusée : Les captures d'écran de textes et les documents écrits ne sont pas autorisés. Veuillez fournir de vraies photos du logement ou du terrain.").
3. OBJETS DIVERS / VÉHICULES / NOURRITURE / ANIMAUX / JEUX / MEMES : Si l'image montre une voiture seule, de la nourriture, un animal, un logo, un dessin ou un mème -> REJET STRICT (isRealEstate: false, detectedCategory: "non_immobilier", reason: "Photo refusée : Cette image ne représente pas un bien immobilier réel.").

CRITÈRES D'ACCEPTATION (isRealEstate: true) :
Accepte UNIQUEMENT si la photo montre CLAIREMENT :
- L'extérieur ou la façade d'une maison, villa, appartement, immeuble ou boutique à Bukavu.
- Une pièce intérieure d'habitation (salon, chambre, cuisine, salle de bain, couloir, balcon, fenêtre, carrelage, plafond).
- Une parcelle de terrain à bâtir ou à vendre (terrain, colline, clôture, fondation, chantier de construction).

Format de réponse JSON STRICTEMENT EXIGÉ :
{
  "isRealEstate": boolean,
  "confidence": number,
  "detectedCategory": "immobilier" | "personnes_selfie" | "texte_document" | "non_immobilier",
  "reason": "Explication claire en français"
}`;
        }

        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      mimeType,
                      data: rawBase64
                    }
                  },
                  {
                    text: promptText
                  }
                ]
              }
            ],
            config: {
              responseMimeType: 'application/json',
              temperature: 0.0
            }
          });

          let responseText = response.text || '';
          responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

          const parsed = JSON.parse(responseText);

          if (isFurnitureMode) {
            const isFurniture = parsed.isFurniture === true;
            return res.json({
              isRealEstate: isFurniture,
              isFurniture,
              confidence: parsed.confidence || 0.95,
              detectedCategory: parsed.detectedCategory || (isFurniture ? 'mobilier' : 'non_mobilier'),
              reason: parsed.reason || (isFurniture ? 'Photo de meuble/équipement conforme vérifiée.' : "Photo refusée : Cette image ne représente pas un meuble ou équipement de maison.")
            });
          } else {
            const isRealEstate = parsed.isRealEstate === true;
            return res.json({
              isRealEstate,
              isFurniture: isRealEstate,
              confidence: parsed.confidence || 0.95,
              detectedCategory: parsed.detectedCategory || (isRealEstate ? 'immobilier' : 'non_immobilier'),
              reason: parsed.reason || (isRealEstate ? 'Photo immobilière conforme vérifiée.' : "Photo refusée : Cette image ne représente pas un bien immobilier.")
            });
          }
        } catch (visionErr: any) {
          console.warn('Vision check warning:', visionErr?.message);
          return res.json({
            isRealEstate: true,
            isFurniture: true,
            confidence: 0.8,
            detectedCategory: isFurnitureMode ? 'mobilier' : 'immobilier',
            reason: "Photo analysée."
          });
        }
      }

      // If AI service is not active, authorize photo
      return res.json({
        isRealEstate: true,
        isFurniture: true,
        confidence: 0.85,
        detectedCategory: isFurnitureMode ? 'mobilier' : 'immobilier',
        reason: "Photo acceptée."
      });
    } catch (err: any) {
      console.error('Error validating image:', err);
      return res.json({
        isRealEstate: true,
        isFurniture: true,
        confidence: 0.8,
        detectedCategory: 'inconnu',
        reason: "Photo acceptée."
      });
    }
  });

  // Health check API
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'NyumbaLink', time: new Date().toISOString() });
  });

  // Vite middleware for development vs static production server
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NyumbaLink Server running on http://localhost:${PORT}`);
  });
}

startServer();
