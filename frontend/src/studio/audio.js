import {song,renderSong} from './song';
import {frequencyBand} from './spectrum';
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

export async function analyse(blob) {
  const ctx=new AudioContext();
  let buffer;
  try { buffer=await ctx.decodeAudioData(await blob.arrayBuffer()); } finally {await ctx.close();}
  const data=buffer.getChannelData(0), rate=buffer.sampleRate, stride=Math.max(1,Math.round(rate/50)), energy=[];
  for(let i=0;i<data.length;i+=stride){
    let e=0,n=0; for(let j=i;j<Math.min(i+stride,data.length);j+=8) {e+=data[j]*data[j];n++;}
    energy.push(e/n);
  }
  const peaks=Array.from({length:80},(_,i)=>{
    const from=Math.floor(i*energy.length/80), to=Math.max(from+1,Math.floor((i+1)*energy.length/80));
    let v=0; for(let j=from;j<to;j++)v=Math.max(v,energy[j]||0); return Math.sqrt(v);
  });
  const window=Math.min(energy.length,Math.round(15*rate/stride));
  let total=0,max=-1,first=0;
  energy.forEach((v,i)=>{total+=v-(i>=window?energy[i-window]:0);if(i>=window-1&&total>max){max=total;first=i-window+1;}});
  const onset=energy.slice(0,4500).map((v,i)=>Math.max(0,v-(energy[i-1]||0)));
  let best=0,bpm=null; for(let lag=16;lag<=50;lag++){let s=0;for(let i=lag;i<onset.length;i++)s+=onset[i]*onset[i-lag];if(s>best&&onset.length>150){best=s;bpm=Math.round(60*rate/stride/lag);}}
  // Sample short windows across the take, accumulating pitch-class energy.
  const chroma=Array(12).fill(0), len=1024;
  for(let p=0;p<24;p++){
    const at=Math.floor((data.length-len)*p/24); if(at<0)break;
    for(let midi=45;midi<81;midi++){
      const coeff=2*Math.cos(2*Math.PI*440*2**((midi-69)/12)/rate);let a=0,b=0;
      for(let j=0;j<len;j++){let next=data[at+j]+coeff*a-b;b=a;a=next;}
      chroma[midi%12]+=a*a+b*b-coeff*a*b;
    }
  }
  const names=['C','D♭','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
  let key='Undetermined',score=0;
  for(let i=0;i<12;i++)for(const [mode,third] of [['major',4],['minor',3]]){
    const value=chroma[i]+.8*chroma[(i+third)%12]+.65*chroma[(i+7)%12];
    if(value>score){score=value;key=`${names[i]} ${mode}`;}
  }
  // Trim quiet lead-in/out of the chosen window. A six-second phrase should
  // produce a six-second WAV, even inside a much longer recording.
  let left=first,right=first+window,peak=0;
  for(let j=left;j<right;j++)peak=Math.max(peak,energy[j]);
  if(peak>1e-8){
    while(left+1<right&&energy[left]<peak*.025)left++;
    while(right>left+1&&energy[right-1]<peak*.025)right--;
  }
  const hookStart=left*stride/rate,hookEnd=Math.min(right*stride/rate,buffer.duration,hookStart+15);
  const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i));
  return {meta:{duration:buffer.duration,bpm,key,mood:bpm?(bpm>120?'Driving':'Laid-back'):'Unclassified',...frequencyBand(data,rate),rate,channels:channels.length,hookStart,hookEnd,peaks},hook:wav(channels,rate,hookStart,hookEnd-hookStart)};
}
