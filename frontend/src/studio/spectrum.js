// Hann-windowed FFT. Report the band containing the central 90% of measured power.
export function frequencyBand(samples, rate) {
  const n=2048, frames=Math.min(32,Math.floor(samples.length/n));
  if(!frames)return {};
  const power=new Float64Array(n/2), re=new Float64Array(n), im=new Float64Array(n);
  const window=new Float64Array(n), reverse=new Uint16Array(n);
  const cosine=new Float64Array(n/2), sine=new Float64Array(n/2);
  for(let i=0;i<n;i++){
    window[i]=.5-.5*Math.cos(2*Math.PI*i/(n-1));
    reverse[i]=(reverse[i>>1]>>1)|((i&1)*n/2);
    if(i<n/2){cosine[i]=Math.cos(-2*Math.PI*i/n);sine[i]=Math.sin(-2*Math.PI*i/n);}
  }
  for(let frame=0;frame<frames;frame++){
    const from=Math.floor((samples.length-n)*frame/Math.max(1,frames-1));
    for(let i=0;i<n;i++){
      const j=reverse[i];re[j]=samples[from+i]*window[i];im[j]=0;
    }
    for(let width=2;width<=n;width*=2){
      for(let i=0;i<n;i+=width)for(let k=0;k<width/2;k++){
        const a=i+k,b=a+width/2,twiddle=k*(n/width),co=cosine[twiddle],si=sine[twiddle];
        const x=co*re[b]-si*im[b],y=si*re[b]+co*im[b];
        re[b]=re[a]-x;im[b]=im[a]-y;re[a]+=x;im[a]+=y;
      }
    }
    for(let i=1;i<power.length;i++)power[i]+=re[i]**2+im[i]**2;
  }
  const total=power.reduce((a,b)=>a+b,0);if(total<1e-8)return {};
  let sum=0,low,high;
  for(let i=1;i<power.length;i++){sum+=power[i];if(low==null&&sum>=total*.05)low=i;if(sum>=total*.95){high=i;break;}}
  return {freq_min:Math.round(low*rate/n),freq_max:Math.round(high*rate/n)};
}
