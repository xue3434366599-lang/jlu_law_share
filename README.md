# JLU Law Share

面向吉林大学法学院本科生的免费学习资料共享网站。学生自发、非官方、非商业。纯 HTML / CSS / 原生 JavaScript，JSON 管理资料；无需构建、账号、数据库或运行时第三方服务。

## 本地运行

在项目目录运行 `python -m http.server 8000 --bind 127.0.0.1`，访问 http://127.0.0.1:8000 。不要用 file:// 打开，因为浏览器需要通过 HTTP fetch JSON。

## 维护资料

公开目录为 `data/resources.json`，初始值是 `[]`。只有 `status: "published"`、有效 HTTP/HTTPS 链接、非空唯一 id 和标题的记录才会展示；DEMO 记录不展示。所有资源及其 JSON 均为公开信息：**待审核内容、私人链接和投稿邮件不得放入站点或公开仓库**。pending 仅作为防误展示措施，不是保密机制。

审核分享权限后，将记录添加至数组：

```json
{
  "id": "resource-001",
  "title": "课程资料名称",
  "grades": ["2025"],
  "course": "课程名称",
  "teacher": "授课教师",
  "classType": "普通班",
  "type": "ppt",
  "semester": "2026秋",
  "verification": "",
  "description": "资料内容及适用范围",
  "author": "匿名",
  "url": "",
  "status": "pending"
}
```

`grades` 是适用年级数组，与考试年份不同；考试学期写入 `semester`，必要时在说明中补充考试日期。班型可用普通班、实验班、通用、未知；type 可用 ppt、exam-recall、other。回忆版应填写 verification（例如单人回忆、多人核对，须有依据）。缺失的可选字段有兜底。填写经审核的真实链接后再将 status 改为 published；请实际打开链接确认权限和有效性。仅允许 HTTP/HTTPS，不允许带用户名密码的 URL。

`tests/fixtures/demo-resources.json` 是标有 DEMO 的虚构测试数据，无下载链接，默认 pending；不被页面加载，也不进入 Pages 部署产物。浏览器测试仅在内存拦截中注入测试记录，example.invalid 是保留测试域名，不表示真实下载地址。

## 投稿邮箱

统一配置在 `js/config.js` 的 `PROJECT_EMAIL`，已按用户提供设置为 `jlu_law_share@qq.com`。修改邮箱时同步更新 `index.html` 中 noscript 的无脚本备用联系地址。邮件主题和正文由页面生成；mailto 不会自动附加文件。复制失败会显示手动复制提示。邮箱收发是否正常需项目管理员实际测试，代码测试无法证明。

## 测试

`npm test`：无需安装依赖，验证数据过滤、缺失字段、危险链接和中文组合搜索。

`npm ci` 后启动上述 HTTP 服务，再运行 `npm run test:browser`：使用本机 Microsoft Edge 无头浏览器测试交互及 1440、1024、390、375px 布局，截图输出到忽略目录 `test-results/`。其他环境可修改测试中的 channel 或安装 Playwright Chromium。开发依赖只用于测试，不会在网站加载。

## GitHub Pages 部署

项目负责人已确认以空资料库公开上线。仓库为 [xue3434366599-lang/jlu_law_share](https://github.com/xue3434366599-lang/jlu_law_share)，部署状态见上线检查报告。

1. 检查下方身份清单，使用合适的项目 GitHub 账号和提交身份。初始化本地 Git 并提交前，检查 `git config --get user.name`、`git config --get user.email`；按需要设置仓库级身份，避免修改全局配置。
2. 创建 GitHub 仓库并推送代码。免费账号使用公开仓库时，仓库本身和提交历史都公开；私有仓库 Pages 可用性取决于账户方案。
3. 在仓库 Settings → Pages → Build and deployment 中选择 GitHub Actions。
4. 在 Actions 中选择 Deploy GitHub Pages → Run workflow。工作流仅支持手动触发，避免推送即发布。
5. 查看成功部署返回的网址，访问页面并验证 JSON、筛选、投稿邮箱及手机布局。项目仓库 Pages 子路径使用相对资源路径，无需修改代码。

工作流只发布 index.html、css、js、data，不发布 tests、报告或开发依赖。GitHub Actions 在远端的执行尚需实际验证。

部署流程已对照 [GitHub Pages 官方工作流文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) 核对。

## 匿名运营公开信息检查

- 使用项目账号；检查 GitHub 用户名、头像、简介、公开邮箱、关注列表及仓库所有者信息。
- 检查提交作者姓名和邮箱；需要时使用 GitHub 提供的 noreply 邮箱。已有提交的历史信息不会因修改配置自动消失。
- 投稿默认匿名公开；不把发件邮箱、邮件原文或未经同意的署名写入资料 JSON。
- 检查文件作者、修订记录、备注、截图、链接中的用户 ID 与网盘分享者信息；确认后再公开。
- 确认允许公众传播，课堂内使用许可不等于公开分享许可；不收录禁止传播的课件或未经授权的作品。
- 邮箱服务商、项目管理员、GitHub 和资料托管方可能掌握相应账户或访问数据；此项目不承诺技术上的完全匿名。

上线状态见 `LAUNCH-CHECKLIST.md`。
