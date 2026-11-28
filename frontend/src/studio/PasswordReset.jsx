import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight} from 'lucide-react';
import {resetPasswordUrl,supabase} from '../lib/supabase';

function Brand(){return <div className="auth-brand"><img src="/art/swarhub-mark.png" alt=""/> SwarHub</div>;}

export function ForgotPassword(){
  const [email,setEmail]=useState(''),[busy,setBusy]=useState(false),[sent,setSent]=useState(false),[error,setError]=useState('');
  async function submit(event){
    event.preventDefault();
    setBusy(true);setError('');
    try{
      const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:resetPasswordUrl()});
      if(error)throw error;
      setSent(true);
    }catch(err){setError(err.message||'Could not send the reset email. Try again.');}
    finally{setBusy(false);}
  }
  return <section className="access-page"><div className="access-card">
    <Brand/>
    <h1>Reset password</h1>
    {!supabase?<>
      <p>Account access is not configured on this site yet.</p>
      <div className="actions"><Link className="btn" to="/login">Back to log in</Link></div>
    </>:sent?<>
      <p role="status">If an account exists for <strong>{email}</strong>, a reset link is on its way. Open it in this browser to choose a new password.</p>
      <p className="access-note">The link expires after a short time. Check your spam folder if it does not arrive.</p>
      <div className="actions"><Link className="btn" to="/login">Back to log in</Link><button className="btn" onClick={()=>{setSent(false);setError('');}}>Use a different email</button></div>
    </>:<>
      <p>Enter the email you use for SwarHub and we’ll send a link to choose a new password.</p>
      <form onSubmit={submit} className="stack">
        <label>Email address<input name="email" type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="you@example.com" required/></label>
        {error&&<p className="error" role="alert">{error}</p>}
        <button disabled={busy} className="btn primary">{busy?'Sending…':'Send reset link'}<ArrowRight size={16}/></button>
      </form>
      <p className="access-switch"><Link to="/login">Back to log in</Link></p>
    </>}
  </div></section>;
}

export function ResetPassword(){
  const [status,setStatus]=useState(supabase?'checking':'expired');
  const [password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  useEffect(()=>{
    if(!supabase)return;
    let active=true;
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
      if(active&&session)setStatus(current=>current==='done'?current:'ready');
    });
    supabase.auth.getSession().then(({data})=>{if(active&&data.session)setStatus(current=>current==='done'?current:'ready');});
    const timer=setTimeout(()=>{if(active)setStatus(current=>current==='checking'?'expired':current);},8000);
    return ()=>{active=false;clearTimeout(timer);subscription.unsubscribe();};
  },[]);
  async function submit(event){
    event.preventDefault();
    if(password.length<8){setError('Use at least 8 characters.');return;}
    if(password!==confirm){setError('The passwords do not match.');return;}
    setBusy(true);setError('');
    try{
      const {error}=await supabase.auth.updateUser({password});
      if(error)throw error;
      setStatus('done');
      setPassword('');setConfirm('');
    }catch(err){setError(err.message||'Could not update the password. Try the link again.');}
    finally{setBusy(false);}
  }
  return <section className="access-page"><div className="access-card">
    <Brand/>
    <h1>Choose a new password</h1>
    {status==='checking'&&<p role="status">Checking your reset link…</p>}
    {status==='expired'&&<>
      <p role="alert">This reset link is invalid or has expired. Request a new one and open it in the same browser.</p>
      <div className="actions"><Link className="btn primary" to="/forgot-password">Request a new link</Link><Link className="btn" to="/login">Back to log in</Link></div>
    </>}
    {status==='done'&&<>
      <p role="status">Your password was updated. You can keep using this session or log in again on another device.</p>
      <div className="actions"><Link className="btn primary" to="/dashboard">Go to dashboard</Link><Link className="btn" to="/login">Back to log in</Link></div>
    </>}
    {status==='ready'&&<>
      <p>Use at least 8 characters. Your other devices can log in with the new password.</p>
      <form onSubmit={submit} className="stack">
        <label>New password<input name="password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={event=>setPassword(event.target.value)} required/></label>
        <label>Confirm new password<input name="confirm" type="password" autoComplete="new-password" minLength={8} value={confirm} onChange={event=>setConfirm(event.target.value)} required/></label>
        {error&&<p className="error" role="alert">{error}</p>}
        <button disabled={busy} className="btn primary">{busy?'Updating…':'Update password'}<ArrowRight size={16}/></button>
      </form>
    </>}
  </div></section>;
}
