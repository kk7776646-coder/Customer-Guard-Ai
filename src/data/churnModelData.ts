// ==========================================
// CLARIO ML PIPELINE WEIGHTS, BENCHMARKS & SAMPLE DATASETS
// ==========================================

export const PKL_PIPELINE_WEIGHTS = {
  artifactFile: 'churnguard_model.pkl',
  sklearnVersion: '1.6.1',
  numericFeatures: ['SeniorCitizen', 'tenure', 'MonthlyCharges', 'TotalCharges'],
  imputerMedians: [0.0, 29.0, 70.5, 1394.925],
  scalerMean: [0.16329428470003549, 32.48509052183174, 64.92996095136671, 2299.33468228612],
  scalerScale: [0.3696339558053876, 24.56656301538815, 30.135430576006627, 2279.001996496138],
  numericCoefs: {
    SeniorCitizen: 0.056922,
    tenure: -1.154434,
    MonthlyCharges: -0.676114,
    TotalCharges: 0.489698
  },
  categoricalCoefs: {
    gender: { Female: -0.110705, Male: -0.079183 },
    Partner: { No: -0.104116, Yes: -0.085772 },
    Dependents: { No: 0.020161, Yes: -0.210049 },
    PhoneService: { No: -0.107412, Yes: -0.082476 },
    MultipleLines: { No: -0.215319, 'No phone service': -0.107412, Yes: 0.132843 },
    InternetService: { DSL: -0.622465, 'Fiber optic': 0.707981, No: -0.275403 },
    OnlineSecurity: { No: 0.19903, 'No internet service': -0.275403, Yes: -0.113515 },
    OnlineBackup: { No: 0.068511, 'No internet service': -0.275403, Yes: 0.017004 },
    DeviceProtection: { No: 0.011325, 'No internet service': -0.275403, Yes: 0.07419 },
    TechSupport: { No: 0.165519, 'No internet service': -0.275403, Yes: -0.080004 },
    StreamingTV: { No: -0.176651, 'No internet service': -0.275403, Yes: 0.262166 },
    StreamingMovies: { No: -0.189877, 'No internet service': -0.275403, Yes: 0.275392 },
    Contract: { 'Month-to-month': 0.657713, 'One year': -0.072083, 'Two year': -0.775518 },
    PaperlessBilling: { No: -0.262905, Yes: 0.073017 },
    PaymentMethod: {
      'Bank transfer (automatic)': -0.161704,
      'Credit card (automatic)': -0.161001,
      'Electronic check': 0.240275,
      'Mailed check': -0.107458
    }
  },
  intercept: -0.31067885681767443
};

export const NOTEBOOK_PERMUTATION_IMPORTANCE = [
  { feature: 'Time with Company (Months as a Customer)', importance: 0.1542, category: 'Loyalty' },
  { feature: 'Contract Length (Monthly, 1-Year, or 2-Year)', importance: 0.0370, category: 'Plan' },
  { feature: 'Monthly Bill Amount ($)', importance: 0.0366, category: 'Billing' },
  { feature: 'Internet Plan Type (Fiber Optic, DSL, or None)', importance: 0.0268, category: 'Service' },
  { feature: 'How the Customer Pays Their Bill', importance: 0.0027, category: 'Billing' },
  { feature: 'Total Amount Paid Over Time ($)', importance: 0.0022, category: 'Billing' },
  { feature: 'Online Security Add-On Included', importance: 0.0019, category: 'Add-Ons' },
  { feature: 'Senior Citizen Status', importance: 0.0004, category: 'Customer Info' }
];

