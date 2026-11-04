G = {'V0':('#F6F5F2','#151515'),'V1':('#F2C230','#151515'),'V2':('#3AA86B','#151515'),'V3':('#4D86E0','#151515'),
     'V4':('#E0533F','#151515'),'V5':('#EE8FBD','#151515'),'V6':('#9B7AD8','#151515'),'V7':('#151515','#F1F0EB')}
def chip(g, cls='chip'):
    bg,fg=G[g]; return f'<span class="{cls}" style="background:{bg};color:{fg}">{g}</span>'

def barcode(seq):
    return '<div class="barcode">'+''.join(f'<i style="background:{G[g][0]};flex:{w}"></i>' for g,w in seq)+'</div>'

def nav(on):
    items=[('Log','<path d="M5 12h14M12 5v14"/>'),('Calendar','<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>'),('Progress','<path d="M4 19l5-6 4 3 7-9"/>')]
    return '<nav class="nav">'+''.join(f'<span class="{"on" if n==on else ""}"><svg viewBox="0 0 24 24">{p}</svg>{n}</span>' for n,p in items)+'</nav>'

def ring(pct, label):
    r=26; c=2*3.14159*r; d=c*pct/100
    return f'''<svg class="ring" viewBox="0 0 64 64"><circle cx="32" cy="32" r="{r}" class="rt"/>
<circle cx="32" cy="32" r="{r}" class="ra" stroke-dasharray="{d:.1f} {c:.1f}" transform="rotate(-90 32 32)"/>
<text x="32" y="37" text-anchor="middle" class="rn">{label}</text></svg>'''

def log():
    week=''.join(f'<span class="{c}"><b>{d}</b><i></i></span>' for d,c in zip('MTWTFSS',['','','','','','done','today']))
    return f'''
<div class="top"><div class="date">Mon 2 Nov</div><h1>Today</h1></div>
<div class="seg"><span class="on">Climbing</span><span>Strength</span></div>
<div class="card start"><div class="gym"><span class="pin"></span><div><b>Default V-Scale</b><small>Change gym</small></div></div>
<button class="pill acc">Start climbing</button></div>
<div class="grid2">
 <div class="card w"><div class="wl"><span class="ic" style="--c:#3AA86B"></span>Last climb</div>
  <div class="num">2<u>sends</u></div><div class="sub">Sat · 1 h 20</div>{barcode([('V0',1),('V3',1)])}</div>
 <div class="card w"><div class="wl"><span class="ic" style="--c:#E0533F"></span>Best last time</div>
  <div class="best">{chip('V4','chip lg')}</div><div class="sub">0% flashed</div></div>
</div>
<div class="card"><div class="wl"><span class="ic" style="--c:var(--acc)"></span>This week<em>1 session · 2 sends</em></div>
 <div class="week">{week}</div></div>
{nav('Log')}'''

def logger():
    tiles=''.join(f'<span class="tile{" sel" if g=="V4" else ""}" style="background:{G[g][0]};color:{G[g][1]}">{g}</span>' for g in G)
    rows=''.join(f'<div class="row">{chip(g)}<span>{t}</span><em>{m}</em></div>' for g,t,m in [('V4','Send','2 min ago'),('V3','Flash','9 min ago'),('V3','Send','14 min ago')])
    return f'''
<div class="bar"><span class="x">✕</span><span class="timer"><i></i>00:42</span></div>
<div class="top"><div class="date">Climbing session</div><h1>Default V-Scale</h1></div>
<div class="tiles">{tiles}</div>
<div class="acts"><button class="pill ink">Send V4</button><button class="pill acc">Flash</button></div>
<div class="card"><div class="wl"><span class="ic" style="--c:var(--acc)"></span>This session<em>3 climbs</em></div>
{barcode([('V3',1),('V3',1),('V4',1)])}<div class="rows">{rows}</div></div>
<button class="pill ghost end">End session</button>'''

