import {analyzeBotMove} from './bot.js';
import {getBotDifficulty} from './bot-difficulty.js';
self.onmessage=({data})=>{
  try{self.postMessage({analysis:analyzeBotMove(data.state,getBotDifficulty(data.difficulty).options)});}
  catch{self.postMessage({error:'Bot search failed.'});}
};
