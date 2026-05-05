/**
 * Ocean One Dashboard — Policy Detail / Commission Page
 * Shows commission rate breakdown for a single signed policy.
 */

const PolicyDetail = {

  // ─── Public: render ─────────────────────────────────────────────────────────

  async render(container, policyId, { members }) {
    container.innerHTML = '<div class="pdet-loading">Loading…</div>';

    // Fetch this policy + all policies (for the Copy From dropdown) in parallel
    const [singleRes, allRes] = await Promise.all([
      DataService.fetchPolicy(policyId),
      DataService.fetchPolicies(),
    ]);

    if (singleRes.error || !singleRes.data) {
      container.innerHTML = '<div class="pdet-error">Policy not found.</div>';
      return;
    }
    const otherPolicies = (allRes.data || []).filter(p => p.id !== policyId);
    this._draw(container, singleRes.data, otherPolicies);
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

  _draw(container, policy, otherPolicies) {
    container.innerHTML = '';

    // Working data copy.
    // basic_commission_rate stored as numeric decimal (0.50 = 50%).
    // fortune_rates stored as PERCENTAGE STRINGS ("6.720", "5.5", null) to preserve
    // user-typed precision (trailing zeros). Old number-format records are migrated
    // on the fly by _normalizeFortuneRates.
    const auto = this._autoPayments(policy);
    const d = {
      basic_commission_rate: policy.basic_commission_rate != null ? Number(policy.basic_commission_rate) : 0.50,
      total_payments:        policy.total_payments != null ? policy.total_payments : auto,
      fortune_rates:         this._normalizeFortuneRates(policy.fortune_rates),
    };

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

    // Basic Commission Rate (editable %, text input preserves trailing zeros)
    const rateRow = this._fieldItem('Basic Commission Rate');
    const rateInp = document.createElement('input');
    rateInp.type = 'text';
    rateInp.inputMode = 'decimal';
    rateInp.className = 'pdet-inp pdet-inp--sm';
    rateInp.value = this._formatPct(d.basic_commission_rate);
    const rateSfx = document.createElement('span');
    rateSfx.className = 'pdet-inp-sfx'; rateSfx.textContent = '%';
    rateRow.valueEl.appendChild(rateInp);
    rateRow.valueEl.appendChild(rateSfx);
    rateInp.addEventListener('input', () => {
      const raw = rateInp.value.trim();
      // Allow only valid decimal input; revert otherwise
      if (raw !== '' && !/^[0-9]*\.?[0-9]*$/.test(raw)) {
        rateInp.value = this._formatPct(d.basic_commission_rate);
        return;
      }
      const num = parseFloat(raw);
      d.basic_commission_rate = !isNaN(num) ? num / 100 : 0.50;
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

    // Section header — title on the left, Copy From + Clear All on the right
    const tableHeader = document.createElement('div');
    tableHeader.className = 'pdet-table-header';

    const tableTitle = document.createElement('h3');
    tableTitle.className = 'pdet-section-title';
    tableTitle.textContent = 'Commission Rate';
    tableHeader.appendChild(tableTitle);

    const toolbar = document.createElement('div');
    toolbar.className = 'pdet-toolbar';

    // Copy From label + dropdown
    const copyLabel = document.createElement('span');
    copyLabel.className = 'pdet-toolbar-label';
    copyLabel.textContent = 'Copy From:';
    toolbar.appendChild(copyLabel);

    const copySelect = document.createElement('select');
    copySelect.className = 'pdet-copy-select';
    const placeholderOpt = document.createElement('option');
    placeholderOpt.value = '';
    placeholderOpt.textContent = '— Select policy —';
    copySelect.appendChild(placeholderOpt);

    (otherPolicies || []).forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      const label = [
        p.policy_number || '(no number)',
        p.product       || '—',
        p.policy_holder || '—',
      ].join(' - ');
      opt.textContent = label;
      copySelect.appendChild(opt);
    });

    copySelect.addEventListener('change', () => {
      const sourceId = copySelect.value;
      copySelect.value = ''; // reset for re-use
      if (!sourceId) return;
      const source = (otherPolicies || []).find(p => p.id === sourceId);
      if (!source) return;
      const sourceRates = this._normalizeFortuneRates(source.fortune_rates);
      for (let i = 0; i < 10; i++) {
        d.fortune_rates[i] = sourceRates[i];
      }
      this._refreshFortuneInputs(tbody, d);
      this._recalcAll(tbody, d);
    });
    toolbar.appendChild(copySelect);

    // Clear All button
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'pdet-clear-btn';
    clearBtn.textContent = 'Clear All';
    clearBtn.addEventListener('click', () => {
      for (let i = 0; i < 10; i++) d.fortune_rates[i] = null;
      this._refreshFortuneInputs(tbody, d);
      this._recalcAll(tbody, d);
    });
    toolbar.appendChild(clearBtn);

    tableHeader.appendChild(toolbar);
    tableSection.appendChild(tableHeader);

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

    // Tbody — 10 year rows. Years where Fortune is blank or 0% are hidden by default;
    // a "Show All Years" toggle reveals them and switches to "Hide Years with 0%".
    const isEmpty = (i) => {
      const v = d.fortune_rates[i];
      if (v == null || v === '') return true;
      const num = parseFloat(v);
      return isNaN(num) || num === 0;
    };
    const tbody = document.createElement('tbody');
    for (let i = 0; i < 10; i++) {
      const tr = document.createElement('tr');
      tr.className = 'pdet-year-row';
      if (isEmpty(i)) tr.classList.add('pdet-year-row--hidden');

      // Year label
      const labelTd = document.createElement('td');
      labelTd.className = 'pdet-col-year';
      labelTd.textContent = `Year ${i + 1}`;
      tr.appendChild(labelTd);

      // Fortune — editable (text input preserves trailing zeros)
      const fortuneTd = document.createElement('td');
      fortuneTd.className = 'pdet-col-rate';
      const fortuneInp = document.createElement('input');
      fortuneInp.type = 'text';
      fortuneInp.inputMode = 'decimal';
      fortuneInp.className = 'pdet-inp pdet-inp--rate';
      fortuneInp.value = d.fortune_rates[i] != null ? d.fortune_rates[i] : '';
      fortuneInp.placeholder = '0.00';
      const fortuneSfx = document.createElement('span');
      fortuneSfx.className = 'pdet-inp-sfx'; fortuneSfx.textContent = '%';
      const fortuneWrap = document.createElement('div');
      fortuneWrap.className = 'pdet-rate-wrap';
      fortuneWrap.appendChild(fortuneInp); fortuneWrap.appendChild(fortuneSfx);
      fortuneTd.appendChild(fortuneWrap);
      fortuneInp.addEventListener('input', () => {
        const raw = fortuneInp.value;
        // Allow only valid decimal input (digits with optional dot); revert otherwise
        if (raw !== '' && !/^[0-9]*\.?[0-9]*$/.test(raw)) {
          fortuneInp.value = d.fortune_rates[i] != null ? d.fortune_rates[i] : '';
          return;
        }
        // Store the typed string verbatim — preserves trailing zeros across save+reload
        d.fortune_rates[i] = raw === '' ? null : raw;
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

    // Toggle row — switches between "Show All Years" and "Hide Years with 0%"
    const toggleTr = document.createElement('tr');
    toggleTr.className = 'pdet-show-all-row';
    const toggleTd = document.createElement('td');
    toggleTd.colSpan = 4;
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'pdet-show-all-btn';
    let expanded = false;
    const setLabel = () => {
      toggleBtn.textContent = expanded ? 'Hide Years with 0% ▴' : 'Show All Years ▾';
    };
    setLabel();
    toggleBtn.addEventListener('click', () => {
      expanded = !expanded;
      if (expanded) {
        // Reveal every hidden year
        tbody.querySelectorAll('.pdet-year-row--hidden').forEach(r => {
          r.classList.remove('pdet-year-row--hidden');
        });
      } else {
        // Re-hide years whose Fortune is now blank/0%
        for (let i = 0; i < 10; i++) {
          tbody.rows[i].classList.toggle('pdet-year-row--hidden', isEmpty(i));
        }
      }
      setLabel();
    });
    toggleTd.appendChild(toggleBtn);
    toggleTr.appendChild(toggleTd);
    tbody.appendChild(toggleTr);

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

  // Convert any fortune_rates payload to percentage-string array of length 10.
  // Old records contain decimals like 0.0672 (= 6.72%); convert by multiplying ×100,
  // then strip trailing zeros while preserving ≥2dp.
  _normalizeFortuneRates(rates) {
    const arr = Array.isArray(rates) ? rates : [];
    const out = [];
    for (let i = 0; i < 10; i++) {
      const v = arr[i];
      if (v == null || v === '') {
        out.push(null);
      } else if (typeof v === 'string') {
        out.push(v);
      } else if (typeof v === 'number' && !isNaN(v)) {
        // Old number format → percentage string (no FP-noise)
        let s = (v * 100).toFixed(6);
        // Strip trailing zeros down to ≥2 decimal places
        while (s.includes('.') && s.endsWith('0') && s.split('.')[1].length > 2) {
          s = s.slice(0, -1);
        }
        out.push(s);
      } else {
        out.push(null);
      }
    }
    return out;
  },

  // Update Fortune inputs from d.fortune_rates (used by Copy From / Clear All)
  _refreshFortuneInputs(tbody, d) {
    for (let i = 0; i < 10; i++) {
      const tr = tbody.rows[i];
      const inp = tr.querySelector('.pdet-inp--rate');
      if (inp) inp.value = d.fortune_rates[i] != null ? d.fortune_rates[i] : '';
    }
  },

  // Format decimal as % with up to 4dp, trailing zeros stripped, min 2dp
  _formatPct(v) {
    if (v == null || isNaN(v)) return '';
    let s = (Number(v) * 100).toFixed(4);
    // Strip trailing zeros but keep at least 2 decimals
    while (s.includes('.') && s.endsWith('0') && s.split('.')[1].length > 2) {
      s = s.slice(0, -1);
    }
    return s;
  },

  _recalcAll(tbody, d) {
    for (let i = 0; i < 10; i++) {
      this._recalcRow(tbody.rows[i], d, i);
    }
  },

  _recalcRow(tr, d, i) {
    // d.fortune_rates[i] is the typed percentage string ("6.720", "5.5", null)
    const fortuneStr = d.fortune_rates[i];
    let fortune = null;
    if (fortuneStr != null && fortuneStr !== '') {
      const parsed = parseFloat(fortuneStr);
      if (!isNaN(parsed)) fortune = parsed / 100;
    }
    const ocean   = fortune != null ? fortune * 0.78 : null;
    const trBasic = fortune != null ? fortune * d.basic_commission_rate : null;

    // Detect precision directly from the typed string: 3dp if ≥3 decimals, else 2dp
    const decimals = (fortuneStr && fortuneStr.includes('.'))
      ? fortuneStr.split('.')[1].length
      : 0;
    const precision = decimals >= 3 ? 3 : 2;

    const fmt = v => v != null ? (v * 100).toFixed(precision) + '%' : '—';
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
