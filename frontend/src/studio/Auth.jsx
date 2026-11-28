import {useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight,Eye,EyeOff} from 'lucide-react';
import axios from 'axios';
import {API_URL,setAuthSession} from '../lib/api';
import {callbackUrl,legacyAuth,supabase} from '../lib/supabase';

const recoveryPage=import.meta.env.VITE_ACCOUNT_RECOVERY_URL;

export default function Auth({signup,callbackFailed}){
  const [busy,setBusy]=useState(false),[show,setShow]=useState(false),[sentTo,setSentTo]=useState(''),[notice,setNotice]=useState('');
  const [error,setError]=useState(callbackFailed?'Sign-in was not completed. Try logging in again, or open the confirmation link in the browser where you signed up.':'');
  const configured=!!supabase||legacyAuth;

  async function submit(event){
    event.preventDefault();
    const fields=new FormData(event.currentTarget);
    const email=fields.get('email').trim(),password=fields.get('password');
    const username=signup?fields.get('username').trim():'';
    if(signup&&!username){setError('Enter an artist name.');return;}
    setError('');setBusy(true);
    try{
      if(legacyAuth){
        if(signup)await axios.post(`${API_URL}/signup`,{email,password,username});
        const {data}=await axios.post(`${API_URL}/login`,{email,password});
        setAuthSession(data.access_token,data.user_id);
      }else if(signup){
        const {data,error}=await supabase.auth.signUp({
          email,password,options:{emailRedirectTo:callbackUrl(),data:{artist_name:username}}
        });
        if(error)throw error;
        if(!data.session)setSentTo(email);
      }else{
        const {error}=await supabase.auth.signInWithPassword({email,password});
        if(error)throw error;
      }
    }catch(err){
      setError(err.response?.data?.error||err.message||'The account service is unavailable.');
    }finally{setBusy(false);}
  }

  async function resend(){
    setBusy(true);setError('');setNotice('');
    try{
      const {error}=await supabase.auth.resend({type:'signup',email:sentTo,options:{emailRedirectTo:callbackUrl()}});
      if(error)throw error;
      setNotice('A new confirmation email is on its way.');
    }catch(err){setError(err.message||'Could not resend the email. Try again later.');}
    finally{setBusy(false);}
  }

  return <section className="access-page"><div className="access-card">
    <div className="auth-brand"><img src="/art/swarhub-mark.png" alt=""/> SwarHub</div>
    {sentTo?<><h1>Check your email</h1><p role="status">Open the confirmation link sent to <strong>{sentTo}</strong> in this browser to finish creating your account.</p>
      {notice&&<p className="access-note" role="status">{notice}</p>}
      {error&&<p className="error" role="alert">{error}</p>}
      <div className="actions"><button className="btn" disabled={busy} onClick={resend}>{busy?'Please wait…':'Resend confirmation email'}</button><Link className="btn" to="/login">Back to log in</Link></div></>:<>
      <h1>{signup?'Create account':'Log in'}</h1><p>{signup?'Make a home for your recordings.':'Welcome back to your studio.'}</p>
      {!configured&&<p className="access-note" role="status">Account access is not configured on this site yet. You can still <Link to="/capture">use Capture as a guest</Link>.</p>}
      <form onSubmit={submit} className="stack">
        {signup&&<label>Artist name<input autoComplete="nickname" name="username" maxLength={80} required/></label>}
        <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required/></label>
        <label>Password<span className="password-field"><input name="password" type={show?'text':'password'} autoComplete={signup?'new-password':'current-password'} minLength={signup&&!legacyAuth?8:undefined} placeholder={signup&&!legacyAuth?'At least 8 characters':undefined} required/><button type="button" aria-label={show?'Hide password':'Show password'} onClick={()=>setShow(s=>!s)}>{show?<EyeOff size={16}/>:<Eye size={16}/>}</button></span></label>
        {!signup&&(supabase?<Link className="help-link" to="/forgot-password">Forgot password?</Link>:recoveryPage&&<a className="help-link" href={recoveryPage}>Forgot email or password?</a>)}
        {error&&<p className="error" role="alert">{error}</p>}
        <button disabled={busy||!configured} className="btn primary">{busy?'Please wait…':signup?'Create account':'Log in'}<ArrowRight size={16}/></button>
      </form>
      <p className="access-switch">{signup?'Already have an account?':'New to SwarHub?'} <Link to={signup?'/login':'/signup'}>{signup?'Log in':'Create an account'}</Link></p>
    </>}
  </div></section>;
}
