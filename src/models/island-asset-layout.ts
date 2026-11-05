export type AssetPlacement={url:string;at:[number,number,number];height:number;angle?:number;fit?:[number,number,number];slot?:string;solid?:boolean;cut?:[number,number,number,number,number,number];prefixes?:string[];tint?:string;support?:string;materialTints?:Record<string,string>;curtainGap?:boolean;foliageOnly?:boolean;plantCut?:boolean;frameCut?:boolean;removeOnly?:boolean;cutMaterial?:string;interactive?:boolean};
const cc0=import.meta.glob('../assets/cc0-test/*.glb',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
const abo=import.meta.glob('../assets/abo-test/*.glb',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
const url=(id:string)=>cc0[`../assets/cc0-test/${id}.glb`]||abo[`../assets/abo-test/${id}.glb`];
const p=(id:string,x:number,y:number,z:number,height:number,angle=0,extra:Partial<AssetPlacement>={}):AssetPlacement=>({url:url(id),at:[x,y,z],height,angle,...extra});
const basket=(x:number,y:number,z:number)=>p('wicker_basket_01',x,y,z,.35);
const plant=(x:number,y:number,z:number,h=1)=>p('potted_plant_02',x,y,z,h);
const bed=(id:string,z:number):AssetPlacement=>p(id,-5.1,.06,z,2.1,Math.PI/2,{fit:[4.25,2.1,5.35],cut:[-7.95,.06,z-2.25,-2.25,2.65,z+2.25]});
const sofa=(id:string,x:number,z:number,angle=0,width=3.8):AssetPlacement=>p(id,x,.08,z,1.5,angle,{fit:[width,1.5,1.45],cut:Math.abs(Math.sin(angle))>.5?[x-.8,.06,z-width/2-.1,x+.8,1.6,z+width/2+.1]:[x-width/2-.1,.06,z-.8,x+width/2+.1,1.6,z+.8]});
export const islandAssetAdditions:Record<string,AssetPlacement[]>={
 warehouseOutside:[p('wooden_display_shelves_01',5.65,.25,1.3,2.8),p('B07WMQ8P8Q',5.9,.25,3,1.1),basket(5.9,.25,-3),basket(7.2,.25,-3),p('shelf_large',-5.7,.25,-1,2.4,Math.PI/2)],
 farm:[basket(-11.2,.12,-11),basket(-10,.12,-11),p('tree_stump_01',-16.5,.1,10,1.2),p('mushroom_redGroup',-15.5,.1,8.5,.5,0,{solid:false}),p('mushroom_redGroup',11,.1,13,.4,.7,{solid:false}),p('wooden_display_shelves_01',-11,.625,-14.2,2.4,Math.PI/2)],
 academy:[p('bookcase_books',-7,.2,9.2,2.5,Math.PI/2),p('bookcase_books',7,.2,9.2,2.5,-Math.PI/2),p('desk',-9,.2,9.2,1.3),p('chair',-9,.2,10.7,1.6,Math.PI),p('houseplant_2',9,.2,9.2,1.25),p('desk_light',-8.3,1.5,9.2,.5)],
 shopping:[p('B007IHF36E',-5,.5,8.3,2.1),p('wooden_display_shelves_01',5,.5,8.3,2.4,Math.PI/2),p('B07MF1NJ7Q',-5,2.6,8.3,.35),basket(5,.5,10.4),basket(-5,.5,10.4),p('houseplant_1',6.4,.5,8.5,.75)],
 market:[p('B07K12WN6V',0,.4,-5.5,1.5),p('B07MF1NJ7Q',0,1.9,-5.5,.35),basket(-1.9,.4,-5.5),basket(1.9,.4,-5.5),p('shelf_large',-2,.4,7,2.3),p('B01D3C7Z4A',2,.4,7,1.5),p('B075HWDSDK',2,1.9,7,.2)],
 libraryOutside:[p('bookcase_books',-10.8,.4,7.5,2.8),p('bookcase_books',10.8,.4,7.5,2.8),p('B07TLDNPXW',-11,.4,11.6,1.25),p('chair',-12.5,.4,11.6,1.6,Math.PI/2),p('chair',-9.5,.4,11.6,1.6,-Math.PI/2),p('B07TLDNPXW',11,.4,11.6,1.25),p('chair',9.5,.4,11.6,1.6,Math.PI/2),p('chair',12.5,.4,11.6,1.6,-Math.PI/2),plant(-13,.4,8.5),plant(13,.4,8.5)],
 lighthouseOutside:[basket(-3.8,.65,3),plant(3.8,.65,3,.75)],
 shrineOutside:[basket(-6.2,1.2,5.4),plant(6,1.2,5.4,.7)],
 treehouseOutside:[p('drawer',-3.7,11.3,3.4,1),basket(-3.7,12.3,3.4),p('houseplant_3',3.8,11.3,2.2,.65),p('mushroom_redGroup',-4,.1,5,.5,0,{solid:false})],
 villaOutside:[p('villa-single-table',-8.65,.15,3.5,.85)],
 townHouse:[basket(-2.1,.68,1.9),p('houseplant_1',1.6,.68,2,.55),p('drawer',-2.1,.68,.8,.8)],
 townStation:[p('B0857JZJPR',-1,.24,-.9,.8,0,{fit:[2.2,.8,.7]})],
 townRestaurant:[p('B07K12WN6V',-4.4,.2,1.2,1.2),p('B07MF1NJ7Q',-4.75,1.4,.95,.22),p('B07TLDNPXW',-2.2,.2,5.6,1.25),p('B07TLDNPXW',2.2,.2,5.6,1.25),p('B0857JQ3BZ',-3.4,.2,5.6,1.65,Math.PI/2),p('B0857JQ3BZ',-1,.2,5.6,1.65,-Math.PI/2),p('B0857JQ3BZ',1,.2,5.6,1.65,Math.PI/2),p('B0857JQ3BZ',3.4,.2,5.6,1.65,-Math.PI/2),basket(-4.3,.2,2.8)],
 townPark:[p('B0857JZJPR',-3.8,0,-4.73,.8,0,{fit:[3,.8,.8]}),p('B0857JZJPR',3.8,0,-4.73,.8,0,{fit:[3,.8,.8]})],
 pierOutside:[basket(-1.4,.65,-1),p('B078JG4N1N',1.4,.65,-1,.65)],
 caveOutside:[p('hanging_moss',-3,4.4,4.5,1.4,0,{solid:false,tint:'#627b46'}),p('hanging_moss',3,4.4,4.5,1.1,0,{solid:false,tint:'#627b46'}),p('mushroom_redGroup',-3,.1,5.5,.5,0,{solid:false}),p('tree_stump_01',4,.1,6.5,.8)],
 forestOutside:[p('tree_stump_01',-8,.1,6,.8),p('log',8,.1,6,.8,.5),p('mushroom_redGroup',-7,.1,6,.4,0,{solid:false})],
 office:[basket(3.5,.02,-4.3),p('houseplant_2',3.8,.02,3.7,1.1)],
 bedroom:[p('wicker_basket_01',.9,.03,-4.65,.55,0,{fit:[.85,.55,.7],prefixes:['61_藤编收纳篮与白衬'],cut:[5.24,.04,-1.95,6.27,.8,-1.05]}),p('standing_picture_frame_01',3.8,1.55,-4.66,.54,-Math.PI/2,{solid:false,frameCut:true,prefixes:['03_保留陈设与地板_BR_9bb3a0_'],cut:[3.50,1.515,-4.745,4.10,1.965,-4.645]})],
 residence:[basket(-5,.2,-3.6),p('wooden_display_shelves_01',6.8,.2,-3.7,2.2,0),p('houseplant_2',6.8,2.4,-3.7,.45)],
 feihua:[p('bookcase_books',-10,7.7,-6.1,2.2),basket(-10,7.7,-4.7),p('houseplant_3',-8.2,7.7,-6.1,.7)],
 lobby:[sofa('couch_medium',-8,5),sofa('couch_large',-2,5),sofa('couch_small',-8,-3,Math.PI/2),p('ceiling_light',-8,13,5,2,0,{solid:false}),p('floor_light',-8.1,.03,9.4,2.4)],
 hecate:[p('shelf_large',7.42,.05,1.3,5.2,-Math.PI/2,{fit:[2.8,5.2,.8],cut:[6.9,.06,-.15,7.98,5.3,2.75]}),p('office_chair',5.7,.05,-3.5,2.1,Math.PI/2,{cut:[5.05,.06,-4.1,6.35,2.2,-2.9]}),p('desk_light',6.8,1.53,-4.8,.7,-Math.PI/2),p('houseplant_1',-2.3,.04,-5.6,.7)],
 hebe:[p('sofa_furniture',1.4,.08,-4.9,1.5,0,{fit:[3.8,1.5,1.4],cut:[-.8,.06,-5.7,3.5,1.7,-4.05]}),p('chandelier',1,5.4,-2.7,1.1,0,{solid:false}),p('chair',5.7,.05,-.1,2,Math.PI/2,{cut:[5,.06,-.8,6.4,2.25,.6]}),p('rug',3.4,.04,5.1,.02,0,{fit:[2.9,.02,2.5],solid:false})],
 dolly:[bed('bed_twin',.4),p('curtains_double',1.7,.15,-6.55,5.9,0,{fit:[8.7,5.9,.2],tint:'#f2ede4',curtainGap:true,solid:false,cut:[-3.3,.1,-6.7,6.8,6.2,-6.2]}),p('bookcase_books',6.65,.03,-6.3,5.7,0,{fit:[1.65,5.7,.75],materialTints:{DarkWood:'#d4e0e6',Wood1:'#e7e4dc',Wood2:'#edf1ee',Cover1:'#7395b5',Cover2:'#e4ddd0',Cover3:'#b5c9d6',Cover4:'#a6b9b0',Cover5:'#d5cbc8',Cover6:'#a1b0c1',Pages:'#f0ece1'},cut:[5.78,.06,-6.9,7.25,6.25,-5.7]})],
 owner:[{...sofa('couch_l',-7,2.7,Math.PI/2),fit:[3.8,1.5,2.8]},sofa('couch_medium',-4,5.5,Math.PI),p('office_chair',2.2,.04,-5.1,2.2,0,{cut:[1.5,.06,-5.8,2.9,2.2,-4.4]}),p('drawer',6.3,.03,6.7,1.1,0,{materialTints:{DarkWood:'#cbd7df',Wood:'#e9edf0'}}),p('table_lamp',6.3,1.13,6.7,.8)],
};
// The lighthouse has a narrow entrance; its existing dedicated seating stays clear.
islandAssetAdditions.lighthouseOutside=[basket(-3.8,.65,3),plant(3.8,.65,3,.75)];
islandAssetAdditions.warehouseOutside.push(p('B078JM9XSJ',6,.25,-4,.5),p('B078JM9XSJ',7.3,.25,-4,.5));
islandAssetAdditions.academy.push(p('B07B8NW6C9',-10.48,1.2,3,1.3,Math.PI/2));
islandAssetAdditions.townRestaurant.push(p('B07BLB6644',-4.2,1.4,1.3,.22),p('B07YPRSX86',4.4,.2,2.7,.9));
islandAssetAdditions.townPark.push(p('B07YPRSX86',-5,0,-3,.9));
for(const kind of ['lobby','owner','hebe'])for(const item of islandAssetAdditions[kind]){
 if(/\/(couch_|sofa_furniture)/.test(item.url))item.tint=kind==='hebe'?'#d5c9c8':'#dce4e9';
}

for(const kind of ['market','townRestaurant'])for(const item of islandAssetAdditions[kind])if(/B07MF1NJ7Q|B07BLB6644/.test(item.url))item.support='B07K12WN6V';
for(const item of islandAssetAdditions.villaOutside)if(item.url.includes('table_lamp'))item.support='B01D3C7Z4A';

for(const item of islandAssetAdditions.dolly)if(item.url.includes('bed_twin'))item.materialTints={PillowCover:'#f3f0e9',ComforterLight:'#c9d9e8',Comforter:'#9fbcdc',Mattress:'#eeeae4',DarkWood:'#a5afb5',Wood:'#dce2e5'};

for(const kind of ['townHouse','townRestaurant'])for(let i=0;i<3;i++)islandAssetAdditions[kind].push(p('potted_plant_02',0,.02,0,.75,0,{slot:'townGarden'+i}));
islandAssetAdditions.libraryOutside.push(p('potted_plant_02',-10.9,1.1,5.5,1.5,0,{slot:'libraryGarden0',foliageOnly:true}),p('potted_plant_02',10.9,1.1,5.5,1.5,0,{slot:'libraryGarden1',foliageOnly:true}));
const rug=(x:number,z:number,w:number,d:number,tint:string)=>p('rug',x,.045,z,.02,0,{fit:[w,.02,d],solid:false,tint,cut:[x-w/2-.04,.015,z-d/2-.04,x+w/2+.04,.13,z+d/2+.04]});
islandAssetAdditions.lobby.push(rug(-8,5.5,5.7,5.3,'#d7dee2'),rug(-2,5.5,5.7,5.3,'#d7dee2'));
islandAssetAdditions.owner.push(rug(-5,3.7,7,4.5,'#87a4bf'));
islandAssetAdditions.hecate.push(rug(-3.2,1,6.3,5.9,'#b47869'));
islandAssetAdditions.dolly.push(rug(-1.3,3.7,6.7,4.6,'#d6dfdc'));
islandAssetAdditions.bedroom.push(rug(4.4,-2.95,2.9,1.45,'#aaa68f'));

// Custom models are kept as independent local placements so old furniture and architecture remain intact.
islandAssetAdditions.hecate.push(
 p('hecate-travel-map',-7.61,2.40,.5,1.9,Math.PI/2,{fit:[3.4,1.9,.13],solid:false,prefixes:['furniture_区域_-2_0_1_SR_c9bea5_','furniture_区域_-2_0_0_SR_b4b3a0_','furniture_区域_-2_0_0_SR_d7cfbd_','furniture_区域_-2_0_1_SR_b4b3a0_','furniture_区域_-2_0_1_SR_d7cfbd_','furniture_区域_-2_-1_0_SR_b4b3a0_','furniture_区域_-2_-1_1_SR_b4b3a0_']}),
 p('hecate-globe',-7.73,5.15,.8,.95,0,{fit:[.82,.95,.82],solid:false,interactive:true,prefixes:['互动_globe_']}),
 p('hecate-specimens',2.4,.91,4.4,.34,0,{fit:[2.35,.34,1.18],solid:false,interactive:true,prefixes:['互动_collection_SR_729dcc_','互动_collection_SR_b794c8_','互动_collection_SR_d6c199_']})
);
islandAssetAdditions.hebe.push(p('hebe-wardrobe-outfits',-7.43,1.98,-4.35,2.22,Math.PI/2,{fit:[3.42,2.22,.50],solid:false,cutMaterial:'873b51',cut:[-7.57,1.96,-6.33,-7.31,4.24,-2.37]}));
islandAssetAdditions.hebe.push({url:'',at:[0,0,0],height:0,removeOnly:true,slot:'oldWhiteOutfitMask',solid:false,cutMaterial:'eef0f2',cut:[-7.57,1.96,-6.33,-7.31,4.24,-2.37]});
for(const [y,z] of [[3.1,1.95],[3.25,-.3],[4.15,-1.2]])islandAssetAdditions.dolly.push({url:'',at:[0,0,0],height:0,removeOnly:true,slot:'dollyPictureMask',solid:false,cut:[-7.70,y-.44,z-.38,-7.48,y+.44,z+.38]});
islandAssetAdditions.dolly.push(p('dolly-chess',-4.8,.76,5.72,.22,0,{solid:false}),p('dolly-magic-cube',1.5,.05,3.8,.42,-.4,{solid:false}),p('dolly-puzzle',-1.4,.05,3.1,.14,.35,{solid:false}),p('dolly-chess',-.6,.05,4.45,.18,.25,{solid:false}),p('dolly-magic-cube',-.3,.05,2.3,.35,-.25,{solid:false}));
for(const [y,z] of [[3,2.4],[4.35,2.1],[3.8,-1.3],[2.6,-.6]])islandAssetAdditions.hecate.push({url:'',at:[0,0,0],height:0,removeOnly:true,slot:'hecatePhotoMask',solid:false,cut:[-7.74,y-.40,z-.34,-7.43,y+.40,z+.34]});
for(let i=0;i<7;i++){const x=-2.4+(i%3)*1.35,z=3.1+Math.floor(i/3)*.85;islandAssetAdditions.dolly.push({url:'',at:[0,0,0],height:0,removeOnly:true,slot:'dollyBookMask',solid:false,cut:[x-.65,.09,z-.52,x+.65,.36,z+.52]});}
islandAssetAdditions.dolly.push({url:'',at:[0,0,0],height:0,removeOnly:true,slot:'dollyBookMask',solid:false,cut:[-1.55,.10,5.03,-.05,.36,6.10]});
islandAssetAdditions.dolly.push({url:'',at:[0,0,0],height:0,removeOnly:true,slot:'dollyBookMask',solid:false,cut:[-3.2,.075,2.45,1.3,.50,6.3]});
for(const color of ['729dcc','e7e9ee','c5a66d'])islandAssetAdditions.dolly.push({url:'',at:[0,0,0],height:0,removeOnly:true,slot:'dollyStackMask',solid:false,cutMaterial:color,cut:[-5.38,.79,5.29,-4.22,1.4,6.10]});
islandAssetAdditions.townPark.push(p('park-slide',4.03,.12,.5,2.1,Math.PI,{solid:true,slot:'parkSlide'}));
for(const side of [-1,1])for(let i=0;i<6;i++)islandAssetAdditions.villaOutside.push(p('villa-flowers',side*9.36+(i%3-1)*.7,.45,6.96+(i<3?-.55:.55),.65,(i+side)*.8,{solid:false,slot:'villaFlowers'}));
