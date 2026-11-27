#!/usr/bin/env python3
"""Build the authorized WLY2 source asset library from hash-pinned originals.
All indexed binary resources retained in cache; only image derivatives embedded.
No source Lua execution or changes to combat state.
"""
import argparse, base64, hashlib, io, json, math, plistlib, re, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
PIN="2270db0984a6455cf3b0f33b553fb80d97d91da8"
BASE="https://raw.githubusercontent.com/MatrixHan/-111111/"+PIN+"/"

def nums(s): return [int(float(n)) for n in re.findall(r"-?\d+(?:\.\d+)?",s)]
def natural(s): return [int(n) if n.isdigit() else n for n in re.split(r"(\d+)",s)]
def pack_image(raw,meta,cell):
    with Image.open(io.BytesIO(raw)) as original:
        im=original.convert("RGBA")
    entries=sorted(meta,key=natural) if meta else ["static"]
    cols=min(8,len(entries)); rows=math.ceil(len(entries)/cols)
    sheet=Image.new("RGBA",(cols*cell,rows*cell))
    index={}
    for i,key in enumerate(entries):
        if meta:
            m=meta[key]
            x,y,_,_=nums(m["textureRect"])
            tw,th=nums(m["spriteSize"])
            fw,fh=nums(m["spriteSourceSize"])
            ox,oy=nums(m["spriteOffset"])
            rot=m["textureRotated"]
            sw,sh=(th,tw) if rot else (tw,th)
            if min(fw,fh,sw,sh)<=0 or x<0 or y<0 or x+sw>im.width or y+sh>im.height:
                raise ValueError("Invalid source rectangle "+key)
            cel=im.crop((x,y,x+sw,y+sh))
            if rot: cel=cel.transpose(Image.Transpose.ROTATE_90)
            canvas=Image.new("RGBA",(fw,fh))
            canvas.paste(cel,(round((fw-tw)/2+ox),round((fh-th)/2-oy)))
        else: canvas=im.copy()
        canvas.thumbnail((cell,cell),Image.Resampling.LANCZOS)
        sheet.paste(canvas,((i%cols)*cell+(cell-canvas.width)//2,(i//cols)*cell+cell-canvas.height))
        index[key]=i
    buf=io.BytesIO()
    sheet.save(buf,format="WEBP",quality=85,method=4)
    return {"webp":base64.b64encode(buf.getvalue()).decode(),"cell":cell,"cols":cols,"frames":len(entries)},index

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--cache",type=Path,required=True)
    ap.add_argument("--out",type=Path,required=True)
    args=ap.parse_args()
    inv=json.loads((ROOT/"data/ngoalong_external_reference_inventory_20261127.json").read_text())
    files={f["path"]:f for g in inv["inventory"] for f in g["files"] if "/res/animation/" in f["path"]}
    def pull(path):
        f=files[path]; target=args.cache/path
        def ok(b): return len(b)==f["bytes"] and hashlib.sha1(("blob "+str(len(b))+chr(0)).encode()+b).hexdigest()==f["blob_sha"]
        if target.exists() and ok(target.read_bytes()): return
        with urllib.request.urlopen(urllib.request.Request(BASE+path,headers={"User-Agent":"Ngoalong-WLY2-production"}),timeout=90) as r:
            b=r.read(f["bytes"]+1)
        if not ok(b): raise ValueError("Hash mismatch "+path)
        target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(b)
    with ThreadPoolExecutor(max_workers=6) as ex:
        for _ in ex.map(pull,files): pass
    output={"schema":1,"pin":PIN,"rawFiles":len(files),"soldiers":{},"effects":{},"gaps":[]}
    def read(p): return (args.cache/p).read_bytes()
    for path in sorted(p for p in files if p.endswith(".png")):
        stem=path[:-4]; name=Path(stem).name; soldier="/soldier/" in path
        try:
            meta=plistlib.loads(read(stem+".plist"))["frames"] if stem+".plist" in files else None
            atlas,index=pack_image(read(path),meta,96 if soldier else 128)
            if soldier and stem+".txt" in files:
                clips={}
                for line in read(stem+".txt").decode("utf-8-sig").splitlines():
                    if not line.strip():continue
                    action,rest=line.split(":",1); names=rest.split(";",1)[0].split(",")
                    keys=[name+"_"+n.strip()+".png" for n in names]
                    good=[index[k] for k in keys if k in index]
                    if len(good)!=len(keys): output["gaps"].append({"id":name,"action":action,"missing":[k for k in keys if k not in index]})
                    if good: clips[action]=good
                if not clips.get("idle") or not clips.get("attack"): raise ValueError("essential clip missing")
                atlas["clips"]=clips
                output["soldiers"][name]=atlas
            else:
                output["effects"][name]=atlas
        except Exception as e:
            output["gaps"].append({"id":name,"error":str(e)})
    if len(output["soldiers"])!=26: raise ValueError("Expected 26 directional troop atlases; got "+str(len(output["soldiers"])))
    if not output["effects"]: raise ValueError("No effects packed")
    args.out.parent.mkdir(parents=True,exist_ok=True)
    args.out.write_text(json.dumps(output,separators=(",",":")),encoding="utf-8")
    report={k:v for k,v in output.items() if k not in ("soldiers","effects")}
    report.update(soldiers=len(output["soldiers"]),effects=len(output["effects"]),bytes=args.out.stat().st_size)
    args.out.with_suffix(".report.json").write_text(json.dumps(report,indent=2),encoding="utf-8")
    print(json.dumps(report))
if __name__=="__main__": main()
