import {useEffect,useRef,useState} from 'react';
import {useNavigate,useOutletContext,useSearchParams} from 'react-router-dom';
import { GitBranch,Mic,Square,Upload,X } from 'lucide-react';
import {analyse,clock} from './audio';
import {media} from './library';
import {Wave} from './Home';
import {AnalysisPanel} from './TakeAnalysis';
import FrequencyRing from './FrequencyRing';

function FileDialog({close,children}){
  const ref=useRef(null);
  useEffect(()=>{const el=ref.current;el.showModal();return()=>el.close();},[]);
  return <dialog ref={ref} className="file-dialog" aria-labelledby="file-title" onCancel={e=>{e.preventDefault();close();}}>{children}</dialog>;
}

export default function Capture(){
  const {library,update}=useOutletContext(),navigate=useNavigate(),[query]=useSearchParams();
  const [project,setProject]=useState(query.get('project')||''),[parent,setParent]=useState(query.get('parent')||''),[title,setTitle]=useState(''),[name,setName]=useState('');
  const [phase,setPhase]=useState('idle'),[elapsed,setElapsed]=useState(0),[take,setTake]=useState(null),[error,setError]=useState(''),[drag,setDrag]=useState(false);
  const [activeStream,setActiveStream]=useState(null),[filing,setFiling]=useState(false),[visibility,setVisibility]=useState(''),[mood,setMood]=useState('');
  const file=useRef(null),recorder=useRef(null),job=useRef(null),alive=useRef(false),stream=useRef(null);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;job.current?.abort();if(recorder.current?.state==='recording')recorder.current.stop();stream.current?.getTracks().forEach(t=>t.stop());};},[]);
  useEffect(()=>{if(phase!=='recording')return;const start=Date.now();const id=setInterval(()=>setElapsed((Date.now()-start)/1000),250);return()=>clearInterval(id);},[phase]);
  useEffect(()=>()=>{if(take){URL.revokeObjectURL(take.url);if(take.clip)URL.revokeObjectURL(take.clip);}},[take]);
  async function ingest(blob,label,recorded=false){
    job.current?.abort();const controller=new AbortController();job.current=controller;
    setError('');setTake(null);setPhase('analysing');setName(label);
    setMood('');setVisibility('');setTitle(recorded?'':label);setFiling(false);
    try{
      const {meta,hook}=await analyse(blob,{signal:controller.signal});if(controller.signal.aborted)return;
      setTake({blob,meta,url:URL.createObjectURL(blob),clip:hook?URL.createObjectURL(hook):null,hook});
      // A fresh recording goes straight to naming; cancelling the dialog deletes it.
      if(recorded)setFiling(true);
    }catch(e){if(alive.current&&!controller.signal.aborted)setError(e.name==='EncodingError'?'This audio could not be decoded. Try a WAV or MP3 file.':e.message);}
    finally{if(alive.current&&job.current===controller){setPhase('idle');job.current=null;}}
  }
  async function record(){
    if(phase==='recording'){if(recorder.current?.state==='recording')recorder.current.stop();return;}
    setError('');setPhase('requesting');
    try{
      const input=await navigator.mediaDevices.getUserMedia({audio:true});if(!alive.current){input.getTracks().forEach(t=>t.stop());return;}
      stream.current=input;const rec=new MediaRecorder(input),chunks=[];recorder.current=rec;
      rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};rec.onstop=()=>{input.getTracks().forEach(t=>t.stop());if(alive.current){setActiveStream(null);ingest(new Blob(chunks,{type:rec.mimeType}),'Microphone take',true);}};
      rec.start();setActiveStream(input);setElapsed(0);setPhase('recording');
    }catch{stream.current?.getTracks().forEach(t=>t.stop());if(alive.current){setError('Microphone unavailable. Allow microphone access in your browser or upload an audio file.');setPhase('idle');}}
  }
  const current=library.projects.find(p=>p.id===project);
  async function save(e){
    e.preventDefault();if(!take||(!current&&(!title.trim()||!visibility))){setError('Enter a project name and choose its visibility.');return;}setPhase('saving');setError('');
    try{
      const id=crypto.randomUUID(),pid=current?.id||crypto.randomUUID();
      await media(id,{blob:take.blob,hook:take.hook});
      const row={...take.meta,mood:mood.trim()||take.meta.mood,id,name:name.trim()||title.trim()||'New take',parent:current?(parent||current.takes[0]?.id):null,created:new Date().toISOString()};
      update(l=>({...l,projects:current?l.projects.map(p=>p.id===pid?{...p,takes:[...p.takes,row]}:p):[{id:pid,title:title.trim(),takes:[row],is_public:visibility==='public'},...l.projects]}));
      navigate(`/dashboard?project=${pid}&take=${id}`);
    }catch{setError('Could not save this take. Check your browser storage and try again.');setPhase('idle');}
  }
  function discard(){
    if(phase==='saving')return;
    job.current?.abort();job.current=null;
    setFiling(false);setTake(null);setError('');
    setName('');setTitle('');setMood('');setVisibility('');setParent('');
  }
  function pick(f){if(f&&phase==='idle')ingest(f,f.name.replace(/\.[^.]+$/,''));}
  return <section className="work wrap"><h1>Capture studio<span>.</span></h1><p className="intro">Record a take or drop in a track. Find its pulse, inspect the mix, and audition a suggested highlight.</p>
    <div className="work-grid"><article className="panel"><div className="panel-head"><Mic/>Audio input <small className="micro">{phase}</small></div>
    <div className={`capture-bed ${drag?'drag':''}`} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);pick(e.dataTransfer.files[0]);}}>
      <div className="capture-stage"><FrequencyRing stream={activeStream}/>
        <button className={`rec-dial ${phase==='recording'?'live':''}`} aria-label={phase==='recording'?'Stop recording':'Record a take'} disabled={!['idle','recording'].includes(phase)} onClick={record}>
          <span className="dial-face">{phase==='recording'?<Square size={24}/>:<Mic size={26}/>}<strong>{clock(phase==='recording'?elapsed:take?.meta.duration||0)}</strong><small className="micro">{phase==='recording'?'Tap to stop':phase==='requesting'?'Allow mic':'Tap to record'}</small></span>
        </button>
      </div>{take&&<Wave peaks={take.meta.peaks}/>}
      <button className="plain" disabled={phase!=='idle'} onClick={()=>file.current.click()}><Upload size={15}/> Upload audio</button><input hidden type="file" ref={file} accept="audio/*,.wav,.mp3,.flac" onChange={e=>{pick(e.target.files[0]);e.target.value='';}}/>
       <small>Drop audio here · WAV, MP3 or FLAC · up to 80 MB</small></div>
      {take&&<div className="inset"><label>Full take<audio controls src={take.url}/></label></div>}
      <div className="feature-guide"><h3>Reading the analysis</h3><dl>
        <div><dt>Tempo</dt><dd>Beats per minute, shown when the take has a steady pulse.</dd></div>
        <div><dt>Musical key</dt><dd>The major or minor key the notes point to.</dd></div>
        <div><dt>Frequency span</dt><dd>The range carrying the central 90% of spectral energy.</dd></div>
        <div><dt>Dynamics</dt><dd>The spread between quiet and loud passages.</dd></div>
        <div><dt>Levels</dt><dd>Average and peak loudness; 0 dBFS is digital full scale.</dd></div>
        <div><dt>Balance</dt><dd>The share of energy in low, mid and high frequencies.</dd></div>
      </dl></div>
     </article><AnalysisPanel meta={take?.meta} clip={take?.clip} name={name} status={phase==='analysing'?'Listening for pulse, tonal centre, and a highlight…':''}/></div>
     {phase==='analysing'&&<button className="btn resume-file" onClick={()=>{job.current?.abort();job.current=null;setPhase('idle');}}>Cancel analysis</button>}
    {take&&!filing&&<button className="btn primary resume-file" onClick={()=>setFiling(true)}><GitBranch size={16}/> Save this take</button>}
    {filing&&<FileDialog close={discard}><form className="stack" onSubmit={save}><div className="dialog-head"><div><small className="eyebrow">Capture complete</small><h2 id="file-title">Save your take.</h2></div><button type="button" className="dialog-close" aria-label="Cancel and delete this recording" title="Cancel and delete this recording" disabled={phase==='saving'} onClick={discard}><X size={19}/></button></div>
      <label>Destination<select value={project} onChange={e=>{setProject(e.target.value);setParent('');}}><option value="">New project</option>{library.projects.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
      {current?<>{!!current.takes.length&&<label>Branch from<select value={parent||current.takes[0]?.id} onChange={e=>setParent(e.target.value)}>{current.takes.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}<label>Take name<input value={name} onChange={e=>setName(e.target.value)}/></label><small>Uses {current.title}’s {current.is_public?'public':'private'} visibility.</small></>:<>
        <label>Project name <input autoFocus value={title} maxLength={120} required placeholder="Name this recording" onChange={e=>setTitle(e.target.value)}/></label>
        <fieldset className="visibility"><legend>Project visibility · required</legend>{['private','public'].map(v=><label key={v}><input type="radio" name="visibility" value={v} required checked={visibility===v} onChange={()=>setVisibility(v)}/>{v==='private'?'Private':'Public'}</label>)}</fieldset></>}
      <label>Mood (optional)<input value={mood} maxLength={60} placeholder="e.g. Warm, restless, reflective" onChange={e=>setMood(e.target.value)}/></label>
      {error&&<p role="alert" className="error">{error}</p>}<small className="dialog-note">Cancel deletes this recording. Choose Review audio to listen before saving.</small><div className="actions"><button className="btn primary" disabled={!take||phase!=='idle'}>{phase==='analysing'?'Reading audio…':phase==='saving'?'Saving…':'Save to dashboard'}</button><button type="button" disabled={phase==='saving'} className="btn" onClick={()=>setFiling(false)}>Review audio</button><button type="button" disabled={phase==='saving'} className="btn danger" onClick={discard}>Cancel &amp; delete take</button></div>
    </form></FileDialog>}
    {error&&!filing&&<p role="alert" className="error">{error}</p>}</section>;
}
