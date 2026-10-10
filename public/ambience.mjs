// A real window wall and a locally drawn skyline; no remote background assets.
export function createBackdrop(T,scene){
 const group=new T.Group();scene.add(group);const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=768;const c=canvas.getContext('2d');const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=8;
 const view=new T.Mesh(new T.PlaneGeometry(33,16.5),new T.MeshBasicMaterial({map:texture}));view.position.set(0,7.3,-15.3);group.add(view);
 const frameMat=new T.MeshStandardMaterial({color:'#947544',metalness:.6,roughness:.38});
 function frame(w,h,d,x,y,z){const m=new T.Mesh(new T.BoxGeometry(w,h,d),frameMat);m.position.set(x,y,z);m.castShadow=true;group.add(m)}
 for(const x of [-16.7,-5.5,5.5,16.7])frame(.18,17,.28,x,7.3,-15.1);for(const y of [-1,4.2,15.6])frame(33.6,.16,.3,0,y,-15.1);
 const curtainMat=new T.MeshStandardMaterial({color:'#15283a',roughness:.9});for(const x of [-18,18]){for(let i=0;i<9;i++){const m=new T.Mesh(new T.CylinderGeometry(.3,.33,18,12),curtainMat);m.position.set(x+(i-4)*.26,7.7,-14.8+Math.sin(i)*.1);group.add(m)}}
 function setTheme(theme){const night=theme==='midnight';curtainMat.color.set(night?'#15283a':'#493024');const gradient=c.createLinearGradient(0,0,0,768);gradient.addColorStop(0,night?'#07132b':'#362226');gradient.addColorStop(.65,night?'#254875':'#a16b48');gradient.addColorStop(1,night?'#d6a269':'#e1ae68');c.fillStyle=gradient;c.fillRect(0,0,1536,768);
 let seed=89213;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};if(night){for(let i=0;i<160;i++){c.fillStyle=`rgba(220,233,255,${random()*.6+.2})`;c.beginPath();c.arc(random()*1536,random()*380,random()*1.4+.3,0,Math.PI*2);c.fill()}const glow=c.createRadialGradient(1210,137,15,1210,137,100);glow.addColorStop(0,'#e6e5cd55');glow.addColorStop(1,'#e6e5cd00');c.fillStyle=glow;c.fillRect(1100,30,220,220);c.beginPath();c.arc(1210,137,29,0,Math.PI*2);c.fillStyle='#ebe7cc';c.fill()}
 for(let layer=0;layer<3;layer++){let x=-20;while(x<1536){const w=35+random()*64,h=80+random()*(140+layer*100),y=600+layer*52-h;c.fillStyle=[night?'#253a56':'#755447',night?'#172b42':'#503d37',night?'#0c192b':'#302827'][layer];c.fillRect(x,y,w,h+170);if(random()>.65){c.beginPath();c.moveTo(x+w*.5,y-20);c.lineTo(x+w,y);c.lineTo(x,y);c.fill()}
 for(let wy=y+12;wy<765;wy+=17)for(let wx=x+8;wx<x+w-5;wx+=12)if(random()>.5){c.fillStyle=random()>.25?'#e4b875aa':'#a9cff0a0';c.fillRect(wx,wy,4,7)}x+=w+5}}
 // Twin illuminated spires provide a recognisable skyline silhouette.
 for(const x of [637,740]){c.fillStyle=night?'#6489aa':'#b28d70';c.fillRect(x,249,42,395);for(let y=265;y<641;y+=14){c.fillStyle='#ebd4a988';c.fillRect(x-3,y,48,3)}c.fillStyle='#b8ccce';c.beginPath();c.moveTo(x+21,156);c.lineTo(x+38,249);c.lineTo(x+4,249);c.closePath();c.fill();c.fillRect(x+19,128,3,50)}c.fillStyle='#bcc8c6';c.fillRect(677,399,65,10);c.fillRect(677,414,65,5);
 const haze=c.createLinearGradient(0,650,0,768);haze.addColorStop(0,'#b4946720');haze.addColorStop(1,'#080f1ce6');c.fillStyle=haze;c.fillRect(0,650,1536,118);texture.needsUpdate=true;
 }setTheme('midnight');return setTheme;
}