def progress():
    pyr=[('V0',0,3),('V1',1,1),('V2',2,1),('V3',2,3),('V4',0,1)]
    mx=5
    prow=''.join(f'<div class="py">{chip(g)}<div class="pb"><i class="f" style="width:{f/mx*100}%"></i><i class="s" style="width:{s/mx*100}%"></i></div><b>{f+s}</b></div>' for g,f,s in pyr)
    # line chart, hardest send by week
    pts=[(0,3),(1,3),(2,3),(3,4)]
    X=lambda i:20+i*86; Y=lambda v:100-(v-2)*28
    path=' '.join(('M' if i==0 else 'L')+f'{X(i)},{Y(v)}' for i,(_,v) in enumerate(pts))
    area=path+f' L{X(3)},110 L{X(0)},110 Z'
    grid=''.join(f'<line x1="20" x2="300" y1="{Y(v)}" y2="{Y(v)}" class="gl"/><text x="0" y="{Y(v)+4}" class="ax">V{v}</text>' for v in (2,3,4,5))
    dots=''.join(f'<circle cx="{X(i)}" cy="{Y(v)}" r="{5 if i==3 else 3.5}" class="{"ld" if i==3 else "dd"}"><title>Week {i+1}: V{v}</title></circle>' for i,(_,v) in enumerate(pts))
    bars=[0,0,4,0,0,1,0,0]
    bsvg=''.join(f'<rect x="{8+i*37}" y="{90-v*18 if v else 86}" width="22" height="{v*18 if v else 4}" rx="{6 if v else 2}" class="{"bb" if v else "b0"}"><title>{v} sessions</title></rect>' for i,v in enumerate(bars))
    return f'''
<div class="top"><h1>Progress</h1></div>
<div class="seg"><span class="on">Climbing</span><span>Strength</span></div>
<div class="seg sm"><span>W</span><span>M</span><span>3M</span><span>Y</span><span class="on">All</span></div>
<div class="grid3">
 <div class="card w"><div class="wl">Hardest</div><div class="best">{chip('V4','chip lg')}</div><div class="sub">since 17 Oct</div></div>
 <div class="card w"><div class="wl">Sends</div><div class="num">14</div><div class="sub">5 sessions</div></div>
 <div class="card w c"><div class="wl">Flashed</div>{ring(36,'36%')}<div class="sub">5 of 14</div></div>
</div>
<div class="card"><div class="wl">Grade pyramid<em><i class="k f"></i>Flash <i class="k s"></i>Send</em></div>{prow}</div>
<div class="card"><div class="wl">Hardest send<em>by week</em></div>
<svg viewBox="0 0 310 126" class="lc"><defs><linearGradient id="ag{{ID}}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--acc)" stop-opacity=".35"/><stop offset="1" stop-color="var(--acc)" stop-opacity="0"/></linearGradient></defs>
{grid}<path d="{area}" fill="url(#ag{{ID}})"/><path d="{path}" class="ln"/>{dots}<text x="20" y="124" class="ax">21 Sep</text><text x="300" y="124" class="ax" text-anchor="end">26 Oct</text></svg></div>
<div class="card"><div class="wl">Sessions<em>last 8 weeks</em></div><svg viewBox="0 0 300 96" class="bc">{bsvg}</svg></div>'''

