import {useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {ArrowRight,Eye,EyeOff} from 'lucide-react';
import axios from 'axios';
import {API_URL,setAuthSession} from '../lib/api';

const googleStart=import.meta.env.VITE_GOOGLE_LOGIN_URL;
const recoveryPage=import.meta.env.VITE_ACCOUNT_RECOVERY_URL;

export default function Auth({signup}){
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[help,setHelp]=useState(''),[show,setShow]=useState(false);
  const navigate=useNavigate();
  async function submit(e){
    e.preventDefault();setBusy(true);setError('');const fields=Object.fromEntries(new FormData(e.currentTarget));
    try{
      if(signup)await axios.post(`${API_URL}/signup`,fields);
      const {data}=await axios.post(`${API_URL}/login`,{email:fields.email,password:fields.password});
      setAuthSession(data.access_token,data.user_id);navigate('/dashboard');
    }catch(err){setError(err.response?.data?.error||'The account server is unavailable. Please try again later.');}finally{setBusy(false);}
  }
  return <section className="access-page"><div className="access-card"><div className="auth-brand"><img src="/art/swarhub-mark.svg" alt=""/> SwarHub</div><h1>{signup?'Create account':'Log in'}</h1><p>{signup?'Make a home for your recordings.':'Welcome back to your studio.'}</p>
    <form onSubmit={submit} className="stack">{signup&&<label>Artist name<input autoComplete="username" name="username" required/></label>}
      <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required/></label>
      <label>Password<span className="password-field"><input name="password" type={show?'text':'password'} autoComplete={signup?'new-password':'current-password'} required/><button type="button" aria-label={show?'Hide password':'Show password'} onClick={()=>setShow(s=>!s)}>{show?<EyeOff size={16}/>:<Eye size={16}/>}</button></span></label>
      {!signup&&(recoveryPage?<a className="help-link" href={recoveryPage}>Forgot email or password?</a>:<button className="help-link" type="button" aria-expanded={help==='recovery'} onClick={()=>setHelp(v=>v==='recovery'?'':'recovery')}>Forgot email or password?</button>)}
      {help==='recovery'&&<p className="access-note" role="status">Check your browser’s saved passwords for your SwarHub email and login. Email recovery isn’t connected in this preview.</p>}
      {error&&<p className="error" role="alert">{error}</p>}<button disabled={busy} className="btn primary">{busy?'Please wait…':signup?'Create account':'Log in'}<ArrowRight size={16}/></button>
    </form><div className="or"><span/>or<span/></div>
    <button className="btn google-btn" onClick={()=>{if(googleStart)window.location.assign(googleStart);else setHelp('google');}}><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.7-.4-4H24v7.7h11a9.5 9.5 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.9 6.1-15z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.5l-6.6-5.1a12.1 12.1 0 0 1-18-6.3H6.1v5.3A20 20 0 0 0 24 44z"/><path fill="#FBBC05" d="M12.9 28.1a12 12 0 0 1 0-8.2v-5.3H6.1a20 20 0 0 0 0 18.8z"/><path fill="#EA4335" d="M24 11.9c3 0 5.6 1 7.7 3l5.7-5.6A19.3 19.3 0 0 0 24 4 20 20 0 0 0 6.1 14.6l6.8 5.3a11.8 11.8 0 0 1 11.1-8z"/></svg>Continue with Google</button>
    {help==='google'&&<p className="access-note" role="status">Google sign-in isn’t connected in this preview. Use email and password above.</p>}
    <p className="access-switch">{signup?'Already have an account?':'New to SwarHub?'} <Link to={signup?'/login':'/signup'}>{signup?'Log in':'Create an account'}</Link></p>
  </div></section>;
}
