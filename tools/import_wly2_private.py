#!/usr/bin/env python3
"""Local-only WLY2 atlas importer. No source Lua execution, no public asset commit."""
import argparse, base64, hashlib, json, plistlib, re, urllib.request
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

ROOT = Path(__file__).resolve().parents[1]
PIN = "2270db0984a6455cf3b0f33b553fb80d97d91da8"
BASE = "https://raw.githubusercontent.com/MatrixHan/-111111/" + PIN + "/"
PREFIX = "project_wly2_lua_client/res/animation/soldier/"
# Source Soldiers.lua names and action IDs; adaptation to our families, not Mobile parity.
FAMILIES = {"infantry":"BZ1000","spear":"BZ2000","cavalry":"BZ3000",
            "archer":"BZ4000","strategist":"BZ5100","drum":"BZ5230"}

def numbers(s):
    return [int(float(x)) for x in re.findall(r"-?\d+(?:\.\d+)?", s)]

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--authorized-local-use",action="store_true",required=True,
                    help="Confirm permission to use the third-party assets locally")
    ap.add_argument("--out",type=Path,default=Path.home()/"ngoalong-wly2-private")
    ap.add_argument("--all-assets",action="store_true",help="Also cache all indexed soldier/VFX files")
    args=ap.parse_args()
    out=args.out.expanduser().resolve()
    if out==ROOT or ROOT in out.parents:
        raise SystemExit("Private assets/output must be outside the public repository")
    out.mkdir(parents=True,exist_ok=True)
    inv=json.loads((ROOT/"data/ngoalong_external_reference_inventory_20261127.json").read_text(encoding="utf-8"))
    records={r["path"]:r for group in inv["inventory"] for r in group["files"]}
    def pull(path):
        rec=records[path]
        dest=out/"source"/path
        def valid(raw):
            return len(raw)==rec["bytes"] and hashlib.sha1(("blob "+str(len(raw))+"\0").encode()+raw).hexdigest()==rec["blob_sha"]
        if dest.exists() and valid(dest.read_bytes()): return dest.read_bytes()
        req=urllib.request.Request(BASE+path,headers={"User-Agent":"Ngoalong-local-atlas-review"})
        with urllib.request.urlopen(req,timeout=90) as r: raw=r.read(rec["bytes"]+1)
        if not valid(raw): raise ValueError("Source hash mismatch: "+path)
        dest.parent.mkdir(parents=True,exist_ok=True)
        dest.write_bytes(raw)
        return raw
    paths=[PREFIX+code+"_"+str(side)+"."+ext for code in FAMILIES.values()
           for side in (1,2) for ext in ("png","plist","txt")]
    if args.all_assets:
        paths=sorted(set(paths)|{p for p in records if "/res/animation/" in p})
    with ThreadPoolExecutor(max_workers=4) as pool:
        for _ in pool.map(pull,paths): pass
    pack={}
    gaps=[]
    for family,code in FAMILIES.items():
        for side in (1,2):
            stem=code+"_"+str(side)
            raw=pull(PREFIX+stem+".png")
            if not raw.startswith(b"\x89PNG\r\n\x1a\n"): raise ValueError(stem)
            frames=plistlib.loads(pull(PREFIX+stem+".plist"))["frames"]
            data={}
            for name,m in frames.items():
                x,y,rw,rh=numbers(m["textureRect"])
                ox,oy=numbers(m["spriteOffset"])
                fw,fh=numbers(m["spriteSourceSize"])
                tw,th=numbers(m["spriteSize"])
                rot=bool(m["textureRotated"])
                sw,sh=(th,tw) if rot else (tw,th)
                data[name]=[x,y,sw,sh,rot,ox,oy,fw,fh,tw,th]
            clips={}
            for line in pull(PREFIX+stem+".txt").decode("utf-8-sig").splitlines():
                action,rest=line.split(":",1)
                names=rest.split(";",1)[0].split(",")
                keys=[stem+"_"+name+".png" for name in names]
                missing=[k for k in keys if k not in data]
                if missing:
                    gaps.append({"atlas":stem,"action":action,"missing":missing})
                # Keep genuine frames in their original sequence; never invent image cells.
                present=[k for k in keys if k in data]
                if present:
                    clips[action]=present
            if not clips.get("idle") or not clips.get("attack"):
                raise ValueError("Atlas lacks essential idle/attack: "+stem)
            pack[family+"/"+str(side)]={"png":base64.b64encode(raw).decode(),"frames":data,"clips":clips}
    (out/"atlas-import-gaps.json").write_text(json.dumps(gaps,ensure_ascii=False,indent=2),encoding="utf-8")
    print("Source clip gaps:",len(gaps),json.dumps(gaps,ensure_ascii=False))
    from build_ngoa_long_items_v1 import INDEX, payload, render
    html=render(INDEX.read_text(encoding="utf-8"),payload(private_wly2=pack))
    target=out/"index.html"
    target.write_text(html,encoding="utf-8",newline="")
    print("Local preview:",target,"atlases:",len(pack),"cached files:",len(paths))
    print("SHA256:",hashlib.sha256(target.read_bytes()).hexdigest())
    print("Do not publish or commit this preview. Visual orientation/scale and VFX need review.")

if __name__=="__main__":
    main()
