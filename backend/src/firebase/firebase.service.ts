import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import { isAbsolute, resolve } from 'path';
import * as admin from 'firebase-admin';

function loadServiceAccount(): admin.ServiceAccount {
  const credentialsJson = process.env.FIREBASE_CREDENTIALS_JSON;
  if (credentialsJson) {
    try {
      return JSON.parse(credentialsJson) as admin.ServiceAccount;
    } catch {
      throw new Error('FIREBASE_CREDENTIALS_JSON is not valid JSON');
    }
  }

  const credentialsPath = process.env.FIREBASE_CREDENTIALS_PATH;
  if (credentialsPath) {
    const resolvedPath = isAbsolute(credentialsPath)
      ? credentialsPath
      : resolve(process.cwd(), credentialsPath);
    try {
      return JSON.parse(
        readFileSync(resolvedPath, 'utf8'),
      ) as admin.ServiceAccount;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(
        `Failed to read Firebase credentials from FIREBASE_CREDENTIALS_PATH (${resolvedPath}): ${message}`,
      );
    }
  }

  throw new Error(
    'Set FIREBASE_CREDENTIALS_JSON or FIREBASE_CREDENTIALS_PATH in environment',
  );
}

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private defaultApp: admin.app.App;

  onModuleInit() {
    // if (admin.apps.length === 0) {
    //   const serviceAccount = loadServiceAccount();
    //
    //   this.defaultApp = admin.initializeApp({
    //     credential: admin.credential.cert(serviceAccount),
    //     storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    //   });
    //   this.logger.log('Firebase Admin SDK initialised');
    // } else {
    //   this.defaultApp = admin.app();
    // }
    this.logger.log('Firebase Admin SDK is temporarily disabled for Supabase migration');
  }

  getAuth() {
    return this.defaultApp.auth();
  }

  getStorage() {
    return this.defaultApp.storage();
  }

  getStorageBucketName(): string | undefined {
    return process.env.FIREBASE_STORAGE_BUCKET;
  }
}
