import {supabase} from '../lib/supabase';
import {uploadTake, removeProjectAudio} from './cloudMedia';

// Keep intentional deletes until both the database and the bucket acknowledge them.
export function trackProjectDeletes(previous, next) {
  if (previous.projects === next.projects) return next;
  const remaining = new Set(next.projects.map(p=>p.id));
  const deleted = previous.projects.filter(p=>!remaining.has(p.id)).map(p=>p.id);
  return deleted.length ? {...next, pendingDeletes:[...new Set([...(next.pendingDeletes||[]), ...deleted])]} : next;
}

async function readRows(owner, signal) {
  const rows = new Map();
  let after;
  for (;;) {
    let query = supabase.from('recording_projects').select('id,revision,payload')
      .eq('user_id',owner).order('id').limit(100);
    if (after) query = query.gt('id',after);
    const {data,error} = await query.abortSignal(signal);
    if (error) throw error;
    for (const row of data) rows.set(row.id,row);
    if (data.length < 100) return rows;
    after = data.at(-1).id;
  }
}

async function publish(owner, id, row, payload, signal) {
  const table = supabase.from('recording_projects');
  const revision = (row?.revision || 0) + 1;
  // Compare-and-swap: never overwrite branches appended by another browser.
  const query = row
    ? table.update({payload,revision}).eq('user_id',owner).eq('id',id).eq('revision',row.revision)
    : table.insert({user_id:owner,id,payload,revision});
  const {data,error} = await query.select('id').abortSignal(signal);
  if (error?.code === '23505' || (!error && !data?.length)) throw Error('Workspace changed on another device. Retry sync.');
  if (error) throw error;
}

async function mergeProject(owner, local, mix, row, signal) {
  const saved = row?.payload;
  const takes = new Map(saved?.takes.map(t=>[t.id,t]));
  for (const take of local.takes) {
    if (takes.has(take.id)) continue;
    const uploaded = take.part || take.file_url ? take : await uploadTake(owner, local.id, take, signal);
    takes.set(take.id,uploaded);
  }
  // Visibility is the only editable project attribute. Pull it unless edited locally.
  const edited = local.syncedVisibility !== undefined && local.syncedVisibility !== local.is_public;
  const visible = edited || !saved ? !!local.is_public : saved.is_public;
  return {
    title:saved?.title ?? local.title,
    is_public:visible,
    takes:[...takes.values()],
    mix:mix && (!saved?.mix || mix.at > saved.mix.at) ? mix : saved?.mix ?? null,
  };
}

export async function syncRecordings(owner, library, signal) {
  const rows = await readRows(owner,signal);
  const deletions = new Set(library.pendingDeletes);
  const mixes = {...library.mixes};
  const projects = [];
  const errors = [];
  const localById = new Map(library.projects.map(p=>[p.id,p]));
  // Publish forks before removing their source audio.
  const ids = new Set([...localById.keys(),...rows.keys(),...deletions]);
  for (const id of deletions) { ids.delete(id); ids.add(id); }
  for (const id of ids) {
    signal.throwIfAborted();
    const row = rows.get(id), local = localById.get(id);
    try {
      if (deletions.has(id)) {
        if (row?.payload !== null) await publish(owner,id,row,null,signal);
        await removeProjectAudio(owner,id,signal);
        deletions.delete(id);
        delete mixes[id];
        continue;
      }
      if (row?.payload === null) {
        // Another device deleted the project while this one recorded offline.
        // Keep new, unpublished audio without restoring the deleted project.
        const fresh = local?.syncedVisibility !== undefined
          ? local.takes.filter(t=>!t.cloud && !t.part && !t.file_url) : [];
        if (fresh.length) {
          const recoveredId = `recovered-${fresh[0].id}`;
          const keptIds = new Set(fresh.map(t=>t.id));
          localById.set(recoveredId,{id:recoveredId,title:`${local.title} (recovered)`,is_public:false,
            takes:fresh.map(t=>({...t,parent:keptIds.has(t.parent)?t.parent:null}))});
          ids.add(recoveredId);
        }
        delete mixes[id]; continue;
      }
      const payload = local ? await mergeProject(owner,local,mixes[id],row,signal) : row.payload;
      // Postgres jsonb does not retain property order. Compare editable fields and
      // the number of immutable takes rather than serializing the whole project.
      if (!row || row.payload.takes.length !== payload.takes.length ||
          row.payload.is_public !== payload.is_public || row.payload.mix?.at !== payload.mix?.at) {
        await publish(owner,id,row,payload,signal);
      }
      const {mix,...project} = payload;
      projects.push({...project,id,syncedVisibility:project.is_public});
      if (mix) mixes[id]=mix;
    } catch (error) {
      signal.throwIfAborted();
      if (local) projects.push(local);
      errors.push(error.message || 'Recording sync failed.');
    }
  }
  return {library:{...library,projects,mixes,pendingDeletes:[...deletions]},error:errors[0]};
}
