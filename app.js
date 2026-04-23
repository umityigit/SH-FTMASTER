// =========================================================================
// 🚀 T.C. SAĞLIK BAKANLIĞI - TAM ENTEGRE EKSİKSİZ MOTOR (app.js)
// =========================================================================

const firebaseConfig = { apiKey: "AIzaSyAAqT74kCwyr6ZULTR_ClRDJ5Iu4AhmXJQ", databaseURL: "https://shiftmaster1-7fc5f-default-rtdb.europe-west1.firebasedatabase.app", projectId: "shiftmaster1-7fc5f" };
if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.database();

let ejs = document.createElement('script'); ejs.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"; document.head.appendChild(ejs);
window.EMAILJS_CONFIG = { serviceID: "service_xxxxxxx", templateID: "template_2acvj3d", publicKey: "QccLW_bpp_UJRyDFM" };

const SAGLIK_LOGOSU_BASE64 = "logo.png";

window.aktifPersonelAd = ""; window.isSystemAdmin = false; window.shiftMasterDB = { departments: [], blueprints: [], yoneticiler: [] }; window.myShiftData = { text: "", folder: "", dept: "", isTatil: true }; window.deferredPrompt = null; window.isEditMode = false; window.activeBlueprintId = null; window.activeRoomId = null; window.editorBoxes = []; window.pdfImageBase64 = null; window.isArchiveView = false; window.activeArchiveObj = null; window.ctxDept = null; window.ctxRoom = null; window.globalSelectedMonth = null;

window.preCodedTemplates = [
    { id: 'FR06', code: 'DS.FR.06', title: 'GENEL TUVALET TEMİZLİĞİ TAKİP FORMU', layout: 'horizontal', info: '<span>ALAN: <input type="text" id="inp_alan" class="editable-input room-input" value=""></span>', columns: ['Saat 08.00 Temizlik Personeli', 'Saat 09.00 Temizlik Personeli', 'Saat 11.00 Temizlik Personeli', 'Saat 13.00 Temizlik Personeli', 'Saat 15.00 Temizlik Personeli', 'Saat 17.00 Temizlik Personeli', 'Kontrol Eden Personel Şefi'], notes: '* Günlük temizlik 1 lt suya 10 cc çamaşır suyu veya 5 lt suya 2,5 adet klor tablet ile yapılır.\n* Temizlik gün içinde gerektikçe tekrar yapılacaktır.' },
    { id: 'FR13', code: 'DS.FR.13', title: 'KLİNİKLER GÜNLÜK ODA TEMİZLİĞİ TAKİP FORMU', layout: 'horizontal', info: '<span>Klinik: <input type="text" id="inp_klinik" class="editable-input room-input" value=""></span><span>Oda no: <input type="text" id="inp_odano" class="editable-input room-input" value="" style="width:50px;"></span>', columns: ['Saat 08:00', 'Saat 16:00', 'Zemin temizliği', 'Tv ve çerçevelerin temizliği', 'Yemek masası temizliği', 'Dolap, Etejer temizliği', 'WC/Banyo temizliği', 'Buzdolabı temizliği', 'Yatak kenarları temizliği', 'Oksijen flowmetrelerinin temizliği', 'Kapı ve kapı kolu temizliği', 'Panel ve prizlerin temizliği', 'Çarşaf değişimi 1', 'Çarşaf değişimi 2', 'Temizlik Yapan', 'Kontrol Eden Şef'], notes: 'Not: Çarşaflar her gün ve kirlendikçe değiştirilecektir.' },
    { id: 'FR15', code: 'DS.FR.15', title: 'POLİKLİNİK TEMİZLİK TAKİP FORMU', layout: 'vertical', info: '<span>BİRİM ADI: <input type="text" id="inp_birimadi" class="editable-input room-input" value=""></span>', columns: ['Günlük Temizlik Yapan', 'Günlük Temizlik Sorumlu', 'Günlük Birim Sorumlu', 'Haftalık Temizlik Yapan', 'Haftalık Temizlik Sorumlu', 'Haftalık Birim Sorumlu', 'Aylık Temizlik Yapan', 'Aylık Temizlik Sorumlu', 'Aylık Birim Sorumlu'], notes: 'NOT: Günlük Temizlik Her Vardiyada Yapılır Ve Gerektikçe Tekrarlanır.' }
];

window.temizle = (str) => { if(!str) return ""; return str.replace(/İ/g,'I').replace(/ı/g,'I').replace(/Ş/g,'S').replace(/ş/g,'S').replace(/Ğ/g,'G').replace(/ğ/g,'G').replace(/Ü/g,'U').replace(/ü/g,'U').replace(/Ö/g,'O').replace(/ö/g,'O').replace(/Ç/g,'C').replace(/ç/g,'C').replace(/i/g,'I').toUpperCase().replace(/\s+/g, ''); };

window.switchTab = function(tabId, btnElement) { 
    document.querySelectorAll('.app-section').forEach(el => { el.style.setProperty('display', 'none', 'important'); el.classList.remove('active'); }); 
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active')); 
    let targetTab = document.getElementById(tabId);
    if(targetTab) { targetTab.style.setProperty('display', 'block', 'important'); targetTab.classList.add('active'); }
    if(btnElement) btnElement.classList.add('active'); 
    if(typeof window.closeBlueprintEditor === 'function') window.closeBlueprintEditor();
    
    // Anket sayfasına geçildiyse listeyi yenile
    if(tabId === 'sayfa-anket') { window.renderAnketListesi(); }
}

window.toggleAccordion = function(element) {
    element.classList.toggle('active');
    let content = element.nextElementSibling;
    content.classList.toggle('active');
}

window.onload = () => { 
    document.querySelectorAll('.hospital-logo').forEach(el => el.innerHTML = `<img src="${SAGLIK_LOGOSU_BASE64}" alt="T.C. Sağlık Bakanlığı" style="height:100%;">`);
    const qrId = new URLSearchParams(window.location.search).get('qr'); 
    const isLogout = new URLSearchParams(window.location.search).get('logout');
    if (isLogout) { localStorage.clear(); }

    let savedSession = localStorage.getItem("sm_user_session");
    if(qrId && !savedSession) {
        let loginSc = document.getElementById('loginScreen'); if(loginSc) loginSc.style.display = 'none'; 
        document.body.style.background = "#f1f5f9"; window.openPatientMode(qrId); 
    } else if(savedSession) {
        window.aktifPersonelAd = JSON.parse(savedSession).ad; baslat();
        setTimeout(() => window.switchTab('sayfa-vardiya', document.querySelector('.tab-btn')), 500);
    } else {
        let loginSc = document.getElementById('loginScreen'); if(loginSc) loginSc.style.display = 'flex';
        document.getElementById("dashboard").style.display = "none";
    }
}

window.girisYap = function() {
    let tcRaw = document.getElementById("inpTc").value.trim();
    if(tcRaw.length < 6) return alert("Lütfen TC ilk 6 haneyi girin.");
    if(tcRaw === "864886" || tcRaw === "123456") {
        window.aktifPersonelAd = "ÜMİT A."; window.isSystemAdmin = true;
        localStorage.setItem("sm_user_session", JSON.stringify({ ad: window.aktifPersonelAd })); baslat();
        setTimeout(() => window.switchTab('sayfa-vardiya', document.querySelector('.tab-btn')), 500); return;
    }
    db.ref(`personel_havuzu`).once("value").then(snap => {
        let havuz = Object.values(snap.val() || {}).filter(k => k != null);
        let matched = havuz.find(k => { let tcVal = k.tc || k; return tcVal.toString().includes(tcRaw.substring(0,6)); });
        if(matched) {
            window.aktifPersonelAd = (matched.name || matched).replace(/[0-9\-]/g, '').trim();
            localStorage.setItem("sm_user_session", JSON.stringify({ ad: window.aktifPersonelAd })); baslat();
            setTimeout(() => window.switchTab('sayfa-vardiya', document.querySelector('.tab-btn')), 500);
        } else { alert("Kimlik Doğrulama Başarısız!"); }
    });
}

function baslat() {
    document.body.style.background = ""; 
    if(document.getElementById("loginScreen")) document.getElementById("loginScreen").style.display = "none";
    if(document.getElementById("dashboard")) document.getElementById("dashboard").style.display = "block";
    if(document.getElementById("personelIsimSpan")) document.getElementById("personelIsimSpan").innerText = "Hoş Geldin, " + window.aktifPersonelAd.toUpperCase();

    db.ref("arsivlenmis_shiftler").once("value").then(snap => {
        window.klasorHaritasi = {};
        if(snap.val()) Object.values(snap.val()).forEach(k => { if(k.tables) k.tables.forEach(t => window.klasorHaritasi[t.tableName] = k.name); });
        db.ref(`vardiya_kurallari`).once("value").then(snapRules => {
            window.shiftRules = snapRules.val() || {};
            window.tablolariGetir(() => { window.loadTemizlikData(); });
        });
    });
}

window.cikisYap = function() {
    localStorage.removeItem("sm_user_session"); 
    localStorage.clear(); 
    document.getElementById("dashboard").style.display = "none";
    document.getElementById("loginScreen").style.display = "flex";
    document.getElementById("inpTc").value = "";
    window.aktifPersonelAd = "";
    window.isSystemAdmin = false;
    window.location.href = window.location.pathname + '?logout=' + Date.now(); 
}

