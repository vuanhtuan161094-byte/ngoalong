"""Derive exact name/icon bindings from the captured VNG Mobile Wiki.
Download during authorized asset build only. Report all missing assets; runtime offline."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import base64, hashlib, io, json, re, urllib.request
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
RAW=ROOT/"data/ngoalong/research/mobile_wiki_2026-11-26/full_public_raw/data"
CDN="https://cdn-mainsite-aka.vnggames.com/products/mwly/landing/2026-ngoa-long-wiki-clone/icons/"
def pack_mobile_icons(cache):
    cache.mkdir(parents=True,exist_ok=True)
    def load(name):return json.loads((RAW/name).read_text(encoding="utf-8"))
    records={}
    def add(kind,row):
        name=row.get("name");icon=row.get("icon")
        if not isinstance(name,str) or not isinstance(icon,str) or not re.fullmatch(r"[A-Za-z0-9_.-]+",icon) or not icon.lower().endswith((".png",".jpg",".jpeg",".webp")):return
        records.setdefault(kind,{})[name]=icon
    for row in load("seal-detail.json").values():
        if isinstance(row,dict):add("seal",row)
    for row in load("unit-detail.json")["units"].values():
        if isinstance(row,dict):add("troop",row)
    for force in load("elite-detail.json")["forces"]:
        add("elite",force)
        for appearance in force.get("appearances",[]):
            add("elite",appearance)
            for skill in appearance.get("skills",[]):add("skill",skill)
    gear_meta={}
    for filename,kind in (("equip-detail.json","equipment"),("tuongkhi-detail.json","heroGear")):
        for row in load(filename)["items"]:
            if not isinstance(row,dict):continue
            key=str(row.get("id",""))
            if not key:continue
            add(kind,dict(row,name=key))
            if key in records.get(kind,{}):
                gear_meta.setdefault(kind,{})[key]={k:row.get(k) for k in ("name","typeName","quality","qualityName")}
    names=sorted({icon for rows in records.values() for icon in rows.values()})
    def pull(icon):
        path=cache/icon
        try:
            if path.exists():raw=path.read_bytes()
            else:
                req=urllib.request.Request(CDN+icon,headers={"User-Agent":"Mozilla/5.0"})
                with urllib.request.urlopen(req,timeout=8) as r:raw=r.read(2_000_001)
                if len(raw)>2_000_000:raise ValueError("Icon too large")
            with Image.open(io.BytesIO(raw)) as src:
                if src.width*src.height>4_000_000:raise ValueError("Image dimensions too large")
                im=src.convert("RGBA");im.thumbnail((192,192),Image.Resampling.LANCZOS)
                buf=io.BytesIO();im.save(buf,format="WEBP",quality=88,method=4)
            if not path.exists():path.write_bytes(raw)
            return icon,{"uri":"data:image/webp;base64,"+base64.b64encode(buf.getvalue()).decode("ascii"),"sha256":hashlib.sha256(raw).hexdigest()},None
        except Exception as e:return icon,None,str(e)[:160]
    got={};failures={}
    with ThreadPoolExecutor(max_workers=16) as pool:
        for icon,data,error in pool.map(pull,names):
            if data:got[icon]=data
            else:failures[icon]=error
    result={kind:{name:got[icon]["uri"] for name,icon in rows.items() if icon in got} for kind,rows in records.items()}
    report={"source":CDN,"requested":len(names),"downloaded":len(got),"bindings":{k:len(v) for k,v in result.items()},"missing":failures,"hashes":{k:v["sha256"] for k,v in got.items()}}
    (cache/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
    print("NL premium source icons:",json.dumps({k:v for k,v in report.items() if k not in ("hashes","missing")},ensure_ascii=False))
    result["gearMeta"]=gear_meta
    return result
