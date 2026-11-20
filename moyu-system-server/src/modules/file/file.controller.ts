import { FileError, OpLogSub, OpLogType } from '@/config/error-messages';
import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  Req,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileService } from './file.service';
import {
  FilePageReqDTO,
  FileResDTO,
  FileUploadAbortReqDTO,
  FileUploadBase64ReqDTO,
  FileUploadCompleteResDTO,
  FileUploadInitReqDTO,
  FileUploadInitResDTO,
  FileUploadMergeReqDTO,
  FileUploadResDTO,
  FileUploadStatusReqDTO,
} from './dto/file.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Permission } from '@/common/decorator/permission.decorator';
import { OperateLog } from '@/common/decorator/operate-log.decorator';
import { RawResponse, SkipAuth } from '@/common/decorator/auth.decorator';
import {
  LoginUser,
  type LoginUser as LoginUserInfo,
} from '@/common/decorator/login-user.decorator';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { MultipartFile } from '@fastify/multipart';
import { getFileConfig } from '@/config/file.config';
import {
  multipartField,
  multipartAllowedTypes,
  readMultipartBuffer,
} from './file-multipart.util';
import {
  contentDisposition,
  parseRangeHeader,
} from './file-range.util';

async function saveChunkPart(
  fileService: FileService,
  req: FastifyRequest,
  data: MultipartFile,
  user?: LoginUserInfo,
) {
  if (!data) {
    throw new HttpException(FileError.CHUNK_REQUIRED, HttpStatus.BAD_REQUEST);
  }
  const cfg = getFileConfig();
  const buffer = await readMultipartBuffer(
    data,
    Math.max(cfg.maxChunkFileSize, cfg.maxChunkSize),
  );
  const query = req.query as Record<string, string>;
  return fileService.saveChunk({
    buffer,
    chunkName: multipartField(data.fields, 'chunkName') || data.filename || 'chunk',
    chunkHash: multipartField(data.fields, 'chunkHash'),
    chunkIndex: Number(
      multipartField(data.fields, 'chunkIndex') || query.index || 0,
    ),
    totalChunks: Number(multipartField(data.fields, 'totalChunks') || 1),
    fileName:
      multipartField(data.fields, 'fileName') || data.filename || 'unnamed',
    fileHash: multipartField(data.fields, 'fileHash'),
    hashType: multipartField(data.fields, 'hashType'),
    uploadId: multipartField(data.fields, 'uploadId') || query.uploadId,
    creator: user?.id != null ? String(user.id) : undefined,
  });
}

@ApiTags('文件管理')
@Controller('upload')
export class FileUploadController {
  constructor(private readonly fileService: FileService) {}

  @Post('base64')
  @Permission('system:file:create')
  @OperateLog({ type: OpLogType.FILE, subType: OpLogSub.UPLOAD })
  @ApiOperation({ summary: 'Base64 小文件上传' })
  @ApiResponse({ status: 200, type: FileUploadResDTO })
  uploadBase64(@Body() body: FileUploadBase64ReqDTO) {
    return this.fileService.uploadBase64(body.base64, body.fileName);
  }

  @Post('init')
  @SkipThrottle()
  @Permission('system:file:create')
  @OperateLog({ type: OpLogType.FILE, subType: OpLogSub.UPLOAD })
  @ApiOperation({ summary: '初始化大文件分片上传' })
  @ApiResponse({ status: 200, type: FileUploadInitResDTO })
  initUpload(
    @Body() body: FileUploadInitReqDTO,
    @LoginUser() user?: LoginUserInfo,
  ) {
    return this.fileService.initUpload(
      body,
      user?.id != null ? String(user.id) : undefined,
    );
  }