window.checkIsAdmin = function() {
    let tAd = window.temizle(window.aktifPersonelAd); 
    let isSuperAdmin = tAd.includes("UMIT") || tAd.includes("ÜMİT") || tAd === "ÜMİTA";
    let isSef = false;
    if (window.shiftMasterDB && window.shiftMasterDB.yoneticiler) {
        isSef = window.shiftMasterDB.yoneticiler.some(y => { let yAd = window.temizle(y); return yAd === tAd || yAd.includes(tAd) || tAd.includes(yAd); });
    }
    window.isSystemAdmin = isSuperAdmin || isSef;
    document.querySelectorAll('.btn-admin-only').forEach(el => { el.style.display = window.isSystemAdmin ? '' : 'none'; });
}

// 🌟 YÖNETİCİ/PERSONEL MESAJLAŞMA SİSTEMİ
window.askPersonelTalep = function() {
    let mModal = document.getElementById('personelMesajModal');
    if(!mModal) return;
    mModal.innerHTML = `
        <div class="custom-modal" style="width: 95%; max-width: 500px; padding:25px;">
            <h2 style="font-weight:900; color:var(--dark); margin-top:0;">📩 Yöneticiye Mesaj</h2>
            <div id="pMesajList" style="max-height:300px; overflow-y:auto; background:#f8fafc; border:1px solid #cbd5e1; border-radius:10px; padding:15px; margin-bottom:15px; text-align:left;"></div>
            <div style="display:flex; gap:10px;">
                <input type="text" id="pMsgInp" class="modal-input" style="flex:1; margin:0;" placeholder="Talebinizi yazın..." onkeydown="if(event.key === 'Enter') window.sendPMsg()">
                <button class="btn-action" style="background:var(--success);" onclick="window.sendPMsg()">GÖNDER</button>
            </div>
            <button class="btn-action" style="width:100%; margin-top:15px; justify-content:center; background:var(--danger);" onclick="document.getElementById('personelMesajModal').classList.remove('active')">KAPAT</button>
        </div>`;
    mModal.classList.add('active');
    window.loadPMsgs();
}

window.sendPMsg = function() {
    let v = document.getElementById('pMsgInp').value.trim(); if(!v) return;
    db.ref("ortak_mesajlar").push({ kisi: window.aktifPersonelAd, mesaj: v, tarih: new Date().toLocaleString('tr-TR'), durum: 'bekliyor' });
    document.getElementById('pMsgInp').value = "";
}

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

// 🌟 ANKET MODÜLÜ (İSKELET VE YÖNETİM)
window.openAnketOlusturucu = function() {
    window.showModal('input', 'Yeni Anket Oluştur', 'Anket Başlığını Girin:', '📊', 'Oluştur', 'Örn: Yemek Memnuniyet Anketi', (baslik) => {
        if(baslik) {
            let id = 'ANK_' + Date.now();
            db.ref("anketler/" + id).set({ baslik: baslik, durum: 'aktif', sorular: [], olusturma_tarihi: new Date().toLocaleString('tr-TR') });
            window.showModal('success', 'Anket Oluşturuldu!', 'Anket başarıyla oluşturuldu. Listeden tıklayarak sorular ekleyebilirsiniz.', '✅', 'Tamam', null, () => { window.renderAnketListesi(); });
        }
    });
}

window.renderAnketListesi = function() {
    const container = document.getElementById('anket-listesi-container');
    if(!container) return;
    db.ref("anketler").on("value", snap => {
        container.innerHTML = "";
        if(snap.val()) {
            Object.entries(snap.val()).forEach(([id, anket]) => {
                let sSayisi = anket.sorular ? Object.keys(anket.sorular).length : 0;
                let durumRenk = anket.durum === 'aktif' ? 'var(--success)' : 'var(--danger)';
                let durumText = anket.durum === 'aktif' ? 'AKTİF' : 'KAPALI';
                
                container.innerHTML += `
                <div class="dept-card" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px; background:white;">
                    <div>
                        <h4 style="margin:0 0 5px 0; color:var(--dark); font-size:16px;">${anket.baslik}</h4>
                        <div style="font-size:12px; color:var(--text-gray); font-weight:800;">
                            Soru: <b style="color:var(--primary);">${sSayisi}</b> | Durum: <span style="color:${durumRenk};">${durumText}</span> | Tarih: ${anket.olusturma_tarihi || '-'}
                        </div>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button class="btn-action" style="background:var(--primary);" onclick="alert('Anket düzenleme yakında aktif olacak!')">✏️ Düzenle / İstatistik</button>
                        <button class="btn-action" style="background:var(--purple);" onclick="alert('Anket Linki: shiftmaster.com.tr/anket.html?id=${id}')">🔗 Link Al</button>
                    </div>
                </div>`;
            });
        } else {
            container.innerHTML = "<div style='text-align:center; padding:40px; color:var(--text-gray); font-weight:800; background:white; border-radius:15px; border:1px dashed #cbd5e1;'>Henüz anket oluşturulmamış.</div>";
        }
    });
}

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
    window.checkIsAdmin(); const container = document.getElementById('departments-container'); if(!container) return; container.innerHTML = "";
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
                    let logoHtml = `<img src="${SAGLIK_LOGOSU_BASE64}" class="room-logo-icon">`;
                    
                    html += `<div class="room-btn-wrapper" style="position:relative;">${msgHtml}<div class="mobile-menu-dots" onclick="event.stopPropagation(); window.openContextMenu(event, '${dept.id}', '${room.id}')" style="color:var(--text-gray); z-index:10;">⋮</div><button class="delete-room-btn btn-admin-only" onclick="window.askDeleteRoom('${dept.id}', '${room.id}', '${room.name}')">✕</button><button class="room-btn ${statusClass}" onclick="window.handleRoomClick('${room.id}')" oncontextmenu="window.openContextMenu(event, '${dept.id}', '${room.id}')">${logoHtml}<div style="display:flex; flex-direction:column; gap:4px; align-items:center;"><span>${room.name}</span>${badgeHtml}</div></button></div>`;
                });
            }
            html += `</div></div>`; container.innerHTML += html;
        });
    }
}

window.openPatientMode = function(roomId) { 
    document.body.innerHTML = `
    <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8fafc; padding: 20px; font-family: 'Nunito', sans-serif;">
        <div style="background: #ffffff; color: #1e293b; max-width: 600px; width: 100%; padding: 30px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
            <img src="${SAGLIK_LOGOSU_BASE64}" style="width:80px; margin:0 auto 15px auto; display:block;">
            <h2 style="color: #0f172a; margin: 0 0 10px 0; font-size: 24px; text-align: center; font-weight: 900;">🚑 HASTA / YAKINI İLETİŞİM</h2>
            <p style="font-size: 14px; color: #64748b; margin-bottom: 25px; text-align: center; font-weight: 700;">Talebinizi veya önerinizi hızlıca iletebilirsiniz.</p>
            <input type="hidden" id="patientRoomInput" value="${roomId}">
            <input type="email" id="patientEmailInput" placeholder="E-Posta veya Telefon (İsteğe Bağlı)" style="width: 100%; padding: 15px; border-radius: 12px; border: 2px solid #e2e8f0; background: #f1f5f9; color: #0f172a; font-weight: 800; font-size: 15px; margin-bottom: 20px; text-align: center; outline: none;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
                <button onclick="document.getElementById('patientMessageInput').value = 'Çarşaf değişimi talep ediyorum.'" style="padding: 15px; background: white; border: 2px solid #e2e8f0; border-radius: 15px; cursor: pointer; font-weight: 800; font-size: 13px; color: #334155; display: flex; flex-direction: column; align-items: center; gap: 8px;"><span style="font-size: 30px;">🛏️</span> Çarşaf Değişimi</button>
                <button onclick="document.getElementById('patientMessageInput').value = 'Oda temizliği istiyorum.'" style="padding: 15px; background: white; border: 2px solid #e2e8f0; border-radius: 15px; cursor: pointer; font-weight: 800; font-size: 13px; color: #334155; display: flex; flex-direction: column; align-items: center; gap: 8px;"><span style="font-size: 30px;">🧹</span> Oda Temizliği</button>
                <button onclick="document.getElementById('patientMessageInput').value = 'Çöp kovası doldu, alınması gerekiyor.'" style="padding: 15px; background: white; border: 2px solid #e2e8f0; border-radius: 15px; cursor: pointer; font-weight: 800; font-size: 13px; color: #334155; display: flex; flex-direction: column; align-items: center; gap: 8px;"><span style="font-size: 30px;">🗑️</span> Çöp Alınması</button>
                <button onclick="document.getElementById('patientMessageInput').value = 'Sabun / Kağıt havlu vb. malzeme eksik.'" style="padding: 15px; background: white; border: 2px solid #e2e8f0; border-radius: 15px; cursor: pointer; font-weight: 800; font-size: 13px; color: #334155; display: flex; flex-direction: column; align-items: center; gap: 8px;"><span style="font-size: 30px;">🧻</span> Malzeme Eksik</button>
                <button onclick="document.getElementById('patientMessageInput').value = 'Personel desteği rica ediyorum.'" style="grid-column: 1 / -1; padding: 20px; background: #e0f2fe; border: 2px solid #7dd3fc; border-radius: 15px; cursor: pointer; font-weight: 900; font-size: 16px; color: #0284c7; display: flex; justify-content: center; align-items: center; gap: 10px;"><span style="font-size: 26px;">🙋‍♂️</span> PERSONEL DESTEĞİ İSTİYORUM</button>
            </div>
            <div style="margin-bottom: 20px;"><label style="font-weight: 900; font-size: 14px; color: #475569; display: block; margin-bottom: 8px;">Dilek, Şikayet ve Önerileriniz:</label><textarea id="patientMessageInput" rows="4" placeholder="Buraya talebinizi detaylıca yazabilirsiniz..." style="width: 100%; padding: 15px; border-radius: 12px; border: 2px solid #e2e8f0; background: #f1f5f9; color: #0f172a; font-weight: 700; font-size: 15px; resize: none; outline: none; font-family: 'Nunito', sans-serif;"></textarea></div>
            <button style="width: 100%; padding: 20px; background: linear-gradient(135deg, #10b981, #059669); color: white; font-size: 18px; font-weight: 900; border: none; border-radius: 15px; cursor: pointer; box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3); letter-spacing:1px;" onclick="window.sendPatientRequest()">📨 TALEBİ GÖNDER</button>
        </div>
    </div>`;
}

