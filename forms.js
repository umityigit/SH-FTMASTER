// =========================================================================
// 🚀 FORMLAR, ŞABLONLAR VE İMZA İŞLEMLERİ (forms.js)
// =========================================================================

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
            let depts = window.shiftMasterDB.departments; depts.forEach(d => { let rms = Object.values(d.rooms); let r = rms.find(x => x.id === window.activeRoomId); if(r) { r.checks = {}; r.status = 'kirli'; } });
            window.saveToFirebase(true); window.closeBlueprintEditor(); window.showModal('success', 'Sıfırlandı!', 'Oda temizlik formu sıfırlandı.', '✅', 'Tamam');
        } else if (window.activeBlueprintId) { window.deleteBlueprint(new Event('click'), window.activeBlueprintId); window.closeBlueprintEditor(); }
    }
}

window.toggleEditMode = function() {
    window.isEditMode = !window.isEditMode;
    if(window.isEditMode) { alert("✏️ Düzenleme Modu AÇIK"); document.getElementById('designToolbar').style.display = 'flex'; } 
    else { alert("🔒 Düzenleme Modu KAPALI"); document.getElementById('designToolbar').style.display = 'none'; }
    if(typeof window.renderBoxes === 'function') window.renderBoxes();
}

window.buildDigitalForm = function(form, archiveMode) {
    const container = document.getElementById('dynamic-forms-container'); if(!container) return; container.innerHTML = '';
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

window.saveCurrentChecksOrTemplate = function() { 
    try { 
        if(window.isEditMode) { window.saveBlueprintTemplate(); } 
        else { 
            if(!window.activeRoomId) return;
            let roomObj = null; let depts = window.shiftMasterDB.departments ? Object.values(window.shiftMasterDB.departments) : [];
            depts.forEach(d => { let rms = d.rooms ? Object.values(d.rooms) : []; let r = rms.find(x => x.id === window.activeRoomId); if(r) roomObj = r; });
            
            if(roomObj) {
                let bpId = roomObj.blueprintId || roomObj.formId; let bps = window.shiftMasterDB.blueprints ? Object.values(window.shiftMasterDB.blueprints) : []; let bp = bps.find(b => b.id === bpId);
                if(!roomObj.checks) roomObj.checks = {}; if(!roomObj.inputs) roomObj.inputs = {};
                let todayStr = new Date().getDate().toString(); let hasSefToday = false; let hasPersonelToday = false;
                
                if(bp && bp.image) {
                    window.editorBoxes.forEach(b => { 
                        roomObj.checks[b.id] = { checked: b.checked, signer: b.signer, role: b.role }; 
                        if(b.checked) { if(b.role === 'sef') hasSefToday = true; if(b.role === 'personel') hasPersonelToday = true; }
                    });
                } else if (bp && !bp.image) {
                    let checkInputs = document.querySelectorAll('.tmz-check');
                    checkInputs.forEach(cb => { let span = cb.nextElementSibling; let role = cb.getAttribute('data-role'); roomObj.checks[cb.id] = { checked: cb.checked, signer: cb.checked ? span.textContent : null, role: role }; });
                    Object.keys(roomObj.checks).forEach(boxId => { let parts = boxId.split('_'); let dayIndex = bp.layout === 'horizontal' ? 3 : 2; if (parts[dayIndex] === todayStr) { let c = roomObj.checks[boxId]; if (c.checked) { if (c.role === 'sef') hasSefToday = true; if (c.role === 'personel') hasPersonelToday = true; } } });
                }
                document.querySelectorAll('.editable-input').forEach((inp, idx) => { let key = inp.id || 'inp_' + idx; roomObj.inputs[key] = inp.value; });
                if(hasSefToday) { roomObj.status = 'temiz'; } else if(hasPersonelToday) { roomObj.status = 'bekliyor'; } else { roomObj.status = 'kirli'; }
                
                window.saveToFirebase(true); window.showModal('success', 'Kaydedildi!', 'Form başarıyla güncellendi.', '✅', 'Kapat', null, () => { window.closeBlueprintEditor(); });
            }
        } 
    } catch(e) { alert("Hata: " + e.message); } 
};

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
    if(window.isArchiveView) return; let table = document.querySelector(`#a4-${formId} .tmz-main-table tbody`); let checkboxes = table.querySelectorAll(`tr td:nth-child(${colIndex + 1}) input[type="checkbox"]`);
    let targetCbs = Array.from(checkboxes).filter(cb => cb.getAttribute('data-role') !== 'sef'); if(targetCbs.length === 0) return; let allChecked = targetCbs.every(cb => cb.checked);
    targetCbs.forEach(cb => { cb.checked = !allChecked; let role = cb.getAttribute('data-role'); window.imzaAtDigital(cb, role, true); }); window.saveToFirebase(true); 
};

window.toggleRow = function(formId, rowIndex) {
    if(window.isArchiveView) return; let table = document.querySelector(`#a4-${formId} .tmz-main-table tbody`); let row = table.querySelector(`tr:nth-child(${rowIndex})`); let checkboxes = row.querySelectorAll(`input[type="checkbox"]`);
    let targetCbs = Array.from(checkboxes).filter(cb => cb.getAttribute('data-role') !== 'sef'); if(targetCbs.length === 0) return; let allChecked = targetCbs.every(cb => cb.checked);
    targetCbs.forEach(cb => { cb.checked = !allChecked; let role = cb.getAttribute('data-role'); window.imzaAtDigital(cb, role, true); }); window.saveToFirebase(true); 
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

// 🌟 ARŞİV İŞLEMLERİ
window.askArchiveDepartment = function(deptId, deptName) { 
    let defaultMonth = new Date().getFullYear() + "-" + String(new Date().getMonth() + 1).padStart(2, '0');
    window.showModal('custom', 'Bölümü Arşivle', '', '📦', 'Kapat');
    let html = `<div style="text-align:left;"><p style="color:var(--dark); font-weight:800; font-size:14px; margin-bottom:15px;">"${deptName}" odaları arşivlendi.</p><label style="font-weight:900; font-size:12px; color:var(--text-gray);">Arşivlenecek Dönem:</label><input type="month" id="archiveMonthInput" class="modal-input" value="${defaultMonth}" style="margin-bottom:20px; font-weight:900;"><button class="btn-action" style="width:100%; justify-content:center; background:var(--dark); color:white;" onclick="window.executeArchive('${deptId}')">Arşivle ve Sıfırla</button></div>`;
    document.getElementById('modalCustomContent').innerHTML = html; document.getElementById('modalCustomContent').style.display = 'block'; document.getElementById('modalButtons').style.display = 'none';
}
window.executeArchive = function(deptId) {
    let secilenAy = document.getElementById('archiveMonthInput').value; if(!secilenAy) return alert("Ay seçin!");
    let d = new Date(secilenAy + "-01"); let ayIsimleri = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]; let yeniAyLabel = ayIsimleri[d.getMonth()] + " " + d.getFullYear();
    let depts = window.shiftMasterDB.departments; let dept = depts.find(x => x.id === deptId); if(!dept) return;
    let batchId = 'BATCH_' + Date.now(); let dateStr = new Date().toLocaleString('tr-TR', { month: 'long', year: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit' }); let islemYapildi = false;
    Object.values(dept.rooms || {}).forEach(r => { if(r.blueprintId || r.formId) { if(!r.archives) r.archives = []; r.archives.push({ id: 'ARC_' + Date.now() + Math.floor(Math.random()*1000), batchId: batchId, date: dateStr, ayLabel: yeniAyLabel, blueprintId: r.blueprintId || r.formId, checks: JSON.parse(JSON.stringify(r.checks || {})), inputs: JSON.parse(JSON.stringify(r.inputs || {})) }); r.checks = {}; if(!r.inputs) r.inputs = {}; r.inputs['inp_ay_yil'] = secilenAy; r.status = 'kirli'; islemYapildi = true; } });
    if(islemYapildi) { window.saveToFirebase(true); window.closeModal(); alert(`"${dept.name}" arşivlendi, ${yeniAyLabel} dönemine geçildi!`); window.renderDashboard(); window.renderArchiveList(); } else { alert("Aktif oda yok!"); }
}
window.deleteArchiveFolder = function(deptId, groupKey, event) { event.stopPropagation(); window.showModal('danger', 'Klasörü Sil', 'Komple silinecek?', '🗑️', 'Sil', null, (confirmed) => { if(confirmed) { let depts = window.shiftMasterDB.departments; let d = depts.find(x => x.id === deptId); if(d && d.rooms) { Object.values(d.rooms).forEach(r => { if(r.archives) { r.archives = Object.values(r.archives).filter(a => { let gKey = a.batchId || a.date.split(' ')[0]; return gKey !== groupKey; }); } }); window.saveToFirebase(true); window.renderArchiveList(); } } }); }
window.deleteArchive = function(roomId, arcId, event) { event.stopPropagation(); window.showModal('danger', 'Arşivi Sil', 'Silinecek?', '🗑️', 'Sil', null, (confirmed) => { if(confirmed) { let depts = window.shiftMasterDB.departments; let roomObj = null; depts.forEach(d => { let r = Object.values(d.rooms || {}).find(x => x.id === roomId); if(r) roomObj = r; }); if(roomObj && roomObj.archives) { roomObj.archives = Object.values(roomObj.archives).filter(a => a.id !== arcId); window.saveToFirebase(true); window.renderArchiveList(); } } }); }
window.renderArchiveList = function() { const container = document.getElementById('archives-container'); if(!container) return; container.innerHTML = ''; let hasArchive = false; let depts = window.shiftMasterDB.departments ? Object.values(window.shiftMasterDB.departments).filter(d => d != null) : []; depts.forEach(dept => { let deptArchives = {}; let rms = dept.rooms ? Object.values(dept.rooms).filter(r => r != null) : []; rms.forEach(room => { let arcs = room.archives ? Object.values(room.archives).filter(a => a != null) : []; arcs.forEach(arc => { hasArchive = true; let groupKey = arc.batchId || arc.date.split(' ')[0]; let groupLabel = arc.ayLabel ? `${arc.ayLabel} Arşivi (${arc.date.split(' ')[0]})` : `Tarih: ${arc.date.split(' ')[0]}`; if(!deptArchives[groupKey]) deptArchives[groupKey] = { label: groupLabel, items: [] }; deptArchives[groupKey].items.push({ room: room, arc: arc }); }); }); if(Object.keys(deptArchives).length > 0) { let html = `<div class="dept-card" style="background:white;"><h3 class="dept-title" style="font-size:18px;">📁 ${dept.name} Klasörü</h3><div style="display:flex; flex-direction:column; gap:10px; margin-top:15px;">`; Object.keys(deptArchives).forEach(key => { let group = deptArchives[key]; html += `<div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:12px; padding:15px;"><div style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'grid' : 'none'"><h4 style="margin:0; color:var(--primary); font-size:15px;">🗂️ ${group.label} <span style="font-size:11px; color:var(--text-gray);">(${group.items.length} Form)</span></h4><div style="display:flex; gap:10px; align-items:center;"><button onclick="window.deleteArchiveFolder('${dept.id}', '${key}', event)" style="background:var(--danger); color:white; border:none; padding:4px 10px; border-radius:5px; font-weight:bold; cursor:pointer; font-size:12px;">SİL</button><span style="color:var(--primary);">▼</span></div></div><div class="room-grid" style="display:none; margin-top:15px; padding-top:15px; border-top:1px dashed #cbd5e1;">`; group.items.forEach(item => { html += `<div class="form-card archive" style="background:white; border:1px solid #cbd5e1; position:relative; padding:15px; text-align:center; display:flex; flex-direction:column; align-items:center; cursor:pointer;" onclick="window.openArchiveView('${item.room.id}', '${item.arc.id}')"><button onclick="window.deleteArchive('${item.room.id}', '${item.arc.id}', event)" style="position:absolute; top:5px; right:5px; background:var(--danger); color:white; border:none; border-radius:5px; width:24px; height:24px; font-weight:bold; cursor:pointer; box-shadow:0 2px 5px rgba(0,0,0,0.5);">X</button><div style="width:100%;"><div style="font-size:30px; margin-bottom:5px;">📄</div><div style="font-weight:900; font-size:14px; color:var(--dark);">${item.room.name}</div><div style="font-size:10px; color:var(--text-gray); margin-top:5px;">${item.arc.date.split(' ')[1]}</div></div></div>`; }); html += `</div></div>`; }); html += `</div></div>`; container.innerHTML += html; } }); if(!hasArchive) container.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-gray); font-weight:800; background:white; border-radius:15px;">Arşiv yok.</div>`; }
window.openArchiveView = function(roomId, arcId) { let room = null; let depts = Object.values(window.shiftMasterDB.departments); depts.forEach(d => { let rms = Object.values(d.rooms); let r = rms.find(x => x.id === roomId); if(r) room = r; }); if(!room) return; let arc = Object.values(room.archives).find(a => a.id === arcId); if(!arc) return; let bp = Object.values(window.shiftMasterDB.blueprints).find(b => b.id === arc.blueprintId); if(!bp) return alert("Bu arşivin şablonu silinmiş."); window.isArchiveView = true; window.activeArchiveObj = arc; window.activeRoomId = null; let viewer = document.getElementById('blueprintViewerSection'); if(viewer) { viewer.style.setProperty('display', 'block', 'important'); window.scrollTo(0,0); } document.body.style.overflow = 'hidden'; document.getElementById('designToolbar').style.display = 'none'; document.getElementById('btnSaveBlueprint').style.display = 'none'; let titleEl = document.getElementById('viewerRoomTitle'); if(titleEl) { titleEl.style.display = 'block'; titleEl.innerText = `🗂️ ARŞİV: ${room.name} (${arc.date})`; } if(bp.image) { window.editorBoxes = (bp.boxes || []).map(box => { let savedState = arc.checks[box.id]; return { ...box, checked: savedState ? savedState.checked : false, signer: savedState ? savedState.signer : null, role: savedState ? savedState.role : box.role }; }); window.pdfImageBase64 = bp.image; if(document.getElementById('dynamic-forms-container')) document.getElementById('dynamic-forms-container').innerHTML = ''; if(document.getElementById('editorArea')) document.getElementById('editorArea').style.display = 'flex'; window.drawCanvasAndBoxes(); } else { if(document.getElementById('editorArea')) document.getElementById('editorArea').style.display = 'none'; if(window.buildDigitalForm) window.buildDigitalForm(bp, true); } setTimeout(() => { if(arc.inputs) { document.querySelectorAll('.editable-input').forEach((inp, idx) => { let key = inp.id || 'inp_' + idx; if(arc.inputs[key] !== undefined) { inp.value = arc.inputs[key]; inp.disabled = true; } }); } }, 150); }

// 🌟 DİĞER MODALLAR VE ARAÇLAR
window.readRoomMessages = function(deptId, roomId, roomName) { let depts = Object.values(window.shiftMasterDB.departments); let d = depts.find(x => x.id === deptId); let r = Object.values(d.rooms).find(x => x.id === roomId); if(r && r.messages) { let msgs = Object.values(r.messages).filter(m => m != null); if(msgs.length === 0) { window.closeModal(); return; } let html = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid rgba(0,0,0,0.1); padding-bottom:10px;"><h3 style="margin:0; color:var(--dark);">📌 ${roomName} Notları</h3><button onclick="window.closeModal()" style="background:var(--danger); color:white; border:none; border-radius:8px; padding:6px 12px; font-weight:900; cursor:pointer;">X KAPAT</button></div><div style="max-height:300px; overflow-y:auto; text-align:left; margin-bottom:15px; padding-right:5px;">`; msgs.forEach(m => { let isSelf = m.sender === 'Yönetici' && window.isSystemAdmin; let bg = m.sender.includes('HASTA') ? '#fef3c7' : (isSelf ? '#e0f2fe' : '#f1f5f9'); let color = '#0f172a'; let borderCol = m.sender.includes('HASTA') ? '#f59e0b' : (isSelf ? '#0ea5e9' : '#cbd5e1'); html += `<div style="background:${bg}; padding:15px; border-radius:12px; margin-bottom:12px; border:2px solid ${borderCol}; position:relative; color:${color};"><div style="font-size:12px; font-weight:900; margin-bottom:8px; opacity:0.9;">${m.sender} <span style="font-weight:normal; font-size:10px; opacity:0.7; margin-left:10px;">${m.date}</span></div><div style="font-size:15px; font-weight:800;">${m.text}</div><button type="button" onclick="window.deleteMessage('${deptId}', '${roomId}', ${m.id})" style="position:absolute; right:12px; top:12px; background:var(--danger); color:white; border:none; border-radius:6px; padding:6px 12px; font-size:11px; font-weight:900; cursor:pointer;">SİL</button></div>`; }); html += `</div><div style="display:flex; gap:10px;"><textarea id="replyMsgInput" style="flex:1; padding:12px; border-radius:10px; border:1px solid #cbd5e1; background:#ffffff; color:#0f172a; resize:none; font-family:'Nunito'; font-weight:600; font-size:14px;" rows="2" placeholder="Cevap veya yeni not yaz..."></textarea><button type="button" class="btn-action" style="background:var(--success); font-size:14px;" onclick="window.replyMessage('${deptId}', '${roomId}', '${roomName}')">GÖNDER</button></div>`; window.showModal('custom', '', '', '', ''); document.getElementById('modalCustomContent').style.display = 'block'; document.getElementById('modalCustomContent').innerHTML = html; document.getElementById('modalButtons').style.display = 'none'; } }
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

window.askDepartmentName = function() { window.showModal('input', 'Yeni Bölüm', 'Adı:', '🏥', 'Oluştur', 'Örn: Acil', (val) => { if(val) { window.shiftMasterDB.departments.push({ id: 'dept_' + Date.now(), name: val, rooms: [] }); window.saveToFirebase(true); } }); }
window.askDeleteDept = function(id, name) { window.showModal('danger', 'Sil', `"${name}" silinecek?`, '⚠️', 'Sil', null, (confirmed) => { if(confirmed) { window.shiftMasterDB.departments = Object.values(window.shiftMasterDB.departments).filter(d => d && d.id !== id); window.saveToFirebase(true); } }); }
window.askRoomName = function(deptId) { window.showModal('input', 'Oda Ekle', 'Adı veya Sayı:', '🚪', 'Ekle', 'Örn: 101', (val) => { if(val) { let depts = Object.values(window.shiftMasterDB.departments); let tDept = depts.find(d => d.id === deptId); if(!tDept.rooms) tDept.rooms = []; let rms = Object.values(tDept.rooms); let num = parseInt(val); if(!isNaN(num) && num > 0 && num <= 100 && val.trim() == num.toString()) { for(let i=1; i<=num; i++) rms.push({ id: 'room_' + Date.now() + '_' + i, name: 'Oda ' + i, status: 'kirli', blueprintId: null, checks: {}, inputs: {}, messages: [], archives: [] }); } else { rms.push({ id: 'room_' + Date.now(), name: val, status: 'kirli', blueprintId: null, checks: {}, inputs: {}, messages: [], archives: [] }); } tDept.rooms = rms; window.saveToFirebase(true); } }); }
window.askDeleteRoom = function(deptId, roomId, name) { window.showModal('danger', 'Sil', `"${name}" silinecek?`, '🗑️', 'Sil', null, (confirmed) => { if(confirmed) { let depts = Object.values(window.shiftMasterDB.departments); let tDept = depts.find(d => d.id === deptId); tDept.rooms = Object.values(tDept.rooms).filter(r => r && r.id !== roomId); window.saveToFirebase(true); } }); }
window.askRenameRoom = function() { if(window.ctxDept && window.ctxRoom) { let depts = Object.values(window.shiftMasterDB.departments); let d = depts.find(x => x.id === window.ctxDept); let r = Object.values(d.rooms).find(x => x.id === window.ctxRoom); window.showModal('input', 'Adını Değiştir', 'Adı:', '✏️', 'Kaydet', 'Örn: 101', (val) => { if(val) { r.name = val; window.saveToFirebase(true);} }); } }
window.assignBlueprint = function(bpId) { if(window.ctxDept && window.ctxRoom) { let depts = Object.values(window.shiftMasterDB.departments); let d = depts.find(x => x.id === window.ctxDept); let r = Object.values(d.rooms).find(x => x.id === window.ctxRoom); r.blueprintId = bpId; window.saveToFirebase(true); window.showModal('success', 'Atandı!', `Başarılı.`, '✅', 'Tamam'); } }
window.leaveRoomMessage = function() { if(window.ctxDept && window.ctxRoom) { let depts = Object.values(window.shiftMasterDB.departments); let d = depts.find(x => x.id === window.ctxDept); let r = Object.values(d.rooms).find(x => x.id === window.ctxRoom); window.showModal('input', 'Not Bırak', 'Not:', '💬', 'Gönder', 'Örn: Acil...', (val) => { if(val) { if(!r.messages) r.messages = []; let senderName = window.isSystemAdmin ? 'Yönetici' : window.aktifPersonelAd.split(' ')[0]; r.messages.push({ id: Date.now(), text: val, sender: senderName, date: new Date().toLocaleString('tr-TR') }); window.saveToFirebase(true); } }); } }
window.generateRoomQR = function(deptId, roomId) { let depts = window.shiftMasterDB.departments ? Object.values(window.shiftMasterDB.departments) : []; let d = depts.find(x => x.id === deptId); let r = d ? Object.values(d.rooms).find(x => x.id === roomId) : null; if(!r) return; document.getElementById('contextMenu').classList.remove('active'); let qrUrl = window.location.origin + window.location.pathname.replace('shiftmaster.html', 'personel_portal.html') + '?qr=' + roomId; let qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}`; let printWin = window.open('', '_blank'); printWin.document.write(`<html><head><title>${r.name} - QR KOD</title></head><body style="text-align:center; font-family:Arial, sans-serif; padding-top:40px;"><img src="${window.SAGLIK_LOGOSU_BASE64}" style="width:100px; margin-bottom:10px;"><h2 style="font-size:35px; color:#ef4444; margin-bottom:5px;">DÖŞEMEALTI DEVLET HASTANESİ</h2><h1 style="font-size:40px; margin-bottom:10px;">${d.name}</h1><h2 style="font-size:60px; margin-top:0; color:#0284c7;">${r.name}</h2><img src="${qrApiUrl}" style="width:400px; height:400px; margin:20px 0; border:5px solid #000; padding:10px; border-radius:20px;"><h3 style="font-size:28px; color:#475569;">Talepleriniz için lütfen QR kodu okutun.</h3><script>setTimeout(() => { window.print(); }, 1500);<\/script></body></html>`); }
window.manageAdminsModal = function() { db.ref("personel_havuzu").once("value").then(snap => { let optionsHtml = '<option value="" style="color:black;">-- Seçin --</option>'; if (snap.val()) { let havuz = Object.values(snap.val()); let isimler = havuz.map(k => typeof k === 'string' ? k : (k.name || "")); isimler = isimler.map(n => n.includes("-") ? n.split("-")[1].trim() : n); isimler.sort((a,b) => a.localeCompare(b, 'tr')).forEach(isim => { if (isim) optionsHtml += `<option value="${isim}" style="color:black;">${isim}</option>`; }); } let html = `<div style="text-align:left; width:100%;"><select id="newAdminInput" class="modal-input" style="margin-bottom:15px; width:100%; padding:12px; background:#f8fafc; color:#0f172a; border:1px solid #cbd5e1;">${optionsHtml}</select><button class="btn-action" style="width:100%; justify-content:center; background:var(--primary); margin-bottom:20px;" onclick="window.addAdmin()">Şef Ata</button><div id="adminChipsContainer" style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center;"></div></div>`; window.showModal('custom', '👑 Şef Ata', '', '', 'Kapat', null, () => { window.checkIsAdmin(); }); document.getElementById('modalCustomContent').innerHTML = html; document.getElementById('modalCustomContent').style.display = 'block'; window.renderAdminChips(); }); }
window.renderAdminChips = function() { const container = document.getElementById('adminChipsContainer'); if(!container) return; container.innerHTML = ''; let yList = window.shiftMasterDB.yoneticiler ? Object.values(window.shiftMasterDB.yoneticiler) : []; yList.forEach(ad => { container.innerHTML += `<div class="admin-chip" style="background:#e0f2fe; color:#0369a1; padding:5px 10px; border-radius:8px; display:flex; gap:5px; font-weight:800;">${ad} <span onclick="window.removeAdmin('${ad}')" style="cursor:pointer; color:red;">×</span></div>`; }); }
window.addAdmin = function() { let val = document.getElementById('newAdminInput').value.trim(); if(val) { if(!window.shiftMasterDB.yoneticiler) window.shiftMasterDB.yoneticiler = []; let yList = Object.values(window.shiftMasterDB.yoneticiler); if(!yList.includes(val)) { yList.push(val); window.shiftMasterDB.yoneticiler = yList; window.saveToFirebase(true); window.renderAdminChips(); } } }
window.removeAdmin = function(name) { let yList = Object.values(window.shiftMasterDB.yoneticiler || []); window.shiftMasterDB.yoneticiler = yList.filter(y => y !== name); window.saveToFirebase(true); window.renderAdminChips(); };