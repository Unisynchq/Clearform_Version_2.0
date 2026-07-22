import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { FirebaseService } from '../firebase/firebase.service';

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const MAX_BYTES = 10 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
};

export type ResponseFileUploadResult = {
  url: string;
  storagePath: string;
  name: string;
  size: number;
  type: string;
};

@Injectable()
export class ResponseFileStorageService {
  private readonly logger = new Logger(ResponseFileStorageService.name);

  constructor(private readonly firebase: FirebaseService) {}

  async uploadResponseFile(
    formId: string,
    buffer: Buffer,
    mimeType: string,
    originalName?: string,
  ): Promise<ResponseFileUploadResult> {
    if (!ALLOWED_MIME.has(mimeType)) {
      throw new BadRequestException(
        'File type not allowed. Use PDF, JPG, PNG, GIF, WEBP, DOC, or DOCX.',
      );
    }
    if (buffer.length > MAX_BYTES) {
      throw new BadRequestException('File must be 10 MB or smaller.');
    }

    const bucketName = this.firebase.getStorageBucketName();
    if (!bucketName) {
      throw new ServiceUnavailableException(
        'Response file storage is not configured. Set FIREBASE_STORAGE_BUCKET on the server.',
      );
    }

    const ext = EXT_BY_MIME[mimeType] ?? 'bin';
    const objectId = randomUUID();
    const objectPath = `response-uploads/${formId}/${objectId}.${ext}`;
    const name =
      typeof originalName === 'string' && originalName.trim()
        ? originalName.trim()
        : `upload.${ext}`;

    try {
      const bucket = this.firebase.getStorage().bucket(bucketName);
      const file = bucket.file(objectPath);
      await file.save(buffer, {
        metadata: {
          contentType: mimeType,
          cacheControl: 'public, max-age=3600',
        },
        public: true,
        resumable: false,
      });
      return {
        url: `https://storage.googleapis.com/${bucketName}/${objectPath}`,
        storagePath: objectPath,
        name,
        size: buffer.length,
        type: mimeType,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Response file upload failed for form ${formId}: ${msg}`,
      );
      throw new ServiceUnavailableException(
        'Could not upload file. Check Firebase Storage bucket permissions.',
      );
    }
  }
}