window.sendPatientRequest = function() {
    let roomId = document.getElementById('patientRoomInput').value.trim(); let email = document.getElementById('patientEmailInput').value.trim() || "Belirtilmedi"; let msg = document.getElementById('patientMessageInput').value.trim();
    if(!msg) return alert("Lütfen bir talep veya şikayet belirtin (veya butonlardan birini seçin).");
    db.ref("temizlik_haritasi/addh").once("value").then(snap => {
        if(snap.exists() && snap.val()) {
            let data = snap.val(); let depts = data.departments ? Object.values(data.departments) : []; let roomFound = false; let targetRoomName = roomId;
            depts.forEach(d => { let rms = d.rooms ? Object.values(d.rooms) : []; let r = rms.find(rm => rm.id === roomId || rm.name.toUpperCase() === roomId.toUpperCase()); if(r) { roomFound = true; targetRoomName = r.name; if(!r.messages) r.messages = []; r.messages.push({ id: Date.now(), text: msg + " (İletişim: " + email + ")", sender: "🚨 HASTA/YAKINI", date: new Date().toLocaleString('tr-TR') }); } });
            if(roomFound) { 
                data.departments = depts; 
                db.ref("temizlik_haritasi/addh/departments").set(depts).then(() => { 
                    window.sendEmailViaEmailJS(targetRoomName, email, msg); 
                    document.body.innerHTML = `<div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8fafc; padding: 20px; font-family: 'Nunito', sans-serif;"><div style="background: white; padding: 40px; border-radius: 20px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 400px; width: 100%;"><div style="font-size:70px; margin-bottom:15px;">✅</div><h2 style="color: #0f172a; margin: 0 0 10px 0; font-weight: 900;">Talebiniz Alındı</h2><p style="color: #64748b; font-size: 15px; line-height: 1.5; margin-bottom: 0;">Mesajınız yetkililere anında iletilmiştir.<br>Geçmiş olsun dileriz.<br><br><b>Bu sayfayı kapatabilirsiniz.</b></p></div></div>`;
                }); 
            } else { alert("Sistemde böyle bir oda bulunamadı!"); }
        }
    });
}

window.sendEmailViaEmailJS = function(odaAdi, hastaMail, mesaj) {
    if(typeof emailjs === 'undefined') return;
    emailjs.send(window.EMAILJS_CONFIG.serviceID, window.EMAILJS_CONFIG.templateID, { oda_adi: odaAdi, hasta_mail: hastaMail, mesaj: mesaj, tarih: new Date().toLocaleString('tr-TR') }, window.EMAILJS_CONFIG.publicKey).catch(err => console.log("Mail hatası:", err));
}

// 🔥 FORMLARI DEV PENCEREDE AÇMA
window.handleRoomClick = function(roomId) {
    let room = null; let deptName = ""; 
    let depts = window.shiftMasterDB.departments ? Object.values(window.shiftMasterDB.departments) : []; 
    depts.forEach(d => { let rms = d.rooms ? Object.values(d.rooms) : []; let r = rms.find(x => x.id === roomId); if(r) { room = r; deptName = d.name; } }); 
    if(!room) return;
    
    let bpId = room.blueprintId || room.formId; if(!bpId) return window.showModal('warning', 'Şablon Yok!', `"${room.name}" odasına Şablon atanmamış. Sağ tıklayıp atayın.`, '⚠️', 'Anladım');
    let bps = window.shiftMasterDB.blueprints ? Object.values(window.shiftMasterDB.blueprints).filter(b => b != null) : []; let bp = bps.find(b => b.id === bpId); if(!bp) return window.showModal('danger', 'Hata', 'Atanan şablon silinmiş veya uyumsuz.', '❌', 'Kapat');

    window.isEditMode = false; window.isArchiveView = false; window.activeRoomId = room.id; window.activeBlueprintId = bp.id; window.activeArchiveObj = null; if(!room.checks) room.checks = {}; if(!room.inputs) room.inputs = {};
    
    let viewer = document.getElementById('blueprintViewerSection');
    if(viewer) { viewer.style.setProperty('display', 'block', 'important'); window.scrollTo(0,0); }
    document.body.style.overflow = 'hidden'; 
    
    if(document.getElementById('designToolbar')) document.getElementById('designToolbar').style.display = 'none'; 
    if(document.getElementById('btnSaveBlueprint')) document.getElementById('btnSaveBlueprint').style.display = 'inline-flex'; 

    let titleEl = document.getElementById('viewerRoomTitle'); if(titleEl) { titleEl.style.display = 'block'; titleEl.innerText = `Oda: ${room.name}`; }
    
    if(bp.image) { 
        window.editorBoxes = (bp.boxes || []).map(box => { let savedState = room.checks[box.id]; return { ...box, checked: savedState ? savedState.checked : false, signer: savedState ? savedState.signer : null, role: savedState ? savedState.role : box.role }; }); 
        window.pdfImageBase64 = bp.image; 
        if(document.getElementById('dynamic-forms-container')) document.getElementById('dynamic-forms-container').innerHTML = ''; 
        if(document.getElementById('editorArea')) document.getElementById('editorArea').style.display = 'flex'; 
        window.drawCanvasAndBoxes();
    } else { 
        if(document.getElementById('editorArea')) document.getElementById('editorArea').style.display = 'none'; 
        window.buildDigitalForm(bp, false); 
    }
    
    setTimeout(() => { 
        if(room.inputs) { 
            document.querySelectorAll('.editable-input').forEach((inp, idx) => { 
                let key = inp.id || 'inp_' + idx; 
                let defMonth = window.globalSelectedMonth || (new Date().getFullYear() + "-" + String(new Date().getMonth() + 1).padStart(2, '0'));
                
                if(key === 'inp_klinik') { inp.value = deptName; } 
                else if(key === 'inp_odano') { inp.value = room.name; } 
                else if(key === 'inp_alan' || key === 'inp_birimadi' || key === 'inp_gor') { inp.value = deptName.toUpperCase() + " - " + room.name.toUpperCase(); } 
                else if(key === 'inp_ay_yil') { inp.value = room.inputs[key] || defMonth; } 
                else if(room.inputs[key] !== undefined) { inp.value = room.inputs[key]; }
                inp.disabled = false; 
            }); 
        } 
    }, 150);
}

window.closeBlueprintEditor = function() {
    let viewer = document.getElementById('blueprintViewerSection');
    if(viewer) viewer.style.setProperty('display', 'none', 'important'); 
    document.body.style.overflow = 'auto'; 
    window.isEditMode = false; window.isArchiveView = false; window.activeBlueprintId = null; window.activeRoomId = null; window.activeArchiveObj = null; 
    if(document.getElementById('dynamic-forms-container')) document.getElementById('dynamic-forms-container').innerHTML = '';
}

window.silMevcutForm = function() {
    if(confirm("Bu formu/şablonu silmek veya sıfırlamak istediğinize emin misiniz?")) {
        if(window.activeRoomId) {
            let depts = window.shiftMasterDB.departments;
            depts.forEach(d => { let rms = Object.values(d.rooms); let r = rms.find(x => x.id === window.activeRoomId); if(r) { r.checks = {}; r.status = 'kirli'; } });
            window.saveToFirebase(true); window.closeBlueprintEditor(); window.showModal('success', 'Sıfırlandı!', 'Oda temizlik formu sıfırlandı.', '✅', 'Tamam');
        } else if (window.activeBlueprintId) {
            window.deleteBlueprint(new Event('click'), window.activeBlueprintId); window.closeBlueprintEditor();
        }
    }
}

window.toggleEditMode = function() {
    window.isEditMode = !window.isEditMode;
    if(window.isEditMode) { alert("✏️ Düzenleme Modu AÇIK"); document.getElementById('designToolbar').style.display = 'flex'; } 
    else { alert("🔒 Düzenleme Modu KAPALI"); document.getElementById('designToolbar').style.display = 'none'; }
    if(typeof window.renderBoxes === 'function') window.renderBoxes();
}

