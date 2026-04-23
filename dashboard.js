// =========================================================================
// 🚀 MENÜLER, PANO, ANKET VE MESAJLAŞMA (dashboard.js)
// =========================================================================

// 🌟 MENÜ GEÇİŞLERİ (KİLİTLENMEYİ ÇÖZEN KOD BURADA)
window.switchTab = function(tabId, btnElement) { 
    document.querySelectorAll('.app-section').forEach(el => { el.style.setProperty('display', 'none', 'important'); el.classList.remove('active'); }); 
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active')); 
    let targetTab = document.getElementById(tabId);
    if(targetTab) { targetTab.style.setProperty('display', 'block', 'important'); targetTab.classList.add('active'); }
    if(btnElement) btnElement.classList.add('active'); 
    if(typeof window.closeBlueprintEditor === 'function') window.closeBlueprintEditor();
    
    if(tabId === 'sayfa-anket' && typeof window.renderAnketListesi === 'function') { window.renderAnketListesi(); }
}

window.toggleAccordion = function(element) { element.classList.toggle('active'); let content = element.nextElementSibling; content.classList.toggle('active'); }

// 🌟 CANLI PANO VE VARDİYA
window.tablolariGetir = function(callback) {
    db.ref(`yayinlanmis_tablolar`).once("value").then(snap => {
        let tc = document.getElementById("tablesContainer"); if(tc) tc.innerHTML = ""; 
        window.yayindakiTablolar = Object.values(snap.val() || {}).filter(t => t != null);
        let arananAd = window.temizle(window.aktifPersonelAd); let today = new Date(); today.setHours(0,0,0,0);

        window.yayindakiTablolar.forEach(table => {
            let tData = Object.values(table.data || table.rows || {}).filter(r => r != null);
            let adamVarmi = tData.some(r => window.temizle(typeof r.name === 'string' ? r.name : "").includes(arananAd));
            if (!window.isSystemAdmin && !adamVarmi) return;

            let startDt = new Date(table.startDate || table.startdt || table.start || Date.now()); startDt.setHours(0,0,0,0);
            let dayIndex = Math.round((today - startDt) / (1000 * 3600 * 24));
            let cols = parseInt(table.colCount || table.days) || 31;
            
            let html = `<div class="table-wrapper"><div class="table-title collapsible-header" onclick="window.toggleAccordion(this)">📌 ${table.tableName} (Aylık Çizelge)</div><div class="collapsible-content"><div style="overflow-x:auto;"><table class="vardiya-table"><thead><tr><th style="position:sticky;left:0;z-index:20;background:#f8fafc;box-shadow:2px 0 5px rgba(0,0,0,0.1);">PERSONEL ADI</th>`;
            for(let i=0; i<cols; i++) {
                let d = new Date(startDt.getFullYear(), startDt.getMonth(), startDt.getDate() + i); let dStr = String(d.getDate()).padStart(2,'0') + "." + String(d.getMonth()+1).padStart(2,'0');
                html += `<th style="${i===dayIndex?'background:rgba(59,130,246,0.1);color:var(--primary);border-bottom:3px solid var(--primary);':''}">${dStr}</th>`;
            }
            html += `</tr></thead><tbody>`;

            tData.forEach(row => {
                let rName = typeof row.name === 'string' ? row.name : ""; let kendiSatiriMi = window.temizle(rName).includes(arananAd);
                html += `<tr style="${kendiSatiriMi?'background:rgba(59,130,246,0.05);':''}"><td style="position:sticky;left:0;z-index:10;box-shadow:2px 0 5px rgba(0,0,0,0.1);${kendiSatiriMi?'background:#ffffff;color:var(--primary);font-size:14px;font-weight:900;border-left:4px solid var(--primary);':'background:#ffffff;color:var(--dark);'}">${rName}</td>`;
                for(let i=0; i<cols; i++) {
                    let s = row.shifts ? row.shifts[i] : null; let text = s ? (s.text || "") : "";
                    let bg = window.shiftRules[text.replace(/\./g, ':').toUpperCase()] ? window.shiftRules[text.replace(/\./g, ':').toUpperCase()].color : "transparent";
                    let textCol = bg !== "transparent" ? "white" : "var(--dark)";
                    html += `<td style="background:${bg}; color:${textCol}; ${i===dayIndex?'border-left:2px dashed var(--border-color); border-right:2px dashed var(--border-color);':''}">${text}</td>`;
                }
                html += `</tr>`;
            });
            if(tc) tc.innerHTML += html + `</tbody></table></div></div></div>`;
        });
        if(callback) callback();
    });
}

