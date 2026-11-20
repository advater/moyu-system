-- CreateTable
CREATE TABLE `sys_dept` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(30) NOT NULL,
    `parent_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `leader_user_id` INTEGER UNSIGNED NULL,
    `phone` VARCHAR(11) NULL,
    `email` VARCHAR(50) NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_dept_tenant_id_idx`(`tenant_id`),
    INDEX `sys_dept_parent_id_idx`(`parent_id`),
    INDEX `sys_dept_name_idx`(`name`),
    INDEX `sys_dept_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_post` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `code` VARCHAR(64) NOT NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `status` TINYINT NOT NULL DEFAULT 1,
    `remark` VARCHAR(500) NULL,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_post_tenant_id_idx`(`tenant_id`),
    INDEX `sys_post_name_idx`(`name`),
    INDEX `sys_post_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `uk_tenant_post_code`(`tenant_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_user_post` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` VARCHAR(64) NOT NULL,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `post_id` INTEGER UNSIGNED NOT NULL,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_user_post_tenant_id_idx`(`tenant_id`),
    INDEX `sys_user_post_post_id_idx`(`post_id`),
    INDEX `sys_user_post_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `uk_tenant_user_post`(`tenant_id`, `user_id`, `post_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_dict_type` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `type` VARCHAR(100) NOT NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `remark` VARCHAR(500) NULL,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_dict_type_tenant_id_idx`(`tenant_id`),
    INDEX `sys_dict_type_name_idx`(`name`),
    INDEX `sys_dict_type_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `uk_tenant_dict_type`(`tenant_id`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_dict_data` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` VARCHAR(64) NOT NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `label` VARCHAR(100) NOT NULL,
    `value` VARCHAR(100) NOT NULL,
    `dict_type` VARCHAR(100) NOT NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `color_type` VARCHAR(50) NULL,
    `css_class` VARCHAR(100) NULL,
    `remark` VARCHAR(500) NULL,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_dict_data_tenant_id_idx`(`tenant_id`),
    INDEX `sys_dict_data_dict_type_idx`(`dict_type`),
    INDEX `sys_dict_data_value_idx`(`value`),
    INDEX `sys_dict_data_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_user` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` VARCHAR(64) NOT NULL,
    `username` VARCHAR(30) NOT NULL,
    `password` VARCHAR(100) NOT NULL,
    `remark` VARCHAR(500) NULL,
    `dept_id` INTEGER UNSIGNED NULL,
    `post_ids` JSON NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `login_ip` VARCHAR(50) NULL,
    `login_date` DATETIME(3) NULL,
    `password_update_time` DATETIME(3) NULL,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_user_dept_id_idx`(`dept_id`),
    INDEX `sys_user_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `uk_tenant_username`(`tenant_id`, `username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_user_profile` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` VARCHAR(64) NOT NULL,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `nickname` VARCHAR(30) NULL,
    `email` VARCHAR(50) NULL,
    `mobile` VARCHAR(11) NULL,
    `sex` TINYINT NULL,
    `avatar` VARCHAR(255) NULL,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_user_profile_tenant_id_idx`(`tenant_id`),
    INDEX `sys_user_profile_tenant_id_email_idx`(`tenant_id`, `email`),
    INDEX `sys_user_profile_tenant_id_mobile_idx`(`tenant_id`, `mobile`),
    INDEX `sys_user_profile_tenant_id_nickname_idx`(`tenant_id`, `nickname`),
    INDEX `sys_user_profile_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `uk_user_profile_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_role` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(30) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `status` TINYINT NOT NULL DEFAULT 1,
    `type` TINYINT NOT NULL DEFAULT 1,
    `remark` VARCHAR(500) NULL,
    `data_scope` TINYINT NOT NULL DEFAULT 1,
    `data_scope_dept_ids` JSON NULL,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_role_name_idx`(`name`),
    INDEX `sys_role_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `uk_tenant_role_code`(`tenant_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_menu` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `permission` VARCHAR(100) NULL,
    `type` TINYINT NOT NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `parent_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `path` VARCHAR(200) NULL,
    `icon` VARCHAR(100) NULL,
    `component` VARCHAR(255) NULL,
    `component_name` VARCHAR(100) NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `visible` BOOLEAN NOT NULL DEFAULT true,
    `keep_alive` BOOLEAN NOT NULL DEFAULT false,
    `always_show` BOOLEAN NOT NULL DEFAULT false,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_menu_parent_id_idx`(`parent_id`),
    INDEX `sys_menu_permission_idx`(`permission`),
    INDEX `sys_menu_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_role_menu` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` VARCHAR(64) NOT NULL,
    `role_id` INTEGER UNSIGNED NOT NULL,
    `menu_id` INTEGER UNSIGNED NOT NULL,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_role_menu_menu_id_idx`(`menu_id`),
    INDEX `sys_role_menu_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `uk_tenant_role_menu`(`tenant_id`, `role_id`, `menu_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_user_role` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` VARCHAR(64) NOT NULL,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `role_id` INTEGER UNSIGNED NOT NULL,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_user_role_tenant_id_idx`(`tenant_id`),
    INDEX `sys_user_role_role_id_idx`(`role_id`),
    INDEX `sys_user_role_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `uk_tenant_user_role`(`tenant_id`, `user_id`, `role_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_notice` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` VARCHAR(64) NOT NULL,
    `title` VARCHAR(50) NOT NULL,
    `type` TINYINT NOT NULL,
    `content` LONGTEXT NOT NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_notice_tenant_id_idx`(`tenant_id`),
    INDEX `sys_notice_title_idx`(`title`),
    INDEX `sys_notice_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_notify_template` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `type` TINYINT NOT NULL,
    `nickname` VARCHAR(50) NULL,
    `content` TEXT NOT NULL,
    `params` JSON NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `remark` VARCHAR(500) NULL,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_notify_template_tenant_id_idx`(`tenant_id`),
    INDEX `sys_notify_template_name_idx`(`name`),
    INDEX `sys_notify_template_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `uk_tenant_notify_template_code`(`tenant_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_notify_message` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` VARCHAR(64) NOT NULL,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `user_type` TINYINT NOT NULL,
    `template_id` INTEGER UNSIGNED NOT NULL,
    `template_code` VARCHAR(100) NOT NULL,
    `template_type` TINYINT NOT NULL,
    `template_nickname` VARCHAR(50) NULL,
    `template_content` TEXT NOT NULL,
    `template_params` JSON NULL,
    `read_status` BOOLEAN NOT NULL DEFAULT false,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_notify_message_tenant_id_idx`(`tenant_id`),
    INDEX `sys_notify_message_user_id_user_type_idx`(`user_id`, `user_type`),
    INDEX `sys_notify_message_template_id_idx`(`template_id`),
    INDEX `sys_notify_message_read_status_idx`(`read_status`),
    INDEX `sys_notify_message_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_mail_account` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` VARCHAR(64) NOT NULL,
    `mail` VARCHAR(100) NOT NULL,
    `username` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `host` VARCHAR(100) NOT NULL,
    `port` INTEGER NOT NULL,
    `ssl_enable` BOOLEAN NOT NULL DEFAULT false,
    `starttls_enable` BOOLEAN NOT NULL DEFAULT false,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_mail_account_tenant_id_idx`(`tenant_id`),
    INDEX `sys_mail_account_mail_idx`(`mail`),
    INDEX `sys_mail_account_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_mail_template` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `account_id` INTEGER UNSIGNED NOT NULL,
    `nickname` VARCHAR(50) NULL,
    `title` VARCHAR(200) NOT NULL,
    `content` TEXT NOT NULL,
    `params` JSON NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `remark` VARCHAR(500) NULL,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_mail_template_tenant_id_idx`(`tenant_id`),
    INDEX `sys_mail_template_account_id_idx`(`account_id`),
    INDEX `sys_mail_template_name_idx`(`name`),
    INDEX `sys_mail_template_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `uk_tenant_mail_template_code`(`tenant_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_mail_log` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` VARCHAR(64) NOT NULL,
    `user_id` INTEGER UNSIGNED NULL,
    `user_type` TINYINT NULL,
    `to_mails` TEXT NOT NULL,
    `cc_mails` TEXT NULL,
    `bcc_mails` TEXT NULL,
    `account_id` INTEGER UNSIGNED NOT NULL,
    `from_mail` VARCHAR(100) NOT NULL,
    `template_id` INTEGER UNSIGNED NULL,
    `template_code` VARCHAR(100) NULL,
    `template_nickname` VARCHAR(50) NULL,
    `template_title` VARCHAR(200) NOT NULL,
    `template_content` LONGTEXT NOT NULL,
    `template_params` JSON NULL,
    `send_status` TINYINT NOT NULL DEFAULT 0,
    `send_time` DATETIME(3) NULL,
    `send_message_id` VARCHAR(255) NULL,
    `send_exception` LONGTEXT NULL,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_mail_log_tenant_id_idx`(`tenant_id`),
    INDEX `sys_mail_log_user_id_user_type_idx`(`user_id`, `user_type`),
    INDEX `sys_mail_log_account_id_idx`(`account_id`),
    INDEX `sys_mail_log_template_id_idx`(`template_id`),
    INDEX `sys_mail_log_send_status_idx`(`send_status`),
    INDEX `sys_mail_log_send_time_idx`(`send_time`),
    INDEX `sys_mail_log_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_sms_channel` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` VARCHAR(64) NOT NULL,
    `signature` VARCHAR(50) NOT NULL,
    `code` VARCHAR(64) NOT NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `remark` VARCHAR(500) NULL,
    `api_key` VARCHAR(128) NOT NULL,
    `api_secret` VARCHAR(255) NOT NULL,
    `callback_url` VARCHAR(255) NULL,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_sms_channel_tenant_id_idx`(`tenant_id`),
    INDEX `sys_sms_channel_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `uk_tenant_sms_channel_code`(`tenant_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_sms_template` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` VARCHAR(64) NOT NULL,
    `type` TINYINT NOT NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `code` VARCHAR(64) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `content` VARCHAR(500) NOT NULL,
    `params` JSON NULL,
    `remark` VARCHAR(500) NULL,
    `api_template_id` VARCHAR(128) NULL,
    `channel_id` INTEGER UNSIGNED NOT NULL,
    `channel_code` VARCHAR(64) NOT NULL,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_sms_template_tenant_id_idx`(`tenant_id`),
    INDEX `sys_sms_template_channel_id_idx`(`channel_id`),
    INDEX `sys_sms_template_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `uk_tenant_sms_template_code`(`tenant_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_sms_log` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` VARCHAR(64) NOT NULL,
    `channel_id` INTEGER UNSIGNED NOT NULL,
    `channel_code` VARCHAR(64) NOT NULL,
    `template_id` INTEGER UNSIGNED NOT NULL,
    `template_code` VARCHAR(64) NOT NULL,
    `template_type` TINYINT NOT NULL,
    `template_content` VARCHAR(1000) NOT NULL,
    `template_params` JSON NULL,
    `api_template_id` VARCHAR(128) NULL,
    `mobile` VARCHAR(11) NOT NULL,
    `user_id` INTEGER UNSIGNED NULL,
    `user_type` TINYINT NULL,
    `send_status` TINYINT NOT NULL DEFAULT 0,
    `send_time` DATETIME(3) NULL,
    `api_send_code` VARCHAR(64) NULL,
    `api_send_msg` VARCHAR(500) NULL,
    `api_request_id` VARCHAR(128) NULL,
    `api_serial_no` VARCHAR(128) NULL,
    `receive_status` TINYINT NULL,
    `receive_time` DATETIME(3) NULL,
    `api_receive_code` VARCHAR(64) NULL,
    `api_receive_msg` VARCHAR(500) NULL,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_sms_log_tenant_id_idx`(`tenant_id`),
    INDEX `sys_sms_log_mobile_idx`(`mobile`),
    INDEX `sys_sms_log_channel_id_idx`(`channel_id`),
    INDEX `sys_sms_log_template_id_idx`(`template_id`),
    INDEX `sys_sms_log_send_status_idx`(`send_status`),
    INDEX `sys_sms_log_receive_status_idx`(`receive_status`),
    INDEX `sys_sms_log_user_id_idx`(`user_id`),
    INDEX `sys_sms_log_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_sms_code` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` VARCHAR(64) NOT NULL,
    `mobile` VARCHAR(11) NOT NULL,
    `code` VARCHAR(10) NOT NULL,
    `scene` TINYINT NOT NULL,
    `create_ip` VARCHAR(50) NULL,
    `today_index` INTEGER NOT NULL DEFAULT 1,
    `used` BOOLEAN NOT NULL DEFAULT false,
    `used_time` DATETIME(3) NULL,
    `used_ip` VARCHAR(50) NULL,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_sms_code_tenant_id_idx`(`tenant_id`),
    INDEX `sys_sms_code_mobile_scene_idx`(`mobile`, `scene`),
    INDEX `sys_sms_code_used_idx`(`used`),
    INDEX `sys_sms_code_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_social_user` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` VARCHAR(64) NOT NULL,
    `type` TINYINT NOT NULL,
    `openid` VARCHAR(128) NOT NULL,
    `token` VARCHAR(1024) NULL,
    `raw_token_info` TEXT NULL,
    `nickname` VARCHAR(100) NULL,
    `avatar` VARCHAR(512) NULL,
    `raw_user_info` LONGTEXT NULL,
    `code` VARCHAR(256) NULL,
    `state` VARCHAR(256) NULL,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_social_user_tenant_id_idx`(`tenant_id`),
    INDEX `sys_social_user_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `uk_tenant_social_type_openid`(`tenant_id`, `type`, `openid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_social_user_bind` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` VARCHAR(64) NOT NULL,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `user_type` TINYINT NOT NULL,
    `social_user_id` INTEGER UNSIGNED NOT NULL,
    `social_type` TINYINT NOT NULL,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_social_user_bind_tenant_id_idx`(`tenant_id`),
    INDEX `sys_social_user_bind_social_user_id_idx`(`social_user_id`),
    INDEX `sys_social_user_bind_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `uk_tenant_user_social_type`(`tenant_id`, `user_id`, `user_type`, `social_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_social_client` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `social_type` TINYINT NOT NULL,
    `user_type` TINYINT NOT NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `client_id` VARCHAR(255) NOT NULL,
    `client_secret` VARCHAR(255) NOT NULL,
    `agent_id` VARCHAR(128) NULL,
    `public_key` TEXT NULL,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_social_client_tenant_id_social_type_user_type_idx`(`tenant_id`, `social_type`, `user_type`),
    INDEX `sys_social_client_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_login_log` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` VARCHAR(64) NOT NULL,
    `log_type` TINYINT NOT NULL,
    `trace_id` VARCHAR(64) NULL,
    `user_id` INTEGER UNSIGNED NULL,
    `user_type` TINYINT NULL,
    `username` VARCHAR(30) NOT NULL,
    `result` TINYINT NOT NULL,
    `user_ip` VARCHAR(50) NOT NULL,
    `user_agent` VARCHAR(512) NOT NULL,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_login_log_tenant_id_idx`(`tenant_id`),
    INDEX `sys_login_log_user_id_user_type_idx`(`user_id`, `user_type`),
    INDEX `sys_login_log_username_idx`(`username`),
    INDEX `sys_login_log_create_time_idx`(`create_time`),
    INDEX `sys_login_log_result_idx`(`result`),
    INDEX `sys_login_log_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_operate_log` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` VARCHAR(64) NOT NULL,
    `trace_id` VARCHAR(64) NULL,
    `user_id` INTEGER UNSIGNED NULL,
    `user_type` TINYINT NULL,
    `type` VARCHAR(64) NOT NULL,
    `sub_type` VARCHAR(64) NOT NULL,
    `biz_id` BIGINT UNSIGNED NULL,
    `action` TEXT NOT NULL,
    `extra` LONGTEXT NULL,
    `request_method` VARCHAR(16) NULL,
    `request_url` VARCHAR(255) NULL,
    `user_ip` VARCHAR(50) NOT NULL,
    `user_agent` VARCHAR(512) NOT NULL,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_operate_log_tenant_id_idx`(`tenant_id`),
    INDEX `sys_operate_log_user_id_user_type_idx`(`user_id`, `user_type`),
    INDEX `sys_operate_log_type_sub_type_idx`(`type`, `sub_type`),
    INDEX `sys_operate_log_biz_id_idx`(`biz_id`),
    INDEX `sys_operate_log_create_time_idx`(`create_time`),
    INDEX `sys_operate_log_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_tenant` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `contact_user_id` INTEGER UNSIGNED NULL,
    `contact_name` VARCHAR(50) NULL,
    `contact_mobile` VARCHAR(11) NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `websites` JSON NULL,
    `package_id` INTEGER UNSIGNED NULL,
    `expire_time` DATETIME(3) NULL,
    `account_count` INTEGER NOT NULL DEFAULT 0,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_tenant_package_id_idx`(`package_id`),
    INDEX `sys_tenant_contact_mobile_idx`(`contact_mobile`),
    INDEX `sys_tenant_expire_time_idx`(`expire_time`),
    INDEX `sys_tenant_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `uk_tenant_name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_tenant_package` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `remark` VARCHAR(500) NULL,
    `menu_ids` JSON NULL,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_tenant_package_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `uk_tenant_package_name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_oauth2_client` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` VARCHAR(64) NOT NULL,
    `client_id` VARCHAR(128) NOT NULL,
    `secret` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `logo` VARCHAR(255) NULL,
    `description` VARCHAR(500) NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `access_token_validity_seconds` INTEGER NOT NULL DEFAULT 7200,
    `refresh_token_validity_seconds` INTEGER NOT NULL DEFAULT 2592000,
    `redirect_uris` JSON NULL,
    `authorized_grant_types` JSON NULL,
    `scopes` JSON NULL,
    `auto_approve_scopes` JSON NULL,
    `authorities` JSON NULL,
    `resource_ids` JSON NULL,
    `additional_information` LONGTEXT NULL,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_oauth2_client_tenant_id_idx`(`tenant_id`),
    INDEX `sys_oauth2_client_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `uk_oauth2_client_id`(`client_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_oauth2_access_token` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` VARCHAR(64) NOT NULL,
    `access_token` VARCHAR(255) NOT NULL,
    `refresh_token` VARCHAR(255) NOT NULL,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `user_type` TINYINT NOT NULL,
    `user_info` JSON NULL,
    `client_id` VARCHAR(128) NOT NULL,
    `scopes` JSON NULL,
    `expires_time` DATETIME(3) NOT NULL,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_oauth2_access_token_refresh_token_idx`(`refresh_token`),
    INDEX `sys_oauth2_access_token_user_id_user_type_idx`(`user_id`, `user_type`),
    INDEX `sys_oauth2_access_token_client_id_idx`(`client_id`),
    INDEX `sys_oauth2_access_token_expires_time_idx`(`expires_time`),
    INDEX `sys_oauth2_access_token_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `uk_oauth2_access_token`(`access_token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_oauth2_refresh_token` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` VARCHAR(64) NOT NULL,
    `refresh_token` VARCHAR(255) NOT NULL,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `user_type` TINYINT NOT NULL,
    `client_id` VARCHAR(128) NOT NULL,
    `scopes` JSON NULL,
    `expires_time` DATETIME(3) NOT NULL,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_oauth2_refresh_token_user_id_user_type_idx`(`user_id`, `user_type`),
    INDEX `sys_oauth2_refresh_token_expires_time_idx`(`expires_time`),
    INDEX `sys_oauth2_refresh_token_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `uk_oauth2_refresh_token`(`refresh_token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_oauth2_code` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` VARCHAR(64) NOT NULL,
    `code` VARCHAR(255) NOT NULL,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `user_type` TINYINT NOT NULL,
    `client_id` VARCHAR(128) NOT NULL,
    `scopes` JSON NULL,
    `redirect_uri` VARCHAR(512) NOT NULL,
    `state` VARCHAR(255) NULL,
    `expires_time` DATETIME(3) NOT NULL,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_oauth2_code_tenant_id_idx`(`tenant_id`),
    INDEX `sys_oauth2_code_user_id_user_type_idx`(`user_id`, `user_type`),
    INDEX `sys_oauth2_code_expires_time_idx`(`expires_time`),
    INDEX `sys_oauth2_code_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `uk_oauth2_code`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_oauth2_approve` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` VARCHAR(64) NOT NULL,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `user_type` TINYINT NOT NULL,
    `client_id` VARCHAR(128) NOT NULL,
    `scope` VARCHAR(128) NOT NULL,
    `approved` BOOLEAN NOT NULL DEFAULT false,
    `expires_time` DATETIME(3) NULL,
    `creator` VARCHAR(64) NULL,
    `updater` VARCHAR(64) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `sys_oauth2_approve_tenant_id_idx`(`tenant_id`),
    INDEX `sys_oauth2_approve_expires_time_idx`(`expires_time`),
    INDEX `sys_oauth2_approve_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `uk_oauth2_approve_user_client_scope`(`user_id`, `user_type`, `client_id`, `scope`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
