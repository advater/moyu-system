import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import {
  MailAccountPageReqDTO,
  MailAccountResDTO,
  MailAccountSaveReqDTO,
  MailAccountSimpleResDTO,
} from './dto/mailAccount.dto';
import {
  MailAccountRepository,
  MailAccountRow,
} from './repositories/mailAccount.repository';
import { PageResult } from '@/types';
import { formatDate } from '@/utils/date';
import { MailError } from '@/config/error-messages';
import { maskSecret, shouldKeepExistingSecret } from '@/utils/sanitize';

/**
 * 邮箱账号管理 Service
 */
@Injectable()
export class MailAccountService {
  constructor(private readonly mailAccountRepository: MailAccountRepository) {}

  /**
   * 创建邮箱账号
   */
  async createMailAccount(req: MailAccountSaveReqDTO): Promise<number> {
    // 邮箱唯一性校验
    const exists = await this.mailAccountRepository.selectByUnique({
      mail: req.mail,
    });
    if (exists) {
      throw new HttpException(MailError.ACCOUNT_EXISTS, HttpStatus.BAD_REQUEST);
    }
    if (!req.password) {
      throw new HttpException(MailError.PASSWORD_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    // create 语义下忽略前端传入的 id（数据库自增）
    return this.mailAccountRepository.insert({
      mail: req.mail,
      username: req.username,
      password: req.password,
      host: req.host,
      port: req.port,
      sslEnable: req.sslEnable,
      starttlsEnable: req.starttlsEnable,
    });
  }

  /**
   * 修改邮箱账号
   */
  async updateMailAccount(req: MailAccountSaveReqDTO): Promise<boolean> {
    if (req.id === undefined) {
      throw new HttpException(MailError.ACCOUNT_ID_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    // 存在性校验
    const account = await this.mailAccountRepository.selectById(req.id);
    if (!account) {
      throw new HttpException(
        MailError.ACCOUNT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    // 邮箱唯一（排除自身）
    const conflict = await this.mailAccountRepository.selectByUnique({
      mail: req.mail,
      id: { not: req.id },
    });
    if (conflict) {
      throw new HttpException(MailError.ACCOUNT_EXISTS, HttpStatus.BAD_REQUEST);
    }
    return this.mailAccountRepository.updateById(req.id, {
      mail: req.mail,
      username: req.username,
      // 空串或掩码占位表示不修改密码，避免前端回显覆盖明文
      password: shouldKeepExistingSecret(req.password)
        ? account.password
        : req.password!,
      host: req.host,
      port: req.port,
      sslEnable: req.sslEnable,
      starttlsEnable: req.starttlsEnable,
    });
  }

  /**
   * 删除邮箱账号
   */
  async deleteMailAccount(id: number): Promise<boolean> {
    const account = await this.mailAccountRepository.selectById(id);
    if (!account) {
      throw new HttpException(
        MailError.ACCOUNT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.mailAccountRepository.deleteById(id);
  }

  /**
   * 批量删除邮箱账号
   */
  async deleteMailAccountList(ids: number[]): Promise<boolean> {
    if (!ids || ids.length === 0) {
      return false;
    }
    return this.mailAccountRepository.deleteBatchIds(ids);
  }

  /**
   * 获取邮箱账号详情
   */
  async getMailAccount(id: number): Promise<MailAccountResDTO> {
    const account = await this.mailAccountRepository.selectById(id);
    if (!account) {
      throw new HttpException(
        MailError.ACCOUNT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.toResDTO(account);
  }

  /**
   * 分页查询邮箱账号
   */
  async getMailAccountPage(
    req: MailAccountPageReqDTO,
  ): Promise<PageResult<MailAccountResDTO>> {
    const { list, total } = await this.mailAccountRepository.selectPage(
      { page: req.page, pageSize: req.pageSize },
      {
        ...(req.mail ? { mail: { contains: req.mail } } : {}),
        ...(req.username ? { username: { contains: req.username } } : {}),
      },
    );
    return {
      list: list.map((account) => this.toResDTO(account)),
      total,
    };
  }

  /**
   * 获取邮箱账号精简信息列表
   */
  async getSimpleMailAccountList(): Promise<MailAccountSimpleResDTO[]> {
    const list = await this.mailAccountRepository.selectSimpleList();
    return list.map((account) => {
      const resp = new MailAccountSimpleResDTO();
      resp.id = account.id;
      resp.mail = account.mail;
      return resp;
    });
  }

  /**
   * 邮箱账号行 → ResDTO
   */
  private toResDTO(account: MailAccountRow): MailAccountResDTO {
    const resp = new MailAccountResDTO();
    resp.id = account.id;
    resp.mail = account.mail;
    resp.username = account.username;
    resp.password = maskSecret(account.password);
    resp.host = account.host;
    resp.port = account.port;
    resp.sslEnable = account.sslEnable;
    resp.starttlsEnable = account.starttlsEnable;
    resp.createTime = formatDate(account.createTime);
    return resp;
  }
}