window.loadTemizlikData = function(cb) {
    db.ref("temizlik_haritasi/addh").on("value", snap => {
        let data = snap.val() || {};
        window.shiftMasterDB.departments = Object.values(data.departments || {}).map(d => { d.rooms = Object.values(d.rooms || {}); return d; });
        let dbBps = Object.values(data.blueprints || {}); window.preCodedTemplates.forEach(pt => { if(!dbBps.find(b => b.id === pt.id)) dbBps.push(pt); }); window.shiftMasterDB.blueprints = dbBps;
        window.shiftMasterDB.yoneticiler = Object.values(data.yoneticiler || {});
        window.renderDashboard(); if(typeof window.renderBlueprintList === 'function') window.renderBlueprintList(); if(typeof window.renderArchiveList === 'function') window.renderArchiveList(); if(cb) cb();
    });
}

window.renderDashboard = function() {
    if(typeof window.checkIsAdmin === 'function') window.checkIsAdmin(); 
    const container = document.getElementById('departments-container'); if(!container) return; container.innerHTML = "";
    if (window.isSystemAdmin) { 
        let depts = window.shiftMasterDB.departments || [];
        depts.forEach((dept, i) => {
            let html = `<div class="dept-card" style="animation-delay: ${i * 0.1}s"><div class="dept-header"><h3 class="dept-title">${dept.name}</h3><div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end;"><button class="btn-action btn-admin-only" style="background:var(--dark); color:white;" onclick="window.askArchiveDepartment('${dept.id}', '${dept.name.replace(/'/g, "\\'")}')">📦 AYI KAPAT</button><button class="btn-action btn-admin-only" style="background:#f1f5f9; color:var(--dark);" onclick="window.askRoomName('${dept.id}')">➕ Oda Ekle</button><button class="btn-action btn-admin-only" style="background:rgba(239, 68, 68, 0.1); color:var(--danger); box-shadow:none;" onclick="window.askDeleteDept('${dept.id}', '${dept.name.replace(/'/g, "\\'")}')">Sil</button></div></div><div class="room-grid">`;
            let rms = dept.rooms ? Object.values(dept.rooms) : [];
            if(rms.length > 0) {
                rms.forEach(room => {
                    let statusClass = room.status === 'temiz' ? 'status-temiz' : (room.status === 'bekliyor' ? 'status-bekliyor' : 'status-kirli');
                    let bpId = room.blueprintId || room.formId; let bps = window.shiftMasterDB.blueprints ? Object.values(window.shiftMasterDB.blueprints) : []; let bpObj = bps.find(b => b.id === bpId);
                    
                    let msgHtml = ''; let msgs = room.messages ? Object.values(room.messages).filter(m => m != null) : [];
                    if (msgs.length > 0) { 
                        let sonMesaj = msgs[msgs.length - 1].text || ""; let kisaMesaj = sonMesaj.length > 40 ? sonMesaj.substring(0, 40) + "..." : sonMesaj;
                        msgHtml = `<div class="pin-container" onclick="event.stopPropagation(); window.readRoomMessages('${dept.id}', '${room.id}', '${room.name.replace(/'/g, "\\'")}')">📌<div class="pin-badge">${msgs.length}</div><div class="pin-tooltip">${kisaMesaj}<div style="margin-top:5px; color:#fff; font-size:9px; opacity:0.8;">(Tıklayıp Cevapla)</div></div></div>`; 
                    }
                    
                    let badgeHtml = bpObj ? `<div class="form-badge">📄 ${bpObj.title.substring(0,15)}..</div>` : `<div class="form-badge warning">⚠️ Şablon Ata</div>`;
                    let logoHtml = `<img src="${window.SAGLIK_LOGOSU_BASE64 || 'logo.png'}" class="room-logo-icon">`;
                    
                    html += `<div class="room-btn-wrapper" style="position:relative;">${msgHtml}<div class="mobile-menu-dots" onclick="event.stopPropagation(); window.openContextMenu(event, '${dept.id}', '${room.id}')" style="color:var(--text-gray); z-index:10;">⋮</div><button class="delete-room-btn btn-admin-only" onclick="window.askDeleteRoom('${dept.id}', '${room.id}', '${room.name}')">✕</button><button class="room-btn ${statusClass}" onclick="window.handleRoomClick('${room.id}')" oncontextmenu="window.openContextMenu(event, '${dept.id}', '${room.id}')">${logoHtml}<div style="display:flex; flex-direction:column; gap:4px; align-items:center;"><span>${room.name}</span>${badgeHtml}</div></button></div>`;
                });
            }
            html += `</div></div>`; container.innerHTML += html;
        });
    }
}

