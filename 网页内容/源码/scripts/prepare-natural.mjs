import {mkdir,writeFile} from 'node:fs/promises';
import {createDemo} from '../src/data/model.ts';

await mkdir('public',{recursive:true});
const project=createDemo();
project.projectName='比特尔特岛 · 自然重制';
await writeFile('public/project.json',JSON.stringify(project));
console.log('自然小岛的默认布局已准备。');
