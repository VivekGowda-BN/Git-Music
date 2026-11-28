import {API_URL} from '../lib/api';
import {demoAudio} from './audio';
import {readTake} from './cloudMedia';

export async function audioSource(take){
  if(take.part)return {url:demoAudio(take.part)};
  if(take.file_url){
    const url=new URL(take.file_url,API_URL);
    if(url.origin===new URL(API_URL).origin)return {url:url.href};
  }
  const record=await readTake(take);
  if(!record)throw Error('This take has no playable audio in this browser.');
  return {url:URL.createObjectURL(record.blob),temporary:true};
}
