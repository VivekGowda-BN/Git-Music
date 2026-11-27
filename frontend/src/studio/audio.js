import {song,renderSong} from './song';
export const clock = seconds => `${Math.floor(seconds/60).toString().padStart(2,'0')}:${Math.floor(seconds%60).toString().padStart(2,'0')}`;

export function wav(channels, rate, start=0, duration=channels[0].length/rate) {
  const first = Math.floor(start*rate), frames = Math.min(channels[0].length-first, Math.ceil(duration*rate));
  const count = channels.length, bytes = frames*count*2, buffer = new ArrayBuffer(44+bytes), view = new DataView(buffer);
  const tag = (pos, text) => [...text].forEach((c,i)=>view.setUint8(pos+i,c.charCodeAt(0)));
  tag(0,'RIFF'); view.setUint32(4,36+bytes,true); tag(8,'WAVE'); tag(12,'fmt '); view.setUint32(16,16,true);
  view.setUint16(20,1,true); view.setUint16(22,count,true); view.setUint32(24,rate,true); view.setUint32(28,rate*count*2,true);
  view.setUint16(32,count*2,true); view.setUint16(34,16,true); tag(36,'data'); view.setUint32(40,bytes,true);
  let p=44;
  for(let i=0;i<frames;i++) for(const ch of channels) {view.setInt16(p,Math.max(-1,Math.min(1,ch[first+i]))*32767,true); p+=2;}
  return new Blob([buffer],{type:'audio/wav'});
}

const samples = new Map();
export function demoAudio(part='mix') {
  if(samples.has(part)) return samples.get(part);
  const url=URL.createObjectURL(wav([renderSong(part)],song.rate));samples.set(part,url);return url;
}

export const analysisVersion=4;

// Analyse a mono fold-down; retain the original channels for listening/export.
// Opposite-polarity stereo can disappear in mono, so use the strongest channel
// if the fold-down is more than 20 dB below it.
function analysisMix(channels){
  const mono=channels[0].slice();
  if(channels.length===1)return mono;
  for(let c=1;c<channels.length;c++){
    const ch=channels[c];
    for(let i=0;i<mono.length;i++)mono[i]+=ch[i];
  }
  for(let i=0;i<mono.length;i++)mono[i]/=channels.length;
  let strongest=0,channel=0,combined=0;
  const step=Math.max(1,Math.floor(mono.length/16384));
  for(let c=0;c<channels.length;c++){
    let sum=0;
    for(let i=0;i<mono.length;i+=step){sum+=channels[c][i]**2;if(!c)combined+=mono[i]**2;}
    if(sum>strongest){strongest=sum;channel=c;}
  }
  if(combined<strongest*.01)mono.set(channels[channel]);
  return mono;
}

function measure(mono,rate,signal){
  return new Promise((resolve,reject)=>{
    signal?.throwIfAborted();
    const worker=new Worker(new URL('./analysis.worker.js',import.meta.url),{type:'module'});
    function finish(){worker.terminate();signal?.removeEventListener('abort',abort);}
    function abort(){finish();reject(signal.reason);}
    signal?.addEventListener('abort',abort,{once:true});
    worker.onmessage=({data})=>{finish();if(data.error)reject(Error(data.error));else resolve(data.result);};
    worker.onerror=()=>{finish();reject(Error('Audio analysis could not finish. Try a shorter recording.'));};
    worker.postMessage({mono,rate},[mono.buffer]);
  });
}

export async function analyse(blob,{signal}={}){
  if(!blob.size)throw Error('The recording is empty. Try recording again.');
  if(blob.size>80*1024*1024)throw Error('Choose an audio file no larger than 80 MB.');
  // Offline decoding also works when loading a saved take without a user gesture.
  const ctx=new OfflineAudioContext(1,1,44100);
  const bytes=await blob.arrayBuffer();signal?.throwIfAborted();
  const tagLookup=blob instanceof File
    ?import('./trackTags.ts').then(({readTrackTags})=>readTrackTags(blob)).catch(()=>null):null;
  const buffer=await ctx.decodeAudioData(bytes);signal?.throwIfAborted();
  const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i));
  const rate=buffer.sampleRate,result=await measure(analysisMix(channels),rate,signal);
  const hasHook=Number.isFinite(result.peakDbfs)&&result.hookEnd>result.hookStart;
  const tags=await tagLookup;signal?.throwIfAborted();
  return {meta:{...result,tags,analysisVersion,duration:buffer.duration,rate,channels:channels.length,hasHook},
    hook:hasHook?wav(channels,rate,result.hookStart,result.hookEnd-result.hookStart):null};
}