  @Post('chunk')
  @SkipThrottle()
  @Permission('system:file:create')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '上传文件分片' })
  async uploadChunk(
    @Req() req: FastifyRequest,
    @LoginUser() user?: LoginUserInfo,
  ) {
    const data = await req.file();
    if (!data) {
      throw new HttpException(FileError.CHUNK_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    return saveChunkPart(this.fileService, req, data, user);
  }

  @Get('status')
  @Permission('system:file:create')
  @ApiOperation({ summary: '查询已上传分片' })
  getUploadStatusGet(
    @Query() query: FileUploadStatusReqDTO,
    @LoginUser() user?: LoginUserInfo,
  ) {
    return this.fileService.getUploadStatus({
      uploadId: query.uploadId,
      hash: query.hash,
      creator: user?.id != null ? String(user.id) : undefined,
    });
  }

  @Post('status')
  @Permission('system:file:create')
  @ApiOperation({ summary: '查询已上传分片' })
  getUploadStatusPost(
    @Body() body: FileUploadStatusReqDTO,
    @LoginUser() user?: LoginUserInfo,
  ) {
    return this.fileService.getUploadStatus({
      uploadId: body.uploadId,
      hash: body.hash,
      creator: user?.id != null ? String(user.id) : undefined,
    });
  }

  @Post('complete')
  @SkipThrottle()
  @Permission('system:file:create')
  @OperateLog({ type: OpLogType.FILE, subType: OpLogSub.UPLOAD })
  @ApiOperation({ summary: '合并分片（缺片时返回 missingIndexes 以续传）' })
  @ApiResponse({ status: 200, type: FileUploadCompleteResDTO })
  completeUpload(
    @Body() body: FileUploadMergeReqDTO,
    @LoginUser() user?: LoginUserInfo,
  ) {
    return this.fileService.completeUpload(
      body,
      user?.id != null ? String(user.id) : undefined,
    );
  }

  @Post('abort')
  @Permission('system:file:create')
  @OperateLog({ type: OpLogType.FILE, subType: OpLogSub.ABORT })
  @ApiOperation({ summary: '取消分片上传' })
  abortUpload(
    @Body() body: FileUploadAbortReqDTO,
    @LoginUser() user?: LoginUserInfo,
  ) {
    return this.fileService.abortUpload({
      uploadId: body.uploadId,
      fileHash: body.fileHash,
      creator: user?.id != null ? String(user.id) : undefined,
    });
  }

  @Get('part-url')
  @Permission('system:file:create')
  @ApiOperation({ summary: '获取 OSS 分片预签名 PUT URL' })
  getPartUrl(
    @Query('uploadId') uploadId: string,
    @Query('index') index: number,
    @LoginUser() user?: LoginUserInfo,
  ) {
    return this.fileService.getPartUrl(
      uploadId,
      Number(index),
      user?.id != null ? String(user.id) : undefined,
    );
  }
}

@ApiTags('文件管理')
@Controller()
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @SkipThrottle()
  @Permission('system:file:create')
  @OperateLog({ type: OpLogType.FILE, subType: OpLogSub.UPLOAD })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        allowedTypes: {
          type: 'string',
          description: '可选，逗号分隔或 JSON 数组；不传则允许所有类型',
        },
      },
    },
  })
  @ApiOperation({ summary: '上传小文件' })
  @ApiResponse({ status: 200, type: FileUploadResDTO })
  async upload(
    @Req() req: FastifyRequest,
    @LoginUser() user?: LoginUserInfo,
  ) {
    const data = await req.file();
    if (!data) {
      throw new HttpException(FileError.UPLOAD_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    const fileHash = multipartField(data.fields, 'fileHash');
    if (fileHash) {
      return saveChunkPart(this.fileService, req, data, user);
    }
    const cfg = getFileConfig();
    const buffer = await readMultipartBuffer(data, cfg.maxFileSize);
    const filename =
      multipartField(data.fields, 'fileName') || data.filename || 'unnamed';
    return this.fileService.upload(
      buffer,
      filename,
      data.mimetype,
      multipartAllowedTypes(data.fields),
    );
  }

  @Delete('delete')
  @Permission('system:file:delete')
  @OperateLog({ type: OpLogType.FILE, subType: OpLogSub.DELETE })
  @ApiOperation({ summary: '删除文件' })
  deleteFile(@Body('id') id: number, @Query('id') idQuery?: number) {
    return this.fileService.deleteFile(id ?? idQuery!);
  }

  @Delete('delete-list')
  @Permission('system:file:delete')
  @OperateLog({ type: OpLogType.FILE, subType: OpLogSub.DELETE_BATCH })
  @ApiOperation({ summary: '批量删除文件' })
  deleteFileList(
    @Body('ids') ids: number[],
    @Query('ids') idsQuery?: number[],
  ) {
    return this.fileService.deleteFileList(ids ?? idsQuery ?? []);
  }

  @Get('get')
  @Permission('system:file:query')
  @ApiOperation({ summary: '获得文件元数据' })
  @ApiResponse({ status: 200, type: FileResDTO })
  getFile(@Query('id') id: number) {
    return this.fileService.getFile(id);
  }

  @Get('page')
  @Permission('system:file:query')
  @ApiOperation({ summary: '文件分页' })
  getFilePage(@Query() query: FilePageReqDTO) {
    return this.fileService.getFilePage(query);
  }

  @Get('preview-ticket')
  @Permission('system:file:query')
  @ApiOperation({ summary: '签发短时预览凭证（供 video/audio 按 Range 拉流）' })
  issuePreviewTicket(@Query('id') id: number) {
    return this.fileService.issuePreviewTicket(id);
  }

  @Get('preview')
  @SkipThrottle()
  @Permission('system:file:query')
  @RawResponse()
  @ApiOperation({ summary: '预览文件内容（鉴权 Range）' })
  preview(
    @Query('id') id: number,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    return this.sendFile(id, req, reply, 'inline');
  }

  @Get('preview-media')
  @SkipAuth()
  @SkipThrottle()
  @RawResponse()
  @ApiOperation({ summary: '凭预览票据流式预览（浏览器媒体标签可发 Range）' })
  async previewMedia(
    @Query('id') id: number,
    @Query('ticket') ticket: string,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    if (!ticket) {
      throw new HttpException(FileError.TICKET_INVALID, HttpStatus.FORBIDDEN);
    }
    await this.fileService.applyPreviewTicket(ticket, id);
    return this.sendFile(id, req, reply, 'inline');
  }

  @Get('download')
  @SkipThrottle()
  @Permission('system:file:query')
  @OperateLog({ type: OpLogType.FILE, subType: OpLogSub.DOWNLOAD })
  @RawResponse()
  @ApiOperation({ summary: '下载文件（支持 Range）' })
  download(
    @Query('id') id: number,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    return this.sendFile(id, req, reply, 'attachment');
  }

  private async sendFile(
    id: number,
    req: FastifyRequest,
    reply: FastifyReply,
    disposition: 'inline' | 'attachment',
  ) {
    const rangeHeader = req.headers.range;
    const probe = await this.fileService.headContent(id, disposition);
    const parsed = parseRangeHeader(
      Array.isArray(rangeHeader) ? rangeHeader[0] : rangeHeader,
      probe.size,
    );
    if (!parsed) {
      reply.header('Content-Range', `bytes */${probe.size}`);
      return reply.code(416).send();
    }
    if (probe.downloadUrl && !parsed.partial && disposition === 'inline') {
      return reply.redirect(probe.downloadUrl);
    }
    const ranged = await this.fileService.openContentRange(
      id,
      parsed.partial ? parsed.range : undefined,
      disposition,
    );
    const length = parsed.range.end - parsed.range.start + 1;
    reply.header('Accept-Ranges', 'bytes');
    reply.header('Cache-Control', 'private, max-age=60');
    reply.header('Content-Type', ranged.type || probe.type);
    reply.header('Content-Disposition', contentDisposition(disposition, ranged.name || probe.name));
    reply.header('Content-Length', String(length));
    if (parsed.partial) {
      reply.header(
        'Content-Range',
        `bytes ${parsed.range.start}-${parsed.range.end}/${ranged.size}`,
      );
      reply.code(206);
    }
    return reply.send(ranged.stream);
  }
}
