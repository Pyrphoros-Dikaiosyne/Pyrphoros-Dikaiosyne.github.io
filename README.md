<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Compound Interest Calculator</title>
  <style>
    :root{ --bg:#0f172a; --panel:#111827; --panel-2:#0b1220; --text:#e5e7eb; --muted:#9ca3af; --accent:#60a5fa; --ring:#1f2937; --error:#f87171 }
    *{box-sizing:border-box}
    body{ margin:0; font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; background:radial-gradient(1200px 800px at 80% -10%, #1e293b 0%, var(--bg) 60%); color:var(--text) }
    .wrap{max-width:1100px; margin:40px auto; padding:24px}
    .card{ background:linear-gradient(180deg, var(--panel) 0%, var(--panel-2) 100%); border:1px solid var(--ring); border-radius:18px; padding:18px; box-shadow:0 8px 30px rgba(0,0,0,.25) }
    .app{ display:grid; gap:16px; grid-template-columns:1fr }
    @media (min-width:980px){ .app{ grid-template-columns: 400px 1fr } }
    h1{font-size:28px; margin:0 0 6px}
    p.lead{margin:0 0 12px; color:var(--muted)}
    label{display:block; font-size:13px; color:var(--muted); margin:10px 0 6px}
    input, select{ width:100%; padding:10px 12px; border-radius:12px; border:1px solid var(--ring); background:#0b1020; color:var(--text); outline:none }
    .row{display:grid; gap:10px; grid-template-columns:1fr 1fr}
    .btn{ display:inline-flex; align-items:center; gap:8px; border-radius:12px; padding:10px 14px; border:1px solid var(--ring); cursor:pointer; background:#0b1020; color:var(--text) }
    .btn.primary{ background:linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%); border-color:#1e3a8a }
    .btnbar{display:flex; gap:8px; flex-wrap:wrap; margin-top:8px}
    .stats{display:grid; grid-template-columns:repeat(3,1fr); gap:10px}
    .stat{background:#0b1020; border:1px solid var(--ring); padding:12px; border-radius:12px}
    .stat .label{font-size:12px; color:var(--muted)}
    .stat .value{font-size:18px; margin-top:4px}
    canvas{width:100%; height:260px; background:#0b1020; border:1px solid var(--ring); border-radius:12px}
    table{width:100%; border-collapse:collapse; font-size:13px}
    thead th{position:sticky; top:0; background:#0c1222; border-bottom:1px solid var(--ring); text-align:right; padding:8px}
    thead th:first-child, tbody td:first-child{text-align:left}
    tbody td{padding:8px; border-bottom:1px solid #0f1a2e; text-align:right}
    .scroller{max-height:320px; overflow:auto; border:1px solid var(--ring); border-radius:12px}
    .muted{color:var(--muted)}
    .small{font-size:12px}
    .banner{display:none; margin-bottom:12px; padding:10px 12px; border:1px solid #7f1d1d; background:#1f2937; color:#fecaca; border-radius:12px}
    .banner.show{display:block}
  </style>
</head>
<body>
  <div class="wrap">
    <h1>📈 Compound Interest Calculator</h1>
    <p class="lead">Single‑file version for Obsidian/GitHub Pages. If you see a red banner below, JavaScript is blocked or an error occurred.</p>

    <div id="err" class="banner">JavaScript isn't running here (or an error occurred). If this is on GitHub, make sure you're using the <b>Pages URL</b> like <code>https://USERNAME.github.io/REPO/compound-calculator.html</code>, not the file viewer. Open the browser console for details.</div>

    <div class="app">
      <div class="card">
        <div class="row">
          <div>
            <label>Starting balance</label>
            <input id="principal" type="number" min="0" step="0.01" value="10000" />
          </div>
          <div>
            <label>Monthly contribution</label>
            <input id="contrib" type="number" min="0" step="0.01" value="500" />
          </div>
        </div>
        <div class="row">
          <div>
            <label>Annual interest rate (%)</label>
            <input id="rate" type="number" min="0" step="0.01" value="7" />
          </div>
          <div>
            <label>Years</label>
            <input id="years" type="number" min="1" step="1" value="30" />
          </div>
        </div>
        <div class="row">
          <div>
            <label>Compounding frequency</label>
            <select id="compound">
              <option value="12" selected>Monthly</option>
              <option value="365">Daily</option>
              <option value="4">Quarterly</option>
              <option value="1">Annually</option>
            </select>
          </div>
          <div>
            <label>Contribution timing</label>
            <select id="contTiming">
              <option value="end" selected>End of period</option>
              <option value="begin">Beginning of period</option>
            </select>
          </div>
        </div>
        <div class="btnbar">
          <button class="btn primary" id="runBtn">Recalculate</button>
          <button class="btn" id="resetBtn">Reset</button>
          <button class="btn" id="csvBtn">Export CSV</button>
        </div>
        <p class="small muted" style="margin-top:8px">Tip: You can prefill defaults via URL params, e.g. <code>?principal=25000&contrib=300&rate=6.5&years=20&compound=12&contTiming=end</code>.</p>
      </div>

      <div class="card">
        <div class="stats">
          <div class="stat"><div class="label">Final Balance</div><div id="finalBal" class="value">—</div></div>
          <div class="stat"><div class="label">Total Contributions</div><div id="totalContrib" class="value">—</div></div>
          <div class="stat"><div class="label">Total Interest</div><div id="totalInterest" class="value">—</div></div>
        </div>
        <div style="margin-top:12px">
          <canvas id="chart" width="800" height="260" aria-label="Growth chart"></canvas>
        </div>
        <div class="scroller" style="margin-top:12px">
          <table id="schedule">
            <thead>
              <tr>
                <th>Month</th>
                <th>Start Balance</th>
                <th>Contribution</th>
                <th>Interest</th>
                <th>End Balance</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Simple runtime guard & error surfacing
    const banner = () => document.getElementById('err');
    const showError = (msg) => { const b=banner(); if(b){ b.textContent = msg; b.classList.add('show'); } };
    (function jsSmokeTest(){ try { const x = 1+1; if(x!==2) throw new Error('JS disabled'); } catch(e){ showError('JavaScript is blocked on this page. Use the GitHub Pages URL, not github.com file view.'); } })();

    const $ = sel => document.querySelector(sel);
    const fmt = n => (isFinite(n) ? n : 0).toLocaleString(undefined,{style:'currency',currency:'USD',maximumFractionDigits:2});

    function safeNum(v, d=0){ const n=parseFloat(v); return Number.isFinite(n)?n:d; }

    function computeSchedule({principal, monthlyContrib, annualRate, years, compoundsPerYear, contribTiming}){
      const totalMonths = Math.max(1, Math.round(years * 12));
      const stepsPerMonth = (compoundsPerYear===365) ? 365/12 : Math.max(1, compoundsPerYear/12);
      const nSteps = Math.max(1, Math.round(stepsPerMonth));
      const rStep = (annualRate/100) / (compoundsPerYear || 12);

      let bal = principal;
      const rows = [];
      let totalContrib = 0, totalInterest = 0;

      for(let m=1; m<= totalMonths; m++){
        let startBal = bal;
        let contribThisMonth = monthlyContrib || 0;
        let interestAccrued = 0;

        for(let s=0; s<nSteps; s++){
          if(contribTiming==='begin' && s===0 && contribThisMonth>0){
            bal += contribThisMonth; totalContrib += contribThisMonth; contribThisMonth = 0;
          }
          const intStep = bal * rStep; bal += intStep; interestAccrued += intStep;
        }
        if(contribTiming==='end' && monthlyContrib>0){ bal += monthlyContrib; totalContrib += monthlyContrib; }
        totalInterest += interestAccrued;

        rows.push({ month:m, start:startBal, contrib:(contribTiming==='begin')?0:monthlyContrib, interest:interestAccrued, end:bal });
      }
      return {rows, finalBalance: bal, totalContrib, totalInterest};
    }

    function drawChart(canvas, rows){
      try{
        const ctx = canvas.getContext('2d'); if(!ctx){ showError('Canvas not supported.'); return; }
        const W = canvas.width, H = canvas.height; ctx.clearRect(0,0,W,H);
        const padL=48, padR=12, padT=16, padB=28;
        const ys = rows.map(r=>r.end); const maxY = Math.max(1, Math.max(...ys)*1.05); const minY = 0;
        const len = rows.length; const xScale = v => padL + ((v-1)/(len-1)) * (W-padL-padR);
        const yScale = v => { const t=(v-minY)/(maxY-minY); return H-padB - t*(H-padT-padB); };
        ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(padL, yScale(minY)); ctx.lineTo(W-padR, yScale(minY)); ctx.moveTo(padL, padT); ctx.lineTo(padL, H-padB); ctx.stroke();
        ctx.fillStyle = '#9ca3af'; ctx.font='12px system-ui, -apple-system, Segoe UI, Roboto';
        for(let i=0;i<=5;i++){ const val=minY + i*(maxY-minY)/5; const y=yScale(val); ctx.strokeStyle='#142038'; ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(W-padR,y); ctx.stroke(); ctx.fillText(val.toLocaleString(undefined,{maximumFractionDigits:0}),4,y+4); }
        ctx.strokeStyle = '#60a5fa'; ctx.lineWidth=2.25; ctx.beginPath();
        rows.forEach((r,i)=>{ const x=xScale(r.month), y=yScale(r.end); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke();
        const grad = ctx.createLinearGradient(0,padT,0,H-padB); grad.addColorStop(0,'rgba(96,165,250,.25)'); grad.addColorStop(1,'rgba(96,165,250,0)');
        ctx.fillStyle=grad; ctx.lineTo(W-padR,H-padB); ctx.lineTo(padL,H-padB); ctx.closePath(); ctx.fill();
      }catch(e){ console.error(e); showError('Chart error: '+e.message); }
    }

    function populateTable(tbody, rows){
      tbody.innerHTML = rows.map(r=>`<tr><td style="text-align:left">${r.month}</td><td>${fmt(r.start)}</td><td>${fmt(r.contrib)}</td><td>${fmt(r.interest)}</td><td>${fmt(r.end)}</td></tr>`).join('');
    }

    function getInputs(){
      const principal = safeNum($('#principal').value, 0);
      const monthlyContrib = safeNum($('#contrib').value, 0);
      const annualRate = safeNum($('#rate').value, 0);
      const years = Math.max(1, safeNum($('#years').value, 1));
      const compoundsPerYear = safeNum($('#compound').value, 12);
      const contribTiming = ($('#contTiming').value==='begin') ? 'begin' : 'end';
      return {principal, monthlyContrib, annualRate, years, compoundsPerYear, contribTiming};
    }

    function applyQueryDefaults(){
      const p = new URLSearchParams(location.search);
      const setIf = (id, key) => { if(p.has(key)) { $(id).value = p.get(key); } };
      setIf('#principal','principal'); setIf('#contrib','contrib'); setIf('#rate','rate'); setIf('#years','years'); setIf('#compound','compound'); setIf('#contTiming','contTiming');
    }

    function exportCSV(){
      try{
        const rows = window.__rows || []; const header=['Month','Start Balance','Contribution','Interest','End Balance'];
        const lines=[header.join(',')].concat(rows.map(r=>[r.month,r.start.toFixed(2),r.contrib.toFixed(2),r.interest.toFixed(2),r.end.toFixed(2)].join(',')));
        const blob=new Blob([lines.join('
')],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='compound-schedule.csv'; a.click(); URL.revokeObjectURL(url);
      }catch(e){ console.error(e); showError('CSV export blocked by browser.'); }
    }

    function updateUI(){
      try{
        const inputs = getInputs();
        const {rows, finalBalance, totalContrib, totalInterest} = computeSchedule(inputs);
        document.getElementById('finalBal').textContent = fmt(finalBalance);
        document.getElementById('totalContrib').textContent = fmt(totalContrib);
        document.getElementById('totalInterest').textContent = fmt(totalInterest);
        drawChart(document.getElementById('chart'), rows);
        populateTable(document.querySelector('#schedule tbody'), rows);
        window.__rows = rows;
      }catch(e){ console.error(e); showError('Runtime error: '+e.message); }
    }

    // Wire up events safely
    window.addEventListener('DOMContentLoaded', () => {
      try{
        ['#principal','#contrib','#rate','#years','#compound','#contTiming'].forEach(sel=> $(sel).addEventListener('input', updateUI));
        document.getElementById('runBtn').addEventListener('click', updateUI);
        document.getElementById('resetBtn').addEventListener('click', ()=>{ $('#principal').value=10000; $('#contrib').value=500; $('#rate').value=7; $('#years').value=30; $('#compound').value='12'; $('#contTiming').value='end'; updateUI(); });
        document.getElementById('csvBtn').addEventListener('click', exportCSV);
        applyQueryDefaults();
        updateUI();
      }catch(e){ console.error(e); showError('Initialization error: '+e.message); }
    });
  </script>
</body>
</html>

