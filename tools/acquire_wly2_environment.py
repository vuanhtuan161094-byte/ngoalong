#!/usr/bin/env python3
"""Fetch and verify the WLY2 city/world/battle/UI/audio source inventory.
Build image contact sheets and stitched source maps for visual selection.
Does not execute client code or modify gameplay.
"""
import argparse, hashlib, json, re, urllib.request, math, base64, io
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--out",type=Path,required=True)
    args=ap.parse_args(); out=args.out;out.mkdir(parents=True,exist_ok=True)
    m=json.loads((ROOT/"data/ngoalong_wly2_environment_inventory.json").read_text())
    base="https://raw.githubusercontent.com/"+m["repository"]+"/"+m["pin"]+"/"
    files=[f for g in m["groups"] for f in g["files"]]
    def pull(f):
        dest=out/"source"/f["path"]
        def ok(b):return len(b)==f["bytes"] and hashlib.sha1(("blob "+str(len(b))+chr(0)).encode()+b).hexdigest()==f["blob_sha"]
        if dest.exists() and ok(dest.read_bytes()):return
        for attempt in range(3):
            try:
                with urllib.request.urlopen(urllib.request.Request(base+f["path"],headers={"User-Agent":"Ngoalong-environment-acquisition"}),timeout=90) as r:b=r.read(f["bytes"]+1)
                if not ok(b):raise ValueError("hash mismatch "+f["path"])
                dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(b);return
            except Exception:
                if attempt==2:raise
    with ThreadPoolExecutor(max_workers=6) as pool:
        for _ in pool.map(pull,files):pass
    review=out/"review";review.mkdir(exist_ok=True)
    for g in m["groups"]:
        name=g["directory"].split("/res/")[-1].replace("/","-")
        pics=[out/"source"/f["path"] for f in g["files"] if f["path"].lower().endswith((".png",".jpg",".jpeg"))]
        if not pics:continue
        if name in ("map-castle","map-world"):
            tiles={}
            for path in pics:
                match=re.fullmatch(r"(\d+)_(\d+)",path.stem)
                if match:tiles[tuple(map(int,match.groups()))]=path
            if tiles:
                # Source MapImage.lua names tiles row_column; infer regular tile size.
                h=max(y for y,x in tiles)+1;w=max(x for y,x in tiles)+1
                assert len(tiles)==h*w,(name,len(tiles),h,w)
                with Image.open(tiles[(0,0)]) as a: tw,th=a.size
                with Image.open(tiles[(h-1,w-1)]) as a: ew,eh=a.size
                canvas=Image.new("RGB",((w-1)*tw+ew,(h-1)*th+eh))
                for (y,x),path in tiles.items():
                    with Image.open(path) as im:canvas.paste(im.convert("RGB"),(x*tw,y*th))
                canvas.thumbnail((2000,1400),Image.Resampling.LANCZOS)
                canvas.save(review/(name+".webp"),quality=88)
            continue
        for start in range(0,len(pics),80):
            batch=pics[start:start+80]; cols=8; cw,ch=156,132
            im=Image.new("RGB",(cols*cw,math.ceil(len(batch)/cols)*ch),(37,44,49));d=ImageDraw.Draw(im)
            for i,path in enumerate(batch):
                x=i%cols*cw;y=i//cols*ch
                with Image.open(path) as a:
                    a=a.convert("RGBA");a.thumbnail((cw-8,ch-22));im.paste(a,(x+(cw-a.width)//2,y+3),a)
                d.text((x+5,y+ch-18),path.name,fill="white")
            im.save(review/(name+"-"+str(start//80+1)+".jpg"),quality=88)
    report={"verifiedFiles":len(files),"bytes":sum(f["bytes"] for f in files),"groups":[{"directory":g["directory"],"files":len(g["files"])} for g in m["groups"]]}
    (review/"report.json").write_text(json.dumps(report,indent=2))
    print(json.dumps(report))
    # Runtime derivatives retain original map pixels and sprite transparency.
    def url(raw):return "data:image/webp;base64,"+base64.b64encode(raw).decode("ascii")
    def image_url(p,limit):
        with Image.open(p) as im:
            im=im.convert("RGBA")
            im.thumbnail(limit,Image.Resampling.LANCZOS)
            buf=io.BytesIO();im.save(buf,format="WEBP",quality=87,method=4)
            return url(buf.getvalue())
    root=out/"source"/"project_wly2_lua_client/res/img"
    # Representative art mappings, not claims about exact WLY2 building identities.
    buildings={"palace":"zd.png","farm":"nt1.png","market":"mj3.png","mine":"dzs.png",
               "barracks":"xby.png","academy":"jg.png","tavern":"clf.png"}
    pack={"schema":1,"verifiedFiles":len(files),"pin":m["pin"],
          "castle":url((review/"map-castle.webp").read_bytes()),
          "world":url((review/"map-world.webp").read_bytes()),
          "battle":image_url(root/"bg/battle/BF_006.png",(1400,800)),
          "buildings":{k:image_url(root/"building/maincity"/v,(384,384)) for k,v in buildings.items()},
          "buildingSource":buildings}
    ui_names={"panel":"g01_00001.png","buttonGold":"g02_000001.png","buttonGreen":"g02_000002.png","navActive":"g02_000081.png"}
    ui_names.update({"resourceSilver":"03_0002.png","resourceGrain":"03_0007.png","resourcePrestige":"03_0004.png","resourceMerit":"03_0001.png","resourceOrder":"03_0005.png","resourceGold":"03_0003.png","resourceScore":"03_0014.png","resourceToken":"03_0013.png","navIdle":"g02_000080.png","selected":"g01_0025.png","frame":"g01_0039_1.png","header":"g01_000023.png","divider":"g01_000043.png","panelSoft":"g01_0036.png"})
    pack["ui"]={k:image_url(root/"common/ui"/v,(640,320)) for k,v in ui_names.items()}
    pack["battleAlternates"]=[image_url(root/"bg/battle"/v,(1400,800)) for v in ("BF_007.png","ZDGC0001.jpg")]
    pack["presentation"]={"tower":image_url(root/"main_city/s03_0007023.png",(300,300)),"towerBackground":image_url(root/"bg/battle/ZDGC0001.jpg",(1200,800)),"arenaBackground":image_url(root/"bg/battle/BF_007.png",(1200,800))}
    pack["buildingAlternates"]={v:image_url(root/"building/maincity"/v,(384,384)) for v in ("nt2.png","xby2.png","mj2.png","dzs2.png","phb.png","sr.png")}
    # Complete source UI catalogue is available offline for subsequent semantic bindings.
    pack["uiLibrary"]={p.name:image_url(p,(512,512)) for p in sorted((root/"common/ui").glob("*.png"))}
    pack["uiCoverage"]={"selected":len(ui_names),"available":len(pack["uiLibrary"])}
    soundroot=out/"source"/"project_wly2_lua_client/res/sound"
    sound_names={"click":"UItongyongdianji.ogg","preview":"UIdianjijianzhu.ogg","strike":"Attack_hit_1.ogg",
                 "victory":"UIzhandoushengli.ogg","defeat":"UIzhandoushibai.ogg",
                 "cityMusic":"zhucheng.ogg","battleMusic":"zhandou.ogg"}
    sound_names.update({"building":"UIdianjijianzhu.ogg","resource":"UIshouhuoyinliang.ogg","recruit":"UIhuodewujiang.ogg","upgrade":"UIshengjichenggong.ogg","research":"UIyanjiu.ogg","equip":"UIzhuangbeichenggong.ogg","switch":"UItongyongqieye.ogg","back":"UItongyongfanhui.ogg","start":"UIkaizhan.ogg","formation":"UIchuzhan.ogg","reward":"UItyhuoqujiangli.ogg","error":"UItywufajinxing.ogg","skill":"Special_Attack_1.ogg","ranged":"Normal_Attack2.ogg","melee":"Normal_Attack1.ogg","magic":"Special_Attack_2.ogg","worldMusic":"guozhan.ogg","campaignMusic":"fuben.ogg","towerMusic":"shilianta.ogg","arenaMusic":"jingjichang.ogg"})
    sound_names.update({f"hit{i}":f"Attack_hit_{i}.ogg" for i in range(1,14)})
    pack["audio"]={k:"data:audio/ogg;base64,"+base64.b64encode((soundroot/v).read_bytes()).decode("ascii") for k,v in sound_names.items()}
    pack["audioSource"]=sound_names
    pack["uiSource"]=ui_names
    from acquire_nl_premium_icons import pack_mobile_icons
    pack["mobileIcons"]=pack_mobile_icons(out/"mobile-icons")
    (out/"runtime-pack.json").write_text(json.dumps(pack,separators=(",",":")),encoding="utf-8")
if __name__=="__main__":main()
