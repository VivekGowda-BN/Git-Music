import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,Play,Square,Volume1,Volume2,VolumeX} from 'lucide-react';
import Cassette from './Cassette';
import {featured} from './featured';

const source=import.meta.env.VITE_FEATURED_AUDIO_URL||featured.file;

export default function ListeningDesk({active,setOwner}){
  const [error,setError]=useState('');
  const [volume,setVolume]=useState(1);
  const [muted,setMuted]=useState(false);
  const audio=useRef(null);
  const level=muted?0:volume;
  useEffect(()=>{const el=audio.current;if(el){el.muted=muted;el.volume=level;}},[muted,level]);
  useEffect(()=>{if(!active)audio.current?.pause();},[active]);
  function begin(){
    setError('');
    const el=audio.current;
    if(el){el.currentTime=0;el.play().catch(()=>{setError('The excerpt could not start. Try again or watch it on YouTube.');setOwner(null);});}
    setOwner('feature');
  }
  function finish(){audio.current?.pause();setOwner(null);}
  function tilt(e){
    if(e.pointerType!=='mouse'||!matchMedia('(prefers-reduced-motion: no-preference)').matches)return;
    const r=e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--rx',`${(0.5-(e.clientY-r.top)/r.height)*9}deg`);
    e.currentTarget.style.setProperty('--ry',`${((e.clientX-r.left)/r.width-0.5)*13}deg`);
  }
  return <div className="monitor listening-desk">
    <div className="monitor-head"><span>Featured recording</span><span>Official excerpt</span></div>
    <div className="tape-stage" onPointerMove={tilt} onPointerLeave={e=>{e.currentTarget.style.removeProperty('--rx');e.currentTarget.style.removeProperty('--ry');}}>
      <Cassette playing={active}/>
    </div>
    <div className="transport"><button className="round-play" aria-label={active?'Stop the excerpt':'Play The Nights excerpt'} onClick={()=>active?finish():begin()}>{active?<Square size={15} fill="currentColor"/>:<Play size={18} fill="currentColor"/>}</button>
      <div className="track-info"><strong>{featured.title}</strong><small>{featured.artist}</small></div>
      <div className="desk-volume" style={{'--vol':`${level*100}%`}}>
        <button type="button" className="volume-toggle" aria-label={muted?'Unmute featured excerpt':'Mute featured excerpt'} title={muted?'Unmute':'Mute'} aria-pressed={muted} onClick={()=>setMuted(v=>!v)}>{level===0?<VolumeX size={17}/>:level<.5?<Volume1 size={17}/>:<Volume2 size={17}/>}</button>
        <input className="volume-slider" type="range" min="0" max="1" step="0.01" value={level} aria-label="Featured excerpt volume" onChange={e=>{const next=Number(e.target.value);setVolume(next);setMuted(next===0);}}/>
      </div>
    </div>
    {error&&<div className="player-status"><span role="status">{error}</span><div><a href={featured.watch} target="_blank" rel="noreferrer">Watch on YouTube <ArrowUpRight size={13}/></a></div></div>}
    <audio ref={audio} src={source} preload="metadata" onEnded={finish} onError={()=>{setOwner(null);setError('The local excerpt is unavailable. Watch the recording on YouTube.');}}/>
  </div>;
}
