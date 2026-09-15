import {letters,vertices,shadow,colors,check} from './walks.js';
const $ = id => document.getElementById(id);
const canvas = $('walk'), ctx = canvas.getContext('2d');
let d=6,n=128,points=[],projected=[],word=[],yaw=-.55,pitch=.6,playing=false,frame=0,drag=null;
function refresh() {
  stop(); d=Number($('dimension').value); n=Number($('steps').value);
  points=vertices(d,n); projected=points.map(shadow); word=letters(d,n);
  $('step-count').value=n; $('reveal').max=n; $('reveal').value=n;
  $('check-output').textContent='Not checked yet for this prefix.';
  $('view-label').textContent=d===3?'3D · original coordinates':d===5?'5D · embedded 4D construction':`${d}D → 3D · linear view`;
  $('projection').textContent=d===3?'Native 3D coordinates. Rotation changes only the view.':d===6?
    'Illustrative 6D → 3D linear projection, not a certified infinite 3D construction. Apparent alignments are not evidence of collinearity in 6D.':
    `The paper’s return-displacement map: e₀ ↦ (1,0,1), e₁ ↦ (−1,1,2), e₂ ↦ (0,−1,3), e₃ ↦ (−2,0,4).${d===5?' The fifth coordinate stays zero.':''}`;
  $('legend').replaceChildren(...Array.from({length:d},(_,j)=>{
    const el=document.createElement('span'), swatch=document.createElement('i');
    swatch.style.setProperty('--color',colors[j]); el.append(swatch,`e${'₀₁₂₃₄₅'[j]}${d===5&&j===4?' · unused':''}`); return el;
  })); draw();
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
$('reset').onclick=()=>{yaw=-.55;pitch=.6;draw();};
$('dimension').onchange=refresh;$('steps').oninput=refresh;
$('reveal').oninput=()=>{stop();draw();};
document.querySelectorAll('[data-d]').forEach(el=>el.onclick=()=>{$('dimension').value=el.dataset.d;refresh();});
canvas.onpointerdown=e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);};
canvas.onpointermove=e=>{if(!drag)return;yaw+=(e.clientX-drag[0])*.008;pitch=Math.max(-1.5,Math.min(1.5,pitch+(e.clientY-drag[1])*.008));drag=[e.clientX,e.clientY];draw();};
canvas.onpointerup=canvas.onpointercancel=()=>{drag=null;};
canvas.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();yaw+=e.key==='ArrowLeft'?-.1:e.key==='ArrowRight'?.1:0;pitch+=e.key==='ArrowUp'?.1:e.key==='ArrowDown'?-.1:0;draw();};
new ResizeObserver(draw).observe(canvas);
$('check').onclick=()=>{const result=check(d,n);$('check-output').textContent=result.status==='finite-prefix-pass'?
  `PASS · ${n+1} vertices · ${result.pairs.toLocaleString()} exact pairs · no ${result.forbidden} collinear in this prefix. Not an infinite proof.`:JSON.stringify(result);};
let worker=null,timer=null;
function finish(){clearTimeout(timer);worker?.terminate();worker=null;$('run-python').disabled=false;$('stop-python').disabled=true;}
$('run-python').onclick=()=>{
  $('run-python').disabled=true;$('stop-python').disabled=false;
  $('python-output').textContent='Loading Python (first run may take a minute)…\n';
  worker=new Worker('python-worker.js');
  worker.onmessage=({data})=>{
    if(data.text)$('python-output').textContent=($('python-output').textContent+data.text+'\n').slice(-20000);
    if(data.done)finish();
  };
  worker.onerror=e=>{$('python-output').textContent+=`\nWorker error: ${e.message}`;finish();};
  worker.postMessage({code:$('python-code').value});
  timer=setTimeout(()=>{$('python-output').textContent+='\nStopped at the 120-second limit. Rerun to restart.';finish();},120000);
};
$('stop-python').onclick=()=>{$('python-output').textContent+='\nStopped. Rerun to restart this small computation.';finish();};
refresh();
