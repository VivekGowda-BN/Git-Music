import {useEffect,useRef} from 'react';

const low=[124,224,201],mid=[255,192,119],high=[255,104,84];
const blend=(a,b,t)=>`rgb(${a.map((v,i)=>Math.round(v+(b[i]-v)*t)).join(',')})`;
function tone(level){
  if(level<.55)return blend(low,mid,level/.55);
  return blend(mid,high,(level-.55)/.45);
}
export default function FrequencyRing({stream}){
  const canvas=useRef(null);
  useEffect(()=>{
    const c=canvas.current,ctx=c.getContext('2d');
    if(!ctx)return;
    let frame=0,audio,analyser,source,bins;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(stream){
      try{
        audio=new AudioContext();analyser=audio.createAnalyser();analyser.fftSize=2048;analyser.smoothingTimeConstant=.78;
        source=audio.createMediaStreamSource(stream);source.connect(analyser);
        bins=new Uint8Array(analyser.frequencyBinCount);audio.resume().catch(()=>{});
      }catch{analyser=null;}
    }
    let last=-Infinity;
    function draw(now){
      if(!reduced)frame=requestAnimationFrame(draw);
      if(now-last<(reduced?200:30))return;
      last=now;
      ctx.clearRect(0,0,400,400);ctx.lineCap='round';
      if(analyser)analyser.getByteFrequencyData(bins);
      const count=120;
      for(let i=0;i<count;i++){
        const angle=(i/count)*Math.PI*2-Math.PI/2;
        let level=.16+.1*Math.sin(now/940+i*.31)+.06*Math.sin(now/610+i*.13);
        if(bins){
          const lo=Math.round(2*(bins.length/2)**(i/count)),hi=Math.min(bins.length,Math.round(2*(bins.length/2)**((i+1)/count)));
          let peak=0;
          for(let j=lo;j<Math.max(lo+1,hi);j++)peak=Math.max(peak,(bins[j]||0)/255);
          level=.1+Math.min(1,peak*1.5);
        }
        level=Math.max(.035,Math.min(1,level));
        const inner=129,outer=inner+4+63*level,x=Math.cos(angle),y=Math.sin(angle);
        ctx.strokeStyle=tone(level);ctx.lineWidth=level>.7?3.6:2.5;
        ctx.beginPath();ctx.moveTo(200+inner*x,200+inner*y);ctx.lineTo(200+outer*x,200+outer*y);ctx.stroke();
      }
    }
    draw(0);
    return()=>{cancelAnimationFrame(frame);source?.disconnect();analyser?.disconnect();if(audio&&audio.state!=='closed')audio.close().catch(()=>{});};
  },[stream]);
  return <canvas ref={canvas} className="frequency-ring" width="400" height="400" aria-hidden="true"/>;
}
