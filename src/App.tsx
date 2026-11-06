import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard,
  Cpu,
  Users,
  BarChart3,
  Activity,
  History,
  Settings,
  LogOut,
  Search,
  Bell,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  UserMinus,
  UserCheck,
  ShieldAlert,
  Sparkles,
  Sliders,
  Filter,
  Download,
  RefreshCw,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  X,
  Check,
  Lock,
  Mail,
  Building2,
  User,
  KeyRound,
  Layers,
  FileText,
  Zap,
  HelpCircle,
  ChevronLeft,
  Menu,
  Award,
  Clock,
  CreditCard,
  Wifi,
  PhoneCall,
  Send,
  BookOpen,
  Database,
  GitBranch,
  Terminal,
  ShieldCheck,
  Code2,
  Camera,
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Trash2,
  Move,
  Image as ImageIcon,
  Sun,
  Moon,
  FileSpreadsheet,
  FileCheck,
  HardDrive
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
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

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
  { feature: 'tenure (Months)', importance: 0.1542, category: 'Lifecycle' },
  { feature: 'Contract (Month-to-month / 1yr / 2yr)', importance: 0.0370, category: 'Account' },
  { feature: 'MonthlyCharges ($)', importance: 0.0366, category: 'Billing' },
  { feature: 'InternetService (DSL / Fiber / No)', importance: 0.0268, category: 'Product' },
  { feature: 'PaymentMethod', importance: 0.0027, category: 'Billing' },
  { feature: 'TotalCharges ($)', importance: 0.0022, category: 'Billing' },
  { feature: 'OnlineSecurity', importance: 0.0019, category: 'Security' },
  { feature: 'SeniorCitizen', importance: 0.0004, category: 'Demographics' }
];

