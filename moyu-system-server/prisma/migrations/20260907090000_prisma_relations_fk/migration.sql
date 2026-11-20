-- Prisma @relation → MySQL 外键（与 schema 对齐）
-- 加 FK 前请确认无孤儿行；失败时先清理脏数据再重试。
-- 刻意不加：dept/menu parent_id(=0)、审计/API 日志 user_id、字典 type、tenant.contact_user_id

-- 组织 / RBAC
ALTER TABLE `sys_dept`
  ADD CONSTRAINT `fk_dept_leader_user`
    FOREIGN KEY (`leader_user_id`) REFERENCES `sys_user` (`id`)
    ON DELETE SET NULL ON UPDATE RESTRICT;

ALTER TABLE `sys_user`
  ADD CONSTRAINT `fk_user_dept`
    FOREIGN KEY (`dept_id`) REFERENCES `sys_dept` (`id`)
    ON DELETE SET NULL ON UPDATE RESTRICT;

ALTER TABLE `sys_user_profile`
  ADD CONSTRAINT `fk_user_profile_user`
    FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `sys_user_post`
  ADD CONSTRAINT `fk_user_post_user`
    FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `fk_user_post_post`
    FOREIGN KEY (`post_id`) REFERENCES `sys_post` (`id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `sys_user_role`
  ADD CONSTRAINT `fk_user_role_user`
    FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `fk_user_role_role`
    FOREIGN KEY (`role_id`) REFERENCES `sys_role` (`id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `sys_role_menu`
  ADD CONSTRAINT `fk_role_menu_role`
    FOREIGN KEY (`role_id`) REFERENCES `sys_role` (`id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `fk_role_menu_menu`
    FOREIGN KEY (`menu_id`) REFERENCES `sys_menu` (`id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT;

-- 站内信 / 邮件 / 短信
ALTER TABLE `sys_notify_message`
  ADD CONSTRAINT `fk_notify_message_user`
    FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `fk_notify_message_template`
    FOREIGN KEY (`template_id`) REFERENCES `sys_notify_template` (`id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `sys_mail_template`
  ADD CONSTRAINT `fk_mail_template_account`
    FOREIGN KEY (`account_id`) REFERENCES `sys_mail_account` (`id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `sys_mail_log`
  ADD CONSTRAINT `fk_mail_log_account`
    FOREIGN KEY (`account_id`) REFERENCES `sys_mail_account` (`id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `fk_mail_log_template`
    FOREIGN KEY (`template_id`) REFERENCES `sys_mail_template` (`id`)
    ON DELETE SET NULL ON UPDATE RESTRICT;

ALTER TABLE `sys_sms_template`
  ADD CONSTRAINT `fk_sms_template_channel`
    FOREIGN KEY (`channel_id`) REFERENCES `sys_sms_channel` (`id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `sys_sms_log`
  ADD CONSTRAINT `fk_sms_log_channel`
    FOREIGN KEY (`channel_id`) REFERENCES `sys_sms_channel` (`id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `fk_sms_log_template`
    FOREIGN KEY (`template_id`) REFERENCES `sys_sms_template` (`id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT;

-- 社交 / 租户 / OAuth2 / Job
ALTER TABLE `sys_social_user_bind`
  ADD CONSTRAINT `fk_social_bind_user`
    FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `fk_social_bind_social_user`
    FOREIGN KEY (`social_user_id`) REFERENCES `sys_social_user` (`id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `sys_tenant`
  ADD CONSTRAINT `fk_tenant_package`
    FOREIGN KEY (`package_id`) REFERENCES `sys_tenant_package` (`id`)
    ON DELETE SET NULL ON UPDATE RESTRICT;

ALTER TABLE `sys_oauth2_access_token`
  ADD CONSTRAINT `fk_oauth2_access_user`
    FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `fk_oauth2_access_client`
    FOREIGN KEY (`client_id`) REFERENCES `sys_oauth2_client` (`client_id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `sys_oauth2_refresh_token`
  ADD CONSTRAINT `fk_oauth2_refresh_user`
    FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `fk_oauth2_refresh_client`
    FOREIGN KEY (`client_id`) REFERENCES `sys_oauth2_client` (`client_id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `sys_oauth2_code`
  ADD CONSTRAINT `fk_oauth2_code_user`
    FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `fk_oauth2_code_client`
    FOREIGN KEY (`client_id`) REFERENCES `sys_oauth2_client` (`client_id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `sys_oauth2_approve`
  ADD CONSTRAINT `fk_oauth2_approve_user`
    FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `fk_oauth2_approve_client`
    FOREIGN KEY (`client_id`) REFERENCES `sys_oauth2_client` (`client_id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `sys_job_log`
  ADD CONSTRAINT `fk_job_log_job`
    FOREIGN KEY (`job_id`) REFERENCES `sys_job` (`id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT;
