-- 内容指纹跨租户秒传：按 hash / path 查物理文件引用
CREATE INDEX `sys_file_hash_idx` ON `sys_file`(`hash`);
CREATE INDEX `sys_file_path_idx` ON `sys_file`(`path`);
