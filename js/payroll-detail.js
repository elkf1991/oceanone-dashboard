/**
 * Ocean One Dashboard — Payroll Details
 * Lists pending payments owed to a single introducer for a given Payroll Month.
 *
 * Logic mirrors Payroll page: pending = policies where OceanOne received in the
 * MONTH PRIOR to payrollMonth, where the policy's introducer matches.
 */

const PayrollDetail = {
  async render(container, payrollMonth, introducer, { members }) {
    container.innerHTML = '<div class="payroll-loading">Loading…</div>';

    const { data: policies, error } = await DataService.fetchPolicies();
    if (error) {
      container.innerHTML = `<div class="payroll-error">Failed to load: ${error}</div>`;
      return;
    }

    this._draw(container, payrollMonth, introducer, policies || [], members || {});
  },

  // ─── Drawing ────────────────────────────────────────────────────────────────

  _draw(container, payrollMonth, introducer, policies, members) {
    container.innerHTML = '';

    // Match introducer to a teammate (English Full Name compare) for Staff ID
    const matched   = this._findMember(introducer, members);
    const staffId   = matched && matched.staffId ? matched.staffId : '—';
    const staffName = (matched && matched.fullName) || introducer;

    const wrapper = document.createElement('div');
    wrapper.className = 'payroll-detail-page';

    // Back button
    const back = document.createElement('button');
    back.className = 'back-btn';
    back.innerHTML = '← Back to Payroll';
    back.addEventListener('click', () => { window.location.hash = '#payroll'; });
    wrapper.appendChild(back);

    // Header
    const header = document.createElement('div');
    header.className = 'content-header';
    header.innerHTML = `<h2>Payroll Details — ${this._esc(introducer)}</h2>`;
    wrapper.appendChild(header);

    // Staff info grid (Staff Name / Staff ID / Position / Payslip Month)
    const info = document.createElement('div');
    info.className = 'paydet-info-grid';
    info.innerHTML = `
      <div class="paydet-info-item">
        <div class="paydet-info-label">Staff Name</div>
        <div class="paydet-info-value">${this._esc(staffName)}</div>
      </div>
      <div class="paydet-info-item">
        <div class="paydet-info-label">Staff ID</div>
        <div class="paydet-info-value">${this._esc(String(staffId))}</div>
      </div>
      <div class="paydet-info-item">
        <div class="paydet-info-label">Position</div>
        <div class="paydet-info-value">Business Introducer</div>
      </div>
      <div class="paydet-info-item">
        <div class="paydet-info-label">Payslip Month</div>
        <div class="paydet-info-value">${this._esc(payrollMonth)}</div>
      </div>
    `;
    wrapper.appendChild(info);

    // Compute pending rows
    const rows = this._computeRows(policies, introducer, payrollMonth);
    const total = rows.reduce((sum, r) => sum + r.amount, 0);

    if (rows.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'payroll-empty';
      empty.textContent = `No pending payments for ${introducer} in ${payrollMonth}.`;
      wrapper.appendChild(empty);
      container.appendChild(wrapper);
      return;
    }

    // Build table
    const tableWrap = document.createElement('div');
    tableWrap.className = 'paydet-table-wrap';

    const table = document.createElement('table');
    table.className = 'paydet-table';
    table.innerHTML = `<thead>
      <tr>
        <th class="paydet-col-desc">Description</th>
        <th class="paydet-col-period">Period</th>
        <th class="paydet-col-amt">Referral Fee (in HKD)</th>
      </tr>
    </thead>`;

    const tbody = document.createElement('tbody');
    rows.forEach(r => {
      const tr = document.createElement('tr');

      const descTd = document.createElement('td');
      descTd.className = 'paydet-col-desc';
      descTd.textContent = r.description;
      tr.appendChild(descTd);

      const periodTd = document.createElement('td');
      periodTd.className = 'paydet-col-period';
      periodTd.textContent = r.period;
      tr.appendChild(periodTd);

      const amtTd = document.createElement('td');
      amtTd.className = 'paydet-col-amt';
      amtTd.textContent = r.amount.toLocaleString('en-HK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      tr.appendChild(amtTd);

      tbody.appendChild(tr);
    });

    // Total row
    const totalTr = document.createElement('tr');
    totalTr.className = 'paydet-total-row';
    const totalLabel = document.createElement('td');
    totalLabel.colSpan = 2;
    totalLabel.innerHTML = '<strong>Total</strong>';
    totalLabel.style.textAlign = 'right';
    totalTr.appendChild(totalLabel);
    const totalAmtTd = document.createElement('td');
    totalAmtTd.className = 'paydet-col-amt';
    totalAmtTd.innerHTML = `<strong>${total.toLocaleString('en-HK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>`;
    totalTr.appendChild(totalAmtTd);
    tbody.appendChild(totalTr);

    table.appendChild(tbody);
    tableWrap.appendChild(table);
    wrapper.appendChild(tableWrap);

    // ── Generate Payslip button ─────────────────────────────────────────────
    const btnWrap = document.createElement('div');
    btnWrap.className = 'paydet-generate-wrap';
    const generateBtn = document.createElement('button');
    generateBtn.className = 'paydet-generate-btn';
    generateBtn.innerHTML = '⬇ Generate Payslip';
    generateBtn.addEventListener('click', () => {
      this._generatePayslip({
        staffName, staffId, payrollMonth, introducer, rows, total, button: generateBtn,
      });
    });
    btnWrap.appendChild(generateBtn);
    wrapper.appendChild(btnWrap);

    container.appendChild(wrapper);
  },

  // ─── Payslip generation ─────────────────────────────────────────────────────

  async _generatePayslip({ staffName, staffId, payrollMonth, introducer, rows, total, button }) {
    if (typeof window.PizZip === 'undefined' || typeof window.docxtemplater === 'undefined') {
      alert('Document libraries not loaded yet. Please refresh the page and try again.');
      return;
    }

    const originalLabel = button.innerHTML;
    button.disabled = true;
    button.innerHTML = 'Generating…';

    try {
      // Fetch the template from the dashboard's templates folder
      const res = await fetch('templates/payslip-template.docx', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Could not load template (HTTP ${res.status})`);
      const arrayBuffer = await res.arrayBuffer();

      const zip = new PizZip(arrayBuffer);
      const Doc = window.docxtemplater.default || window.docxtemplater;
      const doc = new Doc(zip, {
        paragraphLoop: true,
        linebreaks:    true,
      });

      const fmt = v => Number(v).toLocaleString('en-HK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      doc.render({
        staff_name:    staffName    || introducer || '',
        staff_id:      staffId != null && staffId !== '—' ? String(staffId) : '',
        position:      'Business Introducer',
        payslip_month: payrollMonth || '',
        items: rows.map(r => ({
          description: r.description,
          period:      r.period,
          fee:         fmt(r.amount),
        })),
        total: fmt(total),
      });

      const blob = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const safeName = (staffName || introducer || 'Payslip')
        .replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
      const fileName = `OceanOne_Payslip_${safeName}_${payrollMonth}.docx`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      button.innerHTML = '✓ Generated';
      setTimeout(() => { button.innerHTML = originalLabel; button.disabled = false; }, 2000);
    } catch (err) {
      console.error('Payslip generation error:', err);
      let msg = 'Failed to generate payslip.\n\n';
      if (err && err.properties && Array.isArray(err.properties.errors) && err.properties.errors.length) {
        msg += err.properties.errors.map(e => `• ${e.message}${e.properties && e.properties.context ? ` (near: ${e.properties.context})` : ''}`).join('\n');
      } else {
        msg += err && err.message ? err.message : String(err);
      }
      alert(msg);
      button.innerHTML = originalLabel;
      button.disabled = false;
    }
  },

  // ─── Lookup helpers ─────────────────────────────────────────────────────────

  // Match introducer name (English Full Name) → teammate for Staff ID lookup
  _findMember(introducer, members) {
    const normalize = (s) => (s || '')
      .replace(/[^\x00-\x7F]/g, '')      // strip non-ASCII (e.g. Chinese chars)
      .replace(/\(\s*\)/g, '')            // strip empty parens left over
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    const target = normalize(introducer);
    if (!target) return null;
    for (const m of Object.values(members || {})) {
      if (normalize(m.fullName) === target) return m;
    }
    return null;
  },

  // ─── Computation ────────────────────────────────────────────────────────────

  _computeRows(policies, introducer, payrollMonth) {
    // Previous-month YYYYMM
    const y = parseInt(payrollMonth.slice(0, 4), 10);
    const m = parseInt(payrollMonth.slice(4, 6), 10);
    let pY = y, pM = m - 1;
    if (pM < 1) { pM = 12; pY--; }
    const prev = `${pY}${String(pM).padStart(2, '0')}`;

    const rows = [];

    (policies || []).forEach(policy => {
      if ((policy.introducer || '').trim() !== (introducer || '').trim()) return;

      const oceanDates = Array.isArray(policy.ocean_received_dates) ? policy.ocean_received_dates : [];
      oceanDates.forEach((dateStr, idx) => {
        if (!dateStr || typeof dateStr !== 'string') return;
        const ymm = dateStr.slice(0, 7).replace('-', '');
        if (ymm !== prev) return;

        const paymentNum = idx + 1;
        const amount = this._computeTRAmount(policy, paymentNum);
        if (amount == null || isNaN(amount)) return;

        const description = [
          policy.insurer       || '—',
          policy.product       || '—',
          policy.policy_number || '—',
          policy.policy_holder || '—',
        ].join(' - ');

        const period = this._computePeriod(policy, paymentNum);
        rows.push({ description, period, amount });
      });
    });

    return rows;
  },

  _computePeriod(policy, paymentNum) {
    if (!policy.policy_date || !policy.payment_freq) return '';
    const parts = policy.policy_date.split('-');
    const startY = parseInt(parts[0], 10);
    const startM = parseInt(parts[1], 10);
    if (isNaN(startY) || isNaN(startM)) return '';

    const fmt = (y, m) => String(y) + String(m).padStart(2, '0');

    if (policy.payment_freq === '月繳') {
      const totalM = startY * 12 + (startM - 1) + (paymentNum - 1);
      const yy = Math.floor(totalM / 12);
      const mm = (totalM % 12) + 1;
      return fmt(yy, mm);
    }
    if (policy.payment_freq === '年繳') {
      const sY = startY + (paymentNum - 1);
      const sM = startM;
      const eY = sM === 1 ? sY     : sY + 1;
      const eM = sM === 1 ? 12     : sM - 1;
      return `${fmt(sY, sM)} to ${fmt(eY, eM)}`;
    }
    return '';
  },

  _computeTRAmount(policy, paymentNum) {
    if (!policy.payment_freq) return null;
    const yr = policy.payment_freq === '月繳'
      ? Math.ceil(paymentNum / 12)
      : paymentNum;
    if (yr < 1 || yr > 10) return null;

    const rates = Array.isArray(policy.fortune_rates) ? policy.fortune_rates : [];
    const raw   = rates[yr - 1];
    if (raw == null || raw === '') return null;

    let pct;
    if (typeof raw === 'string') pct = parseFloat(raw);
    else if (typeof raw === 'number') pct = raw * 100;
    else return null;
    if (isNaN(pct)) return null;

    const premium = Number(policy.premium);
    if (!premium || premium <= 0) return null;
    const factor    = policy.currency === 'USD' ? 7.8 : 1;
    const basicRate = policy.basic_commission_rate != null ? Number(policy.basic_commission_rate) : 0.5;
    return (pct / 100) * premium * factor * basicRate;
  },

  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },
};
