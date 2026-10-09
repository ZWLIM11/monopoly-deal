import {createRoom,join,authenticate,snapshot,tick,command,makeCode} from './rooms.mjs';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export default {async fetch(request,env){
 const url=new URL(request.url);if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(request);
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==url.origin)return json({error:'Origin not allowed'},403);
 if(url.pathname==='/api/health')return json({ok:true});
 if(request.method==='POST'&&url.pathname==='/api/rooms'){const code=makeCode();return env.ROOMS.getByName(code).fetch(new Request('https://room/create?code='+code,request))}
 const m=url.pathname.match(/^\/api\/rooms\/([A-Z2-9]{6})(?:\/(join|action))?$/);if(!m)return json({error:'Not found'},404);
 return env.ROOMS.getByName(m[1]).fetch(new Request('https://room/'+(m[2]||'state'),request));
}};
export class DealRoom{
 constructor(ctx){this.ctx=ctx;this.room=null;ctx.blockConcurrencyWhile(async()=>{this.room=await ctx.storage.get('room')});this.rates=new Map()}
 async fetch(request){return this.ctx.blockConcurrencyWhile(async()=>{try{
  const key=request.headers.get('CF-Connecting-IP')||'local',now=Date.now(),rate=this.rates.get(key)||{time:now,n:0};if(now-rate.time>60000){rate.time=now;rate.n=0}this.rates.set(key,rate);if(++rate.n>360)return json({error:'Please slow down'},429);if(this.rates.size>500)this.rates.clear();
  const url=new URL(request.url);let input={};if(request.method==='POST'){const raw=await request.text();if(raw.length>8192)throw new Error('Request too large');input=JSON.parse(raw)}
  let result,changed=false;
  if(url.pathname==='/create'&&request.method==='POST'){if(this.room)throw new Error('Room code in use. Please retry.');this.room=createRoom(url.searchParams.get('code'),input.name);result={code:this.room.code,token:this.room.players[0].secret};changed=true}
  else{if(!this.room)return json({error:'Room not found'},404);
   if(url.pathname==='/join'&&request.method==='POST'){const p=join(this.room,input.name);result={code:this.room.code,token:p.secret};changed=true}
   else{const id=authenticate(this.room,request.headers.get('Authorization')?.replace(/^Bearer /,''));if(url.pathname==='/action'&&request.method==='POST'){command(this.room,id,input);changed=true}else if(url.pathname==='/state'&&request.method==='GET')changed=tick(this.room);else return json({error:'Method not allowed'},405);result=snapshot(this.room,id)}
  }
  if(changed){await this.ctx.storage.put('room',this.room);await this.ctx.storage.setAlarm(Date.now()+86400000)}return json(result);
 }catch(e){return json({error:e.message},400)}})}
 async alarm(){await this.ctx.storage.deleteAll();this.room=null}
}