CSS = '''
*{box-sizing:border-box;margin:0}
body{font-family:'Sofia Sans',system-ui,sans-serif;background:#d9d9d6;color:#151515;padding:40px 32px 80px}
.page{margin:0 auto}header,.ref,.verdict{max-width:1200px}
header h1{font:800 56px/1 'Sofia Sans Extra Condensed';letter-spacing:-.01em}
header p{font-size:17px;max-width:62ch;margin-top:12px;line-height:1.45}
.ref{margin:28px 0 8px;background:#fff;border-radius:16px;padding:20px}
.ref img{width:100%;border-radius:8px;display:block}
.ref ul{margin:16px 0 0 18px;columns:2;font-size:15px;line-height:1.6}
.ref h2,.sec h2{font:800 30px/1.1 'Sofia Sans Extra Condensed';margin:0 0 6px}
.sec{margin-top:44px}
.sec>p{font-size:15px;color:#555;margin-bottom:16px}
.cols{display:flex;gap:22px;overflow-x:auto;padding-bottom:10px}
.col{flex:0 0 auto}
.col h3{font:700 15px/1.2 'Sofia Sans';margin-bottom:8px}
.col h3 small{display:block;font-weight:500;color:#666;font-size:13px}
.col img{width:340px;border-radius:30px;display:block;box-shadow:0 0 0 1px #0002}
.verdict{margin-top:48px;background:#fff;border-radius:16px;padding:24px 28px;max-width:900px}
.verdict table{border-collapse:collapse;width:100%;font-size:15px;margin-top:10px}
.verdict td,.verdict th{padding:8px 10px;border-bottom:1px solid #eee;text-align:left}
.verdict th{font-weight:700}
.verdict td:not(:first-child),.verdict th:not(:first-child){text-align:center;width:120px}
.verdict p{font-size:15px;line-height:1.5;margin-top:12px}

/* ---- modern phone ---- */
.m{--acc:#22B0A0;--bg:#F1F2F6;--card:#fff;--ink:#16171A;--mute:#7E818B;--line:#E7E8ED;--tr:#E7E8ED;--send:#B9BBC3;--flash:#16171A;
 width:340px;height:756px;border-radius:30px;overflow:hidden;position:relative;background:var(--bg);color:var(--ink);
 padding:22px 16px 90px;box-shadow:0 0 0 1px #0002;font-family:'Sofia Sans'}
.m::before{content:"";position:absolute;inset:-120px -60px auto;height:330px;background:radial-gradient(60% 60% at 50% 40%,color-mix(in srgb,var(--acc) 30%,transparent),transparent 70%);pointer-events:none}
.m>*{position:relative}
.m.dk{--bg:#000;--card:#17181B;--ink:#F2F2F4;--mute:#8C8F98;--line:#26272B;--tr:#2A2B30;--send:#55575E;--flash:#F2F2F4}
.m.dk::before{background:radial-gradient(60% 60% at 50% 40%,color-mix(in srgb,var(--acc) 22%,transparent),transparent 70%)}
.m.pink{--acc:#EE8FBD}.m.purple{--acc:#9B6BEA}
.m .top{margin:8px 4px 14px}
.m .date{font-size:14px;color:var(--mute);font-weight:500}
.m h1{font:600 32px/1.1 'Sofia Sans';letter-spacing:-.02em;margin-top:2px}
.m .seg{display:flex;background:color-mix(in srgb,var(--card) 70%,transparent);border-radius:999px;padding:4px;margin-bottom:12px;backdrop-filter:blur(10px);box-shadow:inset 0 0 0 1px var(--line)}
.m .seg span{flex:1;text-align:center;padding:9px 0;border-radius:999px;font-weight:600;font-size:15px;color:var(--mute)}
.m .seg span.on{background:var(--ink);color:var(--bg)}
.m .seg.sm span{padding:6px 0;font-size:13px}
.m .card{background:var(--card);border-radius:20px;padding:14px;margin-bottom:10px}
.m .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.m .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
.m .grid2 .card,.m .grid3 .card{margin-bottom:10px}
.m .wl{display:flex;align-items:center;gap:7px;font-size:14px;font-weight:600;color:var(--ink)}
.m .wl em{margin-left:auto;font-style:normal;font-weight:500;color:var(--mute);font-size:13px;display:flex;align-items:center;gap:5px}
.m .ic{width:18px;height:18px;border-radius:6px;background:color-mix(in srgb,var(--c) 22%,transparent);position:relative}
.m .ic::after{content:"";position:absolute;inset:5px;border-radius:3px;background:var(--c)}
.m .num{font:300 44px/1 'Sofia Sans';letter-spacing:-.03em;margin-top:10px;font-variant-numeric:tabular-nums}
.m .num u{text-decoration:none;font-size:15px;font-weight:500;color:var(--mute);margin-left:4px;letter-spacing:0}
.m .sub{font-size:13px;color:var(--mute);margin-top:4px;font-weight:500}
.m .best{margin-top:10px}
.m .chip{display:inline-grid;place-items:center;min-width:30px;height:22px;padding:0 6px;border-radius:7px;font:700 13px 'Sofia Sans';box-shadow:inset 0 0 0 1px #0001}
.m .chip.lg{height:44px;min-width:56px;font-size:24px;border-radius:12px}
.m .pill{border:0;border-radius:999px;font:700 17px 'Sofia Sans';padding:15px 0;width:100%;cursor:pointer}
.m .pill.acc{background:var(--acc);color:#151515}
.m .pill.ink{background:var(--ink);color:var(--bg)}
.m .pill.ghost{background:transparent;color:var(--mute);box-shadow:inset 0 0 0 1.5px var(--line)}
.m .start .gym{display:flex;gap:10px;align-items:center;margin-bottom:12px}
.m .start .gym b{display:block;font-size:16px}.m .start .gym small{font-size:13px;color:var(--mute)}
.m .pin{width:36px;height:36px;border-radius:12px;background:color-mix(in srgb,var(--acc) 20%,transparent);position:relative}
.m .pin::after{content:"";position:absolute;inset:11px;border-radius:50%;background:var(--acc)}
.m .barcode{display:flex;gap:2px;height:14px;margin-top:12px;border-radius:5px;overflow:hidden}
.m .barcode i{display:block;box-shadow:inset 0 0 0 1px #0001}
.m .week{display:flex;justify-content:space-between;margin-top:12px}
.m .week span{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:12px;color:var(--mute)}
.m .week b{font-weight:600}
.m .week i{width:30px;height:30px;border-radius:50%;background:var(--tr)}
.m .week .done i{background:var(--acc)}
.m .week .today i{box-shadow:inset 0 0 0 2px var(--ink);background:transparent}
.m .nav{position:absolute;left:16px;right:16px;bottom:16px;display:flex;justify-content:space-around;background:color-mix(in srgb,var(--card) 85%,transparent);backdrop-filter:blur(14px);border-radius:999px;padding:8px;box-shadow:0 6px 24px #0000001a,inset 0 0 0 1px var(--line)}
.m .nav span{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px;font-weight:600;color:var(--mute);padding:4px 16px;border-radius:999px}
.m .nav span.on{color:var(--ink);background:color-mix(in srgb,var(--acc) 25%,transparent)}
.m .nav svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.m .bar{display:flex;justify-content:space-between;align-items:center;margin:0 4px}
.m .x{width:36px;height:36px;border-radius:50%;background:var(--card);display:grid;place-items:center;font-size:14px}
.m .timer{display:flex;align-items:center;gap:6px;background:var(--card);border-radius:999px;padding:7px 12px;font-weight:700;font-variant-numeric:tabular-nums}
.m .timer i{width:8px;height:8px;border-radius:50%;background:var(--acc)}
.m .tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px}
.m .tile{height:62px;border-radius:16px;display:grid;place-items:center;font:700 22px 'Sofia Sans';box-shadow:inset 0 0 0 1px #0001}
.m .tile.sel{box-shadow:0 0 0 3px var(--bg),0 0 0 5px var(--ink)}
.m .acts{display:grid;grid-template-columns:1.4fr 1fr;gap:8px;margin-bottom:12px}
.m .rows{margin-top:6px}
.m .row{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--line);font-size:15px;font-weight:500}
.m .row:last-child{border:0}
.m .row em{margin-left:auto;font-style:normal;color:var(--mute);font-size:13px}
.m .end{position:absolute;left:16px;right:16px;bottom:18px;width:auto}
.m .grid3 .card{padding:12px 10px}
.m .grid3 .num{font-size:38px}
.m .grid3 .chip.lg{height:38px;min-width:50px;font-size:21px}
.m .grid3 .c{display:flex;flex-direction:column;align-items:center}
.m .grid3 .c .wl{align-self:flex-start}
.m .ring{width:52px;height:52px;margin-top:6px}
.m .rt{fill:none;stroke:var(--tr);stroke-width:7}.m .ra{fill:none;stroke:var(--acc);stroke-width:7;stroke-linecap:round}
.m .rn{font:700 14px 'Sofia Sans';fill:var(--ink)}
.m .py{display:flex;align-items:center;gap:8px;margin-top:9px}
.m .py .chip{width:34px}
.m .pb{flex:1;display:flex;gap:2px;height:16px}
.m .pb i{display:block;height:100%;border-radius:5px}
.m .pb .f{background:var(--flash)}.m .pb .s{background:var(--send)}
.m .py b{width:16px;font-size:14px;font-weight:600;text-align:right}
.m .k{display:inline-block;width:9px;height:9px;border-radius:3px}.m .k.f{background:var(--flash)}.m .k.s{background:var(--send);margin-left:6px}
.m svg.lc,.m svg.bc{width:100%;margin-top:8px;display:block}
.m .gl{stroke:var(--line);stroke-width:1}
.m .ax{font:500 11px 'Sofia Sans';fill:var(--mute)}
.m .ln{fill:none;stroke:var(--ink);stroke-width:2;stroke-linejoin:round}
.m .dd{fill:var(--ink)}.m .ld{fill:var(--acc);stroke:var(--card);stroke-width:2}
.m .bb{fill:var(--acc)}.m .b0{fill:var(--tr)}
/* hybrid: Bright layout, Gear B numbers and titles */
.m.hy h1{font:800 38px/1 'Sofia Sans Extra Condensed';letter-spacing:0}
.m.hy .num{font:800 46px/1 'Sofia Sans Extra Condensed';letter-spacing:0}
.m.hy .grid3 .num{font-size:42px}
.m.hy .chip,.m.hy .tile{font-family:'Sofia Sans Extra Condensed';font-weight:800}
.m.hy .chip.lg{font-size:28px}.m.hy .tile{font-size:26px}
.m.hy .wl{font-weight:700}
'''

