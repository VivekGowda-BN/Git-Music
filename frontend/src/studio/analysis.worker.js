import {estimateMusic} from './musicFeatures.js';
import {profileSignal} from './signalProfile.js';
import {frequencyBand} from './spectrum.js';

self.onmessage=({data:{mono,rate}})=>{
  try {
    const profile=profileSignal(mono,rate);
    const music=estimateMusic(mono,rate);
    const peaks=Array.from({length:80},(_,i)=>{
      let peak=0;
      const end=Math.floor((i+1)*mono.length/80);
      for(let j=Math.floor(i*mono.length/80);j<end;j++)peak=Math.max(peak,Math.abs(mono[j]));
      return peak;
    });
    const {start:hookStart,end:hookEnd,...levels}=profile;
    self.postMessage({result:{...music,...levels,...frequencyBand(mono,rate),hookStart,hookEnd,peaks}});
  }catch(error){self.postMessage({error:error.message||'Unable to analyse this recording.'});}
};
