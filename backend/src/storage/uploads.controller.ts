import {
  BadRequestException,
  Controller,
  HttpCode,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { AuthGuard } from '@nestjs/passport'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { memoryStorage } from 'multer'
import { StorageService } from './storage.service'

const imageMime = /^image\/(jpeg|png|gif|webp)$/

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly storage: StorageService) {}

  @Post('image')
  @HttpCode(201)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Загрузка изображения в S3-совместимое хранилище' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: '{ url, key }' })
  @ApiResponse({ status: 503, description: 'Хранилище не настроено' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!imageMime.test(file.mimetype)) {
          cb(new BadRequestException('Only image/jpeg, png, gif, webp'), false)
          return
        }
        cb(null, true)
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file?.buffer) {
      throw new BadRequestException('file is required')
    }
    return this.storage.uploadPublicImage(file.buffer, file.mimetype, file.originalname)
  }
}
