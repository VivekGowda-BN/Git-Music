// Refresh the README screenshot from the real app with a temporary local
// workspace. Run: node frontend/scripts/captureReadmeScreenshot.mjs
import {rename, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import {createServer} from 'vite';

const root=fileURLToPath(new URL('../',import.meta.url));
const target=join(root,'..','docs','images','swarhub-home.png');
const temporary=`${target}.tmp.png`;
const server=await createServer({root,logLevel:'error',server:{host:'127.0.0.1',port:0,hmr:false}});
let browser;
try{
  await server.listen();
  browser=await chromium.launch(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{channel:'chrome'});
  const page=await browser.newPage({baseURL:`http://127.0.0.1:${server.httpServer.address().port}`,viewport:{width:1440,height:666},deviceScaleFactor:1});
  await page.goto('/home');
  await page.evaluate(()=>localStorage.setItem('swarhub:guest',JSON.stringify({
    projects:[],
    applications:[],
    artist:{name:'Mira Sen',bio:'',gear:'',photo:''},
    mixes:{}
  })));
  await page.reload();
  await page.getByRole('heading',{name:/Version control/}).waitFor();
  await page.locator('.listening-desk').waitFor();
  await page.locator('.listening-desk svg').first().waitFor();
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:temporary,fullPage:false});
  await rm(target,{force:true});
  await rename(temporary,target);
  console.log(`PASS wrote ${target}`);
}finally{
  await rm(temporary,{force:true}).catch(()=>{});
  await browser?.close();
  await server.close();
}
