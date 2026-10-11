import sys; sys.path.insert(0,'.')
from screens import Screen, frame, load, ICONS
from PIL import Image
import world as Wd
def lab(s,t,x,y,c='gray'): s.text(t,x,y,c,shadow=None)
# A) Enemigos y efectos
s=Screen(); s.rect(0,0,319,179,'dnavy')
s.text('ENEMIGOS',6,6,'white')
items=[('BUG TERRESTRE','sprites/enemies/bug.png',16,16,4),('DRON','sprites/enemies/drone.png',16,12,2),
       ('TORRETA','sprites/enemies/turret.png',16,16,4),('GLITCH','sprites/enemies/glitch.png',16,16,5),
       ('BALA ENEMIGA','sprites/enemies/enemy_bullet.png',6,4,2),('EXPLOSIÓN','sprites/fx/explosion.png',16,16,4)]
for i,(n,p,w,h,k) in enumerate(items):
    x=6+(i%2)*158; y=20+(i//2)*30
    lab(s,n,x,y)
    for f in range(k):
        s.rect(x+f*22,y+9,x+f*22+19,y+28,'navy'); s.put(frame(p,w,h,f),x+f*22+10-w//2,y+19-h//2)
s.text('EFECTOS',6,112,'white')
fx=[('POLVO','sprites/fx/dust.png',8,8,4),('CHISPA','sprites/fx/spark.png',8,8,4),('DESTELLO','sprites/fx/muzzle.png',6,6,2),
    ('PROYECTILES','sprites/player/projectile_0.png',6,3,2)]
x=6
for n,p,w,h,k in fx:
    lab(s,n,x,124)
    for f in range(k):
        s.rect(x+f*12,133,x+f*12+10,143,'navy'); s.put(frame(p,w,h,f),x+f*12+5-w//2,138-h//2)
    x+=max(k*12, len(n)*6)+8
for j in (1,2): s.put(frame(f'sprites/player/projectile_{j}.png',6,3,0),190+j*10,150)
for i,(p,w,h) in enumerate([('sprites/fx/shield_bubble.png',24,28),('sprites/fx/aura.png',20,28),('sprites/fx/trail.png',24,20)]):
    s.put(frame(p,w,h,0),232+i*28,140)
lab(s,'ESCUDO AURA ESTELA',226,170)
s.save('13_enemigos_efectos@4x.png',4)
# B) Obstáculos por zona
s=Screen(); s.rect(0,0,319,179,'dnavy')
s.text('OBSTÁCULOS Y SUELO POR ZONA',6,6,'white')
for zi,z in enumerate(Wd.ZONES):
    y=18+zi*37; k=z['key']
    lab(s,z['name'].upper(),6,y,'cyan')
    t=load(f'tiles/{k}.png')
    for j,ti in enumerate((0,1,4,5)):
        s.put(t.crop((ti*16,0,ti*16+16,16)),6+j*16,y+12)
        s.put(t.crop(((2+(j%2))*16 if j<2 else (ti+2)*16,0,((2+(j%2))*16 if j<2 else (ti+2)*16)+16,16)),6+j*16,y+28) if False else None
    x=84
    for p,w,h in ((f'sprites/obstacles/{k}/low.png',16,16),(f'sprites/obstacles/{k}/spikes.png',16,16),(f'sprites/obstacles/{k}/double.png',32,16),
                  (f'sprites/obstacles/{k}/saw.png',16,16),(f'sprites/obstacles/{k}/air.png',32,8),(f'sprites/obstacles/{k}/wall.png',16,32)):
        im=frame(p,w,h,0) if p.endswith(('saw.png','air.png')) else load(p)
        s.put(im,x,y+33-im.height); x+=im.width+10
s.save('14_obstaculos@4x.png',4)
# C) Pickups y UI
s=Screen(); s.rect(0,0,319,179,'dnavy')
s.text('MONEDA Y POWERUPS',6,6,'white')
for f in range(4): s.put(frame('sprites/pickups/coin.png',8,8,f),8+f*12,20)
for i,n in enumerate(Wd.POWERUP_NAMES):
    x=6+i*52
    s.rect(x,34,x+47,62,'navy'); s.put(frame('sprites/pickups/powerups.png',12,12,i),x+18,38)
    s.text(n.split(' ')[0].upper(),x+24,53,'lgray',align='center',shadow=None)
s.text('INTERFAZ',6,72,'white')
s.button('NORMAL',6,84,60,16,0); s.button('HOVER',72,84,60,16,1); s.button('PRESIONADO',138,84,74,16,2)
s.nine('ui/panel.png',None,220,82,94,22); s.text('PANEL',267,90,'lgray',align='center')
for i in range(len(ICONS)):
    s.put(frame('ui/icons.png',12,12,i),6+i*16,108)
for i,t in enumerate(['jump','crouch','shoot','pause']):
    s.put(frame(f'ui/touch_{t}.png',32,32,0),6+i*38,126,alpha=0.8)
s.put(load('ui/logo.png'),156,124)
s.save('15_pickups_ui@4x.png',4)
# D) Paleta
s=Screen(320,60); s.rect(0,0,319,59,'dnavy')
from pix import ORDER
s.text('PALETA ENDESGA 32',6,5,'white')
for i,k in enumerate(ORDER):
    x=6+(i%16)*19; y=17+(i//16)*20
    s.rect(x,y,x+16,y+16,k)
s.save('16_paleta@4x.png',4)
# E) fondos
for zi in range(4):
    s=Screen(); s.bg(zi+1)
    s.save(f'17_fondo_zona{zi+1}@4x.png',4)
