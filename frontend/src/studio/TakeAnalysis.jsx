import {useEffect,useState} from 'react';
import {Activity,Download,Scissors} from 'lucide-react';
import {analyse,analysisVersion,clock} from './audio';
import {readTake} from './cloudMedia';
import {audioSource} from './playback';

const hz=v=>v>=1000?`${(v/1000).toFixed(1)} kHz`:`${Math.round(v)} Hz`;
const time=v=>`${clock(Math.floor(Math.round(v*10)/10))}.${Math.round(v*10)%10}`;
const level=(v,unit)=>Number.isFinite(v)?`${v.toFixed(1)} ${unit}`:'—';
export function AnalysisPanel({meta,clip,status='',name='take',onPreview}){
  const balance=meta?.bandBalance;
  const readings=[
    ['Tempo',meta?.bpm?`${meta.bpm} BPM`:meta?'Unclear':'—'],
    ['Musical key',meta?.key
      ? `${meta.key}${Number.isFinite(meta.keyConfidence)&&meta.keyConfidence<.40?' (est.)':''}`
      : meta?'Unclear':'—'],
    ['Frequency span',meta?.freq_min&&meta?.freq_max?`${hz(meta.freq_min)} – ${hz(meta.freq_max)}`:'—'],
    ['Dynamics',level(meta?.dynamicRangeDb,'dB')],
    ['Average level',level(meta?.rmsDbfs,'dBFS')],
    ['Peak level',level(meta?.peakDbfs,'dBFS')],
  ];
  const bounds=clip&&Number.isFinite(meta?.hookStart)&&Number.isFinite(meta?.hookEnd);
  return <article className="panel analysis"><div className="panel-head"><Activity/>Audio analysis</div><div className="inset">
    <p role="status">{status||(meta?`Analysed on this device · ${clock(meta.duration||0)} · ${meta.channels===1?'Mono':meta.channels===2?'Stereo':`${meta.channels||1} ch`}`:'Record or upload audio to see its musical and mix profile.')}</p>
    <div className="readouts">{readings.map(([k,v])=><div key={k}><small className="micro">{k}</small><strong>{v}</strong></div>)}</div>
    {meta?.tags&&<details className="track-tags"><summary>Embedded track details</summary>
      <p>{[meta.tags.artist,meta.tags.title].filter(Boolean).join(' · ')}</p>
      <p>{[meta.tags.bpm&&`Tagged tempo: ${meta.tags.bpm} BPM`,meta.tags.key&&`Tagged key: ${meta.tags.key}`].filter(Boolean).join(' · ')}</p>
      <small>Read from the file. The estimates above are measured independently.</small></details>}
    <section className="mix-balance"><h3>Frequency balance</h3>{balance?<><div className="band-meter" aria-hidden="true">{['low','mid','high'].map(k=><i key={k} style={{flexGrow:balance[k]}}/>)}</div>
      <div className="band-legend">{['low','mid','high'].map(k=><span key={k}>{k} <b>{Math.round(balance[k])}%</b></span>)}</div></>:<p>{meta?'Not enough measurable spectral energy.':'Low, mid and high energy shares will appear here.'}</p>}</section>
    <section className="hook-preview"><h3><Scissors size={17}/> Suggested highlight</h3>{bounds?<><strong className="clip-range">{time(meta.hookStart)} – {time(meta.hookEnd)}</strong><p>{meta.highlightReason||'Representative passage from this recording.'}</p>
      <audio key={clip} onPlay={onPreview} controls src={clip} aria-label="Play suggested highlight"/><a className="plain" href={clip} download={`${name}-hook.wav`}><Download size={16}/> Export highlight as WAV</a></>:<p>{meta?.hasHook===false?'No audible passage to preview.':meta?'A playable take is needed for a preview.':'A suggested passage of up to 15 seconds will appear here.'}</p>}</section>
  </div></article>;
}
export function SavedAnalysis({take,onPreview}){
  const [result,setResult]=useState(null),[status,setStatus]=useState('Reading this take…');
  useEffect(()=>{
    const controller=new AbortController();let active=true,url,source;
    (async()=>{
      try{
        const record=!take.part&&!take.file_url?await readTake(take):null;
        let meta=take,hook=record?.hook;
        if(take.analysisVersion!==analysisVersion||(!hook&&take.hasHook!==false)){
          let blob=record?.blob;
          if(!blob){source=await audioSource(take);const res=await fetch(source.url,{signal:controller.signal});if(!res.ok)throw Error();blob=await res.blob();}
          if(!active)return;
          const measured=await analyse(blob,{signal:controller.signal});meta={...take,...measured.meta};hook=measured.hook;
        }
        if(!active)return;
        url=hook?URL.createObjectURL(hook):null;setResult({meta,clip:url});setStatus('');
      }catch{if(active)setStatus('Showing saved measurements. The audio file is unavailable for preview.');}
      finally{if(source?.temporary)URL.revokeObjectURL(source.url);}
    })();
    return()=>{active=false;controller.abort();if(url)URL.revokeObjectURL(url);};
  },[take]);
  return <AnalysisPanel meta={result?.meta||take} clip={result?.clip} status={status} name={take.name} onPreview={onPreview}/>;
}