export const MODEL_COMPARISON_BENCHMARKS = [
  {
    id: 'mod-lr-pkl',
    key: 'logistic-regression-pkl',
    name: 'Balanced Risk Predictor (Recommended • Catches Most At-Risk Customers)',
    active: true,
    format: 'Balanced Risk Formula',
    accuracy: 73.81,
    precision: 50.43,
    recall: 78.34,
    f1: 61.36,
    rocAuc: 84.16,
    errorRate: 26.19,
    confusionMatrix: { tn: 745, fp: 290, fn: 81, tp: 293 },
    description: 'Best all-around choice for customer retention teams. It catches nearly 4 out of 5 customers who are about to cancel so you can reach out in time.'
  },
  {
    id: 'mod-gb',
    key: 'gradient-boosting-nb',
    name: 'High-Precision Predictor (Fewest False Alarms)',
    active: false,
    format: 'Step-by-Step Decision Model',
    accuracy: 80.41,
    precision: 67.38,
    recall: 50.80,
    f1: 57.93,
    rocAuc: 84.52,
    errorRate: 19.59,
    confusionMatrix: { tn: 943, fp: 92, fn: 184, tp: 190 },
    description: 'Best when you only want alerts for customers who are very likely to cancel. It has the highest overall accuracy (80.4%) and fewer false alarms.'
  },
  {
    id: 'mod-rf',
    key: 'random-forest-nb',
    name: 'Multi-Tree Consensus Predictor (300 Decision Trees)',
    active: false,
    format: '300-Tree Voting Method',
    accuracy: 78.35,
    precision: 62.11,
    recall: 47.33,
    f1: 53.72,
    rocAuc: 82.27,
    errorRate: 21.65,
    confusionMatrix: { tn: 927, fp: 108, fn: 197, tp: 177 },
    description: 'Uses 300 separate decision flowcharts that vote together on whether a customer will stay or cancel, giving steady, reliable results.'
  },
  {
    id: 'mod-et',
    key: 'extra-trees-nb',
    name: 'Randomized Tree Predictor (Broad Pattern Check)',
    active: false,
    format: 'Randomized Tree Method',
    accuracy: 76.72,
    precision: 57.19,
    recall: 48.93,
    f1: 52.74,
    rocAuc: 78.92,
    errorRate: 23.28,
    confusionMatrix: { tn: 898, fp: 137, fn: 191, tp: 183 },
    description: 'Checks a wide variety of customer habits across 300 fast decision trees to spot unusual cancellation patterns.'
  },
  {
    id: 'mod-dt',
    key: 'decision-tree-nb',
    name: 'Simple Rule-Based Flowchart (Basic Comparison)',
    active: false,
    format: 'Single Decision Flowchart',
    accuracy: 73.17,
    precision: 49.46,
    recall: 48.66,
    f1: 49.06,
    rocAuc: 65.37,
    errorRate: 26.83,
    confusionMatrix: { tn: 849, fp: 186, fn: 192, tp: 182 },
    description: 'A basic yes-or-no checklist included so you can see how much better the advanced prediction methods perform.'
  }
];

