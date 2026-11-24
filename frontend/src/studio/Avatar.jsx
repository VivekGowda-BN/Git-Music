import {useId} from 'react';

// Small illustrated portraits, drawn locally so the feed never waits on a
// remote avatar service. Each palette is tied to one community artist.
const looks=[
  {bg:['#e6d2b9','#b99471'],skin:'#c98d68',hair:'#2d211f',shirt:'#778c62',style:'bun'},
  {bg:['#c8d9d7','#8da8a6'],skin:'#e0b294',hair:'#38312f',shirt:'#435b6c',style:'side'},
  {bg:['#ecd6c3','#c9a284'],skin:'#b97850',hair:'#241c1a',shirt:'#9b5140',style:'short'},
  {bg:['#e4ddbd','#b9ad7e'],skin:'#8a5b3e',hair:'#231b18',shirt:'#557267',style:'curly'},
];
function Hair({style,color}){
  if(style==='bun')return <><path d="M15.1 19.4c-.5-6.7 3.4-10.8 8.9-10.8s9.4 4.1 8.9 10.8c-1.4-2.4-2.8-3.5-4.2-4.2-2.7 1.7-6.2 1.6-9.4.2-1.7.9-3.1 2.1-4.2 4z" fill={color}/><circle cx="24" cy="7.8" r="3.4" fill={color}/></>;
  if(style==='side')return <path d="M14.9 20c-.7-7.2 3.6-11.4 9.3-11.4 5.3 0 9.4 3.9 9 10.7-2.2-.5-3.8-1.6-4.8-3-1.3 1.6-4.4 2.6-7.7 2.2-2.1-.2-4-1-5.8-2.5z" fill={color}/>;
  if(style==='short')return <path d="M15.4 18.8c-.2-6.1 3.1-10 8.7-10s8.9 3.9 8.7 10c-1.9-1.5-3.2-3-3.9-4.5-2.6 1.6-5.7 1.8-8.3.6-1.9.8-3.6 2-5.2 3.9z" fill={color}/>;
  return <g fill={color}><circle cx="17.2" cy="13.7" r="3.4"/><circle cx="21.1" cy="10.8" r="3.5"/><circle cx="25.8" cy="10.6" r="3.5"/><circle cx="30.1" cy="13.2" r="3.3"/><path d="M15.5 19c-.3-3.6 1.4-6.2 4-7.4 2.5 1.7 6.3 1.8 9 .2 2.6 1.3 4.2 3.8 3.9 7.2-1.8-1.2-3.1-2.7-3.8-4.2-2.6 1.5-5.6 1.6-8.2.5-2 .9-3.7 2.1-4.9 3.7z"/></g>;
}
export default function Avatar({index=0,size=32,label}){
  const id=useId().replace(/[^a-zA-Z0-9_-]/g,''),look=looks[index%looks.length];
  return <svg className="avatar-art" width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={label||'Community artist'}>
    <defs><clipPath id={`a${id}`}><circle cx="24" cy="24" r="24"/></clipPath><radialGradient id={`g${id}`} cx="32%" cy="24%" r="78%"><stop offset="0" stopColor={look.bg[0]}/><stop offset="1" stopColor={look.bg[1]}/></radialGradient></defs>
    <g clipPath={`url(#a${id})`}>
      <rect width="48" height="48" fill={`url(#g${id})`}/>
      <circle cx="35" cy="10" r="10" fill="#fff" opacity=".12"/>
      <path d="M5 48c.9-9.9 7.8-14.6 19-14.6S42.1 38.1 43 48z" fill={look.shirt}/>
      <rect x="20.4" y="26.2" width="7.2" height="7.4" rx="3.4" fill={look.skin}/>
      <ellipse cx="24" cy="20.2" rx="8.7" ry="9.7" fill={look.skin}/>
      <Hair style={look.style} color={look.hair}/>
      <circle cx="21" cy="20.1" r=".75" fill="#392923" opacity=".62"/><circle cx="27" cy="20.1" r=".75" fill="#392923" opacity=".62"/>
      <path d="M22.6 24.2c.9.7 1.9.7 2.8 0" fill="none" stroke="#5b3529" strokeWidth=".8" strokeLinecap="round" opacity=".6"/>
    </g>
  </svg>;
}
