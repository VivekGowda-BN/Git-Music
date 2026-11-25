import {useState} from 'react';
import {Link,useOutletContext} from 'react-router-dom';
import {ArrowRight,ArrowUpRight,BookOpen,GitBranch,Plus,Search,Star} from 'lucide-react';
import Avatar from './Avatar';
import {opportunities} from './opportunities';

const releases=[
  {id:'monsoon',artist:'Isha Rao',project:'Monsoon Letters',circle:true,lane:'Indie folk',time:'35 min ago',stars:42,action:'added a guitar branch',note:'Kept the rain from the room mic. The second guitar now answers the vocal instead of doubling it.',tracks:['Room vocal','Rain guitar','Second verse']},
  {id:'static',artist:'Static Harbour',project:'Night Train FM',circle:false,lane:'Ambient',time:'2 hours ago',stars:128,action:'published a repository',note:'A night train, a cassette hiss, and one bass note. Four layers from a field-recording session.',tracks:['Platform tape','Sleeper hum','Sub bass','Tape return']},
  {id:'paper',artist:'Dev Malik',project:'Paper Lanterns',circle:true,lane:'Acoustic pop',time:'5 hours ago',stars:36,action:'saved a new mix',note:'The stripped-back chorus won. Just the fingerpicked guitar, the vocal, and a little piano on the last line.',tracks:['Fingerpicked root','Chorus vocal','Soft keys']},
  {id:'coast',artist:'Coastline Ensemble',project:'Saltwater Sessions',circle:false,lane:'Jazz fusion',time:'Yesterday',stars:94,action:'opened a horn branch',note:'An alternate horn line over the live trio take, written in the room after the first pass.',tracks:['Trio live','Horn response']},
];
export default function Feed(){
  const {library,remote,update,previewArtist,user}=useOutletContext(),[view,setView]=useState('Latest'),[search,setSearch]=useState(''),[mobilePane,setMobilePane]=useState('Activity');
  const artist=library.artist.name||user?.username||(previewArtist?'Mira Sen':'Your studio');
  const projects=[...library.projects,...remote].sort((a,b)=>b.takes.length-a.takes.length);
  const starred=library.feedStars||[];
  const entries=view==='Friends'?releases.filter(p=>p.circle):view==='Popular'?[...releases].sort((a,b)=>b.stars-a.stars):releases;
  function star(id){update(l=>({...l,feedStars:starred.includes(id)?starred.filter(x=>x!==id):[...starred,id]}));}
  const listed=projects.filter(p=>p.title.toLowerCase().includes(search.trim().toLowerCase())).slice(0,6);
  function openUpdate(e,id){e.preventDefault();setView('Latest');setMobilePane('Activity');requestAnimationFrame(()=>document.getElementById(`feed-${id}`)?.focus());}
  return <section className="work wrap feed-page" data-pane={mobilePane}><nav className="mobile-feed-nav" aria-label="Feed sections">{['Projects','Activity','Updates'].map(p=><button key={p} aria-pressed={mobilePane===p} onClick={()=>setMobilePane(p)}>{p}</button>)}</nav><div className="feed-grid">
    <aside className="feed-sidebar"><Link className="rail-identity" to="/profile"><img src="/art/artist.svg" alt=""/><span><small>Workspace</small><strong>{artist}</strong></span></Link>
      <div className="rail-heading"><h2>Your projects</h2><Link to="/capture" aria-label="Capture a new project" title="Capture a new project"><Plus size={16}/></Link></div>
      <label className="rail-search"><Search size={15}/><input aria-label="Find a project in your sidebar" placeholder="Find a project…" type="search" value={search} onChange={e=>setSearch(e.target.value)}/></label>
      <div className="rail-projects">{listed.map(p=><Link className="rail-project" key={p.id} to={`/dashboard?project=${p.id}`}><BookOpen size={15}/><strong>{p.title}</strong></Link>)}
        {!listed.length&&<p>No matching projects.</p>}</div><Link className="rail-more" to="/dashboard">All projects <ArrowRight size={13}/></Link></aside>
    <div className="feed-center"><div className="activity-heading"><h1>Activity</h1><small>Sample feed</small></div>
      <div className="feed-tabs" aria-label="Feed view">{['Latest','Friends','Popular'].map(v=><button aria-pressed={view===v} onClick={()=>setView(v)} key={v}>{v}</button>)}</div>
      {entries.map(p=><article key={p.id} id={`feed-${p.id}`} tabIndex="-1" className="feed-entry"><header className="entry-by"><Avatar index={releases.indexOf(p)} size={34} label={`${p.artist} profile`}/><div><strong>{p.artist}</strong> <small>{p.action}</small><span>{p.time}</span></div></header>
        <div className="entry-project"><h2>{p.project}</h2><p>{p.note}</p><div className="entry-meta"><span className="repo-genre"><i/>{p.lane}</span><details><summary><GitBranch size={14}/> {p.tracks.length} takes</summary><ul>{p.tracks.map(t=><li key={t}>{t}</li>)}</ul></details>
          <button aria-pressed={starred.includes(p.id)} aria-label={`${starred.includes(p.id)?'Unstar':'Star'} ${p.project}`} onClick={()=>star(p.id)}><Star size={15} fill={starred.includes(p.id)?'currentColor':'none'}/> {p.stars+Number(starred.includes(p.id))}</button></div></div></article>)}</div>
    <aside className="feed-updates"><div className="rail-heading"><h2>Updates</h2></div>
      <ol className="updates-list">{[releases[0],releases[1],releases[3]].map(p=><li key={p.id}><a className="update-link" href={`#feed-${p.id}`} onClick={e=>openUpdate(e,p.id)}><Avatar index={releases.indexOf(p)} size={22} label={`${p.artist} profile`}/><span><small>{p.time}</small>{p.artist} {p.action} in <strong>{p.project}</strong>.</span></a></li>)}</ol>
      <div className="rail-heading"><h2>Open calls</h2><Link className="rail-all" to="/opportunities">All</Link></div>
      {opportunities.slice(0,3).map(o=><a className="call-link" key={o.id} href={o.url} target="_blank" rel="noreferrer noopener"><strong>{o.title}</strong><span>{o.city} · {o.source}</span><ArrowUpRight size={15}/></a>)}
      <Link className="rail-more" to="/opportunities">See all {opportunities.length} calls <ArrowRight size={13}/></Link>
    </aside></div>
  </section>;
}