VAR = [('', 'Bright-style', 'light, teal'), ('dk', 'Bright-style', 'dark, teal'), ('hy', 'Bright layout + Gear B type', 'light, teal'), ('hy dk purple', 'Bright layout + Gear B type', 'dark, purple')]
GEARB = {'log':('gearb/cmp-0.png','gearb/cmp-1.png'),'logger':('gearb/cmp-2.png','gearb/cmp-3.png'),'progress':('gearb/prog-climb-light.png','gearb/prog-climb-dark.png')}
uid=[0]
def phone(cls, body):
    uid[0]+=1; return f'<div class="m {cls}">{body.replace("{ID}",str(uid[0]))}</div>'

def section(key, title, note, fn):
    gl,gd = GEARB[key]
    cols=f'<div class="col"><h3>Gear B<small>light, current guide</small></h3><img src="{gl}" style="height:756px;object-fit:cover;object-position:top"></div>'
    for cls,t,s in VAR: cols+=f'<div class="col"><h3>{t}<small>{s}</small></h3>{phone(cls, fn())}</div>'
    cols+=f'<div class="col"><h3>Gear B<small>dark, current guide</small></h3><img src="{gd}" style="height:756px;object-fit:cover;object-position:top"></div>'
    return f'<section class="sec"><h2>{title}</h2><p>{note}</p><div class="cols">{cols}</div></section>'

