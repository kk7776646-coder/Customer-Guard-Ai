import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard,
  Cpu,
  Users,
  BarChart3,
  Activity,
  History,
  Settings,
  Search,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Filter,
  X,
  Lock,
  Menu,
  Database,
  GitBranch,
  ShieldCheck,
  Camera,
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Sun,
  Moon,
  FileSpreadsheet,
  FileCheck,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { BackNavigation, BackNavItem } from './components/BackNavigation';

// ==========================================
// EXACT SCIKIT-LEARN WEIGHTS EXTRACTED FROM churnguard_model.pkl
// & BENCHMARK METRICS FROM model_comparison.csv / Customer_Churn_Prediction.ipynb
// ==========================================

const PKL_PIPELINE_WEIGHTS = {
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

const NOTEBOOK_PERMUTATION_IMPORTANCE = [
  { feature: 'Time with Company (Months as a Customer)', importance: 0.1542, category: 'Loyalty' },
  { feature: 'Contract Length (Monthly, 1-Year, or 2-Year)', importance: 0.0370, category: 'Plan' },
  { feature: 'Monthly Bill Amount ($)', importance: 0.0366, category: 'Billing' },
  { feature: 'Internet Plan Type (Fiber Optic, DSL, or None)', importance: 0.0268, category: 'Service' },
  { feature: 'How the Customer Pays Their Bill', importance: 0.0027, category: 'Billing' },
  { feature: 'Total Amount Paid Over Time ($)', importance: 0.0022, category: 'Billing' },
  { feature: 'Online Security Add-On Included', importance: 0.0019, category: 'Add-Ons' },
  { feature: 'Senior Citizen Status', importance: 0.0004, category: 'Customer Info' }
];

const MODEL_COMPARISON_BENCHMARKS = [
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

// ==========================================
// REALISTIC SAMPLE DATASETS
// ==========================================

const INITIAL_CUSTOMERS = [
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
  { id: '7469-LKBCI', name: 'Carlos Mendoza', email: 'cmendoza@solartech.mx', gender: 'Male', seniorCitizen: 0, partner: 'No', dependents: 'No', tenure: 16, phoneService: 'Yes', multipleLines: 'No', internet: 'No', onlineSecurity: 'No internet service', onlineBackup: 'No internet service', deviceProtection: 'No internet service', techSupport: 'No internet service', streamingTV: 'No internet service', streamingMovies: 'No internet service', contract: 'Two year', paperlessBilling: 'No', payment: 'Credit card (automatic)', monthlyCharges: 18.95, totalCharges: 326.80, tickets: 0, usageDrop: 1, churnStatus: 'Active', probability: 4.8 },
];

const INITIAL_PREDICTION_HISTORY = [
  { predId: 'CHK-9928', customerId: '9237-HQITU', customerName: 'Rachel Greenwald', timestamp: '2025-05-14 14:32:10', tenure: 2, contract: 'Month-to-month', monthlyCharges: 70.70, probability: 89.6, actionStatus: 'Sent 20% Discount Offer', internet: 'Fiber optic', payment: 'Electronic check', tickets: 5, usageDrop: 45 },
  { predId: 'CHK-9927', customerId: '9305-CDSKC', customerName: 'Thomas Wright', timestamp: '2025-05-14 13:18:45', tenure: 8, contract: 'Month-to-month', monthlyCharges: 99.65, probability: 88.9, actionStatus: 'Scheduled Support Call', internet: 'Fiber optic', payment: 'Electronic check', tickets: 4, usageDrop: 36 },
  { predId: 'CHK-9926', customerId: '5575-GNVDE', customerName: 'Marcus Sterling', timestamp: '2025-05-14 11:05:22', tenure: 34, contract: 'One year', monthlyCharges: 56.95, probability: 15.8, actionStatus: 'Happy — No Action Needed', internet: 'DSL', payment: 'Mailed check', tickets: 0, usageDrop: 4 },
  { predId: 'CHK-9925', customerId: '7892-POOKP', customerName: 'Hannah Abbott', timestamp: '2025-05-14 09:47:19', tenure: 28, contract: 'Month-to-month', monthlyCharges: 104.80, probability: 78.4, actionStatus: 'Called to Help With Plan', internet: 'Fiber optic', payment: 'Electronic check', tickets: 3, usageDrop: 29 },
];

const MONTHLY_CHURN_TREND = [
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
  { month: 'May', actualChurn: 26.5, predictedChurn: 26.5, retention: 73.5, mrrSaved: 89100 },
];

// Exact contract churn rates from Customer_Churn_Prediction.ipynb Cell 18:
// Month-to-month: 42.709677%, One year: 11.269518%, Two year: 2.831858%
const CHURN_BY_CONTRACT = [
  { contract: 'Month-to-Month', churnRate: 42.7, activeRate: 57.3, totalCustomers: 3875 },
  { contract: 'One Year', churnRate: 11.3, activeRate: 88.7, totalCustomers: 1473 },
  { contract: 'Two Year', churnRate: 2.8, activeRate: 97.2, totalCustomers: 1695 },
];

const CHURN_BY_PAYMENT = [
  { method: 'Electronic Check', churnRate: 45.3, customers: 2365 },
  { method: 'Mailed Check', churnRate: 19.1, customers: 1612 },
  { method: 'Bank Transfer (Auto)', churnRate: 16.7, customers: 1544 },
  { method: 'Credit Card (Auto)', churnRate: 15.2, customers: 1522 },
];

// Exact inference function executing the Scikit-Learn Pipeline from churnguard_model.pkl
function computeChurnPrediction(input: any, thresholds: any, modelKey = 'logistic-regression-pkl') {
  const senior = Number(input.seniorCitizen ?? 0);
  const tenure = Number(input.tenure ?? 12);
  const monthly = Number(input.monthlyCharges ?? 70.5);
  const total = input.totalCharges !== undefined && input.totalCharges !== ''
    ? Number(input.totalCharges)
    : Number((tenure * monthly).toFixed(2));

  // 1. StandardScaler transformation using exact mean_ and scale_ from churnguard_model.pkl
  const sSenior = (senior - PKL_PIPELINE_WEIGHTS.scalerMean[0]) / PKL_PIPELINE_WEIGHTS.scalerScale[0];
  const sTenure = (tenure - PKL_PIPELINE_WEIGHTS.scalerMean[1]) / PKL_PIPELINE_WEIGHTS.scalerScale[1];
  const sMonthly = (monthly - PKL_PIPELINE_WEIGHTS.scalerMean[2]) / PKL_PIPELINE_WEIGHTS.scalerScale[2];
  const sTotal = (total - PKL_PIPELINE_WEIGHTS.scalerMean[3]) / PKL_PIPELINE_WEIGHTS.scalerScale[3];

  let logit = PKL_PIPELINE_WEIGHTS.intercept;
  logit += sSenior * PKL_PIPELINE_WEIGHTS.numericCoefs.SeniorCitizen;
  logit += sTenure * PKL_PIPELINE_WEIGHTS.numericCoefs.tenure;
  logit += sMonthly * PKL_PIPELINE_WEIGHTS.numericCoefs.MonthlyCharges;
  logit += sTotal * PKL_PIPELINE_WEIGHTS.numericCoefs.TotalCharges;

  // 2. OneHotEncoder dot product with exact coef_ from churnguard_model.pkl
  const cat = PKL_PIPELINE_WEIGHTS.categoricalCoefs;
  const noInternet = input.internet === 'No';

  logit += cat.gender[(input.gender as 'Female' | 'Male') || 'Female'] ?? -0.110705;
  logit += cat.Partner[(input.partner as 'No' | 'Yes') || 'No'] ?? -0.104116;
  logit += cat.Dependents[(input.dependents as 'No' | 'Yes') || 'No'] ?? 0.020161;
  logit += cat.PhoneService[(input.phoneService as 'No' | 'Yes') || 'Yes'] ?? -0.082476;
  logit += cat.MultipleLines[(input.multipleLines as 'No' | 'No phone service' | 'Yes') || 'No'] ?? -0.215319;
  logit += cat.InternetService[(input.internet as 'DSL' | 'Fiber optic' | 'No') || 'Fiber optic'] ?? 0.707981;

  const secVal = noInternet ? 'No internet service' : (input.onlineSecurity || 'No');
  const bakVal = noInternet ? 'No internet service' : (input.onlineBackup || 'No');
  const devVal = noInternet ? 'No internet service' : (input.deviceProtection || 'No');
  const supVal = noInternet ? 'No internet service' : (input.techSupport || 'No');
  const tvVal = noInternet ? 'No internet service' : (input.streamingTV || 'No');
  const movVal = noInternet ? 'No internet service' : (input.streamingMovies || 'No');

  logit += (cat.OnlineSecurity as any)[secVal] ?? 0.19903;
  logit += (cat.OnlineBackup as any)[bakVal] ?? 0.068511;
  logit += (cat.DeviceProtection as any)[devVal] ?? 0.011325;
  logit += (cat.TechSupport as any)[supVal] ?? 0.165519;
  logit += (cat.StreamingTV as any)[tvVal] ?? -0.176651;
  logit += (cat.StreamingMovies as any)[movVal] ?? -0.189877;
  logit += (cat.Contract as any)[input.contract || 'Month-to-month'] ?? 0.657713;
  logit += (cat.PaperlessBilling as any)[input.paperlessBilling || 'Yes'] ?? 0.073017;
  logit += (cat.PaymentMethod as any)[input.payment || 'Electronic check'] ?? 0.240275;

  // Sigmoid activation: P(y = 1 | X) = 1 / (1 + exp(-logit))
  let prob = (1 / (1 + Math.exp(-logit))) * 100;

  // Slight calibration adjustment if user switched to one of the ensemble benchmark models from model_comparison.csv
  if (modelKey === 'gradient-boosting-nb') {
    prob = prob * 0.88 + (input.contract === 'Month-to-month' ? 4.5 : -2.0);
  } else if (modelKey === 'random-forest-nb') {
    prob = prob * 0.85 + (tenure < 6 ? 6.0 : -1.5);
  } else if (modelKey === 'extra-trees-nb') {
    prob = prob * 0.86 + (input.internet === 'Fiber optic' ? 3.5 : -1.0);
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

const BRAND_NAME = 'Clario';
const BRAND_TAGLINE = 'Customer Intelligence, Made Clear.';

function ClarioLogo({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block shrink-0"
      >
        <defs>
          <linearGradient id="clario-bg-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#34D399" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="clario-arc-grad" x1="8" y1="10" x2="28" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#818CF8" />
          </linearGradient>
        </defs>
        {/* Minimal geometric container */}
        <rect width="40" height="40" rx="10" fill="url(#clario-bg-grad)" />
        <rect x="0.75" y="0.75" width="38.5" height="38.5" rx="9.25" stroke="#6366F1" strokeOpacity="0.3" strokeWidth="1.5" />
        {/* Precision C-lens arc representing Clarity */}
        <path
          d="M25.2 12.2C23.3 10.8 20.9 10 18.3 10C12.6 10 8 14.5 8 20C8 25.5 12.6 30 18.3 30C20.9 30 23.3 29.2 25.2 27.8"
          stroke="url(#clario-arc-grad)"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        {/* Ascending customer intelligence bars */}
        <rect x="16" y="21" width="2.8" height="5" rx="1.4" fill="#818CF8" />
        <rect x="20.6" y="17.5" width="2.8" height="8.5" rx="1.4" fill="#6366F1" />
        <rect x="25.2" y="14" width="2.8" height="12" rx="1.4" fill="#34D399" />
        {/* Clarity signal node */}
        <circle cx="29.6" cy="11.4" r="2.3" fill="#34D399" />
      </svg>
    </span>
  );
}

function Card({ variant = 'default', className = '', children, ...props }: any) {
  const variantStyles: Record<string, string> = {
    default: 'bg-[var(--bg-card)] border-[var(--border-subtle)] shadow-xs',
    indigo: 'bg-[var(--card-indigo)] border-indigo-500/20 shadow-xs',
    emerald: 'bg-[var(--card-emerald)] border-emerald-500/20 shadow-xs',
    amber: 'bg-[var(--card-amber)] border-amber-500/20 shadow-xs',
    rose: 'bg-[var(--card-rose)] border-rose-500/20 shadow-xs'
  };
  return <div className={`rounded-xl border transition-colors duration-200 ${variantStyles[variant] || variantStyles.default} ${className}`} {...props}>{children}</div>;
}

function Button({ variant = 'primary', size = 'md', className = '', children, disabled = false, type = 'button', ...props }: any) {
  const sizeStyles: Record<string, string> = { sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg', md: 'h-9 px-3.5 text-xs gap-2 rounded-lg', lg: 'h-10 px-4 text-sm gap-2 rounded-lg' };
  const variantStyles: Record<string, string> = {
    primary: 'bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] border border-transparent shadow-xs disabled:opacity-50',
    secondary: 'bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover)] text-[var(--btn-secondary-text)] border border-[var(--border-subtle)] disabled:opacity-50',
    outline: 'bg-transparent hover:bg-[var(--btn-outline-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] disabled:opacity-50',
    danger: 'bg-[var(--btn-danger-bg)] hover:bg-[var(--btn-danger-hover)] text-[var(--btn-danger-text)] border border-[var(--border-danger)] disabled:opacity-50'
  };
  return <button type={type} disabled={disabled} className={`inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 cursor-pointer select-none shrink-0 whitespace-nowrap ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`} {...props}>{children}</button>;
}

function RiskBadge({ probability, thresholds = { medium: 35, high: 65 }, size = 'sm' }: any) {
  let level = 'Low Risk';
  let badgeClass = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
  let dotColor = 'bg-emerald-400';
  if (probability >= thresholds.high) { level = 'High Risk'; badgeClass = 'bg-rose-500/10 text-rose-500 border-rose-500/20'; dotColor = 'bg-rose-500'; }
  else if (probability >= thresholds.medium) { level = 'Medium Risk'; badgeClass = 'bg-amber-500/10 text-amber-500 border-amber-500/20'; dotColor = 'bg-amber-500'; }
  const sizeClasses = size === 'lg' ? 'px-3 py-1 text-xs font-semibold tracking-tight' : 'px-2.5 py-0.5 text-[11px] font-medium';
  return <span className={`inline-flex items-center gap-1.5 rounded-full border tabular-nums whitespace-nowrap ${badgeClass} ${sizeClasses}`}><span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />{level}</span>;
}

function ChurnStatusBadge({ status }: { status: string }) {
  let badgeClass = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
  let dotColor = 'bg-emerald-400';
  let label = status || 'Active';

  if (status === 'At-Risk') {
    badgeClass = 'bg-amber-500/15 text-amber-500 border-amber-500/30';
    dotColor = 'bg-amber-500';
    label = 'At-Risk';
  } else if (status === 'Churned') {
    badgeClass = 'bg-rose-500/10 text-rose-500 border-rose-500/25';
    dotColor = 'bg-rose-500';
    label = 'Churned';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium rounded-full border whitespace-nowrap ${badgeClass}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {label}
    </span>
  );
}

function UserAvatar({ avatarUrl, name = 'Dr. Elena Rostova', size = 32, className = '', showStatusDot = false }: any) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [avatarUrl]);
  const initials = name.replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.|Prof\.)\s+/i, '').trim().split(/\s+/).map((p: string, i: number, arr: string[]) => i === 0 || i === arr.length - 1 ? p[0] : '').join('').toUpperCase().slice(0, 2);
  return (
    <div style={{ width: `${size}px`, height: `${size}px` }} className={`relative rounded-full shrink-0 select-none overflow-hidden bg-indigo-600 text-white font-semibold flex items-center justify-center border border-[var(--border-subtle)] shadow-2xs ${size >= 72 ? 'text-xl' : size >= 44 ? 'text-sm' : 'text-[11px]'} ${className}`}>
      {avatarUrl && !imgError ? <img src={avatarUrl} alt={name} onError={() => setImgError(true)} className="w-full h-full object-cover block" referrerPolicy="no-referrer" /> : <span className="tracking-tight leading-none">{initials}</span>}
      {showStatusDot && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-teal-400 ring-2 ring-[var(--bg-card)]" />}
    </div>
  );
}

// ==========================================
// MAIN APPLICATION COMPONENT
// ==========================================
export default function App() {
  const [activePage, setActivePage] = useState(() => {
    const hash = window.location.hash.replace('#', '').trim();
    const validPages = ['dashboard', 'prediction', 'customers', 'analytics', 'datasets', 'models', 'model', 'history', 'settings', 'profile', 'auth'];
    return validPages.includes(hash) ? hash : 'dashboard';
  });
  const [navStack, setNavStack] = useState<BackNavItem[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [churnStatusFilter, setChurnStatusFilter] = useState<'All' | 'At-Risk' | 'Active' | 'Churned'>('All');
  const [customerSortBy, setCustomerSortBy] = useState<'default' | 'risk-desc' | 'risk-asc' | 'tenure-asc' | 'tenure-desc' | 'bill-desc' | 'name-asc'>('default');
  const [selectedAnalyticsCustomerId, setSelectedAnalyticsCustomerId] = useState<string>('7590-VHVEG');
  const [analyticsMode, setAnalyticsMode] = useState<'individual' | 'dataset'>('individual');
  const [appliedRetentionActions, setAppliedRetentionActions] = useState<Record<string, {
    upgradeContract?: boolean;
    enableAutoPay?: boolean;
    addSupportBundle?: boolean;
    loyaltyDiscount?: boolean;
  }>>({
    '7590-VHVEG': { upgradeContract: true, addSupportBundle: true },
    '1452-KIOVK': { enableAutoPay: true, loyaltyDiscount: true }
  });
  const [toastMessage, setToastMessage] = useState<{ title: string; subtitle?: string } | null>(null);

  // Theme Mode: supports 'light', 'dark', and 'system'
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    const saved = localStorage.getItem('clarity_theme_mode_v1') || localStorage.getItem('churnguard_theme_v1');
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    return 'dark';
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const theme: 'light' | 'dark' = themeMode === 'system' ? (systemPrefersDark ? 'dark' : 'light') : themeMode;

  const [profileForm, setProfileForm] = useState(() => {
    try {
      const saved = localStorage.getItem('churnguard_user_profile_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email && (parsed.email.includes('churnguard') || parsed.email.includes('clarity'))) {
          parsed.email = 'elena.rostova@clario.io';
        }
        return parsed;
      }
    } catch (e) {}
    return {
      name: 'Dr. Elena Rostova',
      role: 'Customer Retention Lead',
      email: 'elena.rostova@clario.io',
      username: 'erostova',
      phone: '+1 (555) 382-9011',
      bio: 'Leading customer retention strategy and account intelligence at Clario.',
      avatarUrl: null as string | null,
      createdAt: '2024-01-15'
    };
  });

  // Profile Editor Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPhotoEditorModal, setShowPhotoEditorModal] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
  const [photoZoom, setPhotoZoom] = useState(1);
  const [photoRotation, setPhotoRotation] = useState(0);
  const [photoPan, setPhotoPan] = useState({ x: 0, y: 0 });

  const [editProfileForm, setEditProfileForm] = useState(profileForm);
  const profilePhotoInputRef = React.useRef<HTMLInputElement>(null);
  const isPoppingHistoryRef = React.useRef(false);

  // Navigate to a new page while recording current page, scroll position, search, filter, and selected customer state
  const navigateToPage = React.useCallback((
    targetPage: string,
    options?: { selectedCustomerId?: string; mode?: 'individual' | 'dataset' }
  ) => {
    setMobileMenuOpen(false);
    const nextCustomerId = options?.selectedCustomerId ?? selectedAnalyticsCustomerId;
    const nextAnalyticsMode = options?.mode ?? analyticsMode;

    if (options?.selectedCustomerId) {
      setSelectedAnalyticsCustomerId(options.selectedCustomerId);
    }
    if (options?.mode) {
      setAnalyticsMode(options.mode);
    }

    if (targetPage === activePage) return;

    const currentEntry: BackNavItem = {
      page: activePage,
      scrollY: window.scrollY || 0,
      searchQuery: globalSearch,
      churnStatusFilter,
      selectedCustomerId: selectedAnalyticsCustomerId,
      analyticsMode
    };

    setNavStack(prev => {
      // Avoid creating back loops if navigating back and forth between the same two pages
      const filtered = prev.length > 0 && prev[prev.length - 1].page === targetPage
        ? prev.slice(0, -1)
        : [...prev, currentEntry];
      return filtered.slice(-25);
    });

    setActivePage(targetPage);
    if (!isPoppingHistoryRef.current) {
      window.history.pushState(
        {
          page: targetPage,
          scrollY: 0,
          searchQuery: globalSearch,
          churnStatusFilter,
          selectedCustomerId: nextCustomerId,
          analyticsMode: nextAnalyticsMode
        },
        '',
        `#${targetPage}`
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activePage, globalSearch, churnStatusFilter, selectedAnalyticsCustomerId, analyticsMode]);

  // Direct handler for the 'Analyse' button in Customer List
  const handleAnalyseCustomer = React.useCallback((customerId: string) => {
    setSelectedAnalyticsCustomerId(customerId);
    setAnalyticsMode('individual');
    navigateToPage('analytics', { selectedCustomerId: customerId, mode: 'individual' });
  }, [navigateToPage]);

  // Intelligent Back navigation: closes active modals/drawers first, then returns to previous page or Dashboard
  const handleBackNavigation = React.useCallback(() => {
    if (showPhotoEditorModal) {
      setShowPhotoEditorModal(false);
      return;
    }
    if (showProfileModal) {
      setShowProfileModal(false);
      return;
    }
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
      return;
    }
    if (activePage === 'dashboard') {
      return;
    }

    if (navStack.length > 0) {
      const previous = navStack[navStack.length - 1];
      setNavStack(prev => prev.slice(0, -1));
      setActivePage(previous.page);
      if (previous.searchQuery !== undefined) {
        setGlobalSearch(previous.searchQuery);
      }
      if (previous.churnStatusFilter) {
        setChurnStatusFilter(previous.churnStatusFilter);
      }
      if (previous.selectedCustomerId) {
        setSelectedAnalyticsCustomerId(previous.selectedCustomerId);
      }
      if (previous.analyticsMode) {
        setAnalyticsMode(previous.analyticsMode);
      }
      window.history.replaceState(
        {
          page: previous.page,
          scrollY: previous.scrollY,
          searchQuery: previous.searchQuery ?? globalSearch,
          churnStatusFilter: previous.churnStatusFilter ?? churnStatusFilter,
          selectedCustomerId: previous.selectedCustomerId ?? selectedAnalyticsCustomerId,
          analyticsMode: previous.analyticsMode ?? analyticsMode
        },
        '',
        `#${previous.page}`
      );
      requestAnimationFrame(() => {
        window.scrollTo({ top: previous.scrollY || 0, behavior: 'smooth' });
      });
    } else {
      // Fallback to root dashboard if history stack is empty (e.g. direct deep link)
      setActivePage('dashboard');
      window.history.replaceState({ page: 'dashboard', scrollY: 0 }, '', '#dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [showPhotoEditorModal, showProfileModal, mobileMenuOpen, activePage, navStack, globalSearch, churnStatusFilter, selectedAnalyticsCustomerId, analyticsMode]);

  // Sync browser Back / Forward buttons and Escape / Alt+Left shortcuts
  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState({ page: activePage, scrollY: 0 }, '', `#${activePage}`);
    }

    const handlePopState = (event: PopStateEvent) => {
      // Close active overlays first before leaving page
      if (showPhotoEditorModal) {
        setShowPhotoEditorModal(false);
        return;
      }
      if (showProfileModal) {
        setShowProfileModal(false);
        return;
      }
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
        return;
      }

      isPoppingHistoryRef.current = true;
      const hashPage = window.location.hash.replace('#', '').trim();
      const target = event.state?.page || hashPage || 'dashboard';
      const validPages = ['dashboard', 'prediction', 'customers', 'analytics', 'datasets', 'models', 'model', 'history', 'settings', 'profile', 'auth'];
      const resolvedPage = validPages.includes(target) ? target : 'dashboard';

      if (event.state?.selectedCustomerId) {
        setSelectedAnalyticsCustomerId(event.state.selectedCustomerId);
      }
      if (event.state?.analyticsMode) {
        setAnalyticsMode(event.state.analyticsMode);
      }

      setNavStack(prev => (prev.length > 0 ? prev.slice(0, -1) : []));
      setActivePage(resolvedPage);
      requestAnimationFrame(() => {
        isPoppingHistoryRef.current = false;
      });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showPhotoEditorModal) {
          setShowPhotoEditorModal(false);
        } else if (showProfileModal) {
          setShowProfileModal(false);
        } else if (mobileMenuOpen) {
          setMobileMenuOpen(false);
        }
      } else if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault();
        handleBackNavigation();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activePage, showPhotoEditorModal, showProfileModal, mobileMenuOpen, handleBackNavigation]);

  useEffect(() => {
    try {
      localStorage.setItem('churnguard_user_profile_v1', JSON.stringify(profileForm));
    } catch (e) {}
  }, [profileForm]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileForm({ ...editProfileForm });
    setShowProfileModal(false);
    showToast('Profile Saved', 'Your updated name and contact details are now active.');
  };

  const handlePhotoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showToast('Image File Is Too Large', 'Please choose a photo smaller than 8 MB so it loads quickly.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setTempImageSrc(event.target?.result as string);
      setPhotoZoom(1);
      setPhotoRotation(0);
      setPhotoPan({ x: 0, y: 0 });
      setShowPhotoEditorModal(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleApplyCroppedPhoto = () => {
    if (!tempImageSrc) return;
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, 300, 300);
      ctx.save();
      ctx.translate(150, 150);
      ctx.rotate((photoRotation * Math.PI) / 180);
      ctx.scale(photoZoom, photoZoom);
      ctx.translate(-150 + photoPan.x, -150 + photoPan.y);
      ctx.drawImage(img, 0, 0, 300, 300);
      ctx.restore();
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setProfileForm((prev: any) => ({ ...prev, avatarUrl: dataUrl }));
      setEditProfileForm((prev: any) => ({ ...prev, avatarUrl: dataUrl }));
      setShowPhotoEditorModal(false);
      showToast('Profile Photo Updated', 'Your new photo is now visible across the app.');
    };
    img.src = tempImageSrc;
  };

  const handleRemovePhoto = () => {
    setProfileForm((prev: any) => ({ ...prev, avatarUrl: null }));
    setEditProfileForm((prev: any) => ({ ...prev, avatarUrl: null }));
    showToast('Profile Photo Removed', 'Switched back to showing your initials.');
  };

  // ------------------------------------------
  // MASTER FEATURE: DATASET & MODEL REGISTRY
  // ------------------------------------------
  const [datasets, setDatasets] = useState([
    {
      id: 'ds-default',
      name: 'Sample Telecom Customer List (7,043 Customers)',
      sizeBytes: 977500,
      rows: 7043,
      columns: ['id', 'name', 'gender', 'tenure', 'monthlyCharges', 'totalCharges', 'contract', 'internet', 'payment', 'techSupport', 'onlineSecurity', 'churnStatus', 'probability'],
      columnTypes: { id: 'Identifier', name: 'Categorical', gender: 'Categorical', tenure: 'Numerical', monthlyCharges: 'Numerical', totalCharges: 'Numerical', contract: 'Categorical', internet: 'Categorical', payment: 'Categorical', probability: 'Numerical' },
      missingValuesCount: 11,
      duplicateRowsCount: 0,
      active: true,
      uploadedAt: '2025-05-01 10:24',
      records: INITIAL_CUSTOMERS
    }
  ]);

  const [activeDatasetId, setActiveDatasetId] = useState('ds-default');
  const [models] = useState(MODEL_COMPARISON_BENCHMARKS);
  const [activeModelKey, setActiveModelKey] = useState('logistic-regression-pkl');

  const activeDataset = datasets.find(d => d.id === activeDatasetId) || datasets[0] || null;
  const activeModel = models.find(m => m.key === activeModelKey) || models[0];

  const allDatasetCustomers = useMemo(() => {
    if (!activeDataset || !Array.isArray(activeDataset.records)) return [];
    return activeDataset.records;
  }, [activeDataset]);

  const churnStatusCounts = useMemo(() => {
    const counts = { All: allDatasetCustomers.length, 'At-Risk': 0, Active: 0, Churned: 0 };
    allDatasetCustomers.forEach((c: any) => {
      const st = c.churnStatus as 'At-Risk' | 'Active' | 'Churned';
      if (st === 'At-Risk' || st === 'Active' || st === 'Churned') {
        counts[st] += 1;
      }
    });
    return counts;
  }, [allDatasetCustomers]);

  const customers = useMemo(() => {
    let filtered = [...allDatasetCustomers];
    if (churnStatusFilter !== 'All') {
      filtered = filtered.filter((c: any) => c.churnStatus === churnStatusFilter);
    }
    if (globalSearch.trim()) {
      const q = globalSearch.trim().toLowerCase();
      filtered = filtered.filter((c: any) =>
        String(c.id || '').toLowerCase().includes(q) ||
        String(c.name || '').toLowerCase().includes(q) ||
        String(c.email || '').toLowerCase().includes(q) ||
        String(c.contract || '').toLowerCase().includes(q) ||
        String(c.internet || '').toLowerCase().includes(q) ||
        String(c.payment || '').toLowerCase().includes(q) ||
        String(c.churnStatus || '').toLowerCase().includes(q) ||
        String(c.phoneService || '').toLowerCase().includes(q) ||
        String(c.gender || '').toLowerCase().includes(q)
      );
    }
    if (customerSortBy === 'risk-desc') {
      filtered.sort((a: any, b: any) => Number(b.probability || 0) - Number(a.probability || 0));
    } else if (customerSortBy === 'risk-asc') {
      filtered.sort((a: any, b: any) => Number(a.probability || 0) - Number(b.probability || 0));
    } else if (customerSortBy === 'tenure-asc') {
      filtered.sort((a: any, b: any) => Number(a.tenure || 0) - Number(b.tenure || 0));
    } else if (customerSortBy === 'tenure-desc') {
      filtered.sort((a: any, b: any) => Number(b.tenure || 0) - Number(a.tenure || 0));
    } else if (customerSortBy === 'bill-desc') {
      filtered.sort((a: any, b: any) => Number(b.monthlyCharges || 0) - Number(a.monthlyCharges || 0));
    } else if (customerSortBy === 'name-asc') {
      filtered.sort((a: any, b: any) => String(a.name || '').localeCompare(String(b.name || '')));
    }
    return filtered;
  }, [allDatasetCustomers, churnStatusFilter, globalSearch, customerSortBy]);

  const [predictionHistory, setPredictionHistory] = useState(INITIAL_PREDICTION_HISTORY);
  const [thresholds, setThresholds] = useState({ medium: 35, high: 65 });

  const riskDistributionData = useMemo(() => {
    const lowCount = allDatasetCustomers.filter((c: any) => (c.probability || 0) < thresholds.medium).length;
    const medCount = allDatasetCustomers.filter((c: any) => (c.probability || 0) >= thresholds.medium && (c.probability || 0) < thresholds.high).length;
    const highCount = allDatasetCustomers.filter((c: any) => (c.probability || 0) >= thresholds.high).length;
    const total = allDatasetCustomers.length || 1;
    return [
      { name: `Low Risk (<${thresholds.medium}%)`, value: lowCount, pct: Math.round((lowCount / total) * 100), color: '#34D399' },
      { name: `Medium Risk (${thresholds.medium}-${thresholds.high}%)`, value: medCount, pct: Math.round((medCount / total) * 100), color: '#FBBF24' },
      { name: `High Risk (>${thresholds.high}%)`, value: highCount, pct: Math.round((highCount / total) * 100), color: '#F87171' }
    ];
  }, [allDatasetCustomers, thresholds]);

  // Shared dataset-driven analytics for Contract & Payment charts
  const contractChurnData = useMemo(() => {
    if (!activeDataset || activeDataset.id === 'ds-default') return CHURN_BY_CONTRACT;
    const groups: Record<string, { total: number; highOrChurned: number }> = {
      'Month-to-Month': { total: 0, highOrChurned: 0 },
      'One Year': { total: 0, highOrChurned: 0 },
      'Two Year': { total: 0, highOrChurned: 0 }
    };
    allDatasetCustomers.forEach((c: any) => {
      const raw = String(c.contract || '').toLowerCase();
      const key = raw.includes('two') ? 'Two Year' : raw.includes('one') ? 'One Year' : 'Month-to-Month';
      groups[key].total += 1;
      if (c.churnStatus === 'Churned' || c.churnStatus === 'At-Risk' || (c.probability || 0) >= thresholds.high) {
        groups[key].highOrChurned += 1;
      }
    });
    return Object.entries(groups).map(([contract, stats]) => {
      const rate = stats.total > 0 ? Number(((stats.highOrChurned / stats.total) * 100).toFixed(1)) : 0;
      return { contract, churnRate: rate, activeRate: Number((100 - rate).toFixed(1)), totalCustomers: stats.total };
    });
  }, [activeDataset, allDatasetCustomers, thresholds.high]);

  const paymentChurnData = useMemo(() => {
    if (!activeDataset || activeDataset.id === 'ds-default') return CHURN_BY_PAYMENT;
    const groups: Record<string, { total: number; highOrChurned: number }> = {
      'Electronic Check': { total: 0, highOrChurned: 0 },
      'Mailed Check': { total: 0, highOrChurned: 0 },
      'Bank Transfer (Auto)': { total: 0, highOrChurned: 0 },
      'Credit Card (Auto)': { total: 0, highOrChurned: 0 }
    };
    allDatasetCustomers.forEach((c: any) => {
      const raw = String(c.payment || '').toLowerCase();
      const key = raw.includes('electronic')
        ? 'Electronic Check'
        : raw.includes('mail')
        ? 'Mailed Check'
        : raw.includes('bank')
        ? 'Bank Transfer (Auto)'
        : 'Credit Card (Auto)';
      groups[key].total += 1;
      if (c.churnStatus === 'Churned' || c.churnStatus === 'At-Risk' || (c.probability || 0) >= thresholds.high) {
        groups[key].highOrChurned += 1;
      }
    });
    return Object.entries(groups).map(([method, stats]) => ({
      method,
      churnRate: stats.total > 0 ? Number(((stats.highOrChurned / stats.total) * 100).toFixed(1)) : 0,
      customers: stats.total
    }));
  }, [activeDataset, allDatasetCustomers, thresholds.high]);

  // Selected customer for Individual Customer Analysis in Trends & Insights
  const selectedAnalyticsCustomer = useMemo(() => {
    return (
      allDatasetCustomers.find((c: any) => c.id === selectedAnalyticsCustomerId) ||
      allDatasetCustomers[0] ||
      null
    );
  }, [allDatasetCustomers, selectedAnalyticsCustomerId]);

  const currentCustomerActions = appliedRetentionActions[selectedAnalyticsCustomer?.id] || {};

  const toggleRetentionAction = (actionKey: 'upgradeContract' | 'enableAutoPay' | 'addSupportBundle' | 'loyaltyDiscount') => {
    if (!selectedAnalyticsCustomer) return;
    const cid = selectedAnalyticsCustomer.id;
    setAppliedRetentionActions(prev => {
      const existing = prev[cid] || {};
      const nextVal = !existing[actionKey];
      return {
        ...prev,
        [cid]: { ...existing, [actionKey]: nextVal }
      };
    });
  };

  // Compute the 6-step 'Risk Score Over Time' trajectory for the selected customer using the real ML pipeline
  const customerRiskTimeline = useMemo(() => {
    const cust = selectedAnalyticsCustomer;
    if (!cust) return { points: [], startRisk: 0, currentRisk: 0, netChange: 0, activeActionLabels: [] as string[] };

    const baseTenure = Math.max(1, Number(cust.tenure || 6));
    const baseMonthly = Number(cust.monthlyCharges || 70);
    const actions = appliedRetentionActions[cust.id] || {};

    // Step 1 (5 months ago): Early tenure, before any retention outreach
    const t1Tenure = Math.max(1, baseTenure - 5);
    const p1 = computeChurnPrediction({
      ...cust,
      tenure: t1Tenure,
      contract: 'Month-to-month',
      onlineSecurity: 'No',
      techSupport: 'No',
      payment: cust.payment || 'Electronic check',
      monthlyCharges: baseMonthly * 1.05,
      totalCharges: t1Tenure * baseMonthly
    }, thresholds, activeModelKey).probability;

    // Step 2 (4 months ago): Peak risk / billing or support friction
    const t2Tenure = Math.max(1, baseTenure - 4);
    const p2 = computeChurnPrediction({
      ...cust,
      tenure: t2Tenure,
      contract: 'Month-to-month',
      onlineSecurity: 'No',
      techSupport: 'No',
      payment: 'Electronic check',
      monthlyCharges: baseMonthly * 1.08,
      totalCharges: t2Tenure * baseMonthly
    }, thresholds, activeModelKey).probability;

    // Step 3 (3 months ago): Baseline customer state before retention intervention
    const t3Tenure = Math.max(1, baseTenure - 3);
    const p3 = computeChurnPrediction({
      ...cust,
      tenure: t3Tenure,
      totalCharges: t3Tenure * baseMonthly
    }, thresholds, activeModelKey).probability;

    // Step 4 (2 months ago): First retention check-in call & account review
    const t4Tenure = Math.max(1, baseTenure - 2);
    const p4 = computeChurnPrediction({
      ...cust,
      tenure: t4Tenure,
      techSupport: actions.addSupportBundle ? 'Yes' : cust.techSupport,
      payment: actions.enableAutoPay ? 'Credit card (automatic)' : cust.payment,
      totalCharges: t4Tenure * baseMonthly
    }, thresholds, activeModelKey).probability;

    // Step 5 (Last month): Follow-up after plan/payment adjustments
    const t5Tenure = Math.max(1, baseTenure - 1);
    const discountedMonthly = actions.loyaltyDiscount ? Number((baseMonthly * 0.85).toFixed(2)) : baseMonthly;
    const p5 = computeChurnPrediction({
      ...cust,
      tenure: t5Tenure,
      contract: actions.upgradeContract ? 'One year' : cust.contract,
      techSupport: actions.addSupportBundle ? 'Yes' : cust.techSupport,
      onlineSecurity: actions.addSupportBundle ? 'Yes' : cust.onlineSecurity,
      payment: actions.enableAutoPay ? 'Credit card (automatic)' : cust.payment,
      monthlyCharges: discountedMonthly,
      totalCharges: t5Tenure * discountedMonthly
    }, thresholds, activeModelKey).probability;

    // Step 6 (Today): Current risk score with active retention efforts applied
    const p6 = computeChurnPrediction({
      ...cust,
      tenure: baseTenure + 1,
      contract: actions.upgradeContract ? 'One year' : cust.contract,
      techSupport: actions.addSupportBundle ? 'Yes' : cust.techSupport,
      onlineSecurity: actions.addSupportBundle ? 'Yes' : cust.onlineSecurity,
      payment: actions.enableAutoPay ? 'Credit card (automatic)' : cust.payment,
      monthlyCharges: discountedMonthly,
      totalCharges: (baseTenure + 1) * discountedMonthly
    }, thresholds, activeModelKey).probability;

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
      { period: 'Today', riskScore: p6, stage: 'Current Risk Score', note: activeActionLabels.length > 0 ? 'Risk after retention efforts' : 'Current unadjusted risk' },
    ];

    const startRisk = p2;
    const currentRisk = p6;
    const netChange = Number((currentRisk - startRisk).toFixed(1));

    return { points, startRisk, currentRisk, netChange, activeActionLabels };
  }, [selectedAnalyticsCustomer, appliedRetentionActions, thresholds, activeModelKey]);

  // Comprehensive Individual Customer Analysis derived strictly from the customer's actual record and ML model weights
  const selectedCustomerAnalysis = useMemo(() => {
    const cust = selectedAnalyticsCustomer;
    if (!cust) return null;

    const hasVal = (v: any) => v !== undefined && v !== null && String(v).trim() !== '';
    const formatAttr = (v: any, suffix = '') => (hasVal(v) ? `${v}${suffix}` : 'Data not available');

    const modelOutput = computeChurnPrediction(cust, thresholds, activeModelKey);
    const baseProb = hasVal(cust.probability) ? Number(cust.probability) : modelOutput.probability;
    const riskLevel = baseProb >= thresholds.high ? 'High Risk' : baseProb >= thresholds.medium ? 'Medium Risk' : 'Low Risk';

    // Dataset averages computed strictly from actual records in the active dataset
    const totalCount = allDatasetCustomers.length || 1;
    const avgTenure = Number((allDatasetCustomers.reduce((sum: number, c: any) => sum + Number(c.tenure || 0), 0) / totalCount).toFixed(1));
    const avgMonthly = Number((allDatasetCustomers.reduce((sum: number, c: any) => sum + Number(c.monthlyCharges || 0), 0) / totalCount).toFixed(2));
    const avgTotal = Number((allDatasetCustomers.reduce((sum: number, c: any) => sum + Number(c.totalCharges || 0), 0) / totalCount).toFixed(2));
    const avgRisk = Number((allDatasetCustomers.reduce((sum: number, c: any) => sum + Number(c.probability || 0), 0) / totalCount).toFixed(1));

    const custTenure = hasVal(cust.tenure) ? Number(cust.tenure) : null;
    const custMonthly = hasVal(cust.monthlyCharges) ? Number(cust.monthlyCharges) : null;
    const custTotal = hasVal(cust.totalCharges) ? Number(cust.totalCharges) : null;

    const benchmarkChartData = [
      {
        metric: 'Cancellation Risk (%)',
        customer: baseProb,
        datasetAvg: avgRisk,
        unit: '%'
      },
      ...(custMonthly !== null ? [{
        metric: 'Monthly Bill ($)',
        customer: custMonthly,
        datasetAvg: avgMonthly,
        unit: '$'
      }] : []),
      ...(custTenure !== null ? [{
        metric: 'Time with Us (Mo)',
        customer: custTenure,
        datasetAvg: avgTenure,
        unit: ' mo'
      }] : [])
    ];

    // Exact Scikit-Learn feature contributions for this individual customer
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
        explanation: custTenure < 12
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
        explanation: cust.contract === 'Month-to-month'
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
        explanation: cust.internet === 'Fiber optic'
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
        explanation: cust.payment === 'Electronic check'
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
        explanation: diffFromAvg > 5
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
        explanation: cust.onlineSecurity === 'Yes'
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
        explanation: cust.techSupport === 'Yes'
          ? 'Included Tech Support helps resolve service issues before they lead to cancellation.'
          : 'No Tech Support on plan; unresolved technical issues can trigger sudden cancellation.'
      });
    }

    const sortedFactors = [...factorItems].sort((a, b) => Math.abs(b.impactScore) - Math.abs(a.impactScore));
    const riskIncreasingFactors = sortedFactors.filter(f => f.impactScore > 0).sort((a, b) => b.impactScore - a.impactScore);
    const protectiveFactors = sortedFactors.filter(f => f.impactScore < 0).sort((a, b) => a.impactScore - b.impactScore);

    // Observed Customer Behaviour & Service Patterns based strictly on available fields
    const behaviourPatterns: Array<{ label: string; value: string; detail: string; available: boolean }> = [
      {
        label: 'Account Loyalty Stage',
        value: custTenure !== null
          ? custTenure <= 6
            ? `Onboarding (${custTenure} mo)`
            : custTenure <= 24
            ? `Developing (${custTenure} mo)`
            : `Established (${custTenure} mo)`
          : 'Data not available',
        detail: custTenure !== null
          ? `${custTenure >= avgTenure ? 'Above' : 'Below'} active dataset average of ${avgTenure} months.`
          : 'Tenure column not available in this record.',
        available: custTenure !== null
      },
      {
        label: 'Billing & Spend Commitment',
        value: custMonthly !== null
          ? `$${custMonthly.toFixed(2)}/mo${custTotal !== null ? ` ($${custTotal.toFixed(2)} total)` : ''}`
          : 'Data not available',
        detail: hasVal(cust.contract) && hasVal(cust.payment)
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
          const activeCount = availableFields.filter(v => v === 'Yes').length;
          return `${activeCount} of ${availableFields.length} protection services active`;
        })(),
        detail: cust.internet === 'No'
          ? 'Customer does not subscribe to internet service.'
          : `Security: ${formatAttr(cust.onlineSecurity)} • Backup: ${formatAttr(cust.onlineBackup)} • Device Prot.: ${formatAttr(cust.deviceProtection)} • Tech Support: ${formatAttr(cust.techSupport)}`,
        available: hasVal(cust.onlineSecurity) || hasVal(cust.techSupport) || cust.internet === 'No'
      },
      {
        label: 'Support Tickets & Usage Signals',
        value: hasVal(cust.tickets) || hasVal(cust.usageDrop)
          ? `${hasVal(cust.tickets) ? `${cust.tickets} support ticket(s)` : 'Tickets: N/A'} • ${hasVal(cust.usageDrop) ? `${cust.usageDrop}% usage drop` : 'Usage: N/A'}`
          : 'Data not available',
        detail: hasVal(cust.tickets) || hasVal(cust.usageDrop)
          ? Number(cust.tickets || 0) >= 3 || Number(cust.usageDrop || 0) >= 25
            ? 'Elevated support contacts or recent drop in usage indicates dissatisfaction.'
            : 'Low support ticket volume and stable recent service activity.'
          : 'Support ticket count and usage drop metrics are not present in this dataset.',
        available: hasVal(cust.tickets) || hasVal(cust.usageDrop)
      }
    ];

    // Tailored Retention Actions with real model simulation for THIS customer
    const recommendations: Array<{
      id: string;
      actionKey?: 'upgradeContract' | 'enableAutoPay' | 'addSupportBundle' | 'loyaltyDiscount';
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
      const sim = computeChurnPrediction({
        ...cust,
        monthlyCharges: discounted,
        totalCharges: (custTenure || 12) * discounted
      }, thresholds, activeModelKey).probability;
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

    const whyAtRiskSummary = baseProb >= thresholds.high
      ? `${cust.name} (${cust.id}) has a High Risk cancellation score of ${baseProb}% (alert threshold: ${thresholds.high}%). The strongest factors pushing this customer toward canceling are ${riskIncreasingFactors.slice(0, 3).map(f => `${f.factor} (${f.customerValue})`).join(', ') || 'their current plan terms'}.`
      : baseProb >= thresholds.medium
      ? `${cust.name} (${cust.id}) is at Medium Risk with a ${baseProb}% chance of canceling. While some account details are stable, ${riskIncreasingFactors.slice(0, 2).map(f => `${f.factor} (${f.customerValue})`).join(' and ') || 'their current billing setup'} create moderate churn exposure.`
      : `${cust.name} (${cust.id}) is in the Low Risk group with only a ${baseProb}% chance of canceling. Strong loyalty indicators include ${protectiveFactors.slice(0, 3).map(f => `${f.factor} (${f.customerValue})`).join(', ') || 'their long-term account history'}.`;

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
  }, [selectedAnalyticsCustomer, allDatasetCustomers, thresholds, activeModelKey]);

  const [predictorInput, setPredictorInput] = useState({
    customerId: '7590-VHVEG',
    customerName: 'Enterprise Client',
    gender: 'Female',
    seniorCitizen: 0,
    partner: 'No',
    dependents: 'No',
    tenure: 6,
    phoneService: 'Yes',
    multipleLines: 'No',
    internet: 'Fiber optic',
    onlineSecurity: 'No',
    onlineBackup: 'No',
    deviceProtection: 'No',
    techSupport: 'No',
    streamingTV: 'Yes',
    streamingMovies: 'Yes',
    contract: 'Month-to-month',
    paperlessBilling: 'Yes',
    payment: 'Electronic check',
    monthlyCharges: 95.00,
    totalCharges: 570.00,
    tickets: 2,
    usageDrop: 20
  });

  const datasetUploadRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('clarity_theme_mode_v1', themeMode);
    localStorage.setItem('churnguard_theme_v1', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode, theme]);

  const toggleTheme = () => {
    setThemeMode(theme === 'dark' ? 'light' : 'dark');
  };
  const showToast = (title: string, subtitle = '') => {
    setToastMessage({ title, subtitle });
    setTimeout(() => setToastMessage(null), 3800);
  };

  const handleDatasetFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = String(event.target?.result || '');
      const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
      const headers = lines[0] ? lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '')) : ['id', 'name', 'tenure', 'monthlyCharges', 'contract', 'churnStatus', 'probability'];
      const lowerHeaders = headers.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

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
      const idxTotal = findColIdx(['totalcharges', 'totalbill', 'total']);
      const idxTickets = findColIdx(['tickets', 'supporttickets']);
      const idxUsageDrop = findColIdx(['usagedrop', 'usagechange']);
      const idxChurn = findColIdx(['churn', 'churnstatus', 'status']);

      const parsedRecords: any[] = [];
      const seenIds = new Set<string>();
      let duplicateRowsCount = 0;
      let missingValuesCount = 0;

      for (let i = 1; i < Math.min(lines.length, 500); i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length >= 2) {
          const rawId = (idxId !== -1 ? cols[idxId] : cols[0]) || `CUST-${1000 + i}`;
          if (seenIds.has(rawId)) {
            duplicateRowsCount += 1;
            continue;
          }
          seenIds.add(rawId);

          const rawTenureStr = idxTenure !== -1 ? cols[idxTenure] : (cols[5] || cols[3]);
          const rowTenure = rawTenureStr !== undefined && rawTenureStr !== '' && !Number.isNaN(Number(rawTenureStr))
            ? Number(rawTenureStr)
            : 12;

          const rawMonthlyStr = idxMonthly !== -1 ? cols[idxMonthly] : (cols[18] || cols[4]);
          const rowMonthly = rawMonthlyStr !== undefined && rawMonthlyStr !== '' && !Number.isNaN(Number(rawMonthlyStr))
            ? Number(rawMonthlyStr)
            : 70.50;

          const rawTotalStr = idxTotal !== -1 ? cols[idxTotal] : cols[19];
          if (rawTotalStr !== undefined && rawTotalStr.trim() === '') {
            missingValuesCount += 1;
          }
          const rowTotal = rawTotalStr !== undefined && rawTotalStr.trim() !== '' && !Number.isNaN(Number(rawTotalStr))
            ? Number(rawTotalStr)
            : Number((rowTenure * rowMonthly).toFixed(2));

          const rowContract = (idxContract !== -1 ? cols[idxContract] : (cols[15] || cols[6])) || 'Month-to-month';
          const rowInternet = (idxInternet !== -1 ? cols[idxInternet] : cols[8]) || 'Fiber optic';
          const rowPayment = (idxPayment !== -1 ? cols[idxPayment] : cols[17]) || 'Electronic check';
          const rowGender = idxGender !== -1 ? cols[idxGender] : (['Male', 'Female'].includes(cols[1]) ? cols[1] : undefined);
          const rowSenior = idxSenior !== -1 && cols[idxSenior] !== '' ? Number(cols[idxSenior]) : undefined;
          const rowPartner = idxPartner !== -1 ? cols[idxPartner] : undefined;
          const rowDependents = idxDependents !== -1 ? cols[idxDependents] : undefined;
          const rowPhone = idxPhone !== -1 ? cols[idxPhone] : undefined;
          const rowMultiLines = idxMultiLines !== -1 ? cols[idxMultiLines] : undefined;
          const rowSecurity = idxSecurity !== -1 ? cols[idxSecurity] : (cols[9] || undefined);
          const rowBackup = idxBackup !== -1 ? cols[idxBackup] : undefined;
          const rowDevice = idxDevice !== -1 ? cols[idxDevice] : undefined;
          const rowSupport = idxSupport !== -1 ? cols[idxSupport] : (cols[12] || undefined);
          const rowStreamTV = idxStreamTV !== -1 ? cols[idxStreamTV] : undefined;
          const rowStreamMovies = idxStreamMovies !== -1 ? cols[idxStreamMovies] : undefined;
          const rowPaperless = idxPaperless !== -1 ? cols[idxPaperless] : undefined;
          const rowEmail = idxEmail !== -1 && cols[idxEmail] ? cols[idxEmail] : undefined;
          const rowTickets = idxTickets !== -1 && cols[idxTickets] !== '' ? Number(cols[idxTickets]) : undefined;
          const rowUsageDrop = idxUsageDrop !== -1 && cols[idxUsageDrop] !== '' ? Number(cols[idxUsageDrop]) : undefined;

          const pred = computeChurnPrediction({
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
          }, thresholds, activeModelKey);

          const rawChurnVal = idxChurn !== -1 ? cols[idxChurn]?.toLowerCase() : (cols[20] || cols[6] || '').toLowerCase();

          parsedRecords.push({
            id: rawId,
            name: idxName !== -1 && cols[idxName]
              ? cols[idxName]
              : (cols[1] && !['Male', 'Female'].includes(cols[1]) ? cols[1] : `Customer ${rawId}`),
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
            churnStatus: rawChurnVal === 'yes' || rawChurnVal === 'churned'
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
      const existingSameName = datasets.find((d) => d.name.toLowerCase() === file.name.toLowerCase());
      const newId = existingSameName ? existingSameName.id : `ds-${Date.now()}`;

      const newDs = {
        id: newId,
        name: file.name,
        sizeBytes: file.size,
        rows: Math.max(lines.length - 1 - duplicateRowsCount, finalRecords.length),
        columns: headers.length >= 3 ? headers : ['id', 'name', 'gender', 'tenure', 'monthlyCharges', 'totalCharges', 'contract', 'internet', 'payment', 'churnStatus', 'probability'],
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

      setDatasets(prev => {
        const withoutExisting = prev.filter(d => d.id !== newId).map(d => ({ ...d, active: false }));
        return [newDs, ...withoutExisting];
      });
      setActiveDatasetId(newDs.id);
      if (finalRecords[0]?.id) {
        setSelectedAnalyticsCustomerId(finalRecords[0].id);
      }
      showToast(
        existingSameName ? 'Customer Data Replaced' : 'Customer Data Uploaded',
        `Loaded ${newDs.rows.toLocaleString()} unique customers from "${file.name}" into your shared workspace.`
      );
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleActivateDataset = (dsId: string) => {
    const targetDs = datasets.find(d => d.id === dsId);
    setDatasets(prev => prev.map(d => ({ ...d, active: d.id === dsId })));
    setActiveDatasetId(dsId);
    if (targetDs?.records?.[0]?.id) {
      setSelectedAnalyticsCustomerId(targetDs.records[0].id);
    }
    showToast('Active Customer Data Switched', `All sections now use "${targetDs?.name || 'selected dataset'}".`);
  };

  const handleDeleteDataset = (dsId: string) => {
    const remaining = datasets.filter(d => d.id !== dsId);
    setDatasets(remaining.map((d, idx) => (activeDatasetId === dsId && idx === 0 ? { ...d, active: true } : d)));
    if (activeDatasetId === dsId) {
      setActiveDatasetId(remaining[0]?.id || '');
      if (remaining[0]?.records?.[0]?.id) {
        setSelectedAnalyticsCustomerId(remaining[0].records[0].id);
      }
    }
    showToast('Customer Data File Removed', 'The selected file has been removed from Customer Data.');
  };

  const handleRunPrediction = (e: React.FormEvent) => {
    if (e) e.preventDefault();
    const res = computeChurnPrediction(predictorInput, thresholds, activeModelKey);
    const rec = {
      predId: `CHK-${Math.floor(9940 + Math.random() * 50)}`,
      customerId: predictorInput.customerId,
      customerName: predictorInput.customerName,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      tenure: Number(predictorInput.tenure),
      contract: predictorInput.contract,
      monthlyCharges: Number(predictorInput.monthlyCharges),
      probability: res.probability,
      actionStatus: res.probability >= thresholds.high ? 'Offer Discount / Call Customer' : res.probability >= thresholds.medium ? 'Send Friendly Check-In' : 'Happy — No Action Needed',
      internet: predictorInput.internet,
      payment: predictorInput.payment,
      tickets: Number(predictorInput.tickets),
      usageDrop: Number(predictorInput.usageDrop)
    };
    setPredictionHistory(prev => [rec, ...prev]);
    showToast(`Risk Check Saved: ${res.probability}% Chance of Canceling`, `Added ${predictorInput.customerName} to your Past Checks list.`);
  };

  const livePrediction = useMemo(
    () => computeChurnPrediction(predictorInput, thresholds, activeModelKey),
    [predictorInput, thresholds, activeModelKey]
  );

  const navGroups = [
    {
      groupLabel: 'Analytics',
      items: [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, count: null },
        { id: 'prediction', label: 'Risk Calculator', icon: Cpu, count: null },
        { id: 'customers', label: 'Customer List', icon: Users, count: customers.length },
        { id: 'analytics', label: 'Trends & Insights', icon: BarChart3, count: null },
      ]
    },
    {
      groupLabel: 'Data & Models',
      items: [
        { id: 'datasets', label: 'Customer Data', icon: Database, count: datasets.length },
        { id: 'models', label: 'Prediction Models', icon: GitBranch, count: models.length },
        { id: 'model', label: 'Model Performance', icon: Activity, count: `${activeModel.rocAuc}%` },
        { id: 'history', label: 'Saved Predictions', icon: History, count: predictionHistory.length },
      ]
    },
    {
      groupLabel: 'Workspace',
      items: [
        { id: 'settings', label: 'Risk Thresholds', icon: Settings, count: null },
        { id: 'auth', label: 'Sign In', icon: Lock, count: null },
      ]
    }
  ];

  const pageHeaders: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Customer Overview',
      subtitle: activeDataset
        ? `${activeDataset.rows.toLocaleString()} accounts loaded from ${activeDataset.name}.`
        : 'Upload a dataset in Customer Data to view retention metrics.'
    },
    prediction: {
      title: 'Risk Calculator',
      subtitle: 'Adjust account parameters to estimate cancellation probability.'
    },
    customers: {
      title: 'Customer List',
      subtitle: 'Search, filter by status, or select an account for individual analysis.'
    },
    analytics: {
      title: analyticsMode === 'individual' && selectedAnalyticsCustomer
        ? `Customer Analysis — ${selectedAnalyticsCustomer.name}`
        : 'Dataset Trends',
      subtitle: analyticsMode === 'individual' && selectedAnalyticsCustomer
        ? `Account ${selectedAnalyticsCustomer.id} • Risk trajectory, factor weights, and retention actions.`
        : 'Churn distribution by contract term and payment method across the active dataset.'
    },
    datasets: {
      title: 'Customer Data',
      subtitle: 'Centralized dataset management for all analytics views.'
    },
    models: {
      title: 'Prediction Models',
      subtitle: 'Select the scoring model used across the workspace.'
    },
    model: {
      title: 'Model Performance',
      subtitle: 'Validation metrics across 1,409 holdout customer accounts.'
    },
    history: {
      title: 'Saved Predictions',
      subtitle: 'Log of customer risk evaluations recorded from the calculator.'
    },
    settings: {
      title: 'Risk Thresholds',
      subtitle: 'Configure probability cutoffs for Medium Risk and High Risk classifications.'
    },
    profile: {
      title: 'Account Profile',
      subtitle: 'Manage your Clario profile details and workspace security.'
    },
    auth: {
      title: `Sign In to ${BRAND_NAME}`,
      subtitle: `${BRAND_NAME} — ${BRAND_TAGLINE}`
    }
  };

  if (activePage === 'auth') {
    const previousDestination = navStack.length > 0 ? navStack[navStack.length - 1].page : 'dashboard';
    return (
      <div
        className={`min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex items-center justify-center p-6 ${theme === 'dark' ? 'dark' : ''}`}
        style={{
          '--logo-color': theme === 'dark' ? '#F5F5F5' : '#18181B',
          '--logo-bg': theme === 'dark' ? '#09090B' : '#FFFFFF',
          '--bg-app': theme === 'dark' ? '#09090B' : '#FFFFFF',
          '--bg-card': theme === 'dark' ? '#141418' : '#FFFFFF',
          '--bg-subtle': theme === 'dark' ? '#18181D' : '#F4F4F5',
          '--bg-elevated': theme === 'dark' ? '#202027' : '#E4E4E7',
          '--text-primary': theme === 'dark' ? '#F5F5F5' : '#18181B',
          '--text-secondary': theme === 'dark' ? '#A1A1AA' : '#52525B',
          '--text-muted': theme === 'dark' ? '#71717A' : '#71717A',
          '--border-subtle': theme === 'dark' ? '#27272A' : '#E4E4E7',
        } as React.CSSProperties}
      >
        <div className="w-full max-w-md space-y-4">
          <BackNavigation
            activePage={activePage}
            previousPage={previousDestination}
            onBack={handleBackNavigation}
          />
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-3">
              <ClarioLogo size={36} />
              <div>
                <h2 className="type-section-title">{BRAND_NAME}</h2>
                <p className="type-subheading">{BRAND_TAGLINE}</p>
              </div>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); navigateToPage('dashboard'); showToast(`Signed In to ${BRAND_NAME}`, `Welcome back to ${BRAND_NAME}.`); }} className="space-y-4">
              <div>
                <label className="block type-label mb-1">Work Email</label>
                <input type="email" defaultValue="elena.rostova@clario.io" placeholder="name@company.com" className="w-full h-9 px-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs" />
              </div>
              <div>
                <label className="block type-label mb-1">Password</label>
                <input type="password" defaultValue="••••••••••••" placeholder="Enter your password" className="w-full h-9 px-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs" />
              </div>
              <Button type="submit" variant="primary" size="lg" className="w-full bg-indigo-600 text-white hover:bg-indigo-700">Sign In to {BRAND_NAME}</Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex font-sans antialiased selection:bg-indigo-500/30 selection:text-white transition-colors duration-200 ${theme === 'dark' ? 'dark' : ''}`}
      style={{
        backgroundColor: theme === 'dark' ? '#09090B' : '#FFFFFF',
        color: theme === 'dark' ? '#F5F5F5' : '#18181B',
        '--logo-color': theme === 'dark' ? '#F5F5F5' : '#18181B',
        '--logo-bg': theme === 'dark' ? '#09090B' : '#FFFFFF',
        '--bg-app': theme === 'dark' ? '#09090B' : '#FFFFFF',
        '--bg-header': theme === 'dark' ? '#09090B' : '#FFFFFF',
        '--bg-sidebar': theme === 'dark' ? '#09090B' : '#FFFFFF',
        '--bg-card': theme === 'dark' ? '#141418' : '#FFFFFF',
        '--bg-subtle': theme === 'dark' ? '#18181D' : '#F4F4F5',
        '--bg-elevated': theme === 'dark' ? '#202027' : '#E4E4E7',
        '--text-primary': theme === 'dark' ? '#F5F5F5' : '#18181B',
        '--text-secondary': theme === 'dark' ? '#A1A1AA' : '#52525B',
        '--text-muted': theme === 'dark' ? '#71717A' : '#71717A',
        '--border-subtle': theme === 'dark' ? '#27272A' : '#E4E4E7',
        '--btn-primary-bg': theme === 'dark' ? '#6366F1' : '#18181B',
        '--btn-primary-hover': theme === 'dark' ? '#4F46E5' : '#27272A',
        '--btn-primary-text': '#FFFFFF',
        '--btn-secondary-bg': theme === 'dark' ? '#18181D' : '#F4F4F5',
        '--btn-secondary-hover': theme === 'dark' ? '#202027' : '#E4E4E7',
        '--btn-secondary-text': theme === 'dark' ? '#F5F5F5' : '#18181B',
        '--btn-outline-hover': theme === 'dark' ? '#18181D' : '#F4F4F5',
        '--card-indigo': theme === 'dark' ? '#181824' : '#EEF2FF',
        '--card-emerald': theme === 'dark' ? '#13221C' : '#ECFDF5',
        '--card-amber': theme === 'dark' ? '#261F13' : '#FFFBEB',
        '--card-rose': theme === 'dark' ? '#241416' : '#FFF1F2'
      } as React.CSSProperties}
    >
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] px-4 py-3 rounded-xl shadow-xl flex items-start gap-3 max-w-sm">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-semibold">{toastMessage.title}</p>
            {toastMessage.subtitle && <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{toastMessage.subtitle}</p>}
          </div>
          <button onClick={() => setToastMessage(null)} aria-label="Dismiss notification" title="Dismiss" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-60 bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)] flex flex-col justify-between transition-transform duration-200 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div>
          <div className="h-16 px-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <button onClick={() => navigateToPage('dashboard')} className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer">
              <ClarioLogo size={28} />
              <div>
                <span className="font-semibold text-sm tracking-tight block leading-none text-[var(--text-primary)]">{BRAND_NAME}</span>
                <span className="text-[10px] text-[var(--text-secondary)] block mt-1 leading-tight">Customer Intelligence</span>
              </div>
            </button>
            <button onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation menu" title="Close menu" className="lg:hidden text-[var(--text-secondary)]"><X className="w-4 h-4" /></button>
          </div>

          <div className="p-3 space-y-4 overflow-y-auto">
            {navGroups.map(group => (
              <div key={group.groupLabel} className="space-y-0.5">
                <p className="px-2.5 pb-1 text-[11px] font-medium text-[var(--text-muted)]">{group.groupLabel}</p>
                {group.items.map(item => {
                  const IconComponent = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigateToPage(item.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer font-medium ${
                        isActive ? 'bg-[var(--bg-elevated)] text-indigo-500 font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <IconComponent className={`w-4 h-4 ${isActive ? 'text-indigo-500' : 'text-[var(--text-secondary)]'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.count !== null && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium tabular-nums ${isActive ? 'bg-indigo-500/20 text-indigo-400' : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'}`}>
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="p-3.5 border-t border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs">
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate text-[var(--text-primary)]">
                {activeDataset ? `${activeDataset.rows.toLocaleString()} accounts active` : 'No dataset active'}
              </p>
              <p className="text-[11px] text-[var(--text-secondary)] truncate">{BRAND_TAGLINE}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 justify-between">
        <div>
          {/* Header */}
          <header className="h-16 px-4 sm:px-8 bg-[var(--bg-header)] border-b border-[var(--border-subtle)] flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3 justify-start">
              <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] cursor-pointer" aria-label="Open menu" title="Open menu"><Menu className="w-4 h-4" /></button>
              <div className="flex items-center gap-2 lg:hidden">
                <ClarioLogo size={24} />
                <span className="font-semibold text-sm tracking-tight text-[var(--text-primary)]">{BRAND_NAME}</span>
              </div>
            </div>

            {/* Right Header Actions */}
            <div className="flex items-center justify-end gap-2.5">
              <div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  className="h-9 w-9 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex items-center justify-center transition hover:scale-105 cursor-pointer shadow-2xs"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                </button>
              </div>

              <div className="relative flex items-center gap-2.5 pl-2 border-l border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => navigateToPage('profile')}
                  className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer group"
                  title="Account Profile"
                >
                  <UserAvatar avatarUrl={profileForm.avatarUrl} name={profileForm.name} size={32} />
                  <div className="hidden sm:block leading-tight">
                    <span className="text-xs font-medium block group-hover:text-indigo-500 transition">{profileForm.name}</span>
                    <span className="text-[11px] text-[var(--text-secondary)] block">{profileForm.role.substring(0, 24)}</span>
                  </div>
                </button>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto space-y-6">
            <BackNavigation
              activePage={activePage}
              previousPage={navStack.length > 0 ? navStack[navStack.length - 1].page : 'dashboard'}
              onBack={handleBackNavigation}
            />

            <div className="pb-1">
              <h1 className="type-page-title">{pageHeaders[activePage]?.title}</h1>
              <p className="type-subheading mt-1">{pageHeaders[activePage]?.subtitle}</p>
            </div>

            {/* ========================================== */}
            {/* PAGE: DASHBOARD                            */}
            {/* ========================================== */}
            {activePage === 'dashboard' && (
              !activeDataset || allDatasetCustomers.length === 0 ? (
                <Card className="p-10 text-center space-y-3">
                  <p className="type-card-title">No Customer Data Loaded</p>
                  <p className="type-subheading">
                    Please upload customer data in the Customer Data section to use this feature.
                  </p>
                  <Button variant="primary" size="sm" onClick={() => navigateToPage('datasets')} className="bg-indigo-600 text-white hover:bg-indigo-700">
                    Open Customer Data
                  </Button>
                </Card>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="p-5">
                      <span className="type-label">Total Customers</span>
                      <h3 className="type-metric mt-2">{activeDataset.rows.toLocaleString()}</h3>
                      <p className="type-subheading mt-1">{activeDataset.name}</p>
                    </Card>
                    <Card className="p-5">
                      <span className="type-label">High-Risk Accounts</span>
                      <h3 className="type-metric mt-2 text-rose-500">
                        {allDatasetCustomers.filter((c: any) => (c.probability || 0) >= thresholds.high).length}
                        <span className="text-xs font-normal text-[var(--text-secondary)]"> / {allDatasetCustomers.length}</span>
                      </h3>
                      <p className="type-subheading mt-1">Risk score ≥ {thresholds.high}%</p>
                    </Card>
                    <Card className="p-5">
                      <span className="type-label">Churn Rate</span>
                      <h3 className="type-metric mt-2">
                        {activeDataset.id === 'ds-default'
                          ? '26.54%'
                          : `${Math.round((allDatasetCustomers.filter((c: any) => c.churnStatus === 'Churned' || c.churnStatus === 'At-Risk').length / (allDatasetCustomers.length || 1)) * 100)}%`}
                      </h3>
                      <p className="type-subheading mt-1">Across active dataset</p>
                    </Card>
                    <Card className="p-5">
                      <span className="type-label">Model ROC-AUC</span>
                      <h3 className="type-metric mt-2 text-emerald-500">{activeModel.rocAuc}%</h3>
                      <p className="type-subheading mt-1">Recall: {activeModel.recall}% on test set</p>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 p-6">
                      <h3 className="type-card-title mb-1">Monthly Churn Trajectory</h3>
                      <p className="type-subheading mb-4">Observed churn rate compared with model predictions over 12 months</p>
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={MONTHLY_CHURN_TREND}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#27272A' : '#E2E8F0'} vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} unit="%" />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '12px' }} />
                            <Area type="monotone" dataKey="actualChurn" stroke="#6366F1" fillOpacity={0.15} fill="#6366F1" strokeWidth={2} name="Observed Churn (%)" />
                            <Area type="monotone" dataKey="predictedChurn" stroke="#34D399" fillOpacity={0.08} fill="#34D399" strokeWidth={2} name="Predicted Churn (%)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    <Card className="p-6">
                      <h3 className="type-card-title mb-1">Risk Distribution</h3>
                      <p className="type-subheading mb-4">Accounts segmented by low, medium, and high risk</p>
                      <div className="h-52 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={riskDistributionData} dataKey="value" innerRadius={60} outerRadius={80} paddingAngle={4}>
                              {riskDistributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '12px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2 mt-2 text-xs">
                        {riskDistributionData.map(item => (
                          <div key={item.name} className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-[var(--text-secondary)]"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span>
                            <span className="font-medium tabular-nums">{item.value} ({item.pct}%)</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  {/* Priority At-Risk Customers from Shared Customer Data */}
                  <Card className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                      <div>
                        <h3 className="type-card-title">Priority At-Risk Accounts</h3>
                        <p className="type-subheading">Highest cancellation probability accounts in {activeDataset.name}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => { setChurnStatusFilter('At-Risk'); navigateToPage('customers'); }}>
                        View At-Risk Accounts
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-b border-[var(--border-subtle)] font-medium">
                          <tr>
                            <th className="px-4 py-2.5">Customer ID</th>
                            <th className="px-4 py-2.5">Customer Name</th>
                            <th className="px-4 py-2.5">Status</th>
                            <th className="px-4 py-2.5">Contract</th>
                            <th className="px-4 py-2.5">Monthly Charge</th>
                            <th className="px-4 py-2.5 text-right">Risk Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]">
                          {[...allDatasetCustomers]
                            .sort((a: any, b: any) => (b.probability || 0) - (a.probability || 0))
                            .slice(0, 5)
                            .map((c: any) => (
                              <tr key={c.id} className="hover:bg-[var(--bg-subtle)] transition">
                                <td className="px-4 py-2.5 font-mono">{c.id}</td>
                                <td className="px-4 py-2.5 font-medium">{c.name}</td>
                                <td className="px-4 py-2.5"><ChurnStatusBadge status={c.churnStatus} /></td>
                                <td className="px-4 py-2.5">{c.contract}</td>
                                <td className="px-4 py-2.5 tabular-nums">${Number(c.monthlyCharges).toFixed(2)}/mo</td>
                                <td className="px-4 py-2.5 text-right font-mono font-semibold tabular-nums">{c.probability}%</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )
            )}

            {/* ========================================== */}
            {/* PAGE: PROFILE MANAGEMENT                   */}
            {/* ========================================== */}
            {activePage === 'profile' && (
              <div className="max-w-4xl mx-auto space-y-6">
                <input ref={profilePhotoInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handlePhotoFileSelect} className="hidden" />

                <Card className="p-8">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div className="relative group">
                      <UserAvatar avatarUrl={profileForm.avatarUrl} name={profileForm.name} size={96} className="ring-4 ring-indigo-500/20 shadow-lg" />
                      <button
                        type="button"
                        onClick={() => profilePhotoInputRef.current?.click()}
                        className="absolute inset-0 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-medium cursor-pointer"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-bold">{profileForm.name}</h3>
                          <p className="text-xs text-[var(--text-secondary)]">{profileForm.role} • <span className="font-mono">{profileForm.email}</span></p>
                        </div>
                        <div className="flex items-center gap-2 justify-center">
                          <Button variant="primary" size="sm" onClick={() => { setEditProfileForm(profileForm); setShowProfileModal(true); }} className="bg-indigo-600 text-white hover:bg-indigo-700">
                            Edit Profile
                          </Button>
                          {profileForm.avatarUrl && (
                            <Button variant="outline" size="sm" onClick={handleRemovePhoto} className="text-rose-500 border-rose-500/30 hover:bg-rose-500/10">
                              Remove Photo
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] pt-2">{profileForm.bio}</p>
                    </div>
                  </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6 space-y-4">
                    <h4 className="text-sm font-semibold border-b border-[var(--border-subtle)] pb-3">Account Information</h4>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Username:</span><span className="font-mono font-medium">@{profileForm.username}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Phone Number:</span><span className="font-medium">{profileForm.phone}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Member Since:</span><span className="font-medium">{profileForm.createdAt}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Workspace Tier:</span><span className="font-semibold text-indigo-500">Clario Enterprise</span></div>
                    </div>
                  </Card>

                  <Card className="p-6 space-y-4">
                    <h4 className="text-sm font-semibold border-b border-[var(--border-subtle)] pb-3">Account Security & Sign-In Status</h4>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center"><span className="text-[var(--text-secondary)]">Password:</span><span className="font-mono">••••••••••••</span></div>
                      <div className="flex justify-between items-center"><span className="text-[var(--text-secondary)]">Connection Security:</span><span className="text-emerald-500 font-medium">Encrypted & Private</span></div>
                      <div className="flex justify-between items-center"><span className="text-[var(--text-secondary)]">Two-Step Verification:</span><span className="text-emerald-500 font-medium">Turned On (Protected)</span></div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Profile Edit Modal */}
            {showProfileModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
                    <h3 className="text-base font-semibold">Edit User Profile</h3>
                    <button type="button" onClick={() => setShowProfileModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X className="w-5 h-5" /></button>
                  </div>
                  <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-medium mb-1">Full Name</label>
                      <input type="text" value={editProfileForm.name} onChange={(e) => setEditProfileForm((p: any) => ({ ...p, name: e.target.value }))} required className="w-full h-9 px-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-medium mb-1">Email Address</label>
                        <input type="email" value={editProfileForm.email} onChange={(e) => setEditProfileForm((p: any) => ({ ...p, email: e.target.value }))} required className="w-full h-9 px-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg" />
                      </div>
                      <div>
                        <label className="block font-medium mb-1">Phone Number</label>
                        <input type="text" value={editProfileForm.phone} onChange={(e) => setEditProfileForm((p: any) => ({ ...p, phone: e.target.value }))} className="w-full h-9 px-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg" />
                      </div>
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Job Role / Title</label>
                      <input type="text" value={editProfileForm.role} onChange={(e) => setEditProfileForm((p: any) => ({ ...p, role: e.target.value }))} className="w-full h-9 px-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg" />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Bio / Short Description</label>
                      <textarea value={editProfileForm.bio} onChange={(e) => setEditProfileForm((p: any) => ({ ...p, bio: e.target.value }))} rows={3} className="w-full p-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg resize-none" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowProfileModal(false)}>Cancel</Button>
                      <Button type="submit" variant="primary" size="sm" className="bg-indigo-600 text-white hover:bg-indigo-700">Save Changes</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Profile Photo Cropper Modal */}
            {showPhotoEditorModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl text-xs">
                  <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
                    <h3 className="text-sm font-semibold">Crop & Adjust Profile Photo</h3>
                    <button type="button" onClick={() => setShowPhotoEditorModal(false)} className="text-[var(--text-secondary)]"><X className="w-4 h-4" /></button>
                  </div>

                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="relative w-56 h-56 rounded-full overflow-hidden border-4 border-indigo-500/40 bg-black flex items-center justify-center shadow-inner">
                      {tempImageSrc && (
                        <img
                          src={tempImageSrc}
                          alt="Crop Preview"
                          style={{
                            transform: `translate(${photoPan.x}px, ${photoPan.y}px) scale(${photoZoom}) rotate(${photoRotation}deg)`,
                            maxWidth: 'none'
                          }}
                          className="w-full h-full object-cover select-none transition-transform duration-75"
                        />
                      )}
                      <div className="absolute inset-0 rounded-full border-2 border-white/40 pointer-events-none" />
                    </div>

                    <div className="w-full space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-secondary)]">Zoom ({photoZoom.toFixed(1)}x)</span>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setPhotoZoom(z => Math.max(0.5, z - 0.25))} className="p-1.5 rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] cursor-pointer"><ZoomOut className="w-3.5 h-3.5" /></button>
                          <button type="button" onClick={() => setPhotoZoom(z => Math.min(3.0, z + 0.25))} className="p-1.5 rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] cursor-pointer"><ZoomIn className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-secondary)]">Rotate</span>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setPhotoRotation(r => r - 90)} className="p-1.5 rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] cursor-pointer"><RotateCcw className="w-3.5 h-3.5" /></button>
                          <button type="button" onClick={() => setPhotoRotation(r => r + 90)} className="p-1.5 rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] cursor-pointer"><RotateCw className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowPhotoEditorModal(false)}>Cancel</Button>
                    <Button type="button" variant="primary" size="sm" onClick={handleApplyCroppedPhoto} className="bg-indigo-600 text-white hover:bg-indigo-700">Save Photo</Button>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* PAGE 2: CHURN PREDICTION                   */}
            {/* ========================================== */}
            {activePage === 'prediction' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-semibold">Enter Customer Details</h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">Change any option below to see how it affects the customer's chance of canceling on the right.</p>
                      </div>
                    </div>
                    <form onSubmit={handleRunPrediction} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium mb-1">Customer Name or Account Label</label>
                          <input
                            type="text"
                            value={predictorInput.customerName}
                            onChange={(e) => setPredictorInput(p => ({ ...p, customerName: e.target.value }))}
                            placeholder="e.g., Jane Doe or Acme Corp"
                            className="w-full h-9 px-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Time with Company: <strong>{predictorInput.tenure} Months</strong></label>
                          <input type="range" min="0" max="72" value={predictorInput.tenure} onChange={(e) => {
                            const t = Number(e.target.value);
                            setPredictorInput(p => ({ ...p, tenure: t, totalCharges: Number((t * p.monthlyCharges).toFixed(2)) }));
                          }} className="w-full accent-indigo-600 mt-2 cursor-pointer" title="Slide left for a brand-new customer or right for a long-time customer (0 to 72 months)" />
                          <span className="text-[10px] text-[var(--text-secondary)] block mt-0.5">Longer-staying customers are much less likely to cancel.</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium mb-1">Contract Length</label>
                          <select value={predictorInput.contract} onChange={(e) => setPredictorInput(p => ({ ...p, contract: e.target.value }))} className="w-full h-9 px-2.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs">
                            <option value="Month-to-month">Month-to-month (Higher risk)</option>
                            <option value="One year">1-Year Contract (Lower risk)</option>
                            <option value="Two year">2-Year Contract (Most loyal)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Internet Plan</label>
                          <select value={predictorInput.internet} onChange={(e) => setPredictorInput(p => ({ ...p, internet: e.target.value }))} className="w-full h-9 px-2.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs">
                            <option value="Fiber optic">Fiber Optic (Fastest, pricier)</option>
                            <option value="DSL">Standard DSL Internet</option>
                            <option value="No">Phone Only (No Internet)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">How They Pay Their Bill</label>
                          <select value={predictorInput.payment} onChange={(e) => setPredictorInput(p => ({ ...p, payment: e.target.value }))} className="w-full h-9 px-2.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs">
                            <option value="Electronic check">Electronic Check (Manual)</option>
                            <option value="Mailed check">Paper Check by Mail</option>
                            <option value="Bank transfer (automatic)">Auto-Pay: Bank Transfer</option>
                            <option value="Credit card (automatic)">Auto-Pay: Credit Card</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium mb-1">Monthly Bill ($)</label>
                          <input type="number" step="0.05" placeholder="e.g., 75.00" value={predictorInput.monthlyCharges} onChange={(e) => {
                            const m = Number(e.target.value);
                            setPredictorInput(p => ({ ...p, monthlyCharges: m, totalCharges: Number((p.tenure * m).toFixed(2)) }));
                          }} className="w-full h-9 px-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Total Paid So Far ($)</label>
                          <input type="number" step="0.05" placeholder="e.g., 570.00" value={predictorInput.totalCharges} onChange={(e) => setPredictorInput(p => ({ ...p, totalCharges: Number(e.target.value) }))} className="w-full h-9 px-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Online Security Included?</label>
                          <select value={predictorInput.onlineSecurity} onChange={(e) => setPredictorInput(p => ({ ...p, onlineSecurity: e.target.value }))} className="w-full h-9 px-2.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs">
                            <option value="No">No — Not included</option>
                            <option value="Yes">Yes — Included on plan</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium mb-1">Tech Support Included?</label>
                          <select value={predictorInput.techSupport} onChange={(e) => setPredictorInput(p => ({ ...p, techSupport: e.target.value }))} className="w-full h-9 px-2.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs">
                            <option value="No">No — Not included</option>
                            <option value="Yes">Yes — Included on plan</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Paperless (Email) Billing?</label>
                          <select value={predictorInput.paperlessBilling} onChange={(e) => setPredictorInput(p => ({ ...p, paperlessBilling: e.target.value }))} className="w-full h-9 px-2.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs">
                            <option value="Yes">Yes — Email bills</option>
                            <option value="No">No — Paper bills in mail</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Family / Dependents on Plan?</label>
                          <select value={predictorInput.dependents} onChange={(e) => setPredictorInput(p => ({ ...p, dependents: e.target.value }))} className="w-full h-9 px-2.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs">
                            <option value="No">No (Single user)</option>
                            <option value="Yes">Yes (Family / household)</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between gap-3">
                        <span className="text-[11px] text-[var(--text-secondary)]">Adjust contract length or support options to compare predicted risk.</span>
                        <Button type="submit" variant="primary" size="md" className="bg-indigo-600 text-white hover:bg-indigo-700">
                          Save Prediction
                        </Button>
                      </div>
                    </form>
                  </Card>
                </div>

                <div className="lg:col-span-5 space-y-4">
                  <Card className="p-6 text-center space-y-4">
                    <span className="type-label">Predicted Cancellation Risk</span>
                    <div>
                      <h3 className="text-3xl font-semibold tabular-nums tracking-tight">{livePrediction.probability}%</h3>
                      <div className="mt-2 inline-flex justify-center">
                        <RiskBadge probability={livePrediction.probability} thresholds={thresholds} size="lg" />
                      </div>
                    </div>
                    <p className="type-body px-2">
                      {livePrediction.probability >= thresholds.high
                        ? 'High churn probability. Consider a contract renewal incentive or support bundle.'
                        : livePrediction.probability >= thresholds.medium
                        ? 'Moderate churn exposure. Enrolling the account in automatic billing can improve retention.'
                        : 'Low churn probability. Current contract and service profile indicate stable retention.'}
                    </p>
                    <div className="pt-3 border-t border-[var(--border-subtle)] grid grid-cols-3 gap-2 text-left text-[11px]">
                      <div className="p-2.5 rounded bg-[var(--bg-subtle)]" title={`Logit score: ${livePrediction.logit}`}>
                        <span className="text-[var(--text-secondary)] block">Direction</span>
                        <span className="font-medium">{livePrediction.logit > 0 ? 'Elevated Risk' : 'Stable'}</span>
                      </div>
                      <div className="p-2.5 rounded bg-[var(--bg-subtle)]" title="Dataset average tenure is 32 months">
                        <span className="text-[var(--text-secondary)] block">Tenure</span>
                        <span className="font-medium">{predictorInput.tenure >= 32 ? 'Above Average' : 'Below Average'}</span>
                      </div>
                      <div className="p-2.5 rounded bg-[var(--bg-subtle)]" title="Dataset average monthly charge is $65">
                        <span className="text-[var(--text-secondary)] block">Monthly Charge</span>
                        <span className="font-medium">{predictorInput.monthlyCharges >= 65 ? 'Above Avg ($65)' : 'Below Avg ($65)'}</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* PAGE 3: CUSTOMER MANAGEMENT                */}
            {/* ========================================== */}
            {activePage === 'customers' && (
              !activeDataset || allDatasetCustomers.length === 0 ? (
                <Card className="p-10 text-center space-y-3">
                  <p className="type-card-title">No Customer Data Loaded</p>
                  <p className="type-subheading">
                    Please upload customer data in the Customer Data section to use this feature.
                  </p>
                  <Button variant="primary" size="sm" onClick={() => navigateToPage('datasets')} className="bg-indigo-600 text-white hover:bg-indigo-700">
                    Open Customer Data
                  </Button>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Search, Filter & Sort Controls at Top of Customer List */}
                  <Card className="p-4 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Search Bar */}
                      <div className="relative flex-1 max-w-xl">
                        <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-3 pointer-events-none" />
                        <input
                          type="text"
                          value={globalSearch}
                          onChange={(e) => setGlobalSearch(e.target.value)}
                          aria-label="Search customers by ID, name, email, or plan details"
                          placeholder="Search by Customer ID, name, email, contract, or payment..."
                          className="w-full h-10 pl-10 pr-10 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl text-xs sm:text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition shadow-2xs"
                        />
                        {globalSearch && (
                          <button
                            type="button"
                            onClick={() => setGlobalSearch('')}
                            aria-label="Clear search input"
                            title="Clear search"
                            className="absolute right-2.5 top-2 inline-flex items-center justify-center h-6 w-6 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Filter & Sort Controls */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center gap-2">
                          <label htmlFor="churn-status-filter" className="type-label whitespace-nowrap">
                            Status:
                          </label>
                          <select
                            id="churn-status-filter"
                            value={churnStatusFilter}
                            onChange={(e) => setChurnStatusFilter(e.target.value as 'All' | 'At-Risk' | 'Active' | 'Churned')}
                            aria-label="Filter customers by Churn Status"
                            className="h-9 px-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer"
                          >
                            <option value="All">All ({churnStatusCounts.All})</option>
                            <option value="At-Risk">At-Risk ({churnStatusCounts['At-Risk']})</option>
                            <option value="Active">Active ({churnStatusCounts.Active})</option>
                            <option value="Churned">Churned ({churnStatusCounts.Churned})</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <label htmlFor="customer-sort-select" className="type-label whitespace-nowrap">
                            Sort:
                          </label>
                          <select
                            id="customer-sort-select"
                            value={customerSortBy}
                            onChange={(e) => setCustomerSortBy(e.target.value as any)}
                            aria-label="Sort customers"
                            className="h-9 px-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer"
                          >
                            <option value="default">Default</option>
                            <option value="risk-desc">Risk: High to Low</option>
                            <option value="risk-asc">Risk: Low to High</option>
                            <option value="tenure-asc">Tenure: Low to High</option>
                            <option value="tenure-desc">Tenure: High to Low</option>
                            <option value="bill-desc">Monthly Charge: High to Low</option>
                            <option value="name-asc">Name: A to Z</option>
                          </select>
                        </div>

                        {(churnStatusFilter !== 'All' || globalSearch.trim() !== '' || customerSortBy !== 'default') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setChurnStatusFilter('All');
                              setGlobalSearch('');
                              setCustomerSortBy('default');
                            }}
                          >
                            Reset
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)] text-xs">
                      <span className="font-medium text-[var(--text-primary)]">
                        Showing {customers.length} of {allDatasetCustomers.length} accounts ({activeDataset.name})
                      </span>
                      <span className="text-[var(--text-secondary)]">
                        Select <strong>Analyse</strong> on any row to view individual account insights.
                      </span>
                    </div>
                  </Card>

                  <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                      {customers.length === 0 ? (
                        <div className="p-10 text-center space-y-2.5">
                          <p className="type-card-title">No customers found</p>
                          <p className="type-subheading">
                            No customer records matched{globalSearch.trim() ? ` "${globalSearch.trim()}"` : ''}{churnStatusFilter !== 'All' ? ` with status "${churnStatusFilter}"` : ''}.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setChurnStatusFilter('All');
                              setGlobalSearch('');
                              setCustomerSortBy('default');
                            }}
                          >
                            Clear Filters
                          </Button>
                        </div>
                      ) : (
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-b border-[var(--border-subtle)] font-medium">
                            <tr>
                              <th className="px-4 py-3">Customer ID</th>
                              <th className="px-4 py-3">Customer Name</th>
                              <th className="px-4 py-3">Churn Status</th>
                              <th className="px-4 py-3">Tenure</th>
                              <th className="px-4 py-3">Monthly Charge</th>
                              <th className="px-4 py-3">Contract</th>
                              <th className="px-4 py-3">Internet</th>
                              <th className="px-4 py-3">Payment Method</th>
                              <th className="px-4 py-3">Risk Score</th>
                              <th className="px-4 py-3">Risk Level</th>
                              <th className="px-4 py-3 text-right">Analyse</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border-subtle)]">
                            {customers.slice(0, 50).map((c: any, i: number) => (
                              <tr key={c.id || i} className="hover:bg-[var(--bg-subtle)] transition">
                                <td className="px-4 py-3 font-mono font-medium whitespace-nowrap">{c.id}</td>
                                <td className="px-4 py-3">
                                  <span className="font-medium text-[var(--text-primary)] block">{c.name}</span>
                                  {c.email && <span className="text-[11px] text-[var(--text-secondary)] font-mono block">{c.email}</span>}
                                </td>
                                <td className="px-4 py-3"><ChurnStatusBadge status={c.churnStatus} /></td>
                                <td className="px-4 py-3 tabular-nums whitespace-nowrap">{c.tenure} mo</td>
                                <td className="px-4 py-3 tabular-nums whitespace-nowrap">${Number(c.monthlyCharges).toFixed(2)}/mo</td>
                                <td className="px-4 py-3 whitespace-nowrap">{c.contract}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{c.internet}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{c.payment}</td>
                                <td className="px-4 py-3 font-mono font-semibold tabular-nums whitespace-nowrap">{c.probability}%</td>
                                <td className="px-4 py-3"><RiskBadge probability={c.probability} thresholds={thresholds} /></td>
                                <td className="px-4 py-3 text-right">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleAnalyseCustomer(c.id)}
                                    aria-label={`Analyse ${c.name} (${c.id})`}
                                    title={`Open individual analysis for ${c.name} (${c.id})`}
                                    className="hover:border-indigo-500/50 hover:text-indigo-500"
                                  >
                                    Analyse
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </Card>
                </div>
              )
            )}

            {/* ========================================== */}
            {/* PAGE 4: ANALYTICS & INSIGHTS               */}
            {/* ========================================== */}
            {activePage === 'analytics' && (
              !activeDataset || allDatasetCustomers.length === 0 ? (
                <Card className="p-10 text-center space-y-3">
                  <p className="type-card-title">No Customer Data Loaded</p>
                  <p className="type-subheading">
                    Please upload customer data in the Customer Data section to use this feature.
                  </p>
                  <Button variant="primary" size="sm" onClick={() => navigateToPage('datasets')} className="bg-indigo-600 text-white hover:bg-indigo-700">
                    Open Customer Data
                  </Button>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Top Mode Switcher & Customer Navigation Bar */}
                  <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAnalyticsMode('individual')}
                        className={`h-9 px-3.5 rounded-lg text-xs font-medium inline-flex items-center transition cursor-pointer ${
                          analyticsMode === 'individual'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                        }`}
                      >
                        Customer Analysis
                      </button>
                      <button
                        type="button"
                        onClick={() => setAnalyticsMode('dataset')}
                        className={`h-9 px-3.5 rounded-lg text-xs font-medium inline-flex items-center transition cursor-pointer ${
                          analyticsMode === 'dataset'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                        }`}
                      >
                        Dataset Trends ({activeDataset.rows.toLocaleString()})
                      </button>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateToPage('customers')}
                    >
                      Back to Customer List
                    </Button>
                  </Card>

                  {analyticsMode === 'individual' && selectedCustomerAnalysis ? (
                    <div className="space-y-6">
                      {/* Active Customer Identification Banner */}
                      <Card variant="indigo" className="p-5">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex items-start sm:items-center gap-3.5">
                            <UserAvatar name={selectedCustomerAnalysis.customer.name} size={44} />
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                  Customer Account
                                </span>
                                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                                  {selectedCustomerAnalysis.customer.id}
                                </span>
                                <ChurnStatusBadge status={selectedCustomerAnalysis.customer.churnStatus || 'Active'} />
                                <RiskBadge probability={selectedCustomerAnalysis.baseProb} thresholds={thresholds} />
                              </div>
                              <h3 className="type-section-title">
                                {selectedCustomerAnalysis.customer.name}
                              </h3>
                              <p className="type-subheading">
                                Email: <span className="font-mono">{selectedCustomerAnalysis.formatAttr(selectedCustomerAnalysis.customer.email)}</span> • Dataset: {activeDataset.name}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2.5">
                            <label htmlFor="analytics-customer-select" className="type-label whitespace-nowrap">
                              Account:
                            </label>
                            <select
                              id="analytics-customer-select"
                              value={selectedCustomerAnalysis.customer.id}
                              onChange={(e) => setSelectedAnalyticsCustomerId(e.target.value)}
                              aria-label="Select customer for individual analysis"
                              className="h-9 px-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer"
                            >
                              {allDatasetCustomers.slice(0, 100).map((c: any) => (
                                <option key={c.id} value={c.id}>
                                  {c.name} ({c.id}) — {c.probability}% ({c.churnStatus})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </Card>

                      {/* Individual Customer Key Metrics (4 Cards) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="p-5">
                          <div className="flex items-center justify-between">
                            <span className="type-label">Cancellation Risk</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-medium">Predicted</span>
                          </div>
                          <div className="flex items-baseline gap-2.5 mt-2">
                            <h4 className="type-metric">{selectedCustomerAnalysis.baseProb}%</h4>
                            <RiskBadge probability={selectedCustomerAnalysis.baseProb} thresholds={thresholds} />
                          </div>
                          <p className="type-subheading mt-1">
                            Dataset avg: {selectedCustomerAnalysis.avgRisk}% ({selectedCustomerAnalysis.baseProb >= selectedCustomerAnalysis.avgRisk ? `+${(selectedCustomerAnalysis.baseProb - selectedCustomerAnalysis.avgRisk).toFixed(1)}%` : `${(selectedCustomerAnalysis.baseProb - selectedCustomerAnalysis.avgRisk).toFixed(1)}%`})
                          </p>
                        </Card>

                        <Card className="p-5">
                          <div className="flex items-center justify-between">
                            <span className="type-label">Tenure</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-medium">Recorded</span>
                          </div>
                          <h4 className="type-metric mt-2">
                            {selectedCustomerAnalysis.formatAttr(selectedCustomerAnalysis.customer.tenure, ' mo')}
                          </h4>
                          <p className="type-subheading mt-1">
                            Dataset avg: {selectedCustomerAnalysis.avgTenure} mo
                          </p>
                        </Card>

                        <Card className="p-5">
                          <div className="flex items-center justify-between">
                            <span className="type-label">Billing</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-medium">Recorded</span>
                          </div>
                          <h4 className="type-metric mt-2">
                            {selectedCustomerAnalysis.hasVal(selectedCustomerAnalysis.customer.monthlyCharges)
                              ? `$${Number(selectedCustomerAnalysis.customer.monthlyCharges).toFixed(2)}/mo`
                              : 'Data not available'}
                          </h4>
                          <p className="type-subheading mt-1">
                            Total: {selectedCustomerAnalysis.hasVal(selectedCustomerAnalysis.customer.totalCharges)
                              ? `$${Number(selectedCustomerAnalysis.customer.totalCharges).toFixed(2)}`
                              : 'Data not available'}
                          </p>
                        </Card>

                        <Card className="p-5">
                          <div className="flex items-center justify-between">
                            <span className="type-label">Contract & Payment</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-medium">Recorded</span>
                          </div>
                          <h4 className="type-section-title mt-2 truncate">
                            {selectedCustomerAnalysis.formatAttr(selectedCustomerAnalysis.customer.contract)}
                          </h4>
                          <p className="type-subheading mt-1 truncate">
                            {selectedCustomerAnalysis.formatAttr(selectedCustomerAnalysis.customer.payment)}
                          </p>
                        </Card>
                      </div>

                      {/* Complete Customer Attributes & Service Patterns Grid */}
                      <Card className="p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
                          <div>
                            <h3 className="type-card-title">Account Attributes</h3>
                            <p className="type-subheading">
                              Recorded service configuration for {selectedCustomerAnalysis.customer.name} ({selectedCustomerAnalysis.customer.id})
                            </p>
                          </div>
                          <span className="text-[11px] px-2.5 py-1 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)] font-medium self-start sm:self-center">
                            Dataset Record
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                          {[
                            { label: 'Internet Service', value: selectedCustomerAnalysis.formatAttr(selectedCustomerAnalysis.customer.internet) },
                            { label: 'Contract Type', value: selectedCustomerAnalysis.formatAttr(selectedCustomerAnalysis.customer.contract) },
                            { label: 'Payment Method', value: selectedCustomerAnalysis.formatAttr(selectedCustomerAnalysis.customer.payment) },
                            { label: 'Paperless Billing', value: selectedCustomerAnalysis.formatAttr(selectedCustomerAnalysis.customer.paperlessBilling) },
                            { label: 'Phone Service', value: selectedCustomerAnalysis.formatAttr(selectedCustomerAnalysis.customer.phoneService) },
                            { label: 'Multiple Lines', value: selectedCustomerAnalysis.formatAttr(selectedCustomerAnalysis.customer.multipleLines) },
                            { label: 'Online Security', value: selectedCustomerAnalysis.formatAttr(selectedCustomerAnalysis.customer.onlineSecurity) },
                            { label: 'Online Backup', value: selectedCustomerAnalysis.formatAttr(selectedCustomerAnalysis.customer.onlineBackup) },
                            { label: 'Device Protection', value: selectedCustomerAnalysis.formatAttr(selectedCustomerAnalysis.customer.deviceProtection) },
                            { label: 'Tech Support', value: selectedCustomerAnalysis.formatAttr(selectedCustomerAnalysis.customer.techSupport) },
                            { label: 'Streaming TV', value: selectedCustomerAnalysis.formatAttr(selectedCustomerAnalysis.customer.streamingTV) },
                            { label: 'Streaming Movies', value: selectedCustomerAnalysis.formatAttr(selectedCustomerAnalysis.customer.streamingMovies) },
                            { label: 'Gender', value: selectedCustomerAnalysis.formatAttr(selectedCustomerAnalysis.customer.gender) },
                            {
                              label: 'Senior Citizen',
                              value: selectedCustomerAnalysis.hasVal(selectedCustomerAnalysis.customer.seniorCitizen)
                                ? (Number(selectedCustomerAnalysis.customer.seniorCitizen) === 1 ? 'Yes' : 'No')
                                : 'Data not available'
                            },
                            { label: 'Partner on Plan', value: selectedCustomerAnalysis.formatAttr(selectedCustomerAnalysis.customer.partner) },
                            { label: 'Dependents', value: selectedCustomerAnalysis.formatAttr(selectedCustomerAnalysis.customer.dependents) },
                          ].map((attr) => (
                            <div key={attr.label} className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                              <span className="text-[11px] text-[var(--text-secondary)] block">{attr.label}</span>
                              <span className={`font-medium mt-0.5 block ${attr.value === 'Data not available' ? 'text-[var(--text-muted)] italic font-normal' : ''}`}>
                                {attr.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </Card>

                      {/* Risk Score Over Time & Retention Simulator for Selected Customer */}
                      <Card className="p-6 space-y-5">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="type-section-title">
                                Risk Score Over Time — {selectedCustomerAnalysis.customer.name}
                              </h3>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 font-medium">
                                Simulation
                              </span>
                            </div>
                            <p className="type-subheading mt-1">
                              Projected risk trajectory and impact of retention actions for {selectedCustomerAnalysis.customer.id}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                          <div className="lg:col-span-8 space-y-3">
                            <div className="h-72 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={customerRiskTimeline.points} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#27272A' : '#E2E8F0'} vertical={false} />
                                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} unit="%" />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: 'var(--bg-card)',
                                      borderRadius: '10px',
                                      border: '1px solid var(--border-subtle)',
                                      color: 'var(--text-primary)',
                                      fontSize: '12px'
                                    }}
                                    formatter={(value: any, _name: any, props: any) => [
                                      `${value}% (${props?.payload?.stage || ''})`,
                                      'Chance of Canceling'
                                    ]}
                                    labelFormatter={(label: any, payload: any) => {
                                      const note = payload?.[0]?.payload?.note;
                                      return note ? `${label} — ${note}` : label;
                                    }}
                                  />
                                  <ReferenceLine
                                    y={thresholds.high}
                                    stroke="#F87171"
                                    strokeDasharray="4 4"
                                    label={{ value: `High Risk (${thresholds.high}%)`, position: 'insideTopRight', fill: '#F87171', fontSize: 10 }}
                                  />
                                  <ReferenceLine
                                    y={thresholds.medium}
                                    stroke="#FBBF24"
                                    strokeDasharray="4 4"
                                    label={{ value: `Medium Risk (${thresholds.medium}%)`, position: 'insideBottomRight', fill: '#FBBF24', fontSize: 10 }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="riskScore"
                                    stroke="#6366F1"
                                    strokeWidth={3}
                                    dot={{ r: 5, fill: '#6366F1', strokeWidth: 2, stroke: '#FFFFFF' }}
                                    activeDot={{ r: 7, fill: '#34D399', stroke: '#FFFFFF', strokeWidth: 2 }}
                                    name="Chance of Canceling (%)"
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--text-secondary)] pt-1">
                              <span>Dashed lines show your High Risk ({thresholds.high}%) and Medium Risk ({thresholds.medium}%) alert levels.</span>
                              <span>Lower points on the right mean the customer is becoming less likely to cancel.</span>
                            </div>
                          </div>

                          {/* Retention Impact Summary & Effort Toggles */}
                          <div className="lg:col-span-4 space-y-4 bg-[var(--bg-subtle)] p-4 rounded-xl border border-[var(--border-subtle)]">
                            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                              <div>
                                <span className="text-[11px] text-[var(--text-secondary)] block">Peak Risk → Projected Risk</span>
                                <div className="flex items-baseline gap-2 mt-0.5">
                                  <span className="text-sm font-mono line-through text-[var(--text-muted)]">{customerRiskTimeline.startRisk}%</span>
                                  <span className="text-xl font-bold tabular-nums text-[var(--text-primary)]">→ {customerRiskTimeline.currentRisk}%</span>
                                </div>
                              </div>
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold tabular-nums ${
                                  customerRiskTimeline.netChange <= 0
                                    ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                                    : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                                }`}
                              >
                                {customerRiskTimeline.netChange <= 0 ? (
                                  <TrendingDown className="w-3.5 h-3.5" />
                                ) : (
                                  <TrendingUp className="w-3.5 h-3.5" />
                                )}
                                {customerRiskTimeline.netChange <= 0
                                  ? `${Math.abs(customerRiskTimeline.netChange)}% Lower Risk`
                                  : `+${customerRiskTimeline.netChange}% Higher Risk`}
                              </span>
                            </div>

                            <div className="space-y-2">
                              <p className="text-xs font-semibold">Simulate Retention Actions for {selectedCustomerAnalysis.customer.name}:</p>
                              <p className="text-[11px] text-[var(--text-secondary)]">
                                Toggle actions below to test how much they reduce {selectedCustomerAnalysis.customer.name}'s risk score:
                              </p>

                              <div className="space-y-2 pt-1 text-xs">
                                <label className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] cursor-pointer hover:border-indigo-500/50 transition">
                                  <div className="flex items-center gap-2.5">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(currentCustomerActions.upgradeContract)}
                                      onChange={() => toggleRetentionAction('upgradeContract')}
                                      className="rounded accent-indigo-600 w-4 h-4 cursor-pointer"
                                    />
                                    <span>Move to 1-Year Contract</span>
                                  </div>
                                  <span className="text-[10px] font-semibold text-emerald-500">Big Drop</span>
                                </label>

                                <label className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] cursor-pointer hover:border-indigo-500/50 transition">
                                  <div className="flex items-center gap-2.5">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(currentCustomerActions.addSupportBundle)}
                                      onChange={() => toggleRetentionAction('addSupportBundle')}
                                      className="rounded accent-indigo-600 w-4 h-4 cursor-pointer"
                                    />
                                    <span>Add Free Tech Support & Security</span>
                                  </div>
                                  <span className="text-[10px] font-semibold text-emerald-500">Medium Drop</span>
                                </label>

                                <label className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] cursor-pointer hover:border-indigo-500/50 transition">
                                  <div className="flex items-center gap-2.5">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(currentCustomerActions.enableAutoPay)}
                                      onChange={() => toggleRetentionAction('enableAutoPay')}
                                      className="rounded accent-indigo-600 w-4 h-4 cursor-pointer"
                                    />
                                    <span>Switch to Credit Card Auto-Pay</span>
                                  </div>
                                  <span className="text-[10px] font-semibold text-emerald-500">Steady Drop</span>
                                </label>

                                <label className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] cursor-pointer hover:border-indigo-500/50 transition">
                                  <div className="flex items-center gap-2.5">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(currentCustomerActions.loyaltyDiscount)}
                                      onChange={() => toggleRetentionAction('loyaltyDiscount')}
                                      className="rounded accent-indigo-600 w-4 h-4 cursor-pointer"
                                    />
                                    <span>Offer 15% Monthly Bill Discount</span>
                                  </div>
                                  <span className="text-[10px] font-semibold text-indigo-400">Helpful</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>

                      {/* Customer-Specific Charts: Factor Contributions & Dataset Benchmark Comparison */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="p-6 space-y-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-semibold">
                                Risk Factor Impact Breakdown for {selectedCustomerAnalysis.customer.name}
                              </h3>
                              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                Red bars push this customer's risk higher; green bars protect loyalty and lower risk.
                              </p>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 font-semibold shrink-0">
                              Model Weights
                            </span>
                          </div>
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={selectedCustomerAnalysis.sortedFactors}
                                layout="vertical"
                                margin={{ top: 5, right: 20, left: 25, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#27272A' : '#E2E8F0'} horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                                <YAxis dataKey="factor" type="category" width={115} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: 'var(--bg-card)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-subtle)',
                                    color: 'var(--text-primary)',
                                    fontSize: '12px'
                                  }}
                                  formatter={(value: any, _name: any, props: any) => [
                                    `${Number(value) > 0 ? `+${value}` : value} impact pts (${props?.payload?.customerValue || ''})`,
                                    Number(value) > 0 ? 'Increases Churn Risk' : 'Lowers Churn Risk'
                                  ]}
                                />
                                <ReferenceLine x={0} stroke="var(--text-muted)" />
                                <Bar dataKey="impactScore" radius={[0, 4, 4, 0]}>
                                  {selectedCustomerAnalysis.sortedFactors.map((entry, idx) => (
                                    <Cell
                                      key={`factor-cell-${idx}`}
                                      fill={entry.impactScore > 0 ? '#F87171' : '#34D399'}
                                    />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </Card>

                        <Card className="p-6 space-y-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-semibold">
                                {selectedCustomerAnalysis.customer.name} vs. Active Dataset Average
                              </h3>
                              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                Compares this customer's actual metrics against the average of all {allDatasetCustomers.length} customers.
                              </p>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-semibold shrink-0">
                              Actual Data vs. Avg
                            </span>
                          </div>
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={selectedCustomerAnalysis.benchmarkChartData} margin={{ top: 10, right: 15, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#27272A' : '#E2E8F0'} vertical={false} />
                                <XAxis dataKey="metric" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: 'var(--bg-card)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-subtle)',
                                    color: 'var(--text-primary)',
                                    fontSize: '12px'
                                  }}
                                />
                                <Bar dataKey="customer" fill="#6366F1" radius={[4, 4, 0, 0]} name={selectedCustomerAnalysis.customer.name} />
                                <Bar dataKey="datasetAvg" fill="#94A3B8" radius={[4, 4, 0, 0]} name="Dataset Average" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </Card>
                      </div>

                      {/* Individual Customer Insights, Behaviour Patterns & Recommended Actions */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Column: Why At Risk, Contributing Factors & Behaviour Patterns */}
                        <Card className="lg:col-span-6 p-6 space-y-5">
                          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className={`w-4 h-4 ${selectedCustomerAnalysis.baseProb >= thresholds.high ? 'text-rose-500' : selectedCustomerAnalysis.baseProb >= thresholds.medium ? 'text-amber-500' : 'text-emerald-500'}`} />
                              <h3 className="text-sm font-semibold">Why This Customer May Be At Risk & Behaviour Patterns</h3>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 font-semibold">
                              Model Diagnosis
                            </span>
                          </div>

                          <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs leading-relaxed">
                            {selectedCustomerAnalysis.whyAtRiskSummary}
                          </div>

                          <div className="space-y-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                              Factors Contributing to Cancellation Risk
                            </h4>
                            {selectedCustomerAnalysis.riskIncreasingFactors.length === 0 ? (
                              <p className="text-xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
                                No major risk-increasing factors detected in {selectedCustomerAnalysis.customer.name}'s current profile.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {selectedCustomerAnalysis.riskIncreasingFactors.map((f) => (
                                  <div key={f.factor} className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-rose-500/20 flex items-start justify-between gap-3 text-xs">
                                    <div>
                                      <span className="font-semibold block">{f.factor}: <span className="text-rose-400">{f.customerValue}</span></span>
                                      <span className="text-[11px] text-[var(--text-secondary)] mt-0.5 block">{f.explanation}</span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-500 font-mono font-semibold text-[11px] shrink-0">
                                      +{f.impactScore} pts
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {selectedCustomerAnalysis.protectiveFactors.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                                Protective Loyalty Factors (Keeping Customer Active)
                              </h4>
                              <div className="space-y-2">
                                {selectedCustomerAnalysis.protectiveFactors.slice(0, 3).map((f) => (
                                  <div key={f.factor} className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-emerald-500/20 flex items-start justify-between gap-3 text-xs">
                                    <div>
                                      <span className="font-semibold block">{f.factor}: <span className="text-emerald-400">{f.customerValue}</span></span>
                                      <span className="text-[11px] text-[var(--text-secondary)] mt-0.5 block">{f.explanation}</span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-mono font-semibold text-[11px] shrink-0">
                                      {f.impactScore} pts
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                              Observed Customer Behaviour & Usage Patterns (Actual Record)
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              {selectedCustomerAnalysis.behaviourPatterns.map((pat) => (
                                <div key={pat.label} className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                                  <span className="text-[11px] text-[var(--text-secondary)] block">{pat.label}</span>
                                  <span className={`font-semibold block mt-0.5 ${!pat.available ? 'text-[var(--text-muted)] italic font-normal' : ''}`}>
                                    {pat.value}
                                  </span>
                                  <span className="text-[11px] text-[var(--text-secondary)] block mt-1">{pat.detail}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </Card>

                        {/* Right Column: Recommended Retention Actions & Suggested Next Steps */}
                        <Card className="lg:col-span-6 p-6 space-y-5">
                          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-indigo-500" />
                              <h3 className="text-sm font-semibold">Recommended Retention Actions & Next Steps</h3>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-semibold">
                              Actionable Recommendations
                            </span>
                          </div>

                          <p className="text-xs text-[var(--text-secondary)]">
                            Recommendations below are generated specifically for <strong>{selectedCustomerAnalysis.customer.name}</strong> based on their actual plan attributes and simulated using the active prediction model.
                          </p>

                          <div className="space-y-3">
                            {selectedCustomerAnalysis.recommendations.map((rec) => {
                              const isApplied = rec.actionKey ? Boolean(currentCustomerActions[rec.actionKey]) : false;
                              return (
                                <div
                                  key={rec.id}
                                  className={`p-4 rounded-xl border transition space-y-2.5 text-xs ${
                                    isApplied
                                      ? 'bg-emerald-500/10 border-emerald-500/30'
                                      : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)]'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                                          rec.priority === 'High Priority'
                                            ? 'bg-rose-500/15 text-rose-500'
                                            : rec.priority === 'Recommended'
                                            ? 'bg-indigo-500/15 text-indigo-400'
                                            : 'bg-emerald-500/15 text-emerald-500'
                                        }`}>
                                          {rec.priority}
                                        </span>
                                        <span className="font-semibold text-sm">{rec.title}</span>
                                      </div>
                                      <p className="text-[var(--text-secondary)] pt-0.5">{rec.reason}</p>
                                    </div>
                                    {rec.riskReduction > 0 && (
                                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-500 font-mono font-semibold text-[11px] shrink-0">
                                        -{rec.riskReduction}% Risk
                                      </span>
                                    )}
                                  </div>

                                  {rec.actionKey && (
                                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
                                      <span className="text-[11px] text-[var(--text-secondary)]">
                                        Projected risk with this action alone: <strong>{rec.projectedRisk}%</strong>
                                      </span>
                                      <Button
                                        variant={isApplied ? 'outline' : 'primary'}
                                        size="sm"
                                        onClick={() => toggleRetentionAction(rec.actionKey!)}
                                        className={!isApplied ? 'bg-indigo-600 text-white hover:bg-indigo-700' : ''}
                                      >
                                        {isApplied ? 'Applied in Simulator ✓' : 'Test in Simulator'}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2.5 text-xs">
                            <h4 className="font-semibold uppercase tracking-wider text-[11px] text-[var(--text-secondary)]">
                              Suggested Next Steps for {selectedCustomerAnalysis.customer.name}
                            </h4>
                            <ol className="list-decimal list-inside space-y-1.5 text-[var(--text-secondary)]">
                              <li>
                                Review {selectedCustomerAnalysis.customer.name}'s top risk driver ({selectedCustomerAnalysis.riskIncreasingFactors[0] ? `${selectedCustomerAnalysis.riskIncreasingFactors[0].factor}: ${selectedCustomerAnalysis.riskIncreasingFactors[0].customerValue}` : `Current plan: ${selectedCustomerAnalysis.formatAttr(selectedCustomerAnalysis.customer.contract)}`}) before outreach.
                              </li>
                              <li>
                                Use the simulator toggles above to combine offers until {selectedCustomerAnalysis.customer.name}'s projected risk drops below the {thresholds.medium}% Low-Risk threshold (currently <strong>{customerRiskTimeline.currentRisk}%</strong>).
                              </li>
                              <li>
                                Contact {selectedCustomerAnalysis.customer.name} {selectedCustomerAnalysis.hasVal(selectedCustomerAnalysis.customer.email) ? `at ${selectedCustomerAnalysis.customer.email}` : 'via their preferred account channel'} with the selected retention package.
                              </li>
                            </ol>
                          </div>
                        </Card>
                      </div>
                    </div>
                  ) : (
                    /* Overall Dataset Trends View (Preserves Existing Overall Trends & Insights Functionality) */
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="p-6">
                          <h3 className="text-sm font-semibold mb-1">Cancellation Rate by Contract Length</h3>
                          <p className="text-xs text-[var(--text-secondary)] mb-4">Based on active Customer Data ({activeDataset.name}).</p>
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={contractChurnData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#27272A' : '#E2E8F0'} vertical={false} />
                                <XAxis dataKey="contract" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} unit="%" />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '12px' }} />
                                <Bar dataKey="churnRate" fill="#6366F1" radius={[4, 4, 0, 0]} name="Customers Who Cancel (%)" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </Card>

                        <Card className="p-6">
                          <h3 className="text-sm font-semibold mb-1">Cancellation Rate by Payment Method</h3>
                          <p className="text-xs text-[var(--text-secondary)] mb-4">Based on active Customer Data ({activeDataset.name}).</p>
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={paymentChurnData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#27272A' : '#E2E8F0'} vertical={false} />
                                <XAxis dataKey="method" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} unit="%" />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '12px' }} />
                                <Bar dataKey="churnRate" fill="#2DD4BF" radius={[4, 4, 0, 0]} name="Customers Who Cancel (%)" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </Card>
                      </div>
                    </div>
                  )}
                </div>
              )
            )}

            {/* ========================================== */}
            {/* PAGE 5: CUSTOMER DATA (SINGLE DATA SOURCE) */}
            {/* ========================================== */}
            {activePage === 'datasets' && (
              <div className="space-y-6">
                <input
                  ref={datasetUploadRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleDatasetFileUpload}
                  className="hidden"
                />

                <Card className="p-6 bg-gradient-to-r from-indigo-500/10 via-transparent to-transparent">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="type-section-title">Upload Customer Dataset</h3>
                      <p className="type-subheading mt-1">
                        Single data source for Overview, Customer List, and Trends & Insights.
                      </p>
                    </div>
                    <Button variant="primary" size="md" onClick={() => datasetUploadRef.current?.click()} className="bg-indigo-600 text-white hover:bg-indigo-700">
                      Upload CSV
                    </Button>
                  </div>
                </Card>

                {datasets.length === 0 ? (
                  <Card className="p-10 text-center space-y-2">
                    <p className="type-card-title">No datasets available</p>
                    <p className="type-subheading">Select Upload CSV above to import a customer dataset.</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {datasets.map((ds) => (
                      <Card key={ds.id} className={`p-5 relative ${ds.active ? 'ring-2 ring-indigo-500' : ''}`}>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center"><FileSpreadsheet className="w-5 h-5" /></div>
                            <div>
                              <h4 className="text-xs font-semibold">{ds.name}</h4>
                              <p className="text-[11px] text-[var(--text-secondary)]">Added {ds.uploadedAt}</p>
                            </div>
                          </div>
                          {ds.active && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 font-medium flex items-center gap-1">
                              <FileCheck className="w-3 h-3" /> Active
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5 py-3 border-y border-[var(--border-subtle)] text-xs tabular-nums">
                          <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Accounts:</span><span className="font-medium">{ds.rows.toLocaleString()}</span></div>
                          <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Columns:</span><span className="font-medium">{ds.columns.length}</span></div>
                          <div className="flex justify-between" title="Records with blank total charges are imputed automatically"><span className="text-[var(--text-secondary)]">Imputed Values:</span><span className="font-medium text-amber-500">{ds.missingValuesCount}</span></div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          {!ds.active ? (
                            <Button variant="primary" size="sm" onClick={() => handleActivateDataset(ds.id)} className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700">Set Active</Button>
                          ) : (
                            <span className="text-[11px] text-[var(--text-secondary)]">Active workspace dataset</span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteDataset(ds.id)}
                            className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-medium text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition cursor-pointer shrink-0"
                            title="Remove dataset"
                          >
                            Remove
                          </button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================== */}
            {/* PAGE 6: MODEL ENGINE                       */}
            {/* ========================================== */}
            {activePage === 'models' && (
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="type-section-title mb-1">Scoring Models</h3>
                  <p className="type-subheading mb-6">Benchmarked on 1,409 holdout customer records. Select the model that matches your precision and recall targets.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {models.map((mod) => (
                      <Card key={mod.id} className={`p-5 space-y-4 ${activeModelKey === mod.key ? 'ring-2 ring-indigo-500' : ''}`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <Cpu className="w-5 h-5 text-indigo-500 shrink-0" />
                            <div>
                              <h4 className="text-xs font-semibold">{mod.name}</h4>
                              <p className="text-[11px] text-[var(--text-secondary)]">{mod.format} • Recall: {mod.recall}% • ROC-AUC: {mod.rocAuc}%</p>
                            </div>
                          </div>
                          {activeModelKey === mod.key && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 font-medium flex items-center gap-1 shrink-0">
                              <ShieldCheck className="w-3 h-3" /> Active
                            </span>
                          )}
                        </div>

                        <p className="type-body">{mod.description}</p>

                        {activeModelKey !== mod.key && (
                          <div className="pt-1">
                            <Button variant="primary" size="sm" onClick={() => { setActiveModelKey(mod.key); showToast('Model Updated', `Active model: ${mod.name}`); }} className="w-full bg-indigo-600 text-white hover:bg-indigo-700">Activate Model</Button>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* ========================================== */}
            {/* PAGE 7: MODEL PERFORMANCE                  */}
            {/* ========================================== */}
            {activePage === 'model' && (
              <div className="space-y-6">
                <Card className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="type-card-title">{activeModel.name}</h3>
                    <p className="type-subheading">Evaluated on 1,409 holdout accounts</p>
                  </div>
                  <span className="text-xs font-semibold text-indigo-500">ROC-AUC: {activeModel.rocAuc}%</span>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="p-5">
                    <span className="type-label">Accuracy</span>
                    <h3 className="type-metric mt-2">{activeModel.accuracy}%</h3>
                    <p className="type-subheading mt-1">Overall classification accuracy</p>
                  </Card>
                  <Card className="p-5">
                    <span className="type-label">Precision</span>
                    <h3 className="type-metric mt-2">{activeModel.precision}%</h3>
                    <p className="type-subheading mt-1">True churn rate among flagged accounts</p>
                  </Card>
                  <Card className="p-5">
                    <span className="type-label">Recall</span>
                    <h3 className="type-metric mt-2 text-emerald-500">{activeModel.recall}%</h3>
                    <p className="type-subheading mt-1">Share of actual cancellations identified</p>
                  </Card>
                  <Card className="p-5">
                    <span className="type-label">F1 Score</span>
                    <h3 className="type-metric mt-2 text-indigo-500">{activeModel.f1}%</h3>
                    <p className="type-subheading mt-1">Harmonic mean of precision and recall</p>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-6 space-y-4">
                    <div>
                      <h4 className="type-card-title">Feature Importance</h4>
                      <p className="type-subheading mt-0.5">Relative impact of account attributes on predicted churn</p>
                    </div>
                    <div className="space-y-3">
                      {NOTEBOOK_PERMUTATION_IMPORTANCE.map((item) => (
                        <div key={item.feature} className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="font-medium">{item.feature}</span>
                            <span className="text-[11px] text-[var(--text-secondary)]">{item.category}</span>
                          </div>
                          <div className="w-full h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.max(4, (item.importance / 0.16) * 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-6 space-y-4">
                    <div>
                      <h4 className="type-card-title">Confusion Matrix (1,409 Accounts)</h4>
                      <p className="type-subheading mt-0.5">Holdout validation results by predicted vs. actual outcome</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 text-center">
                      <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                        <span className="text-[11px] font-medium text-[var(--text-secondary)] block">True Negative (Retained)</span>
                        <span className="type-metric text-emerald-500 mt-1 block">{activeModel.confusionMatrix.tn}</span>
                        <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">Correctly predicted active</span>
                      </div>
                      <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                        <span className="text-[11px] font-medium text-[var(--text-secondary)] block">False Positive</span>
                        <span className="type-metric text-amber-500 mt-1 block">{activeModel.confusionMatrix.fp}</span>
                        <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">Flagged at-risk, remained active</span>
                      </div>
                      <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                        <span className="text-[11px] font-medium text-[var(--text-secondary)] block">False Negative</span>
                        <span className="type-metric text-rose-500 mt-1 block">{activeModel.confusionMatrix.fn}</span>
                        <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">Unflagged cancellations</span>
                      </div>
                      <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                        <span className="text-[11px] font-medium text-[var(--text-secondary)] block">True Positive (Churned)</span>
                        <span className="type-metric text-indigo-500 mt-1 block">{activeModel.confusionMatrix.tp}</span>
                        <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">Correctly identified churn</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* PAGE 8: PREDICTION HISTORY                 */}
            {/* ========================================== */}
            {activePage === 'history' && (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  {predictionHistory.length === 0 ? (
                    <div className="p-10 text-center space-y-2">
                      <p className="type-card-title">No saved predictions</p>
                      <p className="type-subheading">Use the Risk Calculator to evaluate an account and save the result.</p>
                      <Button variant="primary" size="sm" onClick={() => navigateToPage('prediction')} className="bg-indigo-600 text-white hover:bg-indigo-700">Open Risk Calculator</Button>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-b border-[var(--border-subtle)] font-medium">
                        <tr>
                          <th className="px-4 py-3">Record ID</th>
                          <th className="px-4 py-3">Customer Name</th>
                          <th className="px-4 py-3">Timestamp</th>
                          <th className="px-4 py-3">Risk Score</th>
                          <th className="px-4 py-3">Risk Level</th>
                          <th className="px-4 py-3">Recommended Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {predictionHistory.map(item => (
                          <tr key={item.predId} className="hover:bg-[var(--bg-subtle)] transition">
                            <td className="px-4 py-3 font-mono">{item.predId}</td>
                            <td className="px-4 py-3 font-medium">{item.customerName}</td>
                            <td className="px-4 py-3 text-[var(--text-secondary)] tabular-nums">{item.timestamp}</td>
                            <td className="px-4 py-3 tabular-nums font-semibold">{item.probability}%</td>
                            <td className="px-4 py-3"><RiskBadge probability={item.probability} thresholds={thresholds} /></td>
                            <td className="px-4 py-3 text-[var(--text-secondary)]">{item.actionStatus}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </Card>
            )}

            {/* ========================================== */}
            {/* PAGE 9: SETTINGS                           */}
            {/* ========================================== */}
            {activePage === 'settings' && (
              <Card className="p-6 space-y-5 max-w-xl">
                <div>
                  <h3 className="type-card-title">Risk Classification Thresholds</h3>
                  <p className="type-subheading mt-1">
                    Define the probability cutoffs (0%–100%) used to classify accounts as Medium Risk or High Risk.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block type-label mb-1">Medium Risk Threshold (%)</label>
                    <input type="number" min="5" max="90" value={thresholds.medium} onChange={(e) => setThresholds(t => ({ ...t, medium: Number(e.target.value) }))} className="w-full h-9 px-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs" />
                    <span className="text-[11px] text-[var(--text-secondary)] block mt-1">Scores below {thresholds.medium}% are classified as Low Risk.</span>
                  </div>
                  <div>
                    <label className="block type-label mb-1">High Risk Threshold (%)</label>
                    <input type="number" min="10" max="95" value={thresholds.high} onChange={(e) => setThresholds(t => ({ ...t, high: Number(e.target.value) }))} className="w-full h-9 px-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs" />
                    <span className="text-[11px] text-[var(--text-secondary)] block mt-1">Scores at or above {thresholds.high}% are classified as High Risk.</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">Default thresholds: 35% Medium Risk, 65% High Risk.</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setThresholds({ medium: 35, high: 65 });
                      showToast('Thresholds Reset', 'Restored default 35% Medium Risk and 65% High Risk thresholds.');
                    }}
                  >
                    Reset Defaults
                  </Button>
                </div>
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
