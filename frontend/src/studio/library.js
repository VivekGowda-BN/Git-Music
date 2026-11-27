function database() {
  return new Promise((resolve,reject)=>{const r=indexedDB.open('swarhub-audio',1);r.onupgradeneeded=()=>r.result.createObjectStore('takes');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
}
export async function media(key,value) {
  const db=await database();
  return new Promise((resolve,reject)=>{const tx=db.transaction('takes',value?'readwrite':'readonly'),s=tx.objectStore('takes'),r=value?s.put(value,key):s.get(key);
    tx.oncomplete=()=>{db.close();resolve(r.result);};tx.onabort=()=>{db.close();reject(tx.error);};});
}
export async function removeMedia(key) {
  const db=await database();
  return new Promise((resolve,reject)=>{const tx=db.transaction('takes','readwrite');tx.objectStore('takes').delete(key);
    tx.oncomplete=()=>{db.close();resolve();};tx.onabort=()=>{db.close();reject(tx.error);};});
}
export function loadLibrary(scope) {
  const empty = {projects:[],applications:[],artist:{name:'',bio:'',gear:'',photo:''},mixes:{}};
  try {
    const saved=JSON.parse(localStorage.getItem(`swarhub:${scope}`));
    if(saved&&Array.isArray(saved.projects)){
      const mixes = {...saved.mixes};
      const projects = saved.projects.flatMap(project => {
        if (!project.demo) return [project];
        // Users could record real branches under the old starter projects.
        const recorded = project.takes.filter(t => !(t.part && t.created === 'Studio demo'));
        const ids = new Set(recorded.map(t => t.id));
        const mix = mixes[project.id];
        if (mix) {
          const remaining = mix.ids.filter(id => ids.has(id));
          if (remaining.length) mixes[project.id] = {...mix, ids:remaining};
          else delete mixes[project.id];
        }
        if (!recorded.length) return [];
        const takes = recorded.map(t => t.parent && !ids.has(t.parent) ? {...t,parent:null} : t);
        return [{...project,demo:false,takes}];
      });
      return {...empty,...saved,projects,mixes};
    }
  } catch { /* New workspace */ }
  return empty;
}
// Keep work recorded before signup reachable after the first account claims it.
// The guest copy stays intact so signing out still shows the guest shelf.
export function claimGuestLibrary(userId) {
  try {
    const target = `swarhub:supabase-${userId}`;
    if (localStorage.getItem('swarhub:guest-claimed')) return false;
    const current = JSON.parse(localStorage.getItem(target));
    if (current?.projects?.length) return false;
    const guest = localStorage.getItem('swarhub:guest');
    if (!guest) return false;
    if (!JSON.parse(guest)?.projects?.length) return false;
    localStorage.setItem(target, guest);
    localStorage.setItem('swarhub:guest-claimed', userId);
    return true;
  } catch { return false; }
}
