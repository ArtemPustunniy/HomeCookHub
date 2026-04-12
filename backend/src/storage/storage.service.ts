import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { nanoid } from 'nanoid'

@Injectable()
export class StorageService {
  private readonly log = new Logger(StorageService.name)
  private client: S3Client | null = null

  constructor(private config: ConfigService) {
    const bucket = this.config.get<string>('S3_BUCKET')
    const region = this.config.get<string>('S3_REGION') ?? 'ru-central1'
    const endpoint = this.config.get<string>('S3_ENDPOINT')
    const accessKeyId = this.config.get<string>('S3_ACCESS_KEY_ID')
    const secretAccessKey = this.config.get<string>('S3_SECRET_ACCESS_KEY')
    if (bucket && accessKeyId && secretAccessKey) {
      this.client = new S3Client({
        region,
        endpoint: endpoint || undefined,
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle: !!endpoint,
      })
    } else {
      this.log.warn('S3 not configured')
    }
  }

  async uploadPublicImage(buffer: Buffer, mime: string, originalName: string): Promise<{ url: string; key: string }> {
    if (!this.client) {
      throw new ServiceUnavailableException('Object storage is not configured')
    }
    const bucket = this.config.get<string>('S3_BUCKET')!
    const ext = originalName.includes('.') ? originalName.slice(originalName.lastIndexOf('.')) : ''
    const key = `uploads/${nanoid(12)}${ext}`
    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: mime || 'application/octet-stream',
      }),
    )
    const base = this.config.get<string>('S3_PUBLIC_BASE_URL')?.replace(/\/$/, '') || ''
    const url = base ? `${base}/${key}` : key
    return { url, key }
  }
}
