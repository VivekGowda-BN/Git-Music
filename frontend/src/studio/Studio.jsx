import {useCallback,useEffect,useState} from 'react';
import axios from 'axios';
import {BrowserRouter,Link,NavLink,Navigate,Outlet,Route,Routes,useLocation,useNavigate,useOutletContext} from 'react-router-dom';
import {ArrowUpRight,Disc3,LogOut,Menu,Send,X} from 'lucide-react';
import {motion,useReducedMotion} from 'framer-motion';
import Home from './Home';
import Capture from './Capture';
import Dashboard from './Dashboard';
import {Opportunities,Profile} from './Portfolio';
import {claimGuestLibrary,loadLibrary} from './library';
import {API_URL,getAuthHeaders,getAuthToken,getAuthUserId,clearAuthSession,fetchCurrentUser} from '../lib/api';
import Feed from './Feed';
import Auth from './Auth';
import {featured} from './featured';
import {legacyAuth,supabase} from '../lib/supabase';
import {safePhoto} from './profilePhoto';

const links=[['Feed','/feed'],['Dashboard','/dashboard'],['Capture','/capture'],['Opportunities','/opportunities']];
const footerLinks=[['Home','/home'],...links,['Profile','/profile']];
function Brand(){return <Link className="brand" to="/home" aria-label="SwarHub home"><img alt="" src="/art/swarhub-mark.svg"/>SwarHub</Link>;}
function PreviewProfile(){
  const {openPreview}=useOutletContext();
  const navigate=useNavigate();
  useEffect(()=>{openPreview();navigate('/profile',{replace:true});},[openPreview,navigate]);
  return <p className="wrap">Opening your artist workspace…</p>;
}
function Footer(){
  const page=encodeURIComponent(`${window.location.origin}/home`);
  return <footer className="site-footer"><div className="wrap footer-grid">
    <div className="footer-signature"><Brand/><a className="footer-credit" href={featured.listen} target="_blank" rel="noreferrer"><Disc3 size={22}/><span><small>Featured recording</small><strong>{featured.title} <i>by</i> {featured.artist}</strong></span><ArrowUpRight size={15}/></a></div>
    <nav aria-label="Footer navigation"><small className="micro">Explore</small>{footerLinks.map(([n,p])=><Link key={p} to={p}>{n}</Link>)}</nav>
    <div><small className="micro">Connect & share</small><div className="social-icons">
      <a href="https://github.com/VivekGowda-BN/Git-Music" target="_blank" rel="noreferrer" aria-label="SwarHub on GitHub" title="GitHub project"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .9a11.1 11.1 0 0 0-3.5 21.6c.55.1.76-.24.76-.54v-2.1c-3.09.67-3.74-1.31-3.74-1.31-.5-1.28-1.23-1.62-1.23-1.62-1.01-.69.08-.68.08-.68 1.12.08 1.7 1.14 1.7 1.14.99 1.7 2.59 1.21 3.22.93.1-.72.39-1.21.7-1.49-2.46-.29-5.05-1.23-5.05-5.49 0-1.22.43-2.22 1.14-3-.11-.28-.5-1.42.11-2.95 0 0 .94-.3 3.05 1.14a10.7 10.7 0 0 1 5.55 0c2.12-1.44 3.05-1.14 3.05-1.14.61 1.53.22 2.67.11 2.95.71.78 1.14 1.78 1.14 3 0 4.27-2.6 5.2-5.08 5.48.4.35.75 1.02.75 2.06v3.08c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z"/></svg></a>
      <a href={`https://twitter.com/intent/tweet?text=SwarHub&url=${page}`} target="_blank" rel="noreferrer" aria-label="Share SwarHub on X" title="Share on X"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-7.1 8.1L23 22h-6.4l-5-7.4L5 22H1.8l8.3-9.5L2.3 2h6.5l4.6 6.6zm-1.2 18h1.8L7.7 4H5.8z"/></svg></a>
      <a href={`https://t.me/share/url?url=${page}&text=SwarHub`} target="_blank" rel="noreferrer" aria-label="Share SwarHub on Telegram" title="Share on Telegram"><Send/></a>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${page}`} target="_blank" rel="noreferrer" aria-label="Share SwarHub on LinkedIn" title="LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="7.4" cy="7.4" r="1.35"/><path d="M6.3 10h2.3v8H6.3zm4.2 0h2.3v1c.6-.9 1.5-1.2 2.4-1.2 2.1 0 2.8 1.4 2.8 3.5V18h-2.4v-4.3c0-1.2-.3-1.9-1.3-1.9s-1.4.8-1.4 1.9V18h-2.4z"/></svg></a>
      <a href={featured.watch} target="_blank" rel="noreferrer" aria-label="Avicii on YouTube" title="Featured artist on YouTube"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M21.5 6.4c-.3-1-1.1-1.7-2.1-2C17.6 4 14 4 12 4s-5.6 0-7.4.4c-1 .3-1.8 1-2.1 2C2 8.1 2 10.4 2 12s0 3.9.5 5.6c.3 1 1.1 1.7 2.1 2 1.8.4 5.4.4 7.4.4s5.6 0 7.4-.4c1-.3 1.8-1 2.1-2 .5-1.7.5-4 .5-5.6s0-3.9-.5-5.6zM10 8.4v7.2l6-3.6z"/></svg></a>
      <a href={import.meta.env.VITE_INSTAGRAM_URL||'https://www.instagram.com/avicii/'} target="_blank" rel="noreferrer" aria-label={import.meta.env.VITE_INSTAGRAM_URL?'Instagram':'Featured artist on Instagram'} title="Instagram"><svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.1"/><circle cx="17.4" cy="6.8" r="1" fill="currentColor" stroke="none"/></svg></a>
    </div></div></div><div className="wrap foot-base"><span>© {new Date().getFullYear()} SwarHub</span><a href="#main" onClick={e=>{e.preventDefault();window.scrollTo(0,0);document.getElementById('main')?.focus({preventScroll:true});}}>Back to top ↑</a></div></footer>;
}
function Shell({scope,identity}){
  const [library,setLibrary]=useState(()=>loadLibrary(scope)),[remote,setRemote]=useState([]),[legacyUser,setLegacyUser]=useState(null),[accountError,setAccountError]=useState(''),[storageError,setStorageError]=useState(''),[menu,setMenu]=useState(false);
  const user=identity?{id:identity.id,email:identity.email,username:identity.user_metadata?.artist_name||identity.user_metadata?.full_name||identity.email?.split('@')[0]}:legacyUser;
  const {pathname}=useLocation(),navigate=useNavigate(),home=['/','/home'].includes(pathname);
  const [preview,setPreview]=useState(()=>sessionStorage.getItem('swarhub-preview')==='on'),reduced=useReducedMotion();
  const [notice,setNotice]=useState(()=>{const text=sessionStorage.getItem('swarhub-notice');if(text)sessionStorage.removeItem('swarhub-notice');return text||'';});
  const signedIn=scope!=='guest',artistView=signedIn||preview;
  const openPreview=useCallback(()=>{if(!signedIn){sessionStorage.setItem('swarhub-preview','on');setPreview(true);}},[signedIn]);
  async function signOut(){
    sessionStorage.setItem('swarhub-preview','off');setPreview(false);setMenu(false);
    if(identity){
      const {error}=await supabase.auth.signOut({scope:'local'});
      if(error){setAccountError('Could not sign out. Please try again.');return;}
    }else if(signedIn)clearAuthSession();
    navigate('/home');
  }
  useEffect(()=>{document.title=`${home?'The musician’s workspace':pathname==='/profile'?'Artist profile':footerLinks.find(([,v])=>v===pathname)?.[0]||'Artist access'} — SwarHub`;window.scrollTo(0,0);},[pathname,home]);
  useEffect(()=>{
    if(!legacyAuth||!getAuthToken())return;
    let active=true;const options={headers:getAuthHeaders()};
    (async()=>{
      try{
        const [who,{data:projects}]=await Promise.all([fetchCurrentUser(),axios.get(`${API_URL}/my-projects`,options)]);
        const repos=await Promise.all(projects.map(async p=>{const {data}=await axios.get(`${API_URL}/projects/${p.id}/versions`,options);
          return {...p,serverId:p.id,id:`account-${p.id}`,remote:true,takes:data.reverse().map(v=>({...v,id:`version-${v.id}`,name:v.instruments||`Take ${v.id}`,created:v.created_at,parent:null}))};}));
        if(active){setLegacyUser(who);setRemote(repos);}
      }catch{if(active)setAccountError('Account repositories could not be loaded. Your local workspace is available.');}
    })();return()=>{active=false;};
  },[scope]);
  function update(fn){const next=fn(library);try{localStorage.setItem(`swarhub:${scope}`,JSON.stringify(next));setLibrary(next);setStorageError('');}catch{setStorageError('Browser storage is full or unavailable. Your changes could not be saved.');throw Error('Storage unavailable');}}
  function removeRemote(id){setRemote(list=>list.filter(p=>p.id!==id));}
  return <><a className="skip" href="#main">Skip to content</a><header className="top glass-nav" onKeyDown={e=>{if(e.key==='Escape')setMenu(false);}}><div className="nav-wrap wrap" onClick={e=>{if(e.target.closest('a'))setMenu(false);}}><Brand/><nav id="main-navigation" aria-label="Main navigation" className={menu?'open':''}>{links.map(([name,path])=><NavLink className={({isActive})=>isActive?'active':''} key={path} to={path}>{({isActive})=><>{isActive&&<motion.i aria-hidden="true" className="nav-highlight" layoutId="nav-active" transition={{duration:reduced?0:.22}}/>}<span>{name}</span></>}</NavLink>)}</nav>
    <div className="account-nav">{artistView?<><Link to="/profile" className="avatar-link" aria-label={`Open ${library.artist.name||user?.username||'artist'} profile`} title="Artist profile" aria-current={pathname==='/profile'?'page':undefined}><img src={safePhoto(library.artist.photo)||'/art/artist.svg'} alt=""/></Link><button className="login-link" onClick={signOut} aria-label="Sign out"><LogOut size={14}/><span>Sign out</span></button></>:<><Link className="text-login" to="/login">Log in</Link><Link className="login-link" to="/signup">Sign up <ArrowUpRight size={14}/></Link></>}</div>
    <button className="menu-toggle" aria-controls="main-navigation" aria-expanded={menu} aria-label={menu?'Close navigation':'Open navigation'} onClick={()=>setMenu(v=>!v)}>{menu?<X/>:<Menu/>}</button></div></header>
    <main id="main" tabIndex="-1">{notice&&<p className="wrap notice" role="status">{notice}<button aria-label="Dismiss message" onClick={()=>setNotice('')}>×</button></p>}{storageError&&<p className="wrap error" role="alert">{storageError}</p>}{identity&&accountError&&<p className="wrap error" role="alert">{accountError}</p>}<Outlet context={{library,update,remote,removeRemote,user,accountError:legacyAuth?accountError:'',previewArtist:!signedIn&&preview,openPreview}}/></main><Footer/></>;
}
const legacyScope=()=>legacyAuth&&getAuthToken()?`artist-${getAuthUserId()||'local'}`:'guest';

export default function Studio(){
  const [identity,setIdentity]=useState(null),[ready,setReady]=useState(!supabase);
  const [oldScope,setOldScope]=useState(legacyScope);
  useEffect(()=>{
    if(supabase){
      const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
        const user=session?.user??null;
        if(user&&claimGuestLibrary(user.id))sessionStorage.setItem('swarhub-notice','Your guest recordings were added to this account.');
        setIdentity(user);setReady(true);
      });
      return ()=>subscription.unsubscribe();
    }
    if(!legacyAuth)return;
    const sync=()=>setOldScope(legacyScope());
    window.addEventListener('swarlab-auth',sync);window.addEventListener('storage',sync);
    return ()=>{window.removeEventListener('swarlab-auth',sync);window.removeEventListener('storage',sync);};
  },[]);
  if(!ready)return <p className="wrap" role="status">Opening your workspace…</p>;
  const scope=identity?`supabase-${identity.id}`:oldScope;
  const signedIn=scope!=='guest';
  const dashboard=<Navigate replace to="/dashboard"/>;
  return <BrowserRouter><Routes><Route element={<Shell key={scope} scope={scope} identity={identity}/>}><Route index element={<Home/>}/><Route path="home" element={<Home/>}/><Route path="feed" element={<Feed/>}/><Route path="capture" element={<Capture/>}/><Route path="dashboard" element={<Dashboard/>}/><Route path="opportunities" element={<Opportunities/>}/><Route path="profile" element={<Profile/>}/><Route path="preview/profile" element={<PreviewProfile/>}/><Route path="login" element={signedIn?dashboard:<Auth key="login"/>}/><Route path="signup" element={signedIn?dashboard:<Auth key="signup" signup/>}/><Route path="auth/callback" element={identity?dashboard:<Auth key="callback" callbackFailed/>}/><Route path="analyse" element={<Navigate replace to="/capture"/>}/><Route path="compare" element={<Navigate replace to="/dashboard"/>}/><Route path="*" element={<Navigate replace to="/home"/>}/></Route></Routes></BrowserRouter>;
}
