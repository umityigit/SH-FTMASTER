// =========================================================================
// 🚀 GİRİŞ VE YETKİLENDİRME (auth.js)
// =========================================================================
window.onload = () => { 
    document.querySelectorAll('.hospital-logo').forEach(el => el.innerHTML = `<img src="${window.SAGLIK_LOGOSU_BASE64}" alt="T.C. Sağlık Bakanlığı" style="height:100%;">`);
    const qrId = new URLSearchParams(window.location.search).get('qr'); 
    const isLogout = new URLSearchParams(window.location.search).get('logout');
    if (isLogout) { localStorage.clear(); }

    let savedSession = localStorage.getItem("sm_user_session");
    if(qrId && !savedSession) {
        let loginSc = document.getElementById('loginScreen'); if(loginSc) loginSc.style.display = 'none'; 
        document.body.style.background = "#f1f5f9"; window.openPatientMode(qrId); 
    } else if(savedSession) {
        window.aktifPersonelAd = JSON.parse(savedSession).ad; window.baslat();
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
        localStorage.setItem("sm_user_session", JSON.stringify({ ad: window.aktifPersonelAd })); window.baslat();
        setTimeout(() => window.switchTab('sayfa-vardiya', document.querySelector('.tab-btn')), 500); return;
    }
    db.ref(`personel_havuzu`).once("value").then(snap => {
        let havuz = Object.values(snap.val() || {}).filter(k => k != null);
        let matched = havuz.find(k => { let tcVal = k.tc || k; return tcVal.toString().includes(tcRaw.substring(0,6)); });
        if(matched) {
            window.aktifPersonelAd = (matched.name || matched).replace(/[0-9\-]/g, '').trim();
            localStorage.setItem("sm_user_session", JSON.stringify({ ad: window.aktifPersonelAd })); window.baslat();
            setTimeout(() => window.switchTab('sayfa-vardiya', document.querySelector('.tab-btn')), 500);
        } else { alert("Kimlik Doğrulama Başarısız!"); }
    });
}

window.cikisYap = function() {
    localStorage.removeItem("sm_user_session"); localStorage.clear(); 
    document.getElementById("dashboard").style.display = "none";
    document.getElementById("loginScreen").style.display = "flex";
    document.getElementById("inpTc").value = "";
    window.aktifPersonelAd = ""; window.isSystemAdmin = false;
    window.location.href = window.location.pathname + '?logout=' + Date.now(); 
}

window.baslat = function() {
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

window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); window.deferredPrompt = e; });
window.kurUygulamayi = function() { if(window.deferredPrompt) { window.deferredPrompt.prompt(); window.deferredPrompt.userChoice.then(() => { window.deferredPrompt = null; }); } else { alert("Tarayıcı menüsünden 'Ana Ekrana Ekle'yi seçin."); } }