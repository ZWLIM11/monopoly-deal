export const COLORS = {
 brown:{name:'Brown',hex:'#98644b',size:2,rent:[1,2],value:1,names:['Mediterranean Avenue','Baltic Avenue']},
 sky:{name:'Light blue',hex:'#76cee7',size:3,rent:[1,2,3],value:1,names:['Oriental Avenue','Vermont Avenue','Connecticut Avenue']},
 pink:{name:'Pink',hex:'#d95fa5',size:3,rent:[1,2,4],value:2,names:['St. Charles Place','States Avenue','Virginia Avenue']},
 orange:{name:'Orange',hex:'#f39a46',size:3,rent:[1,3,5],value:2,names:['St. James Place','Tennessee Avenue','New York Avenue']},
 red:{name:'Red',hex:'#e46164',size:3,rent:[2,3,6],value:3,names:['Kentucky Avenue','Indiana Avenue','Illinois Avenue']},
 yellow:{name:'Yellow',hex:'#f4d665',size:3,rent:[2,4,6],value:3,names:['Atlantic Avenue','Ventnor Avenue','Marvin Gardens']},
 green:{name:'Green',hex:'#62b98c',size:3,rent:[2,4,7],value:4,names:['Pacific Avenue','North Carolina Avenue','Pennsylvania Avenue']},
 blue:{name:'Dark blue',hex:'#5981e3',size:2,rent:[3,8],value:4,names:['Park Place','Boardwalk']},
 rail:{name:'Railroads',hex:'#788593',size:4,rent:[1,2,3,4],value:2,names:['Reading Railroad','Pennsylvania Railroad','B. & O. Railroad','Short Line']},
 utility:{name:'Utilities',hex:'#9bbaa5',size:2,rent:[1,2],value:2,names:['Electric Company','Water Works']}
};
export const ACTIONS={
 pass:{name:'Pass Go',count:10,value:1,icon:'↗',text:'Draw two more cards. This uses one of your three plays.'},
 sly:{name:'Sly Deal',count:3,value:3,icon:'✦',text:'Take one property from an opponent’s incomplete set.'},
 forced:{name:'Forced Deal',count:3,value:3,icon:'⇄',text:'Exchange one of your properties for an opponent’s property outside a complete set.'},
 breaker:{name:'Deal Breaker',count:2,value:5,icon:'⚡',text:'Take a complete property set, including its house and hotel.'},
 no:{name:'Just Say No',count:3,value:4,icon:'✕',text:'Block an action against you. Another Just Say No can counter your block.'},
 debt:{name:'Debt Collector',count:3,value:3,icon:'↙',text:'Choose one opponent to pay you 5M from their table assets.'},
 birthday:{name:'It’s My Birthday',count:3,value:2,icon:'✳',text:'Every opponent owes you 2M.'},
 double:{name:'Double the Rent',count:2,value:1,icon:'×2',text:'Pair with a rent card. Each doubler costs another play.'},
 house:{name:'House',count:3,value:3,icon:'⌂',text:'Add 3M rent to a complete street set. One house per set.'},
 hotel:{name:'Hotel',count:2,value:4,icon:'▥',text:'Add 4M rent to a complete street set with a house. One hotel per set.'}
};
export function createDeck(){
 const cards=[]; const add=c=>cards.push({...c,id:'c'+cards.length});
 for(const [color,def] of Object.entries(COLORS))for(const name of def.names)add({kind:'property',name,colors:[color],value:def.value});
 for(const [colors,n,value] of [[['brown','sky'],1,1],[['sky','rail'],1,4],[['pink','orange'],2,2],[['red','yellow'],2,3],[['blue','green'],1,4],[['green','rail'],1,4],[['rail','utility'],1,2],[Object.keys(COLORS),2,0]])for(let i=0;i<n;i++)add({kind:'property',name:colors.length>2?'Rainbow Wild':'Property Wild',colors,value,wild:true});
 for(const [action,d] of Object.entries(ACTIONS))for(let i=0;i<d.count;i++)add({kind:'action',action,name:d.name,value:d.value});
 for(const colors of [['brown','sky'],['pink','orange'],['red','yellow'],['blue','green'],['rail','utility']])for(let i=0;i<2;i++)add({kind:'action',action:'rent',name:'Rent',colors,value:1});
 for(let i=0;i<3;i++)add({kind:'action',action:'rent',name:'Any Rent',colors:Object.keys(COLORS),value:3,single:true});
 for(const [value,n] of [[1,6],[2,5],[3,3],[4,3],[5,2],[10,1]])for(let i=0;i<n;i++)add({kind:'money',name:value+' Million',value});
 return cards;
}
export const cardColor=c=>c.kind==='property'?COLORS[c.colors[0]].hex:c.kind==='money'?'#84bc9d':c.action==='no'?'#e77877':'#e6bd75';
export const cardText=c=>c.kind==='money'?'Place in your bank. Use it to pay rent and other debts.':c.kind==='property'?(c.wild?'Choose a colour when played. Move this card between eligible sets on your turn.':'Collect '+COLORS[c.colors[0]].size+' '+COLORS[c.colors[0]].name.toLowerCase()+' properties to complete this set.'):c.action==='rent'?(c.single?'Charge one opponent rent on any of your property groups.':'Charge every opponent rent on a matching property group.'):ACTIONS[c.action].text;
