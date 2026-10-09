import {COLORS,createDeck} from '../public/cards.mjs';
export const ensure=(ok,msg='Invalid move')=>{if(!ok)throw new Error(msg)};
export function shuffle(a,rng=Math.random){for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
export const full=g=>g.cards.length>=COLORS[g.color].size&&g.cards.some(c=>c.value>0);
export const sets=p=>new Set(p.groups.filter(full).map(g=>g.color)).size;
export const rent=g=>COLORS[g.color].rent[Math.min(g.cards.length,COLORS[g.color].size)-1]+g.buildings.reduce((s,c)=>s+(c.action==='house'?3:4),0);
export const bank=p=>p.bank.reduce((s,c)=>s+c.value,0);
function log(g,text){g.log.unshift(text);g.log=g.log.slice(0,45)}
function draw(g,p,n,rng){let count=0;for(let i=0;i<n;i++){if(!g.deck.length)g.deck=shuffle(g.discard.splice(0),rng);if(!g.deck.length)break;p.hand.push(g.deck.pop());count++}return count}
export function newGame(players,rng=Math.random){
 const g={players:players.map((p,id)=>({id,name:p.name,bot:!!p.bot,hand:[],bank:[],groups:[]})),deck:shuffle(createDeck(),rng),discard:[],turn:0,plays:0,phase:'play',pending:null,winner:null,round:1,groupSeq:0,log:[]};
 for(const p of g.players)draw(g,p,5,rng);draw(g,g.players[0],2,rng);log(g,`${g.players[0].name} starts. Draw 2, then play up to 3.`);return g;
}
function checkWin(g){if(sets(g.players[g.turn])>=3&&!g.pending){g.winner=g.turn;g.phase='finished';log(g,`${g.players[g.turn].name} wins with three different complete sets!`)}}
function group(p,id){const v=p.groups.find(g=>g.id===id);ensure(v,'Choose a property group');return v}
function put(g,p,c,color,groupId){
 ensure(c.colors.includes(color),'This property cannot use that colour');
 let target=groupId?group(p,groupId):p.groups.find(x=>x.color===color&&x.cards.length<COLORS[color].size);
 if(groupId)ensure(target.color===color&&target.cards.length<COLORS[color].size,'That group is full or a different colour');
 if(!target){target={id:'g'+(++g.groupSeq),color,cards:[],buildings:[]};p.groups.push(target)}target.cards.push(c);
}
function cleanup(p){for(const x of p.groups){if(!full(x)&&x.buildings.length)p.bank.push(...x.buildings.splice(0));else if(!x.buildings.some(c=>c.action==='house')){p.bank.push(...x.buildings.filter(c=>c.action==='hotel'));x.buildings=x.buildings.filter(c=>c.action!=='hotel')}}p.groups=p.groups.filter(x=>x.cards.length)}
function takeProperty(p,id){for(const gr of p.groups){const idx=gr.cards.findIndex(c=>c.id===id);if(idx>=0){const c=gr.cards.splice(idx,1)[0];cleanup(p);return {card:c,color:gr.color}}}throw new Error('Property not found')}
function locate(p,id){for(const gr of p.groups){const c=gr.cards.find(c=>c.id===id);if(c)return {card:c,group:gr}}throw new Error('Property not found')}
function hand(p,id){const c=p.hand.find(c=>c.id===id);ensure(c,'Card is not in your hand');return c}
function remove(p,c){p.hand.splice(p.hand.findIndex(x=>x.id===c.id),1)}
function finishPending(g){const q=g.pending;q.queue.shift();if(q.queue.length){q.target=q.queue[0];q.responder=q.target;q.blocked=false;q.stage='response'}else{g.pending=null;checkWin(g)}}
function nextTurn(g,rng){g.turn=(g.turn+1)%g.players.length;if(g.turn===0)g.round++;g.plays=0;g.phase='play';const p=g.players[g.turn];const n=draw(g,p,p.hand.length?2:5,rng);log(g,`${p.name} draws ${n}.`);checkWin(g)}
export const assets=p=>[...p.bank.map(c=>({card:c,zone:'bank'})),...p.groups.flatMap(x=>[...x.cards.filter(c=>c.value>0).map(c=>({card:c,zone:'property',group:x.id})),...x.buildings.map(c=>({card:c,zone:'building',group:x.id}))])];
function pending(g,actor,targets,data){g.pending={actor,target:targets[0],queue:targets,responder:targets[0],blocked:false,stage:'response',...data}}
function effect(g){const q=g.pending,source=g.players[q.actor],target=g.players[q.target];
 if(q.kind==='payment'){q.stage='payment';q.responder=q.target;if(!assets(target).length){log(g,`${target.name} has no payable assets.`);finishPending(g)}return}
 if(q.kind==='sly'||q.kind==='forced'){
  const got=takeProperty(target,q.property);put(g,source,got.card,got.color);
  if(q.kind==='forced'){const offered=takeProperty(source,q.offer);put(g,target,offered.card,offered.color)}
  log(g,q.kind==='sly'?`${source.name} takes a property from ${target.name}.`:`${source.name} and ${target.name} exchange properties.`);
 }else if(q.kind==='breaker'){const gr=group(target,q.group);target.groups=target.groups.filter(x=>x!==gr);source.groups.push(gr);log(g,`${source.name} takes ${target.name}’s ${COLORS[gr.color].name} set.`)}
 finishPending(g);
}
export function act(g,id,m,rng=Math.random){
 ensure(g.winner===null,'This game has finished');const p=g.players[id];ensure(p,'Unknown player');
 if(g.pending){const q=g.pending;ensure(id===q.responder,'Waiting for another player');
  if(m.type==='no'){ensure(q.stage==='response','The response window has closed');const c=hand(p,m.card);ensure(c.action==='no','Choose Just Say No');remove(p,c);g.discard.push(c);q.blocked=!q.blocked;q.responder=id===q.actor?q.target:q.actor;log(g,`${p.name}: Just Say No!`);return}
  if(m.type==='accept'){ensure(q.stage==='response');if(q.blocked){log(g,`${q.label} was blocked for ${g.players[q.target].name}.`);finishPending(g)}else effect(g);return}
  if(m.type==='pay'){
   ensure(q.stage==='payment','Accept or counter the action first');const choices=assets(p);ensure(Array.isArray(m.cards)&&new Set(m.cards).size===m.cards.length,'Choose distinct assets');const selected=m.cards.map(cid=>{const a=choices.find(a=>a.card.id===cid);ensure(a,'Choose assets from your table');return a});const total=selected.reduce((s,a)=>s+a.card.value,0),available=choices.reduce((s,a)=>s+a.card.value,0);ensure(total>=Math.min(available,q.amount),'Choose enough value, or all you have');
   const receiver=g.players[q.actor];
   // Remove buildings first so cleanup cannot relocate a selected building during payment.
   for(const a of selected.filter(x=>x.zone!=='property')){if(a.zone==='bank')p.bank=p.bank.filter(c=>c.id!==a.card.id);else {const gr=group(p,a.group);gr.buildings=gr.buildings.filter(c=>c.id!==a.card.id)}receiver.bank.push(a.card)}
   for(const a of selected.filter(x=>x.zone==='property')){const got=takeProperty(p,a.card.id);put(g,receiver,got.card,got.color)}
   cleanup(p);log(g,`${p.name} pays ${total}M to ${receiver.name}${total>q.amount?' (no change)':''}.`);finishPending(g);return;
  }throw new Error('Resolve the current action first');
 }
 ensure(id===g.turn,'It is not your turn');
 if(m.type==='discard'){ensure(g.phase==='discard','You are not discarding');const c=hand(p,m.card);remove(p,c);g.deck.unshift(c);if(p.hand.length<=7)nextTurn(g,rng);return}
 ensure(g.phase==='play','Discard down to seven cards');
 if(m.type==='end'){if(p.hand.length>7){g.phase='discard';log(g,`${p.name} must discard ${p.hand.length-7} card(s).`)}else nextTurn(g,rng);return}
 if(m.type==='move'){const found=locate(p,m.card);ensure(found.card.wild,'Only wild properties can change groups');ensure(found.card.colors.includes(m.color),'Invalid colour');if(m.group)ensure(m.group!==found.group.id,'Choose a different group');const got=takeProperty(p,m.card);put(g,p,got.card,m.color,m.group);checkWin(g);return}
 ensure(m.type==='play'&&g.plays<3,'You have used all three plays');const c=hand(p,m.card);
 if(m.mode==='bank'){ensure(c.kind!=='property','Properties cannot go into the bank');remove(p,c);p.bank.push(c);g.plays++;log(g,`${p.name} banks ${c.value}M.`);return}
 if(c.kind==='property'){put(g,p,c,m.color||c.colors[0],m.group);remove(p,c);g.plays++;log(g,`${p.name} plays ${c.name}.`);checkWin(g);return}
 ensure(c.kind==='action','Money must go into your bank');const a=c.action;ensure(a!=='no'&&a!=='double','Use this card in response or with rent, or bank it');
 const opponents=g.players.filter(x=>x.id!==id).map(x=>x.id);let target;
 if(['sly','forced','breaker','debt'].includes(a)||a==='rent'&&c.single){target=g.players[m.target];ensure(target&&target.id!==id,'Choose an opponent')}
 if(a==='sly'||a==='forced'){const got=locate(target,m.property);ensure(!full(got.group),'That property belongs to a complete set');if(a==='forced')locate(p,m.offer)}
 if(a==='breaker')ensure(full(group(target,m.group)),'Choose a complete set');
 if(a==='house'||a==='hotel'){const gr=group(p,m.group);ensure(full(gr)&&!['rail','utility'].includes(gr.color),'Choose a complete street set');ensure(!gr.buildings.some(x=>x.action===a),'This building is already present');if(a==='hotel')ensure(gr.buildings.some(x=>x.action==='house'),'Build a house first');gr.buildings.push(c);remove(p,c);g.plays++;log(g,`${p.name} adds a ${a}.`);return}
 let amount=0,doublers=[];
 if(a==='rent'){const gr=group(p,m.group);ensure(c.colors.includes(gr.color),'Rent card does not match this set');ensure(gr.cards.some(x=>x.value>0),'Rainbow wilds alone cannot collect rent');ensure(Array.isArray(m.doubles||[])&&new Set(m.doubles||[]).size===(m.doubles||[]).length,'Invalid rent combo');doublers=(m.doubles||[]).map(cid=>hand(p,cid));ensure(doublers.every(x=>x.action==='double'),'Select Double the Rent cards');ensure(g.plays+1+doublers.length<=3,'Not enough plays for that rent combo');amount=rent(gr)*2**doublers.length}
 remove(p,c);g.discard.push(c);for(const d of doublers){remove(p,d);g.discard.push(d)}g.plays+=1+doublers.length;log(g,`${p.name} plays ${c.name}${doublers.length?' ×'+2**doublers.length:''}.`);
 if(a==='pass'){draw(g,p,2,rng);return}
 if(['rent','birthday','debt'].includes(a)){pending(g,id,a==='birthday'||a==='rent'&&!c.single?opponents:[target.id],{kind:'payment',amount:a==='birthday'?2:a==='debt'?5:amount,label:c.name});return}
 pending(g,id,[target.id],{kind:a,property:m.property,offer:m.offer,group:m.group,label:c.name});
}
export function view(g,id){return {...g,deck:undefined,drawCount:g.deck.length,discardCount:g.discard.length,discard:g.discard.slice(-1),players:g.players.map(p=>({...p,hand:p.id===id?p.hand:undefined,handCount:p.hand.length,sets:sets(p),balance:bank(p)}))}}
export function botMove(g,id){
 const p=g.players[id];if(g.pending){const q=g.pending;if(q.responder!==id)return null;if(q.stage==='response'){const no=p.hand.find(c=>c.action==='no');return no?{type:'no',card:no.id}:{type:'accept'}}let sum=0;const selected=[];for(const a of assets(p).sort((a,b)=>(a.zone==='bank'?0:1)-(b.zone==='bank'?0:1)||a.card.value-b.card.value)){selected.push(a.card.id);sum+=a.card.value;if(sum>=q.amount)break}return {type:'pay',cards:selected}}
 if(g.turn!==id)return null;if(g.phase==='discard')return {type:'discard',card:p.hand.find(c=>c.kind==='money')?.id||p.hand[0].id};if(g.plays>=3)return {type:'end'};
 const enemies=g.players.filter(x=>x.id!==id);
 for(const c of p.hand.filter(c=>c.action==='breaker'))for(const t of enemies){const gr=t.groups.find(full);if(gr)return {type:'play',card:c.id,target:t.id,group:gr.id}}
 const prop=p.hand.find(c=>c.kind==='property');if(prop){const color=[...prop.colors].sort((a,b)=>{const score=x=>Math.max(0,...p.groups.filter(gr=>gr.color===x&&!full(gr)).map(gr=>gr.cards.length/COLORS[x].size));return score(b)-score(a)})[0];return {type:'play',card:prop.id,color}}
 for(const c of p.hand){if(c.action==='pass')return {type:'play',card:c.id};if(c.action==='sly')for(const t of enemies){const gr=t.groups.find(x=>!full(x));if(gr)return {type:'play',card:c.id,target:t.id,property:gr.cards[0].id}}if(c.action==='rent'){const gr=p.groups.filter(gr=>c.colors.includes(gr.color)&&gr.cards.some(c=>c.value>0)).sort((a,b)=>rent(b)-rent(a))[0];if(gr)return {type:'play',card:c.id,group:gr.id,target:enemies[0].id}}if(c.action==='debt')return {type:'play',card:c.id,target:enemies.sort((a,b)=>bank(b)-bank(a))[0].id};if(c.action==='birthday')return {type:'play',card:c.id}}
 const cash=p.hand.find(c=>c.kind==='money')||p.hand.find(c=>c.kind!=='property'&&c.action!=='no');return cash?{type:'play',card:cash.id,mode:'bank'}:{type:'end'};
}
