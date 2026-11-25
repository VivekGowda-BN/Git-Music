import {useEffect,useRef,useState} from 'react';
import {Link,useNavigate,useOutletContext} from 'react-router-dom';
import {ArrowUpRight,BookOpen,GitFork,Headphones,Link2,MapPin,Music2,NotebookPen,SlidersHorizontal,Users} from 'lucide-react';
import {motion,useReducedMotion,useSpring} from 'framer-motion';
import {Topology} from './Dashboard';
import {audioSource} from './playback';
import Contributions from './Contributions';
import {opportunities,opportunityTypes,platformIcons,sources} from './opportunities';

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

const coverPhotos={Guitar:'strings',Bass:'strings',Keys:'keys',Dholak:'percussion',Vocals:'vocals'};

function OpportunityCard({call,index}){
  const ref=useRef(null),reduced=useReducedMotion(),[canHover]=useState(()=>window.matchMedia('(hover:hover) and (pointer:fine)').matches);
  const rotateX=useSpring(0,{stiffness:170,damping:20,mass:.6}),rotateY=useSpring(0,{stiffness:170,damping:20,mass:.6});
  function move(e){
    const el=ref.current;
    if(!canHover||reduced||!el)return;
    const box=el.getBoundingClientRect(),x=(e.clientX-box.left)/box.width,y=(e.clientY-box.top)/box.height;
    rotateY.set((x-.5)*11);rotateX.set(-(y-.5)*9);
    el.style.setProperty('--mx',`${(x*100).toFixed(1)}%`);
    el.style.setProperty('--my',`${(y*100).toFixed(1)}%`);
  }
  function rest(){rotateX.set(0);rotateY.set(0);}
  return <motion.a ref={ref} className="opp-card" data-type={call.type} href={call.url} target="_blank" rel="noreferrer noopener"
    aria-label={`${call.title} on ${call.source}, opens in a new tab`}
    style={{rotateX:reduced?0:rotateX,rotateY:reduced?0:rotateY,transformPerspective:1100}}
    initial={reduced?false:{opacity:0,y:24}} animate={{opacity:1,y:0}}
    transition={{duration:.55,delay:Math.min(index,9)*.045,ease:[.22,1,.36,1]}}
    whileHover={canHover&&!reduced?{y:-7,transition:{type:'spring',stiffness:300,damping:24}}:undefined}
    onPointerMove={move} onPointerLeave={rest}>
    <div className="opp-art"><img src={`/art/opportunities/${coverPhotos[call.instrument]||'stage'}.jpg`} alt="" width="800" height="380"/></div>
    <span className="opp-badge" title={call.source}><img src={platformIcons[call.source]} alt=""/></span>
    <div className="opp-body"><h2>{call.title}</h2><p>{call.summary}</p></div>
    <div className="opp-meta">
      <span><MapPin size={13}/>{call.city}</span>
      <span><Music2 size={13}/>{call.instrument}</span>
      <span className="opp-age">{call.posted}</span>
    </div>
  </motion.a>;
}

export function Opportunities(){
  const [filter,setFilter]=useState('All');
  const shown=filter==='All'?opportunities:opportunities.filter(o=>o.type===filter);
  return <section className="work wrap opportunities-page">
    <header className="opp-head">
      <div className="opp-heading"><h1>Opportunities<span>.</span></h1>
        <p className="intro">Find a band, join a session, or audition for a music video.</p></div>
    </header>
    <div className="opp-toolbar"><div className="filters" role="group" aria-label="Filter opportunities">
      {opportunityTypes.map(t=><button key={t} aria-pressed={filter===t} onClick={()=>setFilter(t)}>{t}</button>)}
    </div></div>
    <div className="opp-grid">{shown.map((o,i)=><OpportunityCard key={o.id} call={o} index={i}/>)}</div>
    {!shown.length&&<p className="inset opp-empty">No calls in this lane right now. Try another filter.</p>}
    <section className="opp-sources" aria-labelledby="sources-title">
      <div className="opp-section-head"><h2 id="sources-title">Where to look<span>.</span></h2></div>
      <div className="source-grid">{sources.map(s=><a className="source-card source-logo" key={s.name} href={s.url} target="_blank" rel="noreferrer noopener" title={s.name} aria-label={`${s.name}, opens in a new tab`}>
        <img src={platformIcons[s.name]} alt="" width="32" height="32"/>
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
