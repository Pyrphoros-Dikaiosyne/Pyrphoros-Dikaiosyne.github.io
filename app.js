(function(){
  const $ = sel => document.querySelector(sel);
  const fmt = n => (isFinite(n) ? n : 0).toLocaleString(
    undefined,{style:'currency',currency:'USD',maximumFractionDigits:2}
  );

  function showError(msg){
    const b = $('#err'); if(b){ b.textContent = msg; b.classList.add('show'); }
  }
  const nz = (v, d=0) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };

  function getInputs(){
    return {
      principal: nz($('#principal').value, 0),
      monthlyContrib: nz($('#contrib').value, 0),
      annualRate: nz($('#rate').value, 0),
      years: Math.max(1, nz($('#years').value, 1)),
      compoundsPerYear: Math.max(1, Math.round(nz($('#compound').value, 12))),
      contribTiming: ($('#contTiming').value === 'begin') ? 'begin' : 'end'
    };
  }

  // Convert nominal APR with compounding cpy into an EFFECTIVE MONTHLY rate
  function monthlyRate(aprPct, cpy){
    const apr = aprPct / 100;
    return Math.pow(1 + apr / cpy, cpy / 12) - 1; // r_month
  }

  function computeSchedule({principal, monthlyContrib, annualRate, years, compoundsPerYear, contribTiming}){
    const n = Math.max(1, Math.round(years * 12));   // months
    const r = monthlyRate(annualRate, compoundsPerYear);

    let bal = principal;
    const rows = [];
    let totalContrib = 0, totalInterest = 0;

    for (let m = 1; m <= n; m++) {
      const startBal = bal;
      let contribThisMonth = 0;
      let interestThisMonth = 0;

      if (contribTiming === 'begin' && monthlyContrib > 0) {
        bal += monthlyContrib;
        totalContrib += monthlyContrib;
        contribThisMonth = monthlyContrib;
      }

      interestThisMonth = bal * r;
      bal += interestThisMonth;

      if (contribTiming === 'end' && monthlyContrib > 0) {
        bal += monthlyContrib;
        totalContrib += monthlyContrib;
        contribThisMonth = monthlyContrib;
      }

      totalInterest += interestThisMonth;

      rows.push({
        month: m,
        start: startBal,
        contrib: contribThisMonth,
        interest: interestThisMonth,
        end: bal
      });
    }

    return { rows, finalBalance: bal, totalContrib, totalInterest };
  }

  function drawChart(canvas, rows){
    const ctx = canvas.getContext('2d'); if(!ctx){ showError('Canvas not supported.'); return; }
    const W = canvas.width, H = canvas.height; ctx.clearRect(0,0,W,H);
    const padL=48, padR=12, padT=16, padB=28;

    const ys = rows.map(r=>r.end);
    const maxY = Math.max(1, Math.max(...ys) * 1.05), minY = 0;
    const len = rows.length || 1;
    const xScale = v => padL + ((v-1)/(len-1)) * (W-padL-padR);
    const yScale = v => { const t=(v-minY)/(maxY-minY); return H-padB - t*(H-padT-padB); };

    ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, H-padB); ctx.lineTo(W-padR, H-padB); ctx.moveTo(padL, padT); ctx.lineTo(padL, H-padB); ctx.stroke();

    ctx.fillStyle = '#9ca3af'; ctx.font='12px system-ui, -apple-system, Segoe UI, Roboto';
    for(let i=0;i<=5;i++){ const val=minY + i*(maxY-minY)/5; const y=yScale(val);
      ctx.strokeStyle='#142038'; ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(W-padR,y); ctx.stroke();
      ctx.fillText(val.toLocaleString(undefined,{maximumFractionDigits:0}), 4, y+4);
    }

    ctx.strokeStyle = '#60a5fa'; ctx.lineWidth=2.25; ctx.beginPath();
    rows.forEach((r,i)=>{ const x=xScale(r.month), y=yScale(r.end); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); });
    ctx.stroke();

    const grad = ctx.createLinearGradient(0,padT,0,H-padB);
    grad.addColorStop(0,'rgba(96,165,250,.25)'); grad.addColorStop(1,'rgba(96,165,250,0)');
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

  function applyQueryDefaults(){
    const p = new URLSearchParams(location.search);
    const setIf = (id, key) => { if(p.has(key)) { $(id).value = p.get(key); } };
    setIf('#principal','principal'); setIf('#contrib','contrib'); setIf('#rate','rate');
    setIf('#years','years'); setIf('#compound','compound'); setIf('#contTiming','contTiming');
  }

  window.addEventListener('DOMContentLoaded', () => {
    try{
      applyQueryDefaults();
      ['#principal','#contrib','#rate','#years','#compound','#contTiming'].forEach(sel=> $(sel).addEventListener('input', updateUI));
      $('#runBtn').addEventListener('click', updateUI);
      $('#resetBtn').addEventListener('click', ()=>{ $('#principal').value=10000; $('#contrib').value=500; $('#rate').value=7; $('#years').value=30; $('#compound').value='12'; $('#contTiming').value='end'; updateUI(); });
      $('#csvBtn').addEventListener('click', exportCSV);
      updateUI();
      window.updateUI = updateUI; // handy if you ever attach inline handlers
    }catch(e){ console.error(e); showError('Initialization error: '+e.message); }
  });
})();
