import { OpLogSub, OpLogType } from '@/config/error-messages';
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Body,
  Param,
  StreamableFile,
} from '@nestjs/common';
import { PostService } from './post.service';
import {
  PostPageReqDTO,
  PostResDTO,
  PostSaveReqDTO,
  PostSimpleResDTO,
} from './dto/post.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Permission } from '@/common/decorator/permission.decorator';
import { RawResponse } from '@/common/decorator/auth.decorator';
import { resolveId, resolveIds } from '@/utils/resolve-id';
import { OperateLog } from '@/common/decorator/operate-log.decorator';

/**
 * 岗位管理 Controller
 */
@ApiTags('岗位管理')
@Controller()
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post('create')
  @Permission('system:post:create')
  @ApiOperation({ summary: '创建岗位' })
  @ApiResponse({ status: 200, description: '创建岗位成功，返回岗位编号' })
  createPost(@Body() req: PostSaveReqDTO) {
    return this.postService.createPost(req);
  }

  @Put('update')
  @Permission('system:post:update')
  @ApiOperation({ summary: '修改岗位' })
  @ApiResponse({ status: 200, description: '修改岗位成功' })
  updatePost(@Body() req: PostSaveReqDTO) {
    return this.postService.updatePost(req);
  }

  @Delete('delete')
  @Permission('system:post:delete')
  @OperateLog({ type: OpLogType.POST, subType: OpLogSub.POST_DELETE })
  @ApiOperation({ summary: '删除岗位（Body.id 优先）' })
  @ApiResponse({ status: 200, description: '删除岗位成功' })
  deletePost(
    @Body('id') bodyId: number | undefined,
    @Query('id') queryId: number | undefined,
  ) {
    return this.postService.deletePost(resolveId(bodyId, queryId));
  }

  @Delete('delete-list')
  @Permission('system:post:delete')
  @OperateLog({ type: OpLogType.POST, subType: OpLogSub.POST_DELETE_BATCH })
  @ApiOperation({ summary: '批量删除岗位（Body.ids 优先）' })
  @ApiResponse({ status: 200, description: '批量删除岗位成功' })
  deletePostList(
    @Body('ids') bodyIds: number[] | undefined,
    @Query('ids') queryIds: number[] | undefined,
  ) {
    return this.postService.deletePostList(resolveIds(bodyIds, queryIds));
  }

  @Get('get')
  @Permission('system:post:query')
  @ApiOperation({ summary: '获得岗位信息' })
  @ApiResponse({ status: 200, description: '获取岗位信息成功' })
  getPost(@Query('id') id: number) {
    return this.postService.getPost(id);
  }

  @Get('simple-list')
  @Permission('system:post:query')
  @ApiOperation({ summary: '获取岗位全列表', description: '只包含被开启的岗位，主要用于前端的下拉选项' })
  @ApiResponse({ status: 200, description: '获取岗位全列表成功' })
  getSimplePostList() {
    return this.postService.getSimplePostList();
  }

  @Get('page')
  @Permission('system:post:query')
  @ApiOperation({ summary: '获得岗位分页列表' })
  @ApiResponse({ status: 200, description: '获取岗位分页列表成功' })
  getPostPage(@Query() req: PostPageReqDTO) {
    return this.postService.getPostPage(req);
  }

  @Get('export-excel')
  @Permission('system:post:export')
  @RawResponse()
  @ApiOperation({ summary: '岗位管理' })
  @ApiResponse({ status: 200, description: '导出岗位管理excel成功' })
  async exportExcel(): Promise<StreamableFile> {
    const file = await this.postService.exportExcel();
    return new StreamableFile(file.buffer, {
      type: file.contentType,
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
    });
  }
}
