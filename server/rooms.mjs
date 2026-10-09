import {ensure,newGame,act,view,botMove} from './engine.mjs';
export const random=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;
const cleanName=n=>String(n||'Player').replace(/[\x00-\x1f]/g,'').trim().slice(0,22)||'Player';
export function createRoom(code,name){return {code,players:[{id:0,name:cleanName(name),secret:crypto.randomUUID(),bot:false}],revision:0,game:null,updated:Date.now(),botAt:0}}
export function join(room,name){ensure(!room.game,'This match has already started');ensure(room.players.length<5,'This table is full');const player={id:room.players.length,name:cleanName(name),secret:crypto.randomUUID(),bot:false};room.players.push(player);room.revision++;room.updated=Date.now();return player}
export function authenticate(room,token){const p=room.players.find(p=>!p.bot&&p.secret===token);ensure(p,'Your session was not found. Rejoin the table.');return p.id}
export function snapshot(room,id){return {code:room.code,revision:room.revision,you:id,players:room.players.map(({secret,...p})=>p),game:room.game?view(room.game,id):null}}
export function tick(room,now=Date.now()){
 if(!room.game||room.game.winner!==null||now<room.botAt)return false;
 const g=room.game,id=g.pending?.responder??g.turn;if(!g.players[id].bot)return false;
 const next=structuredClone(g),move=botMove(next,id);if(!move)return false;act(next,id,move,random);room.game=next;room.revision++;room.botAt=now+850;room.updated=now;return true;
}
export function command(room,id,input){
 ensure(input.revision===room.revision,'The table changed. Please try your move again.');
 if(input.type==='addBot'){ensure(id===0&&!room.game,'Only the host can add bots in the lobby');ensure(room.players.length<5,'This table is full');const n=room.players.length;room.players.push({id:n,name:['','Jade','Atlas','Ruby','Finn'][n],bot:true})}
 else if(input.type==='start'){ensure(id===0&&!room.game,'Only the host can start the lobby');ensure(room.players.length>=2,'Add a friend or a bot to start');room.game=newGame(room.players,random)}
 else if(input.type==='rematch'){ensure(id===0&&room.game?.winner!==null&&room.game,'Only the host can open a rematch after the game');room.game=null}
 else{ensure(room.game,'Start the game first');const next=structuredClone(room.game);act(next,id,input,random);room.game=next}
 room.revision++;room.updated=Date.now();room.botAt=Date.now()+900;
}
export const makeCode=()=>Array.from(crypto.getRandomValues(new Uint8Array(6)),b=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b%32]).join('');
