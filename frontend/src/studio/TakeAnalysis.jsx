import {useEffect,useState} from 'react';
import {Activity,Download,Scissors} from 'lucide-react';
import {analyse,clock} from './audio';
import {media} from './library';
import {audioSource} from './playback';

const hz=v=>Number(v)>0?`${Number(v)>=1000?`${(Number(v)/1000).toFixed(1)} kHz`:`${Math.round(Number(v))} Hz`}`:'—';
export function AnalysisPanel({meta,clip,status='',name='take',onPreview}){
  const bpm=meta?.bpm,tempo=!bpm?'—':bpm<76?'Slow':bpm<110?'Moderate':bpm<145?'Brisk':'Fast';
  return <article className="panel analysis"><div className="panel-head"><Activity/>Audio analysis</div><div className="inset">
    <p role="status">{status||(meta?'Acoustic estimates from this take.':'Record or upload a take to see its acoustic fingerprint.')}</p>
    <div className="readouts">{[['BPM',bpm||'—'],['Key',meta?.key||'—'],['Mood',meta?.mood||'—'],['Tempo',tempo],['Low frequency',hz(meta?.freq_min)],['High frequency',hz(meta?.freq_max)]].map(([k,v])=><div key={k}><small className="micro">{k}</small><strong>{v}</strong></div>)}</div>
    <h3><Scissors size={17}/> Hook preview</h3>{clip?<><p>Excerpt from {clock(meta.hookStart)} to {clock(meta.hookEnd??Math.min(meta.duration,meta.hookStart+15))} in the original take.</p><audio key={clip} onPlay={onPreview} controls src={clip} aria-label="Play hook excerpt only"/><a className="plain" href={clip} download={`${name}-hook.wav`}><Download size={16}/> Export hook as WAV</a></>:<p>{meta?'A playable source is needed for the hook preview.':'Your strongest passage, up to 15 seconds, will appear here.'}</p>}
  </div></article>;
}
export function SavedAnalysis({take,onPreview}){
  const [result,setResult]=useState(null),[status,setStatus]=useState('Reading this take…');
  useEffect(()=>{
    let active=true,url,source;
    (async()=>{
      try{
        const record=!take.part&&!take.file_url?await media(take.id):null;
        let meta=take,hook=record?.hook;
        if(!hook||!('freq_max' in take)){
          let blob=record?.blob;
          if(!blob){source=await audioSource(take);const res=await fetch(source.url);if(!res.ok)throw Error();blob=await res.blob();}
          if(!active)return;
          const measured=await analyse(blob);meta={...measured.meta,...Object.fromEntries(Object.entries(take).filter(([,v])=>v!=null)),hookStart:measured.meta.hookStart,hookEnd:measured.meta.hookEnd};hook=measured.hook;
        }
        if(!active)return;
        url=URL.createObjectURL(hook);setResult({meta,clip:url});setStatus('');
      }catch{if(active)setStatus('Showing saved measurements. The audio file is unavailable for preview.');}
      finally{if(source?.temporary)URL.revokeObjectURL(source.url);}
    })();
    return()=>{active=false;if(url)URL.revokeObjectURL(url);};
  },[take]);
  return <AnalysisPanel meta={result?.meta||take} clip={result?.clip} status={status} name={take.name} onPreview={onPreview}/>;
}
