// Hann-windowed FFT. Report the band containing the central 90% of measured power.
export function frequencyBand(samples, rate) {
  const n=2048, frames=Math.min(32,Math.floor(samples.length/n));
  if(!frames)return {};
  const power=new Float64Array(n/2), re=new Float64Array(n), im=new Float64Array(n);
  for(let frame=0;frame<frames;frame++){
    const from=Math.floor((samples.length-n)*frame/Math.max(1,frames-1));
    for(let i=0,j=0;i<n;i++){
      re[j]=samples[from+i]*(.5-.5*Math.cos(2*Math.PI*i/(n-1)));im[j]=0;
      let bit=n>>1;while(bit&&(j&bit)){j^=bit;bit>>=1;}j^=bit;
    }
    for(let width=2;width<=n;width*=2){
      for(let i=0;i<n;i+=width)for(let k=0;k<width/2;k++){
        const a=i+k,b=a+width/2,angle=-2*Math.PI*k/width,co=Math.cos(angle),si=Math.sin(angle);
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