export const INITIAL_CUSTOMERS = [
  { id: '7590-VHVEG', name: 'Eleanor Vance', email: 'e.vance@nexuscorp.io', gender: 'Female', seniorCitizen: 0, partner: 'Yes', dependents: 'No', tenure: 1, phoneService: 'No', multipleLines: 'No phone service', internet: 'DSL', onlineSecurity: 'No', onlineBackup: 'Yes', deviceProtection: 'No', techSupport: 'No', streamingTV: 'No', streamingMovies: 'No', contract: 'Month-to-month', paperlessBilling: 'Yes', payment: 'Electronic check', monthlyCharges: 29.85, totalCharges: 29.85, tickets: 2, usageDrop: 24, churnStatus: 'At-Risk', probability: 75.4 },
  { id: '5575-GNVDE', name: 'Marcus Sterling', email: 'msterling@bluewave.net', gender: 'Male', seniorCitizen: 0, partner: 'No', dependents: 'No', tenure: 34, phoneService: 'Yes', multipleLines: 'No', internet: 'DSL', onlineSecurity: 'Yes', onlineBackup: 'No', deviceProtection: 'Yes', techSupport: 'No', streamingTV: 'No', streamingMovies: 'No', contract: 'One year', paperlessBilling: 'No', payment: 'Mailed check', monthlyCharges: 56.95, totalCharges: 1889.50, tickets: 0, usageDrop: 4, churnStatus: 'Active', probability: 15.8 },
  { id: '3668-QPYBK', name: 'Sophia Chen', email: 'schen@innovatelab.co', gender: 'Male', seniorCitizen: 0, partner: 'No', dependents: 'No', tenure: 2, phoneService: 'Yes', multipleLines: 'No', internet: 'DSL', onlineSecurity: 'Yes', onlineBackup: 'Yes', deviceProtection: 'No', techSupport: 'No', streamingTV: 'No', streamingMovies: 'No', contract: 'Month-to-month', paperlessBilling: 'Yes', payment: 'Mailed check', monthlyCharges: 53.85, totalCharges: 108.15, tickets: 3, usageDrop: 31, churnStatus: 'Churned', probability: 62.1 },
  { id: '7795-CFOCW', name: 'David Alverez', email: 'dalverez@metrohealth.org', gender: 'Male', seniorCitizen: 0, partner: 'No', dependents: 'No', tenure: 45, phoneService: 'No', multipleLines: 'No phone service', internet: 'DSL', onlineSecurity: 'Yes', onlineBackup: 'No', deviceProtection: 'Yes', techSupport: 'Yes', streamingTV: 'No', streamingMovies: 'No', contract: 'One year', paperlessBilling: 'No', payment: 'Bank transfer (automatic)', monthlyCharges: 42.30, totalCharges: 1840.75, tickets: 0, usageDrop: 6, churnStatus: 'Active', probability: 11.4 },
  { id: '9237-HQITU', name: 'Rachel Greenwald', email: 'rachel.g@vanguard.com', gender: 'Female', seniorCitizen: 0, partner: 'No', dependents: 'No', tenure: 2, phoneService: 'Yes', multipleLines: 'No', internet: 'Fiber optic', onlineSecurity: 'No', onlineBackup: 'No', deviceProtection: 'No', techSupport: 'No', streamingTV: 'No', streamingMovies: 'No', contract: 'Month-to-month', paperlessBilling: 'Yes', payment: 'Electronic check', monthlyCharges: 70.70, totalCharges: 151.65, tickets: 5, usageDrop: 45, churnStatus: 'Churned', probability: 89.6 },
  { id: '9305-CDSKC', name: 'Thomas Wright', email: 'twright@wrightlogistics.com', gender: 'Female', seniorCitizen: 0, partner: 'No', dependents: 'No', tenure: 8, phoneService: 'Yes', multipleLines: 'Yes', internet: 'Fiber optic', onlineSecurity: 'No', onlineBackup: 'No', deviceProtection: 'Yes', techSupport: 'No', streamingTV: 'Yes', streamingMovies: 'Yes', contract: 'Month-to-month', paperlessBilling: 'Yes', payment: 'Electronic check', monthlyCharges: 99.65, totalCharges: 820.50, tickets: 4, usageDrop: 36, churnStatus: 'Churned', probability: 88.9 },
  { id: '1452-KIOVK', name: 'Amara Okafor', email: 'amara@finpulse.io', gender: 'Male', seniorCitizen: 0, partner: 'No', dependents: 'Yes', tenure: 22, phoneService: 'Yes', multipleLines: 'Yes', internet: 'Fiber optic', onlineSecurity: 'No', onlineBackup: 'Yes', deviceProtection: 'No', techSupport: 'No', streamingTV: 'Yes', streamingMovies: 'No', contract: 'Month-to-month', paperlessBilling: 'Yes', payment: 'Credit card (automatic)', monthlyCharges: 89.10, totalCharges: 1949.40, tickets: 1, usageDrop: 14, churnStatus: 'At-Risk', probability: 68.3 },
  { id: '6713-OKOMC', name: 'Lucas Meyer', email: 'lmeyer@studio7.de', gender: 'Female', seniorCitizen: 0, partner: 'No', dependents: 'No', tenure: 10, phoneService: 'No', multipleLines: 'No phone service', internet: 'DSL', onlineSecurity: 'Yes', onlineBackup: 'No', deviceProtection: 'No', techSupport: 'No', streamingTV: 'No', streamingMovies: 'No', contract: 'Month-to-month', paperlessBilling: 'No', payment: 'Mailed check', monthlyCharges: 29.75, totalCharges: 301.90, tickets: 1, usageDrop: 12, churnStatus: 'Active', probability: 46.2 },
  { id: '7892-POOKP', name: 'Hannah Abbott', email: 'habbott@brightpath.edu', gender: 'Female', seniorCitizen: 0, partner: 'Yes', dependents: 'No', tenure: 28, phoneService: 'Yes', multipleLines: 'Yes', internet: 'Fiber optic', onlineSecurity: 'No', onlineBackup: 'No', deviceProtection: 'Yes', techSupport: 'Yes', streamingTV: 'Yes', streamingMovies: 'Yes', contract: 'Month-to-month', paperlessBilling: 'Yes', payment: 'Electronic check', monthlyCharges: 104.80, totalCharges: 3046.05, tickets: 3, usageDrop: 29, churnStatus: 'Churned', probability: 78.4 },
  { id: '6388-TABGU', name: 'Julian Vance', email: 'jvance@apexcloud.io', gender: 'Male', seniorCitizen: 0, partner: 'No', dependents: 'Yes', tenure: 62, phoneService: 'Yes', multipleLines: 'No', internet: 'DSL', onlineSecurity: 'Yes', onlineBackup: 'Yes', deviceProtection: 'No', techSupport: 'No', streamingTV: 'No', streamingMovies: 'No', contract: 'One year', paperlessBilling: 'No', payment: 'Bank transfer (automatic)', monthlyCharges: 56.15, totalCharges: 3487.95, tickets: 0, usageDrop: 2, churnStatus: 'Active', probability: 6.4 },
  { id: '9763-GRSKD', name: 'Nadia Petrova', email: 'npetrova@quantanalytics.ru', gender: 'Male', seniorCitizen: 0, partner: 'Yes', dependents: 'Yes', tenure: 13, phoneService: 'Yes', multipleLines: 'No', internet: 'DSL', onlineSecurity: 'Yes', onlineBackup: 'No', deviceProtection: 'No', techSupport: 'No', streamingTV: 'No', streamingMovies: 'No', contract: 'Month-to-month', paperlessBilling: 'Yes', payment: 'Mailed check', monthlyCharges: 49.95, totalCharges: 587.45, tickets: 1, usageDrop: 15, churnStatus: 'Active', probability: 38.7 },
  { id: '7469-LKBCI', name: 'Carlos Mendoza', email: 'cmendoza@solartech.mx', gender: 'Male', seniorCitizen: 0, partner: 'No', dependents: 'No', tenure: 16, phoneService: 'Yes', multipleLines: 'No', internet: 'No', onlineSecurity: 'No internet service', onlineBackup: 'No internet service', deviceProtection: 'No internet service', techSupport: 'No internet service', streamingTV: 'No internet service', streamingMovies: 'No internet service', contract: 'Two year', paperlessBilling: 'No', payment: 'Credit card (automatic)', monthlyCharges: 18.95, totalCharges: 326.80, tickets: 0, usageDrop: 1, churnStatus: 'Active', probability: 4.8 }
];

