import test from 'node:test';
import assert from 'node:assert/strict';
import {server} from '../server/node.mjs';
test('HTTP rooms enforce identity, host permissions, stale-move checks and private hands',async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 async function req(path,body,token,headers={}){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()}}
 try{
 const host=(await req('/api/rooms',{name:'Host'})).data,guest=(await req('/api/rooms/'+host.code+'/join',{name:'Guest'})).data,path='/api/rooms/'+host.code;
 assert.equal((await req(path)).status,400);assert.equal((await req(path,null,'fake')).status,400);
 const state=(await req(path,null,host.token)).data;assert.equal(state.players.length,2);assert.ok(!JSON.stringify(state).includes(guest.token));
 assert.equal((await req(path+'/action',{type:'start',revision:state.revision},guest.token)).status,400);
 const started=(await req(path+'/action',{type:'start',revision:state.revision},host.token)).data;
 assert.equal(started.game.players[0].hand.length,7);assert.equal(started.game.players[1].hand,undefined);assert.equal(started.game.deck,undefined);
 assert.equal((await req(path+'/join',{name:'Late'})).status,400);
 assert.equal((await req(path+'/action',{type:'end',revision:started.revision},guest.token)).status,400);
 const after=(await req(path+'/action',{type:'end',revision:started.revision},host.token)).data;assert.equal(after.game.turn,1);
 assert.equal((await req(path+'/action',{type:'end',revision:started.revision},host.token)).status,400);
 const guestView=(await req(path,null,guest.token)).data;assert.equal(guestView.game.players[0].hand,undefined);assert.equal(guestView.game.players[1].hand.length,7);
 assert.equal((await req('/api/rooms',{name:'Blocked'},null,{Origin:'https://unrelated.example'})).status,403);
 }finally{await new Promise(resolve=>server.close(resolve))}
});
