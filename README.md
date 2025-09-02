# Compound-Interest-Calculator-
<div class="app">
  <!-- Controls -->
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
    <p class="small muted" style="margin-top:8px">Math notes: interest accrues at the selected compounding frequency; contributions occur monthly (begin/end per setting) and are integrated into each compounding sub‑step.</p>
  </div>

  <!-- Visualization + stats -->
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
