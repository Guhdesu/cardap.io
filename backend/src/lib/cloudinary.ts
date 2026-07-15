import { v2 as cloudinary } from 'cloudinary';

// Configura o SDK do Cloudinary usando as variáveis de ambiente
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

/**
 * Envia um buffer de arquivo para o Cloudinary usando stream.
 * Aplica transformações recomendadas: largura máx 600px, qualidade auto, formato auto (WebP).
 */
export function uploadToCloudinary(fileBuffer: Buffer): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'cardapio',
        transformation: [
          { width: 600, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        if (!result) {
          return reject(new Error('Erro no retorno do Cloudinary.'));
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Remove um recurso do Cloudinary com base no seu publicId.
 */
export function deleteFromCloudinary(publicId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });
  });
}