// 🌟 YÖNETİCİ/PERSONEL MESAJLAŞMA SİSTEMİ
window.askPersonelTalep = function() {
    let mModal = document.getElementById('personelMesajModal'); if(!mModal) return;
    mModal.innerHTML = `<div class="custom-modal" style="width: 95%; max-width: 500px; padding:25px;"><h2 style="font-weight:900; color:var(--dark); margin-top:0;">📩 Yöneticiye Mesaj</h2><div id="pMesajList" style="max-height:300px; overflow-y:auto; background:#f8fafc; border:1px solid #cbd5e1; border-radius:10px; padding:15px; margin-bottom:15px; text-align:left;"></div><div style="display:flex; gap:10px;"><input type="text" id="pMsgInp" class="modal-input" style="flex:1; margin:0;" placeholder="Talebinizi yazın..." onkeydown="if(event.key === 'Enter') window.sendPMsg()"><button class="btn-action" style="background:var(--success);" onclick="window.sendPMsg()">GÖNDER</button></div><button class="btn-action" style="width:100%; margin-top:15px; justify-content:center; background:var(--danger);" onclick="document.getElementById('personelMesajModal').classList.remove('active')">KAPAT</button></div>`;
    mModal.classList.add('active'); window.loadPMsgs();
}
window.sendPMsg = function() { let v = document.getElementById('pMsgInp').value.trim(); if(!v) return; db.ref("ortak_mesajlar").push({ kisi: window.aktifPersonelAd, mesaj: v, tarih: new Date().toLocaleString('tr-TR'), durum: 'bekliyor' }); document.getElementById('pMsgInp').value = ""; }
window.loadPMsgs = function() {
    db.ref("ortak_mesajlar").on("value", snap => {
        const list = document.getElementById('pMesajList'); if(!list) return;
        list.innerHTML = ""; let ad = window.temizle(window.aktifPersonelAd); let hasMsg = false;
        if(snap.val()) {
            Object.values(snap.val()).forEach(m => {
                if(window.temizle(m.kisi).includes(ad) || ad.includes(window.temizle(m.kisi))) {
                    hasMsg = true;
                    list.innerHTML += `<div style="background:#fff; border:1px solid #e2e8f0; padding:12px; border-radius:8px; margin-bottom:10px; font-size:14px; color:var(--dark); box-shadow:0 2px 4px rgba(0,0,0,0.05);"><div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:11px; color:#64748b;"><b>Siz:</b><span>${m.tarih}</span></div><div>${m.mesaj}</div> ${m.yanit ? `<div style="background:#e0f2fe; padding:8px; border-radius:6px; margin-top:8px; font-size:13px; color:#0369a1; border-left:3px solid #0ea5e9;"><b>Yanıt:</b> ${m.yanit}</div>` : '<div style="margin-top:8px; font-size:11px; color:#f59e0b; font-weight:bold;">⏳ Yanıt bekleniyor...</div>'}</div>`;
                }
            });
        }
        if(!hasMsg) list.innerHTML = "<div style='text-align:center; color:var(--text-gray); font-weight:800; padding:20px;'>Henüz talebiniz yok.</div>";
        list.scrollTop = list.scrollHeight;
    });
}

