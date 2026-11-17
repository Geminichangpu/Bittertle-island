import {zipSync,strToU8} from 'fflate';
import type {Project} from '../data/model';
import {validateProject} from '../data/validation';
import {download} from '../data/download';
export async function publishPackage(project:Project){
 validateProject(project);const base=new URL('./viewer-template/',document.baseURI),res=await fetch(new URL('manifest.json',base));if(!res.ok)throw new Error('发布模板尚未构建，请先运行 npm run build:viewer，再运行 npm run build 或重新打开开发页。');const list:unknown=await res.json();if(!Array.isArray(list)||!list.every(x=>typeof x==='string'&&!x.includes('..')&&!x.includes(':')&&!x.startsWith('/')))throw new Error('发布模板清单无效。');
 const files:Record<string,Uint8Array>={};await Promise.all(list.map(async name=>{const r=await fetch(new URL(name,base));if(!r.ok)throw new Error(`发布资源缺失：${name}`);files[name]=new Uint8Array(await r.arrayBuffer());}));
 files['project.json']=strToU8(JSON.stringify(project,null,2));files['发布说明.txt']=strToU8('比特尔特岛 · 只读网页分享包\n将此目录全部文件上传到静态网站托管（例如 GitHub Pages / Netlify）。\n本按钮只生成发布包，并未自动上线。访客可观察和聚焦地点，无编辑或本地存档写入接口。\n本地预览需 HTTP 服务器（例如 npx serve .），不要直接双击 index.html。\nproject.json 是公开数据，勿放入隐私内容。原作者工程请另行保存 JSON 备份。\n');const zip=zipSync(files,{level:6});download(zip as BlobPart,'比特尔特岛-只读网页分享包.zip','application/zip');
}
