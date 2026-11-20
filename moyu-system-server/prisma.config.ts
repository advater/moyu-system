// Prisma 7 根配置
// - 迁移（migrate / db push / studio CLI）通过 datasource.url 连接数据库
// - 运行期 PrismaClient 在应用入口通过驱动适配器创建
import "./src/config/load-env";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env["DATABASE_URL"] || "",
  },
  migrations: {
    path: "prisma/migrations",
  },
});