// 🌟 ANKET / EĞİTİM MODÜLÜ
window.aktifAnketId = null;

window.openAnketOlusturucu = function() {
    window.showModal('input', 'Yeni Eğitim / Anket', 'Başlığı Girin:', '📊', 'Oluştur', 'Örn: Kalite Eğitimi', (baslik) => {
        if(baslik) {
            let id = 'ANK_' + Date.now();
            db.ref("anketler/" + id).set({ baslik: baslik, durum: 'aktif', pdfLink: '', sorular: [], olusturma_tarihi: new Date().toLocaleString('tr-TR') });
            window.showModal('success', 'Dosya Açıldı!', 'Şimdi listeden "Soruları Düzenle" butonuna basarak içerik ekleyebilirsiniz.', '✅', 'Tamam');
        }
    });
}

window.renderAnketListesi = function() {
    const container = document.getElementById('anket-listesi-container'); if(!container) return;
    db.ref("anketler").on("value", snap => {
        container.innerHTML = "";
        if(snap.val()) {
            Object.entries(snap.val()).reverse().forEach(([id, anket]) => {
                let sSayisi = anket.sorular ? Object.keys(anket.sorular).length : 0;
                let durumRenk = anket.durum === 'aktif' ? 'var(--success)' : 'var(--danger)'; 
                let durumText = anket.durum === 'aktif' ? 'YAYINDA' : 'KAPALI';
                let egitimBagi = anket.pdfLink ? `<span style="background:#e0e7ff; color:#4338ca; padding:2px 8px; border-radius:6px; font-size:10px; border:1px solid #c7d2fe;">📚 Eğitim Eklendi</span>` : '';

                container.innerHTML += `
                <div class="dept-card" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px; background:white;">
                    <div>
                        <h4 style="margin:0 0 5px 0; color:var(--dark); font-size:17px;">${anket.baslik} ${egitimBagi}</h4>
                        <div style="font-size:12px; color:var(--text-gray); font-weight:800;">
                            Soru: <b style="color:var(--primary);">${sSayisi}</b> | Durum: <b style="color:${durumRenk};">${durumText}</b> | Tarih: ${anket.olusturma_tarihi || '-'}
                        </div>
                    </div>
                    <div style="display:flex; gap:10px; flex-wrap:wrap;">
                        <button class="btn-action" style="background:var(--primary);" onclick="window.openAnketBuilder('${id}')">✏️ Soruları/Eğitimi Düzenle</button>
                        <button class="btn-action" style="background:var(--dark);" onclick="window.prompt('Hastaneye Gönderilecek Anket Linki (Kopyalayın):', '${window.location.origin}/anket.html?id=${id}')">🔗 Paylaşım Linki</button>
                        <button class="btn-action" style="background:var(--danger); padding:10px;" onclick="window.deleteAnket('${id}')">X</button>
                    </div>
                </div>`;
            });
        } else { container.innerHTML = "<div style='text-align:center; padding:40px; color:var(--text-gray); font-weight:800; background:white; border-radius:15px; border:1px dashed #cbd5e1;'>Sistemde kayıtlı eğitim veya anket bulunmuyor.</div>"; }
    });
}

