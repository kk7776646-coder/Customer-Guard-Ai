import {
  PKL_PIPELINE_WEIGHTS,
  INITIAL_CUSTOMERS,
  computeChurnPrediction
} from '../data/churnModelData';

export type RetentionActionToggles = {
  upgradeContract?: boolean;
  enableAutoPay?: boolean;
  addSupportBundle?: boolean;
  loyaltyDiscount?: boolean;
};

export function buildCustomerRiskTimeline(
  cust: any,
  actions: RetentionActionToggles,
  thresholds: { medium: number; high: number },
  activeModelKey: string
) {
  if (!cust) {
    return { points: [], startRisk: 0, currentRisk: 0, netChange: 0, activeActionLabels: [] as string[] };
  }

  const baseTenure = Math.max(1, Number(cust.tenure || 6));
  const baseMonthly = Number(cust.monthlyCharges || 70);

  const t1Tenure = Math.max(1, baseTenure - 5);
  const p1 = computeChurnPrediction(
    {
      ...cust,
      tenure: t1Tenure,
      contract: 'Month-to-month',
      onlineSecurity: 'No',
      techSupport: 'No',
      payment: cust.payment || 'Electronic check',
      monthlyCharges: baseMonthly * 1.05,
      totalCharges: t1Tenure * baseMonthly
    },
    thresholds,
    activeModelKey
  ).probability;

  const t2Tenure = Math.max(1, baseTenure - 4);
  const p2 = computeChurnPrediction(
    {
      ...cust,
      tenure: t2Tenure,
      contract: 'Month-to-month',
      onlineSecurity: 'No',
      techSupport: 'No',
      payment: 'Electronic check',
      monthlyCharges: baseMonthly * 1.08,
      totalCharges: t2Tenure * baseMonthly
    },
    thresholds,
    activeModelKey
  ).probability;

  const t3Tenure = Math.max(1, baseTenure - 3);
  const p3 = computeChurnPrediction(
    {
      ...cust,
      tenure: t3Tenure,
      totalCharges: t3Tenure * baseMonthly
    },
    thresholds,
    activeModelKey
  ).probability;

  const t4Tenure = Math.max(1, baseTenure - 2);
  const p4 = computeChurnPrediction(
    {
      ...cust,
      tenure: t4Tenure,
      techSupport: actions.addSupportBundle ? 'Yes' : cust.techSupport,
      payment: actions.enableAutoPay ? 'Credit card (automatic)' : cust.payment,
      totalCharges: t4Tenure * baseMonthly
    },
    thresholds,
    activeModelKey
  ).probability;

  const t5Tenure = Math.max(1, baseTenure - 1);
  const discountedMonthly = actions.loyaltyDiscount ? Number((baseMonthly * 0.85).toFixed(2)) : baseMonthly;
  const p5 = computeChurnPrediction(
    {
      ...cust,
      tenure: t5Tenure,
      contract: actions.upgradeContract ? 'One year' : cust.contract,
      techSupport: actions.addSupportBundle ? 'Yes' : cust.techSupport,
      onlineSecurity: actions.addSupportBundle ? 'Yes' : cust.onlineSecurity,
      payment: actions.enableAutoPay ? 'Credit card (automatic)' : cust.payment,
      monthlyCharges: discountedMonthly,
      totalCharges: t5Tenure * discountedMonthly
    },
    thresholds,
    activeModelKey
  ).probability;

  const p6 = computeChurnPrediction(
    {
      ...cust,
      tenure: baseTenure + 1,
      contract: actions.upgradeContract ? 'One year' : cust.contract,
      techSupport: actions.addSupportBundle ? 'Yes' : cust.techSupport,
      onlineSecurity: actions.addSupportBundle ? 'Yes' : cust.onlineSecurity,
      payment: actions.enableAutoPay ? 'Credit card (automatic)' : cust.payment,
      monthlyCharges: discountedMonthly,
      totalCharges: (baseTenure + 1) * discountedMonthly
    },
    thresholds,
    activeModelKey
  ).probability;

  const activeActionLabels: string[] = [];
  if (actions.upgradeContract) activeActionLabels.push('1-Year Contract');
  if (actions.enableAutoPay) activeActionLabels.push('Auto-Pay');
  if (actions.addSupportBundle) activeActionLabels.push('Free Tech Support & Security');
  if (actions.loyaltyDiscount) activeActionLabels.push('15% Bill Discount');

  const points = [
    { period: '5 Mo Ago', riskScore: p1, stage: 'Initial Account Check', note: 'Early customer check-in' },
    { period: '4 Mo Ago', riskScore: p2, stage: 'Warning Sign Spotted', note: 'High bill / support question logged' },
    { period: '3 Mo Ago', riskScore: p3, stage: 'Baseline Risk Recorded', note: `Standard ${cust.contract || 'plan'}` },
    { period: '2 Mo Ago', riskScore: p4, stage: 'First Outreach Call', note: actions.addSupportBundle || actions.enableAutoPay ? 'Support & billing help started' : 'Routine check-in' },
    { period: 'Last Month', riskScore: p5, stage: 'Retention Offer Applied', note: activeActionLabels.length > 0 ? `Applied: ${activeActionLabels.join(', ')}` : 'No retention offer applied yet' },
    { period: 'Today', riskScore: p6, stage: 'Current Risk Score', note: activeActionLabels.length > 0 ? 'Risk after retention efforts' : 'Current unadjusted risk' }
  ];

  const startRisk = p2;
  const currentRisk = p6;
  const netChange = Number((currentRisk - startRisk).toFixed(1));

  return { points, startRisk, currentRisk, netChange, activeActionLabels };
}

