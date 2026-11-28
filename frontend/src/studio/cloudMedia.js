import {supabase} from '../lib/supabase';
import {media} from './library';

const chunkSize = 4 * 1024 * 1024;
const bucket = () => supabase.storage.from('recording-audio');
const cacheKey = (take) => `cloud:${take.cloud.owner}:${take.cloud.project}:${take.id}`;
const objectName = (owner, project, take, index) => `${owner}/${project}/${take}-${index}`;

// Small immutable objects allow retries and recordings above a bucket's single-file limit.
export async function uploadTake(owner, project, take, signal) {
  const record = await readTake(take);
  if (!record?.blob?.size) throw Error(`Audio missing for ${take.name}. Open the browser that recorded it.`);
  const contents = new Blob(record.hook ? [record.blob, record.hook] : [record.blob]);
  const cloud = {owner, project, size:record.blob.size, type:record.blob.type, total:contents.size};
  for (let offset = 0; offset < contents.size; offset += chunkSize) {
    signal.throwIfAborted();
    const name = objectName(owner, project, take.id, offset / chunkSize);
    const {error} = await bucket().upload(name, contents.slice(offset, offset + chunkSize), {contentType:'application/octet-stream'});
    if (error && error.statusCode !== '409' && error.status !== 409 && error.error !== 'Duplicate') throw error;
  }
  const uploaded = {...take, cloud};
  // Reuse the local original instead of doubling IndexedDB usage after every upload.
  if (!take.cloud) await media(cacheKey(uploaded), {localKey:take.id});
  return uploaded;
}

export async function readTake(take) {
  if (!take.cloud) return media(take.id);
  const {data:{session}} = await supabase.auth.getSession();
  if (!session || session.user.id !== take.cloud.owner) throw Error('Sign in to the account that owns this recording.');
  const entry = await media(cacheKey(take));
  const cached = entry?.localKey ? await media(entry.localKey) : entry;
  if (cached) return cached;
  const {owner, project, size, type, total} = take.cloud;
  if (!(size > 0 && total >= size && Number.isSafeInteger(total))) throw Error('Invalid recording size.');
  const chunks = [];
  for (let offset = 0; offset < total; offset += chunkSize) {
    const {data,error} = await bucket().download(objectName(owner, project, take.id, offset / chunkSize));
    if (error) throw error;
    chunks.push(data);
  }
  const bytes = new Blob(chunks);
  if (bytes.size !== total) throw Error('Incomplete download. Reopen the take to retry.');
  const record = {blob:bytes.slice(0,size,type),hook:size<total ? bytes.slice(size,total,'audio/wav') : null};
  await media(cacheKey(take), record).catch(()=>{}); // Playback also works if the local cache is full.
  return record;
}

export async function removeProjectAudio(owner, project, signal) {
  const prefix = `${owner}/${project}`;
  for (;;) {
    signal.throwIfAborted();
    const {data,error} = await bucket().list(prefix,{limit:100});
    if (error) throw error;
    if (!data.length) return;
    const result = await bucket().remove(data.map(file=>`${prefix}/${file.name}`));
    if (result.error) throw result.error;
  }
}
