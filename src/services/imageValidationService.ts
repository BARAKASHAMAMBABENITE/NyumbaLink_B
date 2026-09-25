/**
 * Service de validation intelligente IA des images immobilières pour NyumbaLink Bukavu via Gemini Vision
 */

import { GoogleGenAI } from "@google/genai";

export interface ImageValidationResult {
  isRealEstate: boolean;
  isFurniture?: boolean;
  confidence: number;
  detectedCategory: string;
  reason: string;
}

const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process.env?.REACT_APP_GEMINI_API_KEY) {
      return process.env.REACT_APP_GEMINI_API_KEY;
    }
  } catch (e) {}
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_GEMINI_API_KEY;
    }
  } catch (e) {}
  return '';
};

export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64Data = reader.result.includes(',') 
          ? reader.result.split(',')[1] 
          : reader.result;
        resolve(base64Data);
      } else {
        reject(new Error('Échec de la conversion du fichier en base64.'));
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export async function validatePropertyImageWithAI(
  fileOrBase64OrUrl: File | string
): Promise<ImageValidationResult> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return { isRealEstate: true, confidence: 0.8, detectedCategory: 'immobilier', reason: "Accepté par défaut" };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    let base64Data = '';
    let mimeType = 'image/jpeg';

    if (typeof fileOrBase64OrUrl === 'string') {
      if (fileOrBase64OrUrl.startsWith('http://') || fileOrBase64OrUrl.startsWith('https://')) {
        if (fileOrBase64OrUrl.startsWith('data:')) {
          const parts = fileOrBase64OrUrl.split(',');
          mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
          base64Data = parts[1];
        } else {
          return { isRealEstate: true, confidence: 0.9, detectedCategory: 'immobilier', reason: "URL acceptée" };
        }
      } else {
        base64Data = fileOrBase64OrUrl.includes(',') ? fileOrBase64OrUrl.split(',')[1] : fileOrBase64OrUrl;
      }
    } else {
      mimeType = fileOrBase64OrUrl.type || 'image/jpeg';
      base64Data = await fileToBase64(fileOrBase64OrUrl);
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        },
        {
          text: `RÈGLE DE SÉCURITÉ ANTI-PERSONNES : Analyse le sujet PRINCIPAL de cette image.
- Est-ce que le sujet principal est une personne qui pose (portrait, selfie, individu en gros plan ou en plan moyen, même s'il se trouve devant une porte, un mur ou un bâtiment) ? Si OUI, réponds STRICTEMENT : {"isRealEstate": false, "confidence": 1.0, "reason": "Personne interdite"}
- Est-ce un animal ou de la nourriture/un plat ? Si OUI, réponds : {"isRealEstate": false, "confidence": 1.0, "reason": "Interdit"}
- Pour tout le reste (vues de maisons, pièces, salons, chantiers, briques, tôles, parcelles, plans, rues sans personne au premier plan), réponds : {"isRealEstate": true, "confidence": 1.0, "reason": "Accepté"}

Réponds UNIQUEMENT sous forme d'un objet JSON pur, sans markdown, sans texte autour :
{"isRealEstate": true ou false, "confidence": 1.0, "reason": "explication"}`
        }
      ],
      config: {
        temperature: 0,
      }
    });

    const textResponse = response.text?.trim() || '';
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return { isRealEstate: true, confidence: 0.8, detectedCategory: 'immobilier', reason: "Accepté par défaut" };
    }
    
    const data = JSON.parse(jsonMatch[0]);

    return {
      isRealEstate: Boolean(data.isRealEstate),
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.9,
      detectedCategory: data.isRealEstate ? 'immobilier' : 'non-conforme',
      reason: data.isRealEstate ? 'Accepté' : 'Refusé : Les photos de personnes (portraits/selfies) ne sont pas autorisées.'
    };

  } catch (error: any) {
    console.warn('[ImageValidation] Erreur lors de l’analyse Gemini :', error);
    return {
      isRealEstate: true,
      confidence: 0.7,
      detectedCategory: 'immobilier',
      reason: "Accepté par défaut"
    };
  }
}

export async function validateFurnitureImageWithAI(
  fileOrBase64OrUrl: File | string
): Promise<ImageValidationResult> {
  return validatePropertyImageWithAI(fileOrBase64OrUrl);
}