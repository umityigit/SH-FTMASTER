// =========================================================================
// 🚀 FİREBASE VE TEMEL DEĞİŞKENLER (config.js)
// =========================================================================
const firebaseConfig = { apiKey: "AIzaSyAAqT74kCwyr6ZULTR_ClRDJ5Iu4AhmXJQ", databaseURL: "https://shiftmaster1-7fc5f-default-rtdb.europe-west1.firebasedatabase.app", projectId: "shiftmaster1-7fc5f" };
if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.database();

let ejs = document.createElement('script'); ejs.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"; document.head.appendChild(ejs);
window.EMAILJS_CONFIG = { serviceID: "service_xxxxxxx", templateID: "template_2acvj3d", publicKey: "QccLW_bpp_UJRyDFM" };
window.SAGLIK_LOGOSU_BASE64 = "logo.png";

window.aktifPersonelAd = ""; window.isSystemAdmin = false; window.shiftMasterDB = { departments: [], blueprints: [], yoneticiler: [] }; window.myShiftData = { text: "", folder: "", dept: "", isTatil: true }; window.deferredPrompt = null; window.isEditMode = false; window.activeBlueprintId = null; window.activeRoomId = null; window.editorBoxes = []; window.pdfImageBase64 = null; window.isArchiveView = false; window.activeArchiveObj = null; window.ctxDept = null; window.ctxRoom = null; window.globalSelectedMonth = null;

window.preCodedTemplates = [
    { id: 'FR06', code: 'DS.FR.06', title: 'GENEL TUVALET TEMİZLİĞİ TAKİP FORMU', layout: 'horizontal', info: '<span>ALAN: <input type="text" id="inp_alan" class="editable-input room-input" value=""></span>', columns: ['Saat 08.00 Temizlik Personeli', 'Saat 09.00 Temizlik Personeli', 'Saat 11.00 Temizlik Personeli', 'Saat 13.00 Temizlik Personeli', 'Saat 15.00 Temizlik Personeli', 'Saat 17.00 Temizlik Personeli', 'Kontrol Eden Personel Şefi'], notes: '* Günlük temizlik 1 lt suya 10 cc çamaşır suyu veya 5 lt suya 2,5 adet klor tablet ile yapılır.\n* Temizlik gün içinde gerektikçe tekrar yapılacaktır.' },
    { id: 'FR13', code: 'DS.FR.13', title: 'KLİNİKLER GÜNLÜK ODA TEMİZLİĞİ TAKİP FORMU', layout: 'horizontal', info: '<span>Klinik: <input type="text" id="inp_klinik" class="editable-input room-input" value=""></span><span>Oda no: <input type="text" id="inp_odano" class="editable-input room-input" value="" style="width:50px;"></span>', columns: ['Saat 08:00', 'Saat 16:00', 'Zemin temizliği', 'Tv ve çerçevelerin temizliği', 'Yemek masası temizliği', 'Dolap, Etejer temizliği', 'WC/Banyo temizliği', 'Buzdolabı temizliği', 'Yatak kenarları temizliği', 'Oksijen flowmetrelerinin temizliği', 'Kapı ve kapı kolu temizliği', 'Panel ve prizlerin temizliği', 'Çarşaf değişimi 1', 'Çarşaf değişimi 2', 'Temizlik Yapan', 'Kontrol Eden Şef'], notes: 'Not: Çarşaflar her gün ve kirlendikçe değiştirilecektir.' },
    { id: 'FR15', code: 'DS.FR.15', title: 'POLİKLİNİK TEMİZLİK TAKİP FORMU', layout: 'vertical', info: '<span>BİRİM ADI: <input type="text" id="inp_birimadi" class="editable-input room-input" value=""></span>', columns: ['Günlük Temizlik Yapan', 'Günlük Temizlik Sorumlu', 'Günlük Birim Sorumlu', 'Haftalık Temizlik Yapan', 'Haftalık Temizlik Sorumlu', 'Haftalık Birim Sorumlu', 'Aylık Temizlik Yapan', 'Aylık Temizlik Sorumlu', 'Aylık Birim Sorumlu'], notes: 'NOT: Günlük Temizlik Her Vardiyada Yapılır Ve Gerektikçe Tekrarlanır.' }
];

window.temizle = (str) => { if(!str) return ""; return str.replace(/İ/g,'I').replace(/ı/g,'I').replace(/Ş/g,'S').replace(/ş/g,'S').replace(/Ğ/g,'G').replace(/ğ/g,'G').replace(/Ü/g,'U').replace(/ü/g,'U').replace(/Ö/g,'O').replace(/ö/g,'O').replace(/Ç/g,'C').replace(/ç/g,'C').replace(/i/g,'I').toUpperCase().replace(/\s+/g, ''); };

window.showModal = function(type, title, text, icon, btnText, inputPlaceholder = null, callback = null) {
    const modal = document.getElementById('geminiModal'); document.getElementById('modalTitle').innerText = title; document.getElementById('modalText').innerText = text; document.getElementById('modalIcon').innerText = icon;
    document.getElementById('modalInputContainer').style.display = 'none'; document.getElementById('modalInput').style.display = 'none'; document.getElementById('modalCustomContent').style.display = 'none'; document.getElementById('modalCustomContent').innerHTML = '';
    if(type === 'input') { document.getElementById('modalInputContainer').style.display = 'block'; document.getElementById('modalInput').style.display = 'block'; document.getElementById('modalInput').placeholder = inputPlaceholder; document.getElementById('modalInput').value = ''; setTimeout(() => document.getElementById('modalInput').focus(), 100); }
    const btnContainer = document.getElementById('modalButtons'); btnContainer.innerHTML = ''; 
    if(type === 'confirm' || type === 'input' || type === 'custom') { btnContainer.innerHTML += `<button class="btn-action" style="background:#cbd5e1; color:#0f172a;" onclick="window.closeModal()">İptal</button>`; }
    let actionBtn = document.createElement('button'); actionBtn.className = 'btn-action'; actionBtn.style.background = (type === 'danger') ? 'var(--danger)' : 'var(--primary)'; actionBtn.innerText = btnText; actionBtn.id = "geminiModalActionBtn";
    actionBtn.onclick = () => { let val = true; if (type === 'input') { let inp = document.getElementById('modalInput'); if(inp) val = inp.value.trim(); } window.closeModal(); if(callback) callback(val); };
    btnContainer.appendChild(actionBtn); document.getElementById('modalInput').onkeydown = (e) => { if(e.key === 'Enter') actionBtn.click(); }; modal.classList.add('active');
}
window.closeModal = function() { document.getElementById('geminiModal').classList.remove('active'); }

window.saveToFirebase = function(silent = false) { 
    let safeData; try { safeData = JSON.parse(JSON.stringify(window.shiftMasterDB, (k, v) => v === undefined ? null : v)); } catch(e) { return; } 
    db.ref("temizlik_haritasi/addh").set(safeData); 
}
window.saveAndExitDashboard = function() { window.saveToFirebase(false); setTimeout(() => { window.location.reload(); }, 1000); }