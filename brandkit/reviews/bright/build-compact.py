import sys; sys.path.insert(0,'/tmp/ascend-shots/build')
import modern as M
G,chip,barcode,nav,ring=M.G,M.chip,M.barcode,M.nav,M.ring

def stat(label,val,sub,dot=None):
    d=f'<i class="gd" style="background:{G[dot][0]}"></i>' if dot else ''
    return f'<div class="st"><span class="sl">{label}</span><b class="sv">{val}{d}</b><span class="ss">{sub}</span></div>'

def log_c():
    week=''.join(f'<span class="{c}"><b>{d}</b><i></i></span>' for d,c in zip('MTWTFSS',['','','','','','done','today']))
    return f'''
<div class="top"><div class="date">Mon 2 Nov</div><h1>Today</h1></div>
<div class="seg"><span class="on">Climbing</span><span>Strength</span></div>
<div class="gymrow"><span class="gdot"></span><b>Default V-Scale</b><span class="chg">Change gym</span></div>
<button class="pill acc big">Start climbing</button>
<div class="card"><div class="wl">Last climb<em>Sat · 1 h 20</em></div>
<div class="stats">{stat('Sends','2','2 climbs')}{stat('Best','V4','hardest','V4')}{stat('Flashed','0%','0 of 2')}</div>
{barcode([('V0',1),('V3',1)])}</div>
<div class="card"><div class="wl">This week<em>1 session · 2 sends · 0 sets</em></div><div class="week">{week}</div></div>
{nav('Log')}'''

def progress_c():
    pyr=[('V0',0,3),('V1',1,1),('V2',2,1),('V3',2,3),('V4',0,1)]; mx=5
    prow=''.join(f'<div class="py">{chip(g)}<div class="pb"><i class="f" style="width:{f/mx*100}%"><title>{f} flashed</title></i><i class="s" style="width:{s/mx*100}%"></i></div><b>{f+s}</b></div>' for g,f,s in pyr)
    pts=[3,3,3,4]; X=lambda i:24+i*92; Y=lambda v:118-(v-2)*34
    path=' '.join(('M' if i==0 else 'L')+f'{X(i)},{Y(v)}' for i,v in enumerate(pts))
    area=path+f' L{X(3)},130 L{X(0)},130 Z'
    grid=''.join(f'<line x1="24" x2="300" y1="{Y(v)}" y2="{Y(v)}" class="gl"/><text x="0" y="{Y(v)+4}" class="ax">V{v}</text>' for v in (2,3,4,5))
    dots=''.join(f'<circle cx="{X(i)}" cy="{Y(v)}" r="{5 if i==3 else 3.5}" class="{"ld" if i==3 else "dd"}"><title>Week {i+1}: V{v}</title></circle>' for i,v in enumerate(pts))
    bars=[0,0,4,0,0,1,0,0]
    bsvg=''.join(f'<rect x="{10+i*37}" y="{100-v*20 if v else 96}" width="22" height="{v*20 if v else 4}" rx="{6 if v else 2}" class="{"bb" if v else "b0"}"><title>{v} sessions</title></rect>' for i,v in enumerate(bars))
    return f'''
<div class="top"><h1>Progress</h1></div>
<div class="seg"><span class="on">Climbing</span><span>Strength</span></div>
<div class="seg sm"><span>W</span><span>M</span><span>3M</span><span>Y</span><span class="on">All</span></div>
<div class="card"><div class="stats">{stat('Hardest','V4','since 17 Oct','V4')}{stat('Sends','14','5 sessions')}{stat('Flashed','36%','5 of 14')}</div></div>
<div class="card"><div class="wl">Grade pyramid<em><i class="k f"></i>Flash <i class="k s"></i>Send</em></div>{prow}</div>
<div class="card gc"><div class="wl">Hardest send<em>by week</em></div>
<svg viewBox="0 0 310 150" class="lc"><defs><linearGradient id="cg{{ID}}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--acc)" stop-opacity=".35"/><stop offset="1" stop-color="var(--acc)" stop-opacity="0"/></linearGradient></defs>
{grid}<path d="{area}" fill="url(#cg{{ID}})"/><path d="{path}" class="ln"/>{dots}<text x="24" y="148" class="ax">21 Sep</text><text x="300" y="148" class="ax" text-anchor="end">26 Oct</text></svg></div>
<div class="card gc"><div class="wl">Sessions<em>last 8 weeks</em></div><svg viewBox="0 0 300 108" class="bc">{bsvg}</svg></div>'''

def logger_c():
    return M.logger()

CSS2 = '''
/* compact: tight data, roomy graphs */
.m.cp{padding:16px 12px 84px}
.m.cp .top{margin:4px 4px 10px}
.m.cp h1{font:800 34px/1 'Sofia Sans Extra Condensed';letter-spacing:0}
.m.cp .seg{margin-bottom:8px;padding:3px}.m.cp .seg span{padding:7px 0;font-size:14px}.m.cp .seg.sm span{padding:5px 0;font-size:12.5px}
.m.cp .card{border-radius:16px;padding:10px 12px;margin-bottom:8px}
.m.cp .card.gc{padding:16px 16px 14px;border-radius:20px;margin-bottom:10px}
.m.cp .stats{display:grid;grid-template-columns:repeat(3,1fr);margin-top:2px}
.m.cp .wl+.stats{margin-top:8px}
.m.cp .st{display:flex;flex-direction:column;padding:0 10px;border-left:1px solid var(--line)}
.m.cp .st:first-child{border:0;padding-left:0}
.m.cp .sl{font-size:13px;font-weight:600;color:var(--mute)}
.m.cp .sv{font:800 36px/1.05 'Sofia Sans Extra Condensed';display:flex;align-items:center;gap:6px;margin-top:2px}
.m.cp .gd{width:8px;height:8px;border-radius:50%;box-shadow:inset 0 0 0 1px #0002}
.m.cp .ss{font-size:12.5px;color:var(--mute);font-weight:500}
.m.cp .barcode{height:10px;margin-top:10px}
.m.cp .gymrow{display:flex;align-items:center;gap:8px;padding:2px 4px 8px;font-size:14px}.m.cp .gdot{width:8px;height:8px;border-radius:50%;background:var(--acc)}.m.cp .chg{margin-left:auto;color:var(--mute);font-weight:600;font-size:13px;text-decoration:underline;text-underline-offset:3px}
.m.cp .pill.big{margin-bottom:8px;padding:14px 0}
.m.cp .py{margin-top:6px}.m.cp .pb{height:12px}.m.cp .pb i{border-radius:4px}
.m.cp .chip{height:20px;font-family:'Sofia Sans Extra Condensed';font-weight:800;font-size:14px}
.m.cp .week{margin-top:8px}.m.cp .week i{width:26px;height:26px}
.m.cp .tile{font-family:'Sofia Sans Extra Condensed';font-weight:800;font-size:26px}
.m.cp svg.lc,.m.cp svg.bc{margin-top:12px}
'''

def col(t,s,inner): return f'<div class="col"><h3>{t}<small>{s}</small></h3>{inner}</div>'
uid=[100]
def ph(cls,body):
    uid[0]+=1; return f'<div class="m {cls}">{body.replace("{ID}",str(uid[0]))}</div>'

def section(title,note,old,new):
    c=col('Previous hybrid','light',ph('hy',old()))+col('Compact','light, teal',ph('hy cp',new()))+col('Compact','dark, teal',ph('hy cp dk',new()))+col('Compact','dark, purple',ph('hy cp dk purple',new()))
    return f'<section class="sec"><h2>{title}</h2><p>{note}</p><div class="cols">{c}</div></section>'

html=f'''<!doctype html><html><head><meta charset="utf-8"><title>ASCEND: compact hybrid</title>
<link href="https://fonts.googleapis.com/css2?family=Sofia+Sans+Extra+Condensed:wght@400..900&family=Sofia+Sans:wght@300..800&display=swap" rel="stylesheet">
<style>{M.CSS}{CSS2}</style></head><body><div class="page">
<header><h1>Compact hybrid</h1><p>Two changes from the last round. The hardest grade is now plain text with a small tape dot, not a big coloured block. Stats sit tight in one row; graphs keep the roomy cards.</p></header>
{section('Progress','Stats in one row, so the pyramid and both graphs move up. Graph cards keep extra padding and taller plots.',M.progress,progress_c)}
{section('Log (Today)','Start button on its own, last climb as one stat row with the session strip under it.',M.log,log_c)}
</div></body></html>'''
open('/Users/ryanchoong/code/ASCEND/brandkit/reviews/compact-hybrid.html','w').write(html)
