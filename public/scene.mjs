import * as T from './vendor/three.module.min.js';
import {COLORS,createDeck,cardColor,ACTIONS} from './cards.mjs';
const canvas=document.querySelector('#scene'),wrap=document.querySelector('#sceneWrap');
let renderer,scene,camera,tableCards,labels,tableBase,started=false,isGame=false,inspect=()=>{},azimuth=0,polar=.67,distance=27,drag=null,hover=null,objects=[],top=false,lastFrame=0;
const textures=new Map(),targets=new Map(),ray=new T.Raycaster(),mouse=new T.Vector2();
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function rounded(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function wrapText(ctx,text,y,max=230,line=29){const words=text.split(' ');let s='';for(const word of words){const test=s+word+' ';if(ctx.measureText(test).width>max&&s){ctx.fillText(s.trim(),128,y);y+=line;s=word+' '}else s=test}ctx.fillText(s.trim(),128,y);return y}
function texture(c,back=false){
 const key=back?'back':c.id;if(textures.has(key))return textures.get(key);
 const el=document.createElement('canvas');el.width=256;el.height=384;const x=el.getContext('2d');
 x.fillStyle='#f4efdc';rounded(x,0,0,256,384,15);x.fill();
 if(back){x.fillStyle='#1e5145';rounded(x,9,9,238,366,12);x.fill();x.strokeStyle='#d8bb7c';x.lineWidth=2;rounded(x,20,20,216,344,8);x.stroke();x.globalAlpha=.12;for(let y=25;y<365;y+=22)for(let a=23;a<235;a+=22){x.beginPath();x.moveTo(a,y-6);x.lineTo(a+6,y);x.lineTo(a,y+6);x.lineTo(a-6,y);x.closePath();x.stroke()}x.globalAlpha=1;x.textAlign='center';x.fillStyle='#e6cb90';x.font='bold 20px Georgia';x.fillText('THE',128,129);x.font='bold 54px Georgia';x.fillText('DEAL',128,190);x.font='24px Georgia';x.fillText('CLUB',128,232);x.font='22px Georgia';x.fillText('◆',128,282)}
 else{
  x.fillStyle=cardColor(c);rounded(x,9,9,238,70,8);x.fill();x.fillStyle='#233b30';x.textAlign='left';x.font='bold 15px Arial';x.fillText(c.kind==='property'?'PROPERTY':c.kind==='money'?'MONEY':'ACTION',22,49);x.textAlign='center';x.lineWidth=2;x.strokeStyle='#233b3077';x.beginPath();x.arc(213,44,25,0,Math.PI*2);x.stroke();x.font='bold 19px Georgia';x.fillText(c.value+'M',213,51);
  x.fillStyle='#375a46';x.textAlign='center';
  if(c.kind==='property'){x.lineWidth=2;const base=183;x.strokeStyle='#46644e';x.fillStyle='#46644e18';for(let i=0;i<5;i++){const h=[40,67,90,57,36][i];x.fillRect(41+i*35,base-h,29,h);x.strokeRect(41+i*35,base-h,29,h);for(let j=base-h+9;j<base-6;j+=13){x.fillStyle='#46644e';x.fillRect(48+i*35,j,4,5);x.fillRect(60+i*35,j,4,5);x.fillStyle='#46644e18'}}x.fillStyle='#263e31';x.font='bold 24px Georgia';wrapText(x,c.name,220,214,27);x.font='13px Arial';x.fillStyle='#6f7a64';x.fillText(c.wild?'CHOOSE YOUR COLOUR':COLORS[c.colors[0]].size+' CARDS MAKE A SET',128,304);c.colors.forEach((color,i)=>{x.fillStyle=COLORS[color].hex;x.fillRect(10+i*236/c.colors.length,336,236/c.colors.length,14)})}
  else if(c.kind==='money'){x.font='bold 106px Georgia';x.fillText(c.value,128,214);x.font='18px Arial';x.fillText('MILLION',128,259);x.strokeStyle='#7caa8666';x.beginPath();x.ellipse(128,183,88,109,0,0,Math.PI*2);x.stroke()}
  else{x.font='76px Georgia';x.fillText(c.action==='rent'?'↗':ACTIONS[c.action]?.icon||'◆',128,186);x.fillStyle='#263e31';x.font='bold 26px Georgia';wrapText(x,c.name,240,220,29);if(c.colors)c.colors.forEach((color,i)=>{x.fillStyle=COLORS[color].hex;x.fillRect(10+i*236/c.colors.length,330,236/c.colors.length,12)})}
  x.fillStyle='#677b68';x.font='10px Arial';x.fillText('THE DEAL CLUB',128,369);
 }
 const tex=new T.CanvasTexture(el);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;textures.set(key,tex);return tex;
}
function mesh(geometry,color){return new T.Mesh(geometry,new T.MeshStandardMaterial({color,roughness:.8}))}
function box(w,h,d,color){return mesh(new T.BoxGeometry(w,h,d),color)}
function roundedTable(w,d,depth,color,r=.6){const s=new T.Shape(),x=-w/2,z=-d/2;s.moveTo(x+r,z);s.lineTo(x+w-r,z);s.quadraticCurveTo(x+w,z,x+w,z+r);s.lineTo(x+w,z+d-r);s.quadraticCurveTo(x+w,z+d,x+w-r,z+d);s.lineTo(x+r,z+d);s.quadraticCurveTo(x,z+d,x,z+d-r);s.lineTo(x,z+r);s.quadraticCurveTo(x,z,x+r,z);const m=mesh(new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelThickness:.035,bevelSize:.035,bevelSegments:2,steps:1,curveSegments:8}),color);m.rotation.x=-Math.PI/2;m.receiveShadow=true;return m}
function mat(x,z,a,active){const el=document.createElement('canvas');el.width=512;el.height=280;const ctx=el.getContext('2d');ctx.fillStyle=active?'#e1c68e10':'#081c191d';ctx.strokeStyle=active?'#d8c08760':'#b2b69530';ctx.lineWidth=2;rounded(ctx,4,4,504,272,26);ctx.fill();ctx.setLineDash([8,7]);ctx.stroke();const tex=new T.CanvasTexture(el),m=new T.Mesh(new T.PlaneGeometry(8.2,4.5),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));m.rotation.set(-Math.PI/2,0,-a);m.position.set(x,.13,z);labels.add(m)}
function card(c,x,z,angle=0,y=.24,back=false,scale=1,data=null){
 const gr=new T.Group(),slab=box(1.3,.045,1.95,'#dad5c5');gr.add(slab);const plane=new T.Mesh(new T.PlaneGeometry(1.3,1.95),new T.MeshStandardMaterial({map:texture(c,back),roughness:.68,transparent:true}));plane.rotation.x=-Math.PI/2;plane.position.y=.026;gr.add(plane);gr.position.set(x,y,z);gr.rotation.y=angle;gr.scale.setScalar(scale);slab.castShadow=true;slab.receiveShadow=true;plane.receiveShadow=true;gr.userData={card:c,...data,baseY:y};tableCards.add(gr);if(!back&&data?.clickable){objects.push(plane);plane.userData.parent=gr}return gr;
}
function label(text,x,z,rotation=0,size=3.4){const el=document.createElement('canvas');el.width=512;el.height=96;const ctx=el.getContext('2d');ctx.fillStyle='#dccda8';ctx.textAlign='center';ctx.font='500 25px Georgia';ctx.fillText(text,256,59);const tex=new T.CanvasTexture(el);const ob=new T.Mesh(new T.PlaneGeometry(size,size*96/512),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));ob.rotation.set(-Math.PI/2,0,rotation);ob.position.set(x,.18,z);labels.add(ob)}
function clear(group){for(const child of [...group.children]){child.traverse(obj=>{obj.geometry?.dispose();if(obj.material){if(group===labels)obj.material.map?.dispose();obj.material.dispose()}});group.remove(child)}}
function bankStack(n,x,z){for(let i=0;i<Math.min(n,8);i++)card({id:'bankback'},x,z,.05,.22+i*.045,true,.72)}
function deck(n){for(let i=0;i<Math.min(14,Math.ceil(n/5));i++)card({id:'back'},-.9,0,0,.22+i*.045,true,1.12);label('DRAW',-.9,1.65,0,1.4)}
function hero(){clear(tableCards);clear(labels);objects=[];isGame=false;tableBase.scale.set(.72,1,.77);azimuth=-.3;polar=.85;distance=26;
 const cards=createDeck();deck(70);
 const chosen=[cards.find(c=>c.action==='breaker'),cards.find(c=>c.name==='Boardwalk'),cards.find(c=>c.action==='no'),cards.find(c=>c.name==='Marvin Gardens')];
 chosen.forEach((c,i)=>{const gr=card(c,(i-1.5)*1.26,3.0+Math.abs(i-1.5)*.24,(i-1.5)*-.18,1.0+i*.045,false,1.75,{clickable:true});gr.rotation.x=-.12});
 [cards[9],cards[10],cards[11]].forEach((c,i)=>card(c,-4.6+i*.48,-3.3+i*.09,.13,.25+i*.055,false,1.22,{clickable:true}));
 [cards[22],cards[23]].forEach((c,i)=>card(c,4.6+i*.54,-2.2+i*.12,-.2,.24+i*.055,false,1.18,{clickable:true}));bankStack(6,4.6,2.2);label('MAKE YOUR NEXT MOVE',0,-5.2,0,7);started=true;
}
export function renderTable(state){if(!renderer)return;if(!state?.game){if(isGame||!started)hero();return}
 const g=state.game;isGame=true;tableBase.scale.set(1,1,1);clear(tableCards);clear(labels);objects=[];hover=null;
 const order=[...g.players.slice(state.you),...g.players.slice(0,state.you)];
 const layouts=order.length===2?[[0,5.2,0],[0,-5.2,Math.PI]]:order.length===3?[[0,5.2,0],[-6,-3,1],[6,-3,-1]]:order.length===4?[[0,5.2,0],[-8,0,Math.PI/2],[0,-5.2,Math.PI],[8,0,-Math.PI/2]]:[[0,5.4,0],[-8,1,Math.PI/2],[-4.3,-5.2,Math.PI],[4.3,-5.2,Math.PI],[8,1,-Math.PI/2]];
 order.forEach((p,idx)=>{const [cx,cz,a]=layouts[idx];mat(cx,cz,a,p.id===g.turn);const pos=(x,z)=>[cx+x*Math.cos(a)+z*Math.sin(a),cz-x*Math.sin(a)+z*Math.cos(a)];let [lx,lz]=pos(0,2);label(p.name+(p.id===state.you?' · YOU':''),lx,lz,-a,4.1);
  const all=p.groups;all.forEach((gr,j)=>{const col=j%4,row=Math.floor(j/4);const start=-Math.min(all.length-1,3)*.95;gr.cards.forEach((c,k)=>{const [x,z]=pos(start+col*1.9+k*.12,-row*1.8-k*.24);const obj=card(c,x,z,a,.23+k*.055,false,.78,{clickable:true,owner:p.id,group:gr.id});if(!reduced){const key=p.id+':'+c.id;const prev=targets.get(key);if(prev&&prev.distanceTo(obj.position)>.1){obj.userData.target=obj.position.clone();obj.position.copy(prev)}targets.set(key,obj.userData.target||obj.position.clone())}});if(gr.buildings.length){const [x,z]=pos(start+col*1.9,-row*1.8-.7);const building=box(.35,gr.buildings.length===2?.55:.35,.35,gr.buildings.length===2?'#d77760':'#7cad79');building.position.set(x,.45,z);building.castShadow=true;tableCards.add(building)}});
  if(!all.length){const [x,z]=pos(0,0);label('PROPERTY COLLECTION',x,z,-a,4.4)}
  const [bx,bz]=pos(Math.min(4.7,all.length*1.4+2),.7);bankStack(p.bank.length,bx,bz);label(p.balance+'M',bx,bz+1.15,-a,1.4);
  if(p.id!==state.you){for(let i=0;i<Math.min(p.handCount,7);i++){const [x,z]=pos((i-(Math.min(p.handCount,7)-1)/2)*.28,1.1);card({id:'back'},x,z,a,.25+i*.012,true,.46)}}
 });deck(g.drawCount);if(g.discard.length)card(g.discard[0],1.2,0,-.05,.26,false,1.12,{clickable:true});label('DISCARD',1.2,1.65,0,1.7);label('THE DEAL CLUB',0,-2,0,3);if(!started||distance<27){distance=30;polar=.64;azimuth=0}started=true;
}
export function onInspect(fn){inspect=fn}
export function toggleView(){top=!top;polar=top?.12:.64;azimuth=0;return top}
export function resetView(){azimuth=0;polar=.64;distance=isGame?30:26;top=false}
function point(e){const r=canvas.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera);return ray.intersectObjects(objects)[0]?.object.userData.parent}
export function init(){try{
 renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;
 scene=new T.Scene();camera=new T.PerspectiveCamera(37,1,.1,150);scene.add(new T.HemisphereLight('#fff3d5','#263b33',1.8));const light=new T.DirectionalLight('#fff0d1',2.4);light.position.set(-7,15,9);light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.camera.left=-18;light.shadow.camera.right=18;light.shadow.camera.top=14;light.shadow.camera.bottom=-14;light.shadow.normalBias=.035;scene.add(light);const fill=new T.DirectionalLight('#b5d8d0',.7);fill.position.set(8,8,-8);scene.add(fill);
 tableBase=new T.Group();scene.add(tableBase);const table=roundedTable(26,18,.6,'#26342b');table.position.y=-.65;tableBase.add(table);const trim=roundedTable(25.6,17.6,.12,'#b89858');trim.position.y=-.06;tableBase.add(trim);const felt=roundedTable(25.2,17.2,.06,'#173f32');felt.position.y=.03;tableBase.add(felt);
 // Fine inset boundary gives the playing surface a physical tabletop edge.
 const edges=new T.EdgesGeometry(new T.BoxGeometry(24,.01,16));const boundary=new T.LineSegments(edges,new T.LineBasicMaterial({color:'#b3a777',transparent:true,opacity:.24}));boundary.position.y=.14;tableBase.add(boundary);
 tableCards=new T.Group();labels=new T.Group();scene.add(tableCards,labels);hero();
 new ResizeObserver(()=>{const w=wrap.clientWidth,h=wrap.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}).observe(wrap);
 canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,px:e.clientX,py:e.clientY};canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(drag){azimuth-=(e.clientX-drag.px)*.007;polar=Math.max(.1,Math.min(1.15,polar+(e.clientY-drag.py)*.004));drag.px=e.clientX;drag.py=e.clientY}else{hover=point(e);canvas.style.cursor=hover?'pointer':'grab'}});
 canvas.addEventListener('pointerup',e=>{if(drag&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<7){const hit=point(e);if(hit)inspect(hit.userData)}drag=null});canvas.addEventListener('pointercancel',()=>drag=null);
 canvas.addEventListener('wheel',e=>{e.preventDefault();distance=Math.max(15,Math.min(43,distance+e.deltaY*.012))},{passive:false});
 renderer.setAnimationLoop(time=>{if(document.hidden||time-lastFrame<32)return;lastFrame=time;const aspect=camera.aspect;const d=distance*(aspect<1?1.12:1);camera.position.set(Math.sin(azimuth)*Math.sin(polar)*d,Math.cos(polar)*d,Math.cos(azimuth)*Math.sin(polar)*d);camera.lookAt(0,0,isGame?0:.4);for(const c of tableCards.children){if(c.userData.target){c.position.lerp(c.userData.target,.2);if(c.position.distanceTo(c.userData.target)<.02)c.userData.target=null}else if(c.userData.baseY!==undefined)c.position.y=T.MathUtils.lerp(c.position.y,c.userData.baseY+(c===hover ? .3 : 0),.2)}renderer.render(scene,camera)});
 return true;
 }catch(e){document.querySelector('#fallback').hidden=false;console.warn('3D fallback:',e.message);return false}}
