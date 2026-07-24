import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { FirebaseService } from '../firebase/firebase.service';

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

const MAX_BYTES_TIER: Record<string, number> = {
  free: 5 * 1024 * 1024,
  pilot: 10 * 1024 * 1024,
  pro: 25 * 1024 * 1024,
};

const SIGNATURES: Record<string, { bytes: number[]; offset: number }[]> = {
  'application/pdf': [{ bytes: [0x25, 0x50, 0x44, 0x46], offset: 0 }],
  'image/jpeg': [{ bytes: [0xff, 0xd8, 0xff], offset: 0 }],
  'image/png': [
    { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], offset: 0 },
  ],
  'image/gif': [
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], offset: 0 },
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], offset: 0 },
  ],
  'image/webp': [
    { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
    { bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 },
  ],
};

const EXT_BY_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
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
    tier: string = 'free',
  ): Promise<ResponseFileUploadResult> {
    if (!ALLOWED_MIME.has(mimeType)) {
      throw new BadRequestException(
        'File type not allowed. Use PDF, JPG, PNG, GIF, or WEBP.',
      );
    }

    this.validateFileSignature(buffer, mimeType);

    const maxBytes = MAX_BYTES_TIER[tier] ?? MAX_BYTES_TIER.free;
    if (buffer.length > maxBytes) {
      throw new BadRequestException(
        `File exceeds the ${(maxBytes / 1024 / 1024).toFixed(0)} MB limit for your plan.`,
      );
    }

    const bucketName = this.firebase.getStorageBucketName();
    if (!bucketName) {
      throw new ServiceUnavailableException(
        'Response file storage is not configured. Set FIREBASE_STORAGE_BUCKET on the server.',
      );
    }

    const ext = EXT_BY_MIME[mimeType] ?? 'bin';
    const hash = randomBytes(32).toString('hex');
    const objectPath = `response-uploads/${formId}/${hash}.${ext}`;
    const sanitizedName =
      typeof originalName === 'string' && originalName.trim()
        ? originalName
            .trim()
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .slice(0, 255)
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
        name: sanitizedName,
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

  private validateFileSignature(buffer: Buffer, mimeType: string): void {
    const signatures = SIGNATURES[mimeType];
    if (!signatures) return;

    for (const sig of signatures) {
      const matches = sig.bytes.every((byte, idx) => {
        const bufIdx = sig.offset + idx;
        return bufIdx < buffer.length && buffer[bufIdx] === byte;
      });
      if (matches) return;
    }

    throw new BadRequestException(
      'File content does not match the declared type. File rejected.',
    );
  }
}
