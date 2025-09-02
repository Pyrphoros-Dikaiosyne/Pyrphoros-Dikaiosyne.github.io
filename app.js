(function(){
  const $ = sel => document.querySelector(sel);
  const fmt = n => (isFinite(n) ? n : 0).toLocaleString(undefined,{style:'currency',currency:'USD',maximumFractionDigits:2});

  function showError(msg){
    const b = $('#err'); if(b){ b.textContent = msg; b.classList.add('show'); }
  }

  function safeNum(v, d=0){ const n = parseFloat(v); return Number.isFinite(n) ? n : d; }

  function getInputs(){
    return {
      principal: safeNum($('#principal').value, 0),
      monthlyContrib: safeNum($('#contrib').value, 0),
      annualRate: safeNum($('#rate').value, 0),
      years: Math.max(1, safeNum($('#years').value, 1)),
      compoundsPerYear: safeNum($('#compound').value, 12),
      contribTiming: ($('#contTiming').value === 'begin') ? 'begin' : 'end'
    };
  }

  // Discrete-compounding engine:
  // - cpy < 12: apply interest only in those months where a period ends (e.g., annually at month 12)
  // - cpy = 12: monthly interest each month
  // - cpy > 12: approximate by multiple small steps each month (e.g., daily ≈ 30 steps/month)
  function computeSchedule({principal, monthlyContrib, annualRate, years, compoundsPerYear, contribTiming}){
    const months = Math.max(1, Math.round(years * 12));
    const cpy = Math.max(1, Math.round(compoundsPerYear)); // guard
    const rPeriod = (annualRate/100) / cpy;                 // nominal rate per compounding period

    let bal = principal;
    const rows = [];
    let totalContrib = 0, totalInterest = 0;

    // For cpy < 12, we apply interest when a period ends (e.g., annually = every 12 months)
    const monthsPerPeriod = (cpy < 12) ? Math.round(12 / cpy) : 1;
    let monthsSinceLast = 0;

    for (let m = 1; m <= months; m++) {
      const startBal = bal;
      let contribThisMonth = 0;
      let interestAccrued = 0;

      // contribution at beginning
      if (contribTiming === 'begin' && monthlyContrib > 0) {
        bal += monthlyContrib;
        totalContrib += monthlyContrib;
        contribThisMonth = monthlyContrib;
      }

      if (cpy < 12) {
        // Apply interest only at the end of a full period
        monthsSinceLast += 1;
        if (monthsSinceLast >= monthsPerPeriod) {
          const interest = bal * rPeriod;
          bal += interest;
          interestAccrued += interest;
          monthsSinceLast = 0;
        }
      } else if (cpy === 12) {
        // Monthly compounding: one period per month
        const interest = bal * rPeriod;
        bal += interest;
        interestAccrued += interest;
      } else {
        // cpy > 12 (e.g., daily). Approximate with several sub-steps per month.
        const steps = (cpy === 365) ? 30 : Math.max(2, Math.round(cpy / 12));
        const rStep = rPeriod; // each small step uses the nominal period rate /cpy
        for (let s = 0; s < steps; s++) {
          const interest = bal * rStep;
          bal += interest;
          interestAccrued += interest;
        }
      }

      // contribution at end
      if (contribTiming === 'end' && monthlyContrib > 0) {
        bal += monthlyContrib;
        totalContrib += monthlyContrib;
        contribThisMonth = monthlyContrib;
      }

      totalInterest += interestAccrued;

      rows.push({
        month: m,
        start: startBal,
        contrib: contribThisMonth,
        interest: interestAccrued,
        end: bal
      });
    }

    return { rows, finalBalance: bal, totalContrib, totalInterest };
  }

  function drawChart(canvas, rows){
    const ctx = canvas.getContext('2d'); if(!ctx){ showError('Canvas not supported.'); return; }
    const W = canvas.width, H = canvas.height; ctx.clearRect(0,0,W,H);
    const padL=48, padR=12, padT=16, padB=28;
    const ys = rows.map(r=>r.end); const maxY = Math.max(1, Math.max(...ys)*1.05); const minY = 0;
    const len = rows.length; const xScale = v => padL + ((v-1)/(len-1)) * (W-padL-padR);
    const yScale = v => { const t=(v-minY)/(maxY-minY); return H-padB - t*(H-padT-padB); };

    // axes
    ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, H-padB); ctx.lineTo(W-padR, H-padB); ctx.moveTo(padL, padT); ctx.lineTo(padL, H-padB); ctx.stroke();

    // grid + labels
    ctx.fillStyle = '#9ca3af'; ctx.font='12px system-ui, -apple-system, Segoe UI, Roboto';
    for(let i=0;i<=5;i++){ const val=minY + i*(maxY-minY)/5; const y=yScale(val);
      ctx.strokeStyle='#142038'; ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(W-padR,y); ctx.stroke();
      ctx.fillText(val.toLocaleString(undefined,{maximumFractionDigits:0}), 4, y+4);
    }

    // growth line
    ctx.strokeStyle = '#60a5fa'; ctx.lineWidth=2.25; ctx.beginPath();
    rows.forEach((r,i)=>{ const x=xScale(r.month), y=yScale(r.end); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); });
    ctx.stroke();

    // fill
    const grad = ctx.createLinearGradient(0,padT,0,H-padB); grad.addColorStop(0,'rgba(96,165,250,.25)'); grad.addColorStop(1,'rgba(96,165,250,0)');
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
    const lines = [header.join(',')].concat(rows.map(r => [r.month,r.start.toFixed(2),r.contrib.toFixed(2),r.interest.toFixed(2),r.end.toFixed(2)].join(',')));
    const blob = new Blob([lines.join('\n')], {type:'text/csv'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = 'compound-schedule.csv'; a.click(); URL.revokeObjectURL(url);
  }

  window.addEventListener('DOMContentLoaded', () => {
    try{
      applyQueryDefaults();
      ['#principal','#contrib','#rate','#years','#compound','#contTiming'].forEach(sel=> $(sel).addEventListener('input', updateUI));
      $('#runBtn').addEventListener('click', updateUI);
      $('#resetBtn').addEventListener('click', ()=>{ $('#principal').value=10000; $('#contrib').value=500; $('#rate').value=7; $('#years').value=30; $('#compound').value='12'; $('#contTiming').value='end'; updateUI(); });
      $('#csvBtn').addEventListener('click', exportCSV);
      updateUI();
      window.updateUI = updateUI;
    }catch(e){ console.error(e); showError('Initialization error: '+e.message); }
  });

  // Keep query-params support
  function applyQueryDefaults(){
    const p = new URLSearchParams(location.search);
    const setIf = (id, key) => { if(p.has(key)) { $(id).value = p.get(key); } };
    setIf('#principal','principal'); setIf('#contrib','contrib'); setIf('#rate','rate');
    setIf('#years','years'); setIf('#compound','compound'); setIf('#contTiming','contTiming');
  }
})();
