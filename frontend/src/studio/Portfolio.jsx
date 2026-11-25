import {useEffect,useState} from 'react';
import {Link,useNavigate,useOutletContext} from 'react-router-dom';
import {ArrowUpRight,BookOpen,Clock3,GitFork,Headphones,Link2,MapPin,Music2,NotebookPen,SlidersHorizontal,Users} from 'lucide-react';
import {Topology} from './Dashboard';
import {audioSource} from './playback';
import Contributions from './Contributions';
import {checkedAt,opportunities,opportunityTypes,sources} from './opportunities';

function ListeningRoom({project}){
  const [id,setId]=useState(project.takes[0]?.id),[src,setSrc]=useState(''),[error,setError]=useState('');
  const take=project.takes.find(t=>t.id===id);
  useEffect(()=>{
    let active=true,resource;
    if(take)audioSource(take).then(s=>{resource=s;if(active){setSrc(s.url);setError('');}else if(s.temporary)URL.revokeObjectURL(s.url);}).catch(()=>{if(active){setSrc('');setError('Audio is unavailable for this take.');}});
    return()=>{active=false;if(resource?.temporary)URL.revokeObjectURL(resource.url);};
  },[take]);
  return take?<><Topology takes={project.takes} selected={id} select={setId}/><div className="inset"><label>{take.name}{src&&<audio controls src={src}/>}</label>{error&&<p role="status">{error}</p>}</div></>:<p className="inset">No recorded takes yet.</p>;
}

export function Opportunities(){
  const [filter,setFilter]=useState('All');
  const shown=filter==='All'?opportunities:opportunities.filter(o=>o.type===filter);
  return <section className="work wrap opportunities-page">
    <header className="opp-head">
      <div className="opp-heading"><small className="eyebrow">Open calls · India</small><h1>Opportunities<span>.</span></h1>
        <p className="intro">Real calls from Indian music boards, hand-checked and linked to the original post.</p></div>
      <div className="opp-status"><span className="dot" aria-hidden="true"/><div><small>Hand-checked</small><strong>{checkedAt}</strong></div><div><small>Live calls</small><strong>{opportunities.length}</strong></div></div>
    </header>
    <div className="opp-toolbar"><div className="filters" aria-label="Filter opportunities">
      {opportunityTypes.map(t=>{const count=t==='All'?opportunities.length:opportunities.filter(o=>o.type===t).length;return <button key={t} aria-pressed={filter===t} onClick={()=>setFilter(t)}>{t}<span>{count}</span></button>;})}
    </div><p className="opp-count">{shown.length} {shown.length===1?'call':'calls'}{filter!=='All'&&` in ${filter.toLowerCase()}`}</p></div>
    <div className="opp-grid">{shown.map(o=><article className="opp-card" key={o.id} data-type={o.type}>
      <div className="opp-card-top"><span className="opp-type">{o.type}</span>{o.fresh&&<span className="opp-new">New</span>}</div>
      <h2>{o.title}</h2><p>{o.summary}</p>
      <dl className="opp-facts">
        <div><dt><MapPin size={14}/>City</dt><dd>{o.city}</dd></div>
        <div><dt><Music2 size={14}/>Instrument</dt><dd>{o.instrument}</dd></div>
        <div><dt><Clock3 size={14}/>Posted</dt><dd>{o.posted}</dd></div>
      </dl>
      <a className="opp-source" href={o.url} target="_blank" rel="noreferrer noopener"><span><small>View on</small><strong>{o.source}</strong></span><ArrowUpRight size={18}/></a>
    </article>)}</div>
    {!shown.length&&<p className="inset opp-empty">No calls in this lane right now. Try another filter.</p>}
    <section className="opp-sources" aria-labelledby="sources-title">
      <div className="opp-section-head"><div><small className="eyebrow">Keep looking</small><h2 id="sources-title">Where to look<span>.</span></h2></div>
        <p>Nine places worth checking between refreshes. Some need an account; a few ask for a fee.</p></div>
      <div className="source-grid">{sources.map(s=><a className="source-card" key={s.name} href={s.url} target="_blank" rel="noreferrer noopener">
        <div className="source-card-top"><strong>{s.name}</strong><ArrowUpRight size={16}/></div><small>{s.region}</small><p>{s.best}</p><span>{s.note}</span>
      </a>)}</div>
    </section>
    <aside className="opp-post"><div><small className="eyebrow">For organisers</small><h2>Running a call?</h2>
      <p>Send the listing link and a one-line description. We will check it before it goes on the board.</p><small className="opp-post-note">Opens a draft in your mail app.</small></div>
      <a className="btn primary" href="mailto:?subject=Opportunity%20for%20SwarHub&body=Title%3A%0ACity%3A%0AType%3A%0ADeadline%3A%0ALink%3A%0A">Suggest a listing <ArrowUpRight size={15}/></a></aside>
    <p className="opp-disclaimer">Listings belong to the platforms that published them. SwarHub is independent and not affiliated with any source. Always check the original post for fees, dates and terms.</p>
  </section>;
}

