import { wrap, formatTime } from './engine.mjs';
const NS='http://www.w3.org/2000/svg';
const svgElement=(tag,attrs={})=>{const el=document.createElementNS(NS,tag); for(const [k,v] of Object.entries(attrs)) el.setAttribute(k,v);return el;};

// A single clock implementation serves the home playground and every question.
export class AnalogClock {
  constructor(container,{time=610,interactive=false,step=1,onChange=()=>{}}={}) {
    this.container=container; this.time=wrap(time); this.interactive=interactive; this.step=step; this.onChange=onChange; this.angles={hour:0,minute:0};
    this.svg=svgElement('svg',{viewBox:'0 0 400 400',class:'analog-clock','aria-label':'Analog clock'});
    this.svg.append(svgElement('circle',{cx:200,cy:204,r:190,fill:'#d9d0eb'}),svgElement('circle',{cx:200,cy:198,r:190,fill:'#b4a1e2'}),svgElement('circle',{cx:200,cy:198,r:179,fill:'#fffdf7',stroke:'#e2d9ef','stroke-width':2}));
    for(let i=0;i<60;i++) {const a=i*Math.PI/30,r1=i%5===0?149:155,r2=163;this.svg.append(svgElement('line',{x1:200+Math.sin(a)*r1,y1:200-Math.cos(a)*r1,x2:200+Math.sin(a)*r2,y2:200-Math.cos(a)*r2,stroke:i%5===0?'#4d455f':'#c1b8ca','stroke-width':i%5===0?3:1.5,'stroke-linecap':'round'}));}
    for(let n=1;n<=12;n++){const a=n*Math.PI/6;const text=svgElement('text',{x:200+Math.sin(a)*127,y:200-Math.cos(a)*127+9,'text-anchor':'middle',class:'clock-number'});text.textContent=n;this.svg.append(text);}
    const brand=svgElement('text',{x:200,y:266,'text-anchor':'middle',class:'clock-brand'});brand.textContent='MAKE TIME TO SHINE';this.svg.append(brand);
    this.hands={};
    for(const [name,length,colour,width] of [['hour',83,'#7760c6',13],['minute',119,'#e78a56',9]]){
      const g=svgElement('g',{class:`clock-hand ${name}-hand`,'data-hand':name});
      g.append(svgElement('line',{x1:200,y1:217,x2:200,y2:200-length,stroke:colour,'stroke-width':width,'stroke-linecap':'round'}),svgElement('circle',{cx:200,cy:200-length,r:width/2+1,fill:colour}),svgElement('line',{x1:200,y1:187,x2:200,y2:200-length,stroke:'transparent','stroke-width':34,class:'hand-hit'}));
      this.hands[name]=g;this.svg.append(g);
      g.addEventListener('pointerdown',e=>this.pointerDown(e,name));
      g.addEventListener('keydown',e=>{if(!this.interactive)return;const sign=['ArrowUp','ArrowRight'].includes(e.key)?1:['ArrowDown','ArrowLeft'].includes(e.key)?-1:0;if(sign){e.preventDefault();this.setTime(this.time+sign*(name==='hour'?60:this.step));this.onChange(this.time);}});
    }
    this.svg.append(svgElement('circle',{cx:200,cy:200,r:12,fill:'#4d435f'}),svgElement('circle',{cx:200,cy:200,r:5,fill:'#fffdf7'}));
    this.container.replaceChildren(this.svg);
    this.svg.addEventListener('pointermove',e=>this.pointerMove(e));
    this.svg.addEventListener('pointerup',()=>this.pointerEnd());this.svg.addEventListener('pointercancel',()=>this.pointerEnd());this.svg.addEventListener('lostpointercapture',()=>this.pointerEnd());
    this.setInteractive(interactive,step);this.setTime(time,false);
  }
  setInteractive(value,step=this.step) {this.interactive=value;this.step=step;this.svg.classList.toggle('interactive',value);this.svg.setAttribute('role',value?'group':'img');for(const [name,g] of Object.entries(this.hands)){g.setAttribute('tabindex',value?'0':'-1');if(value){g.setAttribute('role','slider');g.setAttribute('aria-label',`${name} hand. Use arrow keys to move.`);g.setAttribute('aria-valuemin',name==='hour'?1:0);g.setAttribute('aria-valuemax',name==='hour'?12:59);}else {for(const key of ['role','aria-label','aria-valuemin','aria-valuemax','aria-valuenow','aria-valuetext'])g.removeAttribute(key);}}}
  setTime(value,animate=true) {
    this.time=wrap(value);const targets={hour:this.time/2,minute:(this.time%60)*6};
    for(const name of ['hour','minute']){const old=this.angles[name],diff=((targets[name]-old+540)%360+360)%360-180;const angle=animate?old+diff:targets[name];this.angles[name]=angle;this.hands[name].style.transition=animate&&!this.drag?'transform .45s cubic-bezier(.2,.7,.3,1)':'none';this.hands[name].style.transform=`rotate(${angle}deg)`;if(this.interactive){this.hands[name].setAttribute('aria-valuenow',name==='hour'?(Math.floor(this.time/60)||12):this.time%60);this.hands[name].setAttribute('aria-valuetext',`${name==='hour'?(Math.floor(this.time/60)||12):this.time%60} ${name}s`);}}
    const m=this.time%60,h=Math.floor(this.time/60)||12;
    this.svg.setAttribute('aria-label',this.interactive?`Settable clock showing ${formatTime(this.time)}`:`Analog clock. Short purple hand ${m===0?'at':'past'} ${h}. Long orange hand ${m===0?'at 12':`at minute tick ${m}`}.`);
  }
  pointerAngle(event){const point=new DOMPoint(event.clientX,event.clientY).matrixTransform(this.svg.getScreenCTM().inverse());return (Math.atan2(point.x-200,200-point.y)*180/Math.PI+360)%360;}
  pointerDown(e,name){if(!this.interactive||e.button>0)return;e.preventDefault();this.drag=name;this.svg.classList.add('dragging');this.svg.setPointerCapture(e.pointerId);this.pointerMove(e);}
  pointerMove(e){if(!this.drag)return;const a=this.pointerAngle(e);if(this.drag==='hour'){const hour=Math.round((a-(this.time%60)*.5)/30);this.setTime(hour*60+this.time%60,false);}else{const target=Math.round(a/6/this.step)*this.step;const current=this.time%60;const diff=((target-current+90)%60)-30;this.setTime(this.time+diff,false);}this.onChange(this.time);}
  pointerEnd(){this.drag=null;this.svg.classList.remove('dragging');}
}
