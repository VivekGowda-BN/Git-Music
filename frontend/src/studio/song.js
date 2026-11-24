// Traditional English folk melody, arranged here for picked strings, bass and a flute-like lead.
export const song = { title: 'Scarborough Fair', bpm: 90, key: 'D Dorian', rate: 22050 };
const score = [
  [62,2],[62,1],[69,2],[69,1],[64,1.5],[65,.5],[64,1],[62,2],[60,1],[62,3],
  [69,2],[72,1],[74,2],[72,1],[69,1],[71,1],[67,1],[69,3],
  [74,1],[74,1],[74,1],[72,2],[69,1],[69,1],[67,1],[65,1],[64,3],
  [62,2],[69,1],[67,2],[65,1],[64,1],[62,1],[60,1],[62,3]
];
const beat = 60/song.bpm;
export const songDuration = score.reduce((n,[,beats])=>n+beats,0)*beat+1;
const frequency = note=>440*2**((note-69)/12);
const tau=2*Math.PI;

export function renderSong(part){
  if(part==='tide'||part==='afterhours'){
    const tide=part==='tide',rate=song.rate,step=60/(tide?84:104)/2;
    const notes=tide?[55,62,66,69,59,62,66,71]:[57,64,67,72,60,67,69,64];
    const out=new Float32Array(Math.ceil(step*32*rate));
    for(let i=0;i<out.length;i++){
      const time=i/rate,idx=Math.floor(time/step),local=time%step,phase=tau*frequency(notes[idx%8])*local;
      out[i]=(.34*Math.sin(phase)+.09*Math.sin(phase*2))*Math.exp(-local*(tide?5:8))*Math.min(1,local*140,(step-local)*110);
    }
    return out;
  }
  const out=new Float32Array(Math.ceil(songDuration*song.rate));
  function voice(note,start,beats,volume,mode){
    const duration=beats*beat, offset=Math.round(start*beat*song.rate), f=frequency(note);
    for(let i=0;i<duration*song.rate&&offset+i<out.length;i++){
      const t=i/song.rate, p=tau*f*t;
      const env=Math.min(1,t/(mode==='lead'?.07:.012))*Math.min(1,(duration-t)/.1);
      const tone=mode==='lead'?(Math.sin(p+.04*Math.sin(32*t))+.16*Math.sin(2*p))*(.88+.12*Math.sin(28*t)):
        (Math.sin(p)+.43*Math.sin(2*p)*Math.exp(-6*t)+.24*Math.sin(3*p+.2))*Math.exp(-(mode==='bass'?1.8:3.4)*t);
      out[offset+i]+=env*tone*volume;
    }
  }
  let time=0;
  for(const [note,length] of score){if(part==='mix'||part==='melody')voice(note,time,length,.24,'lead');time+=length;}
  const chords=[[50,57,65],[48,55,64],[53,57,65],[55,62,67],[50,57,65],[45,52,64]];
  for(let t=0;t<time;t+=3){
    const chord=chords[(t/3)%chords.length];
    if(part==='mix'||part==='keys')voice(chord[0]-12,t,2.8,.21,'bass');
    if(part==='mix'||part==='guitar')for(let j=0;j<6;j++)voice(chord[[0,1,2,1,2,1][j]],t+j*.5,1.55,.19,'pluck');
  }
  const delay=Math.floor(song.rate*.136);
  for(let i=delay;i<out.length;i++)out[i]+=.115*out[i-delay];
  return out;
}
