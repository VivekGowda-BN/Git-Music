import {parseBlob} from 'music-metadata';

type TrackTags = {title?:string; artist?:string; bpm?:number; key?:string};

// A file's tags are optional reference information, never estimator inputs.
// Keep the small display fields, not artwork, lyrics or the raw metadata.
export async function readTrackTags(blob:Blob):Promise<TrackTags|null>{
  const {common}=await parseBlob(blob,{skipCovers:true,skipPostHeaders:true});
  const text=(value:unknown,max:number)=>typeof value==='string'?value.trim().slice(0,max)||undefined:undefined;
  const tags:TrackTags={title:text(common.title,160),artist:text(common.artist,120),
    bpm:common.bpm&&Number.isFinite(common.bpm)&&common.bpm>0?common.bpm:undefined,key:text(common.key,32)};
  return Object.values(tags).some(v=>v!==undefined)?tags:null;
}
