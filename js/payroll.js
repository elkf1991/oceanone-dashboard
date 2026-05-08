/**
 * Ocean One Dashboard — Payroll 出糧
 * For a given payroll month, lists pending payments owed to introducers.
 * "Pending" = OceanOne received the payment in the previous month.
 * Amount owed per row = TR Amount for that payment.
 */

const Payroll = {
  _container:      null,
  _policies:       [],
  _selectedMonth:  null,
  _handledSet:     null,    // Set<introducer> for currently-selected month

  // ─── Public: render ─────────────────────────────────────────────────────────

  async render(container, { members }) {
    this._container = container;
    container.innerHTML = '<div class="payroll-loading">Loading…</div>';

    const { data, error } = await DataService.fetchPolicies();
    if (error) {
      container.innerHTML = `<div class="payroll-error">Failed to load policies: ${error}</div>`;
      return;
    }
    this._policies = data || [];

    // Default to current month (YYYYMM)
    const now = new Date();
    this._selectedMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Load handled set for the default month
    await this._loadHandled(this._selectedMonth);

    this._draw();
  },

  async _loadHandled(month) {
    const { data, error } = await DataService.fetchPayrollHandled(month);
    this._handledSet = new Set(error ? [] : (data || []));
  },

  // ─── Drawing ────────────────────────────────────────────────────────────────

  _draw() {
    this._container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'payroll-page';

    // Header
    const header = document.createElement('div');
    header.className = 'content-header';
    header.innerHTML = '<h2>Payroll 出糧</h2><p>Pending payments owed to introducers, grouped by Payroll Month</p>';
    wrapper.appendChild(header);

    // Month selector bar
    const selectorBar = document.createElement('div');
    selectorBar.className = 'payroll-selector-bar';

    const label = document.createElement('label');
    label.className = 'payroll-selector-label';
    label.textContent = 'Payroll Month';
    selectorBar.appendChild(label);

    const select = document.createElement('select');
    select.className = 'payroll-month-select';
    const months = this._generateMonths();
    months.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      if (m === this._selectedMonth) opt.selected = true;
      select.appendChild(opt);
    });
    selectorBar.appendChild(select);

    wrapper.appendChild(selectorBar);

    // Table container (re-rendered on month change)
    const tableContainer = document.createElement('div');
    tableContainer.className = 'payroll-table-container';
    wrapper.appendChild(tableContainer);

    select.addEventListener('change', async () => {
      this._selectedMonth = select.value;
      await this._loadHandled(this._selectedMonth);
      this._renderTable(tableContainer);
    });

    this._renderTable(tableContainer);

    this._container.appendChild(wrapper);
  },

  // List YYYYMM strings from 202605 inclusive up to the current month inclusive
  _generateMonths() {
    const out = [];
    const startY = 2026, startM = 5;
    const now = new Date();
    const endY = now.getFullYear();
    const endM = now.getMonth() + 1;

    let y = startY, m = startM;
    while (y < endY || (y === endY && m <= endM)) {
      out.push(`${y}${String(m).padStart(2, '0')}`);
      m++;
      if (m > 12) { m = 1; y++; }
    }
    return out;
  },

  _renderTable(container) {
    container.innerHTML = '';

    const pending = this._computePending(this._selectedMonth);
    const entries = Object.entries(pending).sort((a, b) => a[0].localeCompare(b[0]));

    if (entries.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'payroll-empty';
      empty.textContent = `No pending payments for Payroll Month ${this._selectedMonth}.`;
      container.appendChild(empty);
      return;
    }

    const tableWrap = document.createElement('div');
    tableWrap.className = 'payroll-table-wrap';

    const table = document.createElement('table');
    table.className = 'payroll-table';
    table.innerHTML = `<thead>
      <tr>
        <th class="payroll-col-name">Introducer</th>
        <th class="payroll-col-amt">Total Pending (HKD)</th>
        <th class="payroll-col-count">Payments</th>
        <th class="payroll-col-act"></th>
        <th class="payroll-col-tick">Done</th>
      </tr>
    </thead>`;

    const tbody = document.createElement('tbody');
    let grandTotal = 0;

    entries.forEach(([introducer, info]) => {
      grandTotal += info.total;
      const tr = document.createElement('tr');
      tr.className = 'payroll-row';
      const isHandled = this._handledSet && this._handledSet.has(introducer);
      if (isHandled) tr.classList.add('payroll-row--handled');

      const nameTd = document.createElement('td');
      nameTd.className = 'payroll-col-name';
      nameTd.textContent = introducer;
      tr.appendChild(nameTd);

      const amtTd = document.createElement('td');
      amtTd.className = 'payroll-col-amt';
      amtTd.textContent = info.total.toLocaleString('en-HK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      tr.appendChild(amtTd);

      const countTd = document.createElement('td');
      countTd.className = 'payroll-col-count';
      countTd.textContent = String(info.count);
      tr.appendChild(countTd);

      const actTd = document.createElement('td');
      actTd.className = 'payroll-col-act';
      const btn = document.createElement('button');
      btn.className = 'payroll-detail-btn';
      btn.textContent = 'Details';
      btn.addEventListener('click', () => {
        const slug = encodeURIComponent(introducer);
        window.location.hash = `#payroll/${this._selectedMonth}/${slug}`;
      });
      actTd.appendChild(btn);
      tr.appendChild(actTd);

      // Tick button — toggle handled state
      const tickTd = document.createElement('td');
      tickTd.className = 'payroll-col-tick';
      const tickBtn = document.createElement('button');
      tickBtn.type = 'button';
      tickBtn.className = 'payroll-tick-btn';
      tickBtn.title = isHandled ? 'Mark as not done' : 'Mark as done';
      tickBtn.textContent = isHandled ? '✓' : '○';
      if (isHandled) tickBtn.classList.add('payroll-tick-btn--on');
      tickBtn.addEventListener('click', async () => {
        const currentlyHandled = this._handledSet.has(introducer);
        const next = !currentlyHandled;
        tickBtn.disabled = true;
        const { error } = await DataService.setPayrollHandled(this._selectedMonth, introducer, next);
        tickBtn.disabled = false;
        if (error) {
          alert('Could not update: ' + error);
          return;
        }
        if (next) this._handledSet.add(introducer);
        else      this._handledSet.delete(introducer);
        // Re-render the table so the row tinting + tick state stay consistent
        this._renderTable(container);
      });
      tickTd.appendChild(tickBtn);
      tr.appendChild(tickTd);

      tbody.appendChild(tr);
    });

    // Grand total row
    const totalTr = document.createElement('tr');
    totalTr.className = 'payroll-total-row';
    const totalLbl = document.createElement('td');
    totalLbl.className = 'payroll-col-name';
    totalLbl.innerHTML = '<strong>Total</strong>';
    totalTr.appendChild(totalLbl);

    const totalAmt = document.createElement('td');
    totalAmt.className = 'payroll-col-amt';
    totalAmt.innerHTML = `<strong>${grandTotal.toLocaleString('en-HK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>`;
    totalTr.appendChild(totalAmt);

    const totalSpacer = document.createElement('td');
    totalSpacer.colSpan = 3;
    totalTr.appendChild(totalSpacer);

    tbody.appendChild(totalTr);

    table.appendChild(tbody);
    tableWrap.appendChild(table);
    container.appendChild(tableWrap);
  },

  // ─── Computation ────────────────────────────────────────────────────────────

  _computePending(payrollMonth) {
    // Previous-month YYYYMM (e.g. 202605 → 202604)
    const y = parseInt(payrollMonth.slice(0, 4), 10);
    const m = parseInt(payrollMonth.slice(4, 6), 10);
    let pY = y, pM = m - 1;
    if (pM < 1) { pM = 12; pY--; }
    const prev = `${pY}${String(pM).padStart(2, '0')}`;

    const out = {};   // introducer → { total, count }

    this._policies.forEach(policy => {
      const introducer = (policy.introducer || '').trim() || '(No Introducer)';
      const oceanDates = Array.isArray(policy.ocean_received_dates)
        ? policy.ocean_received_dates : [];

      oceanDates.forEach((dateStr, idx) => {
        if (!dateStr || typeof dateStr !== 'string') return;
        const ymm = dateStr.slice(0, 7).replace('-', '');
        if (ymm !== prev) return;

        const trAmt = this._computeTRAmount(policy, idx + 1);
        if (trAmt == null || isNaN(trAmt)) return;

        if (!out[introducer]) out[introducer] = { total: 0, count: 0 };
        out[introducer].total += trAmt;
        out[introducer].count += 1;
      });
    });

    return out;
  },

  // TR Amount for a given payment of a policy (HKD).
  // Mirrors PolicyDetail._computeAmounts but reads directly from the policy row.
  _computeTRAmount(policy, paymentNum) {
    if (!policy.payment_freq) return null;
    const yr = policy.payment_freq === '月繳'
      ? Math.ceil(paymentNum / 12)
      : paymentNum;
    if (yr < 1 || yr > 10) return null;

    const rates  = Array.isArray(policy.fortune_rates) ? policy.fortune_rates : [];
    const raw    = rates[yr - 1];
    if (raw == null || raw === '') return null;

    // Support both string-percentage (new) and number-decimal (legacy)
    let pct;
    if (typeof raw === 'string') pct = parseFloat(raw);
    else if (typeof raw === 'number') pct = raw * 100;
    else return null;
    if (isNaN(pct)) return null;

    const premium = Number(policy.premium);
    if (!premium || premium <= 0) return null;
    const factor = policy.currency === 'USD' ? 7.8 : 1;
    const basicRate = policy.basic_commission_rate != null ? Number(policy.basic_commission_rate) : 0.5;

    const fortuneRate = pct / 100;
    return fortuneRate * premium * factor * basicRate;
  },
};
