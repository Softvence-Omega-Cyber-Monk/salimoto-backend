import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private readonly logger = new Logger(S3Service.name); // 👈 Use NestJS Logger

  constructor(private configService: ConfigService) {
    const awsRegion = this.configService.get<string>('AWS_REGION');
    const awsAccessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const awsSecretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );
    const awsBucket = this.configService.get<string>('AWS_S3_BUCKET');

    // Validate required env vars
    if (!awsRegion || !awsAccessKeyId || !awsSecretAccessKey || !awsBucket) {
      throw new InternalServerErrorException(
        'Missing required AWS environment variables: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, or AWS_S3_BUCKET',
      );
    }

    const s3Config: S3ClientConfig = {
      region: awsRegion,
      credentials: {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
      },
    };

    this.s3Client = new S3Client(s3Config);
  }

  extractKeyFromUrl(url: string): string {
    const bucket = this.configService.get<string>('AWS_S3_BUCKET');
    const region = this.configService.get<string>('AWS_REGION');

    // Expected format: https://<bucket>.s3.<region>.amazonaws.com/<key>
    const expectedPrefix = `https://${bucket}.s3.${region}.amazonaws.com/`;

    if (!url.startsWith(expectedPrefix)) {
      throw new InternalServerErrorException('URL does not belong to this S3 bucket');
    }

    const key = url.substring(expectedPrefix.length);
    if (!key) {
      throw new InternalServerErrorException('Invalid S3 URL: no key found');
    }

    return key;
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    if (!file) {
      throw new InternalServerErrorException('No file provided for upload');
    }

    const fileExtension = file.originalname.split('.').pop();
    if (!fileExtension) {
      throw new InternalServerErrorException(
        'Unable to determine file extension',
      );
    }

    const key = `${folder}/${uuidv4()}.${fileExtension}`;
    const bucket = this.configService.get<string>('AWS_S3_BUCKET');
    const region = this.configService.get<string>('AWS_REGION');

    this.logger.log(
      `Attempting to upload file to S3: ${key} (bucket: ${bucket}, region: ${region})`,
    );

    try {
      const parallelUpload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: bucket!,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        },
      });

      await parallelUpload.done();

      const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
      this.logger.log(`File uploaded successfully. Public URL: ${url}`);
      return url;
    } catch (error) {
      // 🔥 Log the FULL error with type and message
      this.logger.error(
        `S3 upload failed for key "${key}"`,
        {
          errorName: error?.name,
          errorMessage: error?.message,
          errorStack: error?.stack,
          bucket,
          region,
          fileSize: file.buffer.length,
          fileType: file.mimetype,
          originalName: file.originalname,
        },
        'S3Service.uploadFile',
      );

      // Re-throw so controller can handle it
      throw new InternalServerErrorException(
        'Failed to upload image to cloud storage. Please try again.',
      );
    }
  }

  async uploadAudio(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new InternalServerErrorException('No audio file provided');
    }

    // Optional: validate MIME type
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/x-wav'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new InternalServerErrorException('Invalid audio file type');
    }

    const fileExtension = file.originalname.split('.').pop();
    if (!fileExtension) {
      throw new InternalServerErrorException('Unable to determine file extension');
    }

    const key = `audios/${uuidv4()}.${fileExtension}`;
    const bucket = this.configService.get<string>('AWS_S3_BUCKET');
    const region = this.configService.get<string>('AWS_REGION');

    this.logger.log(`Uploading audio to S3: ${key}`);

    try {
      const parallelUpload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: bucket!,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        },
      });

      await parallelUpload.done();

      const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
      this.logger.log(`Audio uploaded successfully: ${url}`);
      return url;
    } catch (error) {
      this.logger.error(
        `Audio upload failed`,
        { error: error?.message, stack: error?.stack },
        'S3AudioService.uploadAudio',
      );
      throw new InternalServerErrorException('Failed to upload audio file');
    }
  }

  async uploadVideo(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new InternalServerErrorException('No video file provided');
    }

    // Define allowed video MIME types (adjust as needed)
    const allowedTypes = [
      'video/mp4',
      'video/quicktime', // .mov
      'video/x-msvideo', // .avi
      'video/x-matroska', // .mkv
      'video/webm',
      'video/ogg',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new InternalServerErrorException(
        `Invalid video file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }

    const fileExtension = file.originalname.split('.').pop();
    if (!fileExtension) {
      throw new InternalServerErrorException('Unable to determine file extension');
    }

    const key = `videos/${uuidv4()}.${fileExtension}`;
    const bucket = this.configService.get<string>('AWS_S3_BUCKET');
    const region = this.configService.get<string>('AWS_REGION');

    this.logger.log(`Uploading video to S3: ${key} (type: ${file.mimetype})`);

    try {
      const parallelUpload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: bucket!,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        },
      });

      await parallelUpload.done();

      const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
      this.logger.log(`Video uploaded successfully: ${url}`);
      return url;
    } catch (error) {
      this.logger.error(
        `Video upload failed`,
        {
          errorName: error?.name,
          errorMessage: error?.message,
          errorStack: error?.stack,
          bucket,
          region,
          fileSize: file.buffer.length,
          fileType: file.mimetype,
          originalName: file.originalname,
        },
        'S3Service.uploadVideo',
      );
      throw new InternalServerErrorException('Failed to upload video file');
    }
  }
  async deleteFile(url: string): Promise<void> {
    const key = this.extractKeyFromUrl(url);
    const bucket = this.configService.get<string>('AWS_S3_BUCKET');

    if (!key) {
      throw new InternalServerErrorException('File key is required for deletion');
    }

    // Optional: Prevent deleting from wrong folders (security)
    if (!key.startsWith('audios/') &&
      !key.startsWith('images/') &&
      !key.startsWith('videos/')) {
      this.logger.warn(`Attempted to delete non-managed file: ${key}`);
      throw new InternalServerErrorException('Only audios/, images/, and videos/ files can be deleted');
    }
    this.logger.log(`Deleting file from S3: ${key} (bucket: ${bucket})`);

    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucket!,
        Key: key,
      });

      await this.s3Client.send(deleteCommand);

      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete file from S3: ${key}`,
        {
          errorName: error?.name,
          errorMessage: error?.message,
          errorStack: error?.stack,
          bucket,
        },
        'S3Service.deleteFile',
      );
      throw new InternalServerErrorException('Failed to delete file from cloud storage');
    }
  }
  async deleteVideoByUrl(url: string): Promise<void> {
    const key = this.extractKeyFromUrl(url);
    if (!key.startsWith('videos/')) {
      throw new InternalServerErrorException('Only video files can be deleted via this method');
    }
    return this.deleteFile(url); // Reuse existing delete logic
  }
}
