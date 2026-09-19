import {analyzeBotMove} from './bot.js';
self.onmessage=({data})=>{
  try{self.postMessage({analysis:analyzeBotMove(data.state)});}
  catch{self.postMessage({error:'Bot search failed.'});}
};
