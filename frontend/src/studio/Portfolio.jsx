import {useEffect,useState} from 'react';
import {Link,useNavigate,useOutletContext} from 'react-router-dom';
import {ArrowUpRight,BookOpen,Check,Coins,GitFork,Headphones,Link2,MapPin,NotebookPen,SlidersHorizontal,Users} from 'lucide-react';
import {briefs} from './library';
import {Topology} from './Dashboard';
import {audioSource} from './playback';
import Contributions from './Contributions';
import Poster from './Poster';

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
  const {library,update}=useOutletContext(),projects=library.projects.filter(p=>p.takes.length);
  const [opened,setOpened]=useState(''),[pid,setPid]=useState(projects[0].id),[tid,setTid]=useState('');
  const project=projects.find(p=>p.id===pid)||projects[0],take=project.takes.find(t=>t.id===tid)||project.takes[0];
  function apply(e,b){
    e.preventDefault();update(l=>({...l,applications:[...l.applications.filter(a=>a.id!==b.id),{id:b.id,projectId:project.id,takeId:take.id,project:project.title,take:take.name,format:b.format,created:new Date().toISOString()}]}));setOpened('');
  }
  return <section className="work wrap"><h1>Opportunities<span>.</span></h1><p className="intro">Find a stage, a session, or a scene that needs your sound.</p>
    <div className="briefs">{briefs.map(b=>{
      const saved=library.applications.find(a=>a.id===b.id);
      return <article className="panel brief" key={b.id}><Poster brief={b}/><div className="inset"><small className="eyebrow">{b.type}</small><p className="host-name">{b.host}</p><h2>{b.title}</h2><p>{b.detail}</p>
        <div className="brief-meta"><span><MapPin size={15}/>{b.location}</span><span><Coins size={15}/>{b.terms}</span></div>
        {saved&&<p className="notice"><Check size={15}/> Draft saved · {saved.project}</p>}
        {opened===b.id?<form className="stack" onSubmit={e=>apply(e,b)}><label>Project<select value={project.id} onChange={e=>{setPid(e.target.value);setTid('');}}>{projects.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
          {b.format!=='Repository'&&<label>{b.format==='Hook'?'Hook from take':'Take'}<select value={take.id} onChange={e=>setTid(e.target.value)}>{project.takes.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}
          <small>Preview listing. Save your application locally to review it on your profile.</small><div className="actions"><button className="btn primary">Save application</button><button type="button" className="plain" onClick={()=>setOpened('')}>Cancel</button></div></form>
          :<button className="btn" onClick={()=>{setPid(saved?.projectId||projects[0].id);setTid(saved?.takeId||'');setOpened(b.id);}}>{saved?'Edit application':'Apply'} <ArrowUpRight size={15}/></button>}
      </div></article>;
    })}</div></section>;
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
