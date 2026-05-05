/**
 * Ocean One Dashboard — Policy Detail / Commission Page
 * Shows commission rate breakdown for a single signed policy.
 */

const PolicyDetail = {

  // ─── Public: render ─────────────────────────────────────────────────────────

  async render(container, policyId, { members }) {
    container.innerHTML = '<div class="pdet-loading">Loading…</div>';

    const { data: policy, error } = await DataService.fetchPolicy(policyId);
    if (error || !policy) {
      container.innerHTML = '<div class="pdet-error">Policy not found.</div>';
      return;
    }
    this._draw(container, policy);
  },

  // ─── Auto-calculate Total No. of Payments ───────────────────────────────────

  _autoPayments(policy) {
    const { product, payment_freq, payment_term } = policy;
    if (product === '愛無憂5') {
      if (payment_freq === '月繳') return 72;
      if (payment_freq === '年繳') return 6;
    }
    if (product === '啟航創富（卓越版）') {
      if (!payment_term) return null;
      if (payment_freq === '月繳') return payment_term * 12;
      if (payment_freq === '年繳') return payment_term;
    }
    return null;
  },

  // ─── Render ─────────────────────────────────────────────────────────────────

  _draw(container, policy) {
    container.innerHTML = '';

    // Working data copy (all rates stored as decimals, e.g. 0.50 = 50%)
    const auto = this._autoPayments(policy);
    const d = {
      basic_commission_rate: policy.basic_commission_rate != null ? Number(policy.basic_commission_rate) : 0.50,
      total_payments:        policy.total_payments != null ? policy.total_payments : auto,
      fortune_rates:         Array.isArray(policy.fortune_rates) ? [...policy.fortune_rates] : [],
    };
    while (d.fortune_rates.length < 10) d.fortune_rates.push(null);

    const page = document.createElement('div');
    page.className = 'pdet-page';

    // ── Back button ────────────────────────────────────────────────────────────
    const back = document.createElement('button');
    back.className = 'back-btn';
    back.innerHTML = '← Back to Policies';
    back.addEventListener('click', () => { window.location.hash = '#policies'; });
    page.appendChild(back);

    // ── Header ─────────────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'content-header';
    const subtitle = [policy.insurer, policy.product, policy.policy_holder, policy.sign_date]
      .filter(Boolean).join(' · ');
    header.innerHTML = `
      <h2>Policy Detail — ${this._esc(policy.policy_number || '(No number)')}</h2>
      ${subtitle ? `<p>${this._esc(subtitle)}</p>` : ''}`;
    page.appendChild(header);

    // ── Info grid ──────────────────────────────────────────────────────────────
    const grid = document.createElement('div');
    grid.className = 'pdet-info-grid';

    // Introducer (read-only)
    grid.appendChild(this._staticItem('Introducer', policy.introducer || '—'));

    // Basic Commission Rate (editable %)
    const rateRow = this._fieldItem('Basic Commission Rate');
    const rateInp = document.createElement('input');
    rateInp.type = 'number'; rateInp.min = '0'; rateInp.max = '100'; rateInp.step = '0.01';
    rateInp.className = 'pdet-inp pdet-inp--sm';
    rateInp.value = (d.basic_commission_rate * 100).toFixed(2);
    const rateSfx = document.createElement('span');
    rateSfx.className = 'pdet-inp-sfx'; rateSfx.textContent = '%';
    rateRow.valueEl.appendChild(rateInp);
    rateRow.valueEl.appendChild(rateSfx);
    rateInp.addEventListener('input', () => {
      d.basic_commission_rate = rateInp.value !== '' ? parseFloat(rateInp.value) / 100 : 0.50;
      this._recalcAll(tbody, d);
    });
    grid.appendChild(rateRow.item);

    // Total No. of Payments (editable integer, auto-hint)
    const paymentsRow = this._fieldItem('Total No. of Payments');
    const paymentsInp = document.createElement('input');
    paymentsInp.type = 'number'; paymentsInp.min = '1'; paymentsInp.step = '1';
    paymentsInp.className = 'pdet-inp pdet-inp--sm';
    paymentsInp.value = d.total_payments != null ? d.total_payments : '';
    if (auto !== null && policy.total_payments == null) {
      paymentsInp.placeholder = String(auto);
    }
    paymentsInp.addEventListener('input', () => {
      d.total_payments = paymentsInp.value !== '' ? parseInt(paymentsInp.value, 10) : null;
    });
    paymentsRow.valueEl.appendChild(paymentsInp);
    if (auto !== null) {
      const hint = document.createElement('span');
      hint.className = 'pdet-inp-hint';
      hint.textContent = `Auto: ${auto}`;
      paymentsRow.valueEl.appendChild(hint);
    }
    grid.appendChild(paymentsRow.item);

    page.appendChild(grid);

    // ── Commission Rate Table ──────────────────────────────────────────────────
    const tableSection = document.createElement('div');
    tableSection.className = 'pdet-table-section';

    const tableTitle = document.createElement('h3');
    tableTitle.className = 'pdet-section-title';
    tableTitle.textContent = 'Commission Rate';
    tableSection.appendChild(tableTitle);

    const tableWrap = document.createElement('div');
    tableWrap.className = 'pdet-table-wrap';

    const table = document.createElement('table');
    table.className = 'pdet-table';

    // Thead
    const thead = document.createElement('thead');
    thead.innerHTML = `<tr>
      <th class="pdet-col-year"></th>
      <th class="pdet-col-rate">Fortune</th>
      <th class="pdet-col-rate">OceanOne</th>
      <th class="pdet-col-rate">TR Basic</th>
    </tr>`;
    table.appendChild(thead);

    // Tbody — 10 year rows
    const tbody = document.createElement('tbody');
    for (let i = 0; i < 10; i++) {
      const tr = document.createElement('tr');
      tr.className = 'pdet-year-row';

      // Year label
      const labelTd = document.createElement('td');
      labelTd.className = 'pdet-col-year';
      labelTd.textContent = `Year ${i + 1}`;
      tr.appendChild(labelTd);

      // Fortune — editable
      const fortuneTd = document.createElement('td');
      fortuneTd.className = 'pdet-col-rate';
      const fortuneInp = document.createElement('input');
      fortuneInp.type = 'number'; fortuneInp.min = '0'; fortuneInp.step = '0.01';
      fortuneInp.className = 'pdet-inp pdet-inp--rate';
      fortuneInp.value = d.fortune_rates[i] != null ? (d.fortune_rates[i] * 100).toFixed(2) : '';
      fortuneInp.placeholder = '0.00';
      const fortuneSfx = document.createElement('span');
      fortuneSfx.className = 'pdet-inp-sfx'; fortuneSfx.textContent = '%';
      const fortuneWrap = document.createElement('div');
      fortuneWrap.className = 'pdet-rate-wrap';
      fortuneWrap.appendChild(fortuneInp); fortuneWrap.appendChild(fortuneSfx);
      fortuneTd.appendChild(fortuneWrap);
      fortuneInp.addEventListener('input', () => {
        d.fortune_rates[i] = fortuneInp.value !== '' ? parseFloat(fortuneInp.value) / 100 : null;
        this._recalcRow(tr, d, i);
      });
      tr.appendChild(fortuneTd);

      // OceanOne — auto
      const oceanTd = document.createElement('td');
      oceanTd.className = 'pdet-col-rate pdet-auto';
      oceanTd.dataset.ocean = i;
      tr.appendChild(oceanTd);

      // TR Basic — auto
      const trTd = document.createElement('td');
      trTd.className = 'pdet-col-rate pdet-auto';
      trTd.dataset.tr = i;
      tr.appendChild(trTd);

      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    tableSection.appendChild(tableWrap);
    page.appendChild(tableSection);

    // Initial calculation pass
    this._recalcAll(tbody, d);

    // ── Save button ────────────────────────────────────────────────────────────
    const saveWrap = document.createElement('div');
    saveWrap.className = 'pdet-save-wrap';
    const saveBtn = document.createElement('button');
    saveBtn.className = 'pdet-save-btn';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', async () => {
      saveBtn.disabled = true; saveBtn.textContent = 'Saving…';
      const payload = {
        basic_commission_rate: d.basic_commission_rate,
        total_payments:        d.total_payments,
        fortune_rates:         d.fortune_rates,
      };
      const { error } = await DataService.saveCommission(policy.id, payload);
      if (error) {
        alert('Save failed: ' + error);
        saveBtn.disabled = false; saveBtn.textContent = 'Save';
        return;
      }
      saveBtn.textContent = '✓ Saved';
      setTimeout(() => { saveBtn.disabled = false; saveBtn.textContent = 'Save'; }, 2000);
    });
    saveWrap.appendChild(saveBtn);
    page.appendChild(saveWrap);

    container.appendChild(page);
  },

  // ─── Recalculate helpers ─────────────────────────────────────────────────────

  _recalcAll(tbody, d) {
    for (let i = 0; i < 10; i++) {
      this._recalcRow(tbody.rows[i], d, i);
    }
  },

  _recalcRow(tr, d, i) {
    const fortune = d.fortune_rates[i];
    const ocean   = fortune != null ? fortune * 0.78 : null;
    const trBasic = ocean   != null ? ocean * d.basic_commission_rate : null;
    const fmt = v => v != null ? (v * 100).toFixed(2) + '%' : '—';
    const oceanTd = tr.querySelector('[data-ocean]');
    const trTd    = tr.querySelector('[data-tr]');
    if (oceanTd) oceanTd.textContent = fmt(ocean);
    if (trTd)    trTd.textContent    = fmt(trBasic);
  },

  // ─── DOM helpers ─────────────────────────────────────────────────────────────

  _staticItem(label, value) {
    const item = document.createElement('div');
    item.className = 'pdet-info-item';
    item.innerHTML = `<div class="pdet-info-label">${this._esc(label)}</div>
                      <div class="pdet-info-value">${this._esc(value)}</div>`;
    return item;
  },

  _fieldItem(label) {
    const item = document.createElement('div');
    item.className = 'pdet-info-item';
    const lbl = document.createElement('div');
    lbl.className = 'pdet-info-label'; lbl.textContent = label;
    const val = document.createElement('div');
    val.className = 'pdet-info-value pdet-info-value--input';
    item.appendChild(lbl); item.appendChild(val);
    return { item, valueEl: val };
  },

  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },
};
