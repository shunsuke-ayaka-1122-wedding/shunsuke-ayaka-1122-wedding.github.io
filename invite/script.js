/**
 * Wedding RSVP - Form Logic & Data Storage
 * Uses localStorage for persistence
 */

const STORAGE_KEY = 'wedding_rsvp_responses';

// ============================================================
// FIREBASE SETUP
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyAuqVqpHIIAfcqdMpNKHuEAKkFNei13BSc",
  authDomain: "shunayakaweddingsite.firebaseapp.com",
  projectId: "shunayakaweddingsite",
  storageBucket: "shunayakaweddingsite.firebasestorage.app",
  messagingSenderId: "61051359742",
  appId: "1:61051359742:web:e87d66bf683a5ef4e930af"
};

// Initialize Firebase (Compat SDK)
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
}
const db = typeof firebase !== 'undefined' ? firebase.firestore() : null;

// ============================================================
// STEP NAVIGATION
// ============================================================
let currentStep = 1;
const totalSteps = 4;

function updateProgress() {
  const steps = document.querySelectorAll('.rsvp-progress__step');
  const lines = document.querySelectorAll('.rsvp-progress__line');

  steps.forEach((step, i) => {
    const stepNum = i + 1;
    step.classList.remove('active', 'completed');
    if (stepNum === currentStep) step.classList.add('active');
    if (stepNum < currentStep) step.classList.add('completed');
  });

  lines.forEach((line, i) => {
    line.classList.toggle('active', i < currentStep - 1);
  });
}

function showStep(step) {
  document.querySelectorAll('.rsvp-step').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`step-${step}`);
  if (target) {
    target.classList.add('active');
    
    // Toggle absent fields on step 2
    if (step === 2) {
      const attendance = document.querySelector('input[name="attendance"]:checked');
      const isAbsent = attendance && attendance.value === '欠席';
      document.querySelectorAll('.group-absent-hide').forEach(el => {
        el.style.display = isAbsent ? 'none' : 'block';
      });
    }

    // Render allergies dynamically if on step 3
    if (step === 3) renderStep3Allergies();

    // Generate review if on step 4
    if (step === 4) generateReview();
  }
  currentStep = step;
  updateProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nextStep(step) {
  // Validate current step before advancing
  if (!validateStep(currentStep)) return;

  // Skip meal step if not attending
  const attendance = document.querySelector('input[name="attendance"]:checked');
  if (step === 3 && attendance && attendance.value === '欠席') {
    showStep(4);
    return;
  }

  showStep(step);
}

function prevStep(step) {
  // Skip meal step if not attending
  const attendance = document.querySelector('input[name="attendance"]:checked');
  if (step === 3 && attendance && attendance.value === '欠席') {
    showStep(2);
    return;
  }

  showStep(step);
}