export function buildIndividualCustomerAnalysis(
  cust: any,
  allDatasetCustomers: any[],
  thresholds: { medium: number; high: number },
  activeModelKey: string
) {
  if (!cust) return null;

  const hasVal = (v: any) => v !== undefined && v !== null && String(v).trim() !== '';
  const formatAttr = (v: any, suffix = '') => (hasVal(v) ? `${v}${suffix}` : 'Data not available');

  const modelOutput = computeChurnPrediction(cust, thresholds, activeModelKey);
  const baseProb = hasVal(cust.probability) ? Number(cust.probability) : modelOutput.probability;
  const riskLevel = baseProb >= thresholds.high ? 'High Risk' : baseProb >= thresholds.medium ? 'Medium Risk' : 'Low Risk';

  const totalCount = allDatasetCustomers.length || 1;
  const avgTenure = Number((allDatasetCustomers.reduce((sum: number, c: any) => sum + Number(c.tenure || 0), 0) / totalCount).toFixed(1));
  const avgMonthly = Number((allDatasetCustomers.reduce((sum: number, c: any) => sum + Number(c.monthlyCharges || 0), 0) / totalCount).toFixed(2));
  const avgTotal = Number((allDatasetCustomers.reduce((sum: number, c: any) => sum + Number(c.totalCharges || 0), 0) / totalCount).toFixed(2));
  const avgRisk = Number((allDatasetCustomers.reduce((sum: number, c: any) => sum + Number(c.probability || 0), 0) / totalCount).toFixed(1));

  const custTenure = hasVal(cust.tenure) ? Number(cust.tenure) : null;
  const custMonthly = hasVal(cust.monthlyCharges) ? Number(cust.monthlyCharges) : null;
  const custTotal = hasVal(cust.totalCharges) ? Number(cust.totalCharges) : null;

  const benchmarkChartData = [
    { metric: 'Cancellation Risk (%)', customer: baseProb, datasetAvg: avgRisk, unit: '%' },
    ...(custMonthly !== null ? [{ metric: 'Monthly Bill ($)', customer: custMonthly, datasetAvg: avgMonthly, unit: '$' }] : []),
    ...(custTenure !== null ? [{ metric: 'Time with Us (Mo)', customer: custTenure, datasetAvg: avgTenure, unit: ' mo' }] : [])
  ];

  const cat = PKL_PIPELINE_WEIGHTS.categoricalCoefs;
  const factorItems: Array<{
    factor: string;
    customerValue: string;
    impactScore: number;
    direction: 'increases_risk' | 'lowers_risk' | 'neutral';
    explanation: string;
  }> = [];

  if (custTenure !== null) {
    const sTenure = (custTenure - PKL_PIPELINE_WEIGHTS.scalerMean[1]) / PKL_PIPELINE_WEIGHTS.scalerScale[1];
    const rawImpact = sTenure * PKL_PIPELINE_WEIGHTS.numericCoefs.tenure;
    const pts = Number((rawImpact * 22).toFixed(1));
    factorItems.push({
      factor: 'Customer Tenure',
      customerValue: `${custTenure} months`,
      impactScore: pts,
      direction: pts > 0.5 ? 'increases_risk' : pts < -0.5 ? 'lowers_risk' : 'neutral',
      explanation:
        custTenure < 12
          ? `Early-stage account (${custTenure} mo vs. ${avgTenure} mo average); newer customers cancel at a much higher rate.`
          : `Established tenure (${custTenure} mo vs. ${avgTenure} mo average) strongly anchors customer loyalty.`
    });
  }

  if (hasVal(cust.contract)) {
    const rawImpact = (cat.Contract as any)[cust.contract] ?? 0;
    const pts = Number((rawImpact * 22).toFixed(1));
    factorItems.push({
      factor: 'Contract Type',
      customerValue: String(cust.contract),
      impactScore: pts,
      direction: pts > 0.5 ? 'increases_risk' : pts < -0.5 ? 'lowers_risk' : 'neutral',
      explanation:
        cust.contract === 'Month-to-month'
          ? 'Month-to-month plan has no renewal commitment, making it easy to cancel at any time.'
          : `${cust.contract} contract provides long-term stability and significantly lowers churn probability.`
    });
  }

  if (hasVal(cust.internet)) {
    const rawImpact = (cat.InternetService as any)[cust.internet] ?? 0;
    const pts = Number((rawImpact * 22).toFixed(1));
    factorItems.push({
      factor: 'Internet Service',
      customerValue: String(cust.internet),
      impactScore: pts,
      direction: pts > 0.5 ? 'increases_risk' : pts < -0.5 ? 'lowers_risk' : 'neutral',
      explanation:
        cust.internet === 'Fiber optic'
          ? 'Fiber optic subscribers face higher price sensitivity and competitive switching offers.'
          : cust.internet === 'DSL'
          ? 'Standard DSL subscribers show steady usage and lower historical cancellation rates.'
          : 'Phone-only plan without internet carries minimal service complexity and low churn risk.'
    });
  }

  if (hasVal(cust.payment)) {
    const rawImpact = (cat.PaymentMethod as any)[cust.payment] ?? 0;
    const pts = Number((rawImpact * 22).toFixed(1));
    factorItems.push({
      factor: 'Payment Method',
      customerValue: String(cust.payment),
      impactScore: pts,
      direction: pts > 0.5 ? 'increases_risk' : pts < -0.5 ? 'lowers_risk' : 'neutral',
      explanation:
        cust.payment === 'Electronic check'
          ? 'Manual electronic check payments require monthly action and correlate with higher churn.'
          : String(cust.payment).toLowerCase().includes('automatic')
          ? 'Automatic billing removes monthly payment friction and supports consistent retention.'
          : 'Mailed check payment has moderate retention stability.'
    });
  }

  if (custMonthly !== null) {
    const diffFromAvg = Number((custMonthly - avgMonthly).toFixed(2));
    const pts = Number(((diffFromAvg / 30) * 8.5).toFixed(1));
    factorItems.push({
      factor: 'Monthly Bill Level',
      customerValue: `$${custMonthly.toFixed(2)}/mo`,
      impactScore: pts,
      direction: pts > 0.5 ? 'increases_risk' : pts < -0.5 ? 'lowers_risk' : 'neutral',
      explanation:
        diffFromAvg > 5
          ? `Monthly charge ($${custMonthly.toFixed(2)}) is $${diffFromAvg.toFixed(2)} above the dataset average ($${avgMonthly.toFixed(2)}).`
          : diffFromAvg < -5
          ? `Monthly charge ($${custMonthly.toFixed(2)}) is $${Math.abs(diffFromAvg).toFixed(2)} below the dataset average ($${avgMonthly.toFixed(2)}).`
          : `Monthly charge ($${custMonthly.toFixed(2)}) is right in line with the dataset average ($${avgMonthly.toFixed(2)}).`
    });
  }

  if (hasVal(cust.onlineSecurity) && cust.internet !== 'No') {
    const rawImpact = (cat.OnlineSecurity as any)[cust.onlineSecurity] ?? 0;
    const pts = Number((rawImpact * 22).toFixed(1));
    factorItems.push({
      factor: 'Online Security',
      customerValue: String(cust.onlineSecurity),
      impactScore: pts,
      direction: pts > 0.5 ? 'increases_risk' : pts < -0.5 ? 'lowers_risk' : 'neutral',
      explanation:
        cust.onlineSecurity === 'Yes'
          ? 'Active Online Security add-on increases account stickiness and reduces churn.'
          : 'No Online Security add-on included; accounts without security bundles leave more frequently.'
    });
  }

  if (hasVal(cust.techSupport) && cust.internet !== 'No') {
    const rawImpact = (cat.TechSupport as any)[cust.techSupport] ?? 0;
    const pts = Number((rawImpact * 22).toFixed(1));
    factorItems.push({
      factor: 'Tech Support',
      customerValue: String(cust.techSupport),
      impactScore: pts,
      direction: pts > 0.5 ? 'increases_risk' : pts < -0.5 ? 'lowers_risk' : 'neutral',
      explanation:
        cust.techSupport === 'Yes'
          ? 'Included Tech Support helps resolve service issues before they lead to cancellation.'
          : 'No Tech Support on plan; unresolved technical issues can trigger sudden cancellation.'
    });
  }

  const sortedFactors = [...factorItems].sort((a, b) => Math.abs(b.impactScore) - Math.abs(a.impactScore));
  const riskIncreasingFactors = sortedFactors.filter((f) => f.impactScore > 0).sort((a, b) => b.impactScore - a.impactScore);
  const protectiveFactors = sortedFactors.filter((f) => f.impactScore < 0).sort((a, b) => a.impactScore - b.impactScore);

  const behaviourPatterns = [
    {
      label: 'Account Loyalty Stage',
      value:
        custTenure !== null
          ? custTenure <= 6
            ? `Onboarding (${custTenure} mo)`
            : custTenure <= 24
            ? `Developing (${custTenure} mo)`
            : `Established (${custTenure} mo)`
          : 'Data not available',
      detail:
        custTenure !== null
          ? `${custTenure >= avgTenure ? 'Above' : 'Below'} active dataset average of ${avgTenure} months.`
          : 'Tenure column not available in this record.',
      available: custTenure !== null
    },
    {
      label: 'Billing & Spend Commitment',
      value:
        custMonthly !== null
          ? `$${custMonthly.toFixed(2)}/mo${custTotal !== null ? ` ($${custTotal.toFixed(2)} total)` : ''}`
          : 'Data not available',
      detail:
        hasVal(cust.contract) && hasVal(cust.payment)
          ? `${cust.contract} plan paid via ${cust.payment}.`
          : 'Contract or payment details not available.',
      available: custMonthly !== null
    },
    {
      label: 'Protection & Support Add-Ons',
      value: (() => {
        if (cust.internet === 'No') return 'Not applicable (Phone-only plan)';
        const fields = [cust.onlineSecurity, cust.onlineBackup, cust.deviceProtection, cust.techSupport];
        const availableFields = fields.filter(hasVal);
        if (availableFields.length === 0) return 'Data not available';
        const activeCount = availableFields.filter((v) => v === 'Yes').length;
        return `${activeCount} of ${availableFields.length} protection services active`;
      })(),
      detail:
        cust.internet === 'No'
          ? 'Customer does not subscribe to internet service.'
          : `Security: ${formatAttr(cust.onlineSecurity)} • Backup: ${formatAttr(cust.onlineBackup)} • Device Prot.: ${formatAttr(cust.deviceProtection)} • Tech Support: ${formatAttr(cust.techSupport)}`,
      available: hasVal(cust.onlineSecurity) || hasVal(cust.techSupport) || cust.internet === 'No'
    },
    {
      label: 'Support Tickets & Usage Signals',
      value:
        hasVal(cust.tickets) || hasVal(cust.usageDrop)
          ? `${hasVal(cust.tickets) ? `${cust.tickets} support ticket(s)` : 'Tickets: N/A'} • ${hasVal(cust.usageDrop) ? `${cust.usageDrop}% usage drop` : 'Usage: N/A'}`
          : 'Data not available',
      detail:
        hasVal(cust.tickets) || hasVal(cust.usageDrop)
          ? Number(cust.tickets || 0) >= 3 || Number(cust.usageDrop || 0) >= 25
            ? 'Elevated support contacts or recent drop in usage indicates dissatisfaction.'
            : 'Low support ticket volume and stable recent service activity.'
          : 'Support ticket count and usage drop metrics are not present in this dataset.',
      available: hasVal(cust.tickets) || hasVal(cust.usageDrop)
    }
  ];

  const recommendations: Array<{
    id: string;
    actionKey?: keyof RetentionActionToggles;
    title: string;
    reason: string;
    projectedRisk: number;
    riskReduction: number;
    priority: 'High Priority' | 'Recommended' | 'Maintenance';
  }> = [];

  if (cust.contract === 'Month-to-month') {
    const sim = computeChurnPrediction({ ...cust, contract: 'One year' }, thresholds, activeModelKey).probability;
    const drop = Number(Math.max(1.2, baseProb - sim).toFixed(1));
    recommendations.push({
      id: 'rec-contract',
      actionKey: 'upgradeContract',
      title: 'Offer 1-Year Contract Upgrade with Price Lock',
      reason: `${cust.name} is currently on a Month-to-month plan, which is a primary risk driver.`,
      projectedRisk: Number(Math.max(1.8, baseProb - drop).toFixed(1)),
      riskReduction: drop,
      priority: baseProb >= thresholds.medium ? 'High Priority' : 'Recommended'
    });
  }

  if (cust.internet && cust.internet !== 'No' && (cust.techSupport === 'No' || cust.onlineSecurity === 'No')) {
    const sim = computeChurnPrediction({ ...cust, techSupport: 'Yes', onlineSecurity: 'Yes' }, thresholds, activeModelKey).probability;
    const drop = Number(Math.max(1.0, baseProb - sim).toFixed(1));
    recommendations.push({
      id: 'rec-support',
      actionKey: 'addSupportBundle',
      title: 'Include Complimentary Tech Support & Online Security Bundle',
      reason: `Active ${cust.internet} subscriber without ${cust.techSupport === 'No' && cust.onlineSecurity === 'No' ? 'Tech Support or Online Security' : cust.techSupport === 'No' ? 'Tech Support' : 'Online Security'}.`,
      projectedRisk: Number(Math.max(1.8, baseProb - drop).toFixed(1)),
      riskReduction: drop,
      priority: baseProb >= thresholds.high ? 'High Priority' : 'Recommended'
    });
  }

  if (cust.payment && !String(cust.payment).toLowerCase().includes('automatic')) {
    const sim = computeChurnPrediction({ ...cust, payment: 'Credit card (automatic)' }, thresholds, activeModelKey).probability;
    const drop = Number(Math.max(0.8, baseProb - sim).toFixed(1));
    recommendations.push({
      id: 'rec-autopay',
      actionKey: 'enableAutoPay',
      title: 'Incentivize Switch from Manual Check to Auto-Pay',
      reason: `Currently paying via ${cust.payment}. Enrolling in automatic payments reduces monthly cancellation friction.`,
      projectedRisk: Number(Math.max(1.8, baseProb - drop).toFixed(1)),
      riskReduction: drop,
      priority: 'Recommended'
    });
  }

  if (custMonthly !== null && custMonthly >= 50) {
    const discounted = Number((custMonthly * 0.85).toFixed(2));
    const sim = computeChurnPrediction(
      {
        ...cust,
        monthlyCharges: discounted,
        totalCharges: (custTenure || 12) * discounted
      },
      thresholds,
      activeModelKey
    ).probability;
    const drop = Number(Math.max(0.6, Math.abs(baseProb - sim)).toFixed(1));
    recommendations.push({
      id: 'rec-discount',
      actionKey: 'loyaltyDiscount',
      title: `Apply 15% Loyalty Bill Credit ($${custMonthly.toFixed(2)} → $${discounted.toFixed(2)}/mo)`,
      reason: `Reduces monthly price pressure by $${(custMonthly - discounted).toFixed(2)}/mo to counter competitor offers.`,
      projectedRisk: Number(Math.max(1.8, baseProb - drop).toFixed(1)),
      riskReduction: drop,
      priority: baseProb >= thresholds.high ? 'High Priority' : 'Recommended'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: 'rec-maintain',
      title: 'Maintain Account Health & Send Annual Loyalty Appreciation Note',
      reason: `${cust.name} already has strong loyalty protections (${formatAttr(cust.contract)}, ${formatAttr(cust.payment)}). No urgent discount intervention is needed.`,
      projectedRisk: baseProb,
      riskReduction: 0,
      priority: 'Maintenance'
    });
  }

  const whyAtRiskSummary =
    baseProb >= thresholds.high
      ? `${cust.name} (${cust.id}) has a High Risk cancellation score of ${baseProb}% (alert threshold: ${thresholds.high}%). The strongest factors pushing this customer toward canceling are ${riskIncreasingFactors.slice(0, 3).map((f) => `${f.factor} (${f.customerValue})`).join(', ') || 'their current plan terms'}.`
      : baseProb >= thresholds.medium
      ? `${cust.name} (${cust.id}) is at Medium Risk with a ${baseProb}% chance of canceling. While some account details are stable, ${riskIncreasingFactors.slice(0, 2).map((f) => `${f.factor} (${f.customerValue})`).join(' and ') || 'their current billing setup'} create moderate churn exposure.`
      : `${cust.name} (${cust.id}) is in the Low Risk group with only a ${baseProb}% chance of canceling. Strong loyalty indicators include ${protectiveFactors.slice(0, 3).map((f) => `${f.factor} (${f.customerValue})`).join(', ') || 'their long-term account history'}.`;

  return {
    customer: cust,
    baseProb,
    riskLevel,
    modelOutput,
    avgTenure,
    avgMonthly,
    avgTotal,
    avgRisk,
    benchmarkChartData,
    sortedFactors,
    riskIncreasingFactors,
    protectiveFactors,
    behaviourPatterns,
    recommendations,
    whyAtRiskSummary,
    formatAttr,
    hasVal
  };
}

