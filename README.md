# Lijia Web

Next.js 多页面外贸官网，对接同级 `cms`。

## 路由

| 路径 | 页面 |
|------|------|
| `/` | Home |
| `/about` | About us |
| `/certificates` | Certificates |
| `/capabilities` | Capabilities |
| `/manufacturing` | Manufacturing |
| `/contact` | Contact us |
| `/about/news` | News & Events |
| `/api/revalidate` | CMS 同步前台 |

## 结构

- `components/`：仅公共头尾与 Logo
- `app/*/page.tsx`：各页面内容写在页面内
- `app/globals.scss`：全站唯一样式表（含工具类与页面样式）

## 本地

```bash
nvm use
npm install
npm run dev
```

前台 http://localhost:3001 ，CMS 需先启动。