// ============================================================
// VALIDATION
// ============================================================
function validateStep(step) {
  let isValid = true;

  // Clear all errors first
  clearErrors();

  if (step === 1) {
    const attendance = document.querySelector('input[name="attendance"]:checked');
    if (!attendance) {
      showError('err-attendance');
      isValid = false;
    }
  }

  if (step === 2) {
    const attendance = document.querySelector('input[name="attendance"]:checked');
    const isAbsent = attendance && attendance.value === '欠席';

    const fields = [
      { id: 'last-name', error: 'err-lastName' },
      { id: 'first-name', error: 'err-firstName' }
    ];

    if (!isAbsent) {
      fields.push(
        { id: 'last-name-kana', error: 'err-lastNameKana' },
        { id: 'first-name-kana', error: 'err-firstNameKana' },
        { id: 'postal-code', error: 'err-postalCode' },
        { id: 'address', error: 'err-address' },
        { id: 'email', error: 'err-email' }
      );
    }

    fields.forEach(f => {
      const el = document.getElementById(f.id);
      if (!el.value.trim()) {
        showError(f.error);
        el.classList.add('error');
        isValid = false;
      }
    });

    if (!isAbsent) {
      // Email format check
      const emailEl = document.getElementById('email');
      if (emailEl.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
        showError('err-email');
        emailEl.classList.add('error');
        isValid = false;
      }

      // Relationship
      const rel = document.getElementById('relationship');
      if (!rel.value) {
        showError('err-relationship');
        rel.classList.add('error');
        isValid = false;
      }

      // Validate companions if any
      companions.forEach(comp => {
        const lastEl = document.getElementById(`comp-last-${comp.id}`);
        const firstEl = document.getElementById(`comp-first-${comp.id}`);
        const lastKanaEl = document.getElementById(`comp-last-kana-${comp.id}`);
        const firstKanaEl = document.getElementById(`comp-first-kana-${comp.id}`);

        if (lastEl && !lastEl.value.trim()) {
          showError(`err-comp-last-${comp.id}`);
          lastEl.classList.add('error');
          isValid = false;
        }
        if (firstEl && !firstEl.value.trim()) {
          showError(`err-comp-first-${comp.id}`);
          firstEl.classList.add('error');
          isValid = false;
        }
        if (lastKanaEl && !lastKanaEl.value.trim()) {
          showError(`err-comp-last-kana-${comp.id}`);
          lastKanaEl.classList.add('error');
          isValid = false;
        }
        if (firstKanaEl && !firstKanaEl.value.trim()) {
          showError(`err-comp-first-kana-${comp.id}`);
          firstKanaEl.classList.add('error');
          isValid = false;
        }
      });
    }
  }

  if (step === 3) {
    // Validate representative allergy
    const repSelect = document.getElementById('allergy-select');
    const repInput = document.getElementById('allergy');
    if (repSelect && repSelect.value === 'あり' && (!repInput || !repInput.value.trim())) {
      showError('err-allergy');
      if (repInput) repInput.classList.add('error');
      isValid = false;
    }

    // Validate companions allergy
    companions.forEach(comp => {
      const compSelect = document.getElementById(`comp-allergy-select-${comp.id}`);
      const compInput = document.getElementById(`comp-allergy-input-${comp.id}`);
      if (compSelect && compSelect.value === 'あり' && (!compInput || !compInput.value.trim())) {
        showError(`err-comp-allergy-${comp.id}`);
        if (compInput) compInput.classList.add('error');
        isValid = false;
      }
    });
  }

  if (!isValid) {
    scrollToFirstError();
  }

  return isValid;
}

function scrollToFirstError() {
  setTimeout(() => {
    const activeStepEl = document.querySelector('.rsvp-step.active') || document;
    
    // Find first error specifically inside the currently active step
    const firstError = activeStepEl.querySelector('.form-input.error, .form-select.error, .form-error-msg.visible');
    if (firstError) {
      const scrollTarget = firstError.closest('.form-group') || firstError;
      const rect = scrollTarget.getBoundingClientRect();
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const targetY = currentScrollTop + rect.top - 80;

      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: 'smooth'
      });
      
      const inputEl = firstError.classList.contains('form-input') || firstError.classList.contains('form-select') 
        ? firstError 
        : scrollTarget.querySelector('.form-input, .form-select');
        
      if (inputEl) {
        setTimeout(() => {
          try {
            inputEl.focus({ preventScroll: true });
          } catch(e) {}
        }, 300);
      }
    }
  }, 40);
}

function showError(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('visible');
}

function clearErrors() {
  document.querySelectorAll('.form-error-msg').forEach(e => e.classList.remove('visible'));
  document.querySelectorAll('.form-input, .form-select').forEach(e => e.classList.remove('error'));
}

// ============================================================
// COMPANION MANAGEMENT (連名・同伴者)
// ============================================================
let companions = [];
let representativeAllergySelect = 'なし';
let representativeAllergyText = '';

function addCompanion() {
  const newComp = {
    id: 'c_' + Date.now() + Math.random().toString(36).substr(2, 4),
    lastName: document.getElementById('last-name') ? document.getElementById('last-name').value.trim() : '',
    firstName: '',
    lastNameKana: document.getElementById('last-name-kana') ? document.getElementById('last-name-kana').value.trim() : '',
    firstNameKana: '',
    relationship: '配偶者',
    allergy: '',
    childInfo: 'お子様ランチ'
  };
  companions.push(newComp);
  renderCompanions();
}

function removeCompanion(id) {
  companions = companions.filter(c => c.id !== id);
  renderCompanions();
}

function updateCompanionField(id, field, value) {
  const comp = companions.find(c => c.id === id);
  if (comp) {
    comp[field] = value;
  }
}

function renderCompanions() {
  const container = document.getElementById('companions-container');
  if (!container) return;

  if (companions.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = companions.map((comp, idx) => `
    <div class="companion-card" id="card-${comp.id}">
      <div class="companion-header">
        <div class="companion-title">
          <span>お連れ様 ${idx + 1}</span>
          <span class="companion-badge">連名</span>
        </div>
        <button type="button" class="companion-remove" onclick="removeCompanion('${comp.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          削除
        </button>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="comp-last-${comp.id}">姓 <span class="required">必須</span></label>
          <input type="text" class="form-input comp-input" id="comp-last-${comp.id}" 
                 value="${comp.lastName}" placeholder="鳥越" 
                 oninput="updateCompanionField('${comp.id}', 'lastName', this.value); this.classList.remove('error'); document.getElementById('err-comp-last-${comp.id}')?.classList.remove('visible');" required>
          <p class="form-error-msg" id="err-comp-last-${comp.id}">お連れ様の姓を入力してください</p>
        </div>
        <div class="form-group">
          <label class="form-label" for="comp-first-${comp.id}">名 <span class="required">必須</span></label>
          <input type="text" class="form-input comp-input" id="comp-first-${comp.id}" 
                 value="${comp.firstName}" placeholder="花子" 
                 oninput="updateCompanionField('${comp.id}', 'firstName', this.value); this.classList.remove('error'); document.getElementById('err-comp-first-${comp.id}')?.classList.remove('visible');" required>
          <p class="form-error-msg" id="err-comp-first-${comp.id}">お連れ様の名を入力してください</p>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="comp-last-kana-${comp.id}">セイ <span class="required">必須</span></label>
          <input type="text" class="form-input comp-input" id="comp-last-kana-${comp.id}" 
                 value="${comp.lastNameKana}" placeholder="トリゴエ" 
                 oninput="updateCompanionField('${comp.id}', 'lastNameKana', this.value); this.classList.remove('error'); document.getElementById('err-comp-last-kana-${comp.id}')?.classList.remove('visible');" required>
          <p class="form-error-msg" id="err-comp-last-kana-${comp.id}">フリガナを入力してください</p>
        </div>
        <div class="form-group">
          <label class="form-label" for="comp-first-kana-${comp.id}">メイ <span class="required">必須</span></label>
          <input type="text" class="form-input comp-input" id="comp-first-kana-${comp.id}" 
                 value="${comp.firstNameKana}" placeholder="ハナコ" 
                 oninput="updateCompanionField('${comp.id}', 'firstNameKana', this.value); this.classList.remove('error'); document.getElementById('err-comp-first-kana-${comp.id}')?.classList.remove('visible');" required>
          <p class="form-error-msg" id="err-comp-first-kana-${comp.id}">フリガナを入力してください</p>
        </div>
      </div>

      <div class="form-group" style="margin-bottom: 0;">
        <label class="form-label" for="comp-rel-${comp.id}">ご関係 <span class="required">必須</span></label>
        <select class="form-select comp-input" id="comp-rel-${comp.id}" 
                onchange="updateCompanionField('${comp.id}', 'relationship', this.value);" required>
          <option value="配偶者" ${comp.relationship === '配偶者' ? 'selected' : ''}>ご夫婦（配偶者）</option>
          <option value="お子様" ${comp.relationship === 'お子様' ? 'selected' : ''}>お子様</option>
          <option value="ご家族" ${comp.relationship === 'ご家族' ? 'selected' : ''}>ご家族（ご両親・ご兄弟など）</option>
          <option value="ご友人" ${comp.relationship === 'ご友人' ? 'selected' : ''}>ご友人</option>
          <option value="その他" ${comp.relationship === 'その他' ? 'selected' : ''}>その他</option>
        </select>
      </div>
    </div>
  `).join('');
}

// ============================================================
// STEP 3 ALLERGIES DYNAMIC RENDERING
// ============================================================
function toggleRepAllergy(val) {
  representativeAllergySelect = val;
  const details = document.getElementById('allergy-details');
  if (details) {
    details.style.display = val === 'あり' ? 'block' : 'none';
    if (val === 'なし') {
      representativeAllergyText = '';
      const input = document.getElementById('allergy');
      if (input) input.value = '';
    }
  }
}

function toggleCompAllergy(id, val) {
  const comp = companions.find(c => c.id === id);
  const details = document.getElementById(`comp-allergy-details-${id}`);
  if (details) {
    details.style.display = val === 'あり' ? 'block' : 'none';
  }
  if (comp && val === 'なし') {
    comp.allergy = '';
    const input = document.getElementById(`comp-allergy-input-${id}`);
    if (input) input.value = '';
  }
}

function renderStep3Allergies() {
  const container = document.getElementById('allergy-cards-container');
  if (!container) return;

  const lastName = document.getElementById('last-name') ? document.getElementById('last-name').value.trim() : '';
  const firstName = document.getElementById('first-name') ? document.getElementById('first-name').value.trim() : '';
  const repName = `${lastName} ${firstName}`.trim() || 'ご本人';

  const hasComps = companions && companions.length > 0;

  let html = '';

  // Representative Card
  html += `
    <div class="form-card" id="meal-card">
      <h2 class="form-card__title">
        <span class="form-card__title-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg></span>
        <span>${hasComps ? `【代表者：${repName} 様】のアレルギー` : 'アレルギー・食事制限について'}</span>
      </h2>
      <p class="form-card__desc">
        ${hasComps ? `${repName} 様のアレルギーや食事制限についてご記入ください。` : 'アレルギーや食事制限がある方はご記入ください。'}
      </p>

      <div class="form-group">
        <label class="form-label" for="allergy-select">アレルギー・食事制限の有無 <span class="required">必須</span></label>
        <select class="form-select" id="allergy-select" name="allergySelect" onchange="toggleRepAllergy(this.value)">
          <option value="なし" ${representativeAllergySelect === 'なし' ? 'selected' : ''}>なし</option>
          <option value="あり" ${representativeAllergySelect === 'あり' ? 'selected' : ''}>あり</option>
        </select>
      </div>
      <div class="form-group" id="allergy-details" style="${representativeAllergySelect === 'あり' ? 'display:block;' : 'display:none;'} margin-top: 16px;">
        <label class="form-label" for="allergy">具体的な内容 <span class="required">必須</span></label>
        <input type="text" class="form-input" id="allergy" name="allergy" value="${representativeAllergyText}" placeholder="例：エビ、カニ、小麦" oninput="representativeAllergyText = this.value; this.classList.remove('error'); document.getElementById('err-allergy')?.classList.remove('visible');">
        <p class="form-error-msg" id="err-allergy">アレルギー等の詳細を入力してください</p>
      </div>
    </div>
  `;

  // Companion Cards
  if (hasComps) {
    companions.forEach((comp, idx) => {
      const compName = `${comp.lastName} ${comp.firstName}`.trim() || `お連れ様 ${idx + 1}`;
      const isChild = comp.relationship === 'お子様';
      const hasAllergy = comp.allergy && comp.allergy.trim() !== '';

      html += `
        <div class="form-card" style="margin-top: 24px; border-top: 2px solid var(--color-gold-light);">
          <h2 class="form-card__title">
            <span class="form-card__title-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
            <span>【お連れ様 ${idx + 1}：${compName} 様】のお食事・アレルギー</span>
          </h2>
          <p class="form-card__desc">
            ${compName} 様（${comp.relationship}）のお食事やアレルギーについてご記入ください。
          </p>

          ${isChild ? `
          <div class="form-group">
            <label class="form-label" for="comp-child-${comp.id}">お子様のお食事・お席について <span class="required">必須</span></label>
            <select class="form-select" id="comp-child-${comp.id}" 
                    onchange="updateCompanionField('${comp.id}', 'childInfo', this.value)">
              <option value="大人料理" ${comp.childInfo === '大人料理' ? 'selected' : ''}>大人と同じお料理</option>
              <option value="お子様ランチ" ${comp.childInfo === 'お子様ランチ' || !comp.childInfo ? 'selected' : ''}>お子様用のお料理（お子様ランチ）</option>
              <option value="お料理なし（席のみ）" ${comp.childInfo === 'お料理なし（席のみ）' ? 'selected' : ''}>お料理不要（お席のみ）</option>
            </select>
          </div>
          ` : ''}

          <div class="form-group">
            <label class="form-label" for="comp-allergy-select-${comp.id}">アレルギー・食事制限の有無 <span class="required">必須</span></label>
            <select class="form-select" id="comp-allergy-select-${comp.id}" 
                    onchange="toggleCompAllergy('${comp.id}', this.value)">
              <option value="なし" ${!hasAllergy ? 'selected' : ''}>なし</option>
              <option value="あり" ${hasAllergy ? 'selected' : ''}>あり</option>
            </select>
          </div>

          <div class="form-group" id="comp-allergy-details-${comp.id}" style="${hasAllergy ? 'display:block;' : 'display:none;'} margin-top: 16px;">
            <label class="form-label" for="comp-allergy-input-${comp.id}">具体的な内容 <span class="required">必須</span></label>
            <input type="text" class="form-input" id="comp-allergy-input-${comp.id}" 
                   value="${comp.allergy}" placeholder="例：卵、乳製品" 
                   oninput="updateCompanionField('${comp.id}', 'allergy', this.value); this.classList.remove('error'); document.getElementById('err-comp-allergy-${comp.id}')?.classList.remove('visible');">
            <p class="form-error-msg" id="err-comp-allergy-${comp.id}">アレルギー等の詳細を入力してください</p>
          </div>
        </div>
      `;
    });
  }

  container.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', () => {
  // Init
  window.scrollTo(0, 0);
  updateProgress();

  // Form submit handler
  const form = document.getElementById('rsvp-form');
  if (form) {
    form.addEventListener('submit', handleSubmit);
  }

  // Clear error on input
  document.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(el => {
    el.addEventListener('input', () => {
      el.classList.remove('error');
      const group = el.closest('.form-group');
      if (group) {
        const errMsg = group.querySelector('.form-error-msg');
        if (errMsg) errMsg.classList.remove('visible');
      }
    });
  });

  document.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', () => {
      clearErrors();
    });
  });
});

// ============================================================
// REVIEW GENERATION
// ============================================================
function generateReview() {
  const container = document.getElementById('review-content');
  const data = collectFormData();

  let html = '<div class="confirm-summary" style="margin: 0; box-shadow: none; padding: 0;">';

  const rows = [
    ['ご出欠', data.attendance],
    ['代表者様 お名前', `${data.lastName} ${data.firstName}`],
  ];

  if (data.attendance !== '欠席') {
    rows.push(['フリガナ', `${data.lastNameKana} ${data.firstNameKana}`]);

    if (data.companions && data.companions.length > 0) {
      rows.push(['ご出席人数', `合計 ${data.companions.length + 1}名（代表者様 1名 ＋ お連れ様 ${data.companions.length}名）`]);
      data.companions.forEach((c, i) => {
        let compText = `<strong>${c.lastName} ${c.firstName} 様</strong>（${c.relationship}）<br><span style="font-size:0.75rem; color:#888;">フリガナ: ${c.lastNameKana} ${c.firstNameKana}`;
        if (c.childInfo) compText += ` / お食事: ${c.childInfo}`;
        if (c.allergy) compText += ` / アレルギー: ${c.allergy}`;
        compText += `</span>`;
        rows.push([`お連れ様 ${i + 1}`, compText]);
      });
    }

    rows.push(['郵便番号', data.postalCode]);
    rows.push(['ご住所', data.address]);
    rows.push(['メールアドレス', data.email]);
    if (data.phone) rows.push(['電話番号', data.phone]);
    rows.push(['新郎新婦との関係', data.relationship]);
    if (data.allergy) rows.push(['代表者様 アレルギー', data.allergy]);
    rows.push(['送迎バス', data.shuttle]);
  }

  if (data.message) rows.push(['メッセージ', data.message]);

  rows.forEach(([label, value]) => {
    html += `
      <div class="confirm-summary__row">
        <span class="confirm-summary__label">${label}</span>
        <span class="confirm-summary__value">${value || '—'}</span>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

// ============================================================
// DATA COLLECTION
// ============================================================
function collectFormData() {
  const attendance = document.querySelector('input[name="attendance"]:checked');
  const shuttle = document.querySelector('input[name="shuttle"]:checked');
  const isAbsent = attendance && attendance.value === '欠席';

  return {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    timestamp: new Date().toISOString(),
    attendance: attendance ? attendance.value : '',
    lastName: document.getElementById('last-name').value.trim(),
    firstName: document.getElementById('first-name').value.trim(),
    lastNameKana: document.getElementById('last-name-kana') ? document.getElementById('last-name-kana').value.trim() : '',
    firstNameKana: document.getElementById('first-name-kana') ? document.getElementById('first-name-kana').value.trim() : '',
    email: document.getElementById('email') ? document.getElementById('email').value.trim() : '',
    postalCode: document.getElementById('postal-code') ? document.getElementById('postal-code').value.trim() : '',
    address: document.getElementById('address') ? document.getElementById('address').value.trim() : '',
    phone: document.getElementById('phone') ? document.getElementById('phone').value.trim() : '',
    relationship: document.getElementById('relationship') ? document.getElementById('relationship').value : '',
    allergy: document.getElementById('allergy-select') && document.getElementById('allergy-select').value === 'あり' ? document.getElementById('allergy').value.trim() : 'なし',
    shuttle: shuttle ? shuttle.value : '利用しない',
    message: document.getElementById('message') ? document.getElementById('message').value.trim() : '',
    companions: isAbsent ? [] : companions.map(c => ({
      id: c.id,
      lastName: c.lastName.trim(),
      firstName: c.firstName.trim(),
      lastNameKana: c.lastNameKana.trim(),
      firstNameKana: c.firstNameKana.trim(),
      relationship: c.relationship,
      allergy: c.allergy ? c.allergy.trim() : '',
      childInfo: c.childInfo ? c.childInfo.trim() : ''
    }))
  };
}

// ============================================================
// FORM SUBMISSION
// ============================================================
async function handleSubmit(e) {
  e.preventDefault();

  // Validate all steps
  if (!validateStep(currentStep)) return;

  if (!confirm("入力内容を送信しますか？")) {
    return;
  }

  const data = collectFormData();

  // Show loading state
  const submitBtn = document.querySelector('button[onclick="handleSubmit(event)"]') || document.querySelector('button[type="submit"]');
  const originalText = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.innerHTML = '送信中...';
    submitBtn.disabled = true;
  }

  try {
    await saveResponse(data);
    showConfirmation(data);
  } catch (err) {
    console.error("保存エラー:", err);
    alert("送信に失敗しました。もう一度お試しください。");
    if (submitBtn) {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  }
}

async function saveResponse(data) {
  const saveToLocal = (data) => {
    const responses = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    responses.push(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(responses));
  };

  if (db) {
    try {
      await db.collection("responses").doc(data.id).set(data);
    } catch (error) {
      console.warn("Firebase save failed (check rules/setup). Falling back to localStorage.", error);
      saveToLocal(data);
    }
  } else {
    saveToLocal(data);
  }
}

function showConfirmation(data) {
  // Hide form, show confirmation
  document.getElementById('form-container').style.display = 'none';
  document.getElementById('progress')?.closest('.rsvp-form-container')?.style && 
    (document.getElementById('form-container').style.display = 'none');

  const confirmScreen = document.getElementById('confirm-screen');
  confirmScreen.classList.add('active');

  // Update message based on attendance
  const msgEl = document.getElementById('confirm-message');
  if (data.attendance === '欠席') {
    msgEl.innerHTML = `
      ご連絡いただきありがとうございます。<br>
      残念ですが、またの機会にお会いできることを<br>
      楽しみにしています。
    `;
    document.querySelector('.confirm-icon').innerHTML = '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-terra)" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>';
  }

  // Populate summary
  const summary = document.getElementById('confirm-summary');
  const rows = [
    ['ご出欠', data.attendance],
    ['代表者様 お名前', `${data.lastName} ${data.firstName}`],
  ];

  if (data.attendance !== '欠席') {
    if (data.companions && data.companions.length > 0) {
      rows.push(['ご出席人数', `合計 ${data.companions.length + 1}名（代表者様 1名 ＋ お連れ様 ${data.companions.length}名）`]);
      data.companions.forEach((c, i) => {
        let compText = `${c.lastName} ${c.firstName} 様（${c.relationship}）`;
        if (c.childInfo) compText += ` / ${c.childInfo}`;
        if (c.allergy) compText += ` / アレルギー: ${c.allergy}`;
        rows.push([`お連れ様 ${i + 1}`, compText]);
      });
    }
    rows.push(['メールアドレス', data.email]);
    rows.push(['新郎新婦との関係', data.relationship]);
    if (data.allergy) rows.push(['代表者様 アレルギー', data.allergy]);
    rows.push(['送迎バス', data.shuttle]);
  }

  if (data.message) rows.push(['メッセージ', data.message]);

  let html = '<div class="confirm-summary__title">回答内容</div>';
  rows.forEach(([label, value]) => {
    html += `
      <div class="confirm-summary__row">
        <span class="confirm-summary__label">${label}</span>
        <span class="confirm-summary__value">${value || '—'}</span>
      </div>
    `;
  });
  summary.innerHTML = html;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// ADMIN PAGE FUNCTIONS (shared)
// ============================================================
async function getResponses() {
  if (db) {
    const snapshot = await db.collection("responses").get();
    const responses = [];
    snapshot.forEach(doc => {
      responses.push(doc.data());
    });
    return responses;
  }
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

async function deleteResponse(id) {
  if (db) {
    await db.collection("responses").doc(id).delete();
  } else {
    const responses = (await getResponses()).filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(responses));
  }
}

async function clearAllResponses() {
  if (db) {
    const snapshot = await db.collection("responses").get();
    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

async function exportCSV() {
  const responses = await getResponses();
  if (responses.length === 0) {
    alert('エクスポートするデータがありません');
    return;
  }

  const headers = [
    '回答日時', 'ご出欠', '区分', '姓', '名', 'セイ', 'メイ',
    '新郎新婦との関係', '郵便番号', 'ご住所', 'メールアドレス', '電話番号',
    'アレルギー・食事制限', '送迎バス', 'メッセージ'
  ];

  const rows = [];
  responses.forEach(r => {
    const hasComps = r.companions && r.companions.length > 0;
    // Representative row
    rows.push([
      new Date(r.timestamp).toLocaleString('ja-JP'),
      r.attendance,
      hasComps ? `代表者（連名 合計${r.companions.length + 1}名）` : '単身',
      r.lastName,
      r.firstName,
      r.lastNameKana,
      r.firstNameKana,
      r.relationship,
      r.postalCode ? '〒' + r.postalCode : '',
      r.address || '',
      r.email,
      r.phone || '',
      r.allergy || 'なし',
      r.shuttle || '利用しない',
      r.message || ''
    ]);

    // Companions rows
    if (hasComps) {
      r.companions.forEach((c, idx) => {
        let allergyAndChild = c.allergy || 'なし';
        if (c.childInfo) allergyAndChild += ` [食事: ${c.childInfo}]`;

        rows.push([
          '〃',
          r.attendance,
          `└ 連名同伴${idx + 1}（${r.lastName} ${r.firstName}様のお連れ様）`,
          c.lastName,
          c.firstName,
          c.lastNameKana,
          c.firstNameKana,
          c.relationship,
          '(代表者と同)',
          '(代表者と同)',
          '(代表者と同)',
          '(代表者と同)',
          allergyAndChild,
          r.shuttle || '利用しない',
          ''
        ]);
      });
    }
  });

  // BOM for Excel compatibility
  let csv = '\uFEFF' + headers.join(',') + '\n';
  rows.forEach(row => {
    csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rsvp_responses_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function addSampleData() {
  const sampleData = [
    {
      id: 's1', timestamp: new Date().toISOString(), attendance: '出席',
      lastName: '田中', firstName: '太郎', lastNameKana: 'タナカ', firstNameKana: 'タロウ',
      postalCode: '854-0012', address: '長崎県諫早市本町1-1',
      email: 'tanaka@example.com', phone: '090-1111-2222', relationship: '新郎友人',
      allergy: 'なし', shuttle: '利用する（諫早駅）', message: '結婚おめでとう！夫婦で楽しみにしてます！',
      companions: [
        {
          id: 'c1_1', lastName: '田中', firstName: '花子', lastNameKana: 'タナカ', firstNameKana: 'ハナコ',
          relationship: '配偶者', allergy: '甲殻類（エビ・カニ）', childInfo: ''
        },
        {
          id: 'c1_2', lastName: '田中', firstName: '結衣', lastNameKana: 'タナカ', firstNameKana: 'ユイ',
          relationship: 'お子様', allergy: '', childInfo: 'お子様ランチ'
        }
      ]
    },
    {
      id: 's2', timestamp: new Date(Date.now() - 86400000).toISOString(), attendance: '出席',
      lastName: '佐藤', firstName: '美咲', lastNameKana: 'サトウ', firstNameKana: 'ミサキ',
      postalCode: '812-0012', address: '福岡県福岡市博多区1-1',
      email: 'sato@example.com', phone: '080-3333-4444', relationship: '新婦友人',
      allergy: 'なし', shuttle: '利用しない', message: '招待ありがとう！当日すっごく楽しみにしてるね♡',
      companions: []
    },
    {
      id: 's3', timestamp: new Date(Date.now() - 172800000).toISOString(), attendance: '欠席',
      lastName: '山本', firstName: '一郎', lastNameKana: 'ヤマモト', firstNameKana: 'イチロウ',
      postalCode: '', address: '',
      email: 'yamamoto@example.com', phone: '', relationship: '新郎同僚',
      allergy: 'なし', shuttle: '', message: '残念ながら出張と重なってしまい出席できません。末永いお幸せを心よりお祈り申し上げます。',
      companions: []
    },
    {
      id: 's4', timestamp: new Date(Date.now() - 259200000).toISOString(), attendance: '出席',
      lastName: '鈴木', firstName: '健一', lastNameKana: 'スズキ', firstNameKana: 'ケンイチ',
      postalCode: '856-0814', address: '長崎県大村市松並1-1',
      email: 'suzuki@example.com', phone: '070-5555-6666', relationship: '新郎親族',
      allergy: 'そば', shuttle: '利用する（新大村駅）', message: '親族一同楽しみにしています。',
      companions: [
        {
          id: 'c4_1', lastName: '鈴木', firstName: '優子', lastNameKana: 'スズキ', firstNameKana: 'ユウコ',
          relationship: '配偶者', allergy: '', childInfo: ''
        }
      ]
    }
  ];

  if (db) {
    const batch = db.batch();
    sampleData.forEach(data => {
      const ref = db.collection("responses").doc(data.id);
      batch.set(ref, data);
    });
    await batch.commit();
  } else {
    const existing = await getResponses();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, ...sampleData]));
  }
}