window.buildDigitalForm = function(form, archiveMode) {
    const container = document.getElementById('dynamic-forms-container'); 
    if(!container) return; container.innerHTML = '';
    let currentChecks = {};
    if(archiveMode && window.activeArchiveObj) { currentChecks = window.activeArchiveObj.checks || {}; } else if(window.activeRoomId) { let depts = window.shiftMasterDB.departments ? Object.values(window.shiftMasterDB.departments) : []; depts.forEach(d => { let rms = d.rooms ? Object.values(d.rooms) : []; rms.forEach(r => { if(r.id === window.activeRoomId) currentChecks = r.checks || {}; }); }); }
    
    if(!form.columns) form.columns = []; 
    let safeInfo = form.info || `<span>ALAN: <input type="text" id="inp_alan" class="editable-input room-input" value="Birim Adı"></span>`;
    
    let dateInputHtml = `<span>DÖNEM: <input type="month" id="inp_ay_yil" class="editable-input room-input" style="padding:5px; border-radius:5px; border:1px solid #ccc; font-weight:bold; cursor:pointer;" onchange="window.globalSelectedMonth=this.value;"></span>`;

    let theadHtml = ''; let tbodyHtml = '';
    if (form.layout === 'horizontal') {
        theadHtml += `<tr><th>Kriter / Günler</th>`; for(let d=1; d<=31; d++) { theadHtml += `<th class="day-trigger" onclick="window.toggleColumn('${form.id}', ${d})">${d}</th>`; } theadHtml += `</tr>`;
        form.columns.forEach((crit, index) => {
            let role = (crit.toLowerCase().includes('şef') || crit.toLowerCase().includes('kontrol') || crit.toLowerCase().includes('sorumlu') || index === form.columns.length -1) ? 'sef' : 'personel';
            tbodyHtml += `<tr><td class="editable-text" contenteditable="true" spellcheck="false" onblur="window.updateFormColumn('${form.id}', ${index}, this.innerText)" style="text-align:left; font-weight:900; font-size:10px; width:150px; background:#f8fafc;">${crit}</td>`;
            for(let d=1; d<=31; d++) { 
                let boxId = `box_${form.id}_${index}_${d}`; let savedState = currentChecks[boxId] || {checked:false, signer:null, role:role}; let checkedStr = savedState.checked ? 'checked' : ''; let signerStr = savedState.signer ? `<span class="tmz-sign-name signed" style="color:${role==='sef'?'#ef4444':'var(--primary)'}">${savedState.signer}</span>` : `<span class="tmz-sign-name"></span>`;
                tbodyHtml += `<td><div class="check-container"><input type="checkbox" class="tmz-check" data-role="${role}" id="${boxId}" onclick="window.imzaAtDigital(this, '${role}')" ${checkedStr}>${signerStr}</div></td>`; 
            } tbodyHtml += `</tr>`;
        });
    } else {
        theadHtml += `<tr><th>Tarih</th>`; form.columns.forEach((col, index) => { theadHtml += `<th class="editable-text" contenteditable="true" spellcheck="false" onblur="window.updateFormColumn('${form.id}', ${index}, this.innerText)">${col}</th>`; }); theadHtml += `</tr>`;
        for (let i = 1; i <= 31; i++) {
            tbodyHtml += `<tr><td class="day-trigger" onclick="window.toggleRow('${form.id}', ${i})">${i}</td>`;
            form.columns.forEach((col, index) => {
                let role = (col.toLowerCase().includes('şef') || col.toLowerCase().includes('kontrol') || col.toLowerCase().includes('sorumlu') || index === form.columns.length -1) ? 'sef' : 'personel';
                let boxId = `box_${form.id}_${i}_${index}`; let savedState = currentChecks[boxId] || {checked:false, signer:null, role:role}; let checkedStr = savedState.checked ? 'checked' : ''; let signerStr = savedState.signer ? `<span class="tmz-sign-name signed" style="color:${role==='sef'?'#ef4444':'var(--primary)'}">${savedState.signer}</span>` : `<span class="tmz-sign-name"></span>`;
                tbodyHtml += `<td><div class="check-container"><input type="checkbox" class="tmz-check" data-role="${role}" id="${boxId}" onclick="window.imzaAtDigital(this, '${role}')" ${checkedStr}>${signerStr}</div></td>`;
            }); tbodyHtml += `</tr>`;
        }
    }
    let tableClass = form.layout === 'horizontal' ? 'layout-horizontal' : 'layout-vertical';
    container.innerHTML = `<div class="a4-paper active" id="a4-${form.id}"><table class="tmz-header-table"><tr><td rowspan="4" style="width: 100px;"></td><td class="tmz-title-cell editable-text" rowspan="4" contenteditable="true" spellcheck="false" onblur="window.updateFormTitle('${form.id}', this.innerText)">${form.title}</td><td class="tmz-info-cell">Kodu: ${form.code}</td></tr><tr><td class="tmz-info-cell">Yayın: 02.12.2024</td></tr><tr><td class="tmz-info-cell">Rev No: 0</td></tr><tr><td class="tmz-info-cell">Sayfa: 1/1</td></tr></table><div class="info-bar">${safeInfo}${dateInputHtml}</div><div class="table-container"><table class="tmz-main-table ${tableClass}"><thead>${theadHtml}</thead><tbody>${tbodyHtml}</tbody></table></div><div style="font-size: 11px; margin-top: 15px; font-weight: 800; line-height:1.5; color:#1e293b;">NOTLAR:<br><div class="editable-text" contenteditable="true" spellcheck="false" onblur="window.updateFormNotes('${form.id}', this.innerText)">${(form.notes || '').replace(/\n/g, '<br>')}</div></div></div>`;
}

window.imzaAtDigital = function(checkbox, role, isBulk = false) {
    if(window.isArchiveView) { checkbox.checked = !checkbox.checked; return alert("Arşivlenmiş formlarda değişiklik yapılamaz."); }
    let span = checkbox.nextElementSibling; if(!span) return;
    if(role === 'sef' && !window.isSystemAdmin && !window.isEditMode) { checkbox.checked = !checkbox.checked; return alert("Sadece yetkili yöneticiler şef onay kutularını işaretleyebilir."); }

    if(checkbox.checked) checkbox.setAttribute('checked', 'true'); else checkbox.removeAttribute('checked');
    let savedName = checkbox.checked ? window.aktifPersonelAd.split(' ')[0] : null;
    if (role === 'sef' && savedName && window.isSystemAdmin) { savedName += ' (Şef)'; }

    if (checkbox.checked) { let renk = role === 'sef' ? 'var(--danger)' : 'var(--primary)'; span.textContent = savedName; span.style.color = renk; span.classList.add('signed'); } else { span.classList.remove('signed'); span.textContent = ''; }
    if(window.activeRoomId && !window.isEditMode) {
        let depts = window.shiftMasterDB.departments ? Object.values(window.shiftMasterDB.departments) : [];
        depts.forEach(d => { let rms = d.rooms ? Object.values(d.rooms) : []; let r = rms.find(x => x.id === window.activeRoomId); if(r) { if(!r.checks) r.checks={}; r.checks[checkbox.id] = {checked: checkbox.checked, signer: savedName, role: role}; } });
        if(!isBulk) window.saveToFirebase(true); 
    }
};

window.toggleColumn = function(formId, colIndex) {
    if(window.isArchiveView) return;
    let table = document.querySelector(`#a4-${formId} .tmz-main-table tbody`);
    let checkboxes = table.querySelectorAll(`tr td:nth-child(${colIndex + 1}) input[type="checkbox"]`);
    let targetCbs = Array.from(checkboxes).filter(cb => cb.getAttribute('data-role') !== 'sef');
    if(targetCbs.length === 0) return; let allChecked = targetCbs.every(cb => cb.checked);
    targetCbs.forEach(cb => { cb.checked = !allChecked; let role = cb.getAttribute('data-role'); window.imzaAtDigital(cb, role, true); });
    window.saveToFirebase(true); 
};

window.toggleRow = function(formId, rowIndex) {
    if(window.isArchiveView) return;
    let table = document.querySelector(`#a4-${formId} .tmz-main-table tbody`);
    let row = table.querySelector(`tr:nth-child(${rowIndex})`);
    let checkboxes = row.querySelectorAll(`input[type="checkbox"]`);
    let targetCbs = Array.from(checkboxes).filter(cb => cb.getAttribute('data-role') !== 'sef');
    if(targetCbs.length === 0) return; let allChecked = targetCbs.every(cb => cb.checked);
    targetCbs.forEach(cb => { cb.checked = !allChecked; let role = cb.getAttribute('data-role'); window.imzaAtDigital(cb, role, true); });
    window.saveToFirebase(true); 
};

window.drawCanvasAndBoxes = function() {
    const canvas = document.getElementById('pdfCanvas'); const ctx = canvas.getContext('2d');
    const img = new Image(); img.onload = () => { canvas.width = img.width; canvas.height = img.height; ctx.drawImage(img, 0, 0); window.renderBoxes(); }; img.src = window.pdfImageBase64;
}

