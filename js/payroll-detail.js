/**
 * Ocean One Dashboard — Payroll Details (placeholder)
 * Drilled into from Payroll page. Implementation pending — to be defined later.
 */

const PayrollDetail = {
  render(container, payrollMonth, introducer, { members }) {
    container.innerHTML = '';

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
    header.innerHTML = `
      <h2>Payroll Details — ${this._esc(introducer)}</h2>
      <p>Payroll Month: <strong>${this._esc(payrollMonth)}</strong></p>`;
    wrapper.appendChild(header);

    // Placeholder note
    const placeholder = document.createElement('div');
    placeholder.className = 'payroll-detail-placeholder';
    placeholder.textContent = 'Payroll details view — coming soon.';
    wrapper.appendChild(placeholder);

    container.appendChild(wrapper);
  },

  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },
};