export function parseCustomerCsv(
  text: string,
  fileName: string,
  fileSize: number,
  thresholds: { medium: number; high: number },
  activeModelKey: string,
  existingId?: string
) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const headers = lines[0]
    ? lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
    : ['id', 'name', 'tenure', 'monthlyCharges', 'contract', 'churnStatus', 'probability'];
  const lowerHeaders = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  const findColIdx = (candidates: string[]) => {
    for (const cand of candidates) {
      const idx = lowerHeaders.indexOf(cand.toLowerCase().replace(/[^a-z0-9]/g, ''));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idxId = findColIdx(['customerid', 'id', 'accountid']);
  const idxName = findColIdx(['name', 'customername', 'fullname', 'clientname']);
  const idxEmail = findColIdx(['email', 'emailaddress']);
  const idxGender = findColIdx(['gender', 'sex']);
  const idxSenior = findColIdx(['seniorcitizen', 'senior']);
  const idxPartner = findColIdx(['partner']);
  const idxDependents = findColIdx(['dependents']);
  const idxTenure = findColIdx(['tenure', 'tenuremonths', 'months']);
  const idxPhone = findColIdx(['phoneservice', 'phone']);
  const idxMultiLines = findColIdx(['multiplelines']);
  const idxInternet = findColIdx(['internetservice', 'internet']);
  const idxSecurity = findColIdx(['onlinesecurity', 'security']);
  const idxBackup = findColIdx(['onlinebackup', 'backup']);
  const idxDevice = findColIdx(['deviceprotection']);
  const idxSupport = findColIdx(['techsupport', 'support']);
  const idxStreamTV = findColIdx(['streamingtv']);
  const idxStreamMovies = findColIdx(['streamingmovies']);
  const idxContract = findColIdx(['contract', 'contracttype']);
  const idxPaperless = findColIdx(['paperlessbilling', 'paperless']);
  const idxPayment = findColIdx(['paymentmethod', 'payment']);
  const idxMonthly = findColIdx(['monthlycharges', 'monthlybill', 'monthly']);
  const idxTotal = findColIdx(['totalcharges', 'totalbill', 'total', 'revenue', 'totalrevenue']);
  const idxCost = findColIdx(['totalcost', 'cost', 'estimatedcost', 'operatingcost', 'servicecost']);
  const idxMonthlyCost = findColIdx(['monthlycost', 'unitcost']);
  const idxTickets = findColIdx(['tickets', 'supporttickets']);
  const idxUsageDrop = findColIdx(['usagedrop', 'usagechange']);
  const idxChurn = findColIdx(['churn', 'churnstatus', 'status']);

  const parsedRecords: any[] = [];
  const seenIds = new Set<string>();
  let duplicateRowsCount = 0;
  let missingValuesCount = 0;

  for (let i = 1; i < Math.min(lines.length, 500); i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    if (cols.length >= 2) {
      const rawId = (idxId !== -1 ? cols[idxId] : cols[0]) || `CUST-${1000 + i}`;
      if (seenIds.has(rawId)) {
        duplicateRowsCount += 1;
        continue;
      }
      seenIds.add(rawId);

      const rawTenureStr = idxTenure !== -1 ? cols[idxTenure] : cols[5] || cols[3];
      const rowTenure =
        rawTenureStr !== undefined && rawTenureStr !== '' && !Number.isNaN(Number(rawTenureStr))
          ? Number(rawTenureStr)
          : 12;

      const rawMonthlyStr = idxMonthly !== -1 ? cols[idxMonthly] : cols[18] || cols[4];
      const rowMonthly =
        rawMonthlyStr !== undefined && rawMonthlyStr !== '' && !Number.isNaN(Number(rawMonthlyStr))
          ? Number(rawMonthlyStr)
          : 70.5;

      const rawTotalStr = idxTotal !== -1 ? cols[idxTotal] : cols[19];
      if (rawTotalStr !== undefined && rawTotalStr.trim() === '') {
        missingValuesCount += 1;
      }
      const rowTotal =
        rawTotalStr !== undefined && rawTotalStr.trim() !== '' && !Number.isNaN(Number(rawTotalStr))
          ? Number(rawTotalStr)
          : Number((rowTenure * rowMonthly).toFixed(2));

      const rawCostStr = idxCost !== -1 ? cols[idxCost] : undefined;
      const rawMonthlyCostStr = idxMonthlyCost !== -1 ? cols[idxMonthlyCost] : undefined;
      const rowCost =
        rawCostStr !== undefined && rawCostStr.trim() !== '' && !Number.isNaN(Number(rawCostStr))
          ? Number(rawCostStr)
          : rawMonthlyCostStr !== undefined && rawMonthlyCostStr.trim() !== '' && !Number.isNaN(Number(rawMonthlyCostStr))
          ? Number((Number(rawMonthlyCostStr) * Math.max(1, rowTenure)).toFixed(2))
          : undefined;

      const rowContract = (idxContract !== -1 ? cols[idxContract] : cols[15] || cols[6]) || 'Month-to-month';
      const rowInternet = (idxInternet !== -1 ? cols[idxInternet] : cols[8]) || 'Fiber optic';
      const rowPayment = (idxPayment !== -1 ? cols[idxPayment] : cols[17]) || 'Electronic check';
      const rowGender = idxGender !== -1 ? cols[idxGender] : ['Male', 'Female'].includes(cols[1]) ? cols[1] : undefined;
      const rowSenior = idxSenior !== -1 && cols[idxSenior] !== '' ? Number(cols[idxSenior]) : undefined;
      const rowPartner = idxPartner !== -1 ? cols[idxPartner] : undefined;
      const rowDependents = idxDependents !== -1 ? cols[idxDependents] : undefined;
      const rowPhone = idxPhone !== -1 ? cols[idxPhone] : undefined;
      const rowMultiLines = idxMultiLines !== -1 ? cols[idxMultiLines] : undefined;
      const rowSecurity = idxSecurity !== -1 ? cols[idxSecurity] : cols[9] || undefined;
      const rowBackup = idxBackup !== -1 ? cols[idxBackup] : undefined;
      const rowDevice = idxDevice !== -1 ? cols[idxDevice] : undefined;
      const rowSupport = idxSupport !== -1 ? cols[idxSupport] : cols[12] || undefined;
      const rowStreamTV = idxStreamTV !== -1 ? cols[idxStreamTV] : undefined;
      const rowStreamMovies = idxStreamMovies !== -1 ? cols[idxStreamMovies] : undefined;
      const rowPaperless = idxPaperless !== -1 ? cols[idxPaperless] : undefined;
      const rowEmail = idxEmail !== -1 && cols[idxEmail] ? cols[idxEmail] : undefined;
      const rowTickets = idxTickets !== -1 && cols[idxTickets] !== '' ? Number(cols[idxTickets]) : undefined;
      const rowUsageDrop = idxUsageDrop !== -1 && cols[idxUsageDrop] !== '' ? Number(cols[idxUsageDrop]) : undefined;

      const pred = computeChurnPrediction(
        {
          seniorCitizen: rowSenior,
          gender: rowGender,
          partner: rowPartner,
          dependents: rowDependents,
          phoneService: rowPhone,
          multipleLines: rowMultiLines,
          tenure: rowTenure,
          monthlyCharges: rowMonthly,
          totalCharges: rowTotal,
          contract: rowContract,
          internet: rowInternet,
          payment: rowPayment,
          onlineSecurity: rowSecurity,
          onlineBackup: rowBackup,
          deviceProtection: rowDevice,
          techSupport: rowSupport,
          streamingTV: rowStreamTV,
          streamingMovies: rowStreamMovies,
          paperlessBilling: rowPaperless
        },
        thresholds,
        activeModelKey
      );

      const rawChurnVal = idxChurn !== -1 ? cols[idxChurn]?.toLowerCase() : (cols[20] || cols[6] || '').toLowerCase();

      parsedRecords.push({
        id: rawId,
        name:
          idxName !== -1 && cols[idxName]
            ? cols[idxName]
            : cols[1] && !['Male', 'Female'].includes(cols[1])
            ? cols[1]
            : `Customer ${rawId}`,
        gender: rowGender,
        seniorCitizen: rowSenior,
        partner: rowPartner,
        dependents: rowDependents,
        email: rowEmail,
        tenure: rowTenure,
        phoneService: rowPhone,
        multipleLines: rowMultiLines,
        monthlyCharges: rowMonthly,
        totalCharges: rowTotal,
        cost: rowCost,
        contract: rowContract,
        internet: rowInternet,
        payment: rowPayment,
        techSupport: rowSupport,
        onlineSecurity: rowSecurity,
        onlineBackup: rowBackup,
        deviceProtection: rowDevice,
        streamingTV: rowStreamTV,
        streamingMovies: rowStreamMovies,
        paperlessBilling: rowPaperless,
        tickets: rowTickets,
        usageDrop: rowUsageDrop,
        churnStatus:
          rawChurnVal === 'yes' || rawChurnVal === 'churned'
            ? 'Churned'
            : rawChurnVal === 'at-risk'
            ? 'At-Risk'
            : pred.probability >= thresholds.high
            ? 'At-Risk'
            : 'Active',
        probability: pred.probability
      });
    }
  }

  const finalRecords = parsedRecords.length > 0 ? parsedRecords : INITIAL_CUSTOMERS;
  const newId = existingId || `ds-${Date.now()}`;

  return {
    id: newId,
    name: fileName,
    sizeBytes: fileSize,
    rows: Math.max(lines.length - 1 - duplicateRowsCount, finalRecords.length),
    columns:
      headers.length >= 3
        ? headers
        : ['id', 'name', 'gender', 'tenure', 'monthlyCharges', 'totalCharges', 'contract', 'internet', 'payment', 'churnStatus', 'probability'],
    columnTypes: headers.reduce((acc: any, h: string) => {
      if (h.toLowerCase().includes('id') || h.toLowerCase().includes('name')) acc[h] = 'Categorical';
      else if (h.toLowerCase().includes('tenure') || h.toLowerCase().includes('charge') || h.toLowerCase().includes('prob')) acc[h] = 'Numerical';
      else acc[h] = 'Categorical';
      return acc;
    }, {}),
    missingValuesCount,
    duplicateRowsCount,
    active: true,
    uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    records: finalRecords
  };
}