window.renderBoxes = function() {
    document.querySelectorAll('.overlay-checkbox, .overlay-signature').forEach(el => el.remove()); let checkedCount = 0;
    window.editorBoxes.forEach((box, index) => {
        const boxDiv = document.createElement('div'); boxDiv.className = `overlay-checkbox role-${box.role}` + (box.checked ? ' checked' : '');
        boxDiv.style.left = box.x + '%'; boxDiv.style.top = box.y + '%';
        if(box.checked) { boxDiv.innerHTML = '<span style="color:white; font-size:16px; font-weight:bold;">✔</span>'; }
        const delBtn = document.createElement('button'); delBtn.className = 'del-box'; delBtn.innerHTML = 'X'; delBtn.style.display = window.isEditMode ? 'flex' : 'none'; 
        delBtn.onclick = (e) => { e.stopPropagation(); window.editorBoxes.splice(index, 1); window.renderBoxes(); }; boxDiv.appendChild(delBtn);
        const sigDiv = document.createElement('div'); sigDiv.className = `overlay-signature role-${box.role}`;
        if(box.checked) sigDiv.classList.add('visible'); sigDiv.style.left = box.x + '%'; sigDiv.style.top = box.y + '%';
        if(box.checked && box.signer) { sigDiv.innerHTML = box.signer; checkedCount++; }

        boxDiv.onclick = (e) => {
            if(window.isEditMode) { box.checked = !box.checked; if(box.checked) { let sName = window.aktifPersonelAd.split(' ')[0]; if(box.role === 'sef' && window.isSystemAdmin) sName += ' (Şef)'; box.signer = sName; } else { box.signer = null; } window.renderBoxes(); return; }
            if(window.isArchiveView) return alert("Arşivlenmiş formlarda değişiklik yapılamaz.");
            if(box.role === 'sef' && !window.isSystemAdmin) return alert("Sadece yetkili yöneticiler şef onay kutularını işaretleyebilir.");
            box.checked = !box.checked; let savedName = box.checked ? window.aktifPersonelAd.split(' ')[0] : null; if(box.role === 'sef' && savedName && window.isSystemAdmin) savedName += ' (Şef)'; box.signer = savedName;
            if(window.activeRoomId) {
                let depts = window.shiftMasterDB.departments ? Object.values(window.shiftMasterDB.departments) : [];
                depts.forEach(d => { let rms = d.rooms ? Object.values(d.rooms) : []; let r = rms.find(x => x.id === window.activeRoomId); if(r) { if(!r.checks) r.checks={}; r.checks[box.id] = {checked: box.checked, signer: savedName, role: box.role}; } });
                window.saveToFirebase(true);
            }
            window.renderBoxes();
        };
        document.getElementById('formWrapper').appendChild(boxDiv); document.getElementById('formWrapper').appendChild(sigDiv);
    });
    let cDisplay = document.getElementById('boxCountDisplay'); if(cDisplay) cDisplay.innerText = window.isEditMode ? `${window.editorBoxes.length} Kutu` : `${checkedCount}/${window.editorBoxes.length} İmza`;
}

window.askArchiveDepartment = function(deptId, deptName) { 
    let defaultMonth = new Date().getFullYear() + "-" + String(new Date().getMonth() + 1).padStart(2, '0');
    window.showModal('custom', 'Bölümü Arşivle', '', '📦', 'Kapat');
    let html = `<div style="text-align:left;"><p style="color:var(--dark); font-weight:800; font-size:14px; margin-bottom:15px;">"${deptName}" odaları arşivlendi.</p><label style="font-weight:900; font-size:12px; color:var(--text-gray);">Arşivlenecek Dönem:</label><input type="month" id="archiveMonthInput" class="modal-input" value="${defaultMonth}" style="margin-bottom:20px; font-weight:900;"><button class="btn-action" style="width:100%; justify-content:center; background:var(--dark); color:white;" onclick="window.executeArchive('${deptId}')">Arşivle ve Sıfırla</button></div>`;
    document.getElementById('modalCustomContent').innerHTML = html;
    document.getElementById('modalCustomContent').style.display = 'block';
    document.getElementById('modalButtons').style.display = 'none';
}

