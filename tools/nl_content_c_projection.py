"""Project runtime projection from the pinned Mobile source shards. Never edits source."""
from pathlib import Path
import json, hashlib

def read(path):
    return json.loads(path.read_text(encoding="utf-8"))

def valid_units(npc):
    result={}
    for u in npc.get("formation") or []:
        slot=u.get("formationSlot")
        if isinstance(slot,int) and not isinstance(slot,bool) and 0<=slot<9 and slot not in result and len(result)<5:
            result[slot]=u
    return result

def positive(v,default):
    return v if isinstance(v,(int,float)) and not isinstance(v,bool) and v>0 else default

def project_map(m,index):
    raw=sorted(m["npcs"],key=lambda n:(n.get("order") if isinstance(n.get("order"),int) else 99999,str(n["id"])))
    candidates=[(n,valid_units(n)) for n in raw if valid_units(n) and "FORMATION_NOT_EXHAUSTIVE" not in (n.get("blockers") or [])]
    rows=[]
    for n in raw:
        observed=valid_units(n)
        donors=sorted([(d,u) for d,u in candidates if d["id"]!=n["id"]],
                      key=lambda du:(bool(du[0].get("boss"))!=bool(n.get("boss")),abs(positive(du[0].get("level"),1)-positive(n.get("level"),1)),str(du[0]["id"])))
        donor,peer=donors[0] if donors else (None,{})
        incomplete=not observed or "FORMATION_NOT_EXHAUSTIVE" in (n.get("blockers") or [])
        combined=dict(observed)
        if incomplete:
            for slot,u in peer.items():
                if len(combined)>=5: break
                if slot not in combined: combined[slot]=u
        if not combined: combined={4:{}}
        units=[]
        for slot,u in sorted(combined.items()):
            fallback=peer.get(slot) or next(iter(peer.values()),{})
            source=slot in observed
            label=u.get("troopName") or fallback.get("troopName") or "Bộ"
            skill=(u.get("skill") or {}).get("label") or (fallback.get("skill") or {}).get("label") or "Chiến pháp"
            soldiers=positive(u.get("soldiers"),positive(fallback.get("soldiers"),positive(n.get("totalSoldiersRaw"),300)/len(combined)))
            units.append([slot,u.get("name") or n.get("name") or "Quân địch",label,skill,round(soldiers),
                          round(positive(u.get("level"),positive(n.get("level"),1))),
                          "OBSERVED_SLOT" if source else "SIMULATED_SLOT",
                          donor["id"] if donor and (not source or not u.get("soldiers") or not u.get("troopName") or not (u.get("skill") or {}).get("label")) else None])
        rows.append({"id":n["id"],"name":n.get("name") or n["id"],"level":round(positive(n.get("level"),1)),
                     "boss":bool(n.get("boss")),"units":units,
                     "donor":donor["id"] if donor and incomplete else None,
                     "sourceFormationIncomplete":incomplete,
                     "sourceSkillLabels":True,"provenance":"PROJECT_SIMULATED"})
    return {"id":m["id"],"name":m.get("name") or m["id"],"sourceLevel":m.get("mapLevel"),
            "gate":min(28,1+index*28//249),"npcs":rows}

def project_mobile_map(m,index,legacy_map):
    """Use current Vietnamese records; mark source-empty formations as projected."""
    legacy_by_id={n["id"]:n for n in legacy_map["npcs"]}
    source_rows=m["npcs"]
    donor_candidates=[(i,n) for i,n in enumerate(source_rows) if n["units"]]
    def legacy_units(n):
        old=legacy_by_id.get(n["id"])
        if not old:return []
        roles=(("bộ","infantry"),("thương","spear"),("kỵ","cavalry"),("cung","archer"),("văn","strategist"),("mưu","strategist"))
        result=[]
        for x in old["units"]:
            label=str(x[2]).casefold();role=next((r for word,r in roles if word in label),"support")
            result.append({"slot":x[0],"name":x[1],"role":role,"skill":{"name":x[3]},
                           "sourceHp":x[4],"level":x[5],"sourceTroopId":None,"sourceTroopType":x[2],
                           "effects":[],"provenance":"SIMULATED_LEGACY_FORMATION"})
        return result
    def units_for(n,index):
        if n["units"]:return n["units"],None,False
        old_units=legacy_units(n)
        if old_units:return old_units,n["id"],True
        if not donor_candidates:return [],None,True
        _,donor=min(donor_candidates,key=lambda pair:(abs(pair[0]-index),pair[0]))
        return [{**u,"provenance":"SIMULATED_NEAREST_WIKI_FORMATION"} for u in donor["units"]],donor["id"],True
    def source_summary(n):
        src=n["source"]
        return {k:src.get(k) for k in ("ident","type","level","troops","merit","power","fastAttack","qtyLimit","drops","souls","effects")}
    rows=[]
    for npc_index,n in enumerate(source_rows):
        source_units,donor,incomplete=units_for(n,npc_index)
        units=[]
        for u in source_units:
            source_hp=u.get("sourceHp")
            default_troops=positive(n["source"].get("troops"),1)/max(1,len(source_units))
            units.append({"slot":u["slot"],"name":u["name"],"role":u["role"],
                          "skill":u.get("skill") or {"name":"Chiến pháp"},
                          "troops":positive(source_hp,default_troops),
                          "level":round(positive(u.get("level"),positive(n["source"].get("level"),1))),
                          "sourceTroopId":u.get("sourceTroopId"),"sourceTroopType":u.get("sourceTroopType"),
                          "sourceHp":source_hp,"sourceSkillName":(u.get("skill") or {}).get("name"),
                          "effects":u.get("effects") or [],
                          "sourceEffectsOwnerNpcId":n["id"] if not incomplete else donor,
                          "provenance":u.get("provenance") or
                            ("SIMULATED_DONOR_FORMATION" if incomplete else "SOURCE_EXACT_WITH_P2_ADAPTER")})
        rows.append({"id":n["id"],"name":n["name"],"level":round(positive(n["source"].get("level"),1)),
                     "boss":n["boss"],"kind":n["source"].get("type"),"units":units,
                     "source":source_summary(n),"sourceUrl":n["sourceUrl"],"donor":donor,
                     "sourceFormationIncomplete":incomplete,"sourceSkillLabels":True,
                     "provenance":"CURRENT_VNG_MOBILE_SOURCE_P2_ADAPTER" if not incomplete else "SOURCE_RECORD_WITH_SIMULATED_FORMATION"})
    return {"id":"wiki-map-"+m["sourceId"],"sourceId":m["sourceId"],"name":m["name"],"sourceLevel":m.get("mapLevel"),
            "sourceUnlockLevel":m.get("unlockLevel"),"sourceSub":m.get("sub"),
            "sourceHard":m.get("hard"),"sourceMain":m.get("isMain"),"sourceHidden":m.get("isHidden"),
            "sourceRewards":m.get("battleRewards",[]),"sourceAchievementRewards":m.get("achievementRewards",[]),
            "sourceBuffs":m.get("buffs",[]),"sourceUrl":m["sourceUrl"],
            "gate":min(28,1+index*28//249),"gateProvenance":"SIMULATED_COMPRESSED_TO_NATIVE_28_STAGE_CAMPAIGN",
            "npcs":rows}

# Translate source targeting and effect intent to the existing P2 descriptor only.
# Raw Mobile coefficients use a different scale; never apply them directly.
def project_stage_skill(f):
    label=f["skillName"]
    operations=f.get("events") or f.get("operations") or []
    damage=[e for e in operations if e.get("op")=="DAMAGE"]
    heals=[e for e in operations if str(e.get("op","")).startswith("HEAL")]
    primary=damage[0] if damage else {}
    lane=(primary.get("lane") or f.get("lane") or "").upper()
    kind="magic" if lane in ("STRATEGY","MAGIC","SUPPORT") else "tactic" if lane=="TACTIC" else "physical"
    pattern={"ENEMY_COLUMN":"column","ENEMY_ROW":"row","ONE_ENEMY_BACK_ROW":"back","ALL_ENEMIES":"all"}.get(primary.get("target"),"single")
    if heals and not damage:
        pattern="heal";kind="magic"
    elif pattern=="single" and positive(primary.get("hits"),1)>=2:
        pattern="double"
    base={"single":1.65,"double":.94,"row":1.04,"column":1.04,"back":1.48,"all":.78,"heal":1.15}[pattern]
    d={"tag":label,"pattern":pattern,"kind":kind,"mult":base}
    if pattern=="heal": d["healCount"]=3 if any(e.get("target")=="ALL_ALLIES" for e in heals) else 2
    # Preserve representable intents, not unsupported conditional rates/secondary hits.
    for e in operations:
        op=e.get("op"); target=str(e.get("target",""));effect=str(e.get("effect","")).casefold()
        if op=="MORALE" and isinstance(e.get("base"),(int,float)):
            if e["base"]<0 and "ENEMY" in target:d["drainMorale"]=min(25,max(8,round(-e["base"]/4)))
            elif e["base"]>0 and ("ALLY" in target or "ALLIES" in target):d["bonusMorale"]=min(18,max(5,round(e["base"]/5)))
        if op=="DEFENSE_REDUCTION" and "ENEMY" in target:
            d.setdefault("apply","break");d.setdefault("applyChance",.65)
        if op=="STATUS":
            if "ENEMY" in target:
                status=next((v for k,v in [("thiêu","burn"),("hỏa","burn"),("ngủ","sleep"),("choáng","daze"),("hỗn loạn","daze"),("khóa vây","morale-seal"),("sợ hãi","fear")] if k in effect),None)
                if status:
                    d.setdefault("apply",status);d.setdefault("applyChance",min(.8,max(.15,(e.get("probabilityPct") or 50)/100)))
            elif target=="SELF":
                status=next((v for k,v in [("thiết bích","ironwall"),("hộ thuẫn","ward"),("thủ hộ","guard")] if k in effect),None)
                if status:d.setdefault("applyAlly",status)
    if pattern=="heal" and "bonusMorale" not in d:d["bonusMorale"]=6
    return d

def build(root):
    base=root/"data/ngoalong/modules"
    from nl_mobile_seal_v2 import normalize as normalize_seal_v2
    from nl_mobile_troops_v1 import normalize as normalize_mobile_troops
    from nl_mobile_campaign_v1 import normalize as normalize_mobile_campaign
    mobile_seals,_=normalize_seal_v2(root)
    mobile_troops,_=normalize_mobile_troops()
    folder=base/"campaign/source_shards"
    manifest=read(folder/"manifest.json")
    maps=[]; seen=set(); npc_ids=set()
    for filename in sorted(set(p["shard"] for p in manifest["mapLocator"].values())):
        for m in read(folder/filename)["maps"]:
            pointer=manifest["mapLocator"][m["id"]]
            if m["id"] in seen or pointer["npcCount"]!=len(m["npcs"]): raise ValueError("C map mismatch")
            seen.add(m["id"]); maps.append(m)
            for n in m["npcs"]:
                if n["id"] in npc_ids: raise ValueError("C duplicate NPC")
                npc_ids.add(n["id"])
    if len(maps)!=249 or len(npc_ids)!=4903 or seen!=set(manifest["mapLocator"]): raise ValueError("C legacy Save crosswalk drift")
    maps.sort(key=lambda m:m["wikiMapId"])
    legacy_projected=[project_map(m,i) for i,m in enumerate(maps)]
    mobile_campaign,_=normalize_mobile_campaign(root)
    mobile_raw=root/"data/ngoalong/research/mobile_wiki_2026-11-26/full_public_raw"
    mobile_manifest=read(mobile_raw/"capture_manifest.json")
    mobile_file_hashes={row["file"]:row["sha256"] for row in mobile_manifest.get("files",[])}
    buff_path=mobile_raw/"data/buff-page.json"
    buff_hash=hashlib.sha256(buff_path.read_bytes()).hexdigest()
    if mobile_file_hashes.get("data/buff-page.json")!=buff_hash:
        raise ValueError("C mobile buff catalogue source hash mismatch")
    raw_buffs=read(buff_path)
    if len(raw_buffs)!=320:
        raise ValueError("C mobile buff catalogue coverage drift")
    mobile_buffs={str(key):{k:v for k,v in row.items() if k!="icon"}
                  for key,row in raw_buffs.items()}
    if len(mobile_campaign["maps"])!=len(legacy_projected): raise ValueError("C Mobile map coverage drift")
    legacy_ids={m["id"]:{n["id"] for n in m["npcs"]} for m in legacy_projected}
    legacy_by_map={m["id"]:m for m in legacy_projected}
    projected=[project_mobile_map(m,i,legacy_by_map.get("wiki-map-"+m["sourceId"],{"npcs":[]}))
               for i,m in enumerate(mobile_campaign["maps"])]
    source_ids={m["id"]:{n["id"] for n in m["npcs"]} for m in projected}
    if any(not ids.issubset(source_ids.get(mid,set())) for mid,ids in legacy_ids.items()):
        raise ValueError("C Mobile campaign would drop existing Save NPC IDs")
    if sum(len(m["npcs"]) for m in projected)!=5063: raise ValueError("C Mobile campaign NPC count drift")
    wiki=read(base/"heroes/wiki_catalogue_v1.json")["heroes"]
    alpha=read(root/"data/ngoalong/alpha_content.json")
    old=alpha["heroes"]["projectRoster"]; existing={h["id"] for h in alpha["heroes"]["hero207Roster"]}
    norm=lambda x:x.strip().casefold()
    aliases={}; additions=[]; awakenings={}
    handoff={x["heroId"]:x for x in read(base/"heroes/skills_handoff_v1.json")["heroes"]}
    evidence={x["heroId"]:x for x in read(base/"heroes/hero_source_evidence_matrix_v4.json")["entries"]}
    def authored_skill(label,lane,target):
        lane=(lane or "").upper()
        kind="magic" if lane in ("STRATEGY","MAGIC") else "tactic" if lane=="TACTIC" else "physical"
        pattern={"ENEMY_COLUMN":"column","ENEMY_ROW":"row","ONE_ENEMY_BACK_ROW":"back","ALL_ENEMIES":"row"}.get(target,"single")
        return {"tag":label,"pattern":pattern,"kind":kind,"mult":1.4 if pattern=="single" else 1.05}
    for h in wiki:
        facts=handoff.get(h["id"],{}).get("stageSkills") or []
        dated=sorted([f for f in facts if f.get("skillName")],key=lambda f:str(f.get("sourceDate") or ""),reverse=True)
        if dated:
            f=dated[0]
            stages={}
            for fact in dated:
                stage=str(fact.get("stage") or "").upper()
                if stage in ("ORANGE","GOLD","PURPLE") and stage not in stages:
                    stages[stage]={"descriptor":project_stage_skill(fact),"sourceDate":fact.get("sourceDate"),"sourceUrl":fact.get("sourceUrl")}
            awakenings[h["id"]]={"descriptor":project_stage_skill(f),"stages":stages,
                                  "sourceDate":f.get("sourceDate"),"sourceUrl":f.get("sourceUrl"),"status":"DATED_MOBILE_INTENT_PROJECT_EFFECT"}

    if len(wiki)!=364 or len(existing)!=207: raise ValueError("C hero source drift")
    for index,h in enumerate(wiki):
        hid=h["id"]
        if hid in existing: aliases[hid]=hid;continue
        match=[x for x in old if norm(x["name"])==norm(h["name"])]
        same=[x for x in wiki if norm(x["name"])==norm(h["name"])]
        if len(match)==1 and len(same)==1: aliases[hid]=match[0]["id"];continue
        digest=int(hashlib.sha256(hid.encode()).hexdigest()[:8],16)
        kind=["infantry","cavalry","archer","strategist","support"][digest%5]
        pattern,damage,tag=[("single","physical","Phá Trận"),("column","tactic","Xung Phong"),("back","physical","Xuyên Vân"),("row","magic","Hỏa Mưu"),("heal","magic","Hộ Quân")][digest%5]
        role=["Tiền quân","Đột kích","Hậu kích","Mưu sĩ","Hỗ trợ"][digest%5]
        label=tag+" · "+h["name"]
        desc={"pattern":pattern,"kind":damage,"mult":1.45+(digest%20)/100,"tag":label}
        if pattern=="heal": desc.update(healCount=2,bonusMorale=8)
        if kind=="strategist": desc.update(drainMorale=18)
        historic=(evidence.get(hid,{}).get("evidenceLanes",{}).get("classicBase2012_2013") or [])
        record=historic[0] if len(historic)==1 else {}
        attrs=record.get("attributes") or {}
        source_skill=record.get("baseSkillName")
        acquisition=record.get("acquisition") or {}
        if source_skill:
            label=source_skill
            desc["tag"]=label
        # Distinct tactical variants within the five archetypes, deterministic by ID.
        variant=(digest>>16)%4
        if kind=="infantry":
            if variant==0:desc.update(apply="break",applyChance=.5)
            elif variant==1:desc.update(applyAlly="guard")
            elif variant==2:desc.update(pierce=.12)
            else:desc.update(crit=.10)
        elif kind=="cavalry":
            if variant==0:desc.update(drainMorale=15)
            elif variant==1:desc.update(pattern="single",mult=1.65,crit=.12)
            elif variant==2:desc.update(apply="daze",applyChance=.25)
            else:desc.update(pattern="double",mult=.88)
        elif kind=="archer":
            if variant==0:desc.update(crit=.15)
            elif variant==1:desc.update(pierce=.15)
            elif variant==2:desc.update(pattern="row",mult=.95)
            else:desc.update(apply="break",applyChance=.35)
        elif kind=="strategist":
            if variant==0:desc.update(apply="burn",applyChance=.55)
            elif variant==1:desc.update(pattern="single",mult=1.55,apply="sleep",applyChance=.35)
            elif variant==2:desc.update(pattern="all",mult=.75)
            else:desc.update(apply="morale-seal",applyChance=.45)
        else:
            if variant==0:desc.update(cleanseNegative=1)
            elif variant==1:desc.update(applyAlly="ward")
            elif variant==2:desc.update(healCount=3,mult=.98)
            else:desc.update(bonusMorale=15)
        tower_gate=acquisition.get("minFloor") if acquisition.get("type")=="TRIAL_TOWER" else None
        if not isinstance(tower_gate,int) or not 1<=tower_gate<=100: tower_gate=None
        additions.append({"id":hid,"name":h["name"],"faction":h.get("faction"),"sourceGrade":h.get("indexGrade"),
                          "type":kind,"role":role,"rarity":"Danh tướng","icon":["🛡️","🐎","🏹","🪶","📜"][digest%5],
                          "lead":round(positive(attrs.get("leadership"),65+digest%25)),"atk":round(positive(attrs.get("martial"),48+digest%40)),"def":45+(digest>>4)%40,"int":round(positive(attrs.get("intelligence"),48+(digest>>8)%40)),"agi":45+(digest>>12)%35,
                          "skill":label,"skillDesc":"Chiến pháp thiết kế mô phỏng: "+desc["pattern"],"descriptor":desc,
                          "gate":1+index%28,"silver":650+50*(index%28),"towerGate":tower_gate,"soulCost":max(100,round(positive(acquisition.get("soulCost"),1000)/10)) if tower_gate else 0,"classicReference":record.get("sourceUrl"),"provenance":"PROJECT_SIMULATED"})
        aliases[hid]=hid
    if len(aliases)!=364 or len(set(aliases.values()))!=364: raise ValueError("C hero alias collision")
    return {"source":"CURRENT_VNG_MOBILE_WIKI_VIETNAMESE_WITH_PROJECT_P2_ADAPTER",
            "sourceEdition":mobile_campaign["sourceEdition"],"maps":projected,"heroes":additions,"heroAliases":aliases,"awakeningSkills":{aliases[k]:v for k,v in awakenings.items()},"mobileSeals":mobile_seals,"mobileTroops":mobile_troops,
            "mobileBuffCatalog":{"sourceEdition":mobile_campaign["sourceEdition"],"captureEdition":mobile_manifest["sourceEdition"],"sourcePath":"data/buff-page.json","sourceSha256":buff_hash,"records":mobile_buffs},
            "counts":{"maps":249,"npcs":5063,"legacyNpcCount":4903,"wikiHeroes":364,"mobileTroops":408,"mobileBuffs":len(mobile_buffs),"newHeroes":len(additions),"datedAwakenings":len(awakenings),"runtimeHeroes":14+207+len(additions)}}