export const INITIAL_PREDICTION_HISTORY = [
  { predId: 'CHK-9928', customerId: '9237-HQITU', customerName: 'Rachel Greenwald', timestamp: '2025-05-14 14:32:10', tenure: 2, contract: 'Month-to-month', monthlyCharges: 70.70, probability: 89.6, actionStatus: 'Sent 20% Discount Offer', internet: 'Fiber optic', payment: 'Electronic check', tickets: 5, usageDrop: 45 },
  { predId: 'CHK-9927', customerId: '9305-CDSKC', customerName: 'Thomas Wright', timestamp: '2025-05-14 13:18:45', tenure: 8, contract: 'Month-to-month', monthlyCharges: 99.65, probability: 88.9, actionStatus: 'Scheduled Support Call', internet: 'Fiber optic', payment: 'Electronic check', tickets: 4, usageDrop: 36 },
  { predId: 'CHK-9926', customerId: '5575-GNVDE', customerName: 'Marcus Sterling', timestamp: '2025-05-14 11:05:22', tenure: 34, contract: 'One year', monthlyCharges: 56.95, probability: 15.8, actionStatus: 'Happy — No Action Needed', internet: 'DSL', payment: 'Mailed check', tickets: 0, usageDrop: 4 },
  { predId: 'CHK-9925', customerId: '7892-POOKP', customerName: 'Hannah Abbott', timestamp: '2025-05-14 09:47:19', tenure: 28, contract: 'Month-to-month', monthlyCharges: 104.80, probability: 78.4, actionStatus: 'Called to Help With Plan', internet: 'Fiber optic', payment: 'Electronic check', tickets: 3, usageDrop: 29 }
];

