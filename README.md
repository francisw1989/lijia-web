# Lijia Web

外贸官网前台（Next.js SSG 示例）。CMS 在同级目录 `../cms`。

## 本地启动

需要 Node.js 20+：

```bash
nvm use
cp .env.local.example .env.local
npm install
npm run dev
```

- 前台：http://localhost:3001
- CMS API：默认 `http://localhost:3000`（先启动 cms）

## 环境变量

| 变量 | 说明 |
|------|------|
| `CMS_API_URL` | CMS 地址，如 `http://localhost:3000` |
| `REVALIDATE_SECRET` | 与 CMS 一致，用于 `/api/revalidate` |

## 联调流程

1. 启动 CMS（`cd ../cms && npm run dev`）
2. 启动本项目（`npm run dev`）
3. 打开 http://localhost:3001/articles 查看已发布文章
4. 在 CMS 文章列表点击「同步前台」
5. 刷新前台，应看到最新内容；「查看网页源代码」中也有正文 HTML

## 同步接口

CMS 调用：

```http
POST http://localhost:3001/api/revalidate
x-revalidate-secret: <REVALIDATE_SECRET>
Content-Type: application/json

{ "type": "article", "id": 1, "action": "sync" }
```
