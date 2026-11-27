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
    (out/"runtime-pack.json").write_text(json.dumps(pack,separators=(",",":")),encoding="utf-8")
if __name__=="__main__":main()
