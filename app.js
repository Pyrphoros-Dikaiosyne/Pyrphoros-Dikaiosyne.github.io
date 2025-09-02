(function(){
  const $ = sel => document.querySelector(sel);
  const fmt = n => (isFinite(n) ? n : 0).toLocaleString(
    undefined,{style:'currency',currency:'USD',maximumFractionDigits:2}
  );
  const nz = (v, d=0) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };

  function getInputs(){
    return {
      principal: nz($('#principal').value, 0),
      monthlyContrib: nz($('#contrib').value, 0),
      annualRate: nz($('#rate').value, 0),
      years: Math.max(1, nz($('#years').value, 1)),
      compoundsPerYear: Math.max(1, Math.round(nz($('#compound').value, 12))) // 1,4,12,365
    };
  }

  // Effective MONTHLY rate derived from APR & compounding periods per year.
  // This mirrors the “Investor.gov-style” approach of mapping APR+CPY to a monthly period.
  function monthlyRate(aprPct, cpy){
    const apr = (aprPct || 0) / 100;
    return Math.pow(1 + apr / cpy, cpy / 12) - 1; // r_month
  }

  // Closed-form totals (beginning-of-month contributions)
  function computeClosedFormTotals({principal, monthlyContrib, annualRate, years, compoundsPerYear}){
    const n = Math.max(1, Math.round(years * 12));     // months
    const r = monthlyRate(annualRate, compoundsPerYear);
    const growth = Math.pow(1 + r, n);

    const fvLump = principal * growth;
    let fvPmt = 0;
    if (monthlyContrib !== 0) {
      // Ordinary annuity (end of month): PMT * ((1+r)^n − 1)/r
      // Beginning-of-month (annuity due): multiply by (1+r)
      fvPmt = monthlyContrib * ((growth - 1) / r) * (1 + r);
    }

    const finalBalance = fvLump + fvPmt;
    const totalContrib = monthlyContrib * n;
    const totalInterest = finalBalance - principal - totalContrib;

    return { n, r, finalBalance, totalContrib, totalInterest };
  }

  // Build a month-by-month schedule for table/graph using beginning-of-month contributions
  // and the same monthly effective rate. We override the last value with the exact closed-form.
  function buildSchedule({n, r, principal, monthlyContrib, exactFinal}){
    const rows = [];
    let bal = principal;

    for (let m = 1; m <= n; m++) {
      const start = bal;
      let contrib = 0;
      // Beginning-of-month contribution
      if (monthlyContrib > 0) {
        bal += monthlyContrib;
        contrib = monthlyContrib;
      }
      const interest = bal * r;
      bal += interest;

      rows.push({ month: m, start, contrib, interest, end: bal });
    }

    if (rows.length) rows[rows.length - 1].end = exactFinal; // snap to exact
    return rows;
  }

  function computeSchedule(inputs){
    const { n, r, finalBalance, totalContrib, totalInterest } = computeClosedFormTotals(inputs);
    const rows = buildSchedule({
      n, r,
      principal: inputs.principal,
      monthlyContrib: inputs.monthlyContrib,
      exactFinal: finalBalance
    });
    return { rows, finalBalance, totalContrib, totalInterest };
  }

  function drawChart(canvas, rows){
    const ctx = canvas.getContext('2d'); if(!ctx){ return; }
    const W = canvas.width, H = canvas.height; ctx.clearRect(0,0,W,H);
    const padL=48, padR=12, padT=16, padB=28;

    const ys = rows.map(r=>r.end);
    const maxY = Math.max(1, Math.max(...ys) * 1.05), minY = 0;
    const len = Math.max(1, rows.length);
    const xScale = v => padL + ((v-1)/(len-1)) * (W-padL-padR);
    const yScale = v => { const t=(v-minY)/(maxY-minY); return H-padB - t*(H-padT-padB); };

    // axes
    ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, H-padB); ctx.lineTo(W-padR, H-padB); ctx.moveTo(padL, padT); ctx.lineTo(padL, H-padB); ctx.stroke();

    // grid + labels
    ctx.fillStyle = '#9ca3af'; ctx.font='12px system-ui, -apple-system, Segoe UI, Roboto';
    for(let i=0;i<=5;i++){
      const val=minY + i*(maxY-minY)/5; const y=yScale(val);
      ctx.strokeStyle='#14251a'; ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(W-padR,y); ctx.stroke();
      ctx.fillText(val.toLocaleString(undefined,{maximumFractionDigits:0}), 4, y+4);
    }

    // growth line (green)
    ctx.strokeStyle = '#22c55e'; ctx.lineWidth=2.4; ctx.beginPath();
    rows.forEach((r,i)=>{ const x=xScale(r.month), y=yScale(r.end); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); });
    ctx.stroke();

    // soft fill under line
    const grad = ctx.createLinearGradient(0,padT,0,H-padB);
    grad.addColorStop(0,'rgba(34,197,94,.22)'); grad.addColorStop(1,'rgba(34,197,94,0)');
    ctx.fillStyle=grad; ctx.lineTo(W-padR,H-padB); ctx.lineTo(padL,H-padB); ctx.closePath(); ctx.fill();
  }

  function populateTable(tbody, rows){
    tbody.innerHTML = rows.map(r =>
      `<tr><td style="text-align:left">${r.month}</td><td>${fmt(r.start)}</td><td>${fmt(r.contrib)}</td><td>${fmt(r.interest)}</td><td>${fmt(r.end)}</td></tr>`
    ).join('');
  }

  function updateUI(){
    const inputs = getInputs();
    const {rows, finalBalance, totalContrib, totalInterest} = computeSchedule(inputs);
    $('#finalBal').textContent = fmt(finalBalance);
    $('#totalContrib').textContent = fmt(totalContrib);
    $('#totalInterest').textContent = fmt(totalInterest);
    drawChart($('#chart'), rows);
    populateTable($('#schedule tbody'), rows);
    window.__rows = rows;
  }

  function exportCSV(){
    const rows = window.__rows || [];
    const header = ['Month','Start Balance','Contribution','Interest','End Balance'];
    const lines = [header.join(',')].concat(rows.map(r => [
      r.month, r.start.toFixed(2), r.contrib.toFixed(2), r.interest.toFixed(2), r.end.toFixed(2)
    ].join(',')));
    const blob = new Blob([lines.join('\n')], {type:'text/csv'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = 'compound-schedule.csv'; a.click(); URL.revokeObjectURL(url);
  }

  window.addEventListener('DOMContentLoaded', () => {
    ['#principal','#contrib','#rate','#years','#compound'].forEach(sel =>
      $(sel).addEventListener('input', updateUI)
    );
    $('#runBtn').addEventListener('click', updateUI);
    $('#resetBtn').addEventListener('click', ()=>{
      $('#principal').value=10000; $('#contrib').value=500; $('#rate').value=7; $('#years').value=30; $('#compound').value='12'; updateUI();
    });
    $('#csvBtn').addEventListener('click', exportCSV);
    updateUI();
    window.updateUI = updateUI; // handy if you ever attach inline handlers
  });
})();
