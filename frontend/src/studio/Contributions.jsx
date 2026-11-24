import {Activity} from 'lucide-react';

const key=d=>`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
export default function Contributions({projects,library,preview}){
  const counts=new Map(),seen=new Set();
  const add=(stamp,id)=>{const date=new Date(stamp);if(!Number.isFinite(+date)||seen.has(id))return;seen.add(id);const k=key(date);counts.set(k,(counts.get(k)||0)+1);};
  projects.forEach(p=>p.takes.forEach(t=>add(t.created,`${p.remote?'account':'local'}:${t.id}`)));
  Object.entries(library.mixes).forEach(([id,m])=>add(m.at,`mix:${id}`));
  library.applications.forEach(a=>add(a.created,`brief:${a.id}`));
  const today=new Date();today.setHours(0,0,0,0);
  const start=new Date(today);start.setDate(start.getDate()-today.getDay()-7*25);
  const sample=preview&&!counts.size;
  const days=Array.from({length:26*7},(_,i)=>{
    const day=new Date(start);day.setDate(start.getDate()+i);
    const pattern=(i*19+Math.floor(i/7)*11)%31;
    const n=day>today?0:sample?(pattern<11?1+pattern%4:0):counts.get(key(day))||0;
    return {day,n,future:day>today};
  });
  const month=d=>d.toLocaleDateString(undefined,{month:'short'});
  return <section className="panel contribution"><div className="panel-head"><Activity/>Studio contributions</div><div className="inset">
    <div className="between"><strong>{days.reduce((s,d)=>s+d.n,0)} contributions in 26 weeks</strong>{sample&&<small className="chip">Preview activity</small>}</div>
    <div className="activity-months">{days.filter((_,i)=>i%7===0).map(({day},i)=><span key={i}>{!i||month(day)!==month(days[(i-1)*7].day)?month(day):''}</span>)}</div>
    <div className="heatmap" aria-label="Daily studio activity">{days.map(({day,n,future})=><span key={key(day)} data-level={Math.min(4,n)} style={{visibility:future?'hidden':'visible'}} title={`${day.toLocaleDateString()}: ${n} contributions`}/>)}</div>
    <div className="heat-key"><span>Less</span>{[0,1,2,3,4].map(n=><i key={n} data-level={n}/>)}<span>More</span></div>
    <small>{sample?'Sample sessions from the preview artist. Your first saved take starts your own calendar.':'Saved takes, master selections and application drafts count toward your activity.'}</small>
  </div></section>;
}