export const MONTHLY_CHURN_TREND = [
  { month: 'Jun', actualChurn: 26.9, predictedChurn: 26.4, retention: 73.1, mrrSaved: 42000 },
  { month: 'Jul', actualChurn: 26.7, predictedChurn: 26.5, retention: 73.3, mrrSaved: 46500 },
  { month: 'Aug', actualChurn: 27.1, predictedChurn: 26.8, retention: 72.9, mrrSaved: 44100 },
  { month: 'Sep', actualChurn: 26.6, predictedChurn: 26.5, retention: 73.4, mrrSaved: 51200 },
  { month: 'Oct', actualChurn: 26.5, predictedChurn: 26.4, retention: 73.5, mrrSaved: 58900 },
  { month: 'Nov', actualChurn: 26.4, predictedChurn: 26.3, retention: 73.6, mrrSaved: 63400 },
  { month: 'Dec', actualChurn: 26.2, predictedChurn: 26.3, retention: 73.8, mrrSaved: 68200 },
  { month: 'Jan', actualChurn: 26.5, predictedChurn: 26.4, retention: 73.5, mrrSaved: 64800 },
  { month: 'Feb', actualChurn: 26.3, predictedChurn: 26.2, retention: 73.7, mrrSaved: 71500 },
  { month: 'Mar', actualChurn: 26.1, predictedChurn: 26.2, retention: 73.9, mrrSaved: 76900 },
  { month: 'Apr', actualChurn: 26.5, predictedChurn: 26.5, retention: 73.5, mrrSaved: 82400 },
  { month: 'May', actualChurn: 26.5, predictedChurn: 26.5, retention: 73.5, mrrSaved: 89100 }
];

export const CHURN_BY_CONTRACT = [
  { contract: 'Month-to-Month', churnRate: 42.7, activeRate: 57.3, totalCustomers: 3875 },
  { contract: 'One Year', churnRate: 11.3, activeRate: 88.7, totalCustomers: 1473 },
  { contract: 'Two Year', churnRate: 2.8, activeRate: 97.2, totalCustomers: 1695 }
];

export const CHURN_BY_PAYMENT = [
  { method: 'Electronic Check', churnRate: 45.3, customers: 2365 },
  { method: 'Mailed Check', churnRate: 19.1, customers: 1612 },
  { method: 'Bank Transfer (Auto)', churnRate: 16.7, customers: 1544 },
  { method: 'Credit Card (Auto)', churnRate: 15.2, customers: 1522 }
];

function lookupWeight(map: Record<string, number>, key: string, fallback: number) {
  return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : fallback;
}

