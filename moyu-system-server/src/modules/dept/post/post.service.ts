import { xl } from '@/i18n/xl';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import {
  PostPageReqDTO,
  PostResDTO,
  PostSaveReqDTO,
  PostSimpleResDTO,
} from './dto/post.dto';
import { PostRepository } from './repositories/post.repository';
import { PostDO } from './entities/post.entity';
import { PageResult } from '@/types';
import { formatDate } from '@/utils/date';
import {
  buildExcelExport,
  ExcelExportResult,
  EXCEL_MAX_ROWS,
} from '@/utils/excel-export';
import { ExportError, PostError } from '@/config/error-messages';
import { PrismaService } from '@/database/prisma/prisma.service';

/**
 * 岗位管理 Service
 */
@Injectable()
export class PostService {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 创建岗位
   */
  async createPost(req: PostSaveReqDTO): Promise<number> {
    // 岗位编码不允许重复
    const exists = await this.postRepository.selectByUnique({
      code: req.code,
    });
    if (exists) {
      throw new HttpException(
        PostError.CODE_DUPLICATE,
        HttpStatus.BAD_REQUEST,
      );
    }
    // create 语义下忽略前端传入的 id（数据库自增）
    return this.postRepository.insert({
      name: req.name,
      code: req.code,
      sort: req.sort ?? 0,
      status: req.status,
      remark: req.remark ?? null,
    });
  }

  /**
   * 修改岗位
   */
  async updatePost(req: PostSaveReqDTO): Promise<boolean> {
    // 存在性校验
    const post = await this.postRepository.selectById(req.id);
    if (!post) {
      throw new HttpException(
        PostError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    // 岗位编码唯一（排除自身）
    const conflict = await this.postRepository.selectByUnique({
      code: req.code,
      id: { not: req.id },
    });
    if (conflict) {
      throw new HttpException(
        PostError.CODE_DUPLICATE,
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.postRepository.updateById(req.id, {
      name: req.name,
      code: req.code,
      sort: req.sort ?? post.sort,
      status: req.status,
      remark: req.remark ?? post.remark,
    });
  }

  /**
   * 删除岗位
   */
  async deletePost(id: number): Promise<boolean> {
    const post = await this.postRepository.selectById(id);
    if (!post) {
      throw new HttpException(
        PostError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    const bound = await this.prisma.sysUserPost.count({
      where: { postId: id },
    });
    if (bound > 0) {
      throw new HttpException(PostError.IN_USE, HttpStatus.BAD_REQUEST);
    }
    return this.postRepository.deleteById(id);
  }

  /**
   * 批量删除岗位
   */
  async deletePostList(ids: number[]): Promise<boolean> {
    if (!ids || ids.length === 0) {
      return false;
    }
    for (const id of ids) {
      await this.deletePost(id);
    }
    return true;
  }

  /**
   * 获取岗位详情
   */
  async getPost(id: number): Promise<PostResDTO> {
    const post = await this.postRepository.selectById(id);
    if (!post) {
      throw new HttpException(
        PostError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.toResDTO(post);
  }

  /**
   * 获取岗位分页列表
   */
  async getPostPage(query: PostPageReqDTO): Promise<PageResult<PostResDTO>> {
    const where = {
      ...(query.code ? { code: { contains: query.code } } : {}),
      ...(query.name ? { name: { contains: query.name } } : {}),
      ...(query.status !== undefined ? { status: query.status } : {}),
    };
    const { list, total } = await this.postRepository.selectPage(
      { page: query.page, pageSize: query.pageSize },
      where,
    );
    return { list: list.map((post) => this.toResDTO(post)), total };
  }

  /**
   * 校验岗位编号均存在（用于用户保存时的引用字段校验）
   */
  async assertPostsExist(ids: number[] | undefined): Promise<void> {
    if (!ids || ids.length === 0) {
      return;
    }
    const posts = await this.postRepository.selectByIds(ids);
    const found = new Set(posts.map((post) => post.id));
    const missing = ids.filter((id) => !found.has(id));
    if (missing.length > 0) {
      throw new HttpException(PostError.NOT_FOUND, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * 获取岗位精简信息列表（仅启用）
   */
  async getSimplePostList(): Promise<PostSimpleResDTO[]> {
    const list = await this.postRepository.selectList({ status: 1 });
    return list.map((post) => {
      const resp = new PostSimpleResDTO();
      resp.id = post.id;
      resp.name = post.name;
      return resp;
    });
  }

  /**
   * 导出岗位 Excel（最多 EXCEL_MAX_ROWS 行）
   */
  async exportExcel(): Promise<ExcelExportResult> {
    const { list } = await this.postRepository.selectPage(
      { page: 1, pageSize: EXCEL_MAX_ROWS },
      {},
    );
    const rows = list.map((post) => ({
      id: post.id,
      name: post.name,
      code: post.code,
      sort: post.sort,
      status: post.status === 1 ? xl(ExportError.ENABLED) : xl(ExportError.DISABLED),
      remark: post.remark ?? '',
      createTime: formatDate(post.createTime),
    }));
    return buildExcelExport({
      sheetName: xl(ExportError.POST),
      filename: `${xl(ExportError.POST)}_${Date.now()}.xlsx`,
      columns: [
        { header: xl(ExportError.ID), key: 'id', width: 10 },
        { header: xl(ExportError.NAME), key: 'name', width: 18 },
        { header: xl(ExportError.CODE), key: 'code', width: 18 },
        { header: xl(ExportError.SORT), key: 'sort', width: 10 },
        { header: xl(ExportError.STATUS), key: 'status', width: 10 },
        { header: xl(ExportError.REMARK), key: 'remark', width: 24 },
        { header: xl(ExportError.CREATE_TIME), key: 'createTime', width: 20 },
      ],
      rows,
    });
  }

  /**
   * 岗位 DO → ResDTO
   */
  private toResDTO(post: PostDO): PostResDTO {
    const resp = new PostResDTO();
    resp.id = post.id;
    resp.name = post.name;
    resp.code = post.code;
    resp.sort = post.sort;
    resp.status = post.status;
    resp.remark = post.remark ?? undefined;
    resp.createTime = formatDate(post.createTime);
    return resp;
  }
}
