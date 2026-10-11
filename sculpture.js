/* GF Studio / Form 001
   A real-time, depth-sorted metallic trefoil. No video, WebGL, dependencies or network.
   The surface is generated once; only projection and lighting are animated.
*/
(() => {
  'use strict';
  const canvas = document.getElementById('sculpture');
  const host = canvas.parentElement;
  let gl = null, ctx = null;
  try { gl = canvas.getContext('webgl', { alpha: true, antialias: true, powerPreference: 'low-power', premultipliedAlpha: false }); } catch { /* Canvas-only environment. */ }
  if (!gl) ctx = canvas.getContext('2d', { alpha: true });
  if (!gl && !ctx) return; // Inline SVG supplies the static fallback.
  const coarse = matchMedia('(pointer: coarse)').matches;
  const lowPower = coarse || (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4);
  const rings = gl ? 240 : (lowPower ? 120 : 180);
  const sides = gl ? 40 : (lowPower ? 20 : 28);
  const TAU = Math.PI * 2;
  const vertices = [], faces = [], projected = [];
  const colors = { lime: [213,255,112], lilac: [198,173,255], ice: [146,232,238] };
  let color = colors.lime;
  let w = 1, h = 1, dpr = 1, time = 0, previous = 0, frame = 0;
  let inView = true, pointerX = 0, pointerY = 0, smoothX = 0, smoothY = 0;
  const normalize = a => { const m = Math.hypot(...a) || 1; return a.map(v => v / m); };
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  function center(u) { const r = 1.64 + .52 * Math.cos(3*u); return [r*Math.cos(2*u),r*Math.sin(2*u),.82*Math.sin(3*u)]; }
  for (let i = 0; i < rings; i++) {
    const u = i / rings * TAU, p = center(u), before = center(u - .001), after = center(u + .001);
    const tangent = normalize(after.map((v, k) => v - before[k]));
    // The curve always has an XY tangent: this periodic frame avoids Frenet flips at inflections.
    const normal = normalize([-tangent[1], tangent[0], 0]);
    const binormal = normalize(cross(tangent, normal));
    for (let j = 0; j < sides; j++) {
      const angle = j / sides * TAU;
      const tube = .31 + .028 * Math.sin(u * 3);
      const n = normal.map((v, k) => v * Math.cos(angle) + binormal[k] * Math.sin(angle));
      vertices.push({ p: p.map((v, k) => v + tube * n[k]), n });
      projected.push({ x:0,y:0,z:0,nx:0,ny:0,nz:0 });
    }
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < sides; j++) {
    faces.push({ ids:[i*sides+j,((i+1)%rings)*sides+j,((i+1)%rings)*sides+(j+1)%sides,i*sides+(j+1)%sides],z:0 });
  }
  function rotation(x, y, z) {
    const sx=Math.sin(x),cx=Math.cos(x),sy=Math.sin(y),cy=Math.cos(y),sz=Math.sin(z),cz=Math.cos(z);
    return [cy*cz, sx*sy*cz-cx*sz, cx*sy*cz+sx*sz, cy*sz, sx*sy*sz+cx*cz, cx*sy*sz-sx*cz, -sy, sx*cy, cx*cy];
  }
  // Smooth per-pixel lighting and a depth buffer on GPU-capable browsers.
  // The canvas renderer remains available when WebGL is disabled.
  let gpu = null;
  if (gl) {
    const vertexSource = `
      attribute vec3 aPosition;
      attribute vec3 aNormal;
      uniform mat3 uRotation;
      uniform vec2 uViewport;
      varying vec3 vNormal;
      varying float vDepth;
      void main() {
        vec3 p = uRotation * aPosition;
        float perspective = 8.0 / (8.0 - p.z);
        float scale = min(uViewport.x, uViewport.y) * 0.171;
        vec2 screen = uViewport * vec2(0.54, 0.49) + p.xy * scale * perspective;
        gl_Position = vec4(screen.x / uViewport.x * 2.0 - 1.0,
                           1.0 - screen.y / uViewport.y * 2.0, -p.z / 8.0, 1.0);
        vNormal = uRotation * aNormal;
        vDepth = p.z;
      }`;
    const fragmentSource = `
      precision mediump float;
      uniform vec3 uColor;
      varying vec3 vNormal;
      varying float vDepth;
      void main() {
        vec3 n = normalize(vNormal);
        float key = max(0.0, dot(n, vec3(-0.38, -0.66, 0.64)));
        float rim = pow(max(0.0, 1.0 - abs(n.z)), 3.0);
        float softbox = exp(-pow((n.y + 0.30) / 0.22, 2.0)) * 0.56;
        float edge = pow(key, 22.0) * 0.72;
        float reflection = exp(-pow((n.x + 0.6) / 0.11, 2.0)) * 0.33;
        float light = 0.065 + key * 0.13 + softbox + edge + reflection;
        float tint = max(0.0, n.x * 0.7 + n.y * 0.3 + 0.12) * 0.43 + rim * 0.21;
        vec3 metal = (vec3(0.855, 0.855, 0.82) * light + uColor * tint) * (0.80 + (vDepth + 2.8) * 0.037);
        gl_FragColor = vec4(clamp(metal, 0.0, 1.0), 1.0);
      }`;
    try {
      const compile = (type, source) => {
        const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Shader compilation failed');
        return shader;
      };
      const program = gl.createProgram();
      const vs = compile(gl.VERTEX_SHADER, vertexSource), fs = compile(gl.FRAGMENT_SHADER, fragmentSource);
      gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Shader linking failed');
      gl.useProgram(program); gl.deleteShader(vs); gl.deleteShader(fs);
      const geometry = new Float32Array(vertices.flatMap(v => [...v.p, ...v.n]));
      const indices = new Uint16Array(faces.flatMap(f => [f.ids[0], f.ids[1], f.ids[2], f.ids[0], f.ids[2], f.ids[3]]));
      const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, geometry, gl.STATIC_DRAW);
      const indexBuffer = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
      for (const [name, offset] of [['aPosition', 0], ['aNormal', 12]]) {
        const location = gl.getAttribLocation(program, name); gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 24, offset);
      }
      gl.enable(gl.DEPTH_TEST); gl.clearColor(0, 0, 0, 0);
      gpu = { count: indices.length, rotation: gl.getUniformLocation(program, 'uRotation'), viewport: gl.getUniformLocation(program, 'uViewport'), color: gl.getUniformLocation(program, 'uColor') };
    } catch {
      // A failed shader still leaves the authored SVG visible and the website fully usable.
      return;
    }
    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault(); cancelAnimationFrame(frame); frame = 0;
      host.classList.remove('is-rendered');
      inView = false;
    });
    // The inline SVG is the conservative fallback after GPU context loss.
  }
  function render() {
    if (gpu) {
      const m = rotation(.68 + Math.sin(time*.13)*.18 + smoothY*.18, -.43 + time*.12 + smoothX*.2, -.56 + Math.sin(time*.18)*.12);
      if (gl.isContextLost()) return;
      gl.viewport(0, 0, canvas.width, canvas.height); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix3fv(gpu.rotation, false, new Float32Array([m[0],m[3],m[6],m[1],m[4],m[7],m[2],m[5],m[8]]));
      gl.uniform2f(gpu.viewport, w, h); gl.uniform3f(gpu.color, color[0]/255, color[1]/255, color[2]/255);
      gl.drawElements(gl.TRIANGLES, gpu.count, gl.UNSIGNED_SHORT, 0);
      host.classList.add('is-rendered'); return;
    }
    ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,w,h);
    const m = rotation(.68 + Math.sin(time*.13)*.18 + smoothY*.18, -.43 + time*.12 + smoothX*.2, -.56 + Math.sin(time*.18)*.12);
    const scale = Math.min(w,h) * .171;
    const originX = w*.54, originY = h*.49;
    for (let i = 0; i < vertices.length; i++) {
      const v=vertices[i],p=v.p,n=v.n,q=projected[i];
      const x=m[0]*p[0]+m[1]*p[1]+m[2]*p[2],y=m[3]*p[0]+m[4]*p[1]+m[5]*p[2],z=m[6]*p[0]+m[7]*p[1]+m[8]*p[2];
      const perspective=8/(8-z);
      q.x=originX+x*scale*perspective; q.y=originY+y*scale*perspective; q.z=z;
      q.nx=m[0]*n[0]+m[1]*n[1]+m[2]*n[2];q.ny=m[3]*n[0]+m[4]*n[1]+m[5]*n[2];q.nz=m[6]*n[0]+m[7]*n[1]+m[8]*n[2];
    }
    for (const face of faces) face.z=face.ids.reduce((sum,id)=>sum+projected[id].z,0)*.25;
    faces.sort((a,b)=>a.z-b.z);
    ctx.lineJoin='round'; ctx.lineWidth=.6;
    for (const face of faces) {
      const a=projected[face.ids[0]],b=projected[face.ids[1]],c=projected[face.ids[2]],d=projected[face.ids[3]];
      let nx=(a.nx+b.nx+c.nx+d.nx)*.25,ny=(a.ny+b.ny+c.ny+d.ny)*.25,nz=(a.nz+b.nz+c.nz+d.nz)*.25;
      const length=Math.hypot(nx,ny,nz)||1; nx/=length;ny/=length;nz/=length;
      const key=Math.max(0,-.38*nx-.66*ny+.64*nz);
      const rim=Math.pow(Math.max(0,1-Math.abs(nz)),3);
      // Broad studio softbox + narrow reflection streaks give a brushed chrome finish.
      const softbox=Math.exp(-Math.pow((ny+.30)/.22,2))*.56;
      const edge=Math.pow(key,22)*.72;
      const reflect=Math.exp(-Math.pow((nx+.6)/.11,2))*.33;
      const light=.065+key*.13+softbox+edge+reflect;
      const tint=Math.max(0,nx*.7+ny*.3+.12)*.43+rim*.21;
      const depth=.80+(face.z+2.8)*.037;
      const rgb=color.map((v,k)=>Math.min(255,Math.round(((k===2?209:218)*light+v*tint)*depth)));
      ctx.fillStyle=ctx.strokeStyle=`rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.closePath();ctx.fill();ctx.stroke();
    }
    host.classList.add('is-rendered');
  }
  const running = () => document.body.dataset.motion !== 'off' && !document.hidden && inView && (!gl || !gl.isContextLost());
  function tick(timestamp) {
    frame=0;
    if (!running()) { previous=0; return; }
    if (!previous) previous=timestamp;
    const delta=timestamp-previous;
    if (delta >= (lowPower ? 1000/24 : 1000/30)) {
      time += Math.min(delta,80)/1000; previous=timestamp;
      smoothX+=(pointerX-smoothX)*.065; smoothY+=(pointerY-smoothY)*.065;
      render();
    }
    frame=requestAnimationFrame(tick);
  }
  function sync() {
    color=colors[document.body.dataset.palette]||colors.lime;
    if (!running()) { cancelAnimationFrame(frame); frame=0;previous=0; }
    render();
    if (running()&&!frame) frame=requestAnimationFrame(tick);
  }
  function resize() {
    const rect=host.getBoundingClientRect();w=Math.max(1,rect.width);h=Math.max(1,rect.height);
    dpr=Math.min(devicePixelRatio||1,lowPower?1.25:1.5);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);sync();
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(host);
  else addEventListener('resize',resize,{passive:true});
  if ('IntersectionObserver' in window) new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;sync();},{threshold:0}).observe(host);
  if (!coarse) {
    const hero=document.getElementById('home');
    hero.addEventListener('pointermove',e=>{const rect=hero.getBoundingClientRect();pointerX=(e.clientX-rect.left)/rect.width-.5;pointerY=(e.clientY-rect.top)/rect.height-.5;},{passive:true});
    hero.addEventListener('pointerleave',()=>{pointerX=pointerY=0;},{passive:true});
  }
  document.addEventListener('visibilitychange',sync);
  addEventListener('gf:appearance',sync);
  resize();
})();
