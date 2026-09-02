/**
 * Service pour l'hébergement et la gestion des images immobilières sur Cloudinary
 *
 * Identifiants de l'application NyumbaLink Bukavu :
 * - Cloud Name : irhfemjz
 * - Upload Preset : nyumbalink_preset
 */

const CLOUDINARY_CLOUD_NAME = 'irhfemjz';
const CLOUDINARY_UPLOAD_PRESET = 'nyumbalink_preset';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
}

/**
 * Télécharge un fichier Image (File, Blob ou DataURL Base64) vers Cloudinary
 */
export async function uploadImageToCloudinary(
  fileOrBase64: File | Blob | string,
  onProgress?: (progressPercent: number) => void
): Promise<CloudinaryUploadResult> {
  const formData = new FormData();

  formData.append('file', fileOrBase64);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'nyumbalink_properties');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', CLOUDINARY_UPLOAD_URL, true);

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({
            url: data.secure_url || data.url,
            publicId: data.public_id,
            format: data.format,
            width: data.width,
            height: data.height
          });
        } catch (err) {
          reject(new Error('Erreur lors de la lecture de la réponse Cloudinary.'));
        }
      } else {
        let errorMsg = `Erreur Cloudinary (Code ${xhr.status})`;
        try {
          const errRes = JSON.parse(xhr.responseText);
          if (errRes.error?.message) {
            errorMsg = `Cloudinary: ${errRes.error.message}`;
          }
        } catch (_) {}
        reject(new Error(errorMsg));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Erreur réseau lors de l\'envoi de l\'image vers Cloudinary. Veuillez vérifier votre connexion.'));
    };

    xhr.send(formData);
  });
}