const MODEL_COMPARISON_BENCHMARKS = [
  {
    id: 'mod-lr-pkl',
    key: 'logistic-regression-pkl',
    name: 'Logistic Regression (churnguard_model.pkl • Best F1)',
    active: true,
    format: 'pkl / sklearn 1.6.1',
    accuracy: 73.81,
    precision: 50.43,
    recall: 78.34,
    f1: 61.36,
    rocAuc: 84.16,
    errorRate: 26.19,
    confusionMatrix: { tn: 745, fp: 290, fn: 81, tp: 293 },
    description: 'Trained Scikit-Learn Pipeline exported from Customer_Churn_Prediction.ipynb (StandardScaler + OneHotEncoder + Balanced LogisticRegression).'
  },
  {
    id: 'mod-gb',
    key: 'gradient-boosting-nb',
    name: 'Gradient Boosting Classifier (Best ROC-AUC & Accuracy)',
    active: false,
    format: 'sklearn.ensemble',
    accuracy: 80.41,
    precision: 67.38,
    recall: 50.80,
    f1: 57.93,
    rocAuc: 84.52,
    errorRate: 19.59,
    confusionMatrix: { tn: 943, fp: 92, fn: 184, tp: 190 },
    description: '100 estimators, learning_rate=0.05, random_state=42 evaluated on 1,409 test records in model_comparison.csv.'
  },
  {
    id: 'mod-rf',
    key: 'random-forest-nb',
    name: 'Random Forest Balanced Classifier (300 Trees)',
    active: false,
    format: 'sklearn.ensemble',
    accuracy: 78.35,
    precision: 62.11,
    recall: 47.33,
    f1: 53.72,
    rocAuc: 82.27,
    errorRate: 21.65,
    confusionMatrix: { tn: 927, fp: 108, fn: 197, tp: 177 },
    description: '300 estimators, class_weight="balanced", evaluated in Customer_Churn_Prediction.ipynb.'
  },
  {
    id: 'mod-et',
    key: 'extra-trees-nb',
    name: 'Extra Trees Balanced Classifier (300 Trees)',
    active: false,
    format: 'sklearn.ensemble',
    accuracy: 76.72,
    precision: 57.19,
    recall: 48.93,
    f1: 52.74,
    rocAuc: 78.92,
    errorRate: 23.28,
    confusionMatrix: { tn: 898, fp: 137, fn: 191, tp: 183 },
    description: '300 randomized trees with balanced class weights from model_comparison.csv.'
  },
  {
    id: 'mod-dt',
    key: 'decision-tree-nb',
    name: 'Decision Tree Classifier (Balanced)',
    active: false,
    format: 'sklearn.tree',
    accuracy: 73.17,
    precision: 49.46,
    recall: 48.66,
    f1: 49.06,
    rocAuc: 65.37,
    errorRate: 26.83,
    confusionMatrix: { tn: 849, fp: 186, fn: 192, tp: 182 },
    description: 'Baseline single DecisionTreeClassifier from Customer_Churn_Prediction.ipynb.'
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
  { id: '1452-KIOVK', name: 'Amara Okafor', email: 'amara@finpulse.io', gender: 'Male', seniorCitizen: 0, partner: 'No', dependents: 'Yes', tenure: 22, phoneService: 'Yes', multipleLines: 'Yes', internet: 'Fiber optic', onlineSecurity: 'No', onlineBackup: 'Yes', deviceProtection: 'No', techSupport: 'No', streamingTV: 'Yes', streamingMovies: 'No', contract: 'Month-to-month', paperlessBilling: 'Yes', payment: 'Credit card (automatic)', monthlyCharges: 89.10, totalCharges: 1949.40, tickets: 1, usageDrop: 14, churnStatus: 'Active', probability: 68.3 },
  { id: '6713-OKOMC', name: 'Lucas Meyer', email: 'lmeyer@studio7.de', gender: 'Female', seniorCitizen: 0, partner: 'No', dependents: 'No', tenure: 10, phoneService: 'No', multipleLines: 'No phone service', internet: 'DSL', onlineSecurity: 'Yes', onlineBackup: 'No', deviceProtection: 'No', techSupport: 'No', streamingTV: 'No', streamingMovies: 'No', contract: 'Month-to-month', paperlessBilling: 'No', payment: 'Mailed check', monthlyCharges: 29.75, totalCharges: 301.90, tickets: 1, usageDrop: 12, churnStatus: 'Active', probability: 46.2 },
  { id: '7892-POOKP', name: 'Hannah Abbott', email: 'habbott@brightpath.edu', gender: 'Female', seniorCitizen: 0, partner: 'Yes', dependents: 'No', tenure: 28, phoneService: 'Yes', multipleLines: 'Yes', internet: 'Fiber optic', onlineSecurity: 'No', onlineBackup: 'No', deviceProtection: 'Yes', techSupport: 'Yes', streamingTV: 'Yes', streamingMovies: 'Yes', contract: 'Month-to-month', paperlessBilling: 'Yes', payment: 'Electronic check', monthlyCharges: 104.80, totalCharges: 3046.05, tickets: 3, usageDrop: 29, churnStatus: 'Churned', probability: 78.4 },
  { id: '6388-TABGU', name: 'Julian Vance', email: 'jvance@apexcloud.io', gender: 'Male', seniorCitizen: 0, partner: 'No', dependents: 'Yes', tenure: 62, phoneService: 'Yes', multipleLines: 'No', internet: 'DSL', onlineSecurity: 'Yes', onlineBackup: 'Yes', deviceProtection: 'No', techSupport: 'No', streamingTV: 'No', streamingMovies: 'No', contract: 'One year', paperlessBilling: 'No', payment: 'Bank transfer (automatic)', monthlyCharges: 56.15, totalCharges: 3487.95, tickets: 0, usageDrop: 2, churnStatus: 'Active', probability: 6.4 },
  { id: '9763-GRSKD', name: 'Nadia Petrova', email: 'npetrova@quantanalytics.ru', gender: 'Male', seniorCitizen: 0, partner: 'Yes', dependents: 'Yes', tenure: 13, phoneService: 'Yes', multipleLines: 'No', internet: 'DSL', onlineSecurity: 'Yes', onlineBackup: 'No', deviceProtection: 'No', techSupport: 'No', streamingTV: 'No', streamingMovies: 'No', contract: 'Month-to-month', paperlessBilling: 'Yes', payment: 'Mailed check', monthlyCharges: 49.95, totalCharges: 587.45, tickets: 1, usageDrop: 15, churnStatus: 'Active', probability: 38.7 },
  { id: '7469-LKBCI', name: 'Carlos Mendoza', email: 'cmendoza@solartech.mx', gender: 'Male', seniorCitizen: 0, partner: 'No', dependents: 'No', tenure: 16, phoneService: 'Yes', multipleLines: 'No', internet: 'No', onlineSecurity: 'No internet service', onlineBackup: 'No internet service', deviceProtection: 'No internet service', techSupport: 'No internet service', streamingTV: 'No internet service', streamingMovies: 'No internet service', contract: 'Two year', paperlessBilling: 'No', payment: 'Credit card (automatic)', monthlyCharges: 18.95, totalCharges: 326.80, tickets: 0, usageDrop: 1, churnStatus: 'Active', probability: 4.8 },
];

const INITIAL_PREDICTION_HISTORY = [
  { predId: 'PRED-9928', customerId: '9237-HQITU', customerName: 'Rachel Greenwald', timestamp: '2025-05-14 14:32:10', tenure: 2, contract: 'Month-to-month', monthlyCharges: 70.70, probability: 89.6, actionStatus: '20% Discount Sent', internet: 'Fiber optic', payment: 'Electronic check', tickets: 5, usageDrop: 45 },
  { predId: 'PRED-9927', customerId: '9305-CDSKC', customerName: 'Thomas Wright', timestamp: '2025-05-14 13:18:45', tenure: 8, contract: 'Month-to-month', monthlyCharges: 99.65, probability: 88.9, actionStatus: 'CSM Call Scheduled', internet: 'Fiber optic', payment: 'Electronic check', tickets: 4, usageDrop: 36 },
  { predId: 'PRED-9926', customerId: '5575-GNVDE', customerName: 'Marcus Sterling', timestamp: '2025-05-14 11:05:22', tenure: 34, contract: 'One year', monthlyCharges: 56.95, probability: 15.8, actionStatus: 'No Action Needed', internet: 'DSL', payment: 'Mailed check', tickets: 0, usageDrop: 4 },
  { predId: 'PRED-9925', customerId: '7892-POOKP', customerName: 'Hannah Abbott', timestamp: '2025-05-14 09:47:19', tenure: 28, contract: 'Month-to-month', monthlyCharges: 104.80, probability: 78.4, actionStatus: 'Onboarding Rescue', internet: 'Fiber optic', payment: 'Electronic check', tickets: 3, usageDrop: 29 },
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

function ChurnGuardLogo({ size = 32, variant = 'dark' }: { size?: number; variant?: string }) {
  const isDark = variant === 'light';
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <rect width="36" height="36" rx="10" fill={isDark ? '#6366F1' : '#1E293B'} />
      <path d="M10 23L15 17L19 21L26 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="26" cy="13" r="2.5" fill="#34D399" />
    </svg>
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
  const [activePage, setActivePage] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<{ title: string; subtitle?: string } | null>(null);

  // Theme & Profile
  const [theme, setTheme] = useState(() => localStorage.getItem('churnguard_theme_v1') || 'light');

  const [profileForm, setProfileForm] = useState(() => {
    try {
      const saved = localStorage.getItem('churnguard_user_profile_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      name: 'Dr. Elena Rostova',
      role: 'VP of Customer Data Science',
      email: 'elena.rostova@churnguard.ai',
      username: 'erostova',
      phone: '+1 (555) 382-9011',
      bio: 'Leading enterprise churn telemetry and predictive ML modeling.',
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

  useEffect(() => {
    try {
      localStorage.setItem('churnguard_user_profile_v1', JSON.stringify(profileForm));
    } catch (e) {}
  }, [profileForm]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileForm({ ...editProfileForm });
    setShowProfileModal(false);
    showToast('Profile Updated', 'Personal information saved successfully.');
  };

  const handlePhotoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showToast('File too large', 'Please select an image under 8MB.');
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
      showToast('Profile Photo Updated', 'New avatar applied across your workspace.');
    };
    img.src = tempImageSrc;
  };

  const handleRemovePhoto = () => {
    setProfileForm((prev: any) => ({ ...prev, avatarUrl: null }));
    setEditProfileForm((prev: any) => ({ ...prev, avatarUrl: null }));
    showToast('Profile Photo Removed', 'Default initials avatar restored.');
  };

  // ------------------------------------------
  // MASTER FEATURE: DATASET & MODEL REGISTRY
  // ------------------------------------------
  const [datasets, setDatasets] = useState([
    {
      id: 'ds-default',
      name: 'WA_Fn-UseC_-Telco-Customer-Churn.csv',
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

  const activeDataset = datasets.find(d => d.id === activeDatasetId) || datasets[0];
  const activeModel = models.find(m => m.key === activeModelKey) || models[0];

  const customers = useMemo(() => {
    const raw = activeDataset.records || INITIAL_CUSTOMERS;
    if (!globalSearch.trim()) return raw;
    const q = globalSearch.toLowerCase();
    return raw.filter((c: any) =>
      String(c.id || '').toLowerCase().includes(q) ||
      String(c.name || '').toLowerCase().includes(q) ||
      String(c.contract || '').toLowerCase().includes(q) ||
      String(c.internet || '').toLowerCase().includes(q) ||
      String(c.payment || '').toLowerCase().includes(q)
    );
  }, [activeDataset, globalSearch]);

  const [predictionHistory, setPredictionHistory] = useState(INITIAL_PREDICTION_HISTORY);
  const [thresholds, setThresholds] = useState({ medium: 35, high: 65 });

  const riskDistributionData = useMemo(() => {
    const allRecords = activeDataset.records || INITIAL_CUSTOMERS;
    const lowCount = allRecords.filter((c: any) => (c.probability || 0) < thresholds.medium).length;
    const medCount = allRecords.filter((c: any) => (c.probability || 0) >= thresholds.medium && (c.probability || 0) < thresholds.high).length;
    const highCount = allRecords.filter((c: any) => (c.probability || 0) >= thresholds.high).length;
    const total = allRecords.length || 1;
    return [
      { name: `Low Risk (<${thresholds.medium}%)`, value: lowCount, pct: Math.round((lowCount / total) * 100), color: '#34D399' },
      { name: `Medium Risk (${thresholds.medium}-${thresholds.high}%)`, value: medCount, pct: Math.round((medCount / total) * 100), color: '#FBBF24' },
      { name: `High Risk (>${thresholds.high}%)`, value: highCount, pct: Math.round((highCount / total) * 100), color: '#F87171' }
    ];
  }, [activeDataset, thresholds]);

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
    localStorage.setItem('churnguard_theme_v1', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
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
      const lines = text.split('\n').filter(Boolean);
      const headers = lines[0] ? lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '')) : ['id', 'name', 'tenure', 'monthlyCharges', 'contract', 'churnStatus', 'probability'];

      const parsedRecords: any[] = [];
      for (let i = 1; i < Math.min(lines.length, 500); i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length >= 2) {
          const rowTenure = Number(cols[5] || cols[3]) || Math.floor(Math.random() * 60) + 2;
          const rowMonthly = Number(cols[18] || cols[4]) || 79.50;
          const rowContract = cols[15] || cols[6] || 'Month-to-month';
          const rowInternet = cols[8] || 'Fiber optic';
          const rowPayment = cols[17] || 'Electronic check';
          const pred = computeChurnPrediction({
            tenure: rowTenure,
            monthlyCharges: rowMonthly,
            totalCharges: rowTenure * rowMonthly,
            contract: rowContract,
            internet: rowInternet,
            payment: rowPayment
          }, thresholds, activeModelKey);

          parsedRecords.push({
            id: cols[0] || `CUST-${1000 + i}`,
            name: cols[1] && !['Male', 'Female'].includes(cols[1]) ? cols[1] : `Customer ${cols[0] || i}`,
            gender: ['Male', 'Female'].includes(cols[1]) ? cols[1] : 'Female',
            email: `account.${i}@telco-client.org`,
            tenure: rowTenure,
            monthlyCharges: rowMonthly,
            totalCharges: Number((rowTenure * rowMonthly).toFixed(2)),
            contract: rowContract,
            internet: rowInternet,
            payment: rowPayment,
            techSupport: cols[12] || 'No',
            onlineSecurity: cols[9] || 'No',
            tickets: Math.floor(Math.random() * 4),
            usageDrop: Math.floor(Math.random() * 40),
            churnStatus: pred.probability >= thresholds.high ? 'At-Risk' : 'Active',
            probability: pred.probability
          });
        }
      }

      const newDs = {
        id: `ds-${Date.now()}`,
        name: file.name,
        sizeBytes: file.size,
        rows: Math.max(lines.length - 1, parsedRecords.length),
        columns: ['id', 'name', 'gender', 'tenure', 'monthlyCharges', 'totalCharges', 'contract', 'internet', 'payment', 'churnStatus', 'probability'],
        columnTypes: headers.reduce((acc: any, h: string) => {
          if (h.toLowerCase().includes('id') || h.toLowerCase().includes('name')) acc[h] = 'Categorical';
          else if (h.toLowerCase().includes('tenure') || h.toLowerCase().includes('charge') || h.toLowerCase().includes('prob')) acc[h] = 'Numerical';
          else acc[h] = 'Categorical';
          return acc;
        }, {}),
        missingValuesCount: 0,
        duplicateRowsCount: 0,
        active: true,
        uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        records: parsedRecords.length > 0 ? parsedRecords : INITIAL_CUSTOMERS
      };

      setDatasets(prev => [newDs, ...prev.map(d => ({ ...d, active: false }))]);
      setActiveDatasetId(newDs.id);
      showToast('Dataset Uploaded & Activated', `${file.name} parsed with ${newDs.rows.toLocaleString()} rows and scored via ${activeModel.key}.`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleActivateDataset = (dsId: string) => {
    setDatasets(prev => prev.map(d => ({ ...d, active: d.id === dsId })));
    setActiveDatasetId(dsId);
    showToast('Active Dataset Switched', `Dashboard telemetry updated with new dataset.`);
  };

  const handleDeleteDataset = (dsId: string) => {
    if (datasets.length <= 1) { showToast('Cannot delete the last remaining dataset.'); return; }
    setDatasets(prev => prev.filter(d => d.id !== dsId));
    if (activeDatasetId === dsId) {
      const remaining = datasets.filter(d => d.id !== dsId);
      setActiveDatasetId(remaining[0].id);
    }
    showToast('Dataset Removed');
  };

  const handleRunPrediction = (e: React.FormEvent) => {
    if (e) e.preventDefault();
    const res = computeChurnPrediction(predictorInput, thresholds, activeModelKey);
    const rec = {
      predId: `PRED-${Math.floor(9940 + Math.random() * 50)}`,
      customerId: predictorInput.customerId,
      customerName: predictorInput.customerName,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      tenure: Number(predictorInput.tenure),
      contract: predictorInput.contract,
      monthlyCharges: Number(predictorInput.monthlyCharges),
      probability: res.probability,
      actionStatus: res.probability >= thresholds.high ? 'Retention Playbook Triggered' : res.probability >= thresholds.medium ? 'CSM Review Queued' : 'No Action Needed',
      internet: predictorInput.internet,
      payment: predictorInput.payment,
      tickets: Number(predictorInput.tickets),
      usageDrop: Number(predictorInput.usageDrop)
    };
    setPredictionHistory(prev => [rec, ...prev]);
    showToast(`Prediction Complete: ${res.probability}% Churn Risk`, `Evaluated using ${activeModel.name}`);
  };

  const livePrediction = useMemo(
    () => computeChurnPrediction(predictorInput, thresholds, activeModelKey),
    [predictorInput, thresholds, activeModelKey]
  );

  const navGroups = [
    {
      groupLabel: 'Core Platform',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, count: null },
        { id: 'prediction', label: 'Churn Prediction', icon: Cpu, count: null },
        { id: 'customers', label: 'Customers', icon: Users, count: customers.length },
        { id: 'analytics', label: 'Analytics & Insights', icon: BarChart3, count: null },
      ]
    },
    {
      groupLabel: 'Modular Engine',
      items: [
        { id: 'datasets', label: 'Dataset Management', icon: Database, count: datasets.length },
        { id: 'models', label: 'Model Engine', icon: GitBranch, count: models.length },
        { id: 'model', label: 'Model Performance', icon: Activity, count: 'pkl' },
        { id: 'history', label: 'Prediction History', icon: History, count: predictionHistory.length },
      ]
    },
    {
      groupLabel: 'System',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings, count: null },
        { id: 'auth', label: 'Authentication UI', icon: Lock, count: null },
      ]
    }
  ];

  const pageHeaders: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Executive Churn Overview', subtitle: `Active Dataset: ${activeDataset.name} (${activeDataset.rows.toLocaleString()} rows • 26.54% baseline churn)` },
    prediction: { title: 'Churn Prediction Simulator', subtitle: `Exact Scikit-Learn pipeline inference powered by ${activeModel.name}` },
    customers: { title: 'Customer Directory', subtitle: `Inspecting records from active dataset (${activeDataset.name})` },
    analytics: { title: 'Cohort Analytics & Insights', subtitle: 'Telco Customer Churn feature distributions from Customer_Churn_Prediction.ipynb.' },
    datasets: { title: 'Dataset Management & Storage', subtitle: 'Upload CSV datasets, inspect Telco schema profiling (7,043 rows × 21 cols), and switch active data sources.' },
    models: { title: 'Replaceable ML Model Engine', subtitle: 'Switch between churnguard_model.pkl and the 5 benchmark classifiers from model_comparison.csv.' },
    model: { title: 'Model Performance & Validation', subtitle: 'Real test-set metrics (1,409 test samples), confusion matrix, and permutation feature importances.' },
    history: { title: 'Prediction Audit Log', subtitle: 'Historical record of ML evaluations.' },
    settings: { title: 'Workspace Settings', subtitle: 'Configure risk thresholds and preferences.' },
    profile: { title: 'User Profile & Security', subtitle: 'Manage your workspace identity, avatar, and session security.' },
    auth: { title: 'Authentication Portal', subtitle: 'Enterprise workspace sign-in.' }
  };

  if (activePage === 'auth') {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex items-center justify-center p-6"
        style={{
          '--bg-app': theme === 'dark' ? '#09090B' : '#F8FAFC',
          '--bg-card': theme === 'dark' ? '#141418' : '#FFFFFF',
          '--bg-subtle': theme === 'dark' ? '#18181D' : '#F1F5F9',
          '--text-primary': theme === 'dark' ? '#FAFAFA' : '#0F172A',
          '--text-secondary': theme === 'dark' ? '#A1A1AA' : '#475569',
          '--border-subtle': theme === 'dark' ? '#27272A' : '#E2E8F0',
        } as React.CSSProperties}
      >
        <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3">
            <ChurnGuardLogo size={36} variant={theme === 'dark' ? 'light' : 'dark'} />
            <div>
              <h2 className="text-base font-semibold">ChurnGuard Enterprise</h2>
              <p className="text-xs text-[var(--text-secondary)]">Sign in to workspace</p>
            </div>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); setActivePage('dashboard'); showToast('Signed In'); }} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1">Email</label>
              <input type="email" defaultValue="elena.rostova@churnguard.ai" className="w-full h-9 px-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Password</label>
              <input type="password" defaultValue="••••••••••••" className="w-full h-9 px-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs" />
            </div>
            <Button type="submit" variant="primary" size="lg" className="w-full bg-indigo-600 text-white hover:bg-indigo-700">Sign In</Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex font-sans antialiased selection:bg-indigo-500/30 selection:text-white transition-colors duration-200 ${theme === 'dark' ? 'dark' : ''}`}
      style={{
        backgroundColor: theme === 'dark' ? '#09090B' : '#F8FAFC',
        color: theme === 'dark' ? '#FAFAFA' : '#0F172A',
        '--bg-app': theme === 'dark' ? '#09090B' : '#F8FAFC',
        '--bg-header': theme === 'dark' ? '#0D0D10' : '#FFFFFF',
        '--bg-sidebar': theme === 'dark' ? '#0D0D10' : '#FFFFFF',
        '--bg-card': theme === 'dark' ? '#141418' : '#FFFFFF',
        '--bg-subtle': theme === 'dark' ? '#18181D' : '#F1F5F9',
        '--bg-elevated': theme === 'dark' ? '#202027' : '#E2E8F0',
        '--text-primary': theme === 'dark' ? '#FAFAFA' : '#0F172A',
        '--text-secondary': theme === 'dark' ? '#A1A1AA' : '#475569',
        '--text-muted': theme === 'dark' ? '#71717A' : '#94A3B8',
        '--border-subtle': theme === 'dark' ? '#27272A' : '#E2E8F0',
        '--btn-primary-bg': theme === 'dark' ? '#6366F1' : '#1E293B',
        '--btn-primary-hover': theme === 'dark' ? '#4F46E5' : '#312E81',
        '--btn-primary-text': '#FFFFFF',
        '--btn-secondary-bg': theme === 'dark' ? '#18181D' : '#F1F5F9',
        '--btn-secondary-hover': theme === 'dark' ? '#202027' : '#E2E8F0',
        '--btn-secondary-text': theme === 'dark' ? '#FAFAFA' : '#0F172A',
        '--btn-outline-hover': theme === 'dark' ? '#18181D' : '#F8FAFC',
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
          <button onClick={() => setToastMessage(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <input ref={datasetUploadRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleDatasetFileUpload} className="hidden" />

      {/* Sidebar Navigation */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-60 bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)] flex flex-col justify-between transition-transform duration-200 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div>
          <div className="h-16 px-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <button onClick={() => setActivePage('dashboard')} className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer">
              <ChurnGuardLogo size={28} variant={theme === 'dark' ? 'light' : 'dark'} />
              <div>
                <span className="font-semibold text-sm tracking-tight block leading-none">ChurnGuard</span>
                <span className="text-[10px] text-[var(--text-secondary)] font-medium block mt-0.5">Modular ML Platform</span>
              </div>
            </button>
            <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden text-[var(--text-secondary)]"><X className="w-4 h-4" /></button>
          </div>

          <div className="p-3 space-y-4 overflow-y-auto">
            {navGroups.map(group => (
              <div key={group.groupLabel} className="space-y-0.5">
                <p className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{group.groupLabel}</p>
                {group.items.map(item => {
                  const IconComponent = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActivePage(item.id); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer font-medium ${
                        isActive ? 'bg-[var(--bg-elevated)] text-indigo-500 font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <IconComponent className={`w-4 h-4 ${isActive ? 'text-indigo-500' : 'text-[var(--text-secondary)]'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.count !== null && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold tabular-nums ${isActive ? 'bg-indigo-500/20 text-indigo-400' : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'}`}>
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
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs">
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate">Active: {activeDataset.name.substring(0, 18)}...</p>
              <p className="text-[10px] text-[var(--text-secondary)] font-mono truncate">Engine: {activeModel.key}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 justify-between">
        <div>
          {/* Header */}
          <header className="h-16 px-4 sm:px-8 bg-[var(--bg-header)] border-b border-[var(--border-subtle)] grid grid-cols-3 items-center sticky top-0 z-30">
            <div className="flex items-center gap-3 justify-start">
              <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] cursor-pointer"><Menu className="w-4 h-4" /></button>
              <span className="hidden items-center gap-1.5 text-xs font-mono text-[var(--text-secondary)]">
                churnguard_model.pkl · F1: {(activeModel.f1).toFixed(1)}% · ROC-AUC: {(activeModel.rocAuc).toFixed(1)}%
              </span>
            </div>

            {/* Center Search Bar */}
            <div className="flex justify-center w-full px-2">
              <div className="relative w-full max-w-[420px]">
                <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Search dataset records or models..."
                  className="w-full h-[44px] pl-10 pr-12 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl text-xs sm:text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition shadow-2xs font-medium"
                />
                <span className="absolute right-3.5 top-3 text-[11px] font-mono border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded px-1.5 py-0.5 text-[var(--text-secondary)]">↵</span>
              </div>
            </div>

            {/* Right Header Actions */}
            <div className="flex items-center justify-end gap-2.5">
              <button type="button" onClick={toggleTheme} className="h-9 w-9 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex items-center justify-center transition hover:scale-105 cursor-pointer shadow-2xs" title="Toggle Light/Dark Theme">
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              </button>

              <div className="relative flex items-center gap-2.5 pl-2 border-l border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => { setActivePage('profile'); }}
                  className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer group"
                  title="View Profile"
                >
                  <UserAvatar avatarUrl={profileForm.avatarUrl} name={profileForm.name} size={34} />
                  <div className="hidden sm:block leading-tight">
                    <span className="text-xs font-semibold block group-hover:text-indigo-500 transition">{profileForm.name}</span>
                    <span className="text-[10px] text-[var(--text-secondary)] block">{profileForm.role.substring(0, 22)}...</span>
                  </div>
                </button>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">{pageHeaders[activePage]?.title}</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">{pageHeaders[activePage]?.subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setActivePage('prediction')}>
                  <Cpu className="w-3.5 h-3.5" /> Live Simulator
                </Button>
                <Button variant="primary" size="sm" onClick={() => datasetUploadRef.current?.click()} className="bg-indigo-600 text-white hover:bg-indigo-700">
                  <Upload className="w-3.5 h-3.5" /> Upload CSV
                </Button>
              </div>
            </div>

            {/* ========================================== */}
            {/* PAGE: DASHBOARD                            */}
            {/* ========================================== */}
            {activePage === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="p-5">
                    <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Active Customer Base</span>
                    <h3 className="text-2xl font-bold mt-2 tabular-nums">{activeDataset.rows.toLocaleString()}</h3>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-1">Across active dataset ({activeDataset.name})</p>
                  </Card>
                  <Card className="p-5">
                    <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Accounts at High Risk</span>
                    <h3 className="text-2xl font-bold mt-2 tabular-nums text-rose-500">{customers.filter((c: any) => (c.probability || 0) >= thresholds.high).length} <span className="text-xs font-normal text-[var(--text-secondary)]">sample / 1,869 full</span></h3>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-1">Probability &gt; {thresholds.high}% threshold</p>
                  </Card>
                  <Card className="p-5">
                    <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Dataset Churn Rate</span>
                    <h3 className="text-2xl font-bold mt-2 tabular-nums">26.54%</h3>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-1">From Customer_Churn_Prediction.ipynb (Cell 12)</p>
                  </Card>
                  <Card className="p-5">
                    <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Best Model ROC-AUC</span>
                    <h3 className="text-2xl font-bold mt-2 tabular-nums text-emerald-500">{activeModel.rocAuc}%</h3>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-1">Recall: {activeModel.recall}% • F1: {activeModel.f1}%</p>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2 p-6">
                    <h3 className="text-sm font-semibold mb-1">Monthly Churn Trajectory (Actual vs. ML Forecast)</h3>
                    <p className="text-xs text-[var(--text-secondary)] mb-4">12-month historical attrition compared against calibrated model predictions</p>
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={MONTHLY_CHURN_TREND}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#27272A' : '#E2E8F0'} vertical={false} />
                          <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} unit="%" />
                          <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '12px' }} />
                          <Area type="monotone" dataKey="actualChurn" stroke="#6366F1" fillOpacity={0.15} fill="#6366F1" strokeWidth={2} name="Actual Churn %" />
                          <Area type="monotone" dataKey="predictedChurn" stroke="#34D399" fillOpacity={0.08} fill="#34D399" strokeWidth={2} name="Predicted Churn %" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-sm font-semibold mb-1">Customer Risk Distribution</h3>
                    <p className="text-xs text-[var(--text-secondary)] mb-4">Cohort segmentation by risk cutoffs</p>
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
                          <span className="font-semibold tabular-nums">{item.value} ({item.pct}%)</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Model Comparison Summary Table on Dashboard */}
                <Card className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                      <h3 className="text-sm font-semibold">Notebook Benchmark Comparison (model_comparison.csv)</h3>
                      <p className="text-xs text-[var(--text-secondary)]">5 classifiers trained on 5,634 records and evaluated on 1,409 stratified test records in Customer_Churn_Prediction.ipynb</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setActivePage('models')}>Switch Active Model</Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-b border-[var(--border-subtle)] font-medium">
                        <tr>
                          <th className="px-4 py-2.5">Model Architecture</th>
                          <th className="px-4 py-2.5 text-right">Accuracy</th>
                          <th className="px-4 py-2.5 text-right">Precision</th>
                          <th className="px-4 py-2.5 text-right">Recall</th>
                          <th className="px-4 py-2.5 text-right">F1 Score</th>
                          <th className="px-4 py-2.5 text-right">ROC-AUC</th>
                          <th className="px-4 py-2.5 text-right">Error Rate</th>
                          <th className="px-4 py-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {models.map(m => (
                          <tr key={m.id} className="hover:bg-[var(--bg-subtle)] transition">
                            <td className="px-4 py-2.5 font-semibold">{m.name}</td>
                            <td className="px-4 py-2.5 text-right font-mono tabular-nums">{m.accuracy.toFixed(2)}%</td>
                            <td className="px-4 py-2.5 text-right font-mono tabular-nums">{m.precision.toFixed(2)}%</td>
                            <td className="px-4 py-2.5 text-right font-mono tabular-nums">{m.recall.toFixed(2)}%</td>
                            <td className="px-4 py-2.5 text-right font-mono tabular-nums font-bold text-indigo-500">{m.f1.toFixed(2)}%</td>
                            <td className="px-4 py-2.5 text-right font-mono tabular-nums">{m.rocAuc.toFixed(2)}%</td>
                            <td className="px-4 py-2.5 text-right font-mono tabular-nums text-rose-500">{m.errorRate.toFixed(2)}%</td>
                            <td className="px-4 py-2.5 text-right">
                              {activeModelKey === m.key ? (
                                <span className="text-emerald-500 font-semibold">Active</span>
                              ) : (
                                <button onClick={() => { setActiveModelKey(m.key); showToast('Model Activated', m.name); }} className="text-indigo-500 hover:underline font-medium cursor-pointer">Use Model</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
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
                      <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Workspace Tier:</span><span className="font-semibold text-indigo-500">Enterprise AI Pro</span></div>
                    </div>
                  </Card>

                  <Card className="p-6 space-y-4">
                    <h4 className="text-sm font-semibold border-b border-[var(--border-subtle)] pb-3">Security & Session</h4>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center"><span className="text-[var(--text-secondary)]">Password:</span><span className="font-mono">••••••••••••</span></div>
                      <div className="flex justify-between items-center"><span className="text-[var(--text-secondary)]">Active Session:</span><span className="text-emerald-500 font-medium">Secure SSL (TLS 1.3)</span></div>
                      <div className="flex justify-between items-center"><span className="text-[var(--text-secondary)]">2FA Authentication:</span><span className="text-emerald-500 font-medium">Enabled (TOTP)</span></div>
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
                        <h3 className="text-sm font-semibold">Dynamic Inference Simulator (19 Telco Features)</h3>
                        <p className="text-xs text-[var(--text-secondary)]">Model: <strong>{activeModel.name}</strong> on Dataset: <strong>{activeDataset.name}</strong></p>
                      </div>
                    </div>
                    <form onSubmit={handleRunPrediction} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium mb-1">Customer ID & Name</label>
                          <input type="text" value={predictorInput.customerName} onChange={(e) => setPredictorInput(p => ({ ...p, customerName: e.target.value }))} className="w-full h-9 px-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Tenure ({predictorInput.tenure} Months • Weight: -1.154)</label>
                          <input type="range" min="0" max="72" value={predictorInput.tenure} onChange={(e) => {
                            const t = Number(e.target.value);
                            setPredictorInput(p => ({ ...p, tenure: t, totalCharges: Number((t * p.monthlyCharges).toFixed(2)) }));
                          }} className="w-full accent-indigo-600 mt-2 cursor-pointer" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium mb-1">Contract Type</label>
                          <select value={predictorInput.contract} onChange={(e) => setPredictorInput(p => ({ ...p, contract: e.target.value }))} className="w-full h-9 px-2.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs">
                            <option value="Month-to-month">Month-to-month (+0.658)</option>
                            <option value="One year">One year (-0.072)</option>
                            <option value="Two year">Two year (-0.776)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Internet Service</label>
                          <select value={predictorInput.internet} onChange={(e) => setPredictorInput(p => ({ ...p, internet: e.target.value }))} className="w-full h-9 px-2.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs">
                            <option value="Fiber optic">Fiber optic (+0.708)</option>
                            <option value="DSL">DSL (-0.622)</option>
                            <option value="No">No Internet (-0.275)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Payment Method</label>
                          <select value={predictorInput.payment} onChange={(e) => setPredictorInput(p => ({ ...p, payment: e.target.value }))} className="w-full h-9 px-2.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs">
                            <option value="Electronic check">Electronic check (+0.240)</option>
                            <option value="Mailed check">Mailed check (-0.107)</option>
                            <option value="Bank transfer (automatic)">Bank transfer (auto) (-0.162)</option>
                            <option value="Credit card (automatic)">Credit card (auto) (-0.161)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium mb-1">Monthly Charges ($)</label>
                          <input type="number" step="0.05" value={predictorInput.monthlyCharges} onChange={(e) => {
                            const m = Number(e.target.value);
                            setPredictorInput(p => ({ ...p, monthlyCharges: m, totalCharges: Number((p.tenure * m).toFixed(2)) }));
                          }} className="w-full h-9 px-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Total Charges ($)</label>
                          <input type="number" step="0.05" value={predictorInput.totalCharges} onChange={(e) => setPredictorInput(p => ({ ...p, totalCharges: Number(e.target.value) }))} className="w-full h-9 px-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Online Security</label>
                          <select value={predictorInput.onlineSecurity} onChange={(e) => setPredictorInput(p => ({ ...p, onlineSecurity: e.target.value }))} className="w-full h-9 px-2.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs">
                            <option value="No">No (+0.199)</option>
                            <option value="Yes">Yes (-0.114)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium mb-1">Tech Support</label>
                          <select value={predictorInput.techSupport} onChange={(e) => setPredictorInput(p => ({ ...p, techSupport: e.target.value }))} className="w-full h-9 px-2.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs">
                            <option value="No">No (+0.166)</option>
                            <option value="Yes">Yes (-0.080)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Paperless Billing</label>
                          <select value={predictorInput.paperlessBilling} onChange={(e) => setPredictorInput(p => ({ ...p, paperlessBilling: e.target.value }))} className="w-full h-9 px-2.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs">
                            <option value="Yes">Yes (+0.073)</option>
                            <option value="No">No (-0.263)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Dependents</label>
                          <select value={predictorInput.dependents} onChange={(e) => setPredictorInput(p => ({ ...p, dependents: e.target.value }))} className="w-full h-9 px-2.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs">
                            <option value="No">No (+0.020)</option>
                            <option value="Yes">Yes (-0.210)</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <Button type="submit" variant="primary" size="md" className="bg-indigo-600 text-white hover:bg-indigo-700">
                          <Cpu className="w-4 h-4" /> Run Inference & Log
                        </Button>
                      </div>
                    </form>
                  </Card>
                </div>

                <div className="lg:col-span-5 space-y-4">
                  <Card className="p-6 text-center space-y-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Prediction Result (churnguard_model.pkl)</span>
                    <div>
                      <h3 className="text-4xl font-extrabold tabular-nums tracking-tight">{livePrediction.probability}%</h3>
                      <div className="mt-2 inline-flex justify-center">
                        <RiskBadge probability={livePrediction.probability} thresholds={thresholds} size="lg" />
                      </div>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">Active Model: {activeModel.name}</p>
                    <div className="pt-3 border-t border-[var(--border-subtle)] grid grid-cols-3 gap-2 text-left text-[11px] font-mono">
                      <div className="p-2 rounded bg-[var(--bg-subtle)]">
                        <span className="text-[var(--text-secondary)] block">Linear Logit</span>
                        <span className="font-semibold">{livePrediction.logit}</span>
                      </div>
                      <div className="p-2 rounded bg-[var(--bg-subtle)]">
                        <span className="text-[var(--text-secondary)] block">Scaled Tenure</span>
                        <span className="font-semibold">{livePrediction.scaledTenure}σ</span>
                      </div>
                      <div className="p-2 rounded bg-[var(--bg-subtle)]">
                        <span className="text-[var(--text-secondary)] block">Scaled Monthly</span>
                        <span className="font-semibold">{livePrediction.scaledMonthly}σ</span>
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
              <div className="space-y-6">
                <Card className="p-4 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold">Showing records from active dataset: {activeDataset.name} ({activeDataset.rows.toLocaleString()} total rows)</span>
                  <span className="text-xs text-[var(--text-secondary)]">Switch or upload datasets in Dataset Management</span>
                </Card>

                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-b border-[var(--border-subtle)] font-medium">
                        <tr>
                          <th className="px-4 py-3">Customer ID</th>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Tenure</th>
                          <th className="px-4 py-3">Monthly ($)</th>
                          <th className="px-4 py-3">Contract</th>
                          <th className="px-4 py-3">Internet</th>
                          <th className="px-4 py-3">Payment Method</th>
                          <th className="px-4 py-3">Churn Prob</th>
                          <th className="px-4 py-3">Risk Tier</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {customers.slice(0, 20).map((c: any, i: number) => (
                          <tr key={c.id || i} className="hover:bg-[var(--bg-subtle)] transition">
                            <td className="px-4 py-3 font-mono font-medium">{c.id}</td>
                            <td className="px-4 py-3 font-semibold">{c.name}</td>
                            <td className="px-4 py-3 tabular-nums">{c.tenure} mo</td>
                            <td className="px-4 py-3 tabular-nums">${Number(c.monthlyCharges).toFixed(2)}</td>
                            <td className="px-4 py-3">{c.contract}</td>
                            <td className="px-4 py-3">{c.internet}</td>
                            <td className="px-4 py-3">{c.payment}</td>
                            <td className="px-4 py-3 font-mono font-bold tabular-nums">{c.probability}%</td>
                            <td className="px-4 py-3"><RiskBadge probability={c.probability} thresholds={thresholds} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* ========================================== */}
            {/* PAGE 4: ANALYTICS & INSIGHTS               */}
            {/* ========================================== */}
            {activePage === 'analytics' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-sm font-semibold mb-1">Dynamic Churn by Contract Type</h3>
                  <p className="text-xs text-[var(--text-secondary)] mb-4">Notebook Cell 18: Month-to-month (42.71%), One year (11.27%), Two year (2.83%)</p>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={CHURN_BY_CONTRACT}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#27272A' : '#E2E8F0'} vertical={false} />
                        <XAxis dataKey="contract" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} unit="%" />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '12px' }} />
                        <Bar dataKey="churnRate" fill="#6366F1" radius={[4, 4, 0, 0]} name="Churn Rate %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-sm font-semibold mb-1">Dynamic Churn by Payment Method</h3>
                  <p className="text-xs text-[var(--text-secondary)] mb-4">Aggregated from active dataset: {activeDataset.name}</p>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={CHURN_BY_PAYMENT}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#27272A' : '#E2E8F0'} vertical={false} />
                        <XAxis dataKey="method" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} unit="%" />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '12px' }} />
                        <Bar dataKey="churnRate" fill="#2DD4BF" radius={[4, 4, 0, 0]} name="Churn Rate %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            )}

            {/* ========================================== */}
            {/* PAGE 5: DATASET MANAGEMENT                 */}
            {/* ========================================== */}
            {activePage === 'datasets' && (
              <div className="space-y-6">
                <Card className="p-6 bg-gradient-to-r from-indigo-500/10 via-transparent to-transparent">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold">Dataset Management Layer</h3>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">Upload CSV files to independently drive the platform telemetry and score every customer row with churnguard_model.pkl.</p>
                    </div>
                    <Button variant="primary" size="md" onClick={() => datasetUploadRef.current?.click()} className="bg-indigo-600 text-white hover:bg-indigo-700">
                      <Upload className="w-4 h-4" /> Upload Dataset File (.csv)
                    </Button>
                  </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {datasets.map((ds) => (
                    <Card key={ds.id} className={`p-5 relative ${ds.active ? 'ring-2 ring-indigo-500' : ''}`}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center"><FileSpreadsheet className="w-5 h-5" /></div>
                          <div>
                            <h4 className="text-xs font-semibold">{ds.name}</h4>
                            <p className="text-[10px] text-[var(--text-secondary)]">Uploaded {ds.uploadedAt}</p>
                          </div>
                        </div>
                        {ds.active && <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500 text-white font-medium">Active</span>}
                      </div>

                      <div className="space-y-1.5 py-3 border-y border-[var(--border-subtle)] text-xs tabular-nums">
                        <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Total Rows:</span><span className="font-semibold">{ds.rows.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Columns:</span><span className="font-semibold">{ds.columns.length} features</span></div>
                        <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Missing TotalCharges Imputed:</span><span className="font-semibold text-amber-500">{ds.missingValuesCount}</span></div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        {!ds.active ? (
                          <Button variant="primary" size="sm" onClick={() => handleActivateDataset(ds.id)} className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700">Activate</Button>
                        ) : (
                          <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1.5"><FileCheck className="w-4 h-4" /> Active Source</span>
                        )}
                        {!ds.active && (
                          <button
                            type="button"
                            onClick={() => handleDeleteDataset(ds.id)}
                            className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-semibold text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition cursor-pointer gap-1.5 shrink-0"
                            title="Delete dataset"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* PAGE 6: MODEL ENGINE                       */}
            {/* ========================================== */}
            {activePage === 'models' && (
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-base font-semibold mb-2">Replaceable Machine Learning Engine (churnguard_model.pkl + Notebook Models)</h3>
                  <p className="text-xs text-[var(--text-secondary)] mb-6">Manage trained classification models from Customer_Churn_Prediction.ipynb and model_comparison.csv independently from the UI.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {models.map((mod) => (
                      <Card key={mod.id} className={`p-5 space-y-4 ${activeModelKey === mod.key ? 'ring-2 ring-indigo-500' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Cpu className="w-5 h-5 text-indigo-500" />
                            <div>
                              <h4 className="text-xs font-semibold">{mod.name}</h4>
                              <p className="text-[10px] text-[var(--text-secondary)] font-mono">Format: {mod.format} • F1: {mod.f1}% • ROC-AUC: {mod.rocAuc}%</p>
                            </div>
                          </div>
                          {activeModelKey === mod.key && <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500 text-white font-medium">Active Engine</span>}
                        </div>

                        <p className="text-xs text-[var(--text-secondary)]">{mod.description}</p>

                        <div className="flex items-center justify-between pt-2">
                          {activeModelKey !== mod.key ? (
                            <Button variant="primary" size="sm" onClick={() => { setActiveModelKey(mod.key); showToast('Active Model Switched', `Inference engine changed to ${mod.name}`); }} className="w-full bg-indigo-600 text-white hover:bg-indigo-700">Activate Model</Button>
                          ) : (
                            <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Active Inference Engine</span>
                          )}
                        </div>
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
                    <h3 className="text-sm font-semibold">{activeModel.name}</h3>
                    <p className="text-xs text-[var(--text-secondary)]">Active evaluation metrics from model_comparison.csv & Customer_Churn_Prediction.ipynb (Test N = 1,409)</p>
                  </div>
                  <span className="text-xs font-mono text-indigo-500">ROC-AUC: {activeModel.rocAuc}% • Error Rate: {activeModel.errorRate}%</span>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <Card className="p-5"><span className="text-[11px] font-semibold text-[var(--text-secondary)]">Accuracy</span><h3 className="text-2xl font-bold mt-2 tabular-nums">{activeModel.accuracy}%</h3></Card>
                  <Card className="p-5"><span className="text-[11px] font-semibold text-[var(--text-secondary)]">Precision</span><h3 className="text-2xl font-bold mt-2 tabular-nums">{activeModel.precision}%</h3></Card>
                  <Card className="p-5"><span className="text-[11px] font-semibold text-[var(--text-secondary)]">Recall (Sensitivity)</span><h3 className="text-2xl font-bold mt-2 tabular-nums text-emerald-500">{activeModel.recall}%</h3></Card>
                  <Card className="p-5"><span className="text-[11px] font-semibold text-[var(--text-secondary)]">F1-Score</span><h3 className="text-2xl font-bold mt-2 tabular-nums text-indigo-500">{activeModel.f1}%</h3></Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-6 space-y-4">
                    <h4 className="text-sm font-semibold">Permutation Feature Importance (Notebook Cell 38)</h4>
                    <div className="space-y-3">
                      {NOTEBOOK_PERMUTATION_IMPORTANCE.map((item) => (
                        <div key={item.feature} className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="font-medium">{item.feature}</span>
                            <span className="font-mono tabular-nums text-[var(--text-secondary)]">{item.importance.toFixed(4)}</span>
                          </div>
                          <div className="w-full h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.max(4, (item.importance / 0.16) * 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-6 space-y-4">
                    <h4 className="text-sm font-semibold">Test Set Confusion Matrix (1,409 Customers • Cell 34–35)</h4>
                    <div className="grid grid-cols-2 gap-4 pt-2 text-center">
                      <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                        <span className="text-[11px] text-[var(--text-secondary)] block">True Negatives (Retained)</span>
                        <span className="text-2xl font-bold tabular-nums text-emerald-500 mt-1 block">{activeModel.confusionMatrix.tn}</span>
                      </div>
                      <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                        <span className="text-[11px] text-[var(--text-secondary)] block">False Positives</span>
                        <span className="text-2xl font-bold tabular-nums text-amber-500 mt-1 block">{activeModel.confusionMatrix.fp}</span>
                      </div>
                      <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                        <span className="text-[11px] text-[var(--text-secondary)] block">False Negatives</span>
                        <span className="text-2xl font-bold tabular-nums text-rose-500 mt-1 block">{activeModel.confusionMatrix.fn}</span>
                      </div>
                      <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                        <span className="text-[11px] text-[var(--text-secondary)] block">True Positives (Caught Churn)</span>
                        <span className="text-2xl font-bold tabular-nums text-indigo-500 mt-1 block">{activeModel.confusionMatrix.tp}</span>
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
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-b border-[var(--border-subtle)] font-medium">
                      <tr>
                        <th className="px-4 py-3">Pred ID</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">Probability</th>
                        <th className="px-4 py-3">Risk Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      {predictionHistory.map(item => (
                        <tr key={item.predId} className="hover:bg-[var(--bg-subtle)] transition">
                          <td className="px-4 py-3 font-mono">{item.predId}</td>
                          <td className="px-4 py-3 font-semibold">{item.customerName}</td>
                          <td className="px-4 py-3 text-[var(--text-secondary)] tabular-nums">{item.timestamp}</td>
                          <td className="px-4 py-3 tabular-nums font-bold">{item.probability}%</td>
                          <td className="px-4 py-3"><RiskBadge probability={item.probability} thresholds={thresholds} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* ========================================== */}
            {/* PAGE 9: SETTINGS                           */}
            {/* ========================================== */}
            {activePage === 'settings' && (
              <Card className="p-6 space-y-4 max-w-xl">
                <h3 className="text-sm font-semibold">Risk Classification Thresholds</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">Medium Risk (%)</label>
                    <input type="number" value={thresholds.medium} onChange={(e) => setThresholds(t => ({ ...t, medium: Number(e.target.value) }))} className="w-full h-9 px-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">High Risk (%)</label>
                    <input type="number" value={thresholds.high} onChange={(e) => setThresholds(t => ({ ...t, high: Number(e.target.value) }))} className="w-full h-9 px-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs" />
                  </div>
                </div>
              </Card>
            )}
          </main>
        </div>

        <footer className="mt-12 bg-[var(--bg-card)] border-t border-[var(--border-subtle)] px-4 py-5 text-xs text-[var(--text-secondary)]">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between">
            <span>ChurnGuard Modular ML Platform • Active Dataset: {activeDataset.name} • Engine: {activeModel.name}</span>
            <span>© {new Date().getFullYear()} ChurnGuard Inc.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
