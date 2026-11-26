// Tương tác cho các trang Ngọa Long Wiki: sidebar mobile, nhóm menu gập/mở,
// thanh tab + ô tìm kiếm tự dựng từ chính các section có sẵn trên trang.
(function () {
  var BAT = 'bg-[#c9a24b]/15 text-[#e7d97a] shadow-[inset_0_0_0_1px_rgba(201,162,75,0.4)]'.split(' ');
  var TAT = 'text-white/65 hover:bg-white/[0.06] hover:text-white/90'.split(' ');

  var aside = document.querySelector('[data-nlw-aside]');
  var nen = document.querySelector('[data-nlw-nen]');
  function moMenu(bat) {
    aside.classList.toggle('-translate-x-full', !bat);
    nen.classList.toggle('hidden', !bat);
  }
  document.querySelector('[data-nlw-mo]').addEventListener('click', function () { moMenu(true); });
  nen.addEventListener('click', function () { moMenu(false); });

  [].forEach.call(document.querySelectorAll('[data-nlw-nhom]'), function (nhom) {
    var nut = nhom.querySelector('button');
    var con = nhom.querySelector('[data-nlw-con]');
    nut.addEventListener('click', function () {
      var dangMo = nut.getAttribute('aria-expanded') === 'true';
      nut.setAttribute('aria-expanded', String(!dangMo));
      con.classList.toggle('hidden', dangMo);
      nut.lastElementChild.classList.toggle('rotate-180', !dangMo);
    });
  });


  // Popup chi tiet: noi dung nam san trong <template> cua tung the nen khong goi mang.
  var modal = null;
  var theDangMo = null;

  function dongModal() {
    if (!modal) return;
    modal.remove();
    modal = null;
    if (theDangMo) theDangMo.focus();
    theDangMo = null;
  }

  function moModal(the) {
    var tpl = the.querySelector('template');
    if (!tpl) return;
    dongModal();
    theDangMo = the;
    var anh = the.querySelector('.nlw-anh') || the.querySelector('img');
    modal = document.createElement('div');
    modal.innerHTML = '<div class="nlw-nen"></div>'
      + '<div class="nlw-boc" role="dialog" aria-modal="true"><div class="nlw-khung">'
      + '<div class="nlw-hang">'
      + (anh ? '<span class="nlw-o"><img class="nlw-anh" src="' + anh.getAttribute('src') + '" alt=""></span>' : '')
      + '<div class="nlw-than"><p class="nlw-ct-ten"></p><p class="nlw-ct-phu"></p></div>'
      + '<button type="button" class="nlw-dong" aria-label="Đóng">✕</button>'
      + '</div></div></div>';
    var tenEl = the.querySelector('.nlw-ten') || the.querySelector('[data-nlw-ten]');
    modal.querySelector('.nlw-ct-ten').textContent = tenEl ? tenEl.textContent : '';
    var phu = the.querySelector('.nlw-phu');
    modal.querySelector('.nlw-ct-phu').textContent = phu ? phu.textContent : '';
    modal.querySelector('.nlw-khung').appendChild(tpl.content.cloneNode(true));
    modal.querySelector('.nlw-nen').addEventListener('click', dongModal);
    modal.querySelector('.nlw-dong').addEventListener('click', dongModal);
    document.body.appendChild(modal);
    modal.querySelector('.nlw-dong').focus();
  }

  document.addEventListener('click', function (e) {
    var the = e.target.closest('[data-nlw-mo]');
    if (the) moModal(the);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') return dongModal();
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var the = e.target.closest && e.target.closest('[data-nlw-mo]');
    // nút mở menu cũng mang data-nlw-mo nhưng không có template: chặn phím của nó là khoá luôn menu
    if (!the || !the.querySelector('template')) return;
    e.preventDefault();
    moModal(the);
  });

  var main = document.querySelector('main');
  var groups = [].slice.call(main.querySelectorAll('[data-nlw-group]')).filter(function (g) {
    return g.querySelector('h2');
  });
  if (groups.length < 2) return;

  var tools = document.createElement('div');
  tools.className = 'mt-4 space-y-2.5';
  tools.innerHTML = '<input class="nlw-search w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-white/35" type="search" placeholder="Tìm trong trang…" aria-label="Tìm trong trang">'
    + '<div class="flex flex-wrap gap-1.5"></div>'
    + '<p class="text-xs text-white/45" hidden></p>';
  groups[0].parentNode.insertBefore(tools, groups[0]);

  var tabs = tools.children[1];
  var search = tools.children[0];
  var result = tools.children[2];
  var chon = '';

  function nut(id, nhan, so) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'rounded-lg px-3 py-1.5 text-[13px] transition-colors';
    b.classList.add.apply(b.classList, id === '' ? BAT : TAT);
    b.dataset.target = id;
    b.innerHTML = nhan + ' <span class="text-white/40">' + so + '</span>';
    tabs.appendChild(b);
  }

  nut('', 'Tất cả', main.querySelectorAll('article, [data-nlw-group] > div > a').length);
  groups.forEach(function (g) {
    nut(g.id, g.querySelector('h2').childNodes[0].textContent.trim(), g.querySelectorAll('article').length);
  });

  function loc() {
    var tu = search.value.trim().toLowerCase();
    var hien = 0;
    groups.forEach(function (g) {
      var thuocTab = chon === '' || g.id === chon;
      // gõ tên nhóm thì giữ cả nhóm: tên món đồ thường không lặp lại tên nhóm
      var trungNhom = tu && g.querySelector('h2').textContent.toLowerCase().indexOf(tu) > -1;
      var con = 0;
      [].forEach.call(g.querySelectorAll('article'), function (c) {
        var khop = !tu || trungNhom || c.textContent.toLowerCase().indexOf(tu) > -1;
        c.classList.toggle('hidden', !(thuocTab && khop));
        if (thuocTab && khop) con++;
      });
      g.classList.toggle('hidden', con === 0);
      hien += con;
    });
    result.hidden = !tu;
    result.textContent = tu ? 'Tìm thấy ' + hien + ' mục' : '';
  }

  tabs.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    chon = b.dataset.target;
    [].forEach.call(tabs.children, function (x) {
      var on = x === b;
      x.classList.remove.apply(x.classList, on ? TAT : BAT);
      x.classList.add.apply(x.classList, on ? BAT : TAT);
    });
    loc();
  });

  var cho;
  search.addEventListener('input', function () {
    clearTimeout(cho);
    cho = setTimeout(loc, 120);
  });
})();

// Thanh loc dung san trong markup (trang Vo Tuong): tab nhom, o tim, nut Chi Moi, gap/mo nhom.
(function () {
  var tabs = [].slice.call(document.querySelectorAll('[data-nlw-tab]'));
  var tim = document.querySelector('[data-nlw-tim]');
  // co trang ban goc khong chia tab, chi co o tim — van phai loc duoc
  if (!tabs.length && !tim) return;

  // moi trang mot kieu tab (dai lon hay chip bo tron) nen bo class khai ngay tren thanh
  var thanh = tabs.length ? tabs[0].parentNode : null;
  var BAT = ((thanh && thanh.dataset.nlwBat) || 'border-neutral-300 bg-white/30 text-white').split(' ');
  var TAT = ((thanh && thanh.dataset.nlwTat) ||
             'border-transparent bg-white/[0.075] text-white/80 hover:bg-white/15').split(' ');
  var nutMoi = document.querySelector('[data-nlw-moi]');
  var tong = document.querySelector('[data-nlw-tong]');
  var mauTong = tong ? tong.textContent.replace(/\d+/, '{n}') : '';
  var oTrong = null;
  if (tong) {
    oTrong = document.createElement('div');
    oTrong.className = 'py-20 text-center text-white/75 hidden';
    oTrong.textContent = 'Không có ' + mauTong.replace('Tổng {n} ', '') + ' phù hợp.';
    tong.parentNode.appendChild(oTrong);
  }
  var nhom = [].slice.call(document.querySelectorAll('[data-nlw-group]'));
  // trang khong co tab "Tat ca" thi tab dau chinh la lua chon mac dinh
  var chon = (tabs.length && tabs[0].dataset.nlwTab) ? tabs[0].dataset.nlwTab : '';
  var chonMacDinh = chon;
  var chiMoi = false;
  var chiNpc = false;

  // trang chia nhom loc theo id section, trang luoi phang loc theo data-nlw-loai cua the
  var main = document.querySelector('main');
  var cacThe = [].slice.call(main.querySelectorAll('[data-nlw-mo]'));
  // trang chi co hang gap/mo (The Gioi Moi) thi chinh hang la don vi loc
  if (!cacThe.length) cacThe = [].slice.call(main.querySelectorAll('[data-nlw-khoi]'));

  function thuocTab(the) {
    if (!chon) return true;
    // mot the co the thuoc nhieu tab (vd hieu ung vua Bat loi vua Khong che)
    if ((the.dataset.nlwLoai || '').split(' ').indexOf(chon) > -1) return true;
    var g = the.closest('[data-nlw-group]');
    return !!g && g.id === chon;
  }

  // Phan trang: ban goc cat trang SAU khi loc, don vi cat co the la the hoac ca khoi.
  var oTrang = document.querySelector('[data-nlw-trang]');
  var cuaSo = oTrang ? parseInt(oTrang.dataset.nlwTrang, 10) : 0;
  var catKhoi = oTrang && oTrang.dataset.nlwTrangDoi === 'khoi';
  var cacKhoi = catKhoi ? [].slice.call(main.querySelectorAll('[data-nlw-khoi]')) : [];
  var nhanTrang = oTrang ? oTrang.querySelector('[data-nlw-trang-nhan]') : null;
  // giu nguyen khoang trang quanh dau / nhu ban goc ("1 / 7" khac "Trang 1/14")
  var mauNhan = nhanTrang ? nhanTrang.textContent.replace(/(\d+)(\s*\/\s*)(\d+)/, '{a}$2{b}') : '';
  var nutTruoc = oTrang ? oTrang.querySelector('[data-nlw-truoc]') : null;
  var nutSau = oTrang ? oTrang.querySelector('[data-nlw-sau]') : null;
  var trang = 0;
  var nhanTong = oTrang ? oTrang.querySelector('[data-nlw-trang-tong]') : null;
  var chipTL = [].slice.call(document.querySelectorAll('[data-nlw-loc-the-luc] button'));
  var theLuc = '';

  chipTL.forEach(function (nut) {
    nut.addEventListener('click', function () {
      // ban goc: bam lai chip dang bat thi ve "Tat ca"
      theLuc = theLuc === nut.dataset.nlwTheLuc ? '' : nut.dataset.nlwTheLuc;
      chipTL.forEach(function (n) { veChip(n, n.dataset.nlwTheLuc === theLuc); });
      loc();
    });
  });

  function veChip(nut, bat) {
    var mau = nut.dataset.nlwMau || (nut.dataset.nlwTheLuc ? nut.style.color : '#e7d97a');
    if (!nut.dataset.nlwMau) nut.dataset.nlwMau = mau;
    mau = nut.dataset.nlwMau;
    nut.style.color = bat ? '#14120c' : mau;
    nut.style.background = bat ? mau : mau + '1a';
    nut.style.borderColor = bat ? mau : mau + '55';
  }

  function loc(giuTrang) {
    var tu = tim ? tim.value.trim().toLowerCase() : '';
    var hien = 0;
    cacThe.forEach(function (the) {
      var khop = thuocTab(the) &&
                 (!theLuc || the.dataset.nlwTheLuc === theLuc) &&
                 (!tu || the.textContent.toLowerCase().indexOf(tu) > -1) &&
                 (!chiMoi || !!the.querySelector('.animate-pulse')) &&
                 (!chiNpc || !!the.querySelector('[data-nlw-npc-nhan]'));
      the.dataset.nlwKhop = khop ? '1' : '';
      the.classList.toggle('hidden', !khop);
      if (khop) hien++;
    });
    if (cuaSo) {
      if (!giuTrang) trang = 0;
      var donVi = catKhoi ? cacKhoi : cacThe;
      var dat = donVi.filter(function (e) {
        // khoi co the tu no la don vi loc (The Gioi Moi) hoac chua the ben trong (Pho Ban)
        if (!catKhoi) return e.dataset.nlwKhop === '1';
        return e.dataset.nlwKhop === '1' || !!e.querySelector('[data-nlw-mo][data-nlw-khop="1"]');
      });
      var soTrang = Math.max(1, Math.ceil(dat.length / cuaSo));
      if (trang > soTrang - 1) trang = soTrang - 1;
      donVi.forEach(function (e) { e.classList.add('hidden'); });
      dat.slice(trang * cuaSo, (trang + 1) * cuaSo).forEach(function (e) { e.classList.remove('hidden'); });
      if (nhanTrang) nhanTrang.textContent = mauNhan.replace('{a}', trang + 1).replace('{b}', soTrang);
      if (nhanTong) nhanTong.textContent = '(' + dat.length + ' ' + nhanTong.dataset.nlwDonVi + ')';
      if (nutTruoc) nutTruoc.disabled = trang === 0;
      if (nutSau) nutSau.disabled = trang >= soTrang - 1;
      if (oTrang) oTrang.classList.toggle('hidden', soTrang < 2);
    }
    nhom.forEach(function (g) {
      g.classList.toggle('hidden',
        !g.querySelector('[data-nlw-mo]:not(.hidden), [data-nlw-khoi]:not(.hidden)'));
    });
    epMoKhiTim(!!(tim && tim.value.trim()) || chiMoi || chiNpc || chon !== chonMacDinh);
    // nhan Moi tren tieu de nhom chi con khi nhom van con tuong moi sau khi loc
    nhom.forEach(function (g) {
      var d = g.querySelector('[data-nlw-dem]');
      if (d) d.textContent = g.querySelectorAll('[data-nlw-mo]:not(.hidden)').length;
      var nh = g.querySelector('[data-nlw-moi-nhan]');
      if (nh) nh.classList.toggle('hidden', !g.querySelector('[data-nlw-mo]:not(.hidden) [data-nlw-the-moi]'));
    });
    // so tren tieu de khoi dem theo tab dang chon, khong dem ca phan bi loc bo
    [].forEach.call(document.querySelectorAll('[data-nlw-khoi]'), function (k) {
      var d = k.querySelector('[data-nlw-dem]');
      if (!d) return;
      var n = k.querySelectorAll('[data-nlw-mo]:not(.hidden)').length;
      d.textContent = d.textContent.replace(/^\d+/, n);
      // ban goc bo han khoi khong con the nao sau khi loc (tru trang cat trang theo khoi)
      if (!catKhoi && k.querySelectorAll('[data-nlw-mo]').length) k.classList.toggle('hidden', n === 0);
    });
    capNhatTienHoa();
    if (tong) tong.textContent = mauTong.replace('{n}', hien);
    if (oTrong) oTrong.classList.toggle('hidden', hien > 0);
  }

  // goi y "tien hoa len Cap X" tro toi nhom KE TIEP con hien sau khi loc
  function capNhatTienHoa() {
    nhom.forEach(function (g) {
      var con = [].slice.call(g.querySelectorAll('[data-nlw-khoi]')).filter(function (k) {
        return k.querySelector('[data-nlw-tien]') && !k.classList.contains('hidden');
      });
      con.forEach(function (k, i) {
        var sau = con[i + 1];
        var oCap = sau && sau.querySelector('[data-nlw-cap]');
        k.querySelector('[data-nlw-tien]').textContent =
          oCap ? 'tiến hóa lên Cấp ' + oCap.getAttribute('data-nlw-cap') : '';
      });
    });
  }

  // ban goc: dang loc (o tim, Chi Moi, NPC) thi moi nhom tu bung, bo loc thi tra lai nhu cu
  var gapTruocTim = null;

  function epMoKhiTim(dangTim) {
    var luoi = [].slice.call(main.querySelectorAll('[data-nlw-luoi]'));
    if (!luoi.length) return;
    if (dangTim) {
      if (!gapTruocTim) gapTruocTim = luoi.map(function (l) { return l.classList.contains('hidden'); });
      luoi.forEach(function (l) { l.classList.remove('hidden'); });
    } else if (gapTruocTim) {
      luoi.forEach(function (l, i) { l.classList.toggle('hidden', gapTruocTim[i]); });
      gapTruocTim = null;
    }
    luoi.forEach(function (l) {
      var dau = l.parentNode.querySelector('[data-nlw-gap] > *');
      if (!dau) return;
      var k = dau.textContent.trim();
      if (k === '+' || k === '−') dau.textContent = l.classList.contains('hidden') ? '+' : '−';
    });
  }

  if (nutTruoc) nutTruoc.addEventListener('click', function () { if (trang > 0) { trang--; loc(true); } });
  if (nutSau) nutSau.addEventListener('click', function () { trang++; loc(true); });

  // phai chay ngay khi tai: trang dau cung phai cat dung so muc nhu ban goc
  loc();

  tabs.forEach(function (b) {
    b.addEventListener('click', function () {
      chon = b.dataset.nlwTab;
      tabs.forEach(function (x) {
        var on = x === b;
        x.classList.remove.apply(x.classList, on ? TAT : BAT);
        x.classList.add.apply(x.classList, on ? BAT : TAT);
        var mau = on ? x.dataset.nlwMauBat : x.dataset.nlwMauTat;
        if (mau) x.setAttribute('style', mau);
      });
      loc();
    });
  });

  if (nutMoi) nutMoi.addEventListener('click', function () {
    chiMoi = !chiMoi;
    nutMoi.classList.toggle('border-red-400/60', chiMoi);
    nutMoi.classList.toggle('text-white', chiMoi);
    loc();
  });

  // NPC la bo loc chong len tab loai (Bo Binh + NPC), khong phai mot tab rieng
  var nutNpc = document.querySelector('[data-nlw-npc]');
  if (nutNpc) nutNpc.addEventListener('click', function () {
    chiNpc = !chiNpc;
    nutNpc.setAttribute('aria-pressed', String(chiNpc));
    nutNpc.className = chiNpc ? nutNpc.dataset.nlwNpcBat : nutNpc.dataset.nlwNpcTat;
    loc();
  });

  var cho;
  if (tim) tim.addEventListener('input', function () { clearTimeout(cho); cho = setTimeout(loc, 120); });

})();

// Nut gap/mo dung o nhieu trang, ke ca trang khong co thanh loc.
(function () {
  [].forEach.call(document.querySelectorAll('[data-nlw-gap]'), function (nut) {
    nut.addEventListener('click', function () {
      var con = nut.parentNode.querySelector('[data-nlw-luoi]');
      var dangMo = !con.classList.contains('hidden');
      con.classList.toggle('hidden', dangMo);
      var dau = nut.firstElementChild;
      var k = dau.textContent.trim();
      if (k === '\u203a') dau.classList.toggle('rotate-90', !dangMo);
      else if (k === '\u25be') dau.classList.toggle('rotate-180', !dangMo);
      else if (k === '+' || k === '−') dau.textContent = dangMo ? '+' : '−';
      else {
        // nut co mui ten o cuoi (panel dau trang) thi chu dau la tieu de, khong duoc ghi de
        var cuoi = nut.lastElementChild;
        if (cuoi && cuoi.textContent.trim() === '\u25be') cuoi.classList.toggle('rotate-180', !dangMo);
      }
    });
  });
})();

// Ô tìm trang chủ wiki: lọc thẻ hub theo tên, gõ không dấu vẫn khớp.
(function () {
  var oTim = document.querySelector('[data-nlw-hub-tim]');
  if (!oTim) return;
  var cacThe = [].slice.call(document.querySelectorAll('[data-nlw-hub]'));
  var dongTrong = document.querySelector('[data-nlw-hub-trong]');

  function khongDau(chu) {
    return chu.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/đ/g, 'd');
  }
  var tenThe = cacThe.map(function (the) { return khongDau(the.querySelector('.nlw-hub-ten').textContent); });

  oTim.addEventListener('input', function () {
    var tu = khongDau(oTim.value.trim());
    var soKhop = 0;
    cacThe.forEach(function (the, i) {
      var khop = tenThe[i].indexOf(tu) !== -1;
      the.hidden = !khop;
      if (khop) soKhop++;
    });
    dongTrong.hidden = soKhop > 0;
  });
})();

// Bản gốc khoá cuộn nền khi popup mở; popup nào cũng là lớp phủ chèn thẳng vào body.
(function () {
  new MutationObserver(function () {
    var coPopup = [].some.call(document.body.children, function (e) {
      // [data-nlw-nen] là nền của menu mobile, luôn nằm sẵn trong body — không phải popup
      return e.matches('.fixed.inset-0:not([data-nlw-nen])') || !!e.querySelector(':scope > .nlw-nen');
    });
    document.body.style.overflow = coPopup ? 'hidden' : '';
  }).observe(document.body, { childList: true });
})();

// Popup chi tiết võ tướng: markup bám bản gốc, dữ liệu tải riêng theo từng tướng.
(function () {
  if (!document.querySelector('[data-nlw-hero],[data-nlw-buff],[data-nlw-an],[data-nlw-unit],[data-nlw-beauty],[data-nlw-item],[data-nlw-book],[data-nlw-skill],[data-nlw-etch],[data-nlw-qan],[data-nlw-tinh],[data-nlw-camp]')) return;

  var BASE = document.querySelector('script[src*="ngoa-long-wiki.js"]').src.replace(/ngoa-long-wiki\.js.*$/, '');
  var CHIA_BAR = 149; // bản gốc chia mọi thanh chỉ số cho 149
  var PHE = { 'Ngụy': '#3b6fb0', 'Thục': '#27865b', 'Ngô': '#c0392b', 'Quần': '#7d5ba6', 'Trung lập': '#4a9d9d' };
  var PHAM = { 'Thường': '#c2c2c2', 'Chiến': '#4a90d9', 'Thần': '#42ad5c', 'Truyền thuyết': '#d6484f',
               'Thượng Cổ': '#a259c8', 'Thái Sơ': '#e0842d', 'Thần Hoàng': '#d4af37' };
  var SLUG_Q = { 1: 'white', 2: 'blue', 3: 'green', 5: 'red', 6: 'purple', 7: 'orange', 8: 'gold' };
  var KEY_Q = { 1: '白', 2: '蓝', 3: '绿', 5: '红', 6: '紫', 7: '橙', 8: '金' };
  var BINH_CN = { '步兵': 'Bộ Binh', '枪兵': 'Thương Binh', '骑兵': 'Kỵ Binh', '弓兵': 'Cung Binh', '文官': 'Quan Văn' };
  var TEN_CN = { '白': 'Thường', '蓝': 'Chiến', '绿': 'Thần', '红': 'Truyền thuyết', '紫': 'Thượng Cổ', '橙': 'Thái Sơ' };
  var MAU_BUFF = { buff: '#42ad5c', debuff: '#d6484f', neutral: '#9aa4b2' };
  var THANG_Q = { 'Thường': 1, 'Chiến': 2, 'Thần': 3, 'Truyền thuyết': 5, 'Thượng Cổ': 6, 'Thái Sơ': 7, 'Thần Hoàng': 8 };

  var ui = null;
  var veLai = null;

  function resetUi(tu, den) {
    ui = { tu: tu, den: den, bung: {}, rank: { seal: tra.toiLuyen.seal.length, weapon: tra.toiLuyen.weapon.length },
           cap: { seal: tra.toiLuyen.seal[0].levels.length - 1, weapon: tra.toiLuyen.weapon[0].levels.length - 1 } };
  }

  var kho = {};
  var tra = null;
  var tt = null;
  var lop = null;

  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function anh(ten) { return BASE + 'icons/' + ten; }
  function so(n) { return Number(n).toLocaleString('vi-VN'); }
  function mauBuff(b) { return b.und ? MAU_BUFF.neutral : (MAU_BUFF[b.type] || MAU_BUFF.buff); }

  function tai(url) { return fetch(url).then(function (r) { return r.ok ? r.json() : null; }); }

  function taiTra() {
    if (tra) return Promise.resolve(tra);
    return Promise.all([tai(BASE + 'data/buff-map.json'), tai(BASE + 'data/seal-map.json'),
                        tai(BASE + 'data/thuong-dan-binh.json'), tai(BASE + 'data/nguyen-lieu.json'),
                        tai(BASE + 'data/exp-nguyen-lieu.json'), tai(BASE + 'data/chi-phi-toi-luyen.json'),
                        tai(BASE + 'data/kismet-map.json'), tai(BASE + 'data/hero-mini.json'),
                        tai(BASE + 'data/buff-page.json'), tai(BASE + 'data/seal-buff.json'),
                        tai(BASE + 'data/buff-thu-tu.json'), tai(BASE + 'data/seal-detail.json'), tai(BASE + 'data/unit-detail.json'), tai(BASE + 'data/women-detail.json')])
      .then(function (r) {
        tra = { buff: r[0], seal: r[1], thuong: r[2], nl: r[3], expNl: r[4], toiLuyen: r[5], kismet: r[6], mini: r[7], trang: r[8], anBuff: r[9], thuTuBuff: r[10], anChiTiet: r[11], binh: r[12], triKy: r[13] };
        return tra;
      });
  }

  function taiTuong(id) {
    if (kho[id]) return Promise.resolve(kho[id]);
    return tai(BASE + 'data/hero/' + id + '.json').then(function (d) { kho[id] = d; return d; });
  }

  // Tên hiệu ứng trong mô tả kỹ năng được bản gốc tô màu theo loại buff.
  function veMoTa(s) {
    return esc(s).replace(/\[([^\]]+)\]/g, function (_, ten) {
      var b = null, k;
      for (k in tra.buff) if (tra.buff[k].name.toLowerCase() === ten.toLowerCase()) { b = tra.buff[k]; break; }
      if (!b) return '[' + ten + ']';
      return '<span tabindex="0" class="cursor-help font-medium underline decoration-dotted underline-offset-2 outline-none"'
        + ' style="color:' + mauBuff(b) + '">' + ten + '</span>';
    });
  }

  function chipBuff(ids) {
    var ra = (ids || []).map(function (id) {
      var b = tra.buff[id];
      if (!b) return '';
      var m = mauBuff(b);
      return '<button type="button" data-nlw-chip="' + id + '" title="' + esc(b.desc) + '"'
        + ' class="inline-flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2 text-xs font-medium transition cursor-pointer hover:brightness-125"'
        + ' style="background-color:' + rgba(m, 0.133) + ';border:1px solid ' + rgba(m, 0.4) + ';color:' + m + '">'
        + '<span class="relative h-4 w-4 shrink-0 overflow-hidden rounded-full bg-black/30">'
        + '<img alt="" class="h-full w-full object-cover" src="' + anh(b.icon) + '"></span>' + esc(b.name) + '</button>';
    }).join('');
    if (!ra) return '';
    return '<div class="mt-3 border-t border-white/10 pt-3"><p class="text-xs tracking-wider text-white/75">Hiệu ứng kỹ năng</p>'
      + '<div class="mt-3 flex flex-wrap gap-1.5">' + ra + '</div></div>';
  }

  function oChiPhi(ds) {
    return (ds || []).map(function (c) {
      return '<span title="' + esc(c.name) + '" class="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-sm font-semibold tabular-nums text-white">'
        + '<span class="relative block h-6 w-6 shrink-0"><img alt="' + esc(c.name) + '" class="h-full w-full object-contain" src="' + anh(c.icon) + '"></span>'
        + so(c.qty) + '</span>';
    }).join('');
  }

  function bangThuocTinh(ds, fc, lay) {
    var o = ds.map(function (x) {
      var g = lay(x);
      return '<span class="flex items-baseline justify-between gap-2 rounded-md border px-2 py-1 text-xs"'
        + ' style="border-color:' + rgba(fc, 0.2) + ';background-color:' + rgba(fc, 0.067) + '">'
        + '<span class="truncate text-white/70">' + esc(g[0]) + '</span>'
        + '<span class="shrink-0 font-semibold" style="color:' + fc + '">'
        + (g[1] === g[2] ? esc(g[2])
           : '<span class="text-white/45">' + esc(g[1]) + '</span><span class="mx-1 text-white/30">→</span>' + esc(g[2]))
        + '</span></span>';
    }).join('');
    return '<div class="mb-4"><p class="mb-2 text-xs tracking-wider text-white/50">Thuộc tính (cơ bản → tối đa)</p>'
      + '<div class="grid grid-cols-1 gap-1.5 sm:grid-cols-2">' + o + '</div></div>';
  }

  function tabKyNang(d, bac, qc, fc) {
    var ds = bacCua(d);
    var dai = ds.length < 2 ? '' : ds.map(function (b) {
      var m = PHAM[b.qName] || '#c2c2c2';
      var chon = b.q === bac.q;
      return '<button type="button" data-nlw-q="' + b.q + '" class="rounded px-2.5 py-1 text-xs font-medium transition"'
        + ' style="background-color:' + (chon ? m : rgba(m, 0.12)) + ';color:' + (chon ? '#0b0a09' : m)
        + ';box-shadow:' + (chon ? m + ' 0px 0px 0px 2px' : 'none') + '">' + esc(b.qName) + '</button>';
    }).join('');

    var vn = (d.tiers || {})[KEY_Q[bac.q]];
    var sk = vn || bac.skill || {};
    var mo = sk.desc || '';
    var loai = vn ? (vn.type || '') : '';
    if (!vn) {
      var m = mo.match(/^\s*\[([^\]]+)\]\s*/);
      if (m) { loai = m[1]; mo = mo.slice(m[0].length); }
    }
    var nhan = vn && vn.access ? vn.access : bac.access;
    var cost = (vn && vn.cost && vn.cost.length) ? vn.cost : bac.cost;
    var xem = (vn && vn.previewUrl) || bac.previewUrl;

    var than = '<div class="rounded-lg border border-white/10 bg-white/[0.06] p-4" style="border-left:3px solid ' + qc + '">'
      + '<div class="flex items-center gap-2.5"><span class="h-3 w-3 shrink-0 rounded-full" style="background-color:' + qc + '"></span>'
      + '<span class="flex-1 text-base font-semibold text-white">' + esc(sk.name) + '</span>'
      + (loai ? '<span class="shrink-0 rounded px-2 py-0.5 text-xs text-white" style="border:1px solid ' + rgba(fc, 0.533)
          + ';background-color:' + rgba(fc, 0.2) + '">' + esc(loai) + '</span>' : '')
      + '</div>'
      + '<p class="mt-0.5 text-xs" style="color:' + qc + '">' + esc(bac.qName) + '</p>'
      + '<p class="mt-2.5 text-sm leading-6 text-white/90">' + veMoTa(mo) + '</p>'
      + (xem ? '<button type="button" data-nlw-xem="' + esc(xem) + '"'
          + ' class="mt-3 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:brightness-125"'
          + ' style="border-color:' + rgba(fc, 0.533) + ';color:' + fc + ';background:' + rgba(fc, 0.1) + '">▷ Xem kỹ năng</button>' : '')
      + chipBuff(sk.buffs)
      + (nhan ? '<p class="mt-3.5 border-t border-white/10 pt-3 text-xs text-white/70">Cách nhận · ' + esc(nhan) + '</p>' : '')
      + (cost && cost.length
          ? '<div class="mt-3.5 border-t border-white/10 pt-3"><p class="mb-2 text-sm font-medium text-white/70">Chi phí giác ngộ</p>'
            + '<div class="flex flex-wrap gap-2">' + oChiPhi(cost) + '</div></div>' : '')
      + '</div>';

    return '<p class="mb-3 text-xs tracking-wider text-white/70">Kỹ năng</p>'
      + (dai ? '<div class="mb-3 flex flex-wrap gap-1.5">' + dai + '</div>' : '') + than;
  }

  var LOAI_MC = { attack: { color: '#d0564a', label: 'Tấn Công' }, defense: { color: '#4a90d9', label: 'Phòng Thủ' },
                  support: { color: '#42ad5c', label: 'Hỗ Trợ' }, special: { color: '#c9a24b', label: 'Đặc Biệt' } };

  function khoiTangTruong(stats, fc, khoa, nhan, boc) {
    var bung = ui.bung[khoa];
    var nut = '<div class="' + (boc || 'mt-2') + '"><div class="mb-4"><button type="button" data-nlw-bung="' + khoa + '"'
      + ' class="flex items-center gap-1.5 text-xs tracking-wider text-white/55 transition hover:text-white/80">'
      + '<span class="grid h-4 w-4 place-items-center rounded text-[10px] font-bold" style="color:' + fc
      + ';background-color:' + rgba(fc, 0.133) + ';border:1px solid ' + rgba(fc, 0.4) + '">' + (bung ? '−' : '+')
      + '</span>' + (nhan || 'Tăng trưởng theo bậc') + '</button>';
    if (!bung) return nut + '</div></div>';

    var ranks = stats[0].ranks || (stats[0].series || []).map(function (_, k) { return k + 1; });
    var cuoi = ranks.length - 1;
    var th = ranks.map(function (r, k) {
      return '<th class="px-2 py-1.5 text-right font-medium tabular-nums" style="color:'
        + (k === cuoi ? fc : 'rgba(255,255,255,0.5)') + '">' + r + '</th>';
    }).join('');
    var tr = stats.map(function (x) {
      var o = (x.series || []).map(function (v, k) {
        return '<td class="whitespace-nowrap px-2 py-1.5 text-right tabular-nums" style="color:'
          + (k === cuoi ? fc : (x.neg ? 'rgba(230,120,120,0.85)' : 'rgba(255,255,255,0.7)'))
          + ';font-weight:' + (k === cuoi ? 600 : 400) + '">'
          + (typeof v === 'string' ? esc(v) : '+' + v + (x.pct ? '%' : '')) + '</td>';
      }).join('');
      return '<tr class="border-t border-white/[0.06]"><td class="sticky left-0 z-10 bg-[#171320] px-2 py-1.5 text-left text-white/75">'
        + esc(x.name || x.label) + '</td>' + o + '</tr>';
    }).join('');
    return nut + '<div class="mt-2 overflow-x-auto rounded-lg border border-white/10">'
      + '<table class="w-full border-collapse text-[11px]"><thead><tr class="bg-white/[0.05]">'
      + '<th class="sticky left-0 z-10 bg-[#171320] px-2 py-1.5 text-left font-medium text-white/60">&nbsp;</th>'
      + th + '</tr></thead><tbody>' + tr + '</tbody></table></div></div></div>';
  }

  function khoiChiPhi(loai, fc) {
    var bang = tra.toiLuyen[loai];
    var nhan = loai === 'seal' ? 'Rank' : 'Bậc';
    var maxR = bang.length, maxC = bang[0].levels.length - 1;
    var r = Math.min(Math.max(1, ui.rank[loai]), maxR);
    var c = Math.min(Math.max(0, ui.cap[loai]), maxC);

    var temper = 0, soul = 0, draw = 0;
    bang.forEach(function (x) {
      if (x.rank > r) return;
      soul += x.soul; draw += x.draw;
      var n = x.rank < r ? x.levels.length - 1 : c;
      for (var k = 1; k <= n; k++) temper += x.levels[k] || 0;
    });

    function chon(ten, gia, ds, nhanO) {
      return '<select data-nlw-cp="' + ten + '" class="rounded-lg border border-white/20 bg-black/40 px-2 py-1 text-sm font-semibold text-white focus:outline-none">'
        + ds.map(function (v) {
            return '<option value="' + v + '"' + (v === gia ? ' selected' : '') + '>' + (nhanO ? nhanO + ' ' + v : v) + '</option>';
          }).join('') + '</select>';
    }
    var dsR = [], dsC = [];
    for (var a = 1; a <= maxR; a++) dsR.push(a);
    for (var b = 0; b <= maxC; b++) dsC.push(b);

    function o(ten, gia, mau) {
      return '<div class="flex items-center justify-between gap-2 rounded-lg px-3 py-2.5" style="background-color:' + rgba(mau, 0.12)
        + ';box-shadow:' + rgba(mau, 0.267) + ' 0px 0px 0px 1px inset">'
        + '<span class="flex items-center gap-1.5 text-xs text-white/80"><span class="h-2 w-2 shrink-0 rounded-full" style="background-color:'
        + mau + '"></span>' + ten + '</span>'
        + '<span class="text-base font-bold tabular-nums" style="color:' + mau + '">' + so(gia) + '</span></div>';
    }
    var oTong = o('Đá Tôi Luyện', temper, '#4a90d9')
      + (loai === 'seal' && soul > 0 ? o('Ngọc Chiến Hồn', soul, '#c98b3b') : '')
      + (draw > 0 ? o('Bản Vẽ Vũ Khí ĐB', draw, '#b06fd6') : '');

    var dong = bang.map(function (x) {
      var t = x.levels.reduce(function (a2, b2) { return a2 + b2; }, 0);
      return '<tr class="border-t border-white/[0.06]"><td class="px-3 py-1 text-left text-white/75">' + x.rank + '</td>'
        + '<td class="px-3 py-1 text-right tabular-nums text-white/75">' + so(t) + '</td>'
        + (loai === 'seal' ? '<td class="px-3 py-1 text-right tabular-nums text-white/75">' + so(x.soul) + '</td>' : '')
        + '<td class="px-3 py-1 text-right tabular-nums text-white/75">' + (x.draw ? so(x.draw) : '—') + '</td></tr>';
    }).join('');

    var ghi = 'Cộng dồn từ ' + nhan + ' 1 · Cấp 0. <span class="text-white/60">Đá Tôi Luyện</span> tăng từng cấp;'
      + ' <span class="text-white/60">Ngọc Chiến Hồn / Bản Vẽ Vũ Khí ĐB</span> chỉ tốn khi đột phá lên '
      + (loai === 'seal' ? 'rank' : 'bậc') + ' mới.'
      + (loai === 'seal' ? '' : ' <span class="text-white/40">(Dữ liệu VKĐB chỉ lưu số lượng, không ghi loại nguyên liệu'
          + ' — suy từ hệ Tôi Luyện / Bản Vẽ dùng chung với Ấn; mỗi VKĐB còn cần Bản Vẽ riêng để kích hoạt.)</span>');

    return '<div class="mt-4 border-t border-white/10 pt-3"><div class="flex flex-wrap items-center justify-between gap-2">'
      + '<p class="text-xs font-semibold tracking-wider" style="color:' + fc + '">Chi phí nâng cấp &amp; đột phá</p>'
      + '<label class="flex items-center gap-1.5 text-xs text-white/55">Đến' + chon(loai + '-rank', r, dsR, nhan)
      + '<span class="text-white/35">·</span>Cấp' + chon(loai + '-cap', c, dsC, '') + '</label></div>'
      + '<div class="mt-2.5 grid gap-2 sm:grid-cols-3">' + oTong + '</div>'
      + '<div class="mt-2.5 overflow-hidden rounded-lg border border-white/10"><table class="w-full text-xs">'
      + '<thead><tr class="bg-white/[0.04] text-white/50"><th class="px-3 py-1.5 text-left font-medium">' + nhan + '</th>'
      + '<th class="px-3 py-1.5 text-right font-medium">Đá Tôi Luyện</th>'
      + (loai === 'seal' ? '<th class="px-3 py-1.5 text-right font-medium">Ngọc C.Hồn</th>' : '')
      + '<th class="px-3 py-1.5 text-right font-medium">Bản Vẽ</th></tr></thead><tbody>' + dong + '</tbody></table></div>'
      + '<p class="mt-1.5 text-[11px] leading-4 text-white/45">' + ghi + '</p></div>';
  }

  function dongKyNang(x, coSao) {
    return '<div class="flex gap-3"><span class="relative mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/15"'
      + ' style="background:radial-gradient(circle at 50% 40%, rgba(255,255,255,0.5), rgba(220,222,235,0.18))">'
      + (x.icon ? '<img alt="" class="h-9 w-9 object-contain" src="' + anh(x.icon) + '">' : '') + '</span>'
      + '<p class="text-sm leading-6 text-white/80"><span class="font-medium text-white/95">' + esc(x.name)
      + (coSao && x.rank != null ? ' (★' + x.rank + ')' : '') + '：</span>' + veMoTa(x.desc) + '</p></div>';
  }

  function tabVKDB(d, fc) {
    var w = d.weapon || vkdbCua(d);
    var ten = vkdbCua(d) || w;
    var mo = TEN_CN[w.unlockTier];
    var slot = ((ten.slots && ten.slots.length ? ten.slots : w.slots) || []).map(function (s) {
      return '<div class="rounded-lg border border-white/10 bg-white/[0.06] p-3">'
        + '<p class="mb-2 text-sm font-semibold text-white">' + esc(s.name) + '</p>'
        + '<div class="space-y-2.5">' + (s.tiers || []).map(function (x) { return dongKyNang(x, true); }).join('') + '</div></div>';
    }).join('');

    return '<div class="mb-3 flex items-baseline justify-between gap-2">'
      + '<p class="text-lg font-semibold" style="color:' + fc + '">' + esc(ten.name) + '</p>'
      + (mo ? '<span class="shrink-0 text-xs text-white/70">Chỉ mở khóa từ ' + esc(mo) + '</span>' : '')
      + '</div>'
      + (w.image ? '<div class="relative mb-4 flex items-center justify-center overflow-hidden rounded-xl"'
          + ' style="background:radial-gradient(85% 78% at 50% 42%, rgba(255,255,255,0.42), rgba(230,232,240,0.12) 72%)">'
          + '<img alt="' + esc(ten.name) + '" class="max-h-48 w-auto object-contain" src="' + anh(w.image) + '"></div>' : '')
      + (w.stats && w.stats.length
          ? bangThuocTinh(w.stats, fc, function (x) {
              var k = x.pct ? '%' : '';
              return [x.name, '+' + x.base + k, '+' + x.value + k];
            }).replace('</div></div>', '</div>' + khoiTangTruong(w.stats, fc, 'weapon') + '</div>') : '')
      + khoiChiPhi('weapon', fc)
      + '<div class="space-y-3">' + slot + '</div>';
  }

  function tabAn(d, fc) {
    var s = anCua(d);
    var units = (s.units || []).map(function (u) {
      return '<span class="rounded px-2 py-0.5 text-xs font-medium text-white" style="background-color:rgba(201,162,75,0.18);border:1px solid rgba(201,162,75,0.4)">' + esc(u) + '</span>';
    }).join('');
    return '<div class="mb-3 flex items-center gap-3">'
      + '<span class="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10"'
      + ' style="background:radial-gradient(circle at 50% 40%, rgba(255,255,255,0.5), rgba(220,222,235,0.18))">'
      + '<img alt="' + esc(s.name) + '" class="h-full w-full object-contain p-1" src="' + anh(s.icon) + '"></span>'
      + '<div class="min-w-0"><p class="text-lg font-semibold" style="color:' + fc + '">' + esc(s.name) + '</p>'
      + '<div class="mt-1 flex flex-wrap items-center gap-1.5">' + units + '</div></div></div>'
      + (s.unlockQuality ? '<p class="mb-3 text-xs text-white/70">Chỉ mở khóa từ ' + esc(s.unlockQuality) + '</p>' : '')
      + (s.stats && s.stats.length
          ? bangThuocTinh(s.stats, fc, function (x) {
              var k = x.pct ? '%' : '';
              return [x.label || x.name, '+' + x.base + k, '+' + x.value + k];
            })
              .replace('</div></div>', '</div>' + khoiTangTruong(s.stats, fc, 'seal') + '</div>') : '')
      + khoiChiPhi('seal', fc)
      + '<div class="mt-4 space-y-2.5">' + (s.skills || []).map(function (x) { return dongKyNang(x, false); }).join('') + '</div>';
  }

  function tabMenhCach(d) {
    var cn = menhCachCn(d), vn = d.kismet || [];
    var ds = ((tt.side === 'cn' ? cn.length > 0 : !vn.length) && cn.length)
      ? cn : vn.map(function (id) { return tra.kismet[id]; }).filter(Boolean);
    if (!ds.length) return '<p class="text-sm text-white/78">Chỉ khả dụng từ Thần Hoàng · —</p>';
    var khoi = ds.map(function (k, i) {
      var t = (k.desc || '').toLowerCase();
      var l = LOAI_MC[k.category || (/攻击|tấn công/.test(t) ? 'attack' : /防御|phòng thủ|phòng ngự/.test(t) ? 'defense'
                      : /辅助|hỗ trợ/.test(t) ? 'support' : 'special')];
      var dong = (k.effects || []).map(function (e) {
        return '<li class="flex items-baseline justify-between gap-3 rounded px-2 py-1.5 text-sm odd:bg-white/[0.03]">'
          + '<span class="text-white/72">' + esc(e.label) + '</span>'
          + '<span class="shrink-0 font-medium tabular-nums" style="color:' + l.color + '">'
          + (e.base === e.value ? esc(e.value)
             : '<span class="text-white/40">' + esc(e.base) + '</span><span class="mx-1 text-white/25">→</span>' + esc(e.value))
          + '</span></li>';
      }).join('');
      return '<div class="overflow-hidden rounded-xl border border-white/10"'
        + ' style="background:linear-gradient(180deg, ' + l.color + '12, transparent 60%)">'
        + '<div class="h-0.5 w-full" style="background-color:' + l.color + '"></div>'
        + '<div class="p-3"><div class="mb-2.5 flex items-center gap-2">'
        + '<p class="text-sm font-semibold text-white">' + esc(k.name) + '</p>'
        + '<span class="rounded px-1.5 py-0.5 text-[11px] font-medium" style="color:' + l.color
        + ';background-color:' + rgba(l.color, 0.133) + ';border:1px solid ' + rgba(l.color, 0.333) + '">' + l.label + '</span>'
        + '</div><ul class="space-y-1.5">' + dong + '</ul>'
        + khoiTangTruong(k.effects, l.color, 'mc' + i, 'Tăng trưởng theo cấp', 'mt-2.5') + '</div></div>';
    }).join('');
    return '<div class="space-y-3"><p class="text-xs tracking-wider text-white/60">Chỉ khả dụng từ Thần Hoàng</p>' + khoi + '</div>';
  }

  function tabKetNghia(d) {
    var ds = d.bonds || [];
    if (!ds.length) return '<p class="text-xs text-white/45">Tướng này chưa có kết nghĩa.</p>';
    var khoi = ds.map(function (b) {
      var q = (b.qualities || [])[0];
      var m = PHAM[q] || '#c2c2c2';
      var dong = (b.tiers || []).map(function (t) {
        return '<div class="flex items-baseline justify-between gap-3 text-sm">'
          + '<span class="text-white/72">' + esc(t.condition) + '</span>'
          + '<span class="shrink-0 text-right font-medium text-white/90">' + esc(t.benefit) + '</span></div>';
      }).join('');
      return '<div class="rounded-lg border border-white/10 bg-white/[0.06] p-3"><div class="flex items-center gap-3">'
        + '<div class="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg">'
        + (b.withImg ? '<img alt="' + esc(b.withName) + '" class="h-11 w-11 object-cover" src="' + anh(b.withImg) + '">' : '')
        + '</div><div class="min-w-0 flex-1"><p class="text-sm font-semibold text-white">' + esc(b.name) + '</p>'
        + '<p class="mt-0.5 text-xs text-white/70">Duyên với: <span class="font-medium text-white/95">' + esc(b.withName) + '</span></p></div>'
        + (q ? '<span class="shrink-0 rounded px-2 py-0.5 text-xs font-medium" style="color:' + m + ';background-color:'
            + rgba(m, 0.133) + ';border:1px solid ' + rgba(m, 0.4) + '">' + esc(q) + '+</span>' : '')
        + '</div><div class="mt-2.5 space-y-1 border-t border-white/10 pt-2.5">' + dong + '</div></div>';
    }).join('');
    return '<div class="space-y-2.5">' + khoi + '</div>';
  }

  function oNguyenLieu(icon, ten, sl, fc) {
    return '<div class="flex items-center gap-2 rounded-lg px-2.5 py-2" style="background-color:' + rgba(fc, 0.08)
      + ';box-shadow:' + rgba(fc, 0.2) + ' 0px 0px 0px 1px inset">'
      + '<span class="h-8 w-8 shrink-0 overflow-hidden rounded bg-black/25"><img alt="' + esc(ten)
      + '" class="h-full w-full object-cover" src="' + anh(icon) + '"></span>'
      + '<span class="min-w-0 flex-1"><span class="block truncate text-xs text-white/75">' + esc(ten) + '</span>'
      + '<span class="text-sm font-bold tabular-nums" style="color:' + fc + '">' + so(sl) + '</span></span></div>';
  }

  function tabPhucSuc(d, fc) {
    var khoi = skinCua(d).map(function (s) {
      var m = PHAM[s.qualityName] || '#c2c2c2';
      var b = s.bonus || {};
      var chip = [['Chỉ Huy', b.lead], ['Võ', b.war], ['Trí', b.int]].filter(function (x) { return x[1]; })
        .map(function (x) {
          return '<span class="rounded-md border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-xs font-medium text-emerald-300">'
            + x[0] + ' +' + x[1] + '</span>';
        }).join('');
      return '<div class="flex gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3.5">'
        + '<span class="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border" style="border-color:' + rgba(m, 0.4) + '">'
        + '<img alt="' + esc(s.name) + '" class="h-full w-full object-cover" src="' + anh(s.icon || d.img) + '"></span>'
        + '<div class="min-w-0 flex-1"><div class="flex items-baseline justify-between gap-2">'
        + '<p class="flex items-center gap-2 text-[15px] font-semibold text-white">' + esc(s.name) + '</p>'
        + '<span class="shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold" style="color:' + m
        + ';border:1px solid ' + rgba(m, 0.333) + '">' + esc(s.qualityName) + '</span></div>'
        + (chip ? '<div class="mt-2 flex flex-wrap gap-1.5">' + chip + '</div>' : '')
        + (s.skillName ? '<div class="mt-2.5 border-t border-white/10 pt-2.5">'
            + '<p class="text-sm font-medium text-white/95">'
            + (s.skillType ? '<span style="color:' + fc + '">[' + esc(s.skillType) + '] </span>' : '') + esc(s.skillName) + '</p>'
            + (s.skillDesc ? '<p class="mt-1 text-sm leading-6 text-white/75">' + veMoTa(s.skillDesc) + '</p>' : '')
            + (s.previewUrl ? '<button type="button" data-nlw-xem="' + esc(s.previewUrl) + '"'
                + ' class="mt-3 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:brightness-125"'
                + ' style="border-color:' + rgba(fc, 0.533) + ';color:' + fc + ';background:' + rgba(fc, 0.1) + '">▷ Xem kỹ năng</button>' : '')
            + '</div>' : '')
        + '</div></div>';
    }).join('');
    return '<div class="space-y-3">' + khoi + '</div>';
  }

  function tabThuong(fc) {
    var tu = Math.max(1, Math.min(400, ui.tu));
    var den = Math.max(1, Math.min(400, ui.den));
    var o = 'w-16 rounded-lg border border-white/20 bg-black/40 px-2 py-1 text-center text-white outline-none focus:border-white/50';
    var dau = '<div class="flex flex-wrap items-center justify-between gap-2">'
      + '<p class="text-sm text-white/65"><span class="font-semibold text-white/85">Thưởng (Dẫn Binh)</span>'
      + ' — chi phí nâng cấp lực dẫn binh. Cấp 1–200 dùng EXP; từ cấp 201 dùng nguyên liệu và cộng thêm C.Huy / Võ / Trí. (Chung cho mọi tướng.)</p>'
      + '<label class="flex items-center gap-1.5 text-xs text-white/55">Từ cấp'
      + '<input inputmode="numeric" data-nlw-tu class="' + o + '" aria-label="Từ cấp" type="text" value="' + tu + '">'
      + '<span class="text-white/35">→</span>Đến'
      + '<input inputmode="numeric" data-nlw-den class="' + o + '" aria-label="Đến cấp" type="text" value="' + den + '">'
      + '</label></div>';

    if (den <= tu) return '<div class="space-y-4">' + dau
      + '<p class="text-xs text-white/45">Nhập cấp đích (≤ 400) lớn hơn cấp bắt đầu để xem chi phí.</p></div>';

    var b = tra.thuong, a = b[tu - 1], z = b[den - 1];
    var exp = 0, bandA = {}, bandB = {};
    for (var i = tu + 1; i <= den; i++) {
      var r = b[i - 1];
      exp += r.exp;
      var gom = i >= 301 ? bandB : bandA;
      r.cost.forEach(function (c) { gom[c.key] = (gom[c.key] || 0) + c.qty; });
    }
    var vnExp = 2 * exp;

    var oSo = [['Dẫn Binh', z.troop - a.troop], ['C.Huy', z.cHuy - a.cHuy], ['Võ', z.vo - a.vo], ['Trí', z.tri - a.tri]]
      .map(function (x) {
        return '<div class="flex items-center justify-between gap-2 rounded-lg px-3 py-2.5" style="background-color:' + rgba(fc, 0.12)
          + ';box-shadow:' + rgba(fc, 0.267) + ' 0px 0px 0px 1px inset">'
          + '<span class="text-xs text-white/80">' + x[0] + '</span>'
          + '<span class="text-base font-bold tabular-nums" style="color:' + fc + '">+' + so(x[1]) + '</span></div>';
      }).join('');

    var khoiExp = '';
    if (vnExp > 0) {
      var o3 = tra.expNl.map(function (n) {
        return oNguyenLieu(n.icon, n.name, Math.ceil(vnExp / n.exp), fc);
      }).join('');
      khoiExp = '<div><p class="mb-1.5 text-xs font-semibold tracking-wider" style="color:' + fc + '">EXP cần (cấp ≤ 200) · tổng '
        + so(vnExp) + '</p><p class="mb-2 text-xs text-white/45">Trả bằng một trong các nguyên liệu sau:</p>'
        + '<div class="grid grid-cols-3 gap-2">' + o3 + '</div></div>';
    }

    function dai(tieu, gom) {
      var k = Object.keys(gom);
      if (!k.length) return '';
      var o4 = k.map(function (key) {
        var n = tra.nl[key] || { name: key, icon: '' };
        return oNguyenLieu(n.icon, n.name, gom[key], fc);
      }).join('');
      return '<div><p class="mb-1.5 text-xs font-semibold tracking-wider" style="color:' + fc + '">' + tieu + '</p>'
        + '<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">' + o4 + '</div></div>';
    }

    return '<div class="space-y-4">' + dau
      + '<div><p class="mb-1.5 text-xs font-semibold tracking-wider" style="color:' + fc + '">Chỉ số nhận được (' + tu + ' → ' + den + ')</p>'
      + '<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">' + oSo + '</div></div>'
      + khoiExp + dai('Nguyên liệu · cấp 201–300', bandA) + dai('Nguyên liệu · cấp 301–400', bandB) + '</div>';
  }

  function bacCua(d) {
    var ds = (tt.side === 'cn' ? d.cnTiers : d.viTiers) || [];
    var theoTen = {};
    ds.forEach(function (b) { theoTen[b.qName] = b; });
    return ds.filter(function (b) { return theoTen[b.qName] === b; });
  }

  function vkdbCua(d) {
    var vn = d.viWeapon || d.weapon || null;
    return tt.side === 'cn' ? (d.cnWeapon || vn) : (vn || d.cnWeapon);
  }

  function anCua(d) {
    var vn = (d.seal && tra.seal[d.seal]) || null;
    if (vn && (vn.isChild || (vn.unlockQuality
        && THANG_Q[d.viMaxQName || d.qualityName] < THANG_Q[vn.unlockQuality]))) vn = null;
    return tt.side === 'cn' ? (d.cnSeal || vn) : (vn || d.cnSeal);
  }

  function menhCachCn(d) {
    var thay = {}, ra = [];
    (d.cnTiers || []).forEach(function (t) {
      (t.kismets || []).forEach(function (k) { if (!thay[k.name]) { thay[k.name] = 1; ra.push(k); } });
    });
    return ra;
  }

  function skinCua(d) {
    var vn = d.skins || null, cn = d.cnSkins || null;
    var ds = tt.side === 'cn' ? (cn || vn) : ((cn || []).length > (vn || []).length ? cn : (vn || cn));
    var pv = {};
    (cn || []).forEach(function (s) { if (s.previewUrl) pv[s.name] = s.previewUrl; });
    return (ds || []).map(function (s) {
      if (s.previewUrl || !pv[s.name]) return s;
      var o = {}; for (var k in s) o[k] = s[k]; o.previewUrl = pv[s.name]; return o;
    });
  }

  function dsTab(d) {
    var ra = ['Kỹ năng'];
    if (vkdbCua(d)) ra.push('VKĐB');
    if (anCua(d)) ra.push('Ấn Kế Thừa');
    if ((d.kismet || []).length || menhCachCn(d).length) ra.push('Mệnh Cách');
    if ((d.bonds || []).length) ra.push('Kết Nghĩa');
    if (skinCua(d).length) ra.push('Phục Sức');
    ra.push('Thưởng');
    return ra;
  }

  function bacHienTai(d) {
    var ds = bacCua(d);
    var b = ds.filter(function (x) { return x.q === tt.q; })[0];
    return b || ds[ds.length - 1];
  }

  function noiDungTab(d, bac, qc, fc) {
    if (tt.tab === 'VKĐB') return tabVKDB(d, fc);
    if (tt.tab === 'Ấn Kế Thừa') return tabAn(d, fc);
    if (tt.tab === 'Mệnh Cách') return tabMenhCach(d);
    if (tt.tab === 'Kết Nghĩa') return tabKetNghia(d);
    if (tt.tab === 'Phục Sức') return tabPhucSuc(d, fc);
    if (tt.tab === 'Thưởng') return tabThuong(fc);
    return tabKyNang(d, bac, qc, fc);
  }

  function ve() {
    var d = tt.d;
    var fc = PHE[d.nation] || '#4a9d9d';
    var bac = bacHienTai(d);
    var qc = PHAM[bac.qName] || '#c2c2c2';
    var g = (d.growth || []).filter(function (x) { return x.q === bac.q; })[0] || (d.growth || [])[0];
    if (dsTab(d).indexOf(tt.tab) < 0) tt.tab = 'Kỹ năng';

    var bar = g ? [['Chỉ Huy', g.lead, g.gl], ['Võ', g.war, g.gw], ['Trí', g.int, g.gi]].map(function (h) {
      return '<div class="flex items-center gap-3"><span class="w-16 shrink-0 text-sm text-white/70">' + h[0] + '</span>'
        + '<div class="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">'
        + '<div class="h-full rounded-full transition-all duration-300" style="width:' + (h[1] / CHIA_BAR * 100) + '%;background-color:' + qc + '"></div></div>'
        + '<span class="w-16 shrink-0 text-right text-base font-bold tabular-nums text-white">' + h[1]
        + '<span class="ml-1 text-xs font-semibold" style="color:' + qc + '">+' + h[2] + '</span></span></div>';
    }).join('') : '';

    var nutTab = dsTab(d).map(function (t) {
      var chon = t === tt.tab;
      return '<button type="button" data-nlw-tab2="' + esc(t) + '" class="-mb-px border-b-2 px-3 py-2 text-sm font-medium transition '
        + (chon ? 'border-current text-white' : 'border-transparent text-white/78 hover:text-white/75') + '"'
        + (chon ? ' style="color:' + fc + ';border-color:' + fc + '"' : '') + '>' + esc(t) + '</button>';
    }).join('');

    var coCn = (d.cnTiers || []).length > 0 && (d.viTiers || []).length > 0;
    var doi = !coCn ? '' : '<div class="mb-3 flex overflow-hidden rounded-lg border border-white/15 text-sm">'
      + '<button type="button" data-nlw-side="vi" class="relative flex-1 px-3 py-1.5 font-semibold transition-colors '
      + (tt.side === 'vi' ? 'bg-[#ccc026]/25 text-[#e7d97a]' : 'text-white/50 hover:bg-white/10') + '">Hiện tại (VN)</button>'
      + ('<button type="button" data-nlw-side="cn" class="relative flex-1 px-3 py-1.5 font-semibold transition-colors '
          + (tt.side === 'cn' ? 'bg-[#ccc026]/25 text-[#e7d97a]' : 'text-white/50 hover:bg-white/10') + '">Mới nhất (CN)'
          + (Number(d.cnMaxQ) > Number(d.viMaxQ) ? '<span class="pointer-events-none absolute right-1 top-1 animate-pulse rounded-full border border-amber-200/70 bg-red-500 px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none text-white shadow-[0_0_8px_1px_rgba(239,68,68,0.6)]">Mới</span>' : '')
          + '</button>') + '</div>';

    lop.innerHTML = '<button type="button" aria-label="Previous officer" data-nlw-vt-truoc class="absolute left-3 top-1/2 z-10 -translate-y-1/2 p-3 text-4xl font-bold text-white/70 transition hover:text-white sm:left-8">«</button>'
      + '<button type="button" aria-label="Next officer" data-nlw-vt-sau class="absolute right-3 top-1/2 z-10 -translate-y-1/2 p-3 text-4xl font-bold text-white/70 transition hover:text-white sm:right-8">»</button>'
      + '<div class="animate-card relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl"'
      + ' style="background:radial-gradient(120% 80% at 50% 0%, ' + rgba(fc, 0.133) + ', transparent 55%),'
      + ' linear-gradient(160deg, rgb(29,26,36) 0%, rgb(20,17,24) 55%, rgb(16,13,20) 100%);'
      + ' box-shadow:' + rgba(fc, 0.467) + ' 0px 24px 70px -14px, rgba(255,255,255,0.05) 0px 1px 0px inset">'
      + '<div class="h-1 w-full shrink-0" style="background-color:' + fc + '"></div>'
      + '<div class="overflow-y-auto p-6">'
      + '<div class="flex items-start gap-4"><div class="relative shrink-0">'
      + '<div class="relative shrink-0 overflow-hidden rounded-xl" style="width:104px;height:104px;border:2px solid ' + fc
      + ';box-shadow:' + rgba(fc, 0.267) + ' 0px 0px 14px">'
      + '<img alt="' + esc(d.name) + '" class="block object-cover object-top" style="width:104px;height:104px" src="' + anh(d.img) + '"></div></div>'
      + '<div class="min-w-0 pt-1"><span class="inline-block rounded px-2 py-0.5 text-xs font-medium tracking-[0.1em]"'
      + ' style="background-color:' + rgba(fc, 0.2) + ';border:1px solid ' + fc + '">' + esc(d.nation) + ' · ' + esc(bac.qName) + '</span>'
      + '<h2 class="mt-2 font-[family-name:var(--font-serif-jp)] text-4xl font-bold leading-none text-white">' + esc(d.name) + '</h2></div></div>'
      + '<div class="mt-6 grid gap-x-8 gap-y-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">'
      + '<div><div><div class="mb-3 flex items-baseline justify-between"><p class="text-xs tracking-wider text-white/70">Chỉ số theo phẩm chất</p>'
      + '<span class="text-xs font-medium" style="color:' + qc + '">' + esc(bac.qName) + '</span></div>'
      + '<div class="space-y-3">' + bar + '</div></div>'
      + ((d.units || []).length
          ? '<div class="mt-5 border-t border-white/10 pt-4"><p class="text-xs tracking-wider text-white/70">Binh chủng</p>'
            + '<div class="mt-2 flex flex-wrap gap-1.5">' + d.units.map(function (u) {
                return '<span class="rounded px-2.5 py-1 text-sm text-white/90" style="background-color:' + rgba(fc, 0.18)
                  + ';border:1px solid ' + rgba(fc, 0.4) + '">' + esc(BINH_CN[u] || u) + '</span>';
              }).join('') + '</div></div>' : '')
      + (d.bio ? '<div class="mt-5 border-t border-white/10 pt-4"><p class="text-xs tracking-wider text-white/70">Tiểu sử</p>'
          + '<p class="mt-1.5 text-sm leading-6 text-white/75">' + esc(d.bio) + '</p></div>' : '')
      + '</div>'
      + '<div class="md:border-l md:border-white/10 md:pl-8">' + doi
      + '<div class="mb-4 flex flex-wrap gap-1 border-b border-white/10">' + nutTab + '</div>'
      + '<div>' + noiDungTab(d, bac, qc, fc) + '</div></div></div></div>'
      + '<button type="button" aria-label="Close" data-nlw-dong class="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/70 transition hover:bg-black/70 hover:text-white">✕</button>'
      + '</div>';

    capNhatUrl();
  }

  function capNhatUrl() {
    var u = location.pathname + '?hero=' + tt.d.id + '&side=' + tt.side + '&quality=' + (SLUG_Q[bacHienTai(tt.d).q] || 'gold');
    history.replaceState(null, '', u);
  }

  function maxQ(d, side) {
    var ds = (side === 'cn' ? d.cnTiers : d.viTiers) || [];
    return ds.length ? ds[ds.length - 1].q : null;
  }

  function dsThe() {
    return [].slice.call(document.querySelectorAll('[data-nlw-hero]')).filter(function (e) {
      return e.offsetParent !== null;
    });
  }

  var lopXem = null;

  function moXemKyNang(url) {
    if (lopXem) return;
    lopXem = document.createElement('div');
    lopXem.className = 'fixed inset-0 z-[100] bg-[#0a0910]';
    lopXem.innerHTML = '<p class="absolute inset-0 flex items-center justify-center text-sm text-white/60">Đang tải trận đấu…</p>'
      + '<iframe src="' + esc(url) + '" title="Xem kỹ năng" allow="fullscreen" class="absolute inset-0 h-full w-full" style="border:0"></iframe>'
      + '<div class="absolute right-3 top-3 z-10 flex items-center gap-0.5 rounded-full bg-black/45 px-1 py-0.5 backdrop-blur">'
      + '<a href="' + esc(url) + '" target="_blank" rel="noreferrer" title="Mở trong tab mới"'
      + ' class="rounded-full px-2 py-1 text-sm text-white/55 transition hover:bg-white/10 hover:text-white">↗</a>'
      + '<button type="button" aria-label="Đóng" title="Đóng" data-nlw-dong-xem'
      + ' class="rounded-full px-2 py-1 text-sm text-white/70 transition hover:bg-white/10 hover:text-white">✕</button>'
      + '</div>';
    document.body.appendChild(lopXem);
  }

  function dongXemKyNang() {
    if (!lopXem) return;
    lopXem.remove();
    lopXem = null;
  }

  function dong() {
    if (!lop) return;
    lop.remove();
    lop = null;
    tt = null;
    history.replaceState(null, '', location.pathname);
  }

  function mo(id, the) {
    return Promise.all([taiTra(), taiTuong(id)]).then(function (r) {
      var d = r[1];
      if (!d) return;
      var u = new URLSearchParams(location.search).get('side');
      var side = (u === 'cn' || u === 'vi') ? u : (d.newTier ? 'cn' : 'vi');
      tt = { d: d, side: side, q: maxQ(d, side), tab: 'Kỹ năng', the: the || null };
      resetUi(1, 400);
      veLai = ve;
      if (!lop) {
        lop = document.createElement('div');
        lop.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md';
        lop.setAttribute('role', 'dialog');
        lop.setAttribute('aria-modal', 'true');
        document.body.appendChild(lop);
      }
      ve();
    });
  }

  function chuyen(buoc) {
    var ds = dsThe();
    var i = ds.indexOf(tt.the);
    if (i < 0) return;
    var the = ds[(i + buoc + ds.length) % ds.length];
    mo(the.getAttribute('data-nlw-hero'), the);
  }

  document.addEventListener('click', function (e) {
    var nxem = e.target.closest('[data-nlw-xem]');
    if (nxem) { e.preventDefault(); e.stopPropagation(); return moXemKyNang(nxem.getAttribute('data-nlw-xem')); }
    if (e.target.closest('[data-nlw-dong-xem]')) { e.stopPropagation(); return dongXemKyNang(); }
    if (clickCamp(e)) { e.preventDefault(); e.stopPropagation(); return; }
    var nbung = e.target.closest('[data-nlw-bung]');
    if (nbung && veLai) {
      var kbung = nbung.getAttribute('data-nlw-bung');
      ui.bung[kbung] = !ui.bung[kbung];
      return veLai();
    }
    var the = e.target.closest('[data-nlw-hero]');
    if (the) { e.preventDefault(); e.stopPropagation(); return mo(the.getAttribute('data-nlw-hero'), the); }
    if (!lop) return;
    if (e.target === lop || e.target.closest('[data-nlw-dong]')) return dong();
    if (e.target.closest('[data-nlw-vt-truoc]')) return chuyen(-1);
    if (e.target.closest('[data-nlw-vt-sau]')) return chuyen(1);
    var nq = e.target.closest('[data-nlw-q]');
    if (nq) { tt.q = Number(nq.getAttribute('data-nlw-q')); return ve(); }
    var nt = e.target.closest('[data-nlw-tab2]');
    if (nt) { tt.tab = nt.getAttribute('data-nlw-tab2'); return ve(); }
    var ns = e.target.closest('[data-nlw-side]');
    if (ns) {
      tt.side = ns.getAttribute('data-nlw-side');
      tt.q = maxQ(tt.d, tt.side);
      return ve();
    }
  }, true);

  document.addEventListener('keydown', function (e) {
    if (!lop || lopXem) return;
    if (e.key === 'Escape') return dong();
    if (e.key === 'ArrowLeft') return chuyen(-1);
    if (e.key === 'ArrowRight') return chuyen(1);
  });

  document.addEventListener('change', function (e) {
    var nbac = e.target.closest('[data-nlw-bac]');
    if (nbac && veLai) { ui[nbac.getAttribute('data-nlw-bac')] = Number(nbac.value); return veLai(); }
    var ck = e.target.closest('[data-nlw-ck]');
    if (ck && veLai) { ui.bung.ck = Number(ck.value); return veLai(); }
    var o = e.target.closest('[data-nlw-cp]');
    if (!o || !veLai) return;
    var p2 = o.getAttribute('data-nlw-cp').split('-');
    (p2[1] === 'rank' ? ui.rank : ui.cap)[p2[0]] = Number(o.value);
    veLai();
  });

  document.addEventListener('input', function (e) {
    if (!veLai) return;
    var tu = e.target.closest('[data-nlw-tu]'), den = e.target.closest('[data-nlw-den]');
    if (!tu && !den) return;
    var v = parseInt(e.target.value, 10);
    if (tu) ui.tu = isNaN(v) ? 1 : v; else ui.den = isNaN(v) ? 1 : v;
    var boc = e.target.closest('.fixed.inset-0');
    veLai();
    var o = boc.querySelector(tu ? '[data-nlw-tu]' : '[data-nlw-den]');
    o.focus();
    // input number không cho đặt con trỏ
    if (o.type === 'text') o.setSelectionRange(o.value.length, o.value.length);
  });

  var MAU_KC = '#c07cd6';

  // bản gốc dò ấn theo tên hiệu ứng viết trong mô tả kỹ năng của ấn
  function anTheoBuff(id) {
    var ra = [];
    for (var k in tra.anBuff) {
      var an = tra.anBuff[k];
      for (var i = 0; i < an.buffs.length; i++) {
        if (tenBuff[an.buffs[i].trim().toLowerCase()] === id) { ra.push({ id: k, name: an.name, icon: an.icon }); break; }
      }
    }
    return ra;
  }

  var tenBuff = null;
  function bangTenBuff() {
    if (tenBuff) return;
    tenBuff = {};
    tra.thuTuBuff.forEach(function (k) { tenBuff[tra.buff[k].name.toLowerCase()] = k; });
  }

  function oTuong(id) {
    var h = tra.mini[id];
    if (!h) return '';
    var m = PHE[h.p] || '#4a9d9d';
    return '<button type="button" data-nlw-hero="' + id + '" class="flex flex-col items-center gap-1 rounded-lg p-1 transition hover:bg-white/10">'
      + '<div class="relative shrink-0 overflow-hidden rounded-xl" style="width:52px;height:52px;border:2px solid ' + m
      + ';box-shadow:' + rgba(m, 0.267) + ' 0px 0px 14px">'
      + '<img alt="' + esc(h.n) + '" class="block object-cover object-top" style="width:52px;height:52px" src="' + anh(h.i) + '"></div>'
      + '<span class="w-full truncate text-center text-xs text-white/70">' + esc(h.n) + '</span></button>';
  }

  function luoi(nhan, noi) {
    return '<div><p class="mb-2 text-xs font-medium tracking-wide text-white/78">' + nhan + '</p>'
      + '<div class="grid grid-cols-4 gap-2 sm:grid-cols-6">' + noi + '</div></div>';
  }

  function veBuff(id) {
    var b = tra.trang[id];
    if (!b) return;
    bangTenBuff();
    var c = mauBuff(b);
    var nhomTuong = [['Từ Kỹ năng', (b.src || {}).skill || []], ['Từ Vũ Khí Đặc Biệt', (b.src || {}).weapon || []]]
      .map(function (x) { return [x[0], x[1].filter(function (h) { return tra.mini[h]; })]; })
      .filter(function (x) { return x[1].length; });
    var dsAn = anTheoBuff(id);
    var tong = nhomTuong.reduce(function (a, x) { return a + x[1].length; }, 0);

    var than = nhomTuong.map(function (x) {
      return luoi(x[0] + ' · ' + x[1].length, x[1].map(oTuong).join(''));
    }).join('');

    var khoiAn = !dsAn.length ? '' : '<div' + (nhomTuong.length ? ' class="mt-4"' : '') + '>'
      + '<p class="mb-2 text-xs font-medium tracking-wide text-white/78">Từ Ấn Kế Thừa · ' + dsAn.length + '</p>'
      + '<div class="grid grid-cols-4 gap-2 sm:grid-cols-6">' + dsAn.map(function (a) {
          return '<button type="button" data-nlw-an="' + esc(a.id) + '" class="flex flex-col items-center gap-1 rounded-lg p-1 transition hover:bg-white/10">'
            + '<span class="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-lg border border-white/15"'
            + ' style="background:radial-gradient(circle at 50% 40%, rgba(255,255,255,0.5), rgba(220,222,235,0.18))">'
            + '<img alt="' + esc(a.name) + '" class="h-full w-full object-contain p-1" src="' + anh(a.icon) + '"></span>'
            + '<span class="w-full truncate text-center text-xs text-white/70">' + esc(a.name) + '</span></button>';
        }).join('') + '</div></div>';

    lopBuff.innerHTML = '<div class="animate-card relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl"'
      + ' style="background:radial-gradient(120% 80% at 50% 0%, ' + rgba(c, 0.133) + ', transparent 55%),'
      + ' linear-gradient(160deg, rgb(29,26,36) 0%, rgb(20,17,24) 55%, rgb(16,13,20) 100%);'
      + ' box-shadow:' + rgba(c, 0.467) + ' 0px 24px 70px -14px">'
      + '<div class="h-1 w-full shrink-0" style="background-color:' + c + '"></div>'
      + '<div class="overflow-y-auto p-6"><div class="flex items-start gap-4">'
      + '<span class="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl" style="background-color:' + rgba(c, 0.1)
      + ';border:1px solid ' + rgba(c, 0.4) + '">'
      + (b.icon ? '<img alt="' + esc(b.name) + '" class="h-full w-full object-cover" src="' + anh(b.icon) + '">' : '')
      + '</span><div class="min-w-0 pt-1"><div class="flex flex-wrap items-center gap-1.5">'
      + '<span class="shrink-0 rounded px-1.5 py-0.5 text-xs font-medium" style="color:' + c + ';background-color:'
      + rgba(c, 0.133) + ';border:1px solid ' + rgba(c, 0.4) + '">'
      + (b.und ? 'Trung Lập' : b.type === 'buff' ? 'Có lợi' : 'Bất lợi') + '</span>'
      + (b.ctl ? '<span class="shrink-0 rounded px-1.5 py-0.5 text-xs font-medium" style="color:' + MAU_KC
          + ';background-color:' + rgba(MAU_KC, 0.133) + ';border:1px solid ' + rgba(MAU_KC, 0.4) + '">Khống chế</span>' : '')
      + (b.und ? '<span class="shrink-0 rounded bg-amber-400/15 px-1.5 py-0.5 text-xs font-medium text-amber-300"'
          + ' style="border:1px solid rgba(251,191,36,0.4)">Không thể giải trừ</span>' : '')
      + '</div><h2 class="mt-1.5 font-[family-name:var(--font-serif-jp)] text-2xl font-bold leading-none text-white">'
      + esc(b.name) + '</h2></div></div>'
      + '<p class="mt-4 text-sm leading-6 text-white/85">' + esc(b.ing) + '</p>'
      + ((nhomTuong.length || dsAn.length)
          ? '<div class="mt-5 border-t border-white/10 pt-4">'
            + (nhomTuong.length ? '<p class="mb-3 text-xs tracking-wider text-white/70">Tướng sử dụng · ' + tong + '</p>'
                + '<div class="space-y-4">' + than + '</div>' : '')
            + khoiAn + '</div>' : '')
      + '</div>'
      + '<button type="button" aria-label="Close" data-nlw-dong-buff class="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/70 transition hover:bg-black/70 hover:text-white">✕</button>'
      + '</div>';
    history.replaceState(null, '', location.pathname + '?buff=' + id);
  }

  var MAU_AN = '#c9a24b';
  var MAU_BINH = { 1: '#c98b3b', 2: '#3b8fc9', 3: '#c0392b', 4: '#27865b', 5: '#7d5ba6',
                   6: '#2b9a8f', 7: '#2f7bb0', 8: '#5a6bb5' };
  var CHI_SO_BINH = [['Vật Công', 'leaderAtk'], ['Vật Phòng', 'leaderDef'], ['Pháp Công', 'strengthAtk'],
                     ['Pháp Phòng', 'strengthDef'], ['Mưu Công', 'intellectAtk'], ['Mưu Phòng', 'intellectDef'],
                     ['Bạo Kích', 'critical'], ['Phản Kích', 'strikeBack']];
  var lopBinh = null;
  var lopAn = null;
  var anDangMo = null;

  function oAnh(ten, lop2, lopAnh) {
    return '<span class="' + lop2 + '" style="background:radial-gradient(circle at 50% 40%, rgba(255,255,255,0.5), rgba(220,222,235,0.18))">'
      + (ten ? '<img alt="" class="' + lopAnh + '" src="' + anh(ten) + '">' : '') + '</span>';
  }

  function veAn(id) {
    var a = tra.anChiTiet[id];
    var fc = MAU_AN;
    var chip = (a.units || []).map(function (u) {
      return '<span class="shrink-0 rounded px-1.5 py-0.5 text-xs font-medium" style="color:' + fc
        + ';background-color:' + rgba(fc, 0.133) + ';border:1px solid ' + rgba(fc, 0.4) + '">' + esc(u) + '</span>';
    }).join('');

    var nguon = a.achievement
      ? '<div class="mt-4 rounded-lg border border-amber-300/25 bg-amber-300/10 p-3">'
        + '<p class="text-xs font-semibold text-amber-200">Nguồn (Thành Tựu)</p>'
        + '<p class="mt-1 text-sm text-white/85">' + esc(a.achievement.condition) + '</p>'
        + (a.achievement.story ? '<p class="mt-1.5 text-xs italic leading-5 text-white/72">' + esc(a.achievement.story) + '</p>' : '')
        + '</div>'
      : (a.unlockQuality ? '<p class="mt-3 text-xs text-white/70">Chỉ mở khóa từ ' + esc(a.unlockQuality) + '</p>' : '');

    var kn = (a.skills || []).map(function (k) {
      return '<div class="flex gap-3 rounded-lg border border-white/10 bg-white/[0.05] p-2.5">'
        + (k.icon ? oAnh(k.icon, 'relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/15', 'h-7 w-7 object-contain') : '')
        + '<p class="text-xs leading-5 text-white/85"><span class="font-medium text-white/95">' + esc(k.name) + '</span>：'
        + veMoTa(k.desc) + '</p></div>';
    }).join('');

    var tuong = (a.heroIds || []).filter(function (h) { return tra.mini[h]; });
    var khoiTuong = !tuong.length ? '' : '<div class="mt-5 border-t border-white/10 pt-4">'
      + '<p class="mb-3 text-xs tracking-wider text-white/70">Tướng sở hữu · ' + tuong.length + '</p>'
      + '<div class="grid grid-cols-4 gap-2 sm:grid-cols-6">' + tuong.map(oTuong).join('') + '</div></div>';

    var chiSo = !(a.stats && a.stats.length) ? '' : '<div class="mt-4">'
      + bangThuocTinh(a.stats, fc, function (x) {
          var k = x.pct ? '%' : '';
          return [x.name, '+' + x.base + k, '+' + x.value + k];
        }).replace('</div></div>', '</div>' + khoiTangTruong(a.stats, fc, 'an') + '</div>')
      + khoiChiPhi('seal', fc) + '</div>';

    lopAn.innerHTML = '<div class="animate-card relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl"'
      + ' style="background:radial-gradient(120% 80% at 50% 0%, ' + rgba(fc, 0.133) + ', transparent 55%),'
      + ' linear-gradient(160deg, rgb(29,26,36) 0%, rgb(20,17,24) 55%, rgb(16,13,20) 100%);'
      + ' box-shadow:' + rgba(fc, 0.467) + ' 0px 24px 70px -14px">'
      + '<div class="h-1 w-full shrink-0" style="background-color:' + fc + '"></div>'
      + '<div class="overflow-y-auto p-6"><div class="flex items-start gap-4">'
      + (a.icon ? oAnh(a.icon, 'relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/15', 'h-full w-full object-contain p-1') : '')
      + '<div class="min-w-0 pt-1">'
      + '<h2 class="font-[family-name:var(--font-serif-jp)] text-2xl font-bold leading-none text-white">' + esc(a.name) + '</h2>'
      + (chip ? '<div class="mt-2"><span class="mr-1.5 text-xs text-white/78">Binh chủng phù hợp:</span>'
          + '<span class="inline-flex flex-wrap gap-1.5 align-middle">' + chip + '</span></div>' : '')
      + '</div></div>' + nguon + chiSo
      + (kn ? '<div class="mt-4 space-y-2">' + kn + '</div>' : '') + khoiTuong + '</div>'
      + '<button type="button" aria-label="Close" data-nlw-dong-an class="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/70 transition hover:bg-black/70 hover:text-white">✕</button>'
      + '</div>';
    history.replaceState(null, '', location.pathname + '?seal=' + id);
  }

  function moAn(id) {
    return taiTra().then(function () {
      if (!tra.anChiTiet[id]) return;
      anDangMo = id;
      resetUi(1, 400);
      veLai = function () { veAn(anDangMo); };
      if (!lopAn) {
        lopAn = document.createElement('div');
        lopAn.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md';
        lopAn.setAttribute('role', 'dialog');
        lopAn.setAttribute('aria-modal', 'true');
        document.body.appendChild(lopAn);
      }
      veAn(id);
    });
  }

  function dongAn() {
    if (!lopAn) return;
    lopAn.remove();
    lopAn = null;
    anDangMo = null;
    history.replaceState(null, '', location.pathname);
  }

  function chipTienHoa(ds, nhan, fc) {
    var o = (ds || []).map(function (id) {
      var u = tra.binh.units[id];
      if (!u) return '';
      return '<button type="button" data-nlw-unit="' + esc(id) + '" style="--c:' + fc + '"'
        + ' class="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] py-0.5 pl-0.5 pr-2.5 text-xs text-white/85 transition hover:border-[color:var(--c)] hover:bg-white/10">'
        + '<span class="relative h-5 w-5 shrink-0 overflow-hidden rounded-full bg-black/30">'
        + (u.icon ? '<img alt="" class="h-full w-full object-contain" src="' + anh(u.icon) + '">' : '') + '</span>'
        + esc(u.name) + '</button>';
    }).join('');
    if (!o) return '';
    return '<div class="mt-4"><p class="mb-2 text-xs tracking-wider text-white/70">' + nhan + '</p>'
      + '<div class="flex flex-wrap gap-1.5">' + o + '</div></div>';
  }

  function veBinh(id) {
    var u = tra.binh.units[id];
    var fc = MAU_BINH[u.type] || MAU_AN;

    var chiSo = CHI_SO_BINH.map(function (x) {
      return '<div class="flex items-baseline justify-between gap-2"><span class="text-xs text-white/72">' + x[0] + '</span>'
        + '<span class="text-sm font-semibold tabular-nums text-white">' + ((u.stats || {})[x[1]] || 0) + '</span></div>';
    }).join('');

    var th = chipTienHoa(u.evolveFrom, 'Tiến hóa từ', fc) + chipTienHoa(u.evolveTo, 'Tiến hóa lên', fc);

    var skin = !(u.skins && u.skins.length) ? '' : '<div class="mt-5 border-t border-white/10 pt-4">'
      + '<p class="mb-3 text-xs tracking-wider text-white/70">Trang phục · ' + u.skins.length + '</p>'
      + '<div class="space-y-2.5">' + u.skins.map(function (k) {
          var mini = [['Vật Công', 'leaderAtk'], ['Pháp Công', 'strengthAtk'], ['Mưu Công', 'intellectAtk'], ['Bạo Kích', 'critical']]
            .map(function (x) {
              return '<div class="flex items-baseline justify-between gap-1"><span class="text-xs text-white/78">' + x[0] + '</span>'
                + '<span class="text-xs font-semibold tabular-nums text-white/90">' + ((k.stats || {})[x[1]] || 0) + '</span></div>';
            }).join('');
          return '<div class="flex gap-3 rounded-lg border border-white/10 bg-white/[0.05] p-3">'
            + '<span class="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/15 bg-black/30">'
            + (k.icon ? '<img alt="" class="h-full w-full object-contain p-0.5" src="' + anh(k.icon) + '">' : '') + '</span>'
            + '<div class="min-w-0 flex-1"><p class="text-sm font-semibold text-white">' + esc(k.name) + '</p>'
            + (k.desc ? '<p class="mt-0.5 text-xs leading-5 text-white/78">' + esc(k.desc) + '</p>' : '')
            + '<div class="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 sm:grid-cols-4">' + mini + '</div></div></div>';
        }).join('') + '</div></div>';

    var dacBiet = '';
    if (u.tier === 7) {
      var ds = (tra.binh.specials || []).filter(function (x) { return (x.types || []).indexOf(u.type) >= 0; });
      if (ds.length) {
        dacBiet = '<div class="mt-5 border-t border-white/10 pt-4">'
          + '<p class="mb-3 text-xs tracking-wider text-white/70">Hiệu ứng đặc biệt (Cấp 7)</p>'
          + '<div class="space-y-2.5">' + ds.map(function (x) {
              return '<div class="rounded-lg border border-white/10 bg-white/[0.05] p-3">'
                + '<p class="text-sm font-semibold text-white">' + esc(x.name) + '</p>'
                + '<ul class="mt-1 space-y-0.5">' + (x.levels || []).map(function (v, i) {
                    return '<li class="text-xs leading-5 text-white/75"><span class="mr-1 text-white/72">Lv' + (i + 1) + '</span>'
                      + veMoTa(v) + '</li>';
                  }).join('') + '</ul></div>';
            }).join('') + '</div></div>';
      }
    }

    lopBinh.innerHTML = '<div class="animate-card relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl"'
      + ' style="background:radial-gradient(120% 80% at 50% 0%, ' + rgba(fc, 0.133) + ', transparent 55%),'
      + ' linear-gradient(160deg, rgb(29,26,36) 0%, rgb(20,17,24) 55%, rgb(16,13,20) 100%);'
      + ' box-shadow:' + rgba(fc, 0.467) + ' 0px 24px 70px -14px">'
      + '<div class="h-1 w-full shrink-0" style="background-color:' + fc + '"></div>'
      + '<div class="overflow-y-auto p-6"><div class="flex items-start gap-4">'
      + (u.icon ? '<span class="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-black/30">'
          + '<img alt="" class="h-full w-full object-contain p-1" src="' + anh(u.icon) + '"></span>' : '')
      + '<div class="min-w-0 pt-1"><div class="flex flex-wrap items-center gap-1.5">'
      + '<span class="rounded px-2 py-0.5 text-xs font-medium" style="color:' + fc + ';background-color:' + rgba(fc, 0.133)
      + ';border:1px solid ' + fc + '">' + esc(u.typeName) + ' · ' + (u.tier === 99 ? 'Khác' : 'Cấp ' + u.tier) + '</span>'
      + (u.npc ? '<span title="Chỉ xuất hiện ở NPC Phó Bản" class="rounded bg-[#7d5ba6] px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none text-white">NPC</span>' : '')
      + (u.variantOf ? '<span class="rounded bg-white/10 px-2 py-0.5 text-xs text-white/70">Biến thể từ: ' + esc(u.variantOf) + '</span>' : '')
      + '</div><h2 class="mt-1.5 font-[family-name:var(--font-serif-jp)] text-2xl font-bold leading-none text-white">' + esc(u.name) + '</h2>'
      + '</div></div>'
      + (u.desc ? '<p class="mt-4 text-sm leading-6 text-white/85">' + veMoTa(u.desc) + '</p>' : '')
      + '<div class="mt-5 border-t border-white/10 pt-4"><p class="mb-2 text-xs tracking-wider text-white/70">Chỉ số</p>'
      + '<div class="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-4">' + chiSo + '</div></div>'
      + (th ? '<div class="mt-5 border-t border-white/10 pt-4">' + th + '</div>' : '')
      + skin + dacBiet + '</div>'
      + '<button type="button" aria-label="Close" data-nlw-dong-binh class="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/70 transition hover:bg-black/70 hover:text-white">✕</button>'
      + '</div>';
    // urlCamp() bỏ tham số phụ khi trang không có phó bản, nên tự nối ?unit= ở đây
    var goc = urlCamp('');
    history.replaceState(null, '', goc + (goc.indexOf('?') < 0 ? '?' : '&') + 'unit=' + id);
  }

  function moBinh(id) {
    return taiTra().then(function () {
      if (!tra.binh.units[id]) return;
      if (!lopBinh) {
        lopBinh = document.createElement('div');
        lopBinh.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md';
        lopBinh.setAttribute('role', 'dialog');
        lopBinh.setAttribute('aria-modal', 'true');
        document.body.appendChild(lopBinh);
      }
      veBinh(id);
    });
  }

  function dongBinh() {
    if (!lopBinh) return;
    lopBinh.remove();
    lopBinh = null;
    history.replaceState(null, '', urlCamp(''));
  }

  var MAU_BAC_TK = { 1: '#3b8fc9', 2: '#a259c8', 3: '#e0842d' };
  var lopTk = null;
  var tkDangMo = null;

  function hangTK(nhan, tu, den, mau) {
    return '<div class="flex items-center justify-between rounded-lg border border-white/10 px-3 py-1.5 text-sm">'
      + '<span class="text-white/70">' + esc(nhan) + '</span>'
      + '<span class="flex items-center gap-2 tabular-nums"><span class="text-white/45">' + esc(tu) + '</span>'
      + '<span class="text-white/35">→</span><span class="font-semibold ' + mau + '">' + esc(den) + '</span></span></div>';
  }

  function nhomQua(tieu, ghi, ds) {
    if (!ds.length) return '';
    var o = ds.slice().sort(function (a, b) { return b.effect - a.effect; }).map(function (g) {
      return '<div class="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] p-2">'
        + (g.icon ? '<span class="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-white/15 bg-black/30">'
            + '<img alt="" class="h-full w-full object-contain p-0.5" src="' + anh(g.icon) + '"></span>' : '')
        + '<span class="min-w-0 flex-1"><span class="block truncate text-xs font-semibold text-white">' + esc(g.name) + '</span>'
        + '<span class="text-[11px] text-emerald-300">+' + so(g.effect) + ' Thiện Cảm <span class="text-white/40">(= +' + so(g.effect) + ' EXP)</span></span>'
        + (g.needScore > 0 ? '<span class="block text-[11px] text-amber-300/80">Mở tại ' + so(g.needScore) + ' điểm Thiện Cảm</span>' : '')
        + '</span></div>';
    }).join('');
    return '<div class="mt-3 first:mt-0"><p class="text-xs font-semibold text-white/80">' + tieu + '</p>'
      + '<p class="mb-2 text-[11px] leading-4 text-white/45">' + ghi + '</p>'
      + '<div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">' + o + '</div></div>';
  }

  function veTriKy(id) {
    var w = tra.triKy.beauties[id];
    var fc = MAU_BAC_TK[w.tier] || MAU_AN;
    var tu = Math.max(1, Math.min(ui.tu, ui.den));
    var den = Math.min(220, Math.max(ui.tu, ui.den));
    var bangExp = tra.triKy.exp[w.tier] || { exp: [], material: [] };
    var exp = Math.max(0, (bangExp.exp[den] || 0) - (bangExp.exp[tu] || 0));
    var nl = 0;
    for (var i = tu + 1; i <= den; i++) nl += bangExp.material[i] || 0;
    var rate = tra.triKy.rate[w.tier] || [];
    var moc = (w.breaks || []).filter(function (x) { return x.level > tu && x.level <= den; });
    var vat = tra.triKy.material || {};

    var chip = !moc.length ? '' : '<p class="mb-1.5 text-[11px] font-semibold text-white/70">Thưởng Thức Tỉnh (đột phá) trong khoảng</p>'
      + '<div class="flex flex-wrap gap-1.5">' + moc.map(function (x) {
          return '<span class="rounded-md border border-[#e7d97a]/25 bg-[#e7d97a]/10 px-2 py-0.5 text-xs text-[#e7d97a]">Cấp '
            + x.level + ': +' + x.value + '</span>';
        }).join('') + '</div>';

    var oSo = 'w-16 rounded-lg border border-white/25 bg-black/40 px-2 py-1.5 text-center text-base font-bold tabular-nums text-white focus:border-[#c9a24b] focus:outline-none';
    var qua = !(tra.triKy.gifts || []).length ? '' : '<div class="mt-5 border-t border-white/10 pt-4">'
      + '<p class="mb-1 text-xs tracking-wider text-white/70">Danh Phẩm (quà tặng Thiện Cảm)</p>'
      + '<p class="mb-1 text-[11px] leading-4 text-white/45">Tặng Danh Phẩm để tăng Thiện Cảm → mở khoá &amp; nuôi Trưởng Thành.'
      + ' Danh Phẩm cao cấp cần đạt đủ <span class="text-amber-300/80">điểm mở khoá</span> mới tặng được.</p>'
      + (w.tier >= 3 ? nhomQua('Danh Phẩm Bậc 3 (sở thích)',
          'Dành riêng Tri Kỷ Bậc 3. Mỗi nàng có 1 món YÊU THÍCH (cho nhiều Thiện Cảm hơn hẳn) — món yêu thích theo sở thích riêng của từng nàng, kiểm tra biểu tượng ❤ trong game để biết chính xác.',
          tra.triKy.gifts.filter(function (g) { return g.famousType === 1; })) : '')
      + nhomQua('Danh Phẩm thường', 'Dùng cho mọi Tri Kỷ để tăng Thiện Cảm.',
          tra.triKy.gifts.filter(function (g) { return g.famousType !== 1; }))
      + '</div>';

    lopTk.innerHTML = '<div class="animate-card relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl"'
      + ' style="background:radial-gradient(120% 80% at 50% 0%, ' + rgba(fc, 0.133) + ', transparent 55%),'
      + ' linear-gradient(160deg, rgb(29,26,36) 0%, rgb(20,17,24) 55%, rgb(16,13,20) 100%);'
      + ' box-shadow:' + rgba(fc, 0.467) + ' 0px 24px 70px -14px">'
      + '<div class="h-1 w-full shrink-0" style="background-color:' + fc + '"></div>'
      + '<div class="overflow-y-auto p-6"><div class="flex items-start gap-4">'
      + (w.icon ? '<span class="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-black/30">'
          + '<img alt="' + esc(w.name) + '" class="h-full w-full object-cover" src="' + anh(w.icon) + '"></span>' : '')
      + '<div class="min-w-0 pt-1">'
      + '<span class="inline-block rounded px-2 py-0.5 text-xs font-medium" style="color:' + fc + ';background-color:'
      + rgba(fc, 0.133) + ';border:1px solid ' + fc + '">Bậc ' + w.tier + ' · ' + esc(w.statName) + '</span>'
      + '<h2 class="mt-1.5 font-[family-name:var(--font-serif-jp)] text-2xl font-bold leading-none text-white">' + esc(w.name) + '</h2>'
      + (w.temperaName ? '<div class="mt-2 rounded-lg border border-amber-300/25 bg-amber-300/10 p-2">'
          + '<p class="text-xs font-semibold text-amber-200">Khí chất: ' + esc(w.temperaName) + '</p>'
          + (w.temperaBonus ? '<p class="mt-0.5 text-xs leading-5 text-white/70">' + esc(w.temperaBonus) + '</p>' : '') + '</div>' : '')
      + '</div></div>'
      + '<div class="mt-5 border-t border-white/10 pt-4">'
      + '<div class="flex flex-wrap items-center gap-2">'
      + '<p class="text-xs font-semibold tracking-wider text-[#e7d97a]">Trưởng Thành</p>'
      + '<span class="ml-auto flex items-center gap-2 text-xs text-white/60">Từ cấp'
      + '<input type="number" min="1" max="220" data-nlw-tu class="' + oSo + '" aria-label="Từ cấp" value="' + ui.tu + '">đến'
      + '<input type="number" min="1" max="220" data-nlw-den class="' + oSo + '" aria-label="Đến cấp" value="' + ui.den + '"></span></div>'
      + '<div class="mt-3 space-y-1.5">'
      + hangTK(w.statName, (w.growth || [])[tu] || 0, (w.growth || [])[den] || 0, 'text-[#8fd0f0]')
      + (w.stat2Name ? hangTK(w.stat2Name, (w.growth2 || [])[tu] || 0, (w.growth2 || [])[den] || 0, 'text-[#8fd0f0]') : '')
      + hangTK('Gia tăng Thê Tử', '+' + ((rate[tu] || 0) * 100).toFixed(1) + '%', '+' + ((rate[den] || 0) * 100).toFixed(1) + '%', 'text-emerald-300')
      + '</div>'
      + '<div class="mt-3 grid grid-cols-2 gap-2">'
      + '<div class="flex items-center justify-between rounded-lg bg-[#c9a24b]/12 px-3 py-2.5 ring-1 ring-[#c9a24b]/25">'
      + '<span class="text-xs text-white/75">EXP (Thiện Cảm)</span>'
      + '<span class="text-base font-bold text-[#e7d97a] tabular-nums">' + so(exp) + '</span></div>'
      + '<div class="flex items-center gap-2 rounded-lg bg-[#c9a24b]/12 px-3 py-2 ring-1 ring-[#c9a24b]/25">'
      + (vat.icon ? '<span class="relative h-7 w-7 shrink-0 overflow-hidden rounded-md border border-white/15 bg-black/30">'
          + '<img alt="" class="h-full w-full object-contain p-0.5" src="' + anh(vat.icon) + '"></span>' : '')
      + '<span class="min-w-0 flex-1"><span class="block truncate text-[11px] text-white/70">' + esc(vat.name || 'Long Phượng Bội') + '</span>'
      + '<span class="text-sm font-bold text-white/90 tabular-nums">' + (nl ? so(nl) : '—') + '</span></span></div></div>'
      + (chip ? '<div class="mt-3">' + chip + '</div>' : '')
      + '<p class="mt-2 text-[11px] leading-4 text-white/45">Cấp ' + tu + ' → ' + den
      + '. EXP = tổng Thiện Cảm cần (tặng Danh Phẩm để có); <span class="text-white/60">' + esc(vat.name || 'Long Phượng Bội')
      + '</span> dùng đột phá ở các mốc 201/206/211/216…</p></div>'
      + qua + '</div></div>';
    history.replaceState(null, '', location.pathname + '?beauty=' + id);
  }

  function moTriKy(id) {
    return taiTra().then(function () {
      if (!tra.triKy.beauties[id]) return;
      tkDangMo = id;
      resetUi(1, 220);
      veLai = function () { veTriKy(tkDangMo); };
      if (!lopTk) {
        lopTk = document.createElement('div');
        lopTk.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md';
        document.body.appendChild(lopTk);
      }
      veTriKy(id);
    });
  }

  function dongTriKy() {
    if (!lopTk) return;
    lopTk.remove();
    lopTk = null;
    tkDangMo = null;
    history.replaceState(null, '', location.pathname);
  }

  var MAU_VP = '#3b8fc9';
  var VAI_BAT = [[1,100,100],[2,150,100],[3,200,100],[4,250,90],[5,300,80],[6,350,70],
                 [7,400,60],[8,450,50],[9,500,40],[10,550,30]];
  var TIEU_VP = 'p.text-xs.font-semibold.tracking-wider';
  var lopVp = null;
  var vpDangMo = null;
  var khoVp = null;
  var khoaVp = null;

  function khoiVP(tieu, than, mauTieu) {
    return '<div class="mt-5 border-t border-white/10 pt-4">'
      + '<p class="text-xs font-semibold tracking-wider text-[' + (mauTieu || '#8fd0f0') + ']">' + tieu + '</p>'
      + than + '</div>';
  }

  function lienKetVP(id, ten) {
    var c = tra.kho[id];
    var nhan = ten || (c && c.name) || id;
    var trong = (c && c.icon ? '<span class="relative inline-block h-4 w-4 shrink-0 overflow-hidden rounded-sm border border-white/15 bg-black/30">'
        + '<img alt="" class="h-full w-full object-contain" src="' + anh(c.icon) + '"></span>' : '') + '<span>' + esc(nhan) + '</span>';
    var than = '<span class="inline-flex items-center gap-1 align-middle">' + trong + '</span>';
    if (!id) return than;
    return '<button type="button" data-nlw-item="' + esc(id) + '" class="underline decoration-dotted underline-offset-2 transition-colors hover:text-white">'
      + than + '</button>';
  }

  function bacCuongHoa(e, ch, heSo) {
    var G = 1 / 600;
    var t = ch.inc * ch.coef * e * (0.22 + e * e * G) * heSo * G + 5 * e + 3 * ch.inc;
    if (e >= 200) t = t * 2;
    return Math.floor(t);
  }

  function ngocCuongHoa(e) {
    if (e <= 200) return 0;
    if (e > 260) return e;
    return 40 * Math.ceil((e - 200) / 10);
  }

  function nhomThuocTinh(ten) {
    var t = String(ten || '').toLowerCase();
    if (t.indexOf('tấn công cuối') >= 0) return ['#d95a4a', 'Tăng sát thương cuối cùng gây ra.'];
    if (t.indexOf('tăng st cuối') >= 0) return ['#d95a4a', 'Tăng sát thương cuối cùng gây ra.'];
    if (t.indexOf('né tránh cuối') >= 0) return ['#4a90d9', 'Giảm sát thương cuối cùng phải chịu.'];
    if (t.indexOf('diệt') >= 0) return ['#d95a4a', 'Tăng sát thương lên loại binh chủng tương ứng.'];
    if (t.indexOf('kháng') >= 0) return ['#4a90d9', 'Giảm sát thương phải chịu từ binh chủng tương ứng.'];
    if (t.indexOf('bỏ qua pt') >= 0) return ['#d95a4a', 'Bỏ qua một phần phòng thủ của mục tiêu.'];
    if (t.indexOf('bạo kích') >= 0) return ['#e7d97a', 'Tăng tỉ lệ / sát thương bạo kích.'];
    if (/vật công|mưu công|pháp công/.test(t)) return ['#d95a4a', 'Tăng chỉ số tấn công.'];
    if (/phòng|thủ/.test(t)) return ['#4a90d9', 'Tăng chỉ số phòng thủ.'];
    if (/c\.huy|võ|trí|lính/.test(t)) return ['#42ad5c', 'Tăng chỉ số cơ bản.'];
    return ['#9aa4b2', 'Thuộc tính Tinh Luyện.'];
  }

  function cotTinhLuyen(nhan, ds, tone) {
    if (!ds || !ds.length) return '';
    var li = ds.slice().sort(function (a, b) { return b.rate - a.rate; }).map(function (x) {
      var n = nhomThuocTinh(x.name);
      var m = String(x.name || '').match(/^\[([^\]]+)\]\s*(.*)$/);
      var ten = m ? '<span class="font-semibold text-[#e7d97a]">[' + esc(m[1]) + ']</span> <span class="text-white/85">' + esc(m[2]) + '</span>'
        : '<span class="text-white/85">' + esc(x.name) + '</span>';
      return '<li class="flex items-start gap-1.5 text-xs" title="' + esc(n[1]) + '">'
        + '<span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style="background-color:' + n[0] + '"></span>'
        + '<span class="min-w-0 flex-1 break-words leading-4">' + ten + '</span>'
        + '<span class="shrink-0 rounded px-1 py-0.5 text-[10px] font-bold tabular-nums" style="color:' + n[0]
        + ';background-color:' + rgba(n[0], 0.122) + '">' + Math.round(x.rate * 100) + '%</span></li>';
    }).join('');
    return '<div class="rounded-lg border border-white/10 bg-white/[0.02] p-2.5">'
      + '<span class="inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold" style="color:' + tone
      + ';background-color:' + rgba(tone, 0.133) + ';border:1px solid ' + rgba(tone, 0.333) + '">' + nhan + '</span>'
      + '<ul class="mt-2 space-y-1.5">' + li + '</ul></div>';
  }

  function veVatPham(id) {
    var it = khoVp[id];
    if (!it) return;
    var cap = Math.max(1, ui.den);
    var tu = Math.max(1, ui.tu);

    var dau = '<div class="flex items-start gap-4">'
      + (it.icon ? '<span class="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-black/30">'
          + '<img alt="' + esc(it.name) + '" class="h-full w-full object-contain p-1" src="' + anh(it.icon) + '"></span>' : '')
      + '<div class="min-w-0 pt-1"><h2 class="text-2xl font-bold leading-none text-white">' + esc(it.name) + '</h2>'
      + '<p class="mt-1.5 text-xs text-white/70">' + esc(it.typeName)
      + (it.level ? ' · Cấp ' + it.level : '') + (it.sell ? ' · Bán ' + it.sell : '') + '</p></div></div>'
      + (it.desc ? '<p class="mt-4 text-sm leading-6 text-white/80">' + esc(it.desc) + '</p>' : '');

    var moThuong = '';
    if ((it.refundTiers || []).length) {
      var maxCh = Math.max.apply(null, it.refundTiers.map(function (x) { return x.chance; }));
      var hang = it.refundTiers.map(function (x) {
        var pc = x.chance * 100;
        return '<div class="flex items-center gap-2.5">'
          + '<span class="w-24 shrink-0 text-right text-sm font-semibold tabular-nums text-[#e7d97a]">' + so(x.value)
          + ' <span class="text-[11px] font-normal text-white/50">Vàng</span></span>'
          + '<span class="relative h-4 flex-1 overflow-hidden rounded bg-white/[0.06]">'
          + '<span class="absolute inset-y-0 left-0 rounded bg-gradient-to-r from-[#c9a24b]/70 to-[#e7d97a]/70" style="width:'
          + (x.chance / maxCh * 100) + '%"></span></span>'
          + '<span class="w-14 shrink-0 text-right text-xs tabular-nums text-white/75">' + pc.toFixed(pc < 1 ? 2 : 1) + '%</span></div>';
      }).join('');
      moThuong = '<div class="mt-5 border-t border-white/10 pt-4">'
        + '<div class="flex items-baseline justify-between gap-2">'
        + '<p class="text-xs font-semibold tracking-wider text-[#e7d97a]">Tỉ lệ mở</p>'
        + (it.refundGold != null ? '<span class="text-xs text-white/60">Trung bình ~<b class="text-[#e7d97a]">'
            + so(Math.round(it.refundGold)) + ' Vàng</b>/lần</span>' : '') + '</div>'
        + '<div class="mt-2 space-y-1.5">' + hang + '</div>'
        + '<p class="mt-2.5 text-[11px] leading-4 text-white/45">Tỉ lệ lấy từ dữ liệu game, mở nhiều lần kết quả sẽ tiệm cận mức trung bình.</p></div>';
    }

    var oCap = 'w-24 rounded-lg border border-white/25 bg-black/40 px-3 py-2 text-center text-lg font-bold tabular-nums text-white focus:border-[#3b8fc9] focus:outline-none';
    var thuocTinh = '';
    if ((it.stats || []).length) {
      var coGrow = it.stats.some(function (x) { return (x.growth || 0) > 0; });
      var oNhap = !coGrow ? '' : '<label class="mt-2 flex items-center gap-2.5 text-xs font-medium text-white/60">Cấp'
        + '<input type="number" min="1" data-nlw-den class="' + oCap + '" value="' + cap + '"></label>';
      var dong = it.stats.map(function (x) {
        var gia = (x.base || 0) + (cap - 1) * (x.growth || 0);
        var phai = x.pct
          ? '<span class="text-base font-bold tabular-nums text-emerald-300">+' + x.base + '%</span>'
          : '<span class="flex items-baseline gap-2 tabular-nums"><span class="' + (x.primary ? 'text-xl text-[#8fd0f0]' : 'text-base text-white/90')
            + '">' + so(gia) + '</span>'
            + ((x.growth || 0) > 0 ? '<span class="text-[11px] text-emerald-300/85">' + so(x.base) + ' +' + x.growth + '/cấp</span>' : '')
            + '</span>';
        return '<div class="flex items-center justify-between rounded-lg px-3.5 py-2.5 '
          + (x.primary ? 'bg-[#3b8fc9]/12 ring-1 ring-[#3b8fc9]/35' : 'border border-white/10') + '">'
          + '<span class="text-sm ' + (x.primary ? 'font-semibold text-white' : 'text-white/75') + '">' + esc(x.label)
          + (x.primary ? '<span class="ml-2 text-[10px] uppercase tracking-wide text-[#8fd0f0]/80">Chính</span>' : '') + '</span>'
          + phai + '</div>';
      }).join('');
      var ghi = (!coGrow && !it.stats.some(function (x) { return x.pct; }))
        ? '<p class="mt-2 text-xs text-white/45">Trang bị này không tăng chỉ số theo cấp Cường Hóa.</p>' : '';
      thuocTinh = khoiVP('Thuộc tính', oNhap + '<div class="mt-2 space-y-1.5">' + dong + '</div>' + ghi);
    }

    var us = it.usage || {};
    var chiPhi = '';
    if ((it.cost || 0) > 0 || (us.composeFrom || []).length) {
      var cf = (us.composeFrom || []).map(function (ct) {
        return '<p class="mt-1 text-sm text-white/90">' + [].concat(ct).map(function (x) {
          return lienKetVP(x.id, x.name) + (x.qty ? ' ×' + x.qty : '');
        }).join(' + ') + '</p>';
      }).join('');
      chiPhi = khoiVP('Chi phí / Nguyên liệu',
        ((it.cost || 0) > 0 ? '<div class="mt-2 flex items-center justify-between rounded-lg border border-white/10 px-3.5 py-2">'
          + '<span class="text-sm text-white/75">Giá mở khóa</span>'
          + '<span class="text-sm font-semibold text-[#e7d97a]">' + so(it.cost) + ' ' + esc(it.costName || '') + '</span></div>' : '')
        + (cf ? '<p class="mt-2 text-xs text-white/70">Chế tạo từ:</p>' + cf : ''));
    }

    var nangBac = '';
    if (it.upgradeFrom || it.upgradeTo) {
      nangBac = khoiVP('Nâng cấp bậc',
        '<div class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/55">'
        + (it.upgradeFrom ? lienKetVP(it.upgradeFrom.id, it.upgradeFrom.name) : '—')
        + '<span class="text-white/35">→</span><span class="font-semibold text-[#8fd0f0]">' + esc(it.name) + '</span>'
        + '<span class="text-white/35">→</span>' + (it.upgradeTo ? lienKetVP(it.upgradeTo.id, it.upgradeTo.name) : '—')
        + '</div><p class="mt-1.5 text-[11px] leading-4 text-white/45">Bậc kế tiếp cùng bộ vị (phẩm chất cao hơn).'
        + ' Nâng bậc bằng cách sở hữu trang bị bậc trên; trong bậc dùng Cường Hóa + Tinh Luyện để tăng lực.</p>');
    }

    var cuongHoa = '';
    if (it.cuongHoa) {
      var heSo = ((tra.equip.equipTiers || {})[it.quality] || {}).coef || 1;
      var lo = Math.max(1, Math.min(tu, cap)), hi = Math.max(tu, cap);
      var bac = 0, ngoc = 0;
      for (var e2 = lo + 1; e2 <= hi; e2++) { bac += bacCuongHoa(e2, it.cuongHoa, heSo); ngoc += ngocCuongHoa(e2); }
      var oCH = 'w-20 rounded-lg border border-white/25 bg-black/40 px-2 py-1.5 text-center text-base font-bold tabular-nums text-white focus:border-[#3b8fc9] focus:outline-none';
      cuongHoa = khoiVP('Chi phí Cường Hóa',
        '<div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/60">Từ cấp'
        + '<input type="number" min="1" max="425" data-nlw-tu class="' + oCH + '" value="' + tu + '">đến cấp'
        + '<span class="' + oCH + ' inline-block cursor-not-allowed text-white/70" title="Bằng ô Cấp ở trên">' + cap + '</span></div>'
        + '<div class="mt-3 grid grid-cols-2 gap-2">'
        + '<div class="flex items-center justify-between rounded-lg bg-[#c98b3b]/12 px-3 py-2.5 ring-1 ring-[#c98b3b]/25">'
        + '<span class="text-sm text-white/85">' + lienKetVP('res_1', 'Bạc') + '</span>'
        + '<span class="text-sm font-bold tabular-nums text-white/90">' + so(bac) + '</span></div>'
        + '<div class="flex items-center justify-between rounded-lg bg-[#c98b3b]/12 px-3 py-2.5 ring-1 ring-[#c98b3b]/25">'
        + '<span class="text-sm text-white/85">' + lienKetVP('res_16', 'Tranh Ngọc') + '</span>'
        + '<span class="text-sm font-bold tabular-nums text-[#e7d97a]">' + so(ngoc) + '</span></div></div>'
        + '<p class="mt-1.5 text-[11px] leading-4 text-white/45">Cấp ' + lo + ' → ' + hi
        + ' (Cấp đích lấy theo ô Cấp ở trên; Cường Hóa lên tới ~425). Tranh Ngọc chỉ tốn từ cấp 200.'
        + ' Đây là giá gốc — thực tế trong game có thể chênh ±vài % do giảm giá theo cấp nhân vật'
        + ' (≥200: −5%, ≥300: −10%) và công trình / khoa kỹ.</p>');
    }

    var tinhLuyen = '';
    if (it.type >= 1 && it.type <= 7) {
      var rf = (tra.equip.equipRefine || {})[it.type];
      if (rf) {
        var cot = cotTinhLuyen('Sơ', rf.so, '#42ad5c') + cotTinhLuyen('Cao', rf.cao, '#4a90d9')
          + cotTinhLuyen('Đặc Kỹ', rf.dacKy, '#e7d97a');
        tinhLuyen = khoiVP('Tinh Luyện · ' + esc(rf.name),
          '<div class="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">' + cot + '</div>'
          + '<p class="mt-2 text-[11px] leading-4 text-white/50"><span class="font-semibold">Số %</span>'
          + ' = tỉ lệ ngẫu nhiên ra thuộc tính đó mỗi lần Tinh Luyện (đúc lại) — cao thì dễ ra, thấp thì hiếm.'
          + ' Mỗi ô chỉ giữ 1 thuộc tính. (Di chuột / chạm để xem tên đầy đủ.)<br>'
          + 'Tên &amp; giá trị lấy trực tiếp từ dữ liệu game; phần mô tả chỉ là dịch nghĩa tên — cơ chế combat chi tiết'
          + ' không có trong dữ liệu, nên kiểm tra tooltip trong game để chắc chắn.</p>');
      }
    }

    var ck = '';
    if (it.flag) {
      var f = it.flag, bf = f.buff || {};
      var chipTinh = ['S.T Lên Bộ Binh','S.T Lên Thương Binh','S.T Lên Kỵ Binh','S.T Lên Cung Binh','S.T Lên Quan Văn',
                      'Bị Bộ Binh S.T','Bị Thương Binh S.T','Bị Kỵ Binh S.T','Bị Cung Binh S.T','Bị Quan Văn S.T']
        .map(function (x) {
          return '<span class="rounded-full border border-white/12 bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/70">' + x + '</span>';
        }).join('');
      ck = khoiVP('Hiệu ứng Chiến Kỳ',
        '<div class="mt-2 flex items-center justify-between rounded-lg bg-[#3b8fc9]/12 px-3.5 py-2.5 ring-1 ring-[#3b8fc9]/30">'
        + '<span class="text-sm text-white/85">' + esc(bf.label) + '</span>'
        + '<span class="text-sm font-bold tabular-nums text-emerald-300">+' + bf.min + '%'
        + (bf.max > bf.min ? '<span class="text-white/50"> → tối đa +' + bf.max + '%</span>' : '') + '</span></div>'
        + (bf.max > bf.min ? '<p class="mt-1.5 text-[11px] text-white/45">Có ' + f.topRate + '% cơ hội ra mức tối đa (+' + bf.max + '%) khi nhận Kỳ.</p>' : '')
        + '<p class="mt-3 text-xs font-semibold tracking-wider text-[#8fd0f0]">Thuộc tính phụ (ngẫu nhiên)</p>'
        + '<div class="mt-2 flex flex-wrap gap-1.5">' + chipTinh + '</div>'
        + '<p class="mt-2 text-[11px] leading-4 text-white/45">Mỗi Chiến Kỳ có thể mang thêm vài thuộc tính phụ'
        + ' trong nhóm trên (vd: Sát Thương lên Bộ Binh). Các thuộc tính phụ được random khi nhận Kỳ từ máy chủ'
        + ' — số lượng tối đa và khoảng giá trị mỗi dòng không có trong dữ liệu tĩnh, nên giá trị cụ thể phụ thuộc'
        + ' từng Kỳ (cần thu thập trực tiếp từ server để biết chính xác).</p>');
    }

    var vatLieu = '';
    if (it.upgradeKind === 'flag') {
      var den = ui.bung.ck == null ? 10 : ui.bung.ck;
      var tong = 0;
      VAI_BAT.forEach(function (r) { if (r[0] <= den) tong += r[1]; });
      var hangVB = VAI_BAT.map(function (r) {
        return '<tr class="border-t border-white/5' + (r[0] > den ? ' opacity-40' : '') + '">'
          + '<td class="px-3 py-1.5 text-left text-white/75">' + r[0] + '</td>'
          + '<td class="px-3 py-1.5 text-right tabular-nums text-white/75">' + so(r[1]) + '</td>'
          + '<td class="px-3 py-1.5 text-right tabular-nums ' + (r[2] < 100 ? 'text-amber-300/90' : 'text-white/60') + '">' + r[2] + '%</td></tr>';
      }).join('');
      vatLieu = '<div class="mt-5 border-t border-white/10 pt-4">'
        + '<div class="flex flex-wrap items-center justify-between gap-2">'
        + '<p class="text-xs font-semibold tracking-wider text-[#8fd0f0]">Vật liệu nâng cấp (Chiến Kỳ)</p>'
        + '<label class="flex items-center gap-2 text-xs text-white/60">Nâng đến cấp'
        + '<select data-nlw-ck class="rounded-lg border border-white/20 bg-black/40 px-2 py-1 text-sm font-semibold text-white focus:outline-none">'
        + VAI_BAT.map(function (r) { return '<option value="' + r[0] + '"' + (r[0] === den ? ' selected' : '') + '>' + r[0] + '</option>'; }).join('')
        + '</select></label></div>'
        + '<div class="mt-2 flex items-center justify-between rounded-lg bg-[#c98b3b]/12 px-3.5 py-2.5 ring-1 ring-[#c98b3b]/30">'
        + '<span class="text-sm text-white/85">Tổng ' + lienKetVP('res_65', 'Vải Bạt') + ' (cấp 1→' + den + ')</span>'
        + '<span class="text-lg font-bold text-[#e7d97a] tabular-nums">' + so(tong) + '</span></div>'
        + '<div class="mt-2 overflow-hidden rounded-lg border border-white/10"><table class="w-full text-xs">'
        + '<thead><tr class="bg-white/[0.04] text-white/55"><th class="px-3 py-1.5 text-left font-medium">Cấp</th>'
        + '<th class="px-3 py-1.5 text-right font-medium">Vải Bạt</th><th class="px-3 py-1.5 text-right font-medium">Tỷ lệ TC</th></tr></thead>'
        + '<tbody>' + hangVB + '</tbody></table></div>'
        + '<p class="mt-1.5 text-[11px] leading-4 text-white/45">Từ cấp 4 tỷ lệ thành công &lt; 100% — có thể cần thêm Vải Bạt khi nâng thất bại.</p></div>';
    }

    function dongDung(nhan, ds) {
      if (!ds || !ds.length) return '';
      var noi = ds.map(function (ct) {
        return [].concat(ct).map(function (x) { return esc(x.name); }).join(' + ');
      }).join(', ');
      return '<div class="mt-2"><span class="text-xs text-white/70">' + nhan + ': </span>'
        + '<span class="text-sm text-white/90">' + noi + '</span></div>';
    }

    var dung = dongDung('Ghép thành', us.composeFrom) + dongDung('Nguyên liệu để ghép', us.composeInto)
      + dongDung('Đổi thành', us.exchangeInto) + dongDung('Đổi từ', us.exchangeFrom);
    var roi = (us.drops || []).length ? '<div class="mt-2 text-sm text-white/90">Rơi từ: ' + us.drops.length + ' nguồn (Phó Bản)</div>' : '';
    var cachDung = khoiVP('Cách dùng / Nguồn', (dung + roi) || '<p class="mt-2 text-sm text-white/60">Chưa ghi nhận nguồn / cách dùng.</p>');

    lopVp.innerHTML = '<div class="animate-card relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl"'
      + ' style="background:radial-gradient(120% 80% at 50% 0%, ' + rgba(MAU_VP, 0.133) + ', transparent 55%),'
      + ' linear-gradient(160deg, rgb(29,26,36) 0%, rgb(20,17,24) 55%, rgb(16,13,20) 100%)">'
      + '<div class="h-1 w-full shrink-0" style="background-color:' + MAU_VP + '"></div>'
      + '<div class="overflow-y-auto p-6">' + dau + moThuong + thuocTinh + chiPhi + nangBac + cuongHoa
      + tinhLuyen + ck + vatLieu + cachDung + '</div>'
      + '<button type="button" aria-label="Close" data-nlw-dong-vp class="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/70 transition hover:bg-black/70 hover:text-white">✕</button>'
      + '</div>';
    history.replaceState(null, '', location.pathname + '?' + khoaVp + '=' + id);
  }

  function taiKhoVp() {
    if (khoVp) return Promise.resolve(khoVp);
    var kho = document.querySelector('[data-nlw-kho]').getAttribute('data-nlw-kho');
    khoaVp = kho === 'item' ? 'item' : (kho === 'chienky' ? 'banner' : 'equipment');
    return Promise.all([tai(BASE + 'data/' + kho + '-detail.json'), tai(BASE + 'data/item-catalog.json'),
                        kho === 'equip' ? null : tai(BASE + 'data/equip-detail.json')])
      .then(function (r) {
        khoVp = {};
        r[0].items.forEach(function (x) { khoVp[x.id] = x; });
        tra.kho = r[1];
        tra.equip = r[2] || r[0];
        return khoVp;
      });
  }

  function moVatPham(id) {
    return taiTra().then(taiKhoVp).then(function () {
      // bản gốc tra id trên cả 4 kho vật phẩm, không riêng kho của trang (vd /items?item=1 là trang bị)
      if (khoVp[id]) return;
      return Promise.all(['item', 'equip', 'tuongkhi', 'chienky'].map(function (k) {
        return tai(BASE + 'data/' + k + '-detail.json');
      })).then(function (r) {
        r.forEach(function (d) { d.items.forEach(function (x) { if (!khoVp[x.id]) khoVp[x.id] = x; }); });
      });
    }).then(function () {
      if (!khoVp[id]) return;
      vpDangMo = id;
      resetUi(1, 1);
      veLai = function () { veVatPham(vpDangMo); };
      if (!lopVp) {
        lopVp = document.createElement('div');
        lopVp.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md';
        document.body.appendChild(lopVp);
      }
      veVatPham(id);
    });
  }

  function dongVatPham() {
    if (!lopVp) return;
    lopVp.remove();
    lopVp = null;
    vpDangMo = null;
    history.replaceState(null, '', location.pathname);
  }

  var MAU_BT = { 2: '#3fa34d', 3: '#3b8fc9', 4: '#9b5bd6', 5: '#d6a24b' };
  var lopBt = null;
  var btDangMo = null;
  var khoBt = null;

  function soEn(n) { return Number(n).toLocaleString('en-US'); }
  function nhanBT(t) { return String(t).replace('Toàn thể kháng', 'Kháng').replace(' (%)', ''); }
  function giaBT(v, pct) { return pct ? (Number.isInteger(v) ? v : v.toFixed(1)) + '%' : soEn(v); }

  function veBinhThu(key) {
    var b = khoBt[key];
    var fc = MAU_BT[b.quality] || MAU_AN;
    var soSao = b.grades.length;
    var kep = function (v) { return Math.min(Math.max(1, v), soSao); };
    var tu = Math.min(kep(ui.tu), kep(ui.den));
    var den = Math.max(kep(ui.tu), kep(ui.den));
    var manh = b.grades.slice(tu - 1, den - 1).reduce(function (a, x) { return a + (x.frag || 0); }, 0);
    var thuLinh = b.grades.slice(tu, den).reduce(function (a, x) { return a + (x.exp || 0); }, 0);
    var sgTu = (b.statGrowth || []).filter(function (x) { return x.grade === tu; })[0];
    var sgDen = (b.statGrowth || []).filter(function (x) { return x.grade === den; })[0];

    var hieuUng = '<h4 class="mb-2 text-xs font-semibold uppercase tracking-wider text-[#e0c375]/80">Hiệu ứng theo cấp</h4>'
      + '<ol class="space-y-2">' + (b.ranks || []).map(function (r, i) {
          var cuoi = i === b.ranks.length - 1;
          return '<li class="flex gap-2.5 rounded-lg border border-white/[0.07] bg-white/[0.02] p-2.5">'
            + '<span class="grid h-6 w-6 shrink-0 place-items-center rounded text-xs font-bold" style="color:'
            + (cuoi ? fc : 'rgba(255,255,255,0.8)') + ';background-color:' + (cuoi ? rgba(fc, 0.118) : 'rgba(255,255,255,0.118)')
            + ';border:1px solid ' + (cuoi ? rgba(fc, 0.267) : 'rgba(255,255,255,0.267)') + '">' + (i + 1) + '</span>'
            + '<p class="text-sm leading-6 text-white/80">' + esc(r) + '</p></li>';
        }).join('') + '</ol>';

    var bangChiSo = '';
    if ((b.statGrowth || []).length) {
      var th = (b.statLabels || []).map(function (x) {
        return '<th class="px-3 py-2 text-right font-medium">' + esc(nhanBT(x)) + '</th>';
      }).join('');
      var tr = b.statGrowth.map(function (r) {
        var cuoi = r.grade === b.statGrowth.length;
        return '<tr class="border-t border-white/[0.06] odd:bg-white/[0.015]">'
          + '<td class="px-3 py-1.5 text-left text-white/80">' + r.grade + '★</td>'
          + r.vals.map(function (v, i) {
              return '<td class="px-3 py-1.5 text-right font-medium tabular-nums" style="color:'
                + (cuoi ? fc : 'rgba(255,255,255,0.85)') + '">' + giaBT(v, (b.statPct || [])[i]) + '</td>';
            }).join('') + '</tr>';
      }).join('');
      bangChiSo = '<h4 class="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-[#e0c375]/80">Chỉ số (theo sao)</h4>'
        + '<div class="overflow-x-auto rounded-lg border border-white/10"><table class="w-full border-collapse text-sm">'
        + '<thead class="bg-white/[0.04] text-white/60"><tr><th class="px-3 py-2 text-left font-medium">Sao</th>' + th + '</tr></thead>'
        + '<tbody>' + tr + '</tbody></table></div>'
        + '<p class="mt-1.5 text-xs text-white/40">Chỉ số ở cấp tối đa của mỗi sao; trong một sao, chỉ số tăng dần theo cấp.</p>';
    }

    var oBt = 'w-14 rounded-lg border border-white/25 bg-black/40 px-2 py-1.5 text-center text-base font-bold tabular-nums text-white focus:border-[#c9a24b] focus:outline-none';
    var soSanh = (sgTu && sgDen && (b.statLabels || []).length)
      ? '<div class="mt-2.5 grid gap-1.5 sm:grid-cols-2">' + b.statLabels.map(function (nh, i) {
          return '<div class="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-sm">'
            + '<span class="text-white/60">' + esc(nhanBT(nh)) + '</span><span class="tabular-nums">'
            + '<span class="text-white/45">' + giaBT(sgTu.vals[i], (b.statPct || [])[i]) + '</span>'
            + '<span class="mx-1 text-white/30">→</span>'
            + '<span class="font-semibold" style="color:' + fc + '">' + giaBT(sgDen.vals[i], (b.statPct || [])[i]) + '</span>'
            + '</span></div>';
        }).join('') + '</div>' : '';

    var mayTinh = '<div class="mt-5"><div class="mb-4 rounded-lg border border-white/10 bg-white/[0.02] p-3">'
      + '<p class="mb-2 text-xs font-semibold uppercase tracking-wider text-[#e0c375]/80">Tính chỉ số &amp; nguyên liệu theo sao</p>'
      + '<div class="flex flex-wrap items-center gap-2 text-xs text-white/60">Từ sao'
      + '<input type="number" min="1" max="' + soSao + '" data-nlw-tu class="' + oBt + '" value="' + ui.tu + '">★ đến sao'
      + '<input type="number" min="1" max="' + soSao + '" data-nlw-den class="' + oBt + '" value="' + ui.den + '">★</div>'
      + soSanh
      + '<div class="mt-2 grid grid-cols-2 gap-2">'
      + '<div class="flex items-center justify-between gap-2 rounded-lg bg-[#c98b3b]/12 px-3 py-2.5 ring-1 ring-[#c98b3b]/25">'
      + '<span class="text-sm text-white/85">' + esc(tra.binhThu.fragmentName) + '</span>'
      + '<span class="text-base font-bold text-[#e7d97a] tabular-nums">' + (manh ? soEn(manh) : '—') + '</span></div>'
      + '<div class="flex items-center justify-between gap-2 rounded-lg bg-[#c98b3b]/12 px-3 py-2.5 ring-1 ring-[#c98b3b]/25">'
      + '<span class="text-sm text-white/85">' + esc(tra.binhThu.expName) + '</span>'
      + '<span class="text-base font-bold text-white/90 tabular-nums">' + (thuLinh ? soEn(thuLinh) : '—') + '</span></div></div>'
      + '<p class="mt-1.5 text-[11px] leading-4 text-white/45">Nguyên liệu để đưa Binh Thư từ ' + tu + '★ lên ' + den
      + '★. Mảnh Binh Thư để đột phá lên sao mới; Thư Linh (EXP) để lên cấp trong mỗi sao.</p></div></div>';

    var nguyenLieu = '<div class="mb-2 mt-5 flex flex-wrap items-center justify-between gap-2">'
      + '<h4 class="text-xs font-semibold uppercase tracking-wider text-[#e0c375]/80">Nguyên liệu nâng cấp</h4>'
      + '<span class="text-xs text-white/45">Tổng: <span class="tabular-nums" style="color:#c9a24b">' + soEn(b.fragment)
      + '</span> Mảnh Binh Thư · <span class="tabular-nums" style="color:#c9a24b">' + soEn(b.exp) + '</span> EXP</span></div>'
      + '<div class="space-y-2">' + b.grades.map(function (g) {
          var o = (g.levels || []).map(function (l) {
            return '<div class="flex items-baseline justify-between gap-1 rounded border border-white/10 bg-white/[0.06] px-1.5 py-1 text-[11px]">'
              + '<span class="text-white/55">Lv' + l.lv + '</span>'
              + '<span class="tabular-nums font-medium text-white/95">' + soEn(l.exp) + '</span></div>';
          }).join('');
          return '<div class="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">'
            + '<div class="mb-2 flex flex-wrap items-center gap-2">'
            + '<span class="text-sm font-semibold text-white">Sao ' + g.grade + '★</span>'
            + (g.frag > 0
                ? '<span class="rounded bg-[#c9a24b]/20 px-1.5 py-0.5 text-[11px] font-medium text-[#f0dd8f]">Đột phá: ' + soEn(g.frag) + ' Mảnh Binh Thư</span>'
                : '<span class="rounded bg-white/10 px-1.5 py-0.5 text-[11px] text-white/60">Sao tối đa</span>')
            + '<span class="text-[11px] text-white/60">EXP toàn sao: ' + soEn(g.exp) + '</span></div>'
            + '<div class="grid grid-cols-3 gap-1 sm:grid-cols-5">' + o
            + '<div class="flex items-center justify-between gap-1 rounded border border-[#c9a24b]/35 bg-[#c9a24b]/15 px-1.5 py-1 text-[11px]">'
            + '<span class="text-[#f0dd8f]">Lv10</span><span class="text-[#f0dd8f]">đột phá</span></div></div></div>';
        }).join('') + '</div>'
      + '<p class="mt-2 text-xs text-white/55">Mỗi Binh Thư có 5 sao, mỗi sao 10 cấp. Mảnh Binh Thư để đột phá lên sao mới (Lv10); EXP lên cấp trong mỗi sao (Lv1–9). </p>';

    lopBt.innerHTML = '<div class="my-auto w-full max-w-[560px] overflow-hidden rounded-2xl border border-white/15 bg-[#14121c] shadow-2xl">'
      + '<div class="flex items-start gap-3 border-b border-white/10 bg-white/[0.04] px-5 py-4">'
      + '<span class="h-16 w-16 shrink-0">' + (b.icon ? '<img alt="' + esc(b.name) + '" class="h-full w-full object-contain" src="' + anh(b.icon) + '">' : '') + '</span>'
      + '<div class="min-w-0 flex-1"><div class="flex flex-wrap items-center gap-2">'
      + '<h3 class="text-lg font-semibold text-white">' + esc(b.name) + '</h3>'
      + (b.moi ? '<span class="rounded-full border border-amber-200/70 bg-red-500 px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none text-white">Mới</span>' : '')
      + '</div><div class="mt-1.5 flex flex-wrap items-center gap-1.5">'
      + '<span class="rounded px-2 py-0.5 text-xs font-medium" style="color:' + fc + ';background-color:' + rgba(fc, 0.118)
      + ';border:1px solid ' + rgba(fc, 0.4) + '">Phẩm chất ' + b.quality + '</span>'
      + '<span class="rounded bg-white/10 px-2 py-0.5 text-xs text-white/70">Mở khóa · Thành Chính ' + b.unlockLevel + '</span>'
      + '</div></div>'
      + '<button type="button" aria-label="Đóng" data-nlw-dong-bt class="shrink-0 rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white">'
      + '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></div>'
      + '<div class="max-h-[72vh] overflow-y-auto px-5 py-4">' + hieuUng + bangChiSo + mayTinh + nguyenLieu + '</div></div>';
  }

  function moBinhThu(key) {
    return taiTra().then(function () {
      if (khoBt) return khoBt;
      return tai(BASE + 'data/books-detail.json').then(function (d) {
        tra.binhThu = d;
        khoBt = {};
        d.books.forEach(function (x) { khoBt[x.key] = x; });
        return khoBt;
      });
    }).then(function () {
      if (!khoBt[key]) return;
      btDangMo = key;
      resetUi(1, khoBt[key].grades.length);
      veLai = function () { veBinhThu(btDangMo); };
      if (!lopBt) {
        lopBt = document.createElement('div');
        lopBt.className = 'fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-6';
        document.body.appendChild(lopBt);
      }
      veBinhThu(key);
    });
  }

  function dongBinhThu() {
    if (!lopBt) return;
    lopBt.remove();
    lopBt = null;
    btDangMo = null;
  }

  var MAU_HE = { 'Kế Sách': '#a259c8', 'Chiến Pháp': '#c0392b', 'Vật Lý': '#c98b3b', 'Hỗ Trợ': '#27865b' };
  var NHAN_GIAI_DOAN = { xuatSu: 'Xuất Sư', thucTinh: 'Thức Tỉnh', renLuyen: 'Rèn Luyện',
                         chuChinh: 'Chủ Chính', giamQuoc: 'Giám Quốc' };
  var lopQt = null;

  function veQuyTu(id) {
    var kho = tra.quyTu;
    var sk = null, nhanGd = '';
    for (var i = 0; i < kho.order.length; i++) {
      var g = kho.stages[kho.order[i]];
      if (g[id]) { sk = g[id]; nhanGd = NHAN_GIAI_DOAN[kho.order[i]]; break; }
    }
    if (!sk) return;
    var fc = MAU_HE[sk.category] || MAU_AN;
    var icon = kho.skillIcons[sk.name];

    var vk = '';
    if (!(sk.weapons || []).length && (kho.vkdb[sk.name] || []).length) {
      var ds = kho.vkdb[sk.name];
      vk = '<div class="mt-5 border-t border-white/10 pt-4">'
        + '<p class="mb-2 text-xs tracking-wider text-white/50">VKĐB (Chuyên Vũ) · ' + ds.length + '</p>'
        + '<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">' + ds.map(function (w) {
            return '<div class="flex items-center gap-2.5 rounded-lg border border-amber-300/20 bg-amber-300/[0.04] p-2">'
              + '<span class="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-white/15 bg-black/30">'
              + (w.icon ? '<img alt="" class="h-full w-full object-contain p-0.5" src="' + anh(w.icon) + '">' : '') + '</span>'
              + '<span class="min-w-0 truncate text-sm font-semibold">' + esc(w.name) + '</span></div>';
          }).join('') + '</div></div>';
    }

    var dsVk = '';
    if ((sk.weapons || []).length) {
      dsVk = '<div class="mt-5 border-t border-white/10 pt-4">'
        + '<p class="mb-3 text-xs tracking-wider text-white/50">VKĐB · ' + sk.weapons.length + '</p>'
        + sk.weapons.map(function (w, k) {
            var kn = (w.skills || []).map(function (x) {
              return (x.tiers || []).map(function (t) {
                return '<div class="flex gap-2.5">'
                  + '<span class="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/15"'
                  + ' style="background:radial-gradient(circle at 50% 40%, rgba(255,255,255,0.5), rgba(220,222,235,0.18))">'
                  + (t.icon ? '<img alt="" class="h-7 w-7 object-contain" src="' + anh(t.icon) + '">' : '') + '</span>'
                  + '<p class="min-w-0 text-xs leading-5 text-white/80">'
                  + (t.rank != null ? '<span class="font-medium text-amber-200/90">★' + t.rank + ': </span>' : '')
                  + veMoTa(t.desc) + '</p></div>';
              }).join('');
            }).join('');
            var bang = (w.stats || []).length
              ? bangThuocTinh(w.stats, '#d4af37', function (x) {
                  var u = x.pct ? '%' : '';
                  return [x.name, '+' + x.base + u, '+' + x.value + u];
                }).replace('</div></div>', '</div>' + khoiTangTruong(w.stats, '#d4af37', 'vk' + k) + '</div>')
              : '';
            return '<div class="rounded-lg border border-amber-300/20 bg-amber-300/[0.04] p-3">'
              + '<p class="mb-3 flex items-center gap-2 text-base font-semibold" style="color:#d4af37">'
              + (w.icon ? '<span class="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-white/15 bg-black/30">'
                  + '<img alt="" class="h-full w-full object-contain p-0.5" src="' + anh(w.icon) + '"></span>' : '')
              + esc(w.name) + '</p>' + bang + (kn ? '<div class="space-y-2.5">' + kn + '</div>' : '') + '</div>';
          }).join('') + '</div>';
    }

    var tuong = (sk.heroIds || []).filter(function (h) { return tra.mini[h]; });
    var khoiTuong = !tuong.length ? '' : '<div class="mt-5 border-t border-white/10 pt-4">'
      + '<p class="mb-3 text-xs tracking-wider text-white/50">Tướng có kỹ năng tương tự · ' + tuong.length + '</p>'
      + '<div class="flex flex-wrap gap-3">' + tuong.map(function (h) {
          var m = tra.mini[h], mp = PHE[m.p] || '#4a9d9d';
          return '<button type="button" data-nlw-hero="' + h + '" class="group flex w-14 flex-col items-center gap-1">'
            + '<span class="transition group-hover:-translate-y-0.5">'
            + '<span class="relative block shrink-0 overflow-hidden rounded-xl" style="width:56px;height:56px;border:2px solid ' + mp
            + ';box-shadow:' + rgba(mp, 0.267) + ' 0px 0px 14px">'
            + '<img alt="' + esc(m.n) + '" class="block object-cover object-top" style="width:56px;height:56px" src="' + anh(m.i) + '"></span></span>'
            + '<span class="w-full truncate text-center text-[11px] leading-tight text-white/70">' + esc(m.n) + '</span></button>';
        }).join('') + '</div></div>';

    lopQt.innerHTML = '<div class="animate-card relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl"'
      + ' style="background:radial-gradient(120% 80% at 50% 0%, ' + rgba(fc, 0.133) + ', transparent 55%),'
      + ' linear-gradient(160deg, rgb(29,26,36) 0%, rgb(20,17,24) 55%, rgb(16,13,20) 100%);'
      + ' box-shadow:' + rgba(fc, 0.467) + ' 0px 24px 70px -14px">'
      + '<div class="h-1 w-full shrink-0" style="background-color:' + fc + '"></div>'
      + '<div class="overflow-y-auto p-6"><div class="flex items-start gap-3">'
      + (icon ? '<span class="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/15 bg-black/30">'
          + '<img alt="" class="h-full w-full object-contain p-1" src="' + anh(icon) + '"></span>' : '')
      + '<div class="min-w-0"><div class="flex flex-wrap items-center gap-1.5">'
      + '<span class="rounded px-2 py-0.5 text-xs font-medium" style="color:' + fc + ';background-color:' + rgba(fc, 0.133)
      + ';border:1px solid ' + fc + '">' + esc(sk.category) + '</span>'
      + '<span class="rounded bg-white/10 px-2 py-0.5 text-xs text-white/70">' + esc(nhanGd) + '</span></div>'
      + '<h2 class="mt-1.5 font-[family-name:var(--font-serif-jp)] text-2xl font-bold leading-none text-white">' + esc(sk.name) + '</h2>'
      + '</div></div>'
      + (sk.desc ? '<p class="mt-4 text-sm leading-6 text-white/85">' + veMoTa(sk.desc) + '</p>' : '')
      + vk + dsVk + khoiTuong + '</div></div>';
    history.replaceState(null, '', location.pathname + '?skill=' + encodeURIComponent(id));
  }

  function moQuyTu(id) {
    return taiTra().then(function () {
      if (tra.quyTu) return tra.quyTu;
      return tai(BASE + 'data/children-detail.json').then(function (d) { tra.quyTu = d; return d; });
    }).then(function () {
      resetUi(1, 1);
      veLai = function () { veQuyTu(id); };
      if (!lopQt) {
        lopQt = document.createElement('div');
        lopQt.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md';
        document.body.appendChild(lopQt);
      }
      veQuyTu(id);
    });
  }

  function dongQuyTu() {
    if (!lopQt) return;
    lopQt.remove();
    lopQt = null;
    history.replaceState(null, '', location.pathname);
  }

  var MAU_KV = { 1: '#7cc0ea', 2: '#e0a34b' };
  var lopKv = null;
  var khoKv = null;

  function chipKhac(x, sl) {
    var m = MAU_KV[x.quality] || MAU_AN;
    return '<div class="flex items-center gap-1.5">'
      + (sl ? '<span class="text-sm font-bold text-white/70">' + sl + '×</span>' : '')
      + '<span class="relative block h-9 w-9 shrink-0 rounded ring-1 ring-white/10">'
      + '<img alt="' + esc(x.qname) + '" class="h-full w-full object-contain" src="' + anh(x.icon) + '"></span>'
      + '<div class="text-[11px] leading-tight">'
      + '<p style="color:' + m + '">' + esc(x.qname) + ' Lv' + x.level + '</p>'
      + '<p class="font-semibold" style="color:' + m + '">+' + so(x.value) + '</p></div></div>';
  }

  function chipTien(t, n) {
    return '<span class="inline-flex items-center gap-1 tabular-nums">'
      + '<span class="relative block h-4 w-4 shrink-0">'
      + '<img alt="' + esc(t.name) + '" class="h-full w-full object-contain" src="' + anh(t.icon) + '"></span>'
      + '<b class="text-white/90">' + so(n) + '</b></span>';
  }

  function nhanKv(t) {
    return '<p class="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#e0c375]/70">' + t + '</p>';
  }

  function oNhacKv(t) {
    return '<p class="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white/45">' + t + '</p>';
  }

  function veKhacVan(id) {
    var x = khoKv[id];
    var fc = MAU_KV[x.quality] || MAU_AN;
    var tien = tra.khacVan.currency;
    var dich = x.upgrade && khoKv[x.upgrade.toId];
    var kia = x.ghep && khoKv[x.ghep.otherId];
    var mui = '<span class="px-1 text-white/30">→</span>';

    var chiSo = '<section>' + nhanKv('Chỉ số')
      + '<div class="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm">'
      + '<span class="text-white/70">' + esc(x.stat) + '</span>'
      + '<span class="text-base font-bold" style="color:' + fc + '">+' + so(x.value) + '</span></div></section>';

    var nangCap = '<section>' + nhanKv('Nâng cấp')
      + (dich
          ? '<div class="rounded-lg border border-white/10 bg-white/[0.02] p-2.5">'
            + '<div class="flex items-center justify-between gap-2">' + chipKhac(x) + mui + chipKhac(dich) + '</div>'
            + '<div class="mt-2 flex items-center gap-3 border-t border-white/10 pt-2 text-[11px]">'
            + '<span class="text-white/40">Chi phí</span>'
            + (x.upgrade.ngoc || x.upgrade.bac
                ? '<span class="flex flex-wrap items-center gap-3">'
                  + (x.upgrade.ngoc > 0 ? chipTien(tien.ngoc, x.upgrade.ngoc) : '')
                  + (x.upgrade.bac > 0 ? chipTien(tien.bac, x.upgrade.bac) : '') + '</span>'
                : '<span class="text-[#7fe0b6]">Miễn phí</span>')
            + '</div></div>'
          : oNhacKv(x.quality === 2
              ? 'Khắc Ấn không nâng bằng Ngọc/Bạc — muốn cấp cao hơn thì ghép Khắc Văn cấp cao hơn.'
              : 'Đã đạt cấp tối đa.'))
      + '</section>';

    var ghep = '<section>' + nhanKv('Ghép')
      + (kia
          ? '<div class="rounded-lg border border-white/10 bg-white/[0.02] p-2.5">'
            + '<div class="flex items-center justify-between gap-2">'
            + (x.ghep.mode === 'to'
                ? chipKhac(x, x.ghep.count) + mui + chipKhac(kia)
                : chipKhac(kia, x.ghep.count) + mui + chipKhac(x))
            + '</div>'
            + '<p class="mt-2 border-t border-white/10 pt-2 text-[11px] text-white/40">Ghép '
            + '<b class="text-white/70">' + x.ghep.count + '</b> dấu khắc giống nhau — không tốn Ngọc/Bạc.</p></div>'
          : oNhacKv(x.quality === 1
              ? 'Khắc Ấn mở từ Lv8 — nâng Khắc Văn tới Lv8 rồi ghép.'
              : 'Không thể ghép thêm.'))
      + '</section>';

    lopKv.innerHTML = '<div class="my-auto w-full max-w-md overflow-hidden rounded-2xl border border-white/15 bg-[#14121c] shadow-2xl">'
      + '<div class="flex items-center gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-3">'
      + '<span class="relative block h-12 w-12 shrink-0 rounded-lg ring-1 ring-white/10">'
      + '<img alt="' + esc(x.stat) + '" class="h-full w-full object-contain" src="' + anh(x.icon) + '"></span>'
      + '<div class="min-w-0 flex-1"><div class="flex flex-wrap items-center gap-2">'
      + '<h2 class="text-base font-semibold text-white">' + esc(x.stat) + '</h2>'
      + '<span class="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase" style="color:' + fc
      + ';background-color:' + rgba(fc, 0.133) + '">' + esc(x.qname) + '</span></div>'
      + '<p class="text-xs text-white/50">Cấp ' + x.level + '</p></div>'
      + '<button type="button" data-nlw-dong-kv class="shrink-0 rounded-lg px-2 py-1 text-white/50 hover:bg-white/10">✕</button></div>'
      + '<div class="space-y-3 p-4">' + chiSo + nangCap + ghep + '</div></div>';
  }

  function moKhacVan(id) {
    return taiTra().then(function () {
      if (khoKv) return khoKv;
      return tai(BASE + 'data/khac-van-detail.json').then(function (d) {
        tra.khacVan = d;
        khoKv = {};
        d.items.forEach(function (x) { khoKv[x.id] = x; });
        return khoKv;
      });
    }).then(function () {
      if (!khoKv[id]) return;
      if (!lopKv) {
        lopKv = document.createElement('div');
        lopKv.className = 'fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8';
        document.body.appendChild(lopKv);
      }
      veKhacVan(id);
    });
  }

  function dongKhacVan() {
    if (!lopKv) return;
    lopKv.remove();
    lopKv = null;
  }

  var MAU_CN = { 2: '#3fa34d', 3: '#3b8fc9', 4: '#9b5bd6', 5: '#d6a24b' };
  var lopCn = null;
  var cnDangMo = null;
  var khoCn = null;

  function giaCn(o) {
    if (!o) return '0';
    return soEn(o.base) + (o.pct ? '+' + o.pct + '%' : '');
  }

  function anhNgua(h, lop2) {
    var m = MAU_CN[h.quality] || MAU_AN;
    return '<span class="relative block ' + lop2 + '">'
      + (h.icon
          ? '<img alt="' + esc(h.name) + '" class="h-full w-full object-contain" src="' + anh(h.icon) + '">'
          : '<span class="flex h-full w-full items-center justify-center rounded-lg font-[family-name:var(--font-serif-jp)] text-lg font-bold"'
            + ' style="background:linear-gradient(160deg, ' + rgba(m, 0.333) + ', #14110c 85%);color:#fff">' + esc(h.name.charAt(0)) + '</span>')
      + '</span>';
  }

  function veChuongNgua(key) {
    var h = khoCn[key];
    var fc = MAU_CN[h.quality] || MAU_AN;
    var bac = h.tiers;
    var kep = function (v) { return Math.min(Math.max(1, v), bac.length); };
    var tu = Math.min(kep(ui.tu), kep(ui.den));
    var den = Math.max(kep(ui.tu), kep(ui.den));
    var diem = bac.slice(tu - 1, den - 1).reduce(function (a, t) { return a + (t.points || 0); }, 0);
    var sao = bac.reduce(function (a, t) { return Math.max(a, t.star); }, 0);

    function oChonBac(khoa, gia) {
      return '<select data-nlw-bac="' + khoa + '" class="rounded-lg border border-white/25 bg-black/40 px-2 py-1.5 text-sm font-semibold text-white focus:border-[#c9a24b] focus:outline-none">'
        + bac.map(function (t, i) {
            return '<option value="' + (i + 1) + '"' + (i + 1 === gia ? ' selected' : '') + '>Bậc ' + t.level + ' · ' + t.star + '★</option>';
          }).join('') + '</select>';
    }

    var soSanh = bac[tu - 1].stats.map(function (o, i) {
      return '<div class="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-sm">'
        + '<span class="text-white/60">' + esc(o.label) + '</span><span class="tabular-nums">'
        + '<span class="text-white/45">' + giaCn(o) + '</span>'
        + '<span class="mx-1 text-white/30">→</span>'
        + '<span class="font-semibold" style="color:' + fc + '">' + giaCn(bac[den - 1].stats[i]) + '</span></span></div>';
    }).join('');

    var mayTinh = '<div class="mb-4 rounded-lg border border-white/10 bg-white/[0.02] p-3">'
      + '<p class="mb-2 text-xs font-semibold uppercase tracking-wider text-[#e0c375]/80">Tính chỉ số &amp; điểm nâng theo Bậc</p>'
      + '<div class="flex flex-wrap items-center gap-2 text-xs text-white/60">Từ' + oChonBac('tu', tu)
      + '<span class="text-white/30">→</span>đến' + oChonBac('den', den) + '</div>'
      + '<div class="mt-2.5 grid gap-1.5 sm:grid-cols-2">' + soSanh + '</div>'
      + '<div class="mt-2 flex items-center justify-between rounded-lg bg-[#c98b3b]/12 px-3 py-2.5 ring-1 ring-[#c98b3b]/25">'
      + '<span class="text-xs text-white/75">Điểm nâng (tương tác Mã Trường)</span>'
      + '<span class="text-base font-bold text-[#e7d97a] tabular-nums">' + (diem ? soEn(diem) : '—') + '</span></div>'
      + '<p class="mt-1.5 text-[11px] leading-4 text-white/45">Tổng điểm nâng để đưa chiến mã từ Bậc ' + tu
      + ' lên Bậc ' + den + ' (tích lũy từ cho ăn / thuần dưỡng).</p></div>';

    var th = bac[0].stats.map(function (o) {
      return '<th class="whitespace-nowrap px-3 py-2 text-right font-medium">' + esc(o.label) + '</th>';
    }).join('');
    var tr = bac.map(function (t, i) {
      var cuoi = i === bac.length - 1;
      return '<tr class="border-t border-white/[0.06] odd:bg-white/[0.015]">'
        + '<td class="whitespace-nowrap px-3 py-1.5 text-left text-white/80">' + t.level + '</td>'
        + '<td class="whitespace-nowrap px-3 py-1.5 text-left text-white/80">' + t.star + '★</td>'
        + '<td class="whitespace-nowrap px-3 py-1.5 text-right tabular-nums text-white/70">'
        + (t.top ? '<span class="text-white/30">Tối đa</span>' : soEn(t.points)) + '</td>'
        + t.stats.map(function (o) {
            return '<td class="whitespace-nowrap px-3 py-1.5 text-right tabular-nums" style="color:'
              + (cuoi ? fc : 'rgba(255,255,255,0.85)') + '">' + soEn(o.base)
              + (o.pct ? '<span class="ml-1 text-xs text-white/40">+' + o.pct + '%</span>' : '') + '</td>';
          }).join('') + '</tr>';
    }).join('');

    var bangBac = '<h4 class="mb-2 text-xs font-semibold uppercase tracking-wider text-[#e0c375]/80">Chỉ số theo Bậc</h4>'
      + '<div class="overflow-x-auto rounded-lg border border-white/10"><table class="w-full border-collapse text-sm">'
      + '<thead class="bg-white/[0.04] text-white/60"><tr>'
      + '<th class="whitespace-nowrap px-3 py-2 text-left font-medium">Bậc</th>'
      + '<th class="whitespace-nowrap px-3 py-2 text-left font-medium">Sao</th>'
      + '<th class="whitespace-nowrap px-3 py-2 text-right font-medium">Điểm nâng</th>' + th
      + '</tr></thead><tbody>' + tr + '</tbody></table></div>'
      + '<p class="mt-1.5 text-xs text-white/40"><b class="text-white/55">Điểm nâng</b> = điểm tích lũy từ tương tác Mã Trường'
      + ' cần để lên Bậc kế tiếp. Mỗi ô chỉ số: giá trị gốc + % cộng thêm cho loại đó.</p>';

    var coDb = bac.filter(function (t) { return (t.special || []).length; });
    var dacBiet = !coDb.length ? '' : '<h4 class="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-[#e0c375]/80">Thuộc tính đặc biệt theo Bậc</h4>'
      + '<ul class="space-y-1.5">' + coDb.map(function (t) {
          return '<li class="flex flex-wrap items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] p-2.5 text-sm">'
            + '<span class="shrink-0 font-semibold" style="color:' + MAU_AN + '">Bậc ' + t.level + '</span>'
            + t.special.map(function (d) {
                return '<span class="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-white/80">' + esc(d.label) + ' '
                  + '<span class="font-semibold" style="color:' + fc + '">+' + d.value + (d.pct ? '%' : '') + '</span></span>';
              }).join('') + '</li>';
        }).join('') + '</ul>';

    var coMo = bac.filter(function (t) { return t.unlock; });
    var moKhoa = !coMo.length ? '' : '<h4 class="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-[#e0c375]/80">Điều kiện mở khóa</h4>'
      + '<ul class="space-y-1.5">' + coMo.map(function (t) {
          return '<li class="flex gap-2.5 rounded-lg border border-white/[0.07] bg-white/[0.02] p-2.5 text-sm">'
            + '<span class="shrink-0 font-semibold" style="color:' + MAU_AN + '">Bậc ' + t.level + '</span>'
            + '<span class="text-white/75">' + esc(t.unlock) + '</span></li>';
        }).join('') + '</ul>';

    lopCn.innerHTML = '<div class="my-auto w-full max-w-[640px] overflow-hidden rounded-2xl border border-white/15 bg-[#14121c] shadow-2xl">'
      + '<div class="flex items-start gap-3 border-b border-white/10 bg-white/[0.04] px-5 py-4">'
      + anhNgua(h, 'h-16 w-16 shrink-0')
      + '<div class="min-w-0 flex-1">'
      + '<h3 class="flex items-center gap-2 text-lg font-semibold text-white">' + esc(h.name)
      + (h.moi ? '<span class="rounded-full border border-amber-200/70 bg-red-500 px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none text-white">Mới</span>' : '')
      + '</h3><div class="mt-1.5 flex flex-wrap items-center gap-1.5">'
      + '<span class="rounded px-2 py-0.5 text-xs font-medium" style="color:' + fc + ';background-color:' + rgba(fc, 0.118)
      + ';border:1px solid ' + rgba(fc, 0.4) + '">Phẩm chất ' + h.quality + '</span>'
      + '<span class="rounded bg-white/10 px-2 py-0.5 text-xs text-white/70">Tối đa ' + sao + '★</span>'
      + '<span class="rounded bg-white/10 px-2 py-0.5 text-xs text-white/70">Tăng trưởng ' + h.growth + '</span>'
      + (h.usage ? '<span class="rounded bg-white/10 px-2 py-0.5 text-xs text-white/70">' + esc(h.usage) + '</span>' : '')
      + '</div></div>'
      + '<button type="button" aria-label="Đóng" data-nlw-dong-cn class="shrink-0 rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white">'
      + '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></div>'
      + '<div class="max-h-[72vh] overflow-y-auto px-5 py-4">'
      + (h.location ? '<p class="mb-1 text-xs text-white/50"><span class="text-white/40">Xuất xứ:</span> ' + esc(h.location) + '</p>' : '')
      + (h.desc ? '<p class="mb-4 text-sm leading-6 text-white/70">' + esc(h.desc) + '</p>' : '')
      + mayTinh + bangBac + dacBiet + moKhoa + '</div></div>';
    history.replaceState(null, '', location.pathname + '?horse=' + key);
  }

  function moChuongNgua(key) {
    return taiTra().then(function () {
      if (khoCn) return khoCn;
      return tai(BASE + 'data/horse-detail.json').then(function (d) {
        khoCn = {};
        d.horses.forEach(function (x) { khoCn[x.key] = x; });
        return khoCn;
      });
    }).then(function () {
      if (!khoCn[key]) return;
      cnDangMo = key;
      resetUi(1, khoCn[key].tiers.length);
      veLai = function () { veChuongNgua(cnDangMo); };
      if (!lopCn) {
        lopCn = document.createElement('div');
        lopCn.className = 'fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-6';
        document.body.appendChild(lopCn);
      }
      veChuongNgua(key);
    });
  }

  function dongChuongNgua() {
    if (!lopCn) return;
    lopCn.remove();
    lopCn = null;
    cnDangMo = null;
    history.replaceState(null, '', location.pathname);
  }

  // ===== Popup Khoa Kỹ Cao Cấp — trang /tech/advanced (KHÔNG deep-link) =====
  var MAU_CC = '#c9a24b';
  var lopCc = null;
  var ccDangMo = null;
  var khoCc = null;

  function cong(a, x) { return a + x; }

  function chipNL(c, them) {
    return '<span class="inline-flex items-center gap-1' + (them ? ' ' + them : '') + '">'
      + '<span class="relative inline-block h-4 w-4 shrink-0 align-text-bottom">'
      + (c.icon ? '<img alt="" class="h-full w-full object-contain" src="' + anh(c.icon) + '">' : '')
      + '</span>' + esc(c.name) + '</span>';
  }

  function hieuQua(t, i) {
    return t.pct ? '+' + t.effect[i] + '%' : '+' + soEn(t.effect[i]);
  }

  function veCaoCap(key) {
    var t = khoCc[key];
    var tien = tra.caoCap.currency;
    var soCap = t.effect.length;
    var cuoi = soCap - 1;
    var kep = function (v) { return Math.min(Math.max(0, v), soCap); };
    var tu = Math.min(kep(ui.tu), kep(ui.den));
    var den = Math.max(kep(ui.tu), kep(ui.den));
    var hq = function (s) { return s <= 0 ? (t.pct ? '+0%' : '+0') : hieuQua(t, s - 1); };

    var giaiDoan = (t.stages || []).map(function (s) {
      return '<div class="flex items-center gap-1.5">'
        + '<span class="relative h-9 w-9">'
        + (s.icon ? '<img alt="" class="h-full w-full object-contain" src="' + anh(s.icon) + '">' : '') + '</span>'
        + '<span class="text-xs text-white/50">Cấp ' + s.level + '+</span></div>';
    }).join('');

    var tomTat = '<div class="mb-3 flex flex-wrap gap-2 text-xs">'
      + '<span class="rounded bg-white/[0.06] px-2.5 py-1 text-white/70">Tối đa: <b class="text-white/95">'
      + hieuQua(t, cuoi) + '</b></span>'
      + '<span class="inline-flex items-center gap-1 rounded bg-white/[0.06] px-2.5 py-1 text-white/70">Tổng: '
      + '<b class="text-[#e0c375]">' + soEn(t.pointCost.reduce(cong, 0)) + '</b>' + chipNL(tien.point) + ' + '
      + '<b class="text-[#e0c375]">' + soEn(t.tripodCost.reduce(cong, 0)) + '</b>' + chipNL(tien.tripod) + '</span></div>';

    var tongDiem = t.pointCost.slice(tu, den).reduce(cong, 0);
    var tongDinh = t.tripodCost.slice(tu, den).reduce(cong, 0);
    var oNhap = 'w-16 rounded-lg border border-white/25 bg-black/40 px-2 py-1.5 text-center text-base font-bold tabular-nums text-white focus:border-[#c9a24b] focus:outline-none';
    var mayTinh = '<div class="mb-4 rounded-lg border border-white/10 bg-white/[0.02] p-3">'
      + '<p class="mb-2 text-xs font-semibold uppercase tracking-wider text-[#e0c375]/80">Tính hiệu quả &amp; chi phí theo cấp</p>'
      + '<div class="flex flex-wrap items-center gap-2 text-xs text-white/60">Từ cấp'
      + '<input type="number" min="0" max="' + soCap + '" data-nlw-tu class="' + oNhap + '" aria-label="Từ cấp" value="' + ui.tu + '">đến cấp'
      + '<input type="number" min="0" max="' + soCap + '" data-nlw-den class="' + oNhap + '" aria-label="Đến cấp" value="' + ui.den + '">'
      + '<span class="text-white/40">/ ' + soCap + '</span></div>'
      + '<div class="mt-2.5 flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm">'
      + '<span class="text-white/60">' + esc(t.stat) + '</span>'
      + '<span class="tabular-nums"><span class="text-white/45">Lv' + tu + ' ' + hq(tu) + '</span>'
      + '<span class="mx-1 text-white/30">→</span>'
      + '<span class="font-semibold" style="color:' + MAU_CC + '">Lv' + den + ' ' + hq(den) + '</span></span></div>'
      + '<div class="mt-2 grid grid-cols-2 gap-2">'
      + '<div class="flex items-center justify-between gap-2 rounded-lg bg-[#c98b3b]/12 px-3 py-2.5 ring-1 ring-[#c98b3b]/25">'
      + chipNL(tien.point, 'text-xs text-white/75')
      + '<span class="text-base font-bold text-white/90 tabular-nums">' + soEn(tongDiem) + '</span></div>'
      + '<div class="flex items-center justify-between gap-2 rounded-lg bg-[#c98b3b]/12 px-3 py-2.5 ring-1 ring-[#c98b3b]/25">'
      + chipNL(tien.tripod, 'text-xs text-white/75')
      + '<span class="text-base font-bold text-[#e7d97a] tabular-nums">' + (tongDinh || '—') + '</span></div></div>'
      + '<p class="mt-1.5 text-[11px] leading-4 text-white/45">Tổng nguyên liệu để nâng từ Lv' + tu + ' đến Lv' + den
      + '. Huân Đỉnh chỉ tốn ở các mốc (từ cấp 3).</p></div>';

    var mocTienHoa = {};
    (t.stages || []).forEach(function (s) { mocTienHoa[s.level] = 1; });
    var hang = t.effect.map(function (_, i) {
      var cap = i + 1;
      return '<tr class="border-t border-white/[0.06] odd:bg-white/[0.015]">'
        + '<td class="px-3 py-1.5 text-left text-white/80">Lv' + cap
        + (mocTienHoa[cap] && cap > 1 ? '<span class="ml-1.5 text-[10px] text-[#e0c375]">★ tiến hóa</span>' : '') + '</td>'
        + '<td class="px-3 py-1.5 text-right font-medium tabular-nums" style="color:'
        + (i === cuoi ? MAU_CC : 'rgba(255,255,255,0.85)') + '">' + hieuQua(t, i) + '</td>'
        + '<td class="px-3 py-1.5 text-right tabular-nums text-white/65">' + soEn(t.pointCost[i]) + '</td>'
        + '<td class="px-3 py-1.5 text-right tabular-nums text-white/65">'
        + (t.tripodCost[i] ? t.tripodCost[i] : '<span class="text-white/25">—</span>') + '</td></tr>';
    }).join('');

    var bang = '<div class="overflow-x-auto rounded-lg border border-white/10">'
      + '<table class="w-full border-collapse text-sm">'
      + '<thead class="sticky top-0 bg-[#1b1826] text-white/60"><tr>'
      + '<th class="px-3 py-2 text-left font-medium">Cấp</th>'
      + '<th class="px-3 py-2 text-right font-medium">' + esc(t.stat) + '</th>'
      + '<th class="px-3 py-2 font-medium">' + chipNL(tien.point, 'justify-end') + '</th>'
      + '<th class="px-3 py-2 font-medium">' + chipNL(tien.tripod, 'justify-end') + '</th>'
      + '</tr></thead><tbody>' + hang + '</tbody></table></div>';

    lopCc.innerHTML = '<div class="my-auto w-full max-w-[560px] overflow-hidden rounded-2xl border border-white/15 bg-[#14121c] shadow-2xl">'
      + '<div class="flex items-start gap-3 border-b border-white/10 bg-white/[0.04] px-5 py-4">'
      + '<span class="relative h-16 w-16 shrink-0">'
      + (t.icon ? '<img alt="' + esc(t.name) + '" class="h-full w-full object-contain" src="' + anh(t.icon) + '">' : '') + '</span>'
      + '<div class="min-w-0 flex-1">'
      + '<h3 class="text-lg font-semibold text-white">' + esc(t.name) + '</h3>'
      + (t.meaning ? '<p class="text-xs italic text-white/45">' + esc(t.meaning) + '</p>' : '')
      + '<div class="mt-1.5 flex flex-wrap items-center gap-1.5">'
      + '<span class="rounded bg-white/10 px-2 py-0.5 text-xs text-white/70">Mở khóa · Thành Chính ' + t.unlockLevel + '</span>'
      + '<span class="rounded px-2 py-0.5 text-xs font-medium" style="color:' + MAU_CC + ';background-color:'
      + rgba(MAU_CC, 0.118) + ';border:1px solid ' + rgba(MAU_CC, 0.333) + '">' + esc(t.stat) + '</span>'
      + '</div></div>'
      + '<button type="button" aria-label="Đóng" data-nlw-dong-cc class="shrink-0 rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white">'
      + '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></div>'
      + '<div class="max-h-[72vh] overflow-y-auto px-5 py-4">'
      + '<div class="mb-4 flex items-center gap-4">' + giaiDoan + '</div>'
      + tomTat + mayTinh + bang + '</div></div>';
  }

  function moCaoCap(key) {
    return taiTra().then(function () {
      if (tra.caoCap) return tra.caoCap;
      return tai(BASE + 'data/advtech-detail.json').then(function (d) {
        tra.caoCap = d;
        khoCc = {};
        d.tech.forEach(function (x) { khoCc[x.key] = x; });
        return d;
      });
    }).then(function () {
      if (!khoCc[key]) return;
      ccDangMo = key;
      resetUi(0, khoCc[key].effect.length);
      veLai = function () { veCaoCap(ccDangMo); };
      if (!lopCc) {
        lopCc = document.createElement('div');
        lopCc.className = 'fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-6';
        lopCc.setAttribute('role', 'dialog');
        lopCc.setAttribute('aria-modal', 'true');
        document.body.appendChild(lopCc);
      }
      veCaoCap(key);
    });
  }

  function dongCaoCap() {
    if (!lopCc) return;
    lopCc.remove();
    lopCc = null;
    ccDangMo = null;
  }

  // ===== Popup Quân Ấn — trang /tech (KHÔNG deep-link) =====
  var lopQa = null;
  var qaDangMo = null;
  var khoQa = null;

  function giaAn(o, v) {
    return o.pct ? '+' + (v % 1 ? v.toFixed(1) : v) + '%' : '+' + soEn(v);
  }

  function mucQa(ten, than) {
    return '<div class="mb-4"><h4 class="mb-2 text-xs font-semibold uppercase tracking-wider text-[#e0c375]/80">'
      + ten + '</h4>' + than + '</div>';
  }

  function capToiDa(x) {
    return x.attrs.filter(function (o) { return o.series; })[0].series.length;
  }

  function chiPhiAn(cap) {
    var ct = 0, hp = 0;
    tra.quanAn.cost.forEach(function (c) {
      if (c.lv > cap) return;
      ct += c.ct;
      hp += c.hp;
    });
    return { ct: ct, hp: hp };
  }

  function veQuanAn(key) {
    var x = khoQa[key];
    var tien = tra.quanAn.currency;
    var coDinh = x.attrs.filter(function (o) { return o.fixed !== null; });
    var theoCap = x.attrs.filter(function (o) { return o.series !== null; });
    var soCap = capToiDa(x);
    var kep = function (v) { return Math.min(Math.max(1, v), soCap); };
    var tu = Math.min(kep(ui.tu), kep(ui.den));
    var den = Math.max(kep(ui.tu), kep(ui.den));
    var moc = function (o, cap) { return o.series[cap - 1]; };
    var goc = chiPhiAn(tu);
    var toi = chiPhiAn(den);
    var tonCt = toi.ct - goc.ct;
    var tonHp = toi.hp - goc.hp;

    var moKhoa = mucQa('Điều kiện mở khóa', '<p class="text-sm leading-6 text-white/75">'
      + (x.linked
          ? 'Mở khi sở hữu Trận pháp <b style="color:' + MAU_AN + '">' + esc(x.linked) + '</b> — Ấn đi kèm trận pháp này.'
          : '<b class="text-white/90">Ấn cơ bản</b> — không cần trận pháp.') + '</p>');

    var chip = !coDinh.length ? '' : '<div class="mb-2 flex flex-wrap gap-1.5">'
      + coDinh.map(function (o) {
          return '<span class="rounded bg-emerald-400/10 px-2 py-0.5 text-xs font-medium text-emerald-300">'
            + esc(o.label) + ' ' + giaAn(o, o.fixed)
            + ' <span class="text-emerald-300/50">(cố định)</span></span>';
        }).join('') + '</div>';
    var dong = !theoCap.length ? '' : '<ul class="space-y-1 text-sm text-white/80">'
      + theoCap.map(function (o) {
          return '<li class="flex items-center justify-between gap-3">'
            + '<span class="text-white/60">' + esc(o.label) + '</span>'
            + '<span class="tabular-nums">Lv1 ' + giaAn(o, moc(o, 1)) + ' <span class="text-white/30">→</span> '
            + '<span style="color:' + MAU_AN + '">Lv' + soCap + ' ' + giaAn(o, moc(o, soCap)) + '</span></span></li>';
        }).join('') + '</ul>';
    var kichHoat = !x.actMax ? '' : '<p class="mt-2 text-xs text-white/50">Kích hoạt tối đa: +'
      + soEn(x.actMax) + ' (qua 25 bậc kích hoạt)</p>';

    var oNhap = 'w-20 rounded-lg border border-white/25 bg-black/40 px-2 py-1.5 text-center text-base font-bold tabular-nums text-white focus:border-[#c9a24b] focus:outline-none';
    var soSanh = theoCap.map(function (o) {
      return '<div class="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm">'
        + '<span class="text-white/60">' + esc(o.label) + '</span><span class="tabular-nums">'
        + '<span class="text-white/45">Lv' + tu + ' ' + giaAn(o, moc(o, tu)) + '</span>'
        + '<span class="mx-1 text-white/30">→</span>'
        + '<span class="font-semibold" style="color:' + MAU_AN + '">Lv' + den + ' ' + giaAn(o, moc(o, den)) + '</span></span></div>';
    }).join('');
    var oTien = function (t, gia, mau) {
      return '<div class="flex items-center justify-between gap-2 rounded-lg bg-[#c98b3b]/12 px-3 py-2.5 ring-1 ring-[#c98b3b]/25">'
        + '<span class="flex items-center gap-1.5 text-xs text-white/75">'
        + '<span class="relative block h-5 w-5 shrink-0 overflow-hidden rounded-sm">'
        + '<img alt="' + esc(t.name) + '" class="h-full w-full object-contain" src="' + anh(t.icon) + '"></span>'
        + esc(t.name) + '</span>'
        + '<span class="text-base font-bold tabular-nums ' + mau + '">' + gia + '</span></div>';
    };
    var mayTinh = mucQa('Tính chỉ số &amp; chi phí theo cấp',
      '<div class="flex flex-wrap items-center gap-2 text-xs text-white/60">Từ cấp'
      + '<input type="number" min="1" max="' + soCap + '" data-nlw-tu class="' + oNhap + '" aria-label="Từ cấp" value="' + ui.tu + '">đến cấp'
      + '<input type="number" min="1" max="' + soCap + '" data-nlw-den class="' + oNhap + '" aria-label="Đến cấp" value="' + ui.den + '">'
      + '<span class="text-white/40">/ ' + soCap + '</span></div>'
      + '<div class="mt-3 grid gap-1.5 sm:grid-cols-2">' + soSanh + '</div>'
      + '<div class="mt-2 grid grid-cols-2 gap-2">'
      + oTien(tien.ct, soEn(tonCt), 'text-white/90') + oTien(tien.hp, tonHp || '—', 'text-[#e7d97a]') + '</div>'
      + '<p class="mt-1.5 text-[11px] leading-4 text-white/45">Chi phí để nâng từ Lv' + tu + ' đến Lv' + den
      + '. Chỉ số nền lấy đúng theo dữ liệu game từng cấp; chỉ số % cố định không đổi theo cấp.'
      + ' Hổ Phù chỉ tốn ở vài mốc từ Lv210. Đây là <span class="text-white/60">giá gốc</span>, chưa trừ giảm giá.</p>');

    lopQa.innerHTML = '<div class="my-auto w-full max-w-[560px] overflow-hidden rounded-2xl border border-white/15 bg-[#14121c] shadow-2xl">'
      + '<div class="flex items-start gap-3 border-b border-white/10 bg-white/[0.04] px-5 py-4">'
      + '<span class="relative block h-16 w-16 shrink-0">'
      + '<img alt="' + esc(x.name) + '" class="h-full w-full object-contain" src="' + anh(x.icon) + '"></span>'
      + '<div class="min-w-0 flex-1"><div class="flex flex-wrap items-center gap-2">'
      + '<h3 class="text-lg font-semibold text-white">' + esc(x.name) + '</h3>'
      + (x.moi ? '<span class="rounded-full border border-amber-200/70 bg-red-500 px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none text-white">Mới</span>' : '')
      + '</div>'
      + (x.linked ? '<p class="mt-0.5 text-sm text-white/55">Trận pháp liên kết: <span style="color:' + MAU_AN + '">' + esc(x.linked) + '</span></p>' : '')
      + '</div>'
      + '<button type="button" aria-label="Đóng" data-nlw-dong-qa class="shrink-0 rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white">'
      + '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></div>'
      + '<div class="max-h-[72vh] overflow-y-auto px-5 py-4">'
      + moKhoa + mucQa('Chỉ số', chip + dong + kichHoat) + mayTinh + '</div></div>';
  }

  function moQuanAn(key) {
    return taiTra().then(function () {
      if (tra.quanAn) return tra.quanAn;
      return tai(BASE + 'data/quan-an-detail.json').then(function (d) {
        tra.quanAn = d;
        khoQa = {};
        d.seals.forEach(function (x) { khoQa[x.key] = x; });
        return d;
      });
    }).then(function () {
      if (!khoQa[key]) return;
      qaDangMo = key;
      resetUi(1, capToiDa(khoQa[key]));
      veLai = function () { veQuanAn(qaDangMo); };
      if (!lopQa) {
        lopQa = document.createElement('div');
        lopQa.className = 'fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-6';
        lopQa.setAttribute('role', 'dialog');
        lopQa.setAttribute('aria-modal', 'true');
        document.body.appendChild(lopQa);
      }
      veQuanAn(key);
    });
  }

  function dongQuanAn() {
    if (!lopQa) return;
    lopQa.remove();
    lopQa = null;
    qaDangMo = null;
  }

  // ===== Popup Tinh Anh / Thống Soái — trang /elite, deep-link ?elite=<id đội> =====
  var MAU_PHE_TS = { 'Ngụy': '#3b6fc9', 'Thục': '#27865b', 'Ngô': '#c0392b', 'Quần': '#a259c8' };
  var HE_SO_TS = [['same', 'Cùng nước ×1'], ['quan', 'Quần ×1.5'], ['diff', 'Khác nước ×2']];
  var lopTs = null;
  var tsDangMo = null;
  var khoTs = null;

  // bản gốc bỏ phần phút khi đã có phần ngày
  function thoiGian(p) {
    var ngay = Math.floor(p / 1440);
    var gio = Math.floor(p % 1440 / 60);
    var phut = Math.round(p % 60);
    return [ngay && ngay + 'd', gio && gio + 'h', (phut && !ngay) && phut + 'm']
      .filter(Boolean).join(' ') || '0m';
  }

  function kimCuong(mau) {
    return '<span aria-hidden="true" class="inline-block h-3.5 w-3.5 shrink-0 rotate-45 rounded-[3px] align-[-2px]"'
      + ' style="background:linear-gradient(135deg, ' + mau + ', ' + rgba(mau, 0.4) + ');box-shadow:inset 0 0 0 1px '
      + rgba(mau, 0.667) + '"></span>';
  }

  function veTinhAnh(id) {
    var doi = khoTs[id];
    var hinh = doi.appearances[Math.min(ui.hinh, doi.appearances.length - 1)];
    var fc = MAU_PHE_TS[doi.camp] || MAU_CC;
    var meta = tra.tinhAnh.meta;
    var cs = CHI_SO_BINH.slice(0, 6);

    var dau = '<div class="flex items-start gap-4">'
      + (hinh.icon ? '<span class="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-black/30">'
          + '<img alt="' + esc(hinh.name) + '" class="h-full w-full object-cover" src="' + anh(hinh.icon) + '"></span>' : '')
      + '<div class="min-w-0 pt-1"><div class="flex flex-wrap items-center gap-1.5">'
      + '<span class="rounded px-2 py-0.5 text-xs font-medium" style="color:' + fc + ';background-color:' + rgba(fc, 0.133)
      + ';border:1px solid ' + fc + '">' + esc(doi.camp) + ' · Mở ở cấp ' + hinh.openLevel + '</span>'
      + (hinh.troopType ? '<span class="rounded bg-white/10 px-2 py-0.5 text-xs text-white/70">' + esc(hinh.troopType) + '</span>' : '')
      + '</div><h2 class="mt-1.5 font-[family-name:var(--font-serif-jp)] text-2xl font-bold leading-none text-white">'
      + esc(hinh.name) + '</h2></div></div>';

    var chonHinh = doi.appearances.length < 2 ? '' : '<div class="mt-4">'
      + '<p class="mb-1.5 text-xs tracking-wider text-white/70">Ngoại Hình</p>'
      + '<div class="flex flex-wrap gap-2">' + doi.appearances.map(function (x, i) {
          return '<button type="button" data-nlw-ts-hinh="' + i + '" class="flex items-center gap-2 rounded-lg border p-1 pr-2.5 transition" style="'
            + (x === hinh ? 'border-color:' + fc + ';background-color:' + rgba(fc, 0.133) : 'border-color:rgba(255,255,255,0.12)') + '">'
            + '<span class="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-black/30">'
            + (x.icon ? '<img alt="" class="h-full w-full object-cover" src="' + anh(x.icon) + '">' : '') + '</span>'
            + '<span class="text-xs font-medium text-white/85">' + esc(x.name) + '</span></button>';
        }).join('') + '</div></div>';

    var moTa = hinh.desc ? '<p class="mt-4 text-sm leading-6 text-white/80">' + veMoTa(hinh.desc) + '</p>' : '';

    var chiSo = '<div class="mt-5 border-t border-white/10 pt-4">'
      + '<p class="mb-2 text-xs tracking-wider text-white/70">Chỉ số cộng thêm</p>'
      + '<div class="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">' + cs.map(function (x) {
          return '<div class="flex items-baseline justify-between gap-2"><span class="text-xs text-white/72">' + x[0] + '</span>'
            + '<span class="text-sm font-semibold tabular-nums text-white">' + ((hinh.stats || {})[x[1]] || 0) + '</span></div>';
        }).join('') + '</div></div>';

    var theoCap = tra.tinhAnh.levelStats[hinh.id] || tra.tinhAnh.levelStats[doi.id] || [];
    var bangCap = !theoCap.length ? '' : '<div class="mt-4 border-t border-white/10 pt-4">'
      + '<p class="mb-2 text-xs tracking-wider text-white/70">Chỉ số cộng thêm theo cấp</p>'
      + '<div class="max-h-64 overflow-auto rounded-lg border border-white/10">'
      + '<table class="w-full whitespace-nowrap text-right text-xs tabular-nums">'
      + '<thead class="sticky top-0 bg-[#14121c] text-[10px] uppercase tracking-wide text-white/45"><tr>'
      + '<th class="sticky left-0 bg-[#14121c] px-2.5 py-1.5 text-left font-medium">Cấp</th>'
      + cs.map(function (x) { return '<th class="px-2.5 py-1.5 font-medium">' + x[0] + '</th>'; }).join('')
      + '</tr></thead><tbody>' + theoCap.map(function (r) {
          return '<tr class="border-t border-white/[0.05]">'
            + '<td class="sticky left-0 bg-[#14121c] px-2.5 py-1 text-left text-white/70">Lv' + r.level + '</td>'
            + cs.map(function (x) { return '<td class="px-2.5 py-1 text-white/85">' + (r[x[1]] || 0) + '</td>'; }).join('')
            + '</tr>';
        }).join('') + '</tbody></table></div></div>';

    var cap = hinh.levels || [];
    var mayTinh = '';
    if (cap.length) {
      var kep = function (v) { return Math.min(Math.max(1, v), cap.length); };
      var tu = Math.min(kep(ui.tu), kep(ui.den));
      var den = Math.max(kep(ui.tu), kep(ui.den));
      var nhan = meta.nationMult[ui.he] || 1;
      var tongNL = Math.round(cap.slice(tu, den).reduce(function (a, x) { return a + x.cost; }, 0) * nhan);
      var tongGio = Math.max(0, cap[den - 1].time - cap[tu - 1].time);
      var oNhapTs = 'w-16 rounded-lg border border-white/25 bg-black/40 px-2 py-1.5 text-center text-base font-bold tabular-nums text-white focus:border-[#c9a24b] focus:outline-none';
      mayTinh = '<div class="mt-5 border-t border-white/10 pt-4">'
        + '<p class="mb-2 text-xs tracking-wider text-white/70">Tính chi phí nâng cấp</p>'
        + '<div class="mb-2 flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm">'
        + '<span class="text-white/60">Điều kiện mở khóa</span>'
        + '<span class="font-semibold" style="color:' + fc + '">Mở ở cấp ' + hinh.openLevel + '</span></div>'
        + '<div class="mb-2.5 flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm">'
        + '<span class="flex items-center gap-1.5 text-white/60">' + kimCuong(fc) + 'Chi phí mở khóa</span>'
        + '<span class="flex items-center gap-2 tabular-nums">'
        + '<span class="font-semibold text-[#e7d97a]">' + soEn(Math.round(cap[0].cost * nhan)) + '</span>'
        + '<span class="text-white/30">·</span><span class="text-white/70">' + thoiGian(cap[0].time) + '</span></span></div>'
        + '<div class="flex flex-wrap items-center gap-2 text-xs text-white/60">Từ cấp'
        + '<input type="number" min="1" max="' + cap.length + '" data-nlw-tu class="' + oNhapTs + '" aria-label="Từ cấp" value="' + ui.tu + '">đến cấp'
        + '<input type="number" min="1" max="' + cap.length + '" data-nlw-den class="' + oNhapTs + '" aria-label="Đến cấp" value="' + ui.den + '">'
        + '<span class="text-white/40">/ ' + cap.length + '</span></div>'
        + '<div class="mt-2 flex flex-wrap gap-1.5">' + HE_SO_TS.map(function (x) {
            return '<button type="button" data-nlw-ts-he="' + x[0] + '" class="rounded-lg px-2.5 py-1 text-xs font-medium transition" style="'
              + (x[0] === ui.he ? 'color:' + fc + ';background-color:' + rgba(fc, 0.133) + ';border:1px solid ' + fc
                                : 'color:rgba(255,255,255,0.6);border:1px solid rgba(255,255,255,0.12)') + '">' + x[1] + '</button>';
          }).join('') + '</div>'
        + '<div class="mt-2.5 grid grid-cols-2 gap-2">'
        + '<div class="flex items-center justify-between gap-2 rounded-lg bg-[#c98b3b]/12 px-3 py-2.5 ring-1 ring-[#c98b3b]/25">'
        + '<span class="flex items-center gap-1.5 text-xs text-white/75">' + kimCuong(fc) + esc(meta.costName) + '</span>'
        + '<span class="text-base font-bold text-[#e7d97a] tabular-nums">' + soEn(tongNL) + '</span></div>'
        + '<div class="flex items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2.5">'
        + '<span class="text-xs text-white/75">Thời gian</span>'
        + '<span class="text-base font-bold text-white/90 tabular-nums">' + thoiGian(tongGio) + '</span></div></div>'
        + '<p class="mt-1.5 text-[11px] leading-4 text-white/45">Nguyên liệu &amp; thời gian để nâng Thống Soái từ cấp '
        + tu + ' lên cấp ' + den + ' (theo hệ số nước).</p></div>';
    }

    var kyNang = !(hinh.skills || []).length ? '' : '<div class="mt-5 border-t border-white/10 pt-4">'
      + '<p class="mb-3 text-xs tracking-wider text-white/70">Kỹ năng</p>'
      + '<div class="space-y-4">' + hinh.skills.map(function (k, pos) {
          var bo = (meta.skillUpgrades || []).filter(function (s) { return s.pos === pos; })[0];
          var hangKn = (k.levels || []).map(function (mo, i) {
            var muc = !bo ? null : (bo.levels || []).filter(function (l) { return l.level === i + 1; })[0];
            var chip = !muc ? '' : Object.keys(meta.materials).map(function (mid) {
              var rieng = (hinh.exclusiveMaterialIds || []).indexOf(Number(mid)) >= 0;
              var n = rieng ? muc.exclusiveItemNum : muc.itemNum;
              if (!n) return '';
              return '<span class="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs" style="'
                + (rieng ? 'border-color:' + rgba(fc, 0.4) + ';background-color:' + rgba(fc, 0.102) + ';color:#eee'
                         : 'border-color:rgba(255,255,255,0.12);color:rgba(255,255,255,0.8)') + '">'
                + kimCuong(rieng ? fc : '#8a93a6') + esc(meta.materials[mid]) + ' ×' + n + '</span>';
            }).join('');
            return '<tr class="border-t border-white/[0.06] odd:bg-white/[0.015] align-top">'
              + '<td class="px-3 py-1.5 text-white/80">' + (i + 1) + '</td>'
              + '<td class="px-3 py-1.5 leading-6 text-white/75">' + veMoTa(mo) + '</td>'
              + '<td class="whitespace-nowrap px-3 py-1.5 text-right tabular-nums text-white/70">' + (muc ? muc.reqEliteLevel : '—') + '</td>'
              + '<td class="px-3 py-1.5 text-right">'
              + (chip ? '<span class="inline-flex flex-wrap justify-end gap-1">' + chip + '</span>'
                      : '<span class="text-white/25">—</span>') + '</td></tr>';
          }).join('');
          return '<div><div class="mb-1.5 flex items-center gap-2.5">'
            + '<span class="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/15"'
            + ' style="background:radial-gradient(circle at 50% 40%, rgba(255,255,255,0.4), rgba(220,222,235,0.14))">'
            + (k.icon ? '<img alt="" class="h-7 w-7 object-contain" src="' + anh(k.icon) + '">' : '') + '</span>'
            + (k.name ? '<p class="text-sm font-semibold text-white" style="color:' + fc + '">' + esc(k.name) + '</p>' : '') + '</div>'
            + '<div class="overflow-x-auto rounded-lg border border-white/10"><table class="w-full text-sm">'
            + '<thead class="bg-white/[0.04] text-white/60"><tr>'
            + '<th class="px-3 py-1.5 text-left font-medium">Lv</th>'
            + '<th class="px-3 py-1.5 text-left font-medium">Kỹ năng</th>'
            + '<th class="whitespace-nowrap px-3 py-1.5 text-right font-medium">Yêu cầu cấp</th>'
            + '<th class="px-3 py-1.5 text-right font-medium">Chi phí nâng</th></tr></thead>'
            + '<tbody>' + hangKn + '</tbody></table></div></div>';
        }).join('') + '</div>'
      + (!(hinh.exclusiveMaterialIds || []).length ? '' : '<p class="mt-2 text-xs text-white/72">NL Chuyên: '
          + esc(hinh.exclusiveMaterialIds.map(function (mid) { return meta.materials[String(mid)]; }).filter(Boolean).join(', ')) + '</p>')
      + '</div>';

    var bangGia = '';
    if (cap.length) {
      var bung = ui.bung.tsGia;
      bangGia = '<div class="mt-5 border-t border-white/10 pt-4">'
        + '<button type="button" data-nlw-bung="tsGia" class="flex w-full items-center gap-2 text-left">'
        + '<span class="text-xs tracking-wider text-white/70">Chi phí &amp; thời gian nâng cấp</span>'
        + '<span class="text-xs text-white/72">' + (bung ? '−' : '+') + ' ' + cap.length + '</span></button>'
        + (!bung ? '' : '<div class="mt-2 overflow-x-auto"><table class="w-full text-sm">'
            + '<thead><tr class="border-b border-white/15 text-left text-xs text-white/70">'
            + '<th class="py-1.5 pr-3 font-medium">Cấp</th><th class="py-1.5 pr-3 font-medium">Thời gian</th>'
            + '<th class="py-1.5 pr-3 font-medium">Cùng nước</th><th class="py-1.5 pr-3 font-medium">Quần</th>'
            + '<th class="py-1.5 font-medium">Khác nước</th></tr></thead><tbody>'
            + cap.map(function (x) {
                return '<tr class="border-b border-white/5">'
                  + '<td class="py-1.5 pr-3 tabular-nums text-white/70">' + x.level + '</td>'
                  + '<td class="py-1.5 pr-3 tabular-nums text-white/75">' + thoiGian(x.time) + '</td>'
                  + '<td class="py-1.5 pr-3 tabular-nums text-white/90">' + x.cost + '</td>'
                  + '<td class="py-1.5 pr-3 tabular-nums text-amber-300/80">' + Math.round(x.cost * meta.nationMult.quan) + '</td>'
                  + '<td class="py-1.5 tabular-nums text-red-300/80">' + Math.round(x.cost * meta.nationMult.diff) + '</td></tr>';
              }).join('')
            + '</tbody></table></div>'
            + '<p class="mt-1.5 text-xs text-white/72">Cùng nước: ' + esc(meta.costName) + '</p>')
        + '</div>';
    }

    lopTs.innerHTML = '<div class="animate-card relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl"'
      + ' style="background:radial-gradient(120% 80% at 50% 0%, ' + rgba(fc, 0.133) + ', transparent 55%),'
      + ' linear-gradient(160deg, rgb(29,26,36) 0%, rgb(20,17,24) 55%, rgb(16,13,20) 100%);'
      + ' box-shadow:' + rgba(fc, 0.467) + ' 0px 24px 70px -14px">'
      + '<div class="h-1 w-full shrink-0" style="background-color:' + fc + '"></div>'
      + '<div class="overflow-y-auto p-6">' + dau + chonHinh + moTa + chiSo + bangCap + mayTinh + kyNang + bangGia
      + '</div></div>';
    history.replaceState(null, '', location.pathname + '?elite=' + id);
  }

  function moTinhAnh(id) {
    return taiTra().then(function () {
      if (tra.tinhAnh) return tra.tinhAnh;
      return tai(BASE + 'data/elite-detail.json').then(function (d) {
        tra.tinhAnh = d;
        khoTs = {};
        d.forces.forEach(function (x) { khoTs[x.id] = x; });
        return d;
      });
    }).then(function () {
      if (!khoTs[id]) return;
      tsDangMo = id;
      resetUi(1, khoTs[id].appearances[0].levels.length);
      ui.he = 'same';
      ui.hinh = 0;
      veLai = function () { veTinhAnh(tsDangMo); };
      if (!lopTs) {
        lopTs = document.createElement('div');
        lopTs.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md';
        lopTs.setAttribute('role', 'dialog');
        lopTs.setAttribute('aria-modal', 'true');
        document.body.appendChild(lopTs);
      }
      veTinhAnh(id);
    });
  }

  function dongTinhAnh() {
    if (!lopTs) return;
    lopTs.remove();
    lopTs = null;
    tsDangMo = null;
    history.replaceState(null, '', location.pathname);
  }

  var lopQtChip = null;
  var khoQt = null;
  var oKhoQt = null;
  var theLucQt = '';
  var giaiDoanQt = '';
  var chipQt = null;

  function dungKhoQuyTu(giaiDoan) {
    return taiTra().then(function () {
      if (khoQt) return khoQt;
      return tai(BASE + 'data/quytu-kho.json').then(function (d) { khoQt = d; return d; });
    }).then(function () {
      giaiDoanQt = giaiDoan;
      theLucQt = khoQt.nations[0];
      var heading = khoQt.stages[giaiDoan].heading;
      oKhoQt = [].filter.call(document.querySelectorAll('section h2'), function (h) {
        return h.textContent.trim() === heading;
      })[0].closest('section');
      veKhoQuyTu();
    });
  }

  function veKhoQuyTu() {
    var gd = khoQt.stages[giaiDoanQt];
    var khoTheLuc = gd.skills[theLucQt];
    var capVan = khoTheLuc.quanVanExclude;
    var vkTheoTen = gd.weaponMap ? gd.weaponMap[theLucQt] : null;

    var nut = khoQt.nations.map(function (n) {
      return '<button type="button" data-nlw-qt-nation="' + esc(n) + '"'
        + ' class="rounded-md px-3.5 py-1.5 text-base font-medium transition-colors"'
        + ' style="' + (n === theLucQt ? 'color:#14120c;background-color:' + khoQt.headingColor
                                       : 'color:#ffffffc0;background-color:#ffffff1a') + '">' + esc(n) + '</button>';
    }).join('');

    var oHe = khoQt.cats.map(function (he) {
      var mau = khoQt.catColors[he];
      var ds = khoTheLuc.he[he];
      var chip = ds.map(function (ten) {
        var cam = capVan.indexOf(ten) >= 0;
        var soVk = vkTheoTen && vkTheoTen[ten] ? vkTheoTen[ten].length : 0;
        return '<button type="button" data-nlw-qt-chip="' + esc(ten) + '" data-nlw-qt-he="' + esc(he) + '"'
          + ' class="rounded-md px-3 py-2 text-sm font-medium transition-transform hover:scale-[1.04]"'
          + ' style="color:' + (cam ? '#e0705a' : '#ffffffe6') + ';background-color:' + mau + (cam ? '12' : '26')
          + ';border:1px solid ' + mau + '66">' + esc(ten)
          + (cam ? '<span class="ml-1 text-[13px] text-[#e0705a]">văn✕</span>' : '')
          + (soVk ? '<span class="ml-1 text-[12px]" title="Vũ Khí Đặc Biệt">⚔️'
              + (soVk > 1 ? '<span class="text-[#e7d97a]">×' + soVk + '</span>' : '') + '</span>' : '')
          + '</button>';
      }).join('');
      return '<div class="rounded-lg border border-white/10 bg-black/20 p-3">'
        + '<p class="text-base font-bold" style="color:' + mau + '">Hệ ' + esc(he)
        + ' <span class="font-normal text-white/70">· ' + ds.length + ' kỹ năng</span></p>'
        + '<div class="mt-2 flex flex-wrap gap-1.5">' + chip + '</div></div>';
    }).join('');

    oKhoQt.innerHTML = '<div class="flex flex-wrap items-center justify-between gap-2">'
      + '<h2 class="text-lg font-bold" style="color:' + khoQt.headingColor + '">' + esc(gd.heading) + '</h2>'
      + '<div class="flex items-center gap-1">' + nut + '</div></div>'
      + '<p class="mt-1.5 text-sm text-white/65">Luyện <b class="text-white/85">hệ</b> nào thì được chọn'
      + ' <b class="text-white/85">1 kỹ năng</b> từ kho hệ đó. Bấm một kỹ năng để xem chi tiết.'
      + ' <b style="color:#e0705a">văn ✕</b> = <b class="text-white/85">Quan Văn</b> không học được.'
      + (gd.weaponMap ? ' <b class="text-[#e7d97a]">⚔️</b> = kỹ năng có <b class="text-white/85">Vũ Khí Đặc Biệt</b>'
          + ' (VKĐB) riêng — bấm để xem tên (một số kỹ năng có nhiều VKĐB).' : '')
      + '</p>'
      + '<div class="mt-3 grid gap-3 sm:grid-cols-2">' + oHe + '</div>'
      + (khoTheLuc.allExclude.length ? '<p class="mt-3 text-sm leading-6 text-white/70">'
          + '<b class="text-white/85">' + esc(theLucQt) + '</b> không học được (mọi con): '
          + khoTheLuc.allExclude.map(function (x) {
              return '<b class="text-[#e0705a]">' + esc(x) + ' </b>';
            }).join('') + '</p>' : '');

    if (chipQt) veQuyTuChip(chipQt[0], chipQt[1]);
  }

  function veQuyTuChip(ten, he) {
    var gd = khoQt.stages[giaiDoanQt];
    var fc = khoQt.catColors[he];
    var vkTheoTen = gd.weaponMap ? gd.weaponMap[theLucQt] : null;
    var dsVk = vkTheoTen && vkTheoTen[ten] ? vkTheoTen[ten] : [];

    lopQtChip.innerHTML = '<div class="animate-card relative w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl"'
      + ' style="border-color:' + rgba(fc, 0.4) + ';background:radial-gradient(120% 80% at 50% 0%, ' + rgba(fc, 0.133) + ', transparent 55%),'
      + ' linear-gradient(160deg, rgb(29,26,36) 0%, rgb(20,17,24) 55%, rgb(16,13,20) 100%);'
      + ' box-shadow:' + rgba(fc, 0.467) + ' 0px 24px 70px -14px">'
      + '<div class="h-1 w-full" style="background-color:' + fc + '"></div>'
      + '<div class="p-5"><div class="flex items-start justify-between gap-3"><div class="min-w-0">'
      + '<h3 class="text-xl font-bold" style="color:' + fc + '">' + esc(ten) + '</h3>'
      + '<span class="rounded px-2 py-0.5 text-xs font-medium" style="color:' + fc
      + ';background-color:' + rgba(fc, 0.133) + ';border:1px solid ' + fc + '">Hệ ' + esc(he) + '</span></div>'
      + '<button type="button" aria-label="Close" data-nlw-dong-qt-chip'
      + ' class="shrink-0 rounded-md px-2 py-1 text-base text-white/60 hover:bg-white/10 hover:text-white/90">✕</button></div>'
      + '<p class="mt-3 text-[15px] leading-7 text-white/90">'
      + esc(khoQt.desc[ten] || 'Chưa có mô tả kỹ năng này.') + '</p>'
      + (dsVk.length ? '<div class="mt-3 rounded-lg border border-[#e7d97a]/25 bg-[#e7d97a]/[0.06] p-2.5">'
          + '<p class="text-xs font-semibold text-[#e7d97a]">⚔️ Vũ Khí Đặc Biệt (' + dsVk.length + ')'
          + ' <span class="font-normal text-white/50">— bấm tên để xem chi tiết</span></p>'
          + '<div class="mt-2 flex flex-wrap gap-1.5">' + dsVk.map(function (w) {
              return '<span class="rounded-md border border-[#e7d97a]/30 bg-[#e7d97a]/[0.08] px-2 py-1 text-[13px]">'
                + esc(w) + '</span>';
            }).join('') + '</div></div>' : '')
      + (gd.skills[theLucQt].quanVanExclude.indexOf(ten) >= 0
          ? '<p class="mt-2 text-sm text-[#e0705a]">✕ Con làm <b>Quan Văn</b> không học được kỹ năng này.</p>' : '')
      + '</div></div>';
  }

  function moQuyTuChip(ten, he) {
    if (!lopQtChip) {
      lopQtChip = document.createElement('div');
      lopQtChip.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md';
      document.body.appendChild(lopQtChip);
    }
    chipQt = [ten, he];
    veQuyTuChip(ten, he);
  }

  function dongQuyTuChip() {
    if (!lopQtChip) return;
    lopQtChip.remove();
    lopQtChip = null;
    chipQt = null;
  }

  var oCamp = document.querySelector('[data-nlw-camp]');
  // HTML chạy ở ngoalong.vnggames.com/ngoa-long-wiki/pho-ban-chi-tiet, còn BASE là thư mục CDN của file JS
  var LINK_DS_PHO_BAN = 'pho-ban';
  var khoCamp = {};
  var khoCb = {};
  var cp = null;

  var MAU_LOAI = { boss: '#d6a24b', elite: '#9b5bd6', mob: '#6b7280', army: '#3b8fc9' };
  var TEN_LOAI = { boss: 'BOSS', elite: 'Tinh nhuệ', mob: 'Thường', army: 'Quân đoàn' };
  var PHE_CB = ['Thục', 'Ngô', 'Ngụy', 'Quần'];
  var SIDE_CB = ['vn', 'cn'];
  var NPC_MOI_TRANG = 10;
  var CB_MOI_PHE = 8;
  var LOP_NUT = 'rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/75 transition hover:bg-white/10';
  var LOP_TRANG = 'rounded-lg border border-white/15 px-3 py-1.5 disabled:opacity-40 enabled:hover:bg-white/10';

  function napCamp(key) {
    if (khoCamp[key]) return Promise.resolve(khoCamp[key]);
    return taiTra().then(function () { return tai(BASE + 'data/campaign/' + key + '.json'); })
      .then(function (d) { khoCamp[key] = d; return d; });
  }

  function napCb(key) {
    if (khoCb[key] !== undefined) return Promise.resolve(khoCb[key]);
    return tai(BASE + 'data/campaign/' + key + '-cb.json').then(function (d) { khoCb[key] = d; return d; });
  }

  function lon(n) {
    n = Number(n) || 0;
    if (n >= 1e9) return bo0((n / 1e9).toFixed(2)) + ' tỷ';
    if (n >= 1e6) return bo0((n / 1e6).toFixed(1)) + ' triệu';
    return soEn(n);
  }

  function bo0(s) { return s.indexOf('.') < 0 ? s : s.replace(/0+$/, '').replace(/\.$/, ''); }

  function pheCoNpc(d) {
    return ['vn', 'cn'].filter(function (s) { return d[s] && (d[s].npcs || []).length; });
  }

  function duLieuPhe(d, s) { return d[s] || d.vn || d.cn || d; }

  function doRoi(n) { return (n.drops && n.drops.length) ? n.drops : (n.drop ? [n.drop] : []); }

  function soQuan(t) { return t ? ' · ' + lon(t) + ' quân' : ''; }


// ---- THAY `chipHU` bằng `chipChu` ----------------------------------------
// `chipHU` cũ gộp 2 loại chip khác hẳn nhau. Chip chuỗi (Hiệu ứng NPC,
// Hiệu ứng ải) tách ra đây; chip có giá trị nằm trong `cotPhai`.
  function anhNpc(n) {
    if (n.icon) return n.icon;
    var f = (n.formation || [])[0] || {};
    if (f.icon) return f.icon;
    var u = tra.binh.units[f.soldierId];
    return u ? u.icon : '';
  }

  function chanDung(icon, lop, ten, mau) {
    return '<span class="relative block overflow-hidden ' + lop + '">'
      + (icon ? '<img alt="' + esc(ten) + '" class="h-full w-full object-cover" src="' + anh(icon) + '">'
        : '<span class="flex h-full w-full items-center justify-center text-base font-bold text-white"'
          + ' style="background:linear-gradient(160deg, ' + rgba(mau || '#c9a24b', 0.4) + ', #14110c 85%)">'
          + esc(String(ten || '').charAt(0)) + '</span>')
      + '</span>';
  }
// 4 chỗ gọi phải sửa theo:
//   thẻ NPC ở trang bản đồ : chanDung(anhNpc(n), 'h-14 w-14 shrink-0 rounded-lg ring-1 ring-white/10', n.name, m)
//   header trang chi tiết  : chanDung(anhNpc(n), 'h-16 w-16 shrink-0 rounded-lg ring-1 ring-white/10', n.name, m)
//   ô đội hình + cột phải  : đã nằm trong các hàm thay ở dưới.


// ---- THAY `nhanLoai` -----------------------------------------------------
// Bản gốc chỉ gắn `shrink-0` ở trang danh sách, header trang chi tiết KHÔNG có.
  function nhanMayChu(d, co) {
    var ds = [];
    if (d.hasVN) ds.push(['VN', 'bg-[#4bbf8a]/20 text-[#7fe0b6]']);
    if (d.hasCN || !ds.length) ds.push(['CN', 'bg-[#d6a24b]/20 text-[#e7c06f]']);
    return ds.map(function (x) {
      return '<span class="shrink-0 rounded font-bold ' + co + ' ' + x[1] + '">' + x[0] + '</span>';
    }).join('');
  }

  function nhanLoai(t, co) {
    var m = MAU_LOAI[t] || MAU_LOAI.mob;
    return '<span class="rounded ' + co + ' font-bold uppercase" style="color:' + m
      + ';background:' + m + '22">' + esc(TEN_LOAI[t] || t) + '</span>';
  }
// Chỗ gọi ở thẻ NPC trang bản đồ đổi thành:
//   nhanLoai(n.type, 'shrink-0 px-1.5 py-0.5 text-[10px]')
// Chỗ gọi ở header trang chi tiết giữ nguyên 'px-2 py-0.5 text-xs'.


// ---- THAY `hangTT` (chỉ đổi text-white/90 → text-white/85) ---------------
  function chipVP(icon, ten, hau, tim) {
    var vien = tim ? 'border-[#9b7fd6]/30 bg-[#9b7fd6]/[0.09]' : 'border-[#c9a24b]/25 bg-[#c9a24b]/[0.07]';
    return '<span class="inline-flex items-center gap-1.5 rounded-md border ' + vien + ' px-2 py-1 text-xs text-white/90">'
      + '<span class="relative block h-5 w-5 shrink-0">'
      + (icon ? '<img alt="" class="h-full w-full object-contain" src="' + anh(icon) + '">' : '')
      + '</span><span class="max-w-[170px] truncate font-medium">' + esc(ten) + '</span>'
      + (hau ? '<span class="tabular-nums text-white/70">' + esc(hau) + '</span>' : '') + '</span>';
  }

  function tieuDeCamp(t, mau) {
    return '<h3 class="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider ' + (mau || 'text-[#e0c375]/80')
      + '">' + esc(t) + '</h3>';
  }

  function khoiCamp(t, than) {
    if (!than) return '';
    return '<div><p class="mb-1.5 text-[13px] font-semibold uppercase tracking-wide text-[#e0c375]/90">'
      + esc(t) + '</p>' + than + '</div>';
  }

  function hangTT(k, v, tip) {
    return '<div class="flex items-center justify-between border-b border-white/[0.05] py-1 text-sm last:border-0">'
      + '<span class="flex items-center text-white/65">' + esc(k)
      + (tip ? '<span class="relative ml-1 inline-block"><button type="button" title="' + esc(tip) + '"'
          + ' class="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/25'
          + ' text-[9px] font-bold text-white/60 hover:bg-white/10" aria-label="Giải thích">?</button></span>' : '')
      + '</span><span class="tabular-nums text-white/85">' + v + '</span></div>';
  }


// ---- XOÁ `quanGon` · THAY `soQuan` --------------------------------------
// Bản gốc dùng đúng một hàm số lớn (`big`) cho quân: 11400 → "11,400",
// KHÔNG có bậc "nghìn". `lon` trong file đã đúng luật đó.
  function quanGon(n) {
    n = Number(n) || 0;
    if (n >= 1e6) return (n / 1e6).toFixed(1) + ' triệu';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + ' nghìn';
    return soEn(n);
  }

  // effects cấp NPC là chuỗi, effects trong ô đội hình là object có icon/desc
  function chipHU(ds) {
    return (ds || []).map(function (e) {
      if (typeof e === 'string') {
        return '<span class="rounded-md border border-white/10 bg-white/[0.05] px-2 py-1 text-xs text-white/80">' + esc(e) + '</span>';
      }
      var b = tra.buff[e.id];
      var m = b ? mauBuff(b) : MAU_BUFF.neutral;
      return '<button type="button"' + (b ? ' data-nlw-chip="' + esc(e.id) + '"' : '')
        + ' title="' + esc(e.desc) + (e.detail ? ' (' + e.detail + ')' : '') + '"'
        + ' class="inline-flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2 text-xs font-medium transition hover:brightness-125"'
        + ' style="background-color:' + rgba(m, 0.133) + ';border:1px solid ' + rgba(m, 0.4) + ';color:' + m + '">'
        + '<span class="relative h-4 w-4 shrink-0 overflow-hidden rounded-full bg-black/30">'
        + (e.icon ? '<img alt="" class="h-full w-full object-cover" src="' + anh(e.icon) + '">' : '')
        + '</span>' + esc(e.name) + '</button>';
    }).join('');
  }

  function cbCuaNpc(key, side, ident) {
    var c = khoCb[key];
    var s = c && c[side];
    return (s && s.npcs && s.npcs[String(ident)]) || null;
  }

  function coCB(key, side, ident) {
    var g = cbCuaNpc(key, side, ident);
    for (var k in g) if ((g[k] || []).length) return true;
    return false;
  }

  function npcHienTai() {
    var npcs = duLieuPhe(khoCamp[cp.key], cp.side).npcs || [];
    for (var i = 0; i < npcs.length; i++) if (String(npcs[i].ident) === String(cp.ident)) return npcs[i];
    return null;
  }

  function veCampMap(key) {
    return napCamp(key).then(function (d) {
      if (!d) { oCamp.innerHTML = loiCamp('Không tìm thấy bản đồ này.'); return; }
      var cac = pheCoNpc(d);
      var side = cac[0] || 'vn';
      var npcs = duLieuPhe(d, side).npcs || [];
      var moc = new URLSearchParams(location.search).get('npc');
      var vt = 0;
      npcs.forEach(function (n, i) { if (moc && String(n.ident) === moc) vt = i; });
      cp = { key: key, ident: null, side: side, trang: Math.floor(vt / NPC_MOI_TRANG) };
      veMap();
      if (d.hasCB && khoCb[key] === undefined) napCb(key).then(function () { if (cp && !cp.ident) veMap(); });
    });
  }

  function veMap() {
    var d = khoCamp[cp.key];
    var h = duLieuPhe(d, cp.side);
    var npcs = h.npcs || [];
    var soTrang = Math.max(1, Math.ceil(npcs.length / NPC_MOI_TRANG));
    if (cp.trang > soTrang - 1) cp.trang = soTrang - 1;
    if (cp.trang < 0) cp.trang = 0;
    var tu = cp.trang * NPC_MOI_TRANG;
    var trong = npcs.slice(tu, tu + NPC_MOI_TRANG);

    var quayLai = '<a href="' + LINK_DS_PHO_BAN + '" class="mb-3 inline-flex items-center gap-1.5 ' + LOP_NUT + '">‹ Danh sách bản đồ</a>';

    var dau = '<div class="flex flex-wrap items-center gap-2">' + nhanMayChu(d, 'text-sm px-2 py-0.5')
      + '<h2 class="text-3xl font-bold text-white">' + esc(d.name) + '</h2>'
      + (d.sub ? '<span class="text-base text-white/60">Thế lực ' + esc(d.sub) + '</span>' : '') + '</div>';

    var oChip = 'rounded bg-white/10 px-2.5 py-1 text-sm text-white/80';
    var chip = '<div class="mt-2 flex flex-wrap items-center gap-2">'
      + '<span class="' + oChip + '">Cấp bản đồ ' + esc(h.mapLevel) + '</span>'
      + '<span class="' + oChip + '">Thành Chính ' + esc(d.tcGroup == null ? h.unlockLevel : d.tcGroup) + '</span>'
      + (d.isHidden ? '<span title="Ải ẩn" class="rounded bg-[#9b7fd6]/25 px-2.5 py-1 text-sm font-bold text-[#c8b3f0]">Ẩn</span>' : '')
      + (d.tcUnlock ? '<span class="rounded bg-[#c0432c]/20 px-2.5 py-1 text-sm font-medium text-[#e0956f]">🔓 Mở giới hạn Thành Chính Lv'
          + esc(d.tcUnlock) + '</span>' : '')
      + '<span class="' + oChip + '">' + npcs.length + ' NPC</span></div>';

    var luat = !(h.buffs && h.buffs.length) ? ''
      : '<div class="mt-4 rounded-xl border border-[#c0432c]/30 bg-[#c0432c]/[0.07] p-3.5">'
        + '<p class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#e0956f]">Luật chiến đấu (áp dụng cả trận)</p>'
        + '<div class="flex flex-wrap gap-1.5">' + h.buffs.map(function (b) {
            return '<span class="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-xs text-white/80">' + esc(b) + '</span>';
          }).join('') + '</div></div>';

    var hang = trong.map(function (n, i) {
      var m = MAU_LOAI[n.type] || MAU_LOAI.mob;
      var roi = doRoi(n).map(function (v) { return chipVP(v.icon, v.name, v.rate ? v.rate + '%' : '', false); }).join('');
      // ban goc la the <a> nen mo tab moi / copy link duoc; giu data-nlw-camp-ai cho handler cu
      return '<a href="?map=' + esc(cp.key) + '&ai=' + esc(n.ident) + '&side=' + esc(cp.side) + '"'
        + ' data-nlw-camp-ai="' + esc(n.ident) + '"'
        + ' class="flex w-full items-start gap-3 rounded-xl border p-3 text-left transition hover:bg-white/[0.05]"'
        + ' style="border-color:' + rgba(m, 0.25) + '">'
        + '<span class="w-5 shrink-0 pt-1 text-right text-xs font-semibold tabular-nums text-white/35">' + (tu + i + 1) + '</span>'
        + chanDung(anhNpc(n), 'h-14 w-14 shrink-0 rounded-lg ring-1 ring-white/10', m)
        + '<span class="min-w-0 flex-1">'
        + '<span class="flex flex-wrap items-center gap-1.5">'
        + '<span class="text-sm font-semibold text-white">' + esc(n.name) + '</span>'
        + nhanLoai(n.type, 'px-1.5 py-0.5 text-[10px]')
        + (coCB(cp.key, cp.side, n.ident)
            ? '<span title="Có chiến báo thông quan" class="shrink-0 rounded bg-[#4bbf8a]/20 px-1 py-0.5 text-[9px] font-bold uppercase text-[#7fe0b6]">Có CB</span>' : '')
        + '</span>'
        + '<span class="mt-0.5 block text-xs text-white/50">Cấp ' + esc(n.level) + soQuan(n.troops)
        + ' · Chiến công ' + soEn(n.merit || 0) + '</span>'
        + (roi ? '<span class="mt-1.5 flex flex-wrap gap-1.5">' + roi + '</span>' : '')
        + '</span><span class="shrink-0 self-center text-lg text-white/25">›</span></a>';
    }).join('');

    var phanTrang = soTrang < 2 ? ''
      : '<div class="mt-3 flex items-center justify-center gap-3 text-sm text-white/70">'
        + '<button type="button" data-nlw-camp-trang="-1" class="' + LOP_TRANG + '"' + (cp.trang ? '' : ' disabled') + '>‹ Trước</button>'
        + '<span class="tabular-nums text-white/50">NPC ' + (tu + 1) + '–' + (tu + trong.length) + '/' + npcs.length + '</span>'
        + '<button type="button" data-nlw-camp-trang="1" class="' + LOP_TRANG + '"'
        + (cp.trang < soTrang - 1 ? '' : ' disabled') + '>Sau ›</button></div>';

    var thuong = !(h.rewards && h.rewards.length) ? '' : tieuDeCamp('Phần thưởng thông ải')
      + '<div class="flex flex-wrap gap-1.5">' + h.rewards.map(function (r) {
          return '<span class="inline-flex items-center gap-1.5 rounded-lg border border-[#c9a24b]/30 bg-[#c9a24b]/[0.08] px-2 py-1 text-xs">'
            + (r.icon ? '<img alt="" class="h-5 w-5 object-contain" src="' + anh(r.icon) + '">' : '')
            + '<span class="font-medium text-white/85">' + esc(r.name) + '</span>'
            + (!r.id && r.amount > 0 ? '<span class="tabular-nums text-white/70">×' + soEn(r.amount) + '</span>' : '')
            + '</span>';
        }).join('') + '</div>';

    var tt = !(h.thanhTuu && h.thanhTuu.length) ? ''
      : tieuDeCamp('Thành Tựu (phần thưởng tích lũy)', 'text-[#c8b3f0]/85')
        + '<div class="flex flex-wrap gap-1.5">' + h.thanhTuu.map(function (x) {
            return chipVP(x.icon, x.name, (!x.id && x.amount > 0) ? '×' + lon(x.amount) : '', true);
          }).join('') + '</div>';

    var roiAi = veRoiTrongAi(npcs);

    oCamp.innerHTML = '<div class="mx-auto max-w-[1000px] px-2">' + quayLai + dau + chip + luat
      + tieuDeCamp('Danh sách NPC (thứ tự trận đấu) — bấm để xem chi tiết')
      + '<div class="space-y-2">' + hang + '</div>' + phanTrang + thuong + tt + roiAi + '</div>';
  }

  function veRoiTrongAi(npcs) {
    var gom = {};
    var ds = [];
    npcs.forEach(function (n) {
      doRoi(n).forEach(function (v) {
        var o = gom[v.name];
        if (!o) { o = gom[v.name] = { icon: v.icon, name: v.name, category: v.category, rate: 0, tu: [] }; ds.push(o); }
        if ((v.rate || 0) > o.rate) o.rate = v.rate || 0;
        if (o.tu.indexOf(n.name) < 0) o.tu.push(n.name);
      });
    });
    if (!ds.length) return '';
    return tieuDeCamp('Rơi đồ trong ải (' + ds.length + ')')
      + '<div class="grid grid-cols-1 gap-1.5 sm:grid-cols-2">' + ds.map(function (o) {
          return '<div class="flex items-center gap-2.5 rounded-lg border border-[#c9a24b]/25 bg-[#c9a24b]/[0.06] p-2">'
            + (o.icon ? '<img alt="" class="h-8 w-8 shrink-0 object-contain" src="' + anh(o.icon) + '">' : '')
            + '<div class="min-w-0 flex-1"><div class="flex items-center gap-1.5">'
            + '<span class="truncate text-sm font-medium text-white">' + esc(o.name) + '</span>'
            + (o.category ? '<span class="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/60">' + esc(o.category) + '</span>' : '')
            + (o.rate ? '<span class="ml-auto shrink-0 text-xs tabular-nums text-[#e7d97a]">' + o.rate + '%</span>' : '')
            + '</div><p class="truncate text-[11px] text-white/45">Rơi từ: ' + esc(o.tu.join(', ')) + '</p></div></div>';
        }).join('') + '</div>';
  }

  function veCampAi(key, ident) {
    return napCamp(key).then(function (d) {
      if (!d) { oCamp.innerHTML = loiCamp('Không tìm thấy bản đồ này.'); return; }
      var cac = pheCoNpc(d).filter(function (s) {
        return (d[s].npcs || []).some(function (n) { return String(n.ident) === String(ident); });
      });
      var side = new URLSearchParams(location.search).get('side');
      if (cac.indexOf(side) < 0) side = cac[0] || pheCoNpc(d)[0] || 'vn';
      cp = { key: key, ident: ident, side: side, cac: cac, don: null, donTT: null, donCB: null, lat: true,
             ttSide: 'vn', ttPhe: null, ttMo: -1, cbSide: 'vn', cbPhe: null, cbMo: -1 };
      if (!d.hasCB) khoCb[key] = null;
      chonMacDinh();
      if (khoCb[key] !== undefined) chonPheCb();
      veAi();
      if (khoCb[key] === undefined) napCb(key).then(function () { if (cp && cp.ident === ident) { chonPheCb(); veAi(); } });
    });
  }

  function chonMacDinh() {
    var n = npcHienTai();
    var f = n && (n.formation || [])[0];
    cp.don = f ? donTuO('npc:' + f.pos) : null;
    var ds = pheTT();
    cp.ttPhe = ds.length ? ds[0].phe : null;
    cp.ttMo = -1;
  }

  function chonPheCb() {
    var ds = pheCB();
    cp.cbPhe = ds.length ? ds[0] : null;
    cp.cbMo = -1;
  }

  function pheTT() {
    var dem = {};
    ttTatCa().forEach(function (s) { dem[s.nation] = (dem[s.nation] || 0) + 1; });
    return PHE_CB.filter(function (p) { return dem[p]; })
      .map(function (p) { return { phe: p, n: dem[p] }; });
  }


// ---- THAY `chienThuat` --------------------------------------------------
  function chienThuat() {
    return ttTatCa().filter(function (s) { return s.nation === cp.ttPhe; });
  }


// ---- THAY `pheCB` -------------------------------------------------------
// Bản gốc luôn in đủ Thục · Ngô · Ngụy (kể cả 0 chiến báo), thêm Quần khi có.
  function pheCB() {
    var g = cbCuaNpc(cp.key, cp.cbSide, cp.ident);
    if (!g || !PHE_CB.some(function (p) { return (g[p] || []).length; })) return [];
    return PHE_CB.slice(0, 3).concat((g['Quần'] || []).length ? ['Quần'] : []);
  }


// ---- THÊM `demCB` -------------------------------------------------------
// Số chiến báo bản gốc đếm theo phần THẤY được: mỗi nước tối đa 8.
  function chienBao() {
    var g = cbCuaNpc(cp.key, cp.cbSide, cp.ident);
    return ((g && g[cp.cbPhe]) || []).slice(0, CB_MOI_PHE);
  }

  function donTuO(ma) {
    var p = ma.split(':');
    if (p[0] === 'npc') {
      var n = npcHienTai();
      var f = null;
      (n ? n.formation || [] : []).forEach(function (x) { if (String(x.pos) === p[1]) f = x; });
      if (!f) return null;
      return { ma: ma, ten: f.general, icon: f.icon, binh: f.soldierId,
               phu: 'Vị trí ' + f.pos + ' · Cấp ' + f.level + soQuan(f.hp), kn: f.activeSkill, hu: f.effects };
    }
    var s = (p[0] === 'tt' ? chienThuat() : chienBao())[Number(p[1])];
    var g = s && (s.formation || [])[Number(p[2])];
    if (!g) return null;
    return { ma: ma, g: g };
  }

  function donHienTai(ma) {
    return ma.indexOf('tt:') === 0 ? cp.donTT : ma.indexOf('cb:') === 0 ? cp.donCB : cp.don;
  }

  var CAP_CONG = [['Liệt', '#4b6262', 0], ['Thứ', '#2e8aa8', 1], ['Bình', '#1a724c', 1.2],
    ['Trung', '#9c9e19', 1.5], ['Lương', '#bd6632', 1.8], ['Ưu', '#c11e3c', 2.1], ['Tuyệt', '#8938da', 3.2]];
  var CAP_THU = [['Liệt', '#4b6262', 0], ['Thứ', '#2e8aa8', 0.2], ['Bình', '#1a724c', 0.35],
    ['Trung', '#9c9e19', 0.5], ['Lương', '#bd6632', 0.65], ['Ưu', '#c11e3c', 0.8]];
  function oDoiHinh(ma, icon, ten, binh) {
    var dang = donHienTai(ma);
    var chon = dang && dang.ma === ma;
    if (binh === undefined) {
      return '<button type="button" data-nlw-camp-o="' + esc(ma) + '"'
        + ' class="aspect-square rounded-lg border p-1 transition hover:bg-white/[0.06]"'
        + ' style="border-color:' + (chon ? '#c9a24b' : 'rgba(255,255,255,0.10)')
        + ';background:' + (chon ? 'rgba(201,162,75,0.12)' : 'rgba(255,255,255,0.02)') + '">'
        + '<span class="flex h-full flex-col items-center justify-center gap-1">'
        + chanDung(icon, 'h-16 w-16 rounded ring-1 ring-white/10', ten, '')
        + '<span class="line-clamp-2 break-words text-center text-[10px] leading-tight text-white/70">' + esc(ten) + '</span>'
        + '</span></button>';
    }
    return '<button type="button" data-nlw-camp-o="' + esc(ma) + '"'
      + ' class="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border p-1 text-center transition hover:bg-white/[0.06]"'
      + ' style="border-color:' + (chon ? 'rgb(201, 162, 75)' : 'rgba(201,162,75,0.333)')
      + ';background:' + (chon ? 'rgba(201,162,75,0.133)' : 'rgba(201,162,75,0.07)') + '">'
      + chanDung(icon, 'h-12 w-12 rounded ring-1 ring-white/10', ten, '')
      + '<span class="line-clamp-1 w-full text-center text-[13px] font-medium leading-tight text-white/85">' + esc(ten) + '</span>'
      + '<span class="line-clamp-1 w-full text-center text-[11px] leading-tight text-[#7cc0ea]/80">' + esc(binh || '') + '</span>'
      + '</button>';
  }


// ---- THAY `luoiDoiHinh` --------------------------------------------------
// Ô trống của bản gốc vẫn là nút (mờ 25%), không phải span rỗng;
// tướng thiếu icon thì lấy icon binh chủng.
  function luoiDoiHinh(form, tien, lat) {
    var theoPos = {};
    (form || []).forEach(function (f, i) { theoPos[f.pos] = [f, i]; });
    var ra = '';
    for (var i = 0; i < 9; i++) {
      var pos = lat ? (3 * Math.floor(i / 3) + (2 - i % 3) + 1) : (i + 1);
      var o = theoPos[pos];
      var cuaNpc = tien === 'npc:';
      if (!o) {
        ra += cuaNpc
          ? '<button type="button" disabled class="aspect-square rounded-lg border p-1 transition opacity-25"'
            + ' style="border-color:rgba(255,255,255,0.10);background:rgba(255,255,255,0.02)">'
            + '<span class="block h-full"></span></button>'
          : '<div class="aspect-square rounded-lg border border-dashed border-white/[0.08]"></div>';
        continue;
      }
      var u = tra.binh.units[o[0].soldierId];
      ra += cuaNpc
        ? oDoiHinh(tien + pos, o[0].icon || (u ? u.icon : ''), o[0].general || o[0].name)
        : oDoiHinh(tien + o[1], o[0].icon || '', o[0].general || o[0].name, o[0].soldier || '');
    }
    return ra;
  }


// ---- THAY `cotPhai` (mục 1 + mục 2 của brief) ----------------------------
// 1. Dòng kỹ năng: "{tên} · Cấp {lv}" chứ không phải "{tên} Lv{lv}".
// 2. Mỗi hiệu ứng có thêm giá trị (`detail`) ngay sau tên, và cả khối hiệu ứng
//    nằm LỒNG trong mục "Kỹ năng chủ động", tiêu đề nhỏ text-[10px].
// 3. Mô tả kỹ năng bản gốc để nguyên văn (giữ dấu ngoặc vuông), không tô màu;
//    riêng mô tả binh chủng thì có tô màu → vẫn dùng `veMoTa`.
  function veAi() {
    var d = khoCamp[cp.key];
    var npcs = duLieuPhe(d, cp.side).npcs || [];
    var vt = -1;
    npcs.forEach(function (n, i) { if (String(n.ident) === String(cp.ident)) vt = i; });
    var quayLai = '<button type="button" data-nlw-camp-map="' + esc(cp.key) + '"'
      + ' class="inline-flex items-center gap-1.5 ' + LOP_NUT + '">‹ ' + esc(d.name) + '</button>';
    if (vt < 0) {
      oCamp.innerHTML = '<div class="mx-auto max-w-[1560px] px-2"><div class="mb-3">' + quayLai + '</div>'
        + '<p class="mt-10 text-center text-sm text-white/50">Không tìm thấy NPC trong bản đồ này.</p></div>';
      return;
    }
    var n = npcs[vt];
    var m = MAU_LOAI[n.type] || MAU_LOAI.mob;

    // bam dung markup goc: ten hien tu breakpoint sm, man nho hien nhan chung
    var nutNpc = function (x, mui, nhan) {
      var lop = 'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm';
      if (!x) {
        var trong = '<span class="hidden sm:inline">' + nhan + '</span>';
        return '<span class="' + lop + ' border-white/10 text-white/30">'
          + (mui === '‹' ? '‹ ' + trong : trong + ' ›') + '</span>';
      }
      var ten = '<span class="hidden max-w-[10rem] truncate sm:inline">' + esc(x.name) + '</span>'
        + '<span class="sm:hidden">' + nhan + '</span>';
      return '<a title="' + esc(x.name) + '" data-nlw-camp-ai="' + esc(x.ident) + '"'
        + ' class="' + lop + ' border-white/15 text-white/75 hover:bg-white/10">'
        + (mui === '‹' ? '‹ ' + ten : ten + ' ›') + '</a>';
    };
    var dieuHuong = '<div class="mb-3 flex flex-wrap items-center gap-2">' + quayLai
      + '<div class="ml-auto flex items-center gap-2">'
      + nutNpc(npcs[vt - 1], '‹', 'NPC trước') + nutNpc(npcs[vt + 1], '›', 'NPC sau') + '</div></div>';

    var tabPhe = cp.cac.length < 2 ? '' : '<div class="inline-flex overflow-hidden rounded-lg border border-white/15">'
      + cp.cac.map(function (s) {
          var bat = s === 'vn' ? 'bg-[#4bbf8a]/25 text-[#7fe0b6]' : 'bg-[#d6a24b]/25 text-[#e7c06f]';
          return '<button type="button" data-nlw-camp-side="' + s + '" class="px-3 py-1 text-xs font-semibold transition '
            + (s === cp.side ? bat : 'text-white/55 hover:bg-white/10') + '">'
            + (s === 'vn' ? 'VN' : 'CN') + '</button>';
        }).join('') + '</div>';

    var header = '<div class="flex items-start gap-4 border-b border-white/10 bg-white/[0.04] px-5 py-4">'
      + chanDung(anhNpc(n), 'h-16 w-16 shrink-0 rounded-lg ring-1 ring-white/10', n.name, m)
      + '<div class="min-w-0 flex-1"><div class="flex flex-wrap items-center gap-2">'
      + '<h1 class="text-2xl font-semibold text-white">' + esc(n.name) + '</h1>'
      + nhanLoai(n.type, 'px-2 py-0.5 text-xs') + tabPhe + '</div>'
      + '<p class="mt-0.5 text-sm text-white/50">Cấp ' + esc(n.level) + soQuan(n.troops) + '</p></div></div>';

    var than = '<div class="grid grid-cols-1 gap-px bg-white/[0.06] md:grid-cols-[1fr_1.1fr_1fr]">'
      + '<div class="space-y-4 bg-[#14121c] p-4">' + cotTrai(d, n) + '</div>'
      + '<div class="bg-[#14121c] p-4">' + cotGiua(n) + '</div>'
      + '<div class="bg-[#14121c] p-4">' + cotPhai() + '</div></div>';

    oCamp.innerHTML = '<div class="mx-auto max-w-[1560px] px-2">' + dieuHuong
      + '<div class="overflow-hidden rounded-2xl border border-white/15 bg-[#14121c] shadow-2xl">'
      + header + than + veChienThuat() + veChienBao() + '</div></div>';
  }


// ---- THAY `clickCamp` (thêm 2 nhánh gập/bung dải dưới) -------------------
  function cotTrai(d, n) {
    var h = duLieuPhe(d, cp.side);
    var thongTin = hangTT('Loại', esc(TEN_LOAI[n.type] || n.type))
      + hangTT('Cấp', esc(n.level))
      + hangTT('Tổng quân', n.troops ? lon(n.troops) : '—')
      + hangTT('Hệ số công', soEn(n.power || 0),
          'Hệ số công (攻击系数) là hệ số phóng đại sát thương của NPC — dùng để nhân lên sát thương đòn đánh.'
          + ' NPC cấp càng cao / độ khó càng lớn thì hệ số này càng lớn (tăng rất nhanh), nên đây là thước đo'
          + ' sức mạnh tấn công tổng thể của NPC chứ không phải sát thương mỗi đòn.')
      + (n.qtyLimit ? hangTT('Số lượng', esc(n.qtyLimit), 'Số lần tối đa có thể khiêu chiến NPC này.') : '')
      + hangTT('Ra tay trước', n.fastAttack ? 'NPC (Đột Tập)' : 'Đội bạn',
          'NPC ra tay trước khi có Đột Tập (đột kích ngay đầu trận); nếu không, đội bạn đánh trước.');

    var chuaCong = !n.masterSkill ? '' : '<div class="mt-3">'
      + '<p class="mb-1 text-[13px] font-semibold uppercase tracking-wide text-[#e0c375]/90">Kỹ Năng Chúa Công</p>'
      + '<p class="text-sm font-medium leading-snug text-white/90">' + esc(n.masterSkill) + '</p>'
      + (n.masterSkillDesc ? '<p class="mt-0.5 text-xs leading-5 text-white/70">' + esc(n.masterSkillDesc) + '</p>' : '')
      + '</div>';

    var roi = doRoi(n);
    var khoiRoi = !roi.length ? '' : '<div class="space-y-1.5">' + roi.map(function (v) {
        return '<div class="flex items-center gap-2.5 rounded-lg border border-[#c9a24b]/30 bg-[#c9a24b]/[0.07] p-2">'
          + '<span class="relative block h-9 w-9 shrink-0">'
          + (v.icon ? '<img alt="" class="h-full w-full object-contain" src="' + anh(v.icon) + '">'
                    : '<span class="flex h-full w-full items-center justify-center rounded bg-white/10 text-xs text-white/70">?</span>')
          + '</span><div class="min-w-0 flex-1"><div class="flex items-center gap-1.5">'
          + '<p class="truncate text-sm font-medium text-white">' + esc(v.name) + '</p>'
          + (v.category ? '<span class="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/60">' + esc(v.category) + '</span>' : '')
          + '</div><p class="text-xs text-white/50">Tỉ lệ ' + esc(v.rate) + '%'
          + ((v.stats && v.stats.length) ? ' · ' + esc(v.stats.join(' · ')) : '') + '</p></div></div>';
      }).join('') + '</div>';

    var hon = !(n.souls && n.souls.length) ? '' : '<div class="flex flex-wrap gap-1.5">' + n.souls.map(function (s) {
        return '<span class="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-white/85">'
          + esc(s.name) + ' <span class="tabular-nums text-white/65">' + giaHonThu(s.value) + '</span></span>';
      }).join('') + '</div>';

    var luatAi = (h.buffs && h.buffs.length) ? h.buffs : (d.buffs || []);
    var hu = (n.effects || []);

    return khoiCamp('Thông tin', thongTin) + chuaCong
      + khoiCamp('Rơi đồ' + (roi.length > 1 ? ' (' + roi.length + ')' : ''), khoiRoi)
      + khoiCamp('Hồn thú', hon)
      + khoiCamp('Hiệu ứng', !hu.length ? '' : '<div class="flex flex-wrap gap-1.5">' + chipChu(hu, false) + '</div>')
      + khoiCamp('Hiệu ứng ải', !luatAi.length ? '' : '<div class="flex flex-wrap gap-1.5">' + chipChu(luatAi, true) + '</div>');
  }


// ---- THAY `cotGiua` ------------------------------------------------------
// Nút lật của bản gốc là công tắc gạt, không phải nút icon.
  function giaHonThu(v) {
    var s = Math.abs(v) <= 1 ? Math.round(100 * v) + '%' : soEn(v);
    return v > 0 ? '+' + s : s;
  }


// ---- THAY `cotTrai` ------------------------------------------------------
  function cotGiua(n) {
    return '<div class="mb-3 flex items-center gap-2">'
      + '<p class="text-[11px] font-semibold uppercase tracking-wide text-[#e0c375]/90">Đội hình</p>'
      + '<button type="button" data-nlw-camp-lat role="switch" aria-checked="' + cp.lat + '"'
      + ' title="Lật đội hình theo góc nhìn trong trận (NPC bên phải)"'
      + ' class="relative ml-auto h-5 w-9 shrink-0 rounded-full transition '
      + (cp.lat ? 'bg-[#c9a24b]/70' : 'bg-white/15') + '">'
      + '<span class="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all '
      + (cp.lat ? 'left-[18px]' : 'left-0.5') + '"></span></button></div>'
      + '<p class="mb-2 text-center text-[11px] leading-tight text-white/40">'
      + (cp.lat ? 'Hiển thị như trong trận — NPC ở bên phải nhìn sang trái' : 'Đội hình gốc (chưa lật)') + '</p>'
      + '<div class="mx-auto grid max-w-[360px] grid-cols-3 gap-2.5">' + luoiDoiHinh(n.formation, 'npc:', cp.lat) + '</div>'
      + '<p class="mt-3 text-center text-xs text-white/35">Bấm vào một đơn vị để xem chi tiết →</p>';
  }


// ---- THAY `oDoiHinh` -----------------------------------------------------
  function oCapBac(v, bang) {
    var cap = bang[0];
    bang.forEach(function (x) { if (v >= x[2]) cap = x; });
    return '<span class="tabular-nums"><span class="font-semibold" style="color:' + cap[1] + '">' + cap[0] + '</span>'
      + '<span class="ml-1 text-white/80">' + v + '</span></span>';
  }

  function cotPhai() {
    var nhan = '<p class="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#e0c375]/90">Đơn vị</p>';
    if (!cp.don) return nhan + '<p class="text-xs text-white/35">Chọn một đơn vị trong đội hình.</p>';
    var o = cp.don;
    var u = tra.binh.units[o.binh];

    var binh = !u ? '<p class="text-xs text-white/40">Không tìm thấy binh chủng (id ' + esc(o.binh) + ').</p>'
      : '<button type="button" data-nlw-unit="' + esc(o.binh) + '"'
        + ' class="mb-2 flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-1.5 text-left transition hover:border-[#3b8fc9]/50 hover:bg-white/[0.06]">'
        + (u.icon ? '<span class="relative block h-12 w-12 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10">'
            + '<img alt="' + esc(u.name) + '" class="h-full w-full object-cover" src="' + anh(u.icon) + '"></span>' : '')
        + '<div class="min-w-0"><span class="text-sm font-semibold text-white">' + esc(u.name) + '</span>'
        + '<span class="ml-1.5 rounded bg-[#3b8fc9]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#7cc0ea]">' + esc(u.typeName) + '</span>'
        + '<span class="mt-0.5 block text-[10px] text-[#7cc0ea]/80">Xem chi tiết Binh Chủng →</span></div></button>'
        + ((u.descPb || u.desc) ? '<p class="mb-2 break-words text-xs leading-relaxed text-white/70">'
            + veMoTa(u.descPb || u.desc) + '</p>' : '')
        + bangChiSo(u.stats);

    var kn = !o.kn ? '' : '<div class="rounded-lg border border-[#3fa34d]/25 bg-[#3fa34d]/[0.08] p-2">'
      + '<p class="mb-0.5 text-xs font-semibold text-[#7fd08a]">' + esc(o.kn.name)
      + (o.kn.level ? ' · Cấp ' + esc(o.kn.level) : '') + '</p>'
      + (o.kn.desc ? '<p class="break-words text-xs leading-relaxed text-white/75">' + esc(o.kn.desc) + '</p>' : '')
      + '</div>';

    var hu = (o.hu || []).map(function (e) {
      var b = tra.buff[e.id];
      var mo = (b && (b.ing || b.desc)) || e.desc;
      return '<span class="relative inline-block">'
        + '<button type="button"' + (b ? ' data-nlw-chip="' + esc(e.id) + '"' : '')
        + ' class="inline-flex items-center gap-1.5 rounded-lg border border-[#c9a24b]/30 bg-[#c9a24b]/[0.10] px-2 py-1 text-xs">'
        + (e.icon ? '<span class="relative block h-4 w-4 shrink-0">'
            + '<img alt="" class="h-full w-full object-contain" src="' + anh(e.icon) + '"></span>' : '')
        + '<span class="font-medium text-[#e7d97a]'
        + (mo ? ' cursor-help decoration-dotted underline-offset-2 [text-decoration-line:underline]' : '') + '">'
        + esc((b && b.name) || e.name) + '</span>'
        + (e.detail ? '<span class="text-white/45">' + esc(e.detail) + '</span>' : '')
        + '</button></span>';
    }).join('');

    var khoiHu = !hu ? '' : '<div class="mt-2">'
      + '<p class="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/40">Hiệu ứng</p>'
      + '<div class="flex flex-wrap gap-1.5">' + hu + '</div></div>';

    return nhan + '<div class="space-y-4">'
      + '<div class="flex items-start gap-3">'
      + chanDung(o.icon || (u ? u.icon : ''), 'h-14 w-14 shrink-0 rounded-lg ring-1 ring-white/10', o.ten, '')
      + '<div class="min-w-0"><p class="break-words text-sm font-semibold text-white">' + esc(o.ten) + '</p>'
      + '<p class="text-xs text-white/40">' + esc(o.phu) + '</p></div></div>'
      + khoiCamp('Xuất chiến binh chủng', binh)
      + khoiCamp('Kỹ năng chủ động (Võ tướng)', kn + khoiHu)
      + '</div>';
  }


// ---- THÊM `bangChiSo` (tách từ `cotPhai` cũ, giữ nguyên markup đã khớp) ---
  var HIEN_XEM_LAI_TRAN = false;

  function nutXemLai(url) {
    if (!HIEN_XEM_LAI_TRAN || !url) return '';
    return '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer"'
      + ' class="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#c9a24b]/50 px-3 py-1.5'
      + ' text-xs font-medium text-[#e7d97a] transition hover:bg-[#c9a24b]/10">▷ Xem lại trận</a>';
  }

  function hangDon(k, v) {
    return '<div class="flex items-start justify-between gap-3 border-b border-white/[0.05] py-1 text-sm last:border-0">'
      + '<span class="shrink-0 text-white/45">' + k + '</span>' + v + '</div>';
  }

  function nutDonHang(k, tip, chu, mau) {
    return hangDon(k, '<span class="text-right text-white/85"><button type="button" title="' + esc(tip) + '"'
      + ' class="cursor-pointer font-medium underline decoration-dotted underline-offset-2 outline-none"'
      + ' style="color:' + mau + '">' + chu + '</button></span>');
  }

  function cotDon(don, replay) {
    var than = '<p class="text-xs text-white/35">Chọn một đơn vị trong đội hình.</p>';
    if (don) {
      var g = don.g;
      var pt = g.maxTroops ? g.troops / g.maxTroops * 100 : 0;
      var an = String(g.soulSeal || '');
      var hang = hangDon('Binh chủng', '<button type="button" data-nlw-unit="' + esc(g.soldierId) + '"'
          + ' class="cursor-pointer text-right font-medium text-[#7cc0ea] underline decoration-dotted underline-offset-2 outline-none">'
          + esc(g.soldier) + '</button>')
        + (!g.skill ? '' : nutDonHang('Kỹ năng', 'Xem chi tiết kỹ năng ' + g.skill,
            esc(g.skill) + (g.skillLevel ? ' · Cấp ' + esc(g.skillLevel) : ''), '#7cc0ea'))
        + (!an ? '' : nutDonHang('Ấn Kế Thừa', 'Xem chi tiết Ấn ' + an.replace(/ Lv\d+$/, ''), esc(an), '#c8b3f0'))
        + (!g.vkdb ? '' : nutDonHang('VKĐB', 'Xem chi tiết VKĐB ' + g.vkdb,
            esc(g.vkdb) + (g.vkdbRank ? ' · ★' + bo0((g.vkdbRank / 10).toFixed(1)) : ''), '#e7d97a'));
      than = '<div class="space-y-3"><div class="flex items-start gap-2.5">'
        + chanDung(g.icon, 'h-14 w-14 shrink-0 rounded-lg ring-1 ring-white/10', g.name, '')
        + '<div class="min-w-0"><button type="button"' + (tra.mini[g.generalId] ? ' data-nlw-hero="' + esc(g.generalId) + '"' : '')
        + ' class="inline-flex items-center gap-1 break-words text-left text-base font-semibold text-white transition hover:text-[#e7d97a]">'
        + esc(g.name) + '<span class="text-xs text-[#7cc0ea]/80" title="Xem chi tiết tướng">›</span></button>'
        + '<p class="text-[13px] text-white/45">Vị trí ' + esc(g.pos) + ' · Cấp ' + esc(g.level) + ' · #' + esc(g.generalId) + '</p>'
        + '<p class="text-[13px] text-white/45">Quân ' + lon(g.troops) + ' / ' + lon(g.maxTroops)
        + '<span class="ml-1 font-semibold text-[' + (pt >= 66 ? '#7fe0b6' : pt >= 33 ? '#e7c06f' : '#e88f8f') + ']">· '
        + bo0(pt.toFixed(2)) + '%</span></p></div></div>'
        + '<div class="space-y-0.5">' + hang + '</div></div>';
    }
    return '<div class="flex flex-col border-t border-white/10 pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0">'
      + '<div class="flex-1">' + nhanDai('Đơn vị') + than + '</div>' + nutXemLai(replay) + '</div>';
  }

  function chipBinhChung(form) {
    var ten = [];
    var dem = {};
    (form || []).forEach(function (f) {
      if (!f.soldier) return;
      if (dem[f.soldier] === undefined) { dem[f.soldier] = 0; ten.push(f.soldier); }
      dem[f.soldier]++;
    });
    return ten.sort(function (a, b) { return dem[b] - dem[a]; }).map(function (t) {
      return '<span class="rounded-md bg-[#3b8fc9]/15 px-2 py-0.5 text-[13px] text-[#7cc0ea]">'
        + esc(t) + ' ×' + dem[t] + '</span>';
    }).join('');
  }


// ---- THÊM `nhanDai` · `tabNuoc` (dùng cho cả 2 dải dưới) -----------------
  function veChienThuat() {
    var mo = !cp.ttGap;
    var phe = pheTT();
    var dau = '<button type="button" data-nlw-camp-tt-gap class="flex w-full items-center gap-2 text-left">'
      + '<h2 class="text-sm font-semibold uppercase tracking-wide text-[#e0c375]">Chiến Báo Gợi Ý</h2>'
      + (mo ? '<span class="text-xs text-white/40">' + ttTatCa().length + ' đội hình đề xuất</span>' : '')
      + '<span class="ml-auto shrink-0 text-white/40 transition-transform ' + (mo ? 'rotate-180' : '') + '">▾</span>'
      + '</button>';

    var than = tabSide(demTT(), cp.ttSide, 'data-nlw-camp-tt-side') + (!phe.length
      ? '<p class="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm leading-relaxed text-white/40">Chưa có đội hình gợi ý cho NPC này.</p>'
      : '<div><p class="mb-2 text-xs text-white/40">Đội hình gợi ý theo từng nước — chọn nước, bấm một đội để xem chi tiết.</p>'
        + tabNuoc(phe, cp.ttPhe, 'data-nlw-camp-tt-phe')
        + '<ul class="space-y-1.5">' + chienThuat().map(function (s, i) {
            return '<li class="overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">'
              + tomTatTT(s, i) + (cp.ttMo === i ? bungTT(s, i) : '') + '</li>';
          }).join('') + '</ul></div>');

    return '<div class="border-t border-white/10 bg-[#14121c] p-4 sm:p-5"><div>' + dau
      + (mo ? '<div class="mt-3">' + than + '</div>' : '') + '</div></div>';
  }
  function veChienBao() {
    var boc = '<div class="border-t border-white/10 bg-[#14121c] p-4 sm:p-5"><div>';
    if (khoCb[cp.key] === undefined) {
      return boc + '<h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-[#e0c375]">Chiến Báo Thông Quan</h2>'
        + '<p class="text-sm text-white/40">Đang tải chiến báo…</p></div></div>';
    }
    var mo = !cp.cbGap;
    var phe = pheCB();
    var tong = 0;
    phe.forEach(function (p) { tong += demCB(p); });
    // bản gốc chỉ kèm ngày chụp khi NPC này thật sự có chiến báo
    var chup = tong ? ((khoCb[cp.key] || {})[cp.cbSide] || {}).capturedAt : '';

    var dau = '<button type="button" data-nlw-camp-cb-gap class="mb-3 flex w-full flex-wrap items-center gap-2 text-left">'
      + '<h2 class="text-sm font-semibold uppercase tracking-wide text-[#e0c375]">Chiến Báo Thông Quan</h2>'
      + (mo && tong ? '<span class="text-xs text-white/40">' + tong + ' chiến báo</span>' : '')
      + (mo && chup ? '<span class="text-xs text-white/25">· ' + esc(chup.slice(0, 10)) + '</span>' : '')
      + '<span class="ml-auto shrink-0 text-white/40 transition-transform ' + (mo ? 'rotate-180' : '') + '">▾</span>'
      + '</button>';

    var ds = chienBao();
    var than = tabSide(demCbSide(), cp.cbSide, 'data-nlw-camp-cb-side') + (!phe.length
      ? '<p class="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm leading-relaxed text-white/40">Chưa có chiến báo cho NPC này.</p>'
      : '<p class="mb-2 text-xs text-white/40">Bấm một chiến báo để xem đội hình phá đảo.</p>'
        + tabNuoc(phe.map(function (p) { return { phe: p, n: demCB(p) }; }), cp.cbPhe, 'data-nlw-camp-cb-phe')
        + (!ds.length ? '<p class="px-1 py-1 text-sm text-white/35">Nước này chưa thông quan.</p>'
          : '<ul class="space-y-1.5">' + ds.map(function (r, i) {
              return '<li class="overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">'
                + tomTatCB(r, i) + (cp.cbMo === i ? bungCB(r, i) : '') + '</li>';
            }).join('') + '</ul>'));

    return boc + dau + (mo ? than : '') + '</div></div>';
  }
  function loiCamp(t) {
    return '<p class="py-10 text-center text-sm text-white/45">' + esc(t) + '</p>';
  }

  function urlCamp(them) {
    if (!cp) return location.pathname;
    var q = 'map=' + encodeURIComponent(cp.key);
    if (cp.ident) q += '&ai=' + encodeURIComponent(cp.ident);
    if (cp.side) q += '&side=' + cp.side;
    return location.pathname + '?' + q + (them ? '&' + them : '');
  }

  function diCamp(q) {
    history.pushState(null, '', location.pathname + '?' + q);
    window.scrollTo(0, 0);
    boot();
  }

  function clickCamp(e) {
    if (!oCamp || !cp) return false;
    var nAi = e.target.closest('[data-nlw-camp-ai]');
    if (nAi) {
      diCamp('map=' + encodeURIComponent(cp.key) + '&ai=' + encodeURIComponent(nAi.getAttribute('data-nlw-camp-ai'))
        + '&side=' + cp.side);
      return true;
    }
    var nMap = e.target.closest('[data-nlw-camp-map]');
    if (nMap) {
      diCamp('map=' + encodeURIComponent(nMap.getAttribute('data-nlw-camp-map'))
        + '&npc=' + encodeURIComponent(cp.ident) + '&side=' + cp.side);
      return true;
    }
    var nTrang = e.target.closest('[data-nlw-camp-trang]');
    if (nTrang) { cp.trang += Number(nTrang.getAttribute('data-nlw-camp-trang')); veMap(); return true; }
    var nSide = e.target.closest('[data-nlw-camp-side]');
    if (nSide) {
      cp.side = nSide.getAttribute('data-nlw-camp-side');
      history.replaceState(null, '', urlCamp(''));
      chonMacDinh();
      chonPheCb();
      veAi();
      return true;
    }
    if (e.target.closest('[data-nlw-camp-lat]')) { cp.lat = !cp.lat; veAi(); return true; }
    var nO = e.target.closest('[data-nlw-camp-o]');
    if (nO) {
      var maO = nO.getAttribute('data-nlw-camp-o');
      var donMoi = donTuO(maO);
      if (maO.indexOf('tt:') === 0) cp.donTT = donMoi;
      else if (maO.indexOf('cb:') === 0) cp.donCB = donMoi;
      else cp.don = donMoi;
      veAi(); return true;
    }
    if (e.target.closest('[data-nlw-camp-tt-gap]')) { cp.ttGap = !cp.ttGap; veAi(); return true; }
    if (e.target.closest('[data-nlw-camp-cb-gap]')) { cp.cbGap = !cp.cbGap; veAi(); return true; }
    var nTtPhe = e.target.closest('[data-nlw-camp-tt-phe]');
    var nTtSide = e.target.closest('[data-nlw-camp-tt-side]');
    if (nTtSide) { cp.ttSide = nTtSide.getAttribute('data-nlw-camp-tt-side'); chonMacDinh(); veAi(); return true; }
    if (nTtPhe) { cp.ttPhe = nTtPhe.getAttribute('data-nlw-camp-tt-phe'); cp.ttMo = -1; veAi(); return true; }
    var nTt = e.target.closest('[data-nlw-camp-tt]');
    if (nTt) {
      var i = Number(nTt.getAttribute('data-nlw-camp-tt'));
      cp.ttMo = cp.ttMo === i ? -1 : i;
      cp.donTT = cp.ttMo < 0 ? null : donTuO('tt:' + i + ':0');
      veAi(); return true;
    }
    var nCbPhe = e.target.closest('[data-nlw-camp-cb-phe]');
    var nCbSide = e.target.closest('[data-nlw-camp-cb-side]');
    if (nCbSide) { cp.cbSide = nCbSide.getAttribute('data-nlw-camp-cb-side'); chonPheCb(); veAi(); return true; }
    if (nCbPhe) { cp.cbPhe = nCbPhe.getAttribute('data-nlw-camp-cb-phe'); cp.cbMo = -1; veAi(); return true; }
    var nCb = e.target.closest('[data-nlw-camp-cb]');
    if (nCb) {
      var j = Number(nCb.getAttribute('data-nlw-camp-cb'));
      cp.cbMo = cp.cbMo === j ? -1 : j;
      cp.donCB = cp.cbMo < 0 ? null : donTuO('cb:' + j + ':0');
      veAi(); return true;
    }
    return false;
  }


// ==========================================================================
// GHI CHÚ BÀN GIAO
// · `veChienThuat` kéo theo 2 hàm mới `tomTatTT` / `bungTT`;
//   `veChienBao` kéo theo `tomTatCB` / `bungCB`. Đặt cạnh hàm cha.
// · `cp.ttGap` / `cp.cbGap` không cần khởi tạo trong `veCampAi`:
//   undefined = dải đang bung, đúng mặc định bản gốc.
// · Thanh VN / CN của 2 dải dưới độc lập với tab side ở header: luôn mở VN,
//   CN luôn khoá 🔒 — sao y bản gốc (bên đó CN nằm sau cổng trả phí).
// ==========================================================================
  function boot() {
    if (!oCamp) return;
    var qs = new URLSearchParams(location.search);
    var key = qs.get('map');
    if (!key) {
      oCamp.innerHTML = '<p class="py-10 text-center text-sm text-white/45">Chưa chọn bản đồ. '
        + '<a class="text-[#e7d97a] underline" href="' + LINK_DS_PHO_BAN + '">Về danh sách Phó Bản</a></p>';
      return;
    }
    oCamp.innerHTML = loiCamp('Đang tải…');
    var ai = qs.get('ai');
    if (ai) veCampAi(key, ai);
    else veCampMap(key);
  }

  if (oCamp) {
    window.addEventListener('popstate', boot);
    boot();
  }

  function chipChu(ds, ai) {
    var lop = ai ? 'border-[#c9484f]/25 bg-[#c9484f]/10 text-[#ea9098]'
                 : 'border-white/10 bg-white/[0.03] text-white/85';
    return (ds || []).map(function (t) {
      return '<span class="rounded-lg border ' + lop + ' px-2 py-1 text-xs">' + esc(t) + '</span>';
    }).join('');
  }


// ---- THAY `giaHonThu` ----------------------------------------------------
// Bản gốc: |v| ≤ 1 thì làm tròn thành %, còn lại in số en-US.

  function bangChiSo(ct) {
    return '<div class="overflow-hidden rounded-lg border border-white/10"><table class="w-full text-xs">'
      + '<thead class="bg-white/[0.04] text-white/45"><tr>'
      + '<th class="px-2 py-1 text-left font-medium"> </th><th class="px-2 py-1 text-right font-medium">Công</th>'
      + '<th class="px-2 py-1 text-right font-medium">Thủ</th></tr></thead><tbody class="text-white/80">'
      + [['Vật', 'leaderAtk', 'leaderDef'], ['Chiến', 'strengthAtk', 'strengthDef'], ['Mưu', 'intellectAtk', 'intellectDef']]
        .map(function (x) {
          return '<tr class="border-t border-white/[0.06]"><td class="px-2 py-1 text-left text-white/55">' + x[0] + '</td>'
            + '<td class="px-2 py-1 text-right">' + oCapBac(ct[x[1]], CAP_CONG) + '</td>'
            + '<td class="px-2 py-1 text-right">' + oCapBac(ct[x[2]], CAP_THU) + '</td></tr>';
        }).join('') + '</tbody></table></div>'
      + '<div class="mt-1.5 flex gap-1.5">'
      + '<span class="rounded border border-white/10 bg-white/[0.03] px-2 py-0.5 text-xs text-white/70">Bạo kích '
      + Math.round(100 * ct.critical) + '%</span>'
      + '<span class="rounded border border-white/10 bg-white/[0.03] px-2 py-0.5 text-xs text-white/70">Phản kích '
      + Math.round(100 * ct.strikeBack) + '%</span></div>';
  }


// ---- THÊM `ttTatCa` · THAY `pheTT` --------------------------------------
// Bản gốc xếp nước theo thứ tự cố định Thục · Ngô · Ngụy · Quần, không theo
// thứ tự gặp trong dữ liệu — chọn sai nước mặc định là lệch cả danh sách.

  function demTT() {
    var kho = (khoCamp[cp.key].strategies || {})[cp.ident] || {};
    return { vn: (kho.vn || []).length, cn: (kho.cn || []).length };
  }

  function demCbSide() {
    var d = {};
    SIDE_CB.forEach(function (s) {
      var g = cbCuaNpc(cp.key, s, cp.ident);
      var n = 0;
      if (g) PHE_CB.forEach(function (p) { n += Math.min((g[p] || []).length, CB_MOI_PHE); });
      d[s] = n;
    });
    return d;
  }

  function ttTatCa() {
    return ((khoCamp[cp.key].strategies || {})[cp.ident] || {})[cp.ttSide] || [];
  }

  function demCB(p) {
    var g = cbCuaNpc(cp.key, cp.cbSide, cp.ident);
    return Math.min(((g && g[p]) || []).length, CB_MOI_PHE);
  }


// ---- THAY `chipBinhChung` ------------------------------------------------

  function nhanDai(t) {
    return '<p class="mb-1.5 text-[13px] font-semibold uppercase tracking-wide text-[#e0c375]/70">' + esc(t) + '</p>';
  }

  var MAU_NUOC = { 'Thục': '#3fa34d', 'Ngô': '#c0432c', 'Ngụy': '#3b8fc9', 'Quần': '#9b7fd6' };

  function tabSide(dem, dang, thuoc) {
    return '<div class="mb-3 inline-flex overflow-hidden rounded-lg border border-white/15">'
      + SIDE_CB.map(function (s) {
          var n = dem[s];
          var nhan = s === 'vn' ? 'VN' : 'CN';
          if (s === 'cn') return '<button type="button" class="inline-flex items-center px-3 py-1 text-xs font-semibold transition text-white/55 hover:bg-white/10">'
            + nhan + ' \uD83D\uDD12</button>';
          return '<button type="button" ' + thuoc + '="' + s + '"'
            + ' class="inline-flex items-center px-3 py-1 text-xs font-semibold transition '
            + (s === dang ? 'bg-[#4bbf8a]/25 text-[#7fe0b6]' : 'text-white/55 hover:bg-white/10') + '">' + nhan
            + (n ? '<span class="ml-1 rounded bg-black/25 px-1 text-[10px] font-bold tabular-nums opacity-80">' + n + '</span>' : '')
            + '</button>';
        }).join('') + '</div>';
  }

  function tabNuoc(ds, dang, thuoc) {
    return '<div class="mb-2 flex flex-wrap gap-1.5">' + ds.map(function (x) {
      var m = MAU_NUOC[x.phe] || '#6b7280';
      var bat = x.phe === dang;
      return '<button type="button" ' + thuoc + '="' + esc(x.phe) + '"'
        + ' class="rounded-md px-2.5 py-1 text-xs font-medium transition hover:bg-white/10"'
        + ' style="color:' + (bat ? m : 'rgba(255,255,255,0.55)')
        + ';background:' + (bat ? m + '22' : 'rgba(255,255,255,0.04)') + '">'
        + esc(x.phe) + ' <span class="opacity-50">' + x.n + '</span></button>';
    }).join('') + '</div>';
  }


// ---- THAY `veChienThuat` -------------------------------------------------

  function tomTatTT(s, i) {
    return '<button type="button" data-nlw-camp-tt="' + i + '"'
      + ' class="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-white/80 transition hover:bg-white/[0.05]">'
      + '<span class="w-4 shrink-0 text-right tabular-nums text-xs text-white/30">' + (i + 1) + '</span>'
      + '<span class="min-w-0 flex-1 truncate font-medium text-white/90">Đội hình ' + (i + 1)
      + (s.isPrimary ? '<span class="ml-1.5 rounded bg-[#c9a24b]/25 px-1 py-0.5 text-[10px] font-bold text-[#e7d97a]">CHÍNH</span>' : '')
      + '</span>'
      + (s.grade ? '<span title="Đánh giá trận" class="shrink-0 rounded bg-[#9b7fd6]/20 px-1.5 py-0.5 text-xs font-bold text-[#c8b3f0]">' + esc(s.grade) + '</span>' : '')
      + (s.power ? '<span title="Lực chiến" class="shrink-0 rounded bg-[#c9a24b]/15 px-1.5 py-0.5 tabular-nums text-[13px] font-semibold text-[#e7d97a]">' + lon(s.power) + '</span>' : '')
      + '<span class="shrink-0 text-white/40 transition-transform ' + (cp.ttMo === i ? 'rotate-180' : '') + '">▾</span></button>';
  }

  function bungTT(s, i) {
    var sat = (s.killOrder || []).map(function (k, j) {
      return '<span class="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-white/80">'
        + '<span class="text-white/40">' + (j + 1) + '.</span> ' + esc(k.name)
        + ' <span class="text-white/45">~L' + esc(k.round) + '</span></span>';
    }).join('');

    return '<div class="border-t border-white/10 bg-black/20 p-3">'
      + '<div class="grid gap-y-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-x-0">'
      + '<div class="md:pr-5">' + nhanDai('Thông tin đội') + '<div class="mb-3">'
      + (s.grade ? hangTT('Đánh giá', esc(s.grade)) : '')
      + (s.rounds == null ? '' : hangTT('Số hiệp', esc(s.rounds)))
      + (s.power ? hangTT('Lực chiến', lon(s.power)) : '')
      + hangTT('Số tướng', (s.formation || []).length) + '</div>'
      + nhanDai('Binh chủng') + '<div class="flex flex-wrap gap-1.5">' + chipBinhChung(s.formation) + '</div></div>'
      + '<div class="flex items-start justify-center border-t border-white/10 pt-4 md:border-l md:border-t-0 md:px-5 md:pt-0">'
      + '<div class="grid grid-cols-3 content-start gap-2 self-start" style="width:330px">'
      + luoiDoiHinh(s.formation, 'tt:' + i + ':', false) + '</div></div>'
      + cotDon(cp.donTT, s.replay) + '</div>'
      + (sat ? '<div class="mt-4 border-t border-white/10 pt-3">' + nhanDai('Thứ tự hạ NPC')
        + '<div class="flex flex-wrap gap-1.5">' + sat + '</div></div>' : '')
      + '</div>';
  }


// ---- THAY `veChienBao` ---------------------------------------------------

  function tomTatCB(r, i) {
    var meta = r.meta || {};
    var cum2 = r.cluster === '2';
    return '<button type="button" data-nlw-camp-cb="' + i + '"'
      + ' class="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-white/80 transition hover:bg-white/[0.05]">'
      + '<span class="w-4 shrink-0 text-right tabular-nums text-xs text-white/30">' + (i + 1) + '</span>'
      + '<span class="min-w-0 flex-1 truncate font-medium text-white/90">' + esc(r.name) + '</span>'
      + (r.cluster ? '<span title="Cụm máy chủ (nhóm liên server) của chiến báo" class="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold"'
          + ' style="background:' + (cum2 ? '#ff8f6b22' : '#5ac8fa22') + ';color:' + (cum2 ? '#ffb59b' : '#9bd7ff') + '">'
          + 'Cụm ' + esc(r.cluster) + '</span>' : '')
      + (meta.gradeLabel ? '<span title="Đánh giá trận" class="shrink-0 rounded bg-[#9b7fd6]/20 px-1.5 py-0.5 text-xs font-bold text-[#c8b3f0]">' + esc(meta.gradeLabel) + '</span>' : '')
      + (r.power ? '<span title="Lực chiến đội hình phá đảo" class="shrink-0 rounded bg-[#c9a24b]/15 px-1.5 py-0.5 tabular-nums text-[13px] font-semibold text-[#e7d97a]">' + lon(r.power) + '</span>' : '')
      + (r.level ? '<span class="shrink-0 tabular-nums text-xs text-white/45">Lv' + esc(r.level) + '</span>'
          : (r.server ? '<span title="Chiến báo từ máy chủ khác" class="max-w-[92px] shrink-0 truncate rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-white/45">' + esc(r.server) + '</span>' : ''))
      + '<span class="shrink-0 text-white/40 transition-transform ' + (cp.cbMo === i ? 'rotate-180' : '') + '">▾</span></button>';
  }

  function bungCB(r, i) {
    var meta = r.meta || {};
    var ketQua = [meta.resultLabel, meta.gradeLabel].filter(Boolean).join(' · ');
    var sach = (meta.books || []).map(function (b) {
      return '<span class="inline-flex items-center gap-1 rounded-md bg-[#c9a24b]/15 py-0.5 pl-1 pr-2 text-[13px] text-[#e7d97a]">'
        + esc(b.name) + ' <span class="opacity-70">' + (b.star ? esc(b.star) + '★ ' : '') + 'Lv' + esc(b.level) + '</span></span>';
    }).join('');

    return '<div class="border-t border-white/10 bg-black/20 p-3">'
      + '<div class="mb-3 flex items-center gap-2">'
      + '<span class="text-sm font-semibold uppercase tracking-wide text-[#e0c375]/70">Đội hình phá đảo</span>'
      + '<span class="ml-auto flex items-center gap-1.5">'
      + '<button type="button" title="Tán thưởng đội hình" class="inline-flex items-center gap-1 rounded-full border border-rose-400/40'
      + ' px-2.5 py-1 text-[12px] font-semibold text-rose-200 transition hover:bg-rose-500/10 active:scale-95">❤️ Tán Thưởng</button>'
      + '<button type="button" title="Chê bai đội hình" class="inline-flex items-center gap-1 rounded-full border border-sky-400/40'
      + ' px-2.5 py-1 text-[12px] font-semibold text-sky-200 transition hover:bg-sky-500/10 active:scale-95">💔 Chê Bai</button></span></div>'
      + '<div class="grid gap-y-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-x-0">'
      + '<div class="md:pr-5">' + nhanDai('Thông tin đội') + '<div class="mb-3">'
      + hangTT('Chủ đội', esc(r.name))
      + (r.server ? hangTT('Máy chủ', esc(r.server)) : '')
      + (r.power ? hangTT('Lực chiến', lon(r.power)) : '')
      + (r.level ? hangTT('Cấp', esc(r.level)) : '')
      + (meta.roundCount ? hangTT('Số hiệp', esc(meta.roundCount)) : '')
      + hangTT('Số tướng', (r.formation || []).length)
      + (ketQua ? hangTT('Kết quả', esc(ketQua)) : '')
      + (meta.formation ? hangTT('Trận', esc(meta.formation)) : '')
      + (meta.masterSkill ? hangTT('Chúa Công - Sách Lược', esc(meta.masterSkill)) : '') + '</div>'
      + (sach ? nhanDai('Binh Thư') + '<div class="mb-3 flex flex-wrap gap-1.5">' + sach + '</div>' : '')
      + nhanDai('Binh chủng') + '<div class="flex flex-wrap gap-1.5">' + chipBinhChung(r.formation) + '</div></div>'
      + '<div class="flex items-start justify-center border-t border-white/10 pt-4 md:border-l md:border-t-0 md:px-5 md:pt-0">'
      + '<div class="grid grid-cols-3 content-start gap-2 self-start" style="width:330px">'
      + luoiDoiHinh(r.formation, 'cb:' + i + ':', false) + '</div></div>'
      + cotDon(cp.donCB, r.replay) + '</div>' + chanTran(meta) + '</div>';
  }

  function chanTran(meta) {
    var lg = meta.leftGenerals || {};
    function song(ds) {
      return (ds || []).length + ' tướng · '
        + lon((ds || []).reduce(function (t, x) { return t + (x.leftSoldierNum || 0); }, 0)) + ' quân';
    }
    var hang = (lg.atk ? hangTT('Sống sót (đội bạn)', song(lg.atk)) : '')
      + (lg.def ? hangTT('Sống sót (đối thủ)', song(lg.def)) : '')
      + ((meta.rewards || []).length ? hangTT('Phần thưởng', meta.rewards.length + ' mục') : '');
    return !hang ? '' : '<div class="mt-4 border-t border-white/10 pt-3">'
      + '<div class="flex flex-wrap gap-x-6">' + hang + '</div></div>';
  }


// ---- THAY `veAi` ---------------------------------------------------------
// Đổi: nút quay lại inline-flex, cụm NPC trước/sau dồn phải bằng ml-auto,
// tab phe theo màu bản gốc (VN xanh / CN vàng), nhãn loại bỏ shrink-0.
  var lopChip = null;
  function moChip(id) {
    return taiTra().then(function () {
      var b = tra.buff[id];
      if (!b) return;
      var c = mauBuff(b);
      if (!lopChip) {
        lopChip = document.createElement('div');
        lopChip.className = 'fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm';
        document.body.appendChild(lopChip);
      }
      lopChip.innerHTML = '<div class="animate-card relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#141118] p-5 shadow-2xl">'
        + '<div class="flex items-center gap-3">'
        + '<span class="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-white/15 bg-black/30">'
        + (b.icon ? '<img alt="' + esc(b.name) + '" class="h-full w-full object-cover" src="' + anh(b.icon) + '">' : '')
        + '</span><div class="min-w-0"><h3 class="text-lg font-bold leading-tight text-white">' + esc(b.name) + '</h3>'
        + '<span class="text-xs font-semibold" style="color:' + c + '">'
        + (b.und ? 'Trung Lập' : b.type === 'buff' ? 'Có lợi' : 'Bất lợi') + '</span></div></div>'
        + '<p class="mt-3 text-sm leading-6 text-white/85">' + esc(b.desc) + '</p>'
        + '<button type="button" aria-label="Close" data-nlw-dong-chip class="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white/70 hover:bg-black/70 hover:text-white">✕</button>'
        + '</div>';
    });
  }

  function dongChip() {
    if (!lopChip) return;
    lopChip.remove();
    lopChip = null;
  }

  var lopBuff = null;
  function moBuff(id) {
    return taiTra().then(function () {
      if (!tra.trang[id]) return;
      if (!lopBuff) {
        lopBuff = document.createElement('div');
        lopBuff.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md';
        lopBuff.setAttribute('role', 'dialog');
        lopBuff.setAttribute('aria-modal', 'true');
        document.body.appendChild(lopBuff);
      }
      veBuff(id);
    });
  }

  function dongBuff() {
    if (!lopBuff) return;
    lopBuff.remove();
    lopBuff = null;
    history.replaceState(null, '', location.pathname);
  }

  document.addEventListener('click', function (e) {
    var nc = e.target.closest('[data-nlw-chip]');
    if (nc) { e.preventDefault(); e.stopPropagation(); return moChip(nc.getAttribute('data-nlw-chip')); }
    if (lopChip && (e.target === lopChip || e.target.closest('[data-nlw-dong-chip]'))) return dongChip();
    var ncc = e.target.closest('[data-nlw-advtech]');
    if (ncc) { e.preventDefault(); e.stopPropagation(); return moCaoCap(ncc.getAttribute('data-nlw-advtech')); }
    if (lopCc && (e.target === lopCc || e.target.closest('[data-nlw-dong-cc]'))) return dongCaoCap();
    var nqa = e.target.closest('[data-nlw-qan]');
    if (nqa) { e.preventDefault(); e.stopPropagation(); return moQuanAn(nqa.getAttribute('data-nlw-qan')); }
    if (lopQa && (e.target === lopQa || e.target.closest('[data-nlw-dong-qa]'))) return dongQuanAn();
    var nts = e.target.closest('[data-nlw-elite]');
    if (nts) { e.preventDefault(); e.stopPropagation(); return moTinhAnh(nts.getAttribute('data-nlw-elite')); }
    if (lopTs && e.target === lopTs) return dongTinhAnh();
    var nhinh = e.target.closest('[data-nlw-ts-hinh]');
    if (nhinh && veLai) { ui.hinh = Number(nhinh.getAttribute('data-nlw-ts-hinh')); return veLai(); }
    var nhe = e.target.closest('[data-nlw-ts-he]');
    if (nhe && veLai) { ui.he = nhe.getAttribute('data-nlw-ts-he'); return veLai(); }
    var nkv = e.target.closest('[data-nlw-etch]');
    if (nkv) { e.preventDefault(); e.stopPropagation(); return moKhacVan(nkv.getAttribute('data-nlw-etch')); }
    if (lopKv && (e.target === lopKv || e.target.closest('[data-nlw-dong-kv]'))) return dongKhacVan();
    var ncn = e.target.closest('[data-nlw-horse]');
    if (ncn) { e.preventDefault(); e.stopPropagation(); return moChuongNgua(ncn.getAttribute('data-nlw-horse')); }
    if (lopCn && (e.target === lopCn || e.target.closest('[data-nlw-dong-cn]'))) return dongChuongNgua();
    var nchip = e.target.closest('[data-nlw-qt-chip]');
    if (nchip) { e.preventDefault(); e.stopPropagation();
      return moQuyTuChip(nchip.getAttribute('data-nlw-qt-chip'), nchip.getAttribute('data-nlw-qt-he')); }
    var nnat = e.target.closest('[data-nlw-qt-nation]');
    if (nnat) { e.preventDefault(); theLucQt = nnat.getAttribute('data-nlw-qt-nation'); return veKhoQuyTu(); }
    if (lopQtChip && (e.target === lopQtChip || e.target.closest('[data-nlw-dong-qt-chip]'))) return dongQuyTuChip();
    var nqt = e.target.closest('[data-nlw-skill]');
    if (nqt) { e.preventDefault(); e.stopPropagation(); return moQuyTu(nqt.getAttribute('data-nlw-skill')); }
    if (lopQt && e.target === lopQt) return dongQuyTu();
    var nbt = e.target.closest('[data-nlw-book]');
    if (nbt) { e.preventDefault(); e.stopPropagation(); return moBinhThu(nbt.getAttribute('data-nlw-book')); }
    if (lopBt && (e.target === lopBt || e.target.closest('[data-nlw-dong-bt]'))) return dongBinhThu();
    var nv = e.target.closest('[data-nlw-item]');
    if (nv) { e.preventDefault(); e.stopPropagation(); return moVatPham(nv.getAttribute('data-nlw-item')); }
    if (lopVp && (e.target === lopVp || e.target.closest('[data-nlw-dong-vp]'))) return dongVatPham();
    var nw = e.target.closest('[data-nlw-beauty]');
    if (nw) { e.preventDefault(); e.stopPropagation(); return moTriKy(nw.getAttribute('data-nlw-beauty')); }
    if (lopTk && e.target === lopTk) return dongTriKy();
    var nu = e.target.closest('[data-nlw-unit]');
    if (nu) { e.preventDefault(); e.stopPropagation(); return moBinh(nu.getAttribute('data-nlw-unit')); }
    if (lopBinh && (e.target === lopBinh || e.target.closest('[data-nlw-dong-binh]'))) return dongBinh();
    var na = e.target.closest('[data-nlw-an]');
    if (na) { e.preventDefault(); e.stopPropagation(); return moAn(na.getAttribute('data-nlw-an')); }
    if (lopAn && (e.target === lopAn || e.target.closest('[data-nlw-dong-an]'))) return dongAn();
    var nb = e.target.closest('[data-nlw-buff]');
    if (nb) { e.preventDefault(); e.stopPropagation(); return moBuff(nb.getAttribute('data-nlw-buff')); }
    if (!lopBuff) return;
    if (e.target === lopBuff || e.target.closest('[data-nlw-dong-buff]')) return dongBuff();
  }, true);

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (lopXem) return dongXemKyNang();
    if (lopChip) return dongChip();
    if (lopAn) return dongAn();
    if (lopBinh) return dongBinh();
    if (lopTk) return dongTriKy();
    if (lopVp) return dongVatPham();
    if (lopBt) return dongBinhThu();
    if (lopQtChip) return dongQuyTuChip();
    if (lopQt) return dongQuyTu();
    if (lopKv) return dongKhacVan();
    if (lopCc) return dongCaoCap();
    if (lopQa) return dongQuanAn();
    if (lopTs) return dongTinhAnh();
    if (lopCn) return dongChuongNgua();
    if (lopBuff) dongBuff();
  });

  // trang chép tay không mang id nên gắn hook theo tên hiện trên thẻ
  function ganTheoTen(boc, url, lay, thuoc) {
    taiTra().then(function () { return tai(BASE + url); }).then(function (d) {
      var theoTen = lay(d);
      [].forEach.call(boc.querySelectorAll('button'), function (b) {
        var k = theoTen[b.innerText.split('\n')[0].trim()];
        if (k) b.setAttribute(thuoc, k);
      });
    });
  }

  var trangTinh = document.querySelector('[data-nlw-tinh]');
  var loaiTinh = trangTinh ? trangTinh.getAttribute('data-nlw-tinh') : '';
  if (loaiTinh === 'horse') {
    ganTheoTen(trangTinh, 'data/horse-detail.json', function (d) {
      var m = {}; d.horses.forEach(function (h) { m[h.name] = h.key; }); return m;
    }, 'data-nlw-horse');
  } else if (loaiTinh.indexOf('quytu:') === 0) {
    dungKhoQuyTu(loaiTinh.split(':')[1]);
  } else if (loaiTinh === 'advtech') {
    ganTheoTen(trangTinh, 'data/advtech-detail.json', function (d) {
      var m = {}; (d.tech || []).forEach(function (t) { m[t.name] = t.key; }); return m;
    }, 'data-nlw-advtech');
  } else if (loaiTinh === 'elite') {
    ganTheoTen(trangTinh, 'data/elite-detail.json', function (d) {
      var m = {}; (d.forces || []).forEach(function (f) { m[f.name] = f.id; }); return m;
    }, 'data-nlw-elite');
  }

  var qts = new URLSearchParams(location.search).get('elite');
  if (qts) moTinhAnh(qts);

  var qh = new URLSearchParams(location.search).get('horse');
  if (qh) moChuongNgua(qh);

  var qsk = new URLSearchParams(location.search).get('skill');
  if (qsk && document.querySelector('[data-nlw-skill],[data-nlw-tinh^="quytu"]')) moQuyTu(qsk);

  var qs = new URLSearchParams(location.search);
  var qv = qs.get('item') || qs.get('equipment') || qs.get('banner');
  if (qv && document.querySelector('[data-nlw-kho]')) moVatPham(qv);

  var qw = new URLSearchParams(location.search).get('beauty');
  if (qw) moTriKy(qw);

  var qu = new URLSearchParams(location.search).get('unit');
  if (qu) moBinh(qu);

  var qa = new URLSearchParams(location.search).get('seal');
  if (qa) moAn(qa);

  var qb = new URLSearchParams(location.search).get('buff');
  if (qb) moBuff(qb);

  var q0 = new URLSearchParams(location.search).get('hero');
  if (q0) {
    var the0 = document.querySelector('[data-nlw-hero="' + q0 + '"]');
    mo(q0, the0);
  }
})();

// Vo Khoi Thap: hang nut tru doi khoi, accordion do kho bung nhieu cai cung luc.
(function () {
  var nutTru = [].slice.call(document.querySelectorAll('[data-nlw-tru]'));
  if (!nutTru.length) return;
  var BAT = 'border-[#e0c375]/60 bg-[#e0c375]/15'.split(' ');
  var TAT = 'border-white/10 bg-white/[0.02] hover:bg-white/[0.06]'.split(' ');

  nutTru.forEach(function (nut) {
    nut.addEventListener('click', function () {
      nutTru.forEach(function (n) {
        var chon = n === nut;
        n.classList.remove.apply(n.classList, chon ? TAT : BAT);
        n.classList.add.apply(n.classList, chon ? BAT : TAT);
        n.firstElementChild.classList.toggle('text-[#e7d97a]', chon);
        n.firstElementChild.classList.toggle('text-white/85', !chon);
        document.querySelector('[data-nlw-tru-khoi="' + n.dataset.nlwTru + '"]')
          .classList.toggle('hidden', !chon);
      });
    });
  });

  [].forEach.call(document.querySelectorAll('[data-nlw-dokho]'), function (nut) {
    nut.addEventListener('click', function () {
      var than = nut.nextElementSibling;
      var mo = than.classList.toggle('hidden');
      nut.firstElementChild.classList.toggle('rotate-90', !mo);
      nut.querySelector('[data-nlw-dem]').classList.toggle('hidden', !mo);
    });
  });
})();

// Tương tác 7 trang Sự Kiện: accordion dùng chung, khối BIẾN ĐỘNG, máy tính Thuyền Cỏ, trang So Giá.
// Mọi khối bung đã dựng sẵn trong HTML và ẩn bằng .hidden — ở đây chỉ bật/tắt + tính lại số.
(function () {
  var MOI_TRANG = 12;

  function ds(goc, chon) {
    return [].slice.call((goc || document).querySelectorAll(chon));
  }

  function so(n) {
    return Number(n).toLocaleString('vi-VN');
  }

  // Hợp đồng hook: [data-nlw-sk-bung] lật [data-nlw-sk-than] trong cùng [data-nlw-sk-khoi]
  document.addEventListener('click', function (e) {
    var nut = e.target.closest && e.target.closest('[data-nlw-sk-bung]');
    if (!nut) return;
    var than = nut.closest('[data-nlw-sk-khoi]').querySelector('[data-nlw-sk-than]');
    var dangGap = than.classList.toggle('hidden');
    nut.querySelector('[class*="transition-transform"]')
      .classList.toggle('rotate-' + nut.getAttribute('data-nlw-sk-bung'), !dangGap);
  });

  ds(document, '[data-nlw-bd-loc]').forEach(function (loc) {
    loc.addEventListener('change', function () {
      var than = loc.closest('[data-nlw-sk-than]');
      than.querySelector('[data-nlw-bd-tap="doi"]').classList.toggle('hidden', !loc.checked);
      than.querySelector('[data-nlw-bd-tap="het"]').classList.toggle('hidden', loc.checked);
    });
  });

  function soiDuong(than, khoa) {
    ds(than, '[data-nlw-bd-duong]').forEach(function (g) {
      var dangSoi = g.getAttribute('data-nlw-bd-duong') === khoa;
      g.setAttribute('opacity', !khoa || dangSoi ? 1 : 0.15);
      var duong = g.querySelector('polyline');
      if (duong) duong.setAttribute('stroke-width', dangSoi ? 2.5 : 1.8);
      ds(g, 'circle').forEach(function (c) { c.setAttribute('r', dangSoi ? 3.5 : 2.5); });
    });
    ds(than, '[data-nlw-bd-dong]').forEach(function (d) {
      d.classList.toggle('bg-white/10', d.getAttribute('data-nlw-bd-dong') === khoa);
    });
  }

  ['mouseover', 'mouseout'].forEach(function (loai) {
    document.addEventListener(loai, function (e) {
      if (!e.target.closest) return;
      var o = e.target.closest('[data-nlw-bd-duong],[data-nlw-bd-dong]');
      if (!o) return;
      var khoa = o.getAttribute('data-nlw-bd-duong') || o.getAttribute('data-nlw-bd-dong');
      soiDuong(o.closest('[data-nlw-sk-than]'), loai === 'mouseover' ? khoa : null);
    });
  });

  // Công thức lấy nguyên module 81229 bản gốc — sửa là lệch số so với trang gốc
  var PR = { freePerDay: 3, autoCost: 5, buyBase: 10, buyStep: 5, buyCap: 30, thanToan: 2 };
  var CACH = { save: 'Tiết kiệm nhất', bal: 'Cân bằng', fast: 'Tốn Kém' };

  function giaMuaNgay(n) {
    var t = 0;
    for (var i = 0; i < n; i++) t += Math.min(PR.buyBase + PR.buyStep * i, PR.buyCap);
    return t;
  }

  function raiMua(tong, ngay) {
    if (tong <= 0 || ngay <= 0) return 0;
    var q = Math.floor(tong / ngay), r = tong % ngay;
    return r * giaMuaNgay(q + 1) + (ngay - r) * giaMuaNgay(q);
  }

  // thuyền tự lên cấp theo exp tích luỹ; trần cứng 500.000 lượt như bản gốc
  function moPhong(can, capDau, boat, nhan) {
    if (!boat.length || can <= 0) return { luot: 0, cap: capDau };
    var merit = 0, exp = 0, v = 0, lv = Math.max(1, Math.min(capDau, boat.length));
    while (merit < can && v < 500000) {
      merit += boat[lv - 1].merit * nhan;
      exp += boat[lv - 1].expPer;
      v++;
      while (lv < boat.length && exp >= boat[lv].exp) lv++;
    }
    return { luot: v, cap: lv };
  }

  function keHoach(can, capDau, ngay, boat) {
    var co = moPhong(can, capDau, boat, 1), tay = moPhong(can, capDau, boat, 0.5);
    var mua = function (v, d) { return raiMua(Math.max(0, v - PR.freePerDay * d), d); };
    var gTay = mua(tay.luot, ngay), gThan = mua(co.luot, ngay) + PR.thanToan * co.luot;
    var reTay = gTay <= gThan, luot = reTay ? tay.luot : co.luot;
    var dSave = reTay ? Math.min(ngay, Math.max(1, Math.ceil(tay.luot / PR.freePerDay))) : ngay;
    var save = {
      key: 'save', days: dSave, free: Math.min(luot, PR.freePerDay * dSave),
      bought: Math.max(0, luot - PR.freePerDay * dSave),
      slot: reTay ? gTay : mua(co.luot, ngay), auto: reTay ? 0 : PR.thanToan * co.luot,
      total: Math.min(gTay, gThan)
    };
    var khac = function (d, key) {
      var n = Math.max(1, Math.min(d, ngay)), bought = Math.max(0, co.luot - PR.freePerDay * n);
      return {
        key: key, days: n, free: Math.min(co.luot, PR.freePerDay * n), bought: bought,
        slot: raiMua(bought, n), auto: PR.autoCost * co.luot,
        total: raiMua(bought, n) + PR.autoCost * co.luot
      };
    };
    return {
      plans: [save, khac(Math.max(1, Math.ceil(ngay / 2)), 'bal'), khac(1, 'fast')],
      voyages: co.luot, endLevel: co.cap
    };
  }

  function diemTheoVang(vang, capDau, ngay, boat, key) {
    if (vang < 0) return 0;
    var gia = function (m) {
      var plans = keHoach(m, capDau, ngay, boat).plans;
      for (var i = 0; i < plans.length; i++) if (plans[i].key === key) return plans[i].total;
    };
    var lo = 0, hi = 1;
    while (hi < 2e8 && gia(hi) <= vang) hi *= 2;
    for (var i = 0; i < 44; i++) {
      var giua = Math.floor((lo + hi) / 2);
      if (gia(giua) <= vang) lo = giua; else hi = giua;
    }
    return lo;
  }

  function nhapSo(o, lo, hi) {
    // bản gốc: Math.round(Number(v) || lo) — xoá trắng ô là nhảy về lo, không cho để trống (bug B7, sao y)
    var v = Math.max(lo, Math.min(hi, Math.round(Number(o.value) || lo)));
    o.value = v;
    return v;
  }

  function mayTinhThuyenCo(hop) {
    var dl = JSON.parse(hop.getAttribute('data-nlw-tc'));
    var boat = dl.boat, tongMon = dl.gia.length;
    var oCap = hop.querySelector('[data-nlw-tc-cap]');
    var oNgay = hop.querySelector('[data-nlw-tc-ngay]');
    var oCach = hop.querySelector('[data-nlw-tc-cach]');
    var oCo = hop.querySelector('[data-nlw-tc-co]');
    var oCan = hop.querySelector('[data-nlw-tc-can]');
    var khoiG2p = hop.querySelector('[data-nlw-tc-g2p]');
    var khoiP2g = hop.querySelector('[data-nlw-tc-p2g]');

    function ve() {
      var cap = Number(oCap.value);
      var ngay = Math.max(1, Math.min(nhapSo(oNgay, 1, dl.maxDays), dl.maxDays));
      if (khoiP2g.classList.contains('hidden')) {
        var cach = oCach.value;
        var cc = diemTheoVang(nhapSo(oCo, 0, 999999), cap, ngay, boat, cach);
        var free = diemTheoVang(0, cap, ngay, boat, 'save');
        var duoc = dl.gia.filter(function (g) { return (g[0] == null ? Infinity : g[0]) <= cc; });
        var dat = duoc.reduce(function (a, b) { return !a || b[0] > a[0] ? b : a; }, null);
        hop.querySelector('[data-nlw-tc-tieu]').textContent =
          'Ước tính đổi được (chiến thuật ' + CACH[cach] + ')';
        hop.querySelector('[data-nlw-tc-cc]').innerHTML =
          '≈ ' + so(cc) + ' <span class="text-sm font-normal text-white/60">Chiến Công</span>';
        hop.querySelector('[data-nlw-tc-du]').innerHTML = duoc.length
          ? 'Đủ để đổi <b class="text-white/85">' + duoc.length + '</b>/' + tongMon
            + ' loại vật phẩm trong tiệm — cao nhất: <b class="text-white/85">' + dat[1]
            + '</b> (' + so(dat[0]) + ' CC).'
          : 'Chưa đủ cho vật phẩm rẻ nhất trong tiệm.';
        // dòng free luôn tính bằng 'save' nên có thể chọi với con số lớn ở trên (bug B4, sao y)
        var oFree = hop.querySelector('[data-nlw-tc-free]');
        oFree.classList.toggle('hidden', !(Number(oCo.value) > 0 && free > 0));
        oFree.textContent = 'Trong đó ~' + so(free) + ' CC đến từ lượt free (0 Vàng); '
          + 'phần Vàng của bạn thêm ~' + so(Math.max(0, cc - free)) + ' CC.';
        return;
      }
      var kh = keHoach(nhapSo(oCan, 0, 9999999), cap, ngay, boat);
      hop.querySelector('[data-nlw-tc-luot]').textContent =
        '= ' + so(kh.voyages) + ' lượt Bội Thu (thuyền Lv' + cap + ', rải ' + ngay + ' ngày)';
      kh.plans.forEach(function (p) {
        var the = hop.querySelector('[data-nlw-tc-the="' + p.key + '"]');
        the.querySelector('[data-nlw-tc-vang]').innerHTML =
          so(p.total) + '<span class="text-xs font-normal text-white/55"> Vàng</span>';
        the.querySelector('[data-nlw-tc-phu]').textContent = p.total === 0
          ? 'chỉ dùng lượt free'
          : 'mua ' + so(p.bought) + ' lượt · ⏱' + p.days + ' ngày';
      });
    }

    ds(hop, '[data-nlw-tc-chieu]').forEach(function (nut, i) {
      nut.addEventListener('click', function () {
        khoiG2p.classList.toggle('hidden', i === 1);
        khoiP2g.classList.toggle('hidden', i === 0);
        hop.querySelector('[data-nlw-tc-ocach]').classList.toggle('hidden', i === 1);
        ds(hop, '[data-nlw-tc-chieu]').forEach(function (n2, j) {
          n2.className = 'px-2.5 py-1 font-medium transition '
            + (i === j ? 'bg-[#c9a24b] text-[#0b0a09]' : 'text-white/60 hover:bg-white/10');
        });
        ve();
      });
    });
    [oCap, oNgay, oCach, oCo, oCan].forEach(function (o) {
      o.addEventListener('change', ve);
      o.addEventListener('input', ve);
    });
  }

  ds(document, '[data-nlw-tc]').forEach(mayTinhThuyenCo);

  // Popup 70 món Thuyền Cỏ: 1 popup dùng chung, mở món nào thì nạp lại nội dung món đó.
  var lopMon = document.querySelector('[data-nlw-tcp-lop]');

  if (lopMon) (function () {
    var dl = JSON.parse(document.querySelector('[data-nlw-tc]').getAttribute('data-nlw-tc'));
    var oLan = lopMon.querySelector('[data-nlw-tcp-lan]');
    var oCap = lopMon.querySelector('[data-nlw-tcp-cap]');
    var nutToiDa = lopMon.querySelector('[data-nlw-tcp-toida]');
    var mon = null, tranLan = 999, keMo = '';

    function huyChuong(mau, chu) {
      return '<span class="rounded px-1.5 py-0.5 font-medium" style="background:' + mau
        + '22;color:' + mau + '">' + chu + '</span>';
    }

// Câu chữ lấy nguyên văn module 18613 bản gốc — sửa là lệch chữ so với trang gốc
    function cacBuoc(p, can, cap, ngayDot) {
      var moiLuot = Math.max(1, Math.round(can / Math.max(1, p.free + p.bought)));
      var ngay = Math.max(1, p.days), deu = Math.floor(p.bought / ngay), du = p.bought % ngay;
      var kieu = p.key !== 'save' ? 'auto' : p.auto > 0 ? 'than' : 'blind';
      var ra = ['Chuẩn bị: mở sự kiện Thuyền Cỏ. Thuyền đang Lv' + cap + '; mỗi lượt ra khơi thu ~'
        + so(moiLuot) + ' Chiến Công '
        + (kieu === 'blind' ? '(đi tay — chưa nhân Bội Thu)' : '(đã tính Bội Thu ×2)')
        + ' và thuyền tự lên cấp dần nên lượt về sau thu nhiều hơn. Mỗi ngày 4h sáng game hồi lại '
        + PR.freePerDay + ' lượt “Mượn Tên” miễn phí và hạ giá mua lượt về gốc ' + PR.buyBase + 'v.'];
      var conFree = p.free, don = 0;
      for (var d = 1; d <= ngay; d++) {
        var free = Math.min(PR.freePerDay, conFree);
        conFree -= free;
        var mua = deu + (d <= du ? 1 : 0), luot = free + mua;
        if (!luot) continue;
        var them = luot * moiLuot;
        // bản gốc kẹp cộng dồn nhưng KHÔNG kẹp phần cộng thêm (bug B5, sao y)
        don = Math.min(don + them, can);
        var y = [];
        if (free > 0) y.push('ra khơi hết ' + free + ' lượt Mượn Tên miễn phí');
        if (mua > 0) y.push('bấm “Mua lượt” thêm ' + so(mua) + ' lần — giá tăng dần ' + PR.buyBase
          + 'v, ' + (PR.buyBase + PR.buyStep) + 'v, … tới '
          + Math.min(PR.buyBase + PR.buyStep * (mua - 1), PR.buyCap)
          + 'v (tổng ' + so(giaMuaNgay(mua)) + 'v)');
        y.push(kieu === 'auto'
          ? 'với mỗi lượt bật “Tự Động Ra Khơi” (' + PR.autoCost
            + 'v/lượt) — game tự canh, CHẮC CHẮN Bội Thu ×2 (hết ' + so(luot * PR.autoCost)
            + 'v Tự Động). Lưu ý: Tự Động cần VIP ≥ 8 hoặc cấp ≥ 150; chưa đủ thì dùng Thần Toán ('
            + PR.thanToan + 'v/lượt) thay thế'
          : kieu === 'than'
            ? 'trước khi bắn, bấm “Thần Toán” (' + PR.thanToan
              + 'v/lượt) để lộ số mũi tên trong sương mù rồi nhắm cụm nhiều nhất → CHẮC Bội Thu ×2 (hết '
              + so(luot * PR.thanToan) + 'v)'
            : 'ngắm cụm sương mù DÀY nhất rồi bắn (không tốn Vàng; lỡ trượt Bội Thu cũng không sao '
              + 'vì đã trừ hao bằng số lượt free nhiều)');
        ra.push('Ngày ' + d + ': ' + y.join('; ') + '. → +' + so(them) + ' Chiến Công (cộng dồn '
          + so(don) + '/' + so(can) + ').');
      }
      ra.push(ngayDot > ngay || p.key === 'save'
        ? 'Các ngày còn lại: cứ 4h sáng vào nhận & tiêu tiếp ' + PR.freePerDay
          + ' lượt free (giá mua đã reset về ' + PR.buyBase + 'v) cho tới khi đủ ' + so(can)
          + ' Chiến Công. Ngày CUỐI đợt KHÔNG cho ra khơi — nhớ đổi thưởng trước đó.'
        : 'Đủ Chiến Công thì vào mục đổi thưởng lấy vật phẩm. Lưu ý: ngày cuối đợt KHÔNG ra khơi '
          + 'được, nên chừa thời gian đổi.');
      ra.push(p.key === 'save'
        ? 'Vì sao rẻ nhất: tận dụng tối đa lượt free & rải qua nhiều ngày để giá mua lượt luôn ở mức thấp; '
          + (kieu === 'blind' ? 'đi tay không tốn Vàng canh Bội Thu'
            : 'chỉ tốn Thần Toán ' + PR.thanToan + 'v/lượt (rẻ hơn Tự Động ' + PR.autoCost + 'v)') + '.'
        : p.key === 'fast'
          ? 'Vì sao tốn nhất: gom hết vào 1 ngày nên giá mua lượt leo tới trần ' + PR.buyCap
            + 'v và Tự Động toàn bộ — bù lại xong ngay trong ngày.'
          : 'Cân bằng: rải qua ' + ngay
            + ' ngày cho giá mua rẻ hơn Tốn Kém, vẫn nhàn nhờ Tự Động (khỏi canh tay).');
      return ra;
    }

    function ve() {
      var lan = Math.max(1, Math.min(tranLan, Number(oLan.value) || 1));
      oLan.value = lan;
      var cap = Number(oCap.value), can = mon.g * lan;
      var kh = keHoach(can, cap, dl.maxDays, dl.boat);
      lopMon.querySelector('[data-nlw-tcp-tom]').innerHTML =
        'Cần <b class="tabular-nums text-white/90">' + so(can) + '</b> Chiến Công = '
        + '<b class="tabular-nums text-white/90">' + so(kh.voyages) + '</b> lượt Bội Thu '
        + (kh.endLevel > cap ? '(thuyền tự lên <b class="text-white/90">Lv' + kh.endLevel + '</b>)'
                             : '(Lv' + cap + ')');
      kh.plans.forEach(function (p) {
        var the = lopMon.querySelector('[data-nlw-tcp-the="' + p.key + '"]');
        var mau = the.getAttribute('data-nlw-tcp-mau');
        the.querySelector('[data-nlw-tcp-vang]').textContent = so(p.total);
        the.querySelector('[data-nlw-tcp-ngay]').textContent = '⏱ ' + p.days + ' ngày';
        var huy = '<span class="rounded bg-white/10 px-1.5 py-0.5 font-medium text-white/90">Free '
          + so(p.free) + '</span>'
          + '<span class="rounded bg-white/10 px-1.5 py-0.5 font-medium text-white/90">Mua '
          + so(p.bought) + ' lượt</span>';
        if (p.slot > 0) huy += huyChuong(mau, 'Mua lượt ' + so(p.slot) + 'v');
        if (p.auto > 0) huy += huyChuong(mau, (p.key === 'save' ? 'Thần Toán' : 'Tự Động')
          + ' ' + so(p.auto) + 'v');
        var sai = p.auto > 0 || p.total === 0 ? 0 : Math.min(200, 10 * Math.round(0.05 * p.total / 10));
        if (sai > 0) huy += '<span class="rounded bg-white/[0.06] px-1.5 py-0.5 text-white/60" '
          + 'title="Ước tính đi tay (không Tự Động/Thần Toán) nên Bội Thu ~50%; giá mua lượt đã '
          + 'chính xác theo game">Sai số ±' + so(sai) + 'v</span>';
        the.querySelector('[data-nlw-tcp-huy]').innerHTML = huy;

        var dangMo = keMo === p.key;
        var oBuoc = the.querySelector('[data-nlw-tcp-buoc]');
        oBuoc.classList.toggle('hidden', !dangMo);
        the.querySelector('[class*="transition-transform"]').classList.toggle('rotate-180', dangMo);
        if (!dangMo) return;
        the.querySelector('[data-nlw-tcp-ol]').innerHTML =
          cacBuoc(p, can, cap, dl.maxDays).map(function (buoc, i) {
            return '<li class="flex gap-1.5"><span class="shrink-0 font-semibold" style="color:'
              + mau + '">' + (i + 1) + '.</span><span>' + buoc + '</span></li>';
          }).join('');
      });
    }

    function dong() {
      lopMon.classList.add('hidden');
      document.body.style.overflow = '';
    }

    ds(document, '[data-nlw-tcp]').forEach(function (the) {
      the.addEventListener('click', function () {
        mon = JSON.parse(the.getAttribute('data-nlw-tcp'));
        tranLan = mon.l || 999;
        keMo = '';
        oLan.max = tranLan;
        oLan.value = 1;
        oCap.value = 1;
        lopMon.querySelector('[data-nlw-tcp-icon]').innerHTML =
          the.firstElementChild.firstElementChild.outerHTML;
        lopMon.querySelector('[data-nlw-tcp-ten]').textContent =
          mon.t + (mon.q > 1 ? ' ×' + mon.q.toLocaleString('en-US') : '');
        lopMon.querySelector('[data-nlw-tcp-tien]').textContent = mon.n;
        lopMon.querySelector('[data-nlw-tcp-gia]').textContent = so(mon.g);
        lopMon.querySelector('[data-nlw-tcp-tran]').textContent = '/ ' + (mon.l ? so(mon.l) : '∞');
        lopMon.querySelector('[data-nlw-tcp-ls]').innerHTML = the.nextElementSibling.innerHTML;
        nutToiDa.classList.toggle('hidden', !mon.l);
        lopMon.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        ve();
      });
    });

    lopMon.addEventListener('click', function (e) { if (e.target === lopMon) dong(); });
    lopMon.querySelector('[data-nlw-tcp-dong]').addEventListener('click', dong);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !lopMon.classList.contains('hidden')) dong();
    });

    lopMon.querySelector('[data-nlw-tcp-lui]').addEventListener('click', function () {
      oLan.value = Math.max(1, Number(oLan.value) - 1);
      ve();
    });
    lopMon.querySelector('[data-nlw-tcp-toi]').addEventListener('click', function () {
      oLan.value = Math.min(tranLan, Number(oLan.value) + 1);
      ve();
    });
    nutToiDa.addEventListener('click', function () {
      oLan.value = mon.l;
      ve();
    });
    [oLan, oCap].forEach(function (o) {
      o.addEventListener('input', ve);
      o.addEventListener('change', ve);
    });
    ds(lopMon, '[data-nlw-tcp-bung]').forEach(function (nut) {
      nut.addEventListener('click', function () {
        var key = nut.parentNode.getAttribute('data-nlw-tcp-the');
        keMo = keMo === key ? '' : key;
        ve();
      });
    });
  })();

  var FOCUS = 'border-[#8ff0a8]/50 bg-emerald-400/[0.08] ring-1 ring-[#8ff0a8]/30';
  var khoiSuggest = document.querySelector('[data-nlw-sg-ds="suggest"]');

  if (khoiSuggest) (function () {
    var khoiFlat = document.querySelector('[data-nlw-sg-ds="flat"]');
    var thuTu = JSON.parse(khoiSuggest.getAttribute('data-nlw-sg-thutu'));
    var oTim = document.querySelector('[data-nlw-sg-tim]');
    var oHai = document.querySelector('[data-nlw-sg-hai2]');
    var nhan = document.querySelector('[data-nlw-sg-nhan]');
    var nutTruoc = document.querySelector('[data-nlw-sg-truoc]');
    var nutSau = document.querySelector('[data-nlw-sg-sau]');
    var oRong = document.querySelector('[data-nlw-sg-rong]');
    var oTiGia = document.querySelector('[data-nlw-sg-oti]');
    var bangTiGia = oTiGia.parentNode.querySelector('[data-nlw-sk-than]');
    var h2 = document.querySelector('[data-nlw-sg-h2]');
    var mota = document.querySelector('[data-nlw-sg-mota]');
    var chuH2 = h2.textContent, chuMota = mota.textContent;
    var tab = 'suggest', chip = 'all', trang = 0;

    function theTheoTen(khoi) {
      var map = {};
      ds(khoi, '[data-nlw-sg-mon]').forEach(function (t) {
        if (t.parentNode === khoi) map[t.getAttribute('data-nlw-sg-mon')] = t;
      });
      return map;
    }
    var theGoiY = theTheoTen(khoiSuggest), thePhang = theTheoTen(khoiFlat);

    function danhSach() {
      var q = oTim.value.trim().toLowerCase();
      var ten = tab === 'suggest' ? thuTu[chip]
        : Object.keys(thePhang).filter(function (t) {
            return !oHai.checked || Number(thePhang[t].getAttribute('data-nlw-sg-se')) >= 2;
          });
      return ten.filter(function (t) { return !q || t.toLowerCase().indexOf(q) >= 0; });
    }

    function ve() {
      var khoi = tab === 'suggest' ? khoiSuggest : khoiFlat;
      var map = tab === 'suggest' ? theGoiY : thePhang;
      var ten = danhSach();
      var soTrang = Math.max(1, Math.ceil(ten.length / MOI_TRANG));
      trang = Math.min(trang, soTrang - 1);
      var hien = ten.slice(trang * MOI_TRANG, trang * MOI_TRANG + MOI_TRANG);
      Object.keys(map).forEach(function (t) { map[t].classList.add('hidden'); });
      hien.forEach(function (t) { khoi.appendChild(map[t]).classList.remove('hidden'); });
      khoiSuggest.classList.toggle('hidden', tab !== 'suggest' || !ten.length);
      khoiFlat.classList.toggle('hidden', tab !== 'flat' || !ten.length);
      oRong.classList.toggle('hidden', ten.length > 0);
      nhan.parentNode.classList.toggle('hidden', ten.length <= MOI_TRANG);
      nhan.textContent = 'Trang ' + (trang + 1) + '/' + soTrang + ' · ' + ten.length + ' món';
      nutTruoc.disabled = trang === 0;
      nutSau.disabled = trang >= soTrang - 1;
    }

    ds(document, '[data-nlw-sg-tab]').forEach(function (nut, i) {
      nut.addEventListener('click', function () {
        tab = i === 0 ? 'suggest' : 'flat';
        trang = 0;
        ds(document, '[data-nlw-sg-tab]').forEach(function (n2, j) {
          n2.className = 'flex-1 rounded-lg px-3 py-1.5 font-medium transition-colors '
            + (i === j ? 'bg-[#c9a24b]/20 text-[#e7d97a]' : 'text-white/55 hover:bg-white/5');
        });
        h2.textContent = i === 0 ? chuH2 : h2.getAttribute('data-nlw-sg-h2');
        mota.textContent = i === 0 ? chuMota : mota.getAttribute('data-nlw-sg-mota');
        document.querySelector('[data-nlw-sg-hai]').classList.toggle('hidden', i === 0);
        ds(document, '[data-nlw-sg-chip]')[0].parentNode.classList.toggle('hidden', i === 1);
        oTiGia.classList.toggle('hidden', i === 1);
        bangTiGia.classList.add('hidden');
        oTiGia.querySelector('[class*="transition-transform"]').classList.remove('rotate-90');
        ve();
      });
    });

    ds(document, '[data-nlw-sg-chip]').forEach(function (nut, i) {
      nut.addEventListener('click', function () {
        chip = i === 0 ? 'all' : Object.keys(thuTu).filter(function (k) { return k !== 'all'; })[i - 1];
        trang = 0;
        ds(document, '[data-nlw-sg-chip]').forEach(function (n2, j) {
          n2.className = 'rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors '
            + (i === j ? 'bg-[#42ad5c]/25 text-[#8ff0a8]' : 'bg-white/[0.04] text-white/55 hover:bg-white/10');
        });
        // bản gốc chỉ đổi viền/nền, KHÔNG mở lại accordion con đang gập (bug B10, sao y)
        ds(khoiSuggest, '[data-nlw-sg-ev]').forEach(function (o) {
          var soi = chip !== 'all' && o.getAttribute('data-nlw-sg-ev') === chip;
          o.className = 'rounded-lg border ' + (soi ? FOCUS : o.getAttribute('data-nlw-sg-vien'));
        });
        ve();
      });
    });

    oTim.addEventListener('input', function () { trang = 0; ve(); });
    oHai.addEventListener('change', function () { trang = 0; ve(); });
    nutTruoc.addEventListener('click', function () { trang = Math.max(0, trang - 1); ve(); });
    nutSau.addEventListener('click', function () { trang = trang + 1; ve(); });

    // Sửa 8 ô tỉ giá → tính lại giá suy ra + ROI của cả 51 món (module 77475 bản gốc).
    var sgt = JSON.parse(khoiSuggest.getAttribute('data-nlw-sgt'));
    var oTiGiaSo = ds(document, '[data-nlw-sg-ti]');

    function vangDonVi(ten, tiGia, suyRa) {
      if (ten === 'Vàng') return 1;
      var hoan = sgt.hoan[ten], suy = suyRa[ten];
      if (suy != null) return hoan != null ? Math.max(suy, hoan) : suy;
      if (hoan != null) return hoan;
      return tiGia[ten];
    }

    function vangChiPhi(cost, tiGia, suyRa) {
      var tong = 0;
      for (var i = 0; i < cost.length; i++) {
        var don = vangDonVi(cost[i][0], tiGia, suyRa);
        if (don == null) return null;
        tong += cost[i][1] * don;
      }
      return tong;
    }

    // lặp cố định 8 vòng như bản gốc: giá suy ra của món này là đầu vào của món kia
    function suyGia(tiGia) {
      var suyRa = {};
      for (var vong = 0; vong < 8; vong++) {
        var doi = false;
        sgt.mon.forEach(function (m) {
          m.s.forEach(function (s) {
            if (s[3].length || s[1].some(function (c) { return c[0] === m.n; })) return;
            var g = vangChiPhi(s[1], tiGia, suyRa);
            if (g == null) return;
            var moi = g / s[2];
            if (suyRa[m.n] == null || moi < suyRa[m.n]) {
              suyRa[m.n] = moi;
              doi = true;
            }
          });
        });
        if (!doi) break;
      }
      return suyRa;
    }

    function vangKem(ten, s) {
      var v = (sgt.hoan[ten] || 0) * s[2];
      s[3].forEach(function (b) { v += (sgt.hoan[b[0]] || 0) * b[1]; });
      return v;
    }

    function nhomSuKien(m, tiGia, suyRa) {
      var gom = {}, nhom = [];
      m.s.forEach(function (s, i) {
        if (s[1].some(function (c) { return c[0] === m.n; })) return;
        var tong;
        if (s[0] === 'cheatingBoat') {
          var cc = 0, con = [];
          s[1].forEach(function (c) { c[0] === 'Chiến Công' ? cc += c[1] : con.push(c); });
          var conVang = con.length ? vangChiPhi(con, tiGia, suyRa) : 0;
          if (conVang == null) return;
          tong = conVang + (cc <= 0 ? 0 : keHoach(cc, 1, sgt.ngay, sgt.boat).plans[0].total);
        } else {
          tong = vangChiPhi(s[1], tiGia, suyRa);
          if (tong == null) return;
        }
        if (!gom[s[0]]) nhom.push(gom[s[0]] = { ev: s[0], goi: [] });
        gom[s[0]].goi.push({ i: i, vang: (tong - vangKem(m.n, s)) / s[2], roi: null });
      });
      nhom.forEach(function (n) {
        n.goi.sort(function (a, b) { return a.vang - b.vang; });
        n.best = n.goi.length ? n.goi[0].vang : Infinity;
      });
      nhom.forEach(function (n) {
        var khac = Infinity;
        nhom.forEach(function (o) { if (o !== n && o.best < khac) khac = o.best; });
        n.alt = khac === Infinity ? null : khac;
        n.goi.forEach(function (o) {
          o.roi = n.alt == null ? null
            : (o.vang <= 0 ? Infinity : (n.alt <= 0 ? 0 : n.alt / o.vang));
        });
      });
      nhom.sort(function (a, b) { return a.best - b.best; });
      return nhom;
    }

    function nhanRoi(roi) {
      if (roi == null) return ['độc quyền', 'bg-white/10 text-white/50'];
      if (!isFinite(roi)) return ['miễn phí', 'bg-[#42ad5c]/30 text-[#a8f5be]'];
      if (roi <= 0) return ['đắt', 'bg-rose-500/20 text-rose-300'];
      if (roi >= 1) return ['×' + (roi >= 10 ? Math.round(roi) : roi.toFixed(1)) + ' hời',
                            'bg-[#42ad5c]/25 text-[#8ff0a8]'];
      var nghich = 1 / roi;
      return ['×' + (nghich >= 10 ? Math.round(nghich) : nghich.toFixed(1)) + ' đắt',
              'bg-rose-500/20 text-rose-300'];
    }

    function nhomTai(nhom, khoaSk) {
      for (var i = 0; i < nhom.length; i++) if (nhom[i].ev === khoaSk) return nhom[i];
      return null;
    }

    function roiTai(nhom, khoaSk) {
      var n = nhomTai(nhom, khoaSk);
      var roi = n && n.goi.length ? n.goi[0].roi : null;
      return roi == null ? 0 : roi;
    }

    function diemChip(nhom, khoaSk) {
      var roi = roiTai(nhom, khoaSk);
      if (isFinite(roi)) return roi;
      var n = nhomTai(nhom, khoaSk);
      return 1e9 - (n ? n.best : 0);
    }

    function veThe(m, nhom) {
      var the = theGoiY[m.n], than = the.querySelector('[data-nlw-sk-than]');
      var nhanThe = nhanRoi(nhom[0].goi[0].roi);
      var chipThe = the.querySelector('[data-nlw-sgt-chip]');
      chipThe.textContent = nhanThe[0];
      chipThe.className = 'shrink-0 rounded px-2 py-1 text-[12px] font-semibold ' + nhanThe[1];
      the.querySelector('[data-nlw-sgt-neu]').textContent = sgt.sk[nhom[0].ev];

      nhom.forEach(function (n, i) {
        var o = than.querySelector('[data-nlw-sg-ev="' + n.ev + '"]');
        var vien = i === 0 ? 'border-emerald-400/25 bg-emerald-400/[0.05]'
                           : 'border-white/10 bg-white/[0.02]';
        o.setAttribute('data-nlw-sg-vien', vien);
        o.className = 'rounded-lg border ' + (chip !== 'all' && n.ev === chip ? FOCUS : vien);
        o.querySelector('[data-nlw-sgt-nen]').classList.toggle('hidden', i > 0);
        var nhanNhom = nhanRoi(n.goi.length ? n.goi[0].roi : null);
        var chipNhom = o.querySelector('[data-nlw-sgt-gchip]');
        chipNhom.textContent = nhanNhom[0];
        chipNhom.className = 'ml-auto shrink-0 rounded px-2 py-0.5 text-[12px] font-semibold '
          + nhanNhom[1];

        var boc = o.querySelector('[data-nlw-sk-than]');
        n.goi.forEach(function (g) {
          var dong = boc.querySelector('[data-nlw-sgt-goi="' + g.i + '"]');
          var chipGoi = dong.querySelector('[data-nlw-sgt-ochip]');
          if (chipGoi) {
            var nhanGoi = nhanRoi(g.roi);
            chipGoi.textContent = nhanGoi[0];
            chipGoi.className = 'inline-flex min-w-[60px] justify-center rounded px-1.5 py-0.5 '
              + 'text-[11px] font-semibold ' + nhanGoi[1];
          }
          boc.appendChild(dong);
        });
        than.appendChild(o);
      });
    }

    function veTiGia() {
      var tiGia = {};
      oTiGiaSo.forEach(function (o) {
        tiGia[o.getAttribute('data-nlw-sg-ti')] = Math.max(0, Number(o.value) || 0);
      });
      var suyRa = suyGia(tiGia), duocGia = [];
      sgt.mon.forEach(function (m) {
        var nhom = nhomSuKien(m, tiGia, suyRa);
        if (nhom.length >= 2) duocGia.push({ m: m, nhom: nhom });
      });
      duocGia.forEach(function (x) { veThe(x.m, x.nhom); });

      Object.keys(thuTu).forEach(function (k) {
        var loc = k === 'all' ? duocGia.slice()
          : duocGia.filter(function (x) { return roiTai(x.nhom, k) >= 1; });
        loc.sort(k === 'all'
          ? function (a, b) { return a.nhom[0].best - b.nhom[0].best; }
          : function (a, b) { return diemChip(b.nhom, k) - diemChip(a.nhom, k); });
        thuTu[k] = loc.map(function (x) { return x.m.n; });
      });
      ve();
    }

    oTiGiaSo.forEach(function (o) {
      o.addEventListener('input', veTiGia);
      o.addEventListener('change', veTiGia);
    });

    ve();
  })();
})();
