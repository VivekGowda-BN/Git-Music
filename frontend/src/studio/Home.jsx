import {useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight,ArrowUpRight,AudioLines,GitBranch,LayoutGrid,Mic,Radio,Tickets,Users} from 'lucide-react';
import ListeningDesk from './ListeningDesk';

export function Wave({peaks,progress=0}) {
  const values=peaks||Array.from({length:72},(_,i)=>.08+Math.abs(Math.sin(i*1.12)*Math.cos(i*.21)+.2*Math.sin(i*.73))*Math.pow(Math.sin((i+.5)/72*Math.PI),.5));
  const max=Math.max(...values,.01);
  return <svg className="wave" viewBox={`0 0 ${values.length*4} 40`} preserveAspectRatio="none" aria-hidden="true">{values.map((v,i)=>{const h=2+34*v/max;return <rect key={i} x={i*4} y={(40-h)/2} height={h} width="2.4" rx="1" fill={i/values.length<progress?'var(--rust)':'currentColor'}/>;})}</svg>;
}
const principles=[
  {n:'01',title:'What it is',icon:AudioLines,body:'A version-controlled home for recorded music. Every take, branch and mix stays attached to the song it came from — so an idea never disappears into a folder called final_final.'},
  {n:'02',title:'Who it’s for',icon:Users,body:'Songwriters, session players, producers and small studios who share work before it is finished. If a voice memo and a DAW session belong to the same story, this is for you.'},
  {n:'03',title:'Why we built it',icon:GitBranch,body:'Because music does not arrive in one clean file. It arrives in versions. SwarHub borrows the clearest idea from software — history you can revisit — and gives it back to sound.'},
];
const rooms=[
  {to:'/feed',label:'Feed',icon:Radio,note:'See what other artists are recording, branching and publishing.'},
  {to:'/dashboard',label:'Dashboard',icon:LayoutGrid,note:'Open every project, take and mix you have saved, filed by song.'},
  {to:'/capture',label:'Capture',icon:Mic,note:'Record a new idea and let SwarHub find the strongest passage.'},
  {to:'/opportunities',label:'Opportunities',icon:Tickets,note:'Find sync briefs, sessions and stages that need your sound.'},
];
function AboutSwarHub(){
  return <section className="about-swarhub" aria-labelledby="about-title"><div className="wrap">
    <div className="about-lead"><div><small className="eyebrow">The idea behind SwarHub</small>
      <h2 id="about-title">A song is not a file.<br/><em>It’s a history.</em></h2></div>
      <p>Most tools keep the final mix. SwarHub keeps the whole conversation: the first hum, the take that almost worked, the branch a friend sent back. You can hear how a song became itself.</p></div>
    <div className="about-ledger">{principles.map(({n,title,icon:Icon,body})=><article className="about-entry" key={n}>
      <div className="about-entry-top"><span>{n}</span><Icon size={21} strokeWidth={1.4}/></div>
      <h3>{title}</h3><p>{body}</p><i className="about-thread" aria-hidden="true"/></article>)}</div>
  </div></section>;
}
function StudioDirectory(){
  return <section className="studio-directory" aria-labelledby="directory-title"><div className="wrap directory-layout">
    <div className="directory-copy"><small className="eyebrow">Find your way around</small>
      <h2 id="directory-title">Four rooms.<br/><em>One studio.</em></h2>
      <p>Everything you need is one click away. These are the four places you will work in SwarHub.</p></div>
    <div className="directory-list">{rooms.map(({to,label,icon:Icon,note},i)=><Link className="directory-row" to={to} key={to}>
      <span className="directory-number">0{i+1}</span>
      <span className="directory-icon"><Icon size={20} strokeWidth={1.5}/></span>
      <span className="directory-text"><strong>{label}</strong><small>{note}</small></span>
      <ArrowUpRight className="directory-arrow" size={18}/>
    </Link>)}</div>
  </div></section>;
}
export default function Home(){
  const [owner,setOwner]=useState(null);
  return <>
    <section className="hero wrap home-hero" data-enter>
      <div className="hero-grid"><div className="hero-copy"><h1>Version control<br/>for your <em>sound.</em></h1>
        <p>Record a song idea, try a different take, and keep both. Your voice memos, stems and finished mixes live in the same project.</p>
        <div className="actions"><Link className="btn primary" to="/capture"><Mic size={17}/> Capture an idea</Link><Link className="btn" to="/dashboard">Open dashboard <ArrowRight size={16}/></Link></div>
      </div><ListeningDesk active={owner==='feature'} setOwner={setOwner}/></div>
    </section>
    <AboutSwarHub/>
    <StudioDirectory/>
  </>;
}
