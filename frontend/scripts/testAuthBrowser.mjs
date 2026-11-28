// Exercise the real Supabase client and router without a hosted account or email.
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import {createServer} from 'vite';

const authOrigin='https://auth-fixture.invalid';
process.env.VITE_SUPABASE_URL=authOrigin;
process.env.VITE_SUPABASE_PUBLISHABLE_KEY='test-publishable-key';
process.env.VITE_AUTH_PROVIDER='supabase';
const server=await createServer({root:fileURLToPath(new URL('../',import.meta.url)),logLevel:'error',server:{host:'127.0.0.1',port:0,hmr:false}});
let browser;
try{
  await server.listen();
  const base=`http://127.0.0.1:${server.httpServer.address().port}`;
  browser=await chromium.launch(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{channel:'chrome'});
  const page=await browser.newPage({baseURL:base});
  page.setDefaultTimeout(12000);
  const email='artist@example.test',password='example-passphrase',newPassword='replacement-passphrase';
  const user={id:'18e3af94-a713-4ecd-8cc1-7e509807ca44',email,app_metadata:{},user_metadata:{artist_name:'Session Artist'}};
  const session={user,access_token:'fixture-access',refresh_token:'fixture-refresh',token_type:'bearer',expires_in:3600};
  const grants=[];
  await page.route(`${authOrigin}/auth/v1/**`,async route=>{
    const req=route.request(),url=new URL(req.url()),body=req.postDataJSON();
    if(url.pathname.endsWith('/signup')){
      assert.equal(body.data.artist_name,'Session Artist');
      assert.equal(body.email,email);
      assert.equal(url.searchParams.get('redirect_to'),`${base}/auth/callback`);
      return route.fulfill({json:user});
    }
    if(url.pathname.endsWith('/recover')){
      assert.equal(body.email,email);
      assert.equal(url.searchParams.get('redirect_to'),`${base}/reset-password`);
      return route.fulfill({json:{}});
    }
    if(url.pathname.endsWith('/token')){
      const grant=url.searchParams.get('grant_type');
      grants.push(grant);
      if(grant==='pkce'){
        assert.ok(['fixture-code','recovery-code'].includes(body.auth_code));
        assert.ok(body.code_verifier);
      }else if(body.password!==password){
        return route.fulfill({status:400,json:{message:'Invalid login credentials'}});
      }
      return route.fulfill({json:session});
    }
    if(url.pathname.endsWith('/user')&&req.method()==='PUT'){
      assert.equal(body.password,newPassword);
      return route.fulfill({json:user});
    }
    if(url.pathname.endsWith('/resend')){
      assert.equal(body.email,email);
      return route.fulfill({json:{}});
    }
    if(url.pathname.endsWith('/logout'))return route.fulfill({status:204});
    throw Error(`Unexpected auth request: ${url.pathname}`);
  });

  await page.goto('/');
  await page.evaluate(()=>localStorage.setItem('swarhub:guest',JSON.stringify({
    projects:[{id:'guest-idea',title:'Guest Idea',is_public:false,takes:[{id:'guest-take',name:'First idea',created:new Date().toISOString()}]}],
    applications:[],artist:{name:'',bio:'',gear:''},mixes:{}
  })));
  await page.getByRole('link',{name:'Sign up',exact:true}).click();
  await page.getByLabel('Artist name').fill('Session Artist');
  await page.getByLabel('Email address').fill(email);
  await page.locator('[name=password]').fill(password);
  await page.getByRole('button',{name:'Create account'}).click();
  await page.getByRole('heading',{name:'Check your email'}).waitFor();
  await page.getByRole('button',{name:'Resend confirmation email'}).click();
  await page.getByText('A new confirmation email is on its way.').waitFor();

  await page.goto('/auth/callback?code=fixture-code');
  await page.waitForURL('**/dashboard');
  await page.getByText('Your guest recordings were added to this account.').waitFor();
  await page.getByRole('heading',{name:'Guest Idea'}).waitFor();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(`swarhub:supabase-${'18e3af94-a713-4ecd-8cc1-7e509807ca44'}`)).projects[0].title),'Guest Idea');
  await page.reload();
  await page.getByRole('link',{name:'Open Session Artist profile'}).waitFor();
  await page.getByRole('button',{name:'Sign out'}).click();
  await page.getByRole('link',{name:'Log in',exact:true}).click();
  await page.getByLabel('Email address').fill(email);
  await page.locator('[name=password]').fill('incorrect');
  await page.getByRole('button',{name:'Log in',exact:true}).click();
  await page.getByRole('alert').waitFor();
  await page.locator('[name=password]').fill(password);
  await page.getByRole('button',{name:'Log in',exact:true}).click();
  await page.waitForURL('**/dashboard');
  await page.getByRole('button',{name:'Sign out'}).click();
  await page.getByRole('link',{name:'Log in',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Continue with Google'}).count(),0,'Google sign-in should not be offered');

  await page.getByRole('link',{name:'Forgot password?'}).click();
  await page.getByRole('heading',{name:'Reset password'}).waitFor();
  await page.getByLabel('Email address').fill(email);
  await page.getByRole('button',{name:'Send reset link'}).click();
  await page.getByText(/If an account exists/).waitFor();

  await page.goto('/reset-password?code=recovery-code');
  await page.getByLabel('New password',{exact:true}).waitFor();
  await page.getByLabel('New password',{exact:true}).fill(newPassword);
  await page.getByLabel('Confirm new password',{exact:true}).fill(newPassword);
  await page.getByRole('button',{name:'Update password'}).click();
  await page.getByText('Your password was updated.').waitFor();

  assert.deepEqual(grants,['pkce','password','password','pkce']);
  console.log('PASS signup, confirmation, reload, logout, password login, email-only auth page, and password reset');
}finally{
  await browser?.close();
  await server.close();
}
