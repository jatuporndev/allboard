import {initialState,applyAction} from './rules.js';
// Serializable actions and immutable snapshots form the future multiplayer boundary.
export class GameStore {
  constructor(){this.state=initialState();this.snapshots=[];this.listeners=new Set();}
  subscribe(fn){this.listeners.add(fn);return ()=>this.listeners.delete(fn);}
  emit(action){this.listeners.forEach(fn=>fn(this.state,action));}
  dispatch(action){const next=applyAction(this.state,action);this.snapshots.push(this.state);this.state=next;this.emit(action);return next;}
  undo(){if(!this.snapshots.length)return;this.state=this.snapshots.pop();this.emit({type:'UNDO'});}
  reset(){this.state=initialState();this.snapshots=[];this.emit({type:'RESET'});}
}
