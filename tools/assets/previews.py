import sys,os; sys.path.insert(0,'.')
from PIL import Image
from pix import Spr, sheet
import character as C, font as F
from screens import Screen, frame, load

base=dict(skin=1,outfit=1,outfitColor=4,hair=2,hairColor=0,accessory=3,weapon=0,name='MIGUE')
# hoja de opciones del editor
s=Screen(320,180); s.rect(0,0,319,179,'dnavy')
def row(label,y,cfgs,names):
    s.text(label,6,y+8,'gray')
    for i,(c,n) in enumerate(zip(cfgs,names)):
        x=78+i*30
        s.rect(x-1,y-1,x+24,y+25,'navy')
        s.player(c,'run1',x+4,y+24)
    return
opts=[('PIEL',[dict(base,skin=i) for i in range(4)],C.SKIN_NAMES),
      ('ROPA',[dict(base,outfit=i) for i in range(4)],C.OUTFITS),
      ('CABELLO',[dict(base,hair=i,accessory=0) for i in range(5)],C.HAIRS),
      ('ACCESORIO',[dict(base,accessory=i) for i in range(5)],C.ACCESSORIES),
      ('ARMA',[dict(base,weapon=i) for i in range(3)],C.WEAPONS)]
for j,(l,c,n) in enumerate(opts): row(l,6+j*34,c,n)
s.text('COLORES',236,8,'gray'); s.text('ROPA',236,40,'dgray'); s.text('CABELLO',236,108,'dgray')
for i in range(8):
    s.player(dict(base,outfitColor=i),'run1',234+(i%4)*20,56+(i//4)*28)
for i in range(6):
    s.player(dict(base,hairColor=i,accessory=0),'run1',234+(i%4)*20,144+(i//4)*28)
s.save('11_opciones_personaje@4x.png',4)
# animaciones del héroe
s=Screen(320,60); s.rect(0,0,319,59,'dnavy')
groups=[('CORRER',C.FRAMES[0:6]),('SALTO',C.FRAMES[6:8]),('AGACHADO',C.FRAMES[8:10]),('DISPARO',C.FRAMES[10:12]),('MUERTE',C.FRAMES[12:16])]
x=6
for name,fr in groups:
    s.text(name,x,6,'gray')
    for f in fr:
        s.rect(x,16,x+17,43,'navy'); s.player(base,f,x+1,42); x+=19
    x+=6
s.text('16 FRAMES DE 16×24 POR CAPA · 10-12 FPS',160,48,'dgray',align='center',shadow=None)
s.save('12_animaciones@4x.png',4)
