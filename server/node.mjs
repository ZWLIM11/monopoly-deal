import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRoom,join,authenticate,snapshot,tick,command,makeCode} from './rooms.mjs';
const root=fileURLToPath(new URL('../public/',import.meta.url));
const rooms=new Map(),limits=new Map();
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript','.svg':'image/svg+xml','.txt':'text/plain','.webp':'image/webp'};
function json(res,data,status=200){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data))}
async function body(req){let text='';for await(const chunk of req){text+=chunk;if(text.length>8192)throw new Error('Request is too large')}return JSON.parse(text||'{}')}
export const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname.startsWith('/api/')){
   if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return json(res,{error:'Origin not allowed'},403);
   const ip=req.socket.remoteAddress,now=Date.now(),limit=limits.get(ip)||{start:now,count:0};if(now-limit.start>60000){limit.start=now;limit.count=0}limits.set(ip,limit);if(++limit.count>360)return json(res,{error:'Please slow down'},429);
   if(url.pathname==='/api/health')return json(res,{ok:true});
   if(url.pathname==='/api/rooms'&&req.method==='POST'){if(rooms.size>=500)throw new Error('Server is busy');const input=await body(req);let code;do{code=makeCode()}while(rooms.has(code));const room=createRoom(code,input.name);rooms.set(code,room);return json(res,{code,token:room.players[0].secret})}
   const match=url.pathname.match(/^\/api\/rooms\/([A-Z2-9]{6})(?:\/(join|action))?$/);if(!match)return json(res,{error:'Not found'},404);const room=rooms.get(match[1]);if(!room)return json(res,{error:'Room not found. Create a new table.'},404);
   if(match[2]==='join'&&req.method==='POST'){const p=join(room,(await body(req)).name);return json(res,{code:room.code,token:p.secret})}
   const id=authenticate(room,req.headers.authorization?.replace(/^Bearer /,''));
   if(match[2]==='action'&&req.method==='POST')command(room,id,await body(req));else if(req.method==='GET'&&!match[2])tick(room);else return json(res,{error:'Method not allowed'},405);
   return json(res,snapshot(room,id));
  }
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end()}
  const filename=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!filename.startsWith(root)){res.writeHead(403);return res.end()}
  const content=await readFile(filename);res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:content);
 }catch(e){json(res,{error:e.code==='ENOENT'?'Not found':e.message},e.code==='ENOENT'?404:400)}
});
setInterval(()=>{const now=Date.now();for(const [code,r]of rooms)if(now-r.updated>86400000)rooms.delete(code);for(const [ip,l]of limits)if(now-l.start>120000)limits.delete(ip)},60000).unref();
if(process.argv[1]===fileURLToPath(import.meta.url)){const port=Number(process.env.PORT||8790);server.listen(port,'0.0.0.0',()=>console.log(`Monopoly Deal 3D: http://localhost:${port}`))}
