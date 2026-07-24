import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { FirebaseService } from '../firebase/firebase.service';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif']);
const MAX_BYTES = 2 * 1024 * 1024;

const SIGNATURES: Record<string, { bytes: number[]; offset: number }[]> = {
  'image/jpeg': [{ bytes: [0xff, 0xd8, 0xff], offset: 0 }],
  'image/png': [
    { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], offset: 0 },
  ],
  'image/gif': [
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], offset: 0 },
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], offset: 0 },
  ],
};

@Injectable()
export class AvatarStorageService {
  private readonly logger = new Logger(AvatarStorageService.name);

  constructor(private readonly firebase: FirebaseService) {}

  async uploadAvatar(
    userId: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    if (!ALLOWED_MIME.has(mimeType)) {
      throw new BadRequestException('Avatar must be a JPG, PNG, or GIF image.');
    }

    this.validateFileSignature(buffer, mimeType);

    if (buffer.length > MAX_BYTES) {
      throw new BadRequestException('Avatar must be 2 MB or smaller.');
    }

    const bucketName = this.firebase.getStorageBucketName();
    if (!bucketName) {
      throw new ServiceUnavailableException(
        'Avatar storage is not configured. Set FIREBASE_STORAGE_BUCKET on the server.',
      );
    }

    const hash = randomBytes(16).toString('hex');
    const ext =
      mimeType === 'image/png'
        ? 'png'
        : mimeType === 'image/gif'
          ? 'gif'
          : 'jpg';
    const objectPath = `avatars/${userId}/${hash}.${ext}`;

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
      return `https://storage.googleapis.com/${bucketName}/${objectPath}`;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Avatar upload failed for ${userId}: ${msg}`);
      throw new ServiceUnavailableException(
        'Could not upload avatar. Check Firebase Storage bucket permissions.',
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
      'File content does not match the declared type.',
    );
  }
}
