import {LoadingManager} from 'three';

/** Packed models in source, exported viewers and Pages all use the same public texture directory. */
export function islandLoadingManager(){
 const manager=new LoadingManager();
 manager.setURLModifier(url=>{
  const surface=url.match(/(?:^|\/)island-surfaces\/([a-f0-9]{32}\.(?:png|jpg))$/);
  return surface?new URL('./island-surfaces/'+surface[1],document.baseURI).href:url;
 });
 return manager;
}
