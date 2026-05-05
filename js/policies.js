/**
 * Ocean One Dashboard — 簽單記錄 Policy Records
 * Inline-editable table backed by Supabase `policies` table.
 */

const Policies = {
  // ─── Insurer → Product mapping ──────────────────────────────────────────────
  INSURERS: {
    'AIA':      ['愛無憂5', '「愛伴航」保險計劃2', '自願醫保尊耀計劃'],
    'AXA':      ['「盛利II 儲蓄保險」', '愛唯守危疾保障（升級版）', '安盛智尊守慧醫療保障'],
    'Generali': ['啟航創富（卓越版）'],
    'Manulife': ['宏摯家傳承保險計劃'],
    '立橋':     ['智選儲蓄保'],
  },
  PAYMENT_FREQS: ['年繳', '月繳'],
  CURRENCIES:    ['HKD', 'USD'],

  // ─── State ──────────────────────────────────────────────────────────────────
  _policies:  [],
  _members:   null,
  _editingId: null,
  _container: null,

  // ─── Public: render ─────────────────────────────────────────────────────────

  async render(container, { members }) {
    this._container = container;
    this._members   = members;
    this._editingId = null;

    container.innerHTML = '<div class="pol-loading">Loading…</div>';

    const { data, error } = await DataService.fetchPolicies();
    if (error) {
      container.innerHTML = `<div class="pol-error">Failed to load policy records: ${error}</div>`;
      return;
    }
    this._policies = data || [];
    this._draw();
  },

  // ─── Rendering ──────────────────────────────────────────────────────────────

  _draw() {
    const c = this._container;
    c.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'pol-page';

    // Header
    const header = document.createElement('div');
    header.className = 'content-header';
    header.innerHTML = '<h2>簽單記錄 Policy Records</h2>';
    wrapper.appendChild(header);

    // Summary bar
    wrapper.appendChild(this._summaryBar());

    // Toolbar (Export button)
    wrapper.appendChild(this._toolbar());

    // Horizontally-scrollable table container
    const tableWrap = document.createElement('div');
    tableWrap.className = 'pol-table-wrap';

    const table = document.createElement('table');
    table.className = 'pol-table';
    table.appendChild(this._thead());
    table.appendChild(this._tbody());
    tableWrap.appendChild(table);
    wrapper.appendChild(tableWrap);

    // Datalist — full names for TR
    const dl = document.createElement('datalist');
    dl.id = 'pol-staff-dl';
    this._staffNames().forEach(n => {
      const o = document.createElement('option'); o.value = n; dl.appendChild(o);
    });
    wrapper.appendChild(dl);

    // Datalist — English-only names for Introducer
    const dlEn = document.createElement('datalist');
    dlEn.id = 'pol-staff-en-dl';
    this._staffEnglishNames().forEach(n => {
      const o = document.createElement('option'); o.value = n; dlEn.appendChild(o);
    });
    wrapper.appendChild(dlEn);

    c.appendChild(wrapper);
  },

  _toolbar() {
    const bar = document.createElement('div');
    bar.className = 'pol-toolbar';

    const btn = document.createElement('button');
    btn.className = 'pol-export-btn';
    btn.innerHTML = '⬇️ Export XLSX';
    btn.addEventListener('click', () => this._exportXlsx());
    bar.appendChild(btn);

    return bar;
  },

  _exportXlsx() {
    if (typeof XLSX === 'undefined') {
      alert('Excel export library not loaded. Please refresh the page and try again.');
      return;
    }

    const HEADERS = {
      sign_date:        '簽單日期',
      policy_date:      '保單日期',
      issue_date:       '保單簽發日',
      cooling_off_date: '冷靜期屆滿日',
      payout_date:      '預計OceanOne出糧日',
      tr:               'TR',
      introducer:       'Introducer',
      policy_number:    '保單號碼',
      policy_holder:    '保單持有人',
      insurer:          '保險公司',
      product:          '產品',
      payment_freq:     '年繳/月繳',
      payment_term:     '供款年期',
      currency:         '保費貨幣',
      premium:          '每期保費',
    };

    // Sort same as table: sign_date descending
    const sorted = [...this._policies].sort((a, b) => {
      if (!a.sign_date && !b.sign_date) return 0;
      if (!a.sign_date) return 1;
      if (!b.sign_date) return -1;
      return b.sign_date.localeCompare(a.sign_date);
    });

    const rows = sorted.map(p => {
      const row = {};
      Object.keys(HEADERS).forEach(key => {
        row[HEADERS[key]] = p[key] != null ? p[key] : '';
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(rows, { header: Object.values(HEADERS) });

    // Auto column widths based on header/content lengths
    const colWidths = Object.values(HEADERS).map(h => ({ wch: Math.max(h.length * 2, 12) }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '簽單記錄');

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `OceanOne_Policies_${today}.xlsx`);
  },

  _summaryBar() {
    const bar = document.createElement('div');
    bar.className = 'pol-summary-bar';

    const count = this._policies.length;

    // Total Annual Premium in USD
    // Rules: 月繳 × 12, 年繳 × 1; HKD ÷ 7.8, USD × 1
    const HKD_TO_USD = 7.8;
    let totalAnnualUSD = 0;
    let hasData = false;

    this._policies.forEach(p => {
      if (p.premium == null || !p.currency) return;
      const premium = Number(p.premium);
      const annual  = p.payment_freq === '月繳' ? premium * 12 : premium;
      const inUSD   = p.currency === 'HKD' ? annual / HKD_TO_USD : annual;
      totalAnnualUSD += inUSD;
      hasData = true;
    });

    const totalStr = hasData
      ? `USD ${totalAnnualUSD.toLocaleString('en-HK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : '';

    bar.innerHTML = `
      <span class="pol-summary-item"><span class="pol-summary-label">Records</span><strong>${count}</strong></span>
      ${totalStr ? `<span class="pol-summary-item"><span class="pol-summary-label">Total Annual Premium (USD)</span><strong>${totalStr}</strong></span>` : ''}
    `;
    return bar;
  },

  _staffNames() {
    if (!this._members) return [];
    return Object.values(this._members)
      .map(m => m.fullName)
      .filter(Boolean)
      .sort();
  },

  // English portion only — strips CJK characters (used for Introducer datalist)
  _staffEnglishNames() {
    if (!this._members) return [];
    return Object.values(this._members)
      .map(m => {
        if (!m.fullName) return null;
        const english = m.fullName
          .replace(/[^\x00-\x7F]/g, '')
          .replace(/\(\s*\)/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        return english || null;
      })
      .filter(Boolean)
      .sort();
  },

  _thead() {
    const thead = document.createElement('thead');
    thead.innerHTML = `<tr>
      <th class="pol-col-date">簽單日期</th>
      <th class="pol-col-date">保單日期</th>
      <th class="pol-col-date">保單簽發日</th>
      <th class="pol-col-date">冷靜期屆滿日</th>
      <th class="pol-col-date">預計出糧日</th>
      <th class="pol-col-staff">TR</th>
      <th class="pol-col-staff">Introducer</th>
      <th class="pol-col-polno">保單號碼</th>
      <th class="pol-col-holder">保單持有人</th>
      <th class="pol-col-insurer">保險公司</th>
      <th class="pol-col-product">產品</th>
      <th class="pol-col-freq">年/月繳</th>
      <th class="pol-col-term">供款年期</th>
      <th class="pol-col-cur">貨幣</th>
      <th class="pol-col-prem">每期保費</th>
      <th class="pol-col-act"></th>
    </tr>`;
    return thead;
  },

  _tbody() {
    const tbody = document.createElement('tbody');

    // Sort by sign_date descending (nulls last)
    const sorted = [...this._policies].sort((a, b) => {
      if (!a.sign_date && !b.sign_date) return 0;
      if (!a.sign_date) return 1;
      if (!b.sign_date) return -1;
      return b.sign_date.localeCompare(a.sign_date);
    });

    sorted.forEach(p => {
      tbody.appendChild(
        this._editingId === p.id
          ? this._buildEditRow(p)
          : this._buildReadRow(p)
      );
    });

    // Permanent add row at bottom
    tbody.appendChild(this._buildAddRow());

    return tbody;
  },

  // ─── Read Row ────────────────────────────────────────────────────────────────

  _buildReadRow(p) {
    const tr = document.createElement('tr');
    tr.className = 'pol-row';

    const cells = [
      ['pol-col-date',    p.sign_date        || ''],
      ['pol-col-date',    p.policy_date      || ''],
      ['pol-col-date',    p.issue_date       || ''],
      ['pol-col-date',    p.cooling_off_date || ''],
      ['pol-col-date',    p.payout_date      || ''],
      ['pol-col-staff',   p.tr               || ''],
      ['pol-col-staff',   p.introducer       || ''],
      ['pol-col-polno',   p.policy_number    || ''],
      ['pol-col-holder',  p.policy_holder    || ''],
      ['pol-col-insurer', p.insurer          || ''],
      ['pol-col-product', p.product          || ''],
      ['pol-col-freq',    p.payment_freq      || ''],
      ['pol-col-term',    p.payment_term != null ? String(p.payment_term) : ''],
      ['pol-col-cur',     p.currency          || ''],
      ['pol-col-prem',    p.premium != null ? Number(p.premium).toLocaleString('en-HK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''],
    ];

    cells.forEach(([cls, val]) => {
      const td = document.createElement('td');
      td.className = cls;
      td.textContent = val;
      tr.appendChild(td);
    });

    // Actions
    const act = document.createElement('td');
    act.className = 'pol-col-act';

    const editBtn = document.createElement('button');
    editBtn.className = 'pol-btn pol-btn--edit';
    editBtn.innerHTML = '✏️';
    editBtn.title = 'Edit';
    editBtn.addEventListener('click', () => {
      this._editingId = p.id;
      this._draw();
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'pol-btn pol-btn--del';
    delBtn.innerHTML = '🗑️';
    delBtn.title = 'Delete';
    delBtn.addEventListener('click', async () => {
      if (!confirm('Delete this policy record?')) return;
      const { error } = await DataService.deletePolicy(p.id);
      if (error) { alert('Delete failed: ' + error); return; }
      this._policies = this._policies.filter(x => x.id !== p.id);
      this._draw();
    });

    act.appendChild(editBtn);
    act.appendChild(delBtn);
    tr.appendChild(act);

    return tr;
  },

  // ─── Edit Row ────────────────────────────────────────────────────────────────

  _buildEditRow(p) {
    const d = { ...p };
    const tr = this._buildInputRow(d);
    tr.classList.add('pol-row--editing');

    const saveBtn = document.createElement('button');
    saveBtn.className = 'pol-btn pol-btn--save';
    saveBtn.innerHTML = '✅';
    saveBtn.title = 'Save';
    saveBtn.addEventListener('click', async () => {
      const { data: saved, error } = await DataService.savePolicy(d);
      if (error) { alert('Save failed: ' + error); return; }
      const idx = this._policies.findIndex(x => x.id === p.id);
      if (idx >= 0) this._policies[idx] = saved;
      this._editingId = null;
      this._draw();
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'pol-btn pol-btn--cancel';
    cancelBtn.innerHTML = '❌';
    cancelBtn.title = 'Cancel';
    cancelBtn.addEventListener('click', () => {
      this._editingId = null;
      this._draw();
    });

    const act = tr.querySelector('.pol-col-act');
    act.appendChild(saveBtn);
    act.appendChild(cancelBtn);

    return tr;
  },

  // ─── Add Row ─────────────────────────────────────────────────────────────────

  _buildAddRow() {
    const d = {};
    const tr = this._buildInputRow(d);
    tr.classList.add('pol-row--add');

    const addBtn = document.createElement('button');
    addBtn.className = 'pol-btn pol-btn--add';
    addBtn.innerHTML = '➕';
    addBtn.title = 'Add record';
    addBtn.addEventListener('click', async () => {
      if (!d.sign_date) {
        alert('Please fill in 簽單日期 before adding.');
        return;
      }
      const { data: saved, error } = await DataService.savePolicy(d);
      if (error) { alert('Add failed: ' + error); return; }
      this._policies.unshift(saved);
      this._draw();
    });

    tr.querySelector('.pol-col-act').appendChild(addBtn);
    return tr;
  },

  // ─── Shared Input Row Builder ─────────────────────────────────────────────────

  _buildInputRow(d) {
    const tr = document.createElement('tr');
    tr.className = 'pol-row';

    // ── date input ──
    const dateCell = (key, cls) => {
      const inp = document.createElement('input');
      inp.type = 'date';
      inp.className = 'pol-inp pol-inp--date';
      inp.value = d[key] || '';
      inp.addEventListener('change', () => { d[key] = inp.value || null; });
      const td = document.createElement('td');
      td.className = cls;
      td.appendChild(inp);
      return td;
    };

    // ── text input ── (datalistId: pass datalist element id, or null)
    const textCell = (key, cls, datalistId) => {
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.className = 'pol-inp pol-inp--text';
      inp.value = d[key] || '';
      if (datalistId) inp.setAttribute('list', datalistId);
      inp.addEventListener('input', () => { d[key] = inp.value || null; });
      const td = document.createElement('td');
      td.className = cls;
      td.appendChild(inp);
      return td;
    };

    // ── select ──
    const selectCell = (key, cls, options, onchange) => {
      const sel = document.createElement('select');
      sel.className = 'pol-sel';
      sel.innerHTML = '<option value=""></option>' +
        options.map(o => `<option value="${o}"${d[key] === o ? ' selected' : ''}>${o}</option>`).join('');
      sel.addEventListener('change', () => {
        d[key] = sel.value || null;
        if (onchange) onchange(sel.value, tr);
      });
      const td = document.createElement('td');
      td.className = cls;
      td.appendChild(sel);
      return td;
    };

    // ── number input (isInt=true → step 1, parseInt) ──
    const numberCell = (key, cls, isInt) => {
      const inp = document.createElement('input');
      inp.type = 'number';
      inp.className = 'pol-inp pol-inp--num';
      inp.value = d[key] != null ? d[key] : '';
      inp.step = isInt ? '1' : '0.01';
      inp.min = '0';
      inp.addEventListener('input', () => {
        d[key] = inp.value !== '' ? (isInt ? parseInt(inp.value, 10) : parseFloat(inp.value)) : null;
      });
      const td = document.createElement('td');
      td.className = cls;
      td.appendChild(inp);
      return td;
    };

    // ── Build all cells in order ──
    tr.appendChild(dateCell('sign_date',        'pol-col-date'));
    tr.appendChild(dateCell('policy_date',       'pol-col-date'));
    tr.appendChild(dateCell('issue_date',        'pol-col-date'));
    tr.appendChild(dateCell('cooling_off_date',  'pol-col-date'));
    tr.appendChild(dateCell('payout_date',       'pol-col-date'));
    tr.appendChild(textCell('tr',            'pol-col-staff',  'pol-staff-dl'));
    tr.appendChild(textCell('introducer',    'pol-col-staff',  'pol-staff-en-dl'));
    tr.appendChild(textCell('policy_number', 'pol-col-polno',  null));
    tr.appendChild(textCell('policy_holder', 'pol-col-holder', null));

    // Insurer (updates product dropdown when changed)
    tr.appendChild(selectCell('insurer', 'pol-col-insurer', Object.keys(this.INSURERS), (val, row) => {
      d.product = null;
      const productSel = row.querySelector('.pol-product-sel');
      if (productSel) {
        const opts = this.INSURERS[val] || [];
        productSel.innerHTML = '<option value=""></option>' +
          opts.map(o => `<option value="${o}">${o}</option>`).join('');
        productSel.value = '';
      }
    }));

    // Product (dependent on insurer)
    const productOpts = this.INSURERS[d.insurer] || [];
    const productSel = document.createElement('select');
    productSel.className = 'pol-sel pol-product-sel';
    productSel.innerHTML = '<option value=""></option>' +
      productOpts.map(o => `<option value="${o}"${d.product === o ? ' selected' : ''}>${o}</option>`).join('');
    productSel.addEventListener('change', () => { d.product = productSel.value || null; });
    const productTd = document.createElement('td');
    productTd.className = 'pol-col-product';
    productTd.appendChild(productSel);
    tr.appendChild(productTd);

    tr.appendChild(selectCell('payment_freq',  'pol-col-freq', this.PAYMENT_FREQS));
    tr.appendChild(numberCell('payment_term',  'pol-col-term', true));
    tr.appendChild(selectCell('currency',      'pol-col-cur',  this.CURRENCIES));
    tr.appendChild(numberCell('premium',       'pol-col-prem', false));

    // Empty actions cell — buttons appended by caller
    const act = document.createElement('td');
    act.className = 'pol-col-act';
    tr.appendChild(act);

    return tr;
  },
};
