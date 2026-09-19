// Ratings are relative game difficulty labels, not measured playing ratings.
export const BOT_DIFFICULTIES=Object.freeze({
 casual:Object.freeze({id:'casual',label:'Casual',rating:'5/10',options:Object.freeze({timeMs:1800,maxDepth:6,maxNodes:150000,quiescenceDepth:6})}),
 devil:Object.freeze({id:'devil',label:'Devil',rating:'10/10',options:Object.freeze({timeMs:6000,maxDepth:10,maxNodes:600000,quiescenceDepth:8,useOrderingHeuristics:true})}),
});
export function getBotDifficulty(id){return id==='devil'?BOT_DIFFICULTIES.devil:BOT_DIFFICULTIES.casual;}