html=f'''<!doctype html><html><head><meta charset="utf-8"><title>ASCEND: Bright-style vs Gear B</title>
<link href="https://fonts.googleapis.com/css2?family=Sofia+Sans+Extra+Condensed:wght@400..900&family=Sofia+Sans:wght@300..800&display=swap" rel="stylesheet">
<style>{CSS}</style></head><body><div class="page">
<header><h1>Bright-style vs Gear B</h1><p>Same data, same features, same pills. Scroll each row sideways. The Bright-style phones are live HTML, so hover the charts for values.</p></header>
<div class="ref"><h2>What Bright OS does</h2><img src="bright/strip.png" alt="Bright OS App Store screenshots">
<ul><li>Soft grey canvas with a colour wash at the top</li><li>White cards with 20px corners, no heavy shadows</li>
<li>Big light-weight numbers with small grey units</li><li>Each metric has its own colour and icon</li>
<li>Segmented pill controls (D / W / M / 3M / Y)</li><li>Rings, gradient bars and a stage "barcode" for sleep</li>
<li>Floating pill tab bar</li><li>Pure black dark mode with bright data colours</li></ul></div>
{section('log','Log (Today)','Bright idea used: a session as a strip of grade colours, like Bright\'s sleep-stage bar.',log)}
{section('logger','Climb logger','Rounded grade tiles, timer pill, and the same session strip on top of the list.',logger)}
{section('progress','Progress (climbing)','All the same stats and charts. The flash rate comes back as a ring, which is a Bright move.',progress)}
<div class="verdict"><h2>Scores out of 10</h2>
<table><tr><th></th><th>Gear B</th><th>Bright-style</th><th>Hybrid</th></tr>
<tr><td>Looks modern</td><td>6</td><td>8.5</td><td>8</td></tr>
<tr><td>Feels like a climbing app, not a health app</td><td>8.5</td><td>5</td><td>7.5</td></tr>
<tr><td>Readable mid-session, chalky hands, arm's length</td><td>8.5</td><td>7</td><td>8.5</td></tr>
<tr><td>Accent picker still works</td><td>8</td><td>9</td><td>9</td></tr>
<tr><td>Less "AI-made"</td><td>8</td><td>6</td><td>7.5</td></tr>
<tr><th>Overall</th><th>7.5</th><th>7.1</th><th>8.1</th></tr></table>
<p><b>Recommendation: the hybrid.</b> Take Bright's structure (soft canvas, 20px cards, colour wash, rings, floating tab bar, segmented range pills) and keep Gear B's condensed numbers and grade tiles. Pure Bright-style looks the most modern but reads as a generic health app, and its thin numbers are harder to read from a wall.</p></div>
</div></body></html>'''
open('/Users/ryanchoong/code/ASCEND/brandkit/reviews/modern-vs-gear-b.html','w').write(html)
