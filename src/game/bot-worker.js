import {analyzeBotMove} from './bot.js';
import {getBotDifficulty} from './bot-difficulty.js';
import {analyzePlayableMove} from './bot-playable.js';
self.onmessage=({data})=>{
  try{
    const difficulty=getBotDifficulty(data.difficulty);
    const analysis=difficulty.id==='playable'?analyzePlayableMove(data.state):analyzeBotMove(data.state,difficulty.options);
    self.postMessage({analysis});
  }
  catch{self.postMessage({error:'Bot search failed.'});}
};
