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

const ai = new GoogleGenAI({ apiKey: getApiKey() });

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
  try {
    let base64Data = '';
    let mimeType = 'image/jpeg';

    if (typeof fileOrBase64OrUrl === 'string') {
      if (fileOrBase64OrUrl.startsWith('http://') || fileOrBase64OrUrl.startsWith('https://')) {
        if (fileOrBase64OrUrl.startsWith('data:')) {
          const parts = fileOrBase64OrUrl.split(',');
          mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
          base64Data = parts[1];
        } else {
          return {
            isRealEstate: true,
            confidence: 0.9,
            detectedCategory: 'immobilier',
            reason: "URL acceptée."
          };
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
          text: `Analyse cette image. Est-ce un bien immobilier (maison, immeuble, villa, appartement, parcelle, terrain) OU un document/papier écrit (contrat, plan, titre foncier) OU une illustration/rendu 3D de maison (provenant d'IA comme ChatGPT ou Gemini) ?
Si OUI (c'est une maison, un bâtiment, une parcelle, un plan ou un document écrit), réponds par true.
Si c'est un selfie, une personne seule, un animal, un véhicule seul ou un appareil électronique sans lien avec l'immobilier, réponds par false.

Réponds STRICTEMENT au format JSON brut, sans markdown, avec ces clés :
{"isRealEstate": true ou false, "confidence": 0.9, "reason": "explication courte"}`
        }
      ]
    });

    const textResponse = response.text?.trim() || '';
    // Nettoyage robuste pour extraire le JSON même si l'IA ajoute des balises
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Format de réponse de l'IA invalide");
    }
    
    const data = JSON.parse(jsonMatch[0]);

    return {
      isRealEstate: Boolean(data.isRealEstate),
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.9,
      detectedCategory: data.isRealEstate ? 'immobilier' : 'non-conforme',
      reason: data.reason || (data.isRealEstate ? 'Image acceptée.' : 'Image refusée : seuls les biens immobiliers, documents et illustrations de maisons sont acceptés.')
    };

  } catch (error: any) {
    console.warn('[ImageValidation] Erreur lors de l’analyse Gemini, basculement sécurisé sur l\'acceptation de l\'image :', error);
    // En cas d'erreur de parsing ou de réseau, on autorise l'image pour éviter de bloquer l'utilisateur inutilement
    return {
      isRealEstate: true,
      confidence: 0.8,
      detectedCategory: 'immobilier',
      reason: "Image acceptée."
    };
  }
}

export async function validateFurnitureImageWithAI(
  fileOrBase64OrUrl: File | string
): Promise<ImageValidationResult> {
  return validatePropertyImageWithAI(fileOrBase64OrUrl);
}