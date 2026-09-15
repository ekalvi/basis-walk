import {letters,vertices,shadow,colors,projectionColumns,compressForward,viewAngles} from './walks.js';
const $ = id => document.getElementById(id);
const canvas = $('walk'), ctx = canvas.getContext('2d');
let d=6,n=256,points=[],projected=[],word=[],yaw=-.55,pitch=.6,playing=false,frame=0,drag=null;
function refresh() {
  stop(); const nextD=Number($('dimension').value);
  if(nextD!==d)$('compression').value=nextD===6?1:16;
  d=nextD; n=Number($('steps').value);
  points=vertices(d,n); word=letters(d,n);
  $('step-count').value=n; $('reveal').max=n; $('reveal').value=n;
  $('projection').textContent=d===3?'3D coordinates → optional forward compression → rotation → 2D screen. The readout below the canvas is unmodified.':d===6?
    '6D lattice → illustrative 3D linear map → optional forward compression → rotation → 2D screen. This is not a certified 3D avoidance construction.':
    `${d}D lattice → manuscript’s 3D return-displacement map → optional forward compression → rotation → 2D screen.${d===5?' The fifth coordinate is always zero; its display vector is also zero.':''}`;
  $('map-caption').textContent=d===3?'3D: identity map before compression':d===6?'6D: chosen illustrative vectors, not the manuscript’s auxiliary space':`${d}D: return-displacement vectors${d===5?' with a zero fifth column':''}`;
  $('map-columns').replaceChildren(...projectionColumns(d).map((v,j)=>{
    const row=document.createElement('tr'), label=document.createElement('th');
    label.scope='row';label.textContent=`e${'₀₁₂₃₄₅'[j]}${d===5&&j===4?' (unused)':''}`;row.append(label);
    for(const value of v){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}
    return row;
  }));
  $('legend').replaceChildren(...Array.from({length:d},(_,j)=>{
    const el=document.createElement('span'), swatch=document.createElement('i');
    swatch.style.setProperty('--color',colors[j]); el.append(swatch,`e${'₀₁₂₃₄₅'[j]}${d===5&&j===4?' · unused':''}`); return el;
  })); updateProjection(true);
}
function updateProjection(reframe=false){
  const factor=Number($('compression').value);
  projected=compressForward(points.map(shadow),factor);
  if(reframe)({yaw,pitch}=viewAngles(projected));
  $('compression-value').value=factor===1?'1 (off)':`1/${factor}`;
  $('view-label').textContent=`${d===3?'3D':`${d}D → 3D`} · ${factor===1?'uncompressed':`forward scale 1/${factor}`} · illustrative view`;
  draw();
}
function draw() {
  const width=canvas.clientWidth,height=canvas.clientHeight,ratio=window.devicePixelRatio||1;
  if(canvas.width!==Math.round(width*ratio)||canvas.height!==Math.round(height*ratio)){
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
  }
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);
  const rotated=projected.map(([x,y,z])=>{
    const a=x*Math.cos(yaw)-y*Math.sin(yaw),b=x*Math.sin(yaw)+y*Math.cos(yaw);
    return [a,b*Math.sin(pitch)-z*Math.cos(pitch)];
  });
  const xs=rotated.map(p=>p[0]),ys=rotated.map(p=>p[1]);
  const xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
  const scale=Math.min((width-90)/Math.max(1,xmax-xmin),(height-100)/Math.max(1,ymax-ymin));
  const mapped=rotated.map(([x,y])=>[width/2+(x-(xmin+xmax)/2)*scale,height/2+(y-(ymin+ymax)/2)*scale]);
  const reveal=Number($('reveal').value);
  ctx.lineWidth=1;ctx.strokeStyle='#dce4ee';ctx.beginPath();
  mapped.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
  ctx.lineWidth=2.2;ctx.lineCap='round';
  for(let j=0;j<reveal;j++){
    ctx.strokeStyle=colors[word[j]];ctx.beginPath();ctx.moveTo(...mapped[j]);ctx.lineTo(...mapped[j+1]);ctx.stroke();
  }
  for(const [index,radius,color] of [[0,3,'#647184'],[reveal,4,'#192332']]){
    ctx.beginPath();ctx.arc(...mapped[index],radius,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
  }
  $('vertex-number').value=reveal;$('coordinates').textContent=`P${reveal} = (${points[reveal].join(', ')})`;
}
function stop(){playing=false;cancelAnimationFrame(frame);$('play').textContent='Play';}
let last=0;
function tick(time){if(!playing)return;if(time-last>40){last=time;let v=Number($('reveal').value);if(v>=n){stop();return;}$('reveal').value=v+1;draw();}frame=requestAnimationFrame(tick);}
$('play').onclick=()=>{if(playing)return stop();if(Number($('reveal').value)>=n)$('reveal').value=0;playing=true;$('play').textContent='Pause';frame=requestAnimationFrame(tick);};
$('reset').onclick=()=>{$('compression').value=d===6?1:16;updateProjection(true);};
$('compression').oninput=()=>updateProjection();
$('uncompressed').onclick=()=>{$('compression').value=1;updateProjection();};
$('dimension').onchange=refresh;$('steps').oninput=refresh;
$('reveal').oninput=()=>{stop();draw();};
document.querySelectorAll('[data-d]').forEach(el=>el.onclick=()=>{$('dimension').value=el.dataset.d;refresh();});
canvas.onpointerdown=e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);};
canvas.onpointermove=e=>{if(!drag)return;yaw+=(e.clientX-drag[0])*.008;pitch=Math.max(-1.5,Math.min(1.5,pitch+(e.clientY-drag[1])*.008));drag=[e.clientX,e.clientY];draw();};
canvas.onpointerup=canvas.onpointercancel=()=>{drag=null;};
canvas.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();yaw+=e.key==='ArrowLeft'?-.1:e.key==='ArrowRight'?.1:0;pitch+=e.key==='ArrowUp'?.1:e.key==='ArrowDown'?-.1:0;draw();};
new ResizeObserver(draw).observe(canvas);
const editor=$('python-code'), highlight=$('code-highlight'), originalCode=editor.value;
editor.wrap='off';
function highlightCode(){
  const code=highlight.querySelector('code');
  const tokens=editor.value.match(/#[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:from|import|for|in|if|else|elif|def|return|class|while|try|except|with|as|True|False|None|and|or|not|print)\b|\b\d+(?:\.\d+)?\b|[^#"'\w]+|\w+|./g)||[];
  code.replaceChildren(...tokens.map(text=>{
    let kind=text.startsWith('#')?'comment':/^["']/.test(text)?'string':/^\d/.test(text)?'number':/^(from|import|for|in|if|else|elif|def|return|class|while|try|except|with|as|True|False|None|and|or|not|print)$/.test(text)?'keyword':null;
    if(!kind)return document.createTextNode(text);
    const span=document.createElement('span');span.className=`tok-${kind}`;span.textContent=text;return span;
  }),document.createTextNode('\n'));
  syncScroll();
}
function syncScroll(){highlight.scrollTop=editor.scrollTop;highlight.scrollLeft=editor.scrollLeft;}
editor.oninput=()=>{highlightCode();if(!worker)$('run-status').textContent='Edited · run to update output';};
editor.onscroll=syncScroll;
let worker=null,timer=null;
function finish(status){
  clearTimeout(timer);worker?.terminate();worker=null;
  $('run-python').disabled=false;$('stop-python').disabled=true;$('reset-code').disabled=false;editor.readOnly=false;
  $('run-status').textContent=status;
}
$('run-python').onclick=()=>{
  if(worker)return;
  $('run-python').disabled=true;$('stop-python').disabled=false;$('reset-code').disabled=true;editor.readOnly=true;
  $('run-status').textContent='Running…';
  $('python-output').textContent='Loading Python (first run may take a minute)…\n';
  try{
    let hasOutput=false;
    worker=new Worker('python-worker.js');
    worker.onmessage=({data})=>{
      if(data.text){
        if(!hasOutput){$('python-output').textContent='';hasOutput=true;}
        $('python-output').textContent=($('python-output').textContent+data.text+'\n').slice(-20000);
      }
      if(data.done)finish(data.error?'Failed':'Finished');
    };
    worker.onerror=e=>{$('python-output').textContent+=`\nWorker error: ${e.message}`;finish('Failed');};
    worker.postMessage({code:editor.value});
    timer=setTimeout(()=>{$('python-output').textContent+='\nStopped at the 120-second limit. Rerun to restart.';finish('Timed out');},120000);
  }catch(error){$('python-output').textContent+=`\n${error}`;finish('Failed');}
};
$('stop-python').onclick=()=>{$('python-output').textContent+='\nStopped. Rerun to restart this small computation.';finish('Stopped');};
$('reset-code').onclick=()=>{editor.value=originalCode;editor.scrollTop=editor.scrollLeft=0;highlightCode();$('python-output').textContent='Run the example to see its output here.';$('run-status').textContent='Ready';};
function fullscreenCode(active){
  $('workbench').classList.toggle('is-fullscreen',active);document.body.classList.toggle('code-fullscreen',active);
  $('fullscreen-code').textContent=active?'Exit full screen':'Full screen';$('fullscreen-code').setAttribute('aria-pressed',String(active));
}
$('fullscreen-code').onclick=()=>fullscreenCode(!$('workbench').classList.contains('is-fullscreen'));
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&$('workbench').classList.contains('is-fullscreen')){fullscreenCode(false);$('fullscreen-code').focus();}
  if(event.target===editor&&event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();$('run-python').click();}
});
highlightCode();refresh();
