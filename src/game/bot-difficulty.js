export const BOT_DIFFICULTIES=Object.freeze({
 playable:Object.freeze({id:'playable',label:'Playable'}),
 casual:Object.freeze({id:'casual',label:'Casual',options:Object.freeze({timeMs:1800,maxDepth:6,maxNodes:150000,quiescenceDepth:6})}),
 devil:Object.freeze({id:'devil',label:'Devil',options:Object.freeze({timeMs:6000,maxDepth:10,maxNodes:600000,quiescenceDepth:8,useOrderingHeuristics:true})}),
});
export function getBotDifficulty(id){return id==='playable'?BOT_DIFFICULTIES.playable:id==='devil'?BOT_DIFFICULTIES.devil:BOT_DIFFICULTIES.casual;}
