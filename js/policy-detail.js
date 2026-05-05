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
      basic_commission_rate:   policy.basic_commission_rate != null ? Number(policy.basic_commission_rate) : 0.50,
      total_payments:          policy.total_payments != null ? policy.total_payments : auto,
      fortune_rates:           this._normalizeFortuneRates(policy.fortune_rates),
      fortune_received_dates:  Array.isArray(policy.fortune_received_dates) ? [...policy.fortune_received_dates] : [],
      ocean_received_dates:    Array.isArray(policy.ocean_received_dates)   ? [...policy.ocean_received_dates]   : [],
      tr_received_dates:       Array.isArray(policy.tr_received_dates)      ? [...policy.tr_received_dates]      : [],
    };

    // Forward-declared so commission-table handlers can refresh payment amounts
    let paymentContent = null;
    const updatePayAmounts = () => {
      if (paymentContent) this._updatePaymentAmounts(paymentContent, policy, d);
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
      updatePayAmounts();
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
      // Re-render payment record table when the total changes
      if (paymentContent) this._renderPayments(paymentContent, policy, d);
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
      updatePayAmounts();
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
      updatePayAmounts();
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
        updatePayAmounts();
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

    // ── Payment Record section ─────────────────────────────────────────────────
    const paySection = document.createElement('div');
    paySection.className = 'pdet-payment-section';

    const payTitle = document.createElement('h3');
    payTitle.className = 'pdet-section-title';
    payTitle.textContent = 'Payment Record';
    paySection.appendChild(payTitle);

    paymentContent = document.createElement('div');
    paymentContent.className = 'pdet-payment-content';
    paySection.appendChild(paymentContent);
    page.appendChild(paySection);

    this._renderPayments(paymentContent, policy, d);

    // ── Save button ────────────────────────────────────────────────────────────
    const saveWrap = document.createElement('div');
    saveWrap.className = 'pdet-save-wrap';
    const saveBtn = document.createElement('button');
    saveBtn.className = 'pdet-save-btn';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', async () => {
      saveBtn.disabled = true; saveBtn.textContent = 'Saving…';
      // Truncate received-date arrays to current total_payments before saving
      const totalP = Number(d.total_payments) || 0;
      const trunc = (arr) => (Array.isArray(arr) ? arr.slice(0, totalP) : []);
      const payload = {
        basic_commission_rate:  d.basic_commission_rate,
        total_payments:         d.total_payments,
        fortune_rates:          d.fortune_rates,
        fortune_received_dates: trunc(d.fortune_received_dates),
        ocean_received_dates:   trunc(d.ocean_received_dates),
        tr_received_dates:      trunc(d.tr_received_dates),
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

  // ── Payment Record rendering ────────────────────────────────────────────────

  _renderPayments(container, policy, d) {
    container.innerHTML = '';

    const total = Number(d.total_payments) || 0;
    if (total <= 0 || !policy.policy_date || !policy.payment_freq) {
      const note = document.createElement('p');
      note.className = 'pdet-payment-empty';
      note.textContent = 'Set 保單日期, 年/月繳, and Total No. of Payments to populate the payment schedule.';
      container.appendChild(note);
      return;
    }

    // Parse the policy date (YYYY-MM-DD)
    const parts = policy.policy_date.split('-');
    const year  = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    if (isNaN(year) || isNaN(month)) {
      const note = document.createElement('p');
      note.className = 'pdet-payment-empty';
      note.textContent = 'Invalid 保單日期 — cannot compute payment periods.';
      container.appendChild(note);
      return;
    }

    // Pre-compute every period
    const periods = this._computePeriods(policy.payment_freq, year, month, total);

    // Pad received-date arrays so [i] is always defined for current rows
    const pad = (arr, n) => { while (arr.length < n) arr.push(null); };
    pad(d.fortune_received_dates, total);
    pad(d.ocean_received_dates,   total);
    pad(d.tr_received_dates,      total);

    const tableWrap = document.createElement('div');
    tableWrap.className = 'pdet-payment-table-wrap';

    const table = document.createElement('table');
    table.className = 'pdet-payment-table';

    const thead = document.createElement('thead');
    thead.innerHTML = `<tr>
      <th class="pay-col-num">Payment #</th>
      <th class="pay-col-period">Payment Period</th>
      <th class="pay-col-amt">Fortune<br><span class="pay-sub">Amount</span></th>
      <th class="pay-col-date">Fortune<br><span class="pay-sub">Received Date</span></th>
      <th class="pay-col-amt">OceanOne<br><span class="pay-sub">Amount</span></th>
      <th class="pay-col-date">OceanOne<br><span class="pay-sub">Received Date</span></th>
      <th class="pay-col-amt">TR<br><span class="pay-sub">Amount</span></th>
      <th class="pay-col-date">TR<br><span class="pay-sub">Received Date</span></th>
    </tr>`;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (let i = 0; i < total; i++) {
      const paymentNum = i + 1;
      const tr = document.createElement('tr');
      tr.className = 'pdet-payment-row';

      // Payment #
      const numTd = document.createElement('td');
      numTd.className = 'pay-col-num';
      numTd.textContent = String(paymentNum);
      tr.appendChild(numTd);

      // Period
      const periodTd = document.createElement('td');
      periodTd.className = 'pay-col-period';
      periodTd.textContent = periods[i] || '';
      tr.appendChild(periodTd);

      const amts = this._computeAmounts(policy, d, paymentNum);

      // Fortune Amount
      const fAmtTd = document.createElement('td');
      fAmtTd.className = 'pay-col-amt pdet-pay-amt';
      fAmtTd.dataset.amtFortune = i;
      fAmtTd.textContent = this._formatAmt(amts.fortune);
      tr.appendChild(fAmtTd);

      // Fortune Received Date
      tr.appendChild(this._payDateCell('fortune_received_dates', i, d));

      // OceanOne Amount
      const oAmtTd = document.createElement('td');
      oAmtTd.className = 'pay-col-amt pdet-pay-amt';
      oAmtTd.dataset.amtOcean = i;
      oAmtTd.textContent = this._formatAmt(amts.ocean);
      tr.appendChild(oAmtTd);

      // OceanOne Received Date
      tr.appendChild(this._payDateCell('ocean_received_dates', i, d));

      // TR Amount
      const trAmtTd = document.createElement('td');
      trAmtTd.className = 'pay-col-amt pdet-pay-amt';
      trAmtTd.dataset.amtTr = i;
      trAmtTd.textContent = this._formatAmt(amts.tr);
      tr.appendChild(trAmtTd);

      // TR Received Date
      tr.appendChild(this._payDateCell('tr_received_dates', i, d));

      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    container.appendChild(tableWrap);
  },

  // Refresh just the amount cells (used when fortune_rates / basic_commission_rate change)
  _updatePaymentAmounts(container, policy, d) {
    const total = Number(d.total_payments) || 0;
    for (let i = 0; i < total; i++) {
      const amts = this._computeAmounts(policy, d, i + 1);
      const fTd = container.querySelector(`[data-amt-fortune="${i}"]`);
      const oTd = container.querySelector(`[data-amt-ocean="${i}"]`);
      const tTd = container.querySelector(`[data-amt-tr="${i}"]`);
      if (fTd) fTd.textContent = this._formatAmt(amts.fortune);
      if (oTd) oTd.textContent = this._formatAmt(amts.ocean);
      if (tTd) tTd.textContent = this._formatAmt(amts.tr);
    }
  },

  // Compute payment-period strings for every payment
  _computePeriods(freq, startYear, startMonth, count) {
    const fmt = (y, m) => String(y) + String(m).padStart(2, '0');
    const out = [];

    if (freq === '月繳') {
      const baseTotalMonths = startYear * 12 + (startMonth - 1);
      for (let i = 0; i < count; i++) {
        const totalM = baseTotalMonths + i;
        const y = Math.floor(totalM / 12);
        const m = (totalM % 12) + 1;
        out.push(fmt(y, m));
      }
    } else if (freq === '年繳') {
      for (let i = 0; i < count; i++) {
        const sY = startYear + i;
        const sM = startMonth;
        const eY = sM === 1 ? sY     : sY + 1;
        const eM = sM === 1 ? 12     : sM - 1;
        out.push(`${fmt(sY, sM)} to ${fmt(eY, eM)}`);
      }
    } else {
      for (let i = 0; i < count; i++) out.push('');
    }
    return out;
  },

  // Compute Fortune/OceanOne/TR amounts (in HKD) for a single payment
  _computeAmounts(policy, d, paymentNum) {
    const empty = { fortune: null, ocean: null, tr: null };
    if (!policy.payment_freq) return empty;

    // Determine which Year (1-10) this payment belongs to
    const yr = policy.payment_freq === '月繳'
      ? Math.ceil(paymentNum / 12)
      : paymentNum;
    if (yr < 1 || yr > 10) return empty;

    const rateStr = d.fortune_rates[yr - 1];
    if (rateStr == null || rateStr === '') return empty;
    const fortunePct = parseFloat(rateStr);
    if (isNaN(fortunePct)) return empty;

    const premium = Number(policy.premium);
    if (!premium || premium <= 0) return empty;

    const factor = policy.currency === 'USD' ? 7.8 : 1;
    const fortuneRate = fortunePct / 100;

    const fortune = fortuneRate * premium * factor;
    const ocean   = fortune * 0.78;
    const tr      = fortune * (Number(d.basic_commission_rate) || 0);
    return { fortune, ocean, tr };
  },

  _formatAmt(v) {
    if (v == null || isNaN(v)) return '—';
    return Number(v).toLocaleString('en-HK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  _payDateCell(key, i, d) {
    const td = document.createElement('td');
    td.className = 'pay-col-date pdet-pay-date';
    const inp = document.createElement('input');
    inp.type = 'date';
    inp.className = 'pdet-inp pdet-inp--date';
    while (d[key].length <= i) d[key].push(null);
    inp.value = d[key][i] || '';
    inp.addEventListener('change', () => {
      while (d[key].length <= i) d[key].push(null);
      d[key][i] = inp.value || null;
    });
    td.appendChild(inp);
    return td;
  },

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
