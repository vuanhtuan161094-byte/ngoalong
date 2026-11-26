"""Single native P2 finish owner: route extra objectives instead of old campaign loot."""
def apply_c_native(source):
    pairs=[
      ("const catk=Math.round((h.atk*.68+d.level*5.3+eq.horseAtk*1.8)*amp*(1+f.atk)*(1+nlTechValue('atkMultiplierBonus')));",
       "const catk=Math.round((h.atk*.68+d.level*5.3+eq.horseAtk*1.8+(eq.catk||0))*amp*(1+f.atk)*(1+nlTechValue('atkMultiplierBonus')));"),
      ("const matk=Math.round((h.int*.67+d.level*4.3+eq.int)*amp*(1+f.int)*(1+nlTechValue('matkMultiplierBonus')));",
       "const matk=Math.round((h.int*.67+d.level*4.3+eq.int+(eq.matk||0))*amp*(1+f.int)*(1+nlTechValue('matkMultiplierBonus')));"),
      ("speed:h.agi+d.level*2,crit:f.crit+(h.type==='archer'?.10:.04),morale:",
       "speed:h.agi+d.level*2,crit:f.crit+(h.type==='archer'?.10:.04)+(eq.crit||0),morale:"),
      ("if(battle.won){countTask('battle');if(mode==='campaign'){",
       "if(battle.won){countTask('battle');if(battle.nlContentC){rewards=nlContentCSettle(battle.nlContentC);log('Thắng trận '+battle.nlContentC.title);}else if(mode==='campaign'){"),
      ("addExp(u.id,battle.won?95+stage*12:25);",
       "addExp(u.id,battle.won?(battle.nlContentC?.xp||95+stage*12):25);"),
      ("const title=mode==='tower'?\x60Tháp tầng ${stage}\x60:mode==='arena'?'Lôi Đài':entry[0];",
       "const title=battle.nlContentC?.title||(mode==='tower'?\x60Tháp tầng ${stage}\x60:mode==='arena'?'Lôi Đài':entry[0]);")
    ]
    for old,new in pairs:
        if source.count(new)==1: continue
        if source.count(old)!=1: raise ValueError("C native P2 source drift: "+old[:80])
        source=source.replace(old,new,1)
    return source
