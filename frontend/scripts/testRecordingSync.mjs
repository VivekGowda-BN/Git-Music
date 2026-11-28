// Independent browser storage, real Supabase client, in-memory PostgREST/Storage fixture.
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import {createServer} from 'vite';

const origin='https://sync-fixture.invalid';
process.env.VITE_SUPABASE_URL=origin;
process.env.VITE_SUPABASE_PUBLISHABLE_KEY='fixture';
process.env.VITE_AUTH_PROVIDER='supabase';
const server=await createServer({root:fileURLToPath(new URL('../',import.meta.url)),logLevel:'error',server:{host:'127.0.0.1',port:0,hmr:false}});
const rows=new Map(),objects=new Map();
let browser;
try {
  await server.listen();
  browser=await chromium.launch(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{channel:'chrome'});
  async function device(owner) {
    const page=await browser.newPage({baseURL:`http://127.0.0.1:${server.httpServer.address().port}`});
    await page.route(`${origin}/**`,async route=>{
      const req=route.request(),url=new URL(req.url());
      const ownerToken=req.headers().authorization;
      if(url.pathname.endsWith('/token')) return route.fulfill({json:{
        user:{id:owner,email:`${owner}@example.test`,user_metadata:{},app_metadata:{}},
        access_token:`token-${owner}`,refresh_token:'refresh',expires_in:3600,token_type:'bearer'
      }});
      if(url.pathname.endsWith('/settings')) return route.fulfill({json:{external:{google:false}}});
      assert.equal(ownerToken,`Bearer token-${owner}`);
      if(url.pathname==='/rest/v1/recording_projects'){
        if(req.method()==='GET'){
          assert.equal(url.searchParams.get('user_id'),`eq.${owner}`);
          return route.fulfill({json:[...rows.values()].filter(row=>row.user_id===owner)});
        }
        const body=req.postDataJSON();
        if(req.method()==='POST'){
          assert.equal(body.user_id,owner);rows.set(`${owner}/${body.id}`,body);
          return route.fulfill({status:201,json:[{id:body.id}]});
        }
        const id=url.searchParams.get('id').slice(3),row=rows.get(`${owner}/${id}`);
        assert.equal(url.searchParams.get('revision'),`eq.${row.revision}`);
        Object.assign(row,body);return route.fulfill({json:[{id}]});
      }
      const path=url.pathname.split('recording-audio/')[1];
      if(url.pathname.includes('/list/')) {
        const {prefix}=req.postDataJSON();
        return route.fulfill({json:[...objects.keys()].filter(k=>k.startsWith(prefix+'/')).map(k=>({name:k.split('/').at(-1)}))});
      }
      if(req.method()==='DELETE'){
        for(const key of req.postDataJSON().prefixes)objects.delete(key);
        return route.fulfill({json:[]});
      }
      assert.ok(path.startsWith(owner+'/'));
      if(req.method()==='POST'){
        const form=await new Response(req.postDataBuffer(),{headers:{'Content-Type':req.headers()['content-type']}}).formData();
        objects.set(path,Buffer.from(await form.get('').arrayBuffer()));
        return route.fulfill({json:{Key:path}});
      }
      return route.fulfill({body:objects.get(path),contentType:'application/octet-stream'});
    });
    await page.goto('/login');
    await page.getByLabel('Email address').fill(`${owner}@example.test`);
    await page.locator('[name=password]').fill('fixture-password');
    await page.getByRole('button',{name:'Log in',exact:true}).click();
    await page.waitForURL('**/dashboard');
    return page;
  }
  const owner='59b2464a-a9df-4045-955a-848a3cd21cc4';
  const first=await device(owner);
  await first.getByText('Recordings synced to your account.').waitFor();
  // Existing browser-only recording, including a second upload chunk and a highlight.
  await first.evaluate(async owner=>{
    const {media,loadLibrary}=await import('/src/studio/library.js');
    const bytes=new Uint8Array(4*1024*1024+2);bytes[bytes.length-1]=123;
    await media('take',{blob:new Blob([bytes],{type:'audio/webm'}),hook:new Blob(['hook'])});
    const scope=`supabase-${owner}`,library=loadLibrary(scope);
    library.projects=[{id:'project',title:'Chrome recording',is_public:false,takes:[{id:'take',name:'Mic',created:new Date().toISOString()}]}];
    localStorage.setItem(`swarhub:${scope}`,JSON.stringify(library));
  },owner);
  await first.reload();
  await first.getByText('Recordings synced to your account.').waitFor();
  assert.equal(objects.size,2);
  const second=await device(owner);
  await second.getByRole('heading',{name:'Chrome recording'}).waitFor();
  const restored=await second.evaluate(async owner=>{
    const {readTake}=await import('/src/studio/cloudMedia.js');
    const library=JSON.parse(localStorage.getItem(`swarhub:supabase-${owner}`));
    const {blob,hook}=await readTake(library.projects[0].takes[0]);
    return [blob.type,blob.size,new Uint8Array(await blob.slice(-1).arrayBuffer())[0],await hook.text()];
  },owner);
  assert.deepEqual(restored,['audio/webm',4*1024*1024+2,123,'hook']);
  const other=await device('28294d56-cced-4706-8a45-97ef911ac09c');
  await other.getByText('Recordings synced to your account.').waitFor();
  assert.equal(await other.getByRole('heading',{name:'Chrome recording'}).count(),0);
  await second.getByRole('heading',{name:'Chrome recording'}).click();
  await second.getByText('Project settings').click();
  await second.getByRole('button',{name:'Delete project'}).click();
  await second.getByRole('button',{name:'Delete permanently'}).click();
  await second.getByText('Recordings synced to your account.').waitFor();
  assert.equal(objects.size,0);
  await first.reload();
  await first.getByText('Recordings synced to your account.').waitFor();
  await first.getByRole('heading',{name:'No recordings yet'}).waitFor();
  console.log('PASS existing recording synced across isolated browsers, original and highlight restored, separate account empty, deletion propagated');
} finally {
  await browser?.close();await server.close();
}
