// Safe smoke test against the configured Supabase project.
// It checks the real UI wiring and one deliberately wrong password; it never
// creates a user, sends an email, or reads account data.
// Run: node frontend/scripts/testSupabaseLive.mjs
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import {createServer} from 'vite';

const server=await createServer({root:fileURLToPath(new URL('../',import.meta.url)),logLevel:'error',server:{host:'127.0.0.1',port:0,hmr:false}});
let browser;
try{
  await server.listen();
  const baseURL=`http://127.0.0.1:${server.httpServer.address().port}`;
  browser=await chromium.launch(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{channel:'chrome'});
  const page=await browser.newPage({baseURL});
  page.setDefaultTimeout(20000);
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));

  await page.goto('/signup');
  await page.getByRole('heading',{name:'Create account'}).waitFor();
  assert.equal(await page.getByText('Account access is not configured on this site yet.').count(),0,'frontend/.env is not being loaded');
  assert.ok(await page.getByRole('button',{name:'Create account'}).isEnabled(),'Signup is disabled');
  assert.equal(await page.getByLabel('Artist name').count(),1);
  assert.equal(await page.getByLabel('Email address').count(),1);
  assert.equal(await page.locator('[name=password]').count(),1);
  assert.equal(await page.getByRole('button',{name:'Continue with Google'}).count(),0,'Google sign-in should not be offered');
  console.log('Signup form is live with email-only auth');

  await page.goto('/login');
  assert.equal(await page.getByRole('link',{name:'Forgot password?'}).count(),1,'Password reset link is missing');
  await page.getByLabel('Email address').fill('nobody@example.invalid');
  await page.locator('[name=password]').fill('definitely-wrong-password');
  await page.getByRole('button',{name:'Log in',exact:true}).click();
  await page.getByRole('alert').filter({hasText:'Invalid login credentials'}).waitFor();
  assert.deepEqual(errors,[]);
  console.log('PASS live Supabase project: form configured and auth endpoint answered');
}finally{
  await browser?.close();
  await server.close();
}
