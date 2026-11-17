# GitHub Pages 部署

仓库为 `Geminichangpu/Bittertle-island`，`main` 推送会触发已有 GitHub Pages 工作流。发布使用根目录的 `比特尔特岛-布局.json`：先在编辑器导出并保存为该文件，再执行构建。浏览器本机自动保存的数据不会自动进入 Git。请勿把隐私内容放入公开布局。

## 首次准备

1. 在 Windows 安装 Node.js 24 LTS 并加入 PATH，重新打开终端后运行 `npm install -g pnpm@10.19.0` 安装 pnpm。然后在网页内容/源码目录运行 `pnpm install --frozen-lockfile`、`pnpm build:viewer -- --use-project-layout`、`pnpm check:editor`，并在浏览器实际检查编辑器和只读网页。也可通过 `node scripts/serve.mjs dist-viewer 5186` 预览，只读页必须通过 HTTP 访问。更新脚本使用系统 Node.js 和 pnpm，不依赖 Codex 缓存。
2. 本机制作资源集中在 `资源/`，保留 `art_source/blender/`、`assets/textures/` 和 `src/assets/models/` 等原有层级。公开的贴图来源与授权清单在 `assets/textures/`。可选的 `prepare-*-meshopt.mjs` 从 `资源/src/assets/models/` 读取原始 GLB。普通构建直接使用项目里的压缩 GLB 与底色、法线、粗糙度贴图。开发检查和截图在 `codex/`，`reports/` 是历史报告链接的兼容入口。生成的 `dist/` 和 `dist-viewer/` 不提交。先运行 `pnpm build:viewer` 生成展示版，开发服务器从该目录提供导出模板。
3. 检查待提交文件，特别是大文件和敏感内容。GitHub 对超过 50 MiB 的普通 Git 文件发出警告，对超过 100 MiB 的文件拒绝推送。运行 GLB 不统一使用 LFS；若以后确实需要 LFS，先选定具体文件，配置 Git LFS 并确保 Actions checkout 使用 `lfs: true`，构建时必须拿到真实文件而不是指针。LFS 有存储和带宽配额。
4. 在 GitHub 创建空仓库（不要预先添加 README）。验证通过后在 PowerShell 中执行：

```powershell
cd 'D:\3D模型\网页3D\Bittertle island'
git init -b main
git status --short
git add -A
git diff --cached --stat
git commit -m "Initial island source"
git remote add origin <仓库地址>
git push -u origin main
```

如远端已有提交，先检查和整合历史；不要强制推送。仓库地址替换为自己的 HTTPS 或 SSH 地址。

5. 仓库 Settings → Pages → Build and deployment → Source 选择 GitHub Actions。推送 main 后，在 Actions 查看部署日志和链接。仓库公开性与 Pages 可用性取决于 GitHub 账户和仓库设置。项目页通常为 `https://用户名.github.io/仓库名/`。构建使用相对 base `./`，适用于仓库子路径和域名根路径。

## 后续更新

本机入口是项目根目录的 `启动沙盘.cmd`，启动 `网页内容/展示版` 中与 GitHub Pages 对应的只读版本。源码、布局和构建配置集中在 `网页内容/源码`。

需要手动发布另一份布局时，可在编辑器中使用发布按钮生成包含当前编辑器布局的 ZIP；它依赖先生成的 viewer-template。自动部署只读取根布局，不读取编辑器浏览器存档。

## 大文件与历史

当前版本的无用文件删除不会自动从 Git 历史中消失。只为查看或构建最新版本，可使用 `git clone --depth 1 https://github.com/Geminichangpu/Bittertle-island.git`。本轮清理保留已有提交和分支，不强制推送；彻底缩小历史对象需要另行安排历史改写并协调所有克隆。

展示版只保存在 `dist-viewer`，开发服务器直接从该目录提供导出模板，不再生成第二份目录。`dist-viewer/project.json` 是展示布局，构建时会保留或按明确的项目布局参数更新。启动沙盘使用 5186 端口的开发服务器；推送前的编辑器构建在临时目录检查后自动清理。手动运行 `pnpm build` 会生成包含导出模板、可独立部署的 `dist` 目录。