export function computeChurnPrediction(input: any, _thresholds?: any, modelKey = 'logistic-regression-pkl') {
  const senior = Number(input.seniorCitizen ?? input.SeniorCitizen ?? 0);
  const tenure = Number(input.tenure ?? 12);
  const monthly = Number(input.monthlyCharges ?? input.MonthlyCharges ?? 70.5);
  const total =
    input.totalCharges !== undefined && input.totalCharges !== ''
      ? Number(input.totalCharges)
      : input.TotalCharges !== undefined && input.TotalCharges !== ''
      ? Number(input.TotalCharges)
      : Number((tenure * monthly).toFixed(2));

  // 1. StandardScaler transformation
  const sSenior = (senior - PKL_PIPELINE_WEIGHTS.scalerMean[0]) / PKL_PIPELINE_WEIGHTS.scalerScale[0];
  const sTenure = (tenure - PKL_PIPELINE_WEIGHTS.scalerMean[1]) / PKL_PIPELINE_WEIGHTS.scalerScale[1];
  const sMonthly = (monthly - PKL_PIPELINE_WEIGHTS.scalerMean[2]) / PKL_PIPELINE_WEIGHTS.scalerScale[2];
  const sTotal = (total - PKL_PIPELINE_WEIGHTS.scalerMean[3]) / PKL_PIPELINE_WEIGHTS.scalerScale[3];

  let logit = PKL_PIPELINE_WEIGHTS.intercept;
  logit += sSenior * PKL_PIPELINE_WEIGHTS.numericCoefs.SeniorCitizen;
  logit += sTenure * PKL_PIPELINE_WEIGHTS.numericCoefs.tenure;
  logit += sMonthly * PKL_PIPELINE_WEIGHTS.numericCoefs.MonthlyCharges;
  logit += sTotal * PKL_PIPELINE_WEIGHTS.numericCoefs.TotalCharges;

  // 2. OneHotEncoder dot product
  const cat = PKL_PIPELINE_WEIGHTS.categoricalCoefs;
  const internetVal = String(input.internet || input.InternetService || 'Fiber optic');
  const noInternet = internetVal === 'No';

  logit += lookupWeight(cat.gender, String(input.gender || 'Female'), -0.110705);
  logit += lookupWeight(cat.Partner, String(input.partner || input.Partner || 'No'), -0.104116);
  logit += lookupWeight(cat.Dependents, String(input.dependents || input.Dependents || 'No'), 0.020161);
  logit += lookupWeight(cat.PhoneService, String(input.phoneService || input.PhoneService || 'Yes'), -0.082476);
  logit += lookupWeight(cat.MultipleLines, String(input.multipleLines || input.MultipleLines || 'No'), -0.215319);
  logit += lookupWeight(cat.InternetService, internetVal, 0.707981);

  const secVal = noInternet ? 'No internet service' : String(input.onlineSecurity || input.OnlineSecurity || 'No');
  const bakVal = noInternet ? 'No internet service' : String(input.onlineBackup || input.OnlineBackup || 'No');
  const devVal = noInternet ? 'No internet service' : String(input.deviceProtection || input.DeviceProtection || 'No');
  const supVal = noInternet ? 'No internet service' : String(input.techSupport || input.TechSupport || 'No');
  const tvVal = noInternet ? 'No internet service' : String(input.streamingTV || input.StreamingTV || 'No');
  const movVal = noInternet ? 'No internet service' : String(input.streamingMovies || input.StreamingMovies || 'No');

  logit += lookupWeight(cat.OnlineSecurity, secVal, 0.19903);
  logit += lookupWeight(cat.OnlineBackup, bakVal, 0.068511);
  logit += lookupWeight(cat.DeviceProtection, devVal, 0.011325);
  logit += lookupWeight(cat.TechSupport, supVal, 0.165519);
  logit += lookupWeight(cat.StreamingTV, tvVal, -0.176651);
  logit += lookupWeight(cat.StreamingMovies, movVal, -0.189877);
  logit += lookupWeight(cat.Contract, String(input.contract || input.Contract || 'Month-to-month'), 0.657713);
  logit += lookupWeight(cat.PaperlessBilling, String(input.paperlessBilling || input.PaperlessBilling || 'Yes'), 0.073017);
  logit += lookupWeight(cat.PaymentMethod, String(input.payment || input.PaymentMethod || 'Electronic check'), 0.240275);

  // Sigmoid activation
  let prob = (1 / (1 + Math.exp(-logit))) * 100;

  if (modelKey === 'gradient-boosting-nb') {
    prob = prob * 0.88 + ((input.contract || input.Contract) === 'Month-to-month' ? 4.5 : -2.0);
  } else if (modelKey === 'random-forest-nb') {
    prob = prob * 0.85 + (tenure < 6 ? 6.0 : -1.5);
  } else if (modelKey === 'extra-trees-nb') {
    prob = prob * 0.86 + (internetVal === 'Fiber optic' ? 3.5 : -1.0);
  } else if (modelKey === 'decision-tree-nb') {
    prob = prob >= 50 ? Math.min(94.0, prob + 8.5) : Math.max(5.0, prob - 7.5);
  }

  const clamped = Math.min(98.8, Math.max(1.8, prob));
  return {
    probability: Number(clamped.toFixed(1)),
    logit: Number(logit.toFixed(4)),
    scaledTenure: Number(sTenure.toFixed(3)),
    scaledMonthly: Number(sMonthly.toFixed(3)),
    computedTotalCharges: total
  };
}
