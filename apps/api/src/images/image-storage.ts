import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { ServiceUnavailableException } from '@nestjs/common';
import type { R2Config } from '../env.js';

/** Object keys are random, so a stored image never changes and can be cached forever. */
const IMMUTABLE = 'public, max-age=31536000, immutable';

/** Stores processed images. Injected by class; ImagesModule picks the implementation from env. */
export abstract class ImageStorage {
  /** Saves the image and returns the URL it is served from. */
  abstract put(key: string, body: Buffer, contentType: string): Promise<string>;

  /** Key of an image this storage serves, or null for any other URL (e.g. seed paths). */
  abstract keyOf(url: string): string | null;

  abstract delete(key: string): Promise<void>;
}

/** Cloudflare R2 through its S3-compatible API, served from the bucket's public URL. */
export class R2ImageStorage extends ImageStorage {
  private readonly client: S3Client;

  constructor(private readonly config: R2Config) {
    super();
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async put(key: string, body: Buffer, contentType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: IMMUTABLE,
      }),
    );
    return `${this.config.publicUrl}/${key}`;
  }

  keyOf(url: string): string | null {
    const prefix = `${this.config.publicUrl}/`;
    return url.startsWith(prefix) ? url.slice(prefix.length) : null;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }),
    );
  }
}

/**
 * Without R2: keeps images in a local folder, served by UploadsController. URLs are paths
 * under the web app's /api proxy, so the site and next/image load them like seed images.
 * Refuses uploads in production, where the container's disk does not persist.
 */
export class LocalImageStorage extends ImageStorage {
  static readonly URL_PREFIX = '/api/uploads/';
  private readonly root: string;

  constructor(dir: string) {
    super();
    this.root = resolve(dir);
  }

  async put(key: string, body: Buffer): Promise<string> {
    if (process.env.NODE_ENV === 'production') {
      throw new ServiceUnavailableException(
        'O envio de imagens está indisponível no momento. Tente de novo mais tarde.',
      );
    }
    const path = this.pathOf(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body);
    return `${LocalImageStorage.URL_PREFIX}${key}`;
  }

  keyOf(url: string): string | null {
    return url.startsWith(LocalImageStorage.URL_PREFIX)
      ? url.slice(LocalImageStorage.URL_PREFIX.length)
      : null;
  }

  async delete(key: string): Promise<void> {
    await rm(this.pathOf(key), { force: true });
  }

  /** The file's contents, or null when it does not exist. */
  async read(key: string): Promise<Buffer | null> {
    try {
      return await readFile(this.pathOf(key));
    } catch {
      return null;
    }
  }

  private pathOf(key: string): string {
    const path = resolve(this.root, key);
    if (!path.startsWith(this.root + sep)) {
      throw new Error(`Key outside the uploads folder: ${key}`);
    }
    return path;
  }
}
