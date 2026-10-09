import {COLORS,cardText} from './cards.mjs';

// One painter drives the 3D meshes, hand, and inspector so artwork and rules agree.
const atlas=new Image();
export const artReady=new Promise(resolve=>{atlas.onload=()=>resolve(true);atlas.onerror=()=>resolve(false);atlas.src='/assets/deal-illustrations.webp'});
const cache=new Map(),urls=new Map();
export const DISTRICTS={brown:['Mayfair',0],sky:['Kuala Lumpur',1],green:['Penang',2],yellow:['Johor Bahru',3],orange:['Melaka',4],red:['Singapore',5],pink:['Tokyo',6],blue:['Hong Kong',7],rail:['Railroads',8],utility:['Utilities',9]};
const actionArt={rent:10,debt:10,birthday:10,no:11,breaker:12,sly:12,forced:15,pass:15,double:15,house:13,hotel:14};
const shortRules={rent:'Collect rent on your matching properties.',debt:'Collect 5M from one opponent.',birthday:'Every opponent pays you 2M.',no:'Cancel an action played against you.',breaker:'Take a complete set, buildings included.',sly:'Take a property outside a complete set.',forced:'Swap properties with another player.',pass:'Draw 2 more cards.',double:'Double your rent. Uses an extra play.',house:'Add 3M rent to a complete street set.',hotel:'Add 4M rent to a set with a house.'};
const actionColors={rent:'#b32128',debt:'#9b6533',birthday:'#9a456c',no:'#224e9a',breaker:'#262528',sly:'#503150',forced:'#654774',pass:'#297660',double:'#997337',house:'#325d39',hotel:'#aa222c'};
function round(x,a,b,w,h,r=16){x.beginPath();x.roundRect(a,b,w,h,r)}
function textLines(x,text,y,{size=27,width=422,line=36,max=3,font='Georgia',bold=false,color='#302821'}={}){x.font=`${bold?'bold ':''}${size}px ${font}`;x.fillStyle=color;x.textAlign='center';const words=text.split(' ');let s='',n=0;for(const word of words){if(x.measureText(s+word).width>width&&s&&n<max-1){x.fillText(s.trim(),256,y);s=word+' ';y+=line;n++}else s+=word+' '}x.fillText(s.trim(),256,y);return y}
function ornament(x,color='#ba995f'){x.strokeStyle=color;x.lineWidth=1.5;for(const [a,b,sx,sy]of [[29,29,1,1],[483,29,-1,1],[29,739,1,-1],[483,739,-1,-1]]){x.beginPath();x.moveTo(a,b+31*sy);x.lineTo(a,b);x.lineTo(a+31*sx,b);x.stroke();x.beginPath();x.arc(a+12*sx,b+12*sy,4,0,Math.PI*2);x.stroke()}}
function illustration(x,index,y=180,h=255){x.save();round(x,29,y,454,h,5);x.clip();if(atlas.complete&&atlas.naturalWidth){const cell=atlas.naturalWidth/4,cellH=atlas.naturalHeight/4;x.drawImage(atlas,index%4*cell,Math.floor(index/4)*cellH,cell,cellH,29,y,454,h)}else{const grad=x.createLinearGradient(0,y,0,y+h);grad.addColorStop(0,'#c0c9c5');grad.addColorStop(1,'#ead6b4');x.fillStyle=grad;x.fillRect(29,y,454,h);for(let i=0;i<9;i++){x.fillStyle=['#63594f','#938374','#736b60'][i%3];x.fillRect(40+i*50,y+60+i%3*30,39,h-50)}}x.restore()}
function skyline(x,y,color){x.strokeStyle=color;x.lineWidth=1.3;for(let i=0;i<15;i++){const a=45+i*29,h=22+(i*43%81);x.strokeRect(a,y-h,23,h);for(let j=0;j<3;j++){x.beginPath();x.moveTo(a+6+j*5,y-h+6);x.lineTo(a+6+j*5,y-5);x.stroke()}}}
export function cardCanvas(c,{back=false,color='#a91620'}={}){
 const key=back?'back:'+color:JSON.stringify([c.id,c.name,c.value,c.kind,c.action,c.colors]);if(cache.has(key))return cache.get(key);
 const el=document.createElement('canvas');el.width=512;el.height=768;const x=el.getContext('2d');
 const paper=x.createLinearGradient(0,0,512,768);paper.addColorStop(0,'#fff8e9');paper.addColorStop(.5,'#ece0cc');paper.addColorStop(1,'#d8c3a5');x.fillStyle=paper;round(x,0,0,512,768,25);x.fill();
 x.strokeStyle='#ab9374';x.lineWidth=2;round(x,12,12,488,744,18);x.stroke();x.strokeStyle='#4b392c';x.lineWidth=2;round(x,22,22,468,724,13);x.stroke();
 if(back){
  const grad=x.createLinearGradient(0,0,512,768);grad.addColorStop(0,color);grad.addColorStop(.65,color);grad.addColorStop(1,'#360d13');x.fillStyle=grad;round(x,22,22,468,724,13);x.fill();ornament(x,'#e4bf86');
  x.strokeStyle='#ecc89128';x.lineWidth=1;for(let y=48;y<730;y+=22)for(let a=36;a<480;a+=22){x.beginPath();x.moveTo(a,y-8);x.lineTo(a+8,y);x.lineTo(a,y+8);x.lineTo(a-8,y);x.closePath();x.stroke()}
  x.save();x.translate(256,299);x.rotate(-.08);x.fillStyle='#e6d9bd';x.fillRect(-211,-65,422,100);x.fillStyle='#a01e23';x.fillRect(-206,-60,412,90);x.font='bold 49px Arial';x.textAlign='center';x.fillStyle='#fff6df';x.fillText('MONOPOLY',0,4);x.restore();
  x.textAlign='center';x.font='bold 115px Arial';x.lineWidth=5;x.strokeStyle='#eed8b2';x.strokeText('DEAL',256,460);x.fillStyle='#16100e';x.fillText('DEAL',256,460);x.font='18px Arial';x.fillStyle='#f3d3a2';x.fillText('THE CARD GAME',256,507);skyline(x,661,'#dab17c99');x.font='13px Georgia';x.fillText('THE DEAL CLUB',256,704);
 }else if(c.kind==='money'){
  const color={1:'#8b7062',2:'#a56c85',3:'#536f9a',4:'#698153',5:'#885a91',10:'#ba913c'}[c.value]||'#8b7062';x.fillStyle=color;round(x,26,26,460,716,13);x.fill();ornament(x,'#f1d9b7');x.strokeStyle='#f2e4c64f';x.lineWidth=1;
  for(let i=0;i<65;i++){x.beginPath();x.ellipse(256,382,75+i*2,145+i*2,Math.sin(i*.2)*.09,0,Math.PI*2);x.stroke()}
  for(let y=50;y<729;y+=17){x.beginPath();for(let a=36;a<480;a+=3){const b=y+Math.sin(a*.065+y)*5;a===36?x.moveTo(a,b):x.lineTo(a,b)}x.stroke()}
  x.fillStyle=color;x.fillRect(61,292,390,144);x.strokeStyle='#f7dfb8';x.strokeRect(66,297,380,134);x.fillStyle='#fff1d2';x.textAlign='center';x.font='bold 42px Georgia';x.fillText('MONOPOLY',256,352);x.font='bold 66px Arial';x.fillText('DEAL',256,414);x.font='bold 106px Georgia';x.fillText(c.value+'M',256,226);x.fillText(c.value+'M',256,579);x.font='16px Arial';x.fillText('MILLION · BANK NOTE',256,628);x.font='bold 29px Georgia';x.fillText(c.value+'M',69,83);x.fillText(c.value+'M',443,710);
 }else{
  const wild=c.kind==='property'&&c.wild,property=c.kind==='property'&&!wild,def=property?COLORS[c.colors[0]]:null,district=property?DISTRICTS[c.colors[0]]:null;
  const accent=wild?'#27272a':property?def.hex:actionColors[c.action]||'#856440';
  x.fillStyle=accent;round(x,28,28,456,143,11);x.fill();const shade=x.createLinearGradient(0,28,0,172);shade.addColorStop(0,'#00000000');shade.addColorStop(1,'#00000055');x.fillStyle=shade;round(x,28,28,456,143,11);x.fill();
  x.fillStyle='#fff0d3';x.textAlign='left';x.font='bold 20px Georgia';x.fillText('◆',44,65);x.textAlign='right';x.fillText(c.value+'M',466,65);
  textLines(x,property?district[0].toUpperCase():c.name.toUpperCase(),104,{size:property?31:30,width:394,line:35,max:2,font:'Arial',bold:true,color:'#fff7df'});
  if(wild){
   x.fillStyle='#212124';x.fillRect(29,178,454,504);const colors=c.colors;const cx=256,cy=377,r=146;
   colors.forEach((k,i)=>{x.beginPath();x.moveTo(cx,cy);x.arc(cx,cy,r,i/colors.length*Math.PI*2,(i+1)/colors.length*Math.PI*2);x.closePath();x.fillStyle=COLORS[k].hex;x.fill()});x.beginPath();x.arc(cx,cy,95,0,Math.PI*2);x.fillStyle='#252425';x.fill();x.fillStyle='#f1dfbf';x.font='bold 95px Georgia';x.textAlign='center';x.fillText('M',cx,cy+32);textLines(x,'PROPERTY WILD',586,{size:28,font:'Arial',bold:true,color:'#f8e8cd'});textLines(x,c.colors.length>2?'Use with any property colour.':c.colors.map(k=>COLORS[k].name).join(' / '),631,{size:20,width:395,line:27,color:'#dfcbaa'});
  }else if(property){
   illustration(x,district[1],180,270);textLines(x,c.name,486,{size:23,width:420,line:27,max:2,bold:true});x.textAlign='center';x.font='bold italic 24px Arial';x.fillStyle='#322b23';x.fillText('RENT',256,543);
   const rows=def.rent.length,start=rows===4?574:587,spacing=29;
   def.rent.forEach((value,i)=>{const y=start+i*spacing;x.textAlign='left';x.font='17px Arial';x.fillText(i===rows-1?'FULL SET':String(i+1)+' PROPERTY'+(i?'S':''),58,y);x.setLineDash([2,4]);x.strokeStyle='#927d6266';x.beginPath();x.moveTo(197,y-4);x.lineTo(381,y-4);x.stroke();x.setLineDash([]);x.textAlign='right';x.font=(i===rows-1?'bold ':'')+'21px Georgia';x.fillText(value+'M',453,y)});
  }else{
   illustration(x,actionArt[c.action]??15,180,338);textLines(x,shortRules[c.action]||cardText(c),566,{size:25,width:394,line:35,max:3,font:'Arial'});x.font='italic 17px Georgia';x.fillStyle='#84715c';x.textAlign='center';x.fillText(c.action==='no'?'PLAY IN RESPONSE':'PLAY AS ACTION OR BANK AS MONEY',256,686);
  }
  if(c.colors){c.colors.forEach((k,i)=>{x.fillStyle=COLORS[k].hex;x.fillRect(32+i*448/c.colors.length,707,448/c.colors.length,8)})}
  x.font='12px Arial';x.textAlign='center';x.fillStyle='#806d54';x.fillText('MONOPOLY DEAL · THE DEAL CLUB',256,733);
 }
 cache.set(key,el);return el;
}
export function cardImage(c){const key=JSON.stringify([c.id,c.name,c.value,c.action,c.colors]);if(!urls.has(key))urls.set(key,cardCanvas(c).toDataURL('image/webp',.88));return urls.get(key)}
let backURL;
export function cardBackImage(){return backURL??=cardCanvas({id:'back'},{back:true}).toDataURL('image/webp',.88)}
