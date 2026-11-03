# GitHub Pages 部署

仓库为 `Geminichangpu/Bittertle-island`，`main` 推送会触发已有 GitHub Pages 工作流。发布使用根目录的 `比特尔特岛-布局.json`：先在编辑器导出并保存为该文件，再执行构建。浏览器本机自动保存的数据不会自动进入 Git。请勿把隐私内容放入公开布局。

## 首次准备

1. 在 Windows 安装 Node.js 24 LTS 并加入 PATH，重新打开终端后运行 `npm install -g pnpm@10.19.0` 安装 pnpm。然后在项目目录运行 `pnpm install --frozen-lockfile`、`pnpm build:viewer -- --use-project-layout`、`pnpm build`，并在浏览器实际检查编辑器和只读网页。也可通过 `node scripts/serve.mjs dist-viewer 4173` 预览，只读页必须通过 HTTP 访问。更新脚本使用系统 Node.js 和 pnpm，不依赖 Codex 缓存。
2. `art_source/blender/` 和 `assets/textures/` 中的制作贴图原件被忽略，仍保留在原目录；请另做完整备份。2026-11-03 起，已由 Meshopt 替代的室内／神社原始 GLB、旧樱花 GLB 和未使用的 `*-orm.jpg` 也从当前 Git 版本移除并忽略，本机原件仍在原路径。网页使用的压缩 GLB 与底色／法线／粗糙度贴图继续提交，干净检出可直接构建。可选的 `prepare-*-meshopt.mjs` 重新生成脚本需要本机保留的原始导出件，普通构建不需要这些原件。生成的 `public/viewer-template/`、`dist/` 和 `dist-viewer/` 不提交；编辑器构建前先运行 `pnpm build:viewer`，模板仅清理上一份 manifest 中已被替代的资产，不删除未知文件。
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

编辑后从编辑器导出布局 JSON 并覆盖根目录的同名文件，保留额外备份。双击 `更新网页.cmd`：它显示变更，构建只读版与编辑器，要求确认后暂存并输入提交信息，获取远端并检查 main 是否包含远端提交，再要求确认普通推送。发生冲突、构建失败或远端领先时停止；自行整合后再运行。它不会强制推送。推送后等待 Actions 完成，并在实际 Pages 地址检查模型、贴图、布局和室内场景。

需要手动发布另一份布局时，可在编辑器中使用发布按钮生成包含当前编辑器布局的 ZIP；它依赖先生成的 viewer-template。自动部署只读取根布局，不读取编辑器浏览器存档。

## 大文件与历史

当前版本的无用文件删除不会自动从 Git 历史中消失。只为查看或构建最新版本，可使用 `git clone --depth 1 https://github.com/Geminichangpu/Bittertle-island.git`。本轮清理保留已有提交和分支，不强制推送；彻底缩小历史对象需要另行安排历史改写并协调所有克隆。
