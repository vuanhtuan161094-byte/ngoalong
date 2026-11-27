const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const between=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b));
const itemCode=between(read('tools/nl_item_integration_v1.js'),'// === WIKI-TYPED-ITEMS ===','// === END WIKI-TYPED-ITEMS ===');
const eliteCode=between(read('tools/nl_content_c_runtime.js'),'// === WIKI-ELITE-SKILLS ===','// === END WIKI-ELITE-SKILLS ===');
const typed=new Function(itemCode+'\nreturn nlTypedWikiFallback')();
const plan=new Function("const mobileTextKey=x=>String(x).normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/đ/g,'d').toLowerCase();"+eliteCode+'\nreturn mobileElitePlan')();
const source=JSON.parse(read('data/ngoalong/research/mobile_wiki_2026-11-26/full_public_raw/data/item-detail.json')),elite=JSON.parse(read('data/ngoalong/modules/troops/mobile_elite_v1.json'));
test('20 appearances × 3 skill tracks, every source level compiles',()=>{let tracks=0,ranks=0;for(const f of elite.forces)for(const a of f.appearances)for(const [pos,skill] of a.skills.entries()){tracks++;for(const desc of skill.levels){const p=plan(a.id,pos,desc);assert.ok(p);assert.ok(Object.values(p).every(v=>typeof v!=='number'||Number.isFinite(v)));ranks++;}}assert.equal(tracks,60);assert.equal(ranks,256);});
test('27 gems and 9 child manuals resolve to specific wallets',()=>{for(const [g,n,w] of [['Ấn Thạch',27,'hero-gem'],['Bí Tịch',9,'child-manual']]){const rows=source.items.filter(x=>x.typeName===g);assert.equal(rows.length,n);for(const x of rows)assert.equal(typed(x,source,3)?.outputs[0].wallet,w);}});

test('horse growth uses source quantity and commander gate, keys remain materials',()=>{
 const get=id=>source.items.find(x=>String(x.id)===id);
 assert.equal(typed(get('res_79'),source,3).outputs[0].qty,700000);
 assert.equal(typed(get('res_122'),source,3).minCommander,400);
 assert.equal(typed(get('res_125'),source,3).material,true);
});
test('complete loot table preserves named stacks and quantities; partial tables never masquerade as exact',()=>{
 const fixture={items:[{id:'r1',name:'Vải Bạt'}]};
 const row={id:'r2',name:'Rương thử',typeName:'Rương',desc:'Mở nhận: Bạc x100, Vải Bạt x3'};
 const p=typed(row,fixture,2);
 assert.equal(p.route,'named-loot-all');
 assert.deepEqual(p.outputs.map(x=>[x.wallet,x.qty]),[['silver',100],['stack',3]]);
 assert.equal(p.outputs[1].itemId,'mobile-vng-item-r1');
 const incomplete=typed({...row,desc:'Mở nhận: Bạc x100, Vật chưa rõ x2'},fixture,2);
 assert.notEqual(incomplete?.route,'named-loot-all');
 assert.notEqual(incomplete?.route,'known-loot-bundle');
});
