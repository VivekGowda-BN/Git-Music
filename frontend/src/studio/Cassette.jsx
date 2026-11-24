// Original vector artwork. Reels are separate moving parts, not a raster animation.
function Screw({ x, y }) {
  return <g transform={`translate(${x} ${y})`}><circle r="6.2" fill="#171b18"/><circle r="4.6" fill="url(#steel)"/><path d="M-2.6 0h5.2M0-2.6v5.2" stroke="#44433a" strokeWidth="1.3" transform="rotate(-32)"/></g>;
}
function Reel({ x }) {
  return <g transform={`translate(${x} 127)`}><circle r="42" fill="#26221b"/><circle r="39" fill="none" stroke="#453e30" strokeWidth="4"/>
    {[31,33,35,37].map(r=><circle key={r} r={r} fill="none" stroke="#685e48" strokeWidth=".65"/>)}
    <g className="reel"><circle r="23" fill="#c7c5af" stroke="#24281f" strokeWidth="2"/><circle r="17.2" fill="#eee9d4" stroke="#8f917e"/><circle r="10" fill="#484e40"/>
    {Array.from({length:6},(_,i)=><g key={i} transform={`rotate(${60*i})`}><path d="M-3-11v5h6v-5" fill="#e9e5d1"/><rect x="-2" y="-20" width="4" height="4" rx="1" fill="#737567"/></g>)}</g></g>;
}
export default function Cassette({ playing=false }) {
  return <svg className={`cassette ${playing?'spinning':''}`} viewBox="0 0 460 294" role="img" aria-label="The Nights by Avicii on a studio cassette">
    <defs>
      <linearGradient id="body" x2=".8" y2="1"><stop stopColor="#62665b"/><stop offset=".37" stopColor="#373e38"/><stop offset=".8" stopColor="#212720"/><stop offset="1" stopColor="#55594f"/></linearGradient>
      <linearGradient id="steel" x2="1" y2="1"><stop stopColor="#fcf9d9"/><stop offset=".48" stopColor="#a5a28e"/><stop offset="1" stopColor="#636459"/></linearGradient>
      <linearGradient id="label" x2="0" y2="1"><stop stopColor="#f2ecda"/><stop offset="1" stopColor="#ccc9b2"/></linearGradient>
      <pattern id="ribs" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 0h4" stroke="#e5e5cb" opacity=".23"/><path d="M0 2h4" stroke="#121812" opacity=".5"/></pattern>
      <pattern id="papergrain" width="5" height="3" patternUnits="userSpaceOnUse"><circle r=".6" cx="2" cy="1" fill="#5e5a45" opacity=".22"/></pattern>
      <clipPath id="window"><rect x="70" y="99" width="320" height="57" rx="28"/></clipPath>
    </defs>
    <rect x="5" y="7" width="450" height="279" rx="17" fill="#1c221c" stroke="#191e18" strokeWidth="4"/>
    <rect x="6" y="3" width="448" height="275" rx="15" fill="url(#body)" stroke="#7c8072" strokeWidth="2"/>
    <rect x="12" y="8" width="436" height="264" rx="11" fill="url(#ribs)" stroke="#242a24" strokeWidth="2"/>
    <rect x="29" y="22" width="402" height="175" rx="13" fill="#161b16" stroke="#999c89" strokeWidth="1.4"/>
    <rect x="34" y="27" width="392" height="164" rx="9" fill="url(#label)"/>
    <rect x="48" y="39" width="30" height="29" rx="2" fill="#2f372c"/><text x="63" y="60" textAnchor="middle" fill="#efe9d6" fontFamily="Arial" fontWeight="700" fontSize="21">A</text>
    <path d="M88 67h319m-319 9h319" stroke="#979a86" strokeWidth=".8"/>
    <text x="98" y="61" fontSize="30" fontStyle="italic" fill="#252c24" fontFamily="Georgia,serif">Avicii — The Nights</text>
    <path d="M34 88h392v70H34z" fill="#bd5736"/><path d="M34 145h392v9H34z" fill="#ce814d"/><path d="M34 156h392v5H34z" fill="#dfad72"/>
    <rect x="65" y="94" width="330" height="67" rx="33" fill="#686a59" stroke="#393e33" strokeWidth="2"/>
    <g clipPath="url(#window)"><rect x="70" y="99" width="320" height="57" fill="#464a3c"/><Reel x={117}/><Reel x={343}/>
    <rect x="174" y="109" width="113" height="37" rx="3" fill="#252a22" stroke="#737867"/>
    <path d="M181 115h98v21h-98z" fill="#525548"/><path d="M181 133h98v5h-98z" fill="#655341"/>
    {[0,1,2,3,4,5,6,7,8].map(i=><path key={i} d={`M${190+i*10} 117v${i%2?4:8}`} stroke="#cecfb7" strokeWidth="1"/>)}</g>
    <g fontFamily="monospace" fontWeight="700" fontSize="10.5" fill="#383e32"><text x="51" y="180">THE DAYS / NIGHTS</text><text x="356" y="180">2014</text></g>
    <rect x="34" y="27" width="392" height="164" rx="9" fill="url(#papergrain)"/>
    <path d="M83 273l16-55q2-7 10-7h242q8 0 10 7l16 55z" fill="url(#body)" stroke="#777b6c" strokeWidth="2"/>
    <path d="M88 272l15-53q1-4 8-4h238q7 0 8 4l15 53" fill="url(#ribs)" stroke="#272e25"/>
    {[114,346].map(x=><circle key={x} cx={x} cy="254" r="9" fill="#131814" stroke="#7f8271" strokeWidth="2"/>)}
    {[159,301].map(x=><rect key={x} x={x-6} y="249" width="12" height="11" rx="3" fill="#171d17" stroke="#878a79"/>)}
    <Screw x={21} y={18}/><Screw x={439} y={18}/><Screw x={21} y={261}/><Screw x={439} y={261}/><Screw x={230} y={223}/>
  </svg>;
}
