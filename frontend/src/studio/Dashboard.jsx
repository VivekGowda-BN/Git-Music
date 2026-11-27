import {useEffect,useRef,useState} from 'react';
import {Link,useNavigate,useOutletContext,useSearchParams} from 'react-router-dom';
import { ArrowLeft,ArrowUpRight,Check,Compass,GitBranch,GitMerge,Headphones,History,Mic,Play,Search,Square,Trash2 } from 'lucide-react';
import axios from 'axios';
import {clock} from './audio';
import {audioSource} from './playback';
import {SavedAnalysis} from './TakeAnalysis';
import {removeMedia} from './library';
import {projectCovers} from './projectCover';
import {API_URL,getAuthHeaders} from '../lib/api';

const dateFormat = new Intl.DateTimeFormat(undefined,{year:'numeric',month:'short',day:'numeric'});

function ProjectCard({project,cover}) {
  let latest = null;
  for (const take of project.takes) {
    if (!take.created || take.part) continue;
    // SQLite CURRENT_TIMESTAMP is UTC but omits the time-zone suffix.
    const stamp = String(take.created).replace(/^(\d{4}-\d\d-\d\d) (\d\d:\d\d:\d\d)$/, '$1T$2Z');
    const date = new Date(stamp);
    if (Number.isFinite(date.getTime()) && (!latest || date > latest)) latest = date;
  }
  return <Link className="project-card sleeve-card" to={`/dashboard?project=${project.id}`}>
    <img className="sleeve-art" src={cover} alt="" loading="lazy"/>
    <div className="sleeve-body">
      {latest ? <time className="micro" dateTime={latest.toISOString()}>{dateFormat.format(latest)}</time>
        : <small className="micro">Date unavailable</small>}
      <h3>{project.title}</h3>
      <div className="between"><span><GitBranch size={14}/> {project.takes.length} {project.takes.length===1?'take':'takes'} · {project.is_public?'Public':'Private'}</span><ArrowUpRight size={18}/></div>
    </div>
  </Link>;
}