function external(value){
  try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:null;}catch{return null;}
}
const socialFields=[['website','Artist website'],['soundcloud','SoundCloud'],['instagram','Instagram']];
function Editor({artist,projects,save,close}){
  const [draft,setDraft]=useState(artist),[visible,setVisible]=useState(projects.filter(p=>p.is_public).map(p=>p.id));
  return <form className="panel inset stack" onSubmit={e=>{e.preventDefault();save(draft,visible);}}><h2>Edit profile</h2>
    {[['name','Artist name'],['bio','Bio'],['gear','Instruments & gear (comma-separated)'],...socialFields].map(([k,label])=><label key={k}>{label}<input value={draft[k]||''} type={socialFields.some(([key])=>key===k)?'url':'text'} maxLength={400} onChange={e=>setDraft(v=>({...v,[k]:e.target.value}))}/></label>)}
    <fieldset><legend>Feature these projects</legend>{projects.map(p=><label key={p.id} className="chip"><input type="checkbox" checked={visible.includes(p.id)} onChange={()=>setVisible(v=>v.includes(p.id)?v.filter(id=>id!==p.id):[...v,p.id])}/>{p.title}</label>)}</fieldset>
    <div className="actions"><button className="btn primary">Save profile</button><button className="btn" type="button" onClick={close}>Cancel</button></div></form>;
}
export function Profile(){
  const {library,update,user,remote,previewArtist}=useOutletContext(),navigate=useNavigate(),[edit,setEdit]=useState(false),[listening,setListening]=useState('');
  const artist=library.artist,name=artist.name||user?.username||(previewArtist?'Mira Sen':'Studio musician');
  const all=[...library.projects,...remote],popular=all.filter(p=>p.is_public).sort((a,b)=>b.takes.length-a.takes.length);
  const socials=socialFields.filter(([k])=>external(artist[k]));
  function fork(project){
    const id=crypto.randomUUID();update(l=>({...l,projects:[{...project,id,demo:false,remote:false,title:`${project.title} · fork`,is_public:false},...l.projects]}));navigate(`/dashboard?project=${id}`);
  }
  return <section className="work wrap artist-layout"><aside className="artist-sidebar">
    <img className="artist-portrait" src="/art/artist.svg" alt="Illustrated portrait of a musician wearing headphones"/>
    {previewArtist&&<small className="profile-badge">Preview artist</small>}<h1>{name}</h1><div className="handle">@{(user?.username||name).toLowerCase().replace(/[^\p{L}\d]+/gu,'-').replace(/-$/,'')}</div>
    <p>{artist.bio||(previewArtist?'Folk melodies, fingerpicked guitar, and field recordings. Usually chasing a better second verse.':'Add a bio to introduce your instruments and recording practice.')}</p>
    <div className="follow-count"><Users size={15}/><b>{previewArtist?'128':'0'}</b> followers <i>·</i> <b>{previewArtist?'32':'0'}</b> following</div>
    <button className="btn" onClick={()=>setEdit(v=>!v)}><NotebookPen size={15}/>{edit?'Close editor':'Edit profile'}</button>
    <div className="artist-socials"><small className="micro">Artist links</small>{socials.length?socials.map(([k,label])=><a key={k} href={external(artist[k])} rel="noreferrer" target="_blank"><Link2 size={15}/>{label}<ArrowUpRight size={13}/></a>):<>
      {previewArtist&&<><a href="https://bandcamp.com/discover/folk" rel="noreferrer" target="_blank"><Headphones size={15}/> Folk picks on Bandcamp <ArrowUpRight size={13}/></a><a href="https://soundcloud.com/search/sounds?q=acoustic%20folk" rel="noreferrer" target="_blank"><Headphones size={15}/> Acoustic finds on SoundCloud <ArrowUpRight size={13}/></a></>}
      <button className="plain" onClick={()=>setEdit(true)}><Link2 size={15}/> Add your social links</button></>}</div>
  </aside><div className="artist-main stack">{edit&&<Editor artist={artist} projects={library.projects} close={()=>setEdit(false)} save={(details,visible)=>{update(l=>({...l,artist:details,projects:l.projects.map(p=>({...p,is_public:visible.includes(p.id)}))}));setEdit(false);}}/>}
    <section className="portfolio-projects"><div className="library-heading"><BookOpen/><h2>Popular projects</h2><span>{popular.length} public</span></div>
      {popular.length?<div className="profile-cards">{popular.map(p=><article className="panel" key={p.id}><div className="portfolio-row"><div><Link to={`/dashboard?project=${p.id}`}><strong>{p.title} <ArrowUpRight size={16}/></strong></Link><small>{p.takes.length} {p.takes.length===1?'take':'takes'} · {p.demo?'Studio arrangement':'Audio repository'}</small></div><div className="actions"><button className="btn" aria-expanded={listening===p.id} onClick={()=>setListening(listening===p.id?'':p.id)}><Headphones size={15}/>{listening===p.id?'Close preview':'Listen'}</button><button className="btn" onClick={()=>fork(p)}><GitFork size={15}/> Fork project</button></div></div>{listening===p.id&&<ListeningRoom project={p}/>}</article>)}</div>:<p className="inset">Feature a project using the profile editor.</p>}
    </section>
    <Contributions projects={all} library={library} preview={previewArtist}/>
    <section className="panel"><div className="panel-head"><SlidersHorizontal/>Studio gear</div><div className="inset chips">{(artist.gear||(previewArtist?'Steel-string acoustic,Field recorder,Condenser microphone':'')).split(',').filter(Boolean).map((v,i)=><span className="chip" key={i}>{v.trim()}</span>)}{!artist.gear&&!previewArtist&&<p>Add your instruments and recording setup.</p>}</div></section>
  </div></section>;
}