window.executeArchive = function(deptId) {
    let secilenAy = document.getElementById('archiveMonthInput').value; if(!secilenAy) return alert("Ay seçin!");
    let d = new Date(secilenAy + "-01"); let ayIsimleri = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    let yeniAyLabel = ayIsimleri[d.getMonth()] + " " + d.getFullYear();

    let depts = window.shiftMasterDB.departments; let dept = depts.find(x => x.id === deptId); if(!dept) return;
    let batchId = 'BATCH_' + Date.now(); let dateStr = new Date().toLocaleString('tr-TR', { month: 'long', year: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit' }); let islemYapildi = false;

    Object.values(dept.rooms || {}).forEach(r => {
        if(r.blueprintId || r.formId) {
            if(!r.archives) r.archives = [];
            r.archives.push({ id: 'ARC_' + Date.now() + Math.floor(Math.random()*1000), batchId: batchId, date: dateStr, ayLabel: yeniAyLabel, blueprintId: r.blueprintId || r.formId, checks: JSON.parse(JSON.stringify(r.checks || {})), inputs: JSON.parse(JSON.stringify(r.inputs || {})) });
            r.checks = {}; if(!r.inputs) r.inputs = {}; r.inputs['inp_ay_yil'] = secilenAy; r.status = 'kirli'; islemYapildi = true;
        }
    });

    if(islemYapildi) {
        window.saveToFirebase(true); window.closeModal();
        alert(`"${dept.name}" arşivlendi, ${yeniAyLabel} dönemine geçildi!`);
        window.renderDashboard(); window.renderArchiveList();
    } else { alert("Aktif oda yok!"); }
}

window.readRoomMessages = function(deptId, roomId, roomName) {
    let depts = Object.values(window.shiftMasterDB.departments); let d = depts.find(x => x.id === deptId); let r = Object.values(d.rooms).find(x => x.id === roomId);
    if(r && r.messages) {
        let msgs = Object.values(r.messages).filter(m => m != null); if(msgs.length === 0) { window.closeModal(); return; }
        let html = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid rgba(0,0,0,0.1); padding-bottom:10px;"><h3 style="margin:0; color:var(--dark);">📌 ${roomName} Notları</h3><button onclick="window.closeModal()" style="background:var(--danger); color:white; border:none; border-radius:8px; padding:6px 12px; font-weight:900; cursor:pointer;">X KAPAT</button></div><div style="max-height:300px; overflow-y:auto; text-align:left; margin-bottom:15px; padding-right:5px;">`;
        msgs.forEach(m => {
            let isSelf = m.sender === 'Yönetici' && window.isSystemAdmin; let bg = m.sender.includes('HASTA') ? '#fef3c7' : (isSelf ? '#e0f2fe' : '#f1f5f9'); let color = '#0f172a'; let borderCol = m.sender.includes('HASTA') ? '#f59e0b' : (isSelf ? '#0ea5e9' : '#cbd5e1');
            html += `<div style="background:${bg}; padding:15px; border-radius:12px; margin-bottom:12px; border:2px solid ${borderCol}; position:relative; color:${color};"><div style="font-size:12px; font-weight:900; margin-bottom:8px; opacity:0.9;">${m.sender} <span style="font-weight:normal; font-size:10px; opacity:0.7; margin-left:10px;">${m.date}</span></div><div style="font-size:15px; font-weight:800;">${m.text}</div><button type="button" onclick="window.deleteMessage('${deptId}', '${roomId}', ${m.id})" style="position:absolute; right:12px; top:12px; background:var(--danger); color:white; border:none; border-radius:6px; padding:6px 12px; font-size:11px; font-weight:900; cursor:pointer;">SİL</button></div>`;
        });
        html += `</div><div style="display:flex; gap:10px;"><textarea id="replyMsgInput" style="flex:1; padding:12px; border-radius:10px; border:1px solid #cbd5e1; background:#ffffff; color:#0f172a; resize:none; font-family:'Nunito'; font-weight:600; font-size:14px;" rows="2" placeholder="Cevap veya yeni not yaz..."></textarea><button type="button" class="btn-action" style="background:var(--success); font-size:14px;" onclick="window.replyMessage('${deptId}', '${roomId}', '${roomName}')">GÖNDER</button></div>`;
        
        window.showModal('custom', '', '', '', ''); document.getElementById('modalCustomContent').style.display = 'block'; document.getElementById('modalCustomContent').innerHTML = html; document.getElementById('modalButtons').style.display = 'none';
    }
}
window.deleteMessage = function(deptId, roomId, msgId) { let depts = Object.values(window.shiftMasterDB.departments); let d = depts.find(x => x.id === deptId); let r = Object.values(d.rooms).find(x => x.id === roomId); if(r && r.messages) { r.messages = Object.values(r.messages).filter(m => m && m.id !== msgId); window.saveToFirebase(true); window.readRoomMessages(deptId, roomId, r.name); } };
window.replyMessage = function(deptId, roomId, roomName) { let input = document.getElementById('replyMsgInput'); if(!input || !input.value.trim()) return; let depts = Object.values(window.shiftMasterDB.departments); let d = depts.find(x => x.id === deptId); let r = Object.values(d.rooms).find(x => x.id === roomId); if(r) { if(!r.messages) r.messages = []; let senderName = window.isSystemAdmin ? 'Yönetici' : (window.aktifPersonelAd ? window.aktifPersonelAd.split(' ')[0] : 'Sistem'); r.messages.push({ id: Date.now(), text: input.value.trim(), sender: senderName, date: new Date().toLocaleString('tr-TR') }); window.saveToFirebase(true); window.readRoomMessages(deptId, roomId, roomName); } };

window.openAIScanner = function() { document.getElementById('aiScannerModal').classList.add('active'); document.getElementById('aiPasteArea').value = ''; document.getElementById('aiResultArea').style.display = 'none'; }
window.processPastedText = function() { let rawText = document.getElementById('aiPasteArea').value; if(!rawText || rawText.trim().length < 10) return alert("Lütfen PDF'den kopyaladığınız yazıları yapıştırın."); let lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 2); let upperText = rawText.toUpperCase(); let detectedTemplate = null; for (let template of window.preCodedTemplates) { if (upperText.includes(template.code)) { detectedTemplate = template; break; } } document.getElementById('aiResultArea').style.display = 'block'; if (detectedTemplate) { document.getElementById('aiSuccessMessage').innerHTML = `✅ ${detectedTemplate.code} Algılandı`; document.getElementById('aiCode').value = detectedTemplate.code; document.getElementById('aiTitle').value = detectedTemplate.title; document.getElementById('aiLayout').value = detectedTemplate.layout; document.getElementById('aiCols').value = detectedTemplate.columns.join(',\n'); document.getElementById('aiNotes').value = detectedTemplate.notes; } else { document.getElementById('aiSuccessMessage').innerHTML = `⚠️ Bilinmeyen Form`; document.getElementById('aiCode').value = "YENI.FR"; document.getElementById('aiTitle').value = lines[0] || "Yeni Form"; document.getElementById('aiLayout').value = 'vertical'; document.getElementById('aiCols').value = lines.slice(1,10).join(',\n'); document.getElementById('aiNotes').value = ""; } }
window.saveAITextForm = function() { let code = document.getElementById('aiCode').value.trim(); let title = document.getElementById('aiTitle').value.trim(); let cols = document.getElementById('aiCols').value.trim(); let notes = document.getElementById('aiNotes').value.trim(); let layout = document.getElementById('aiLayout').value; if(!code || !title || !cols) return alert("Sütunlar eksik!"); let colArray = cols.split(',').map(c => c.trim()).filter(c => c.length > 0); let newBp = { id: 'BP_TXT_' + Date.now(), code: code, title: title, layout: layout, info: '<span>ALAN: <input type="text" class="editable-input room-input" value="Birim Adı"></span>', columns: colArray, notes: notes, image: null, boxes: [] }; let bps = window.shiftMasterDB.blueprints ? Object.values(window.shiftMasterDB.blueprints) : []; bps.push(newBp); window.shiftMasterDB.blueprints = bps; document.getElementById('aiScannerModal').classList.remove('active'); window.renderBlueprintList(); window.saveToFirebase(true); }

window.renderBlueprintList = function() { const list = document.getElementById('blueprint-list-container'); if(!list) return; list.innerHTML = ''; let bps = window.shiftMasterDB.blueprints ? Object.values(window.shiftMasterDB.blueprints) : []; if(bps.length === 0) { list.innerHTML = `<div style="text-align:center; padding:40px; background:white; border-radius:15px;">Şablon yok.</div>`; return; } bps.forEach(bp => { let isDigital = !bp.image; list.innerHTML += `<div class="form-card-wrapper" style="background:white; padding:15px; border-radius:10px; border:1px solid var(--border-color);"><button class="delete-form-btn btn-admin-only" onclick="window.deleteBlueprint(event, '${bp.id}')" style="position:absolute; top:5px; right:5px; background:red; color:white; border:none; border-radius:5px;">✕</button><div class="form-card" onclick="window.openBlueprintEditor('${bp.id}')"><div><h4 style="margin:0 0 10px 0; color:var(--dark);">${bp.title}</h4></div></div></div>`; }); }
window.deleteBlueprint = function(e, id) { e.stopPropagation(); window.showModal('danger', 'Sil', 'Silinecek?', '🗑️', 'Sil', null, (confirmed) => { if(confirmed) { window.shiftMasterDB.blueprints = Object.values(window.shiftMasterDB.blueprints).filter(b => b.id !== id); window.saveToFirebase(true); window.renderBlueprintList(); } }); }
window.handleNewPDFUpload = function(event) { const file = event.target.files[0]; if(!file || file.type !== 'application/pdf') { event.target.value = ''; return; } window.isEditMode = true; window.activeRoomId = null; window.activeBlueprintId = 'BP_' + Date.now(); window.pdfImageBase64 = null; window.editorBoxes = []; let viewer = document.getElementById('blueprintViewerSection'); if(viewer) { viewer.style.setProperty('display', 'block', 'important'); window.scrollTo(0,0); } document.body.style.overflow = 'hidden'; document.getElementById('designToolbar').style.display = 'flex'; document.getElementById('btnSaveBlueprint').style.display = 'inline-flex'; document.getElementById('editorArea').style.display = 'none'; document.getElementById('dynamic-forms-container').innerHTML = ''; const fr = new FileReader(); fr.onload = function() { pdfjsLib.getDocument(new Uint8Array(this.result)).promise.then(pdf => { pdf.getPage(1).then(page => { const canvas = document.getElementById('pdfCanvas'); const ctx = canvas.getContext('2d'); const viewport = page.getViewport({ scale: 2.0 }); canvas.width = viewport.width; canvas.height = viewport.height; page.render({ canvasContext: ctx, viewport: viewport }).promise.then(() => { window.pdfImageBase64 = canvas.toDataURL('image/jpeg', 0.8); document.getElementById('editorArea').style.display = 'flex'; window.drawCanvasAndBoxes(); event.target.value = ''; }); }); }); }; fr.readAsArrayBuffer(file); }
window.openBlueprintEditor = function(bpId) { window.isEditMode = true; window.activeRoomId = null; let bps = window.shiftMasterDB.blueprints ? Object.values(window.shiftMasterDB.blueprints) : []; let bp = bps.find(b => b.id === bpId); window.activeBlueprintId = bp.id; let viewer = document.getElementById('blueprintViewerSection'); if(viewer) { viewer.style.setProperty('display', 'block', 'important'); window.scrollTo(0,0); } document.body.style.overflow = 'hidden'; document.getElementById('dynamic-forms-container').innerHTML = ''; document.getElementById('designToolbar').style.display = window.isSystemAdmin ? 'flex' : 'none'; document.getElementById('btnSaveBlueprint').style.display = window.isSystemAdmin ? 'inline-flex' : 'none'; let titleEl = document.getElementById('viewerRoomTitle'); if(titleEl) { titleEl.style.display = 'none'; } if(bp.image) { window.pdfImageBase64 = bp.image; window.editorBoxes = JSON.parse(JSON.stringify(bp.boxes || [])); document.getElementById('editorArea').style.display = 'flex'; window.drawCanvasAndBoxes(); } else { document.getElementById('editorArea').style.display = 'none'; document.getElementById('designToolbar').style.display = 'none'; window.buildDigitalForm(bp, false); } }
window.updateFormColumn = function(formId, colIndex, newText) { let bps = Object.values(window.shiftMasterDB.blueprints); let bp = bps.find(f => f.id === formId); if(bp && newText.trim() !== '') { bp.columns[colIndex] = newText.trim(); window.saveToFirebase(true); } };
window.updateFormTitle = function(formId, newText) { let bps = Object.values(window.shiftMasterDB.blueprints); let bp = bps.find(f => f.id === formId); if(bp && newText.trim() !== '') { bp.title = newText.trim(); window.saveToFirebase(true); } };
window.updateFormNotes = function(formId, newText) { let bps = Object.values(window.shiftMasterDB.blueprints); let bp = bps.find(f => f.id === formId); if(bp) { bp.notes = newText.trim(); window.saveToFirebase(true); } };
window.saveBlueprintTemplate = function() { if(window.editorBoxes.length === 0 && document.getElementById('dynamic-forms-container').innerHTML === '') return alert("Kutu yok!"); window.showModal('input', 'Şablon Adı', '', '💾', 'Kaydet', 'Örn: Form 1', (val) => { if(val) { let bps = window.shiftMasterDB.blueprints ? Object.values(window.shiftMasterDB.blueprints) : []; let bpIndex = bps.findIndex(b => b.id === window.activeBlueprintId); let newBp = { id: window.activeBlueprintId, title: val.toUpperCase(), image: window.pdfImageBase64, boxes: window.editorBoxes.map(b => ({id: b.id, x: b.x, y: b.y, role: b.role})) }; if(bpIndex > -1) bps[bpIndex] = newBp; else bps.push(newBp); window.shiftMasterDB.blueprints = bps; window.saveToFirebase(true); window.closeBlueprintEditor(); window.renderBlueprintList(); } }); };
window.saveRoomChecks = function() { try { if(!window.activeRoomId) return; let roomObj = null; let depts = window.shiftMasterDB.departments ? Object.values(window.shiftMasterDB.departments) : []; depts.forEach(d => { let rms = d.rooms ? Object.values(d.rooms) : []; let r = rms.find(x => x.id === window.activeRoomId); if(r) roomObj = r; }); if(roomObj) { let bpId = roomObj.blueprintId || roomObj.formId; let bps = window.shiftMasterDB.blueprints ? Object.values(window.shiftMasterDB.blueprints) : []; let bp = bps.find(b => b.id === bpId); if(!roomObj.checks) roomObj.checks = {}; if(!roomObj.inputs) roomObj.inputs = {}; let todayStr = new Date().getDate().toString(); let hasSefToday = false; let hasPersonelToday = false; if(bp && bp.image) { window.editorBoxes.forEach(b => { roomObj.checks[b.id] = { checked: b.checked, signer: b.signer, role: b.role }; if(b.checked) { if(b.role === 'sef') hasSefToday = true; if(b.role === 'personel') hasPersonelToday = true; } }); } else if (bp && !bp.image) { let checkInputs = document.querySelectorAll('.tmz-check'); checkInputs.forEach(cb => { let span = cb.nextElementSibling; let role = cb.getAttribute('data-role'); roomObj.checks[cb.id] = { checked: cb.checked, signer: cb.checked ? span.textContent : null, role: role }; }); Object.keys(roomObj.checks).forEach(boxId => { let parts = boxId.split('_'); let dayIndex = bp.layout === 'horizontal' ? 3 : 2; if (parts[dayIndex] === todayStr) { let c = roomObj.checks[boxId]; if (c.checked) { if (c.role === 'sef') hasSefToday = true; if (c.role === 'personel') hasPersonelToday = true; } } }); } document.querySelectorAll('.editable-input').forEach((inp, idx) => { let key = inp.id || 'inp_' + idx; roomObj.inputs[key] = inp.value; }); if(hasSefToday) { roomObj.status = 'temiz'; } else if(hasPersonelToday) { roomObj.status = 'bekliyor'; } else { roomObj.status = 'kirli'; } window.saveToFirebase(true); window.closeBlueprintEditor(); } } catch(e) {} };

window.deleteArchiveFolder = function(deptId, groupKey, event) { event.stopPropagation(); window.showModal('danger', 'Klasörü Sil', 'Komple silinecek?', '🗑️', 'Sil', null, (confirmed) => { if(confirmed) { let depts = window.shiftMasterDB.departments; let d = depts.find(x => x.id === deptId); if(d && d.rooms) { Object.values(d.rooms).forEach(r => { if(r.archives) { r.archives = Object.values(r.archives).filter(a => { let gKey = a.batchId || a.date.split(' ')[0]; return gKey !== groupKey; }); } }); window.saveToFirebase(true); window.renderArchiveList(); } } }); }
window.deleteArchive = function(roomId, arcId, event) { event.stopPropagation(); window.showModal('danger', 'Arşivi Sil', 'Silinecek?', '🗑️', 'Sil', null, (confirmed) => { if(confirmed) { let depts = window.shiftMasterDB.departments; let roomObj = null; depts.forEach(d => { let r = Object.values(d.rooms || {}).find(x => x.id === roomId); if(r) roomObj = r; }); if(roomObj && roomObj.archives) { roomObj.archives = Object.values(roomObj.archives).filter(a => a.id !== arcId); window.saveToFirebase(true); window.renderArchiveList(); } } }); }
window.renderArchiveList = function() { const container = document.getElementById('archives-container'); if(!container) return; container.innerHTML = ''; let hasArchive = false; let depts = window.shiftMasterDB.departments ? Object.values(window.shiftMasterDB.departments).filter(d => d != null) : []; depts.forEach(dept => { let deptArchives = {}; let rms = dept.rooms ? Object.values(dept.rooms).filter(r => r != null) : []; rms.forEach(room => { let arcs = room.archives ? Object.values(room.archives).filter(a => a != null) : []; arcs.forEach(arc => { hasArchive = true; let groupKey = arc.batchId || arc.date.split(' ')[0]; let groupLabel = arc.ayLabel ? `${arc.ayLabel} Arşivi (${arc.date.split(' ')[0]})` : `Tarih: ${arc.date.split(' ')[0]}`; if(!deptArchives[groupKey]) deptArchives[groupKey] = { label: groupLabel, items: [] }; deptArchives[groupKey].items.push({ room: room, arc: arc }); }); }); if(Object.keys(deptArchives).length > 0) { let html = `<div class="dept-card" style="background:white;"><h3 class="dept-title" style="font-size:18px;">📁 ${dept.name} Klasörü</h3><div style="display:flex; flex-direction:column; gap:10px; margin-top:15px;">`; Object.keys(deptArchives).forEach(key => { let group = deptArchives[key]; html += `<div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:12px; padding:15px;"><div style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'grid' : 'none'"><h4 style="margin:0; color:var(--primary); font-size:15px;">🗂️ ${group.label} <span style="font-size:11px; color:var(--text-gray);">(${group.items.length} Form)</span></h4><div style="display:flex; gap:10px; align-items:center;"><button onclick="window.deleteArchiveFolder('${dept.id}', '${key}', event)" style="background:var(--danger); color:white; border:none; padding:4px 10px; border-radius:5px; font-weight:bold; cursor:pointer; font-size:12px;">SİL</button><span style="color:var(--primary);">▼</span></div></div><div class="room-grid" style="display:none; margin-top:15px; padding-top:15px; border-top:1px dashed #cbd5e1;">`; group.items.forEach(item => { html += `<div class="form-card archive" style="background:white; border:1px solid #cbd5e1; position:relative; padding:15px; text-align:center; display:flex; flex-direction:column; align-items:center; cursor:pointer;" onclick="window.openArchiveView('${item.room.id}', '${item.arc.id}')"><button onclick="window.deleteArchive('${item.room.id}', '${item.arc.id}', event)" style="position:absolute; top:5px; right:5px; background:var(--danger); color:white; border:none; border-radius:5px; width:24px; height:24px; font-weight:bold; cursor:pointer; box-shadow:0 2px 5px rgba(0,0,0,0.5);">X</button><div style="width:100%;"><div style="font-size:30px; margin-bottom:5px;">📄</div><div style="font-weight:900; font-size:14px; color:var(--dark);">${item.room.name}</div><div style="font-size:10px; color:var(--text-gray); margin-top:5px;">${item.arc.date.split(' ')[1]}</div></div></div>`; }); html += `</div></div>`; }); html += `</div></div>`; container.innerHTML += html; } }); if(!hasArchive) container.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-gray); font-weight:800; background:white; border-radius:15px;">Arşiv yok.</div>`; }
window.openArchiveView = function(roomId, arcId) { let room = null; let depts = Object.values(window.shiftMasterDB.departments); depts.forEach(d => { let rms = Object.values(d.rooms); let r = rms.find(x => x.id === roomId); if(r) room = r; }); if(!room) return; let arc = Object.values(room.archives).find(a => a.id === arcId); if(!arc) return; let bp = Object.values(window.shiftMasterDB.blueprints).find(b => b.id === arc.blueprintId); if(!bp) return alert("Bu arşivin şablonu silinmiş."); window.isArchiveView = true; window.activeArchiveObj = arc; window.activeRoomId = null; let viewer = document.getElementById('blueprintViewerSection'); if(viewer) { viewer.style.setProperty('display', 'block', 'important'); window.scrollTo(0,0); } document.body.style.overflow = 'hidden'; document.getElementById('designToolbar').style.display = 'none'; document.getElementById('btnSaveBlueprint').style.display = 'none'; let titleEl = document.getElementById('viewerRoomTitle'); if(titleEl) { titleEl.style.display = 'block'; titleEl.innerText = `🗂️ ARŞİV: ${room.name} (${arc.date})`; } if(bp.image) { window.editorBoxes = (bp.boxes || []).map(box => { let savedState = arc.checks[box.id]; return { ...box, checked: savedState ? savedState.checked : false, signer: savedState ? savedState.signer : null, role: savedState ? savedState.role : box.role }; }); window.pdfImageBase64 = bp.image; if(document.getElementById('dynamic-forms-container')) document.getElementById('dynamic-forms-container').innerHTML = ''; if(document.getElementById('editorArea')) document.getElementById('editorArea').style.display = 'flex'; window.drawCanvasAndBoxes(); } else { if(document.getElementById('editorArea')) document.getElementById('editorArea').style.display = 'none'; if(window.buildDigitalForm) window.buildDigitalForm(bp, true); } setTimeout(() => { if(arc.inputs) { document.querySelectorAll('.editable-input').forEach((inp, idx) => { let key = inp.id || 'inp_' + idx; if(arc.inputs[key] !== undefined) { inp.value = arc.inputs[key]; inp.disabled = true; } }); } }, 150); }

window.openContextMenu = function(e, deptId, roomId) { 
    e.preventDefault(); window.ctxDept = deptId; window.ctxRoom = roomId; 
    const menu = document.getElementById('contextMenu'); const list = document.getElementById('contextMenuItems'); 
    let adminDisplay = window.isSystemAdmin ? 'flex' : 'none'; 
    list.innerHTML = `<div class="context-item" style="display:${adminDisplay};" onclick="window.askRenameRoom()"><span class="context-code">✏️</span><span>Adını Değiştir</span></div><div class="context-item" style="background: rgba(250, 204, 21, 0.1);" onclick="window.leaveRoomMessage()"><span class="context-code">💬</span><span>Mesaj Bırak</span></div><div class="context-item" style="display:${adminDisplay};" onclick="window.generateRoomQR('${deptId}', '${roomId}')"><span class="context-code">📷</span><span>QR Kodu Al</span></div>`; 
    let bps = window.shiftMasterDB.blueprints ? Object.values(window.shiftMasterDB.blueprints).filter(b => b != null) : []; 
    if(window.isSystemAdmin) { 
        if(bps.length === 0) list.innerHTML += `<div style="padding:10px; font-size:11px; color:red;">Şablon yok!</div>`; 
        bps.forEach(bp => { list.innerHTML += `<div class="context-item" onclick="window.assignBlueprint('${bp.id}')"><span class="context-code">ŞBLN</span><span>${bp.title.substring(0,22)}</span></div>`; }); 
    } 
    let x = e.pageX || (e.touches && e.touches[0].pageX); let y = e.pageY || (e.touches && e.touches[0].pageY); 
    if(x + 280 > document.documentElement.scrollWidth) x = document.documentElement.scrollWidth - 290; 
    if(y + 300 > document.documentElement.scrollHeight) y = document.documentElement.scrollHeight - 310; 
    menu.style.position = 'absolute'; menu.style.left = x + 'px'; menu.style.top = y + 'px'; menu.classList.add('active'); 
}
document.addEventListener('click', function(e) { const menu = document.getElementById('contextMenu'); if (menu && menu.classList.contains('active') && !e.target.closest('#contextMenu') && !e.target.closest('.mobile-menu-dots') && !e.target.closest('.room-btn')) { menu.classList.remove('active'); } });

window.askRenameRoom = function() { if(window.ctxDept && window.ctxRoom) { let depts = Object.values(window.shiftMasterDB.departments); let d = depts.find(x => x.id === window.ctxDept); let r = Object.values(d.rooms).find(x => x.id === window.ctxRoom); window.showModal('input', 'Adını Değiştir', 'Adı:', '✏️', 'Kaydet', 'Örn: 101', (val) => { if(val) { r.name = val; window.saveToFirebase(true);} }); } }
window.assignBlueprint = function(bpId) { if(window.ctxDept && window.ctxRoom) { let depts = Object.values(window.shiftMasterDB.departments); let d = depts.find(x => x.id === window.ctxDept); let r = Object.values(d.rooms).find(x => x.id === window.ctxRoom); r.blueprintId = bpId; window.saveToFirebase(true); window.showModal('success', 'Atandı!', `Başarılı.`, '✅', 'Tamam'); } }
window.leaveRoomMessage = function() { if(window.ctxDept && window.ctxRoom) { let depts = Object.values(window.shiftMasterDB.departments); let d = depts.find(x => x.id === window.ctxDept); let r = Object.values(d.rooms).find(x => x.id === window.ctxRoom); window.showModal('input', 'Not Bırak', 'Not:', '💬', 'Gönder', 'Örn: Acil...', (val) => { if(val) { if(!r.messages) r.messages = []; let senderName = window.isSystemAdmin ? 'Yönetici' : window.aktifPersonelAd.split(' ')[0]; r.messages.push({ id: Date.now(), text: val, sender: senderName, date: new Date().toLocaleString('tr-TR') }); window.saveToFirebase(true); } }); } }
window.generateRoomQR = function(deptId, roomId) { let depts = window.shiftMasterDB.departments ? Object.values(window.shiftMasterDB.departments) : []; let d = depts.find(x => x.id === deptId); let r = d ? Object.values(d.rooms).find(x => x.id === roomId) : null; if(!r) return; document.getElementById('contextMenu').classList.remove('active'); let qrUrl = window.location.origin + window.location.pathname.replace('shiftmaster.html', 'personel_portal.html') + '?qr=' + roomId; let qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}`; let printWin = window.open('', '_blank'); printWin.document.write(`<html><head><title>${r.name} - QR KOD</title></head><body style="text-align:center; font-family:Arial, sans-serif; padding-top:40px;"><img src="${SAGLIK_LOGOSU_BASE64}" style="width:100px; margin-bottom:10px;"><h2 style="font-size:35px; color:#ef4444; margin-bottom:5px;">DÖŞEMEALTI DEVLET HASTANESİ</h2><h1 style="font-size:40px; margin-bottom:10px;">${d.name}</h1><h2 style="font-size:60px; margin-top:0; color:#0284c7;">${r.name}</h2><img src="${qrApiUrl}" style="width:400px; height:400px; margin:20px 0; border:5px solid #000; padding:10px; border-radius:20px;"><h3 style="font-size:28px; color:#475569;">Talepleriniz için lütfen QR kodu okutun.</h3><script>setTimeout(() => { window.print(); }, 1500);<\/script></body></html>`); }
window.saveToFirebase = function(silent = false) { let safeData; try { safeData = JSON.parse(JSON.stringify(window.shiftMasterDB, (k, v) => v === undefined ? null : v)); } catch(e) { return; } db.ref("temizlik_haritasi/addh").set(safeData); }
window.showModal = function(type, title, text, icon, btnText, inputPlaceholder = null, callback = null) { const modal = document.getElementById('geminiModal'); document.getElementById('modalTitle').innerText = title; document.getElementById('modalText').innerText = text; document.getElementById('modalIcon').innerText = icon; document.getElementById('modalInputContainer').style.display = 'none'; document.getElementById('modalInput').style.display = 'none'; document.getElementById('modalCustomContent').style.display = 'none'; document.getElementById('modalCustomContent').innerHTML = ''; if(type === 'input') { document.getElementById('modalInputContainer').style.display = 'block'; document.getElementById('modalInput').style.display = 'block'; document.getElementById('modalInput').placeholder = inputPlaceholder; document.getElementById('modalInput').value = ''; setTimeout(() => document.getElementById('modalInput').focus(), 100); } const btnContainer = document.getElementById('modalButtons'); btnContainer.innerHTML = ''; if(type === 'confirm' || type === 'input' || type === 'custom') { btnContainer.innerHTML += `<button class="btn-action" style="background:#cbd5e1; color:#0f172a;" onclick="window.closeModal()">İptal</button>`; } let actionBtn = document.createElement('button'); actionBtn.className = 'btn-action'; actionBtn.style.background = (type === 'danger') ? 'var(--danger)' : 'var(--primary)'; actionBtn.innerText = btnText; actionBtn.id = "geminiModalActionBtn"; actionBtn.onclick = () => { let val = true; if (type === 'input') { let inp = document.getElementById('modalInput'); if(inp) val = inp.value.trim(); } window.closeModal(); if(callback) callback(val); }; btnContainer.appendChild(actionBtn); document.getElementById('modalInput').onkeydown = (e) => { if(e.key === 'Enter') actionBtn.click(); }; modal.classList.add('active'); }
window.closeModal = function() { document.getElementById('geminiModal').classList.remove('active'); }
window.askDepartmentName = function() { window.showModal('input', 'Yeni Bölüm', 'Adı:', '🏥', 'Oluştur', 'Örn: Acil', (val) => { if(val) { window.shiftMasterDB.departments.push({ id: 'dept_' + Date.now(), name: val, rooms: [] }); window.saveToFirebase(true); } }); }
window.askDeleteDept = function(id, name) { window.showModal('danger', 'Sil', `"${name}" silinecek?`, '⚠️', 'Sil', null, (confirmed) => { if(confirmed) { window.shiftMasterDB.departments = Object.values(window.shiftMasterDB.departments).filter(d => d && d.id !== id); window.saveToFirebase(true); } }); }
window.askRoomName = function(deptId) { window.showModal('input', 'Oda Ekle', 'Adı veya Sayı:', '🚪', 'Ekle', 'Örn: 101', (val) => { if(val) { let depts = Object.values(window.shiftMasterDB.departments); let tDept = depts.find(d => d.id === deptId); if(!tDept.rooms) tDept.rooms = []; let rms = Object.values(tDept.rooms); let num = parseInt(val); if(!isNaN(num) && num > 0 && num <= 100 && val.trim() == num.toString()) { for(let i=1; i<=num; i++) rms.push({ id: 'room_' + Date.now() + '_' + i, name: 'Oda ' + i, status: 'kirli', blueprintId: null, checks: {}, inputs: {}, messages: [], archives: [] }); } else { rms.push({ id: 'room_' + Date.now(), name: val, status: 'kirli', blueprintId: null, checks: {}, inputs: {}, messages: [], archives: [] }); } tDept.rooms = rms; window.saveToFirebase(true); } }); }
window.askDeleteRoom = function(deptId, roomId, name) { window.showModal('danger', 'Sil', `"${name}" silinecek?`, '🗑️', 'Sil', null, (confirmed) => { if(confirmed) { let depts = Object.values(window.shiftMasterDB.departments); let tDept = depts.find(d => d.id === deptId); tDept.rooms = Object.values(tDept.rooms).filter(r => r && r.id !== roomId); window.saveToFirebase(true); } }); }
window.manageAdminsModal = function() { db.ref("personel_havuzu").once("value").then(snap => { let optionsHtml = '<option value="" style="color:black;">-- Seçin --</option>'; if (snap.val()) { let havuz = Object.values(snap.val()); let isimler = havuz.map(k => typeof k === 'string' ? k : (k.name || "")); isimler = isimler.map(n => n.includes("-") ? n.split("-")[1].trim() : n); isimler.sort((a,b) => a.localeCompare(b, 'tr')).forEach(isim => { if (isim) optionsHtml += `<option value="${isim}" style="color:black;">${isim}</option>`; }); } let html = `<div style="text-align:left; width:100%;"><select id="newAdminInput" class="modal-input" style="margin-bottom:15px; width:100%; padding:12px; background:#f8fafc; color:#0f172a; border:1px solid #cbd5e1;">${optionsHtml}</select><button class="btn-action" style="width:100%; justify-content:center; background:var(--primary); margin-bottom:20px;" onclick="window.addAdmin()">Şef Ata</button><div id="adminChipsContainer" style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center;"></div></div>`; window.showModal('custom', '👑 Şef Ata', '', '', 'Kapat', null, () => { window.checkIsAdmin(); }); document.getElementById('modalCustomContent').innerHTML = html; document.getElementById('modalCustomContent').style.display = 'block'; window.renderAdminChips(); }); }
window.renderAdminChips = function() { const container = document.getElementById('adminChipsContainer'); if(!container) return; container.innerHTML = ''; let yList = window.shiftMasterDB.yoneticiler ? Object.values(window.shiftMasterDB.yoneticiler) : []; yList.forEach(ad => { container.innerHTML += `<div class="admin-chip" style="background:#e0f2fe; color:#0369a1; padding:5px 10px; border-radius:8px; display:flex; gap:5px; font-weight:800;">${ad} <span onclick="window.removeAdmin('${ad}')" style="cursor:pointer; color:red;">×</span></div>`; }); }
window.addAdmin = function() { let val = document.getElementById('newAdminInput').value.trim(); if(val) { if(!window.shiftMasterDB.yoneticiler) window.shiftMasterDB.yoneticiler = []; let yList = Object.values(window.shiftMasterDB.yoneticiler); if(!yList.includes(val)) { yList.push(val); window.shiftMasterDB.yoneticiler = yList; window.saveToFirebase(true); window.renderAdminChips(); } } }
window.removeAdmin = function(name) { let yList = Object.values(window.shiftMasterDB.yoneticiler || []); window.shiftMasterDB.yoneticiler = yList.filter(y => y !== name); window.saveToFirebase(true); window.renderAdminChips(); };