import {useId} from 'react';

// Original screen-print artwork: six sleeves, one visual system. No remote image dependencies.
const colors={field:['#eac48e','#a65132','#343e36'],unplugged:['#dfad99','#a34c42','#363f39'],tape:['#d5c78c','#6f8060','#313d38'],pixel:['#a4c5b9','#4d8076','#293e40'],stage:['#dac6bb','#95686c','#483f47'],radio:['#c9d1b0','#73845d','#3d483b']};
function Subject({id,ink,mid,paper}){
  if(id==='field')return <g transform="translate(212 86) rotate(-9)"><path d="M-49 10h85v60h-85z M38 29l36-18v54L38 48z" fill={ink}/>{[-29,16].map((x,i)=><g key={x} transform={`translate(${x} -9)`}><circle r={i?23:28} fill={ink} stroke={paper} strokeWidth="2"/>{[0,72,144,216,288].map(a=><circle key={a} cx="0" cy="-13" r="5" fill={paper} transform={`rotate(${a})`}/>)}</g>)}<path d="M-34 28h33m-33 8h40" stroke={paper} strokeWidth="3"/></g>;
  if(id==='unplugged')return <g transform="translate(220 94) rotate(28)"><path d="M-9-57h18v97H-9z" fill={ink}/><path d="M-26 7q-18 1-18 15 3 11-8 19-16 10-10 26 4 20 36 20 33 0 36-21 4-14-8-24-9-8-6-19 0-16-18-16z" transform="translate(24 -11)" fill={ink} stroke={paper} strokeWidth="2"/><circle cy="31" r="10" fill={mid} stroke={paper} strokeWidth="2"/><rect x="-9" y="-75" width="18" height="27" rx="5" fill={ink}/>{[-3,0,3].map(x=><path key={x} d={`M${x} -65v124`} stroke={paper} strokeWidth="1"/>)}<path d="M-11 59h22" stroke={paper} strokeWidth="4"/></g>;
  if(id==='tape')return <g transform="translate(227 98)"><circle r="76" fill={ink}/>{[27,32,38,45,50,55,62,68,71].map(r=><circle key={r} r={r} fill="none" stroke={paper} strokeOpacity=".4" strokeWidth=".7"/>)}<circle r="23" fill={mid}/><circle r="5" fill={paper}/><path d="M-89-56l42-15 26 119-43 15z" fill={paper} stroke={ink} strokeWidth="2"/></g>;
  if(id==='pixel')return <g><circle cx="230" cy="49" r="32" fill={paper}/><path d="M0 146l60-38 24 15 49-43 28 22 47-49 93 81 39-23 36 26v43H0z" fill={mid}/><path d="M0 162l60-29 39 12 47-30 52 22 40-40 76 47 62-13v50H0z" fill={ink}/><path d="M176 180l43-30-12-7 14-9-3 10 15 8-28 28" fill={paper}/></g>;
  if(id==='stage')return <g><path d="M85 0h66l61 142H98zM280 0h44l-48 142h-95z" fill={paper} opacity=".65"/><path d="M0 0h51q7 79-20 100l17 80H0zM376 0h-51q-7 79 20 100l-17 80h48z" fill={ink}/><path d="M0 161q137-13 376-2v21H0z" fill={ink}/><g transform="translate(218 65) rotate(20)"><rect x="-8" y="-13" width="16" height="28" rx="8" fill={ink}/><path d="M0 14v15l18 4v57" fill="none" stroke={ink} strokeWidth="4"/></g></g>;
  return <g transform="translate(215 89) rotate(-8)"><rect x="-65" y="-33" width="133" height="91" rx="9" fill={ink}/><path d="M-49-31l85-47" stroke={ink} strokeWidth="4"/><rect x="-53" y="-21" width="80" height="15" rx="2" fill={paper}/>{Array.from({length:12},(_,i)=><path key={i} d={`M${-49+i*6} -18v6`} stroke={mid}/>)}{Array.from({length:8},(_,i)=><path key={i} d={`M-51 ${2+i*6}h75`} stroke={paper} strokeWidth="1.5"/>)}{[-11,29].map(y=><g key={y}><circle cx="46" cy={y} r="10" fill={mid} stroke={paper}/><path d={`M45 ${y-5}l2 5`} stroke={paper}/></g>)}</g>;
}
export default function Poster({brief}){
  const uid=useId(),[paper,mid,ink]=colors[brief.id];
  return <svg className="poster" viewBox="0 0 376 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><pattern id={uid} width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".65" fill={ink} opacity=".38"/></pattern></defs>
    <rect width="376" height="180" fill={paper}/><circle cx="232" cy="95" r="86" fill={mid} opacity=".46"/>{[0,1,2,3,4,5].map(i=><path key={i} d={`M${-40+i*13} 180l114-180`} stroke={mid} opacity=".55" strokeWidth="1.4"/>)}
    <Subject id={brief.id} ink={ink} mid={mid} paper={paper}/><rect width="376" height="180" fill={`url(#${uid})`}/>
  </svg>;
}
