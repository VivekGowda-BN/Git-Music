import {song,songDuration} from './song';

export const demoProject = {
  id:'scarborough-fair',title:song.title,is_public:true,demo:true,
  takes:[
    {id:'main',name:'First sketch',part:'guitar',parent:null,instrument:'Acoustic guitar'},
    {id:'keys',name:'Bass layer',part:'keys',parent:'main',instrument:'Bass'},
    {id:'melody',name:'Folk melody',part:'melody',parent:'main',instrument:'Flute'},
  ].map(t=>({...t,bpm:song.bpm,key:song.key,mood:'Reflective',duration:songDuration,rate:song.rate,created:'Studio demo'}))
};
// Small playable fixtures for the preview artist; never added to a real account.
const previewSessions=[
  ['tidal-room','Tidal Room','tide',84,'G major','Calm'],
  ['after-hours','After Hours','afterhours',104,'A minor','Restless'],
].map(([id,title,part,bpm,key,mood])=>({id,title,is_public:true,demo:true,takes:[
  {id:`${id}-root`,name:'Room sketch',part,parent:null,bpm,key,mood,duration:16*60/bpm,rate:song.rate,created:'Studio demo'}
]}));
function database() {
  return new Promise((resolve,reject)=>{const r=indexedDB.open('swarhub-audio',1);r.onupgradeneeded=()=>r.result.createObjectStore('takes');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
}
export async function media(key,value) {
  const db=await database();
  return new Promise((resolve,reject)=>{const tx=db.transaction('takes',value?'readwrite':'readonly'),s=tx.objectStore('takes'),r=value?s.put(value,key):s.get(key);
    tx.oncomplete=()=>{db.close();resolve(r.result);};tx.onabort=()=>{db.close();reject(tx.error);};});
}
export function loadLibrary(scope) {
  try {
    const saved=JSON.parse(localStorage.getItem(`swarhub:${scope}`));
    if(saved?.projects?.length){
      saved.projects=saved.projects.map(p=>p.demo&&p.title==='Janam'?{...p,title:song.title,takes:p.takes.map(t=>demoProject.takes.find(v=>v.id===t.id&&v.part===t.part)||t)}:p);
      if(scope==='guest')saved.projects.push(...previewSessions.filter(p=>!saved.projects.some(v=>v.id===p.id)));
      return saved;
    }
  } catch { /* New workspace */ }
  return {projects:scope==='guest'?[demoProject,...previewSessions]:[demoProject],applications:[],artist:{name:'',bio:'',gear:''},mixes:{}};
}
