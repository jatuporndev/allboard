// Termination stops CPU work and discards replies from an obsolete position.
export class BotClient {
  constructor(createWorker=()=>new Worker(new URL('./bot-worker.js',import.meta.url),{type:'module'})){
    this.createWorker=createWorker;this.worker=null;
  }
  cancel(){this.worker?.terminate();this.worker=null;}
  request(state,onResult,onError){
    this.cancel();
    let worker;
    try{
      worker=this.createWorker();this.worker=worker;
      worker.onmessage=({data})=>{
        if(this.worker!==worker)return;
        this.cancel();if(data.error)onError();else onResult(data.analysis);
      };
      worker.onerror=()=>{if(this.worker===worker){this.cancel();onError();}};
      worker.postMessage({state});
    }catch{this.cancel();onError();}
  }
}