window.openAnketBuilder = function(id) {
    window.aktifAnketId = id; document.getElementById('anketBuilderModal').classList.add('active');
    db.ref("anketler/" + id).on("value", snap => {
        if(!snap.exists()) return; let anket = snap.val();
        document.getElementById('anketBuilderTitle').innerText = "✏️ " + anket.baslik;
        document.getElementById('anketPdfLink').value = anket.pdfLink || "";
        let list = document.getElementById('anketSorularListesi'); let sayac = document.getElementById('anketSoruSayaci'); list.innerHTML = "";
        
        if(anket.sorular && anket.sorular.length > 0) {
            sayac.innerText = anket.sorular.length + " Soru"; sayac.style.background = "var(--success)"; sayac.style.color = "white";
            anket.sorular.forEach((s, index) => {
                let seceneklerHtml = "";
                if(s.tip === '1-5') seceneklerHtml = "<span style='color:#f59e0b;'>⭐ 1</span> <span style='color:#f59e0b;'>⭐ 2</span> <span style='color:#f59e0b;'>⭐ 3</span> <span style='color:#f59e0b;'>⭐ 4</span> <span style='color:#f59e0b;'>⭐ 5</span>";
                else if(s.tip === 'evet-hayir') seceneklerHtml = "<b style='color:var(--success);'>🔘 EVET</b> &nbsp;&nbsp; <b style='color:var(--danger);'>🔘 HAYIR</b>";
                else if(s.tip === 'katiliyorum') seceneklerHtml = "<b style='color:var(--success);'>🔘 Katılıyorum</b> &nbsp; <b style='color:var(--warning);'>🔘 Kısmen</b> &nbsp; <b style='color:var(--danger);'>🔘 Katılmıyorum</b>";
                else if(s.tip === 'metin') seceneklerHtml = "📝 <i>Açık Uçlu Metin Kutusu</i>";

                list.innerHTML += `<div style="background:white; border:1px solid #cbd5e1; border-left:5px solid var(--primary); padding:15px; border-radius:10px; display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div style="width: 85%;"><div style="font-weight:900; color:var(--dark); font-size:15px; margin-bottom:8px;">${index + 1}. ${s.metin}</div><div style="background:#f1f5f9; padding:8px 12px; border-radius:6px; font-size:13px;">${seceneklerHtml}</div></div>
                    <button class="btn-action" style="background:var(--danger); padding:8px 12px; font-size:11px;" onclick="window.removeSoruFromAnket(${index})">🗑️ SİL</button>
                </div>`;
            });
        } else {
            sayac.innerText = "0 Soru"; sayac.style.background = "var(--warning)"; sayac.style.color = "black";
            list.innerHTML = "<div style='color:var(--text-gray); font-size:14px; text-align:center; padding:20px; border:1px dashed #cbd5e1; border-radius:10px;'>Havuza henüz soru eklenmedi. Yukarıdan ekleyebilirsiniz.</div>";
        }
    });
}

window.addSoruToAnket = function() {
    if(!window.aktifAnketId) return;
    let metin = document.getElementById('yeniSoruMetni').value.trim(); let tip = document.getElementById('yeniSoruTipi').value; let pdfLink = document.getElementById('anketPdfLink').value.trim();
    db.ref("anketler/" + window.aktifAnketId).once("value").then(snap => {
        let anket = snap.val(); if(!anket.sorular) anket.sorular = [];
        if(metin) { anket.sorular.push({ metin: metin, tip: tip }); }
        anket.pdfLink = pdfLink; 
        db.ref("anketler/" + window.aktifAnketId).set(anket).then(() => { document.getElementById('yeniSoruMetni').value = ""; document.getElementById('yeniSoruMetni').focus(); });
    });
}

window.removeSoruFromAnket = function(index) {
    if(!window.aktifAnketId) return; if(!confirm("Bu soruyu silmek istediğinize emin misiniz?")) return;
    db.ref("anketler/" + window.aktifAnketId).once("value").then(snap => { let anket = snap.val(); if(anket.sorular) { anket.sorular.splice(index, 1); db.ref("anketler/" + window.aktifAnketId).set(anket); } });
}

window.deleteAnket = function(id) { if(confirm("Anketi silmek istediğinize emin misiniz?")) { db.ref("anketler/" + id).remove(); } }