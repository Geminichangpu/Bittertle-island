import {createRoot} from 'react-dom/client';
import './style.css';
import './island-theme.css';
declare const __VIEWER__:boolean;
const root=createRoot(document.getElementById('root')!);
const load=__VIEWER__?import('./ViewerApp'):import('./App');
load.then(({default:App})=>root.render(<App/>)).catch(()=>root.render(<div className="startup-error">网页资源加载失败。请确认静态资源完整，刷新页面重试。</div>));