export function Topology({takes,selected,select}){
  const [offsets,setOffsets]=useState({}),drag=useRef(null);
  const width=600,height=Math.max(216,100*Math.ceil((takes.length-1)/2)+100);
  const points=takes.map((t,i)=>offsets[t.id]||{x:i===0?100:i%2?315:495,y:i===0?height/2:70+Math.floor((i-1)/2)*100+(i%2?0:40)});
  return <div className="graph-scroll"><svg className="graph" viewBox={`0 0 ${width} ${height}`} role="group" aria-label="Project branch graph">
    {takes.map((t,i)=>{const parent=takes.findIndex(v=>v.id===t.parent);if(parent<0)return null;const a=points[parent],b=points[i];return <path key={t.id} d={`M${a.x} ${a.y} C${(a.x+b.x)/2} ${a.y},${(a.x+b.x)/2} ${b.y},${b.x} ${b.y}`} fill="none" stroke="#8c9e84" strokeWidth="2"/>;})}
    {takes.map((t,i)=><g key={t.id} role="button" tabIndex={0} aria-label={`Inspect ${t.name}`} className="graph-node" transform={`translate(${points[i].x} ${points[i].y})`}
      onKeyDown={e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();select(t.id);}}} onClick={()=>select(t.id)}
      onPointerDown={e=>{select(t.id);drag.current=t.id;e.currentTarget.setPointerCapture(e.pointerId);}}
      onPointerUp={()=>drag.current=null} onPointerCancel={()=>drag.current=null}
      onPointerMove={e=>{if(drag.current!==t.id)return;const svg=e.currentTarget.ownerSVGElement,pt=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());
        setOffsets(s=>({...s,[t.id]:{x:Math.max(80,Math.min(width-80,pt.x)),y:Math.max(35,Math.min(height-35,pt.y))}}));}}>
      <rect x="-71" y="-25" width="142" height="50" rx="6" fill={t.id===selected?'#354839':'#f7f6eb'} stroke="#73846c"/>
      <text x="-58" y="-6" fontSize="9" letterSpacing="1.4" fill={t.id===selected?'#cfdebe':'#52614e'}>{!t.parent?'ROOT':'BRANCH'} / {String(i+1).padStart(2,'0')}</text>
      <text x="-58" y="13" fontSize="13" fontWeight="600" fill={t.id===selected?'#fffdf1':'#2f362c'}>{t.name.length>17?t.name.slice(0,16)+'…':t.name}</text>
    </g>)}</svg></div>;
}
function Repository({project,initial,library,update}){
  const {takes}=project,[selected,setSelected]=useState(takes.some(t=>t.id===initial)?initial:takes[0]?.id);
  const [enabled,setEnabled]=useState(library.mixes[project.id]?.ids||takes.slice(0,1).map(t=>t.id)),[playing,setPlaying]=useState(false),[message,setMessage]=useState('');
  const players=useRef([]),generation=useRef(0),detail=useRef(null);
  const current=takes.find(t=>t.id===selected)||takes[0];
  const navigate=useNavigate();
  function branch(){
    navigate(`/capture?project=${project.id}${current?`&parent=${current.id}`:''}`);
  }
  function stop(){generation.current++;players.current.forEach(({player,source})=>{player.pause();if(source.temporary)URL.revokeObjectURL(source.url);});players.current=[];setPlaying(false);}
  useEffect(()=>()=>{generation.current++;players.current.forEach(({player,source})=>{player.pause();if(source.temporary)URL.revokeObjectURL(source.url);});},[]);
  async function play(ids,mode){
    stop();const id=generation.current;setMessage('');
    detail.current?.querySelector('.analysis audio')?.pause();
    try{
      for(const t of takes.filter(v=>ids.includes(v.id))){
        const source=await audioSource(t);if(id!==generation.current){if(source.temporary)URL.revokeObjectURL(source.url);return;}
        const player=new Audio(source.url);players.current.push({player,source});player.volume=1/Math.sqrt(ids.length);
        player.onended=()=>{if(players.current.every(p=>p.player.ended))stop();};
      }
      await Promise.all(players.current.map(p=>p.player.play()));if(id===generation.current)setPlaying(mode);
    }catch(e){if(id===generation.current){stop();setMessage(e.message||'Playback unavailable.');}}
  }
  return <div ref={detail} className="detail-layout"><article className="panel repository"><div className="panel-head"><GitBranch/>Branches<small className="micro">{takes.length} takes</small></div>
    {current?<><div className="graph-label micro">Select a take to inspect its sound</div>
      <Topology takes={takes} selected={selected} select={id=>{if(id!==selected)stop();setSelected(id);}}/>
      <div className="inspect"><div><small className="micro">Selected take</small><h3>{current.name}</h3><p>{[current.key,current.bpm&&`${current.bpm} BPM`,current.duration&&clock(current.duration),current.rate&&`${current.rate/1000} kHz`].filter(Boolean).join(' · ')||'No acoustic metadata'}</p></div>
        <button className="btn solo-button" onClick={()=>playing==='solo'?stop():play([current.id],'solo')}><span>{playing==='solo'?<Square size={14} fill="currentColor"/>:<Play size={16} fill="currentColor"/>}</span>{playing==='solo'?'Stop full take':'Play full take'}</button>
        <button className="btn" onClick={branch}><GitBranch size={14}/> Add branch</button></div>
      <details className="history"><summary><Headphones size={16}/> Layer mixer</summary><p>Choose which recorded parts to hear together.</p><div className="chips">{takes.map(t=><label className="chip" key={t.id}><input type="checkbox" checked={enabled.includes(t.id)} onChange={()=>{stop();setEnabled(ids=>ids.includes(t.id)?ids.filter(v=>v!==t.id):[...ids,t.id]);}}/>{t.name}</label>)}</div>
        <div className="actions"><button className="btn" disabled={!enabled.length} onClick={()=>playing==='mix'?stop():play(enabled,'mix')}>{playing==='mix'?<Square size={15}/>:<Play size={15}/>} {playing==='mix'?'Stop mix':'Play layers'}</button><button className="btn" disabled={!enabled.length} onClick={()=>{update(l=>({...l,mixes:{...l.mixes,[project.id]:{ids:enabled,at:new Date().toISOString()}}}));setMessage('Master mix saved in this browser. Original takes preserved.');}}><GitMerge size={15}/> Save master mix</button></div></details>
      {message&&<p className="inset" role="status">{message}</p>}
      <details className="history"><summary><History size={16}/> Version history</summary>{library.mixes[project.id]&&<p><Check size={14}/> Master selection saved · {new Date(library.mixes[project.id].at).toLocaleString()}</p>}{[...takes].reverse().map(t=><p key={t.id}><GitBranch size={14}/> {t.name} · {t.created==='Studio demo'?t.created:new Date(t.created).toLocaleString()}</p>)}</details></>:<div className="inset"><h3>No takes yet</h3><p>Record the root take to start a branch tree.</p><button className="btn" onClick={branch}><Mic size={15}/> Add first take</button></div>}
  </article>{current&&<SavedAnalysis key={current.id} take={current} onPreview={stop}/>}</div>;
}
export default function Dashboard(){
  const {library,update,remote,removeRemote,accountError}=useOutletContext(),[query]=useSearchParams(),navigate=useNavigate(),projects=[...library.projects,...remote],project=projects.find(p=>p.id===query.get('project'));
  const [search,setSearch]=useState('');
  const [confirmDelete,setConfirmDelete]=useState(false),[deleting,setDeleting]=useState(false),[deleteError,setDeleteError]=useState('');
  const recorded=projects.filter(p=>p.takes.some(t=>!t.part));
  const covers=projectCovers(recorded);
  const visible=recorded.filter(p=>p.title.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  async function deleteProject(){
    setDeleting(true);setDeleteError('');
    try{
      if(project.remote){
        await axios.delete(`${API_URL}/projects/${project.serverId??project.id.replace(/^account-/,'')}`,{headers:getAuthHeaders()});
        removeRemote?.(project.id);
      }else{
        await Promise.all(project.takes.map(t=>removeMedia(t.id).catch(()=>{})));
        update(l=>({...l,projects:l.projects.filter(p=>p.id!==project.id),mixes:Object.fromEntries(Object.entries(l.mixes||{}).filter(([key])=>key!==project.id))}));
      }
      navigate('/dashboard');
    }catch(e){
      setDeleteError(e.response?.data?.error||e.message||'Could not delete this project.');
      setDeleting(false);
    }
  }
  if(project)return <section className="work wrap"><Link className="plain back-link" to="/dashboard"><ArrowLeft size={16}/> All projects</Link><h1>{project.title}<span>.</span></h1><p className="intro">{project.remote?'Account repository':project.demo?'Studio arrangement':'Audio repository'} · {project.takes.length} takes</p>
    <Repository key={`${project.id}-${project.takes.length}`} project={project} initial={query.get('take')} library={library} update={update}/>
    <details className="danger-zone"><summary><Trash2 size={16}/> Project settings</summary><div>
      <p>Deleting <strong>{project.title}</strong> removes its takes {project.remote?'from your account':'from this browser'}. This cannot be undone.</p>
      {deleteError&&<p role="alert" className="error">{deleteError}</p>}
      {confirmDelete?<div className="actions"><button className="btn danger" disabled={deleting} onClick={deleteProject}>{deleting?'Deleting…':'Delete permanently'}</button><button className="btn" disabled={deleting} onClick={()=>setConfirmDelete(false)}>Cancel</button></div>:<button className="btn danger" onClick={()=>setConfirmDelete(true)}><Trash2 size={15}/> Delete project</button>}
    </div></details></section>;
  return <section className="work wrap shelf"><div className="title-row"><div><h1>Your projects<span>.</span></h1><p className="intro">Every take, filed by song.</p></div><Link to="/capture" className="btn primary"><Mic size={16}/> Open capture</Link></div>
    {accountError&&<p role="status" className="error">{accountError}</p>}
    <div className="shelf-tools"><label className="search-projects"><Search size={18}/><input type="search" aria-label="Search projects" placeholder="Search your projects…" value={search} onChange={e=>setSearch(e.target.value)}/></label>
      <Link className="btn" to="/feed"><Compass size={16}/> Explore</Link></div>
    {visible.length>0&&<div className="project-cards" aria-label="Project library">{visible.map(p=><ProjectCard key={p.id} project={p} cover={covers.get(p.id)}/>)}</div>}
    {!recorded.length
      ? <div className="empty-library"><Mic aria-hidden="true"/><div><h3>No recordings yet</h3><p>Record or upload a take in Capture, then save it to see it here.</p></div></div>
      : !visible.length&&<div className="empty-library"><p>No projects match “{search}”.</p><button className="btn" onClick={()=>setSearch('')}>Clear search</button></div>}
    </section>;
}
