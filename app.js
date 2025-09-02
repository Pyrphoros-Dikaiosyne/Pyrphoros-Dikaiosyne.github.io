function computeSchedule({principal, monthlyContrib, annualRate, years, compoundsPerYear, contribTiming}){
  const months = Math.max(1, Math.round(years * 12));

  // Convert nominal APR with given compounding to an effective *monthly* rate
  const cpy = Math.max(1, compoundsPerYear); // guard
  const rMonthly = Math.pow(1 + (annualRate/100) / cpy, cpy/12) - 1;

  let bal = principal;
  const rows = [];
  let totalContrib = 0, totalInterest = 0;

  for (let m = 1; m <= months; m++) {
    const startBal = bal;
    let contribThisMonth = 0;

    if (contribTiming === 'begin' && monthlyContrib > 0) {
      bal += monthlyContrib;
      totalContrib += monthlyContrib;
      contribThisMonth = monthlyContrib;
    }

    const interest = bal * rMonthly;
    bal += interest;

    if (contribTiming === 'end' && monthlyContrib > 0) {
      bal += monthlyContrib;
      totalContrib += monthlyContrib;
      contribThisMonth = monthlyContrib; // show in table
    }

    totalInterest += interest;

    rows.push({
      month: m,
      start: startBal,
      contrib: contribThisMonth,
      interest: interest,
      end: bal
    });
  }

  return { rows, finalBalance: bal, totalContrib, totalInterest };
}
