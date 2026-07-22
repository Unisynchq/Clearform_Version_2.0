import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif']);
const MAX_BYTES = 2 * 1024 * 1024;

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
      throw new BadRequestException(
        'Avatar must be a JPG, PNG, or GIF image.',
      );
    }
    if (buffer.length > MAX_BYTES) {
      throw new BadRequestException('Avatar must be 2 MB or smaller.');
    }

    const bucketName = this.firebase.getStorageBucketName();
    if (!bucketName) {
      throw new ServiceUnavailableException(
        'Avatar storage is not configured. Set FIREBASE_STORAGE_BUCKET on the server.',
      );
    }

    const ext =
      mimeType === 'image/png'
        ? 'png'
        : mimeType === 'image/gif'
          ? 'gif'
          : 'jpg';
    const objectPath = `avatars/${userId}/avatar.${ext}`;

    try {
      const bucket = this.firebase.getStorage().bucket(bucketName);
      const file = bucket.file(objectPath);
      await file.save(buffer, {
        metadata: { contentType: mimeType, cacheControl: 'public, max-age=3600' },
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
}
