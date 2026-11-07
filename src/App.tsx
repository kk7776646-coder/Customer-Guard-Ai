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
  X,
  Lock,
  Menu,
  Database,
  GitBranch,
  ShieldCheck,
  Camera,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Sun,
  Moon,
  Laptop,
  FileSpreadsheet,
  FileCheck,
  AlertTriangle,
  Sparkles,
  DollarSign,
  LogOut,
  Loader2
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { BackNavigation, BackNavItem } from './components/BackNavigation';
import { RevenueProfitabilitySection } from './components/RevenueProfitabilitySection';
import { GlobalHeaderSearch } from './components/GlobalHeaderSearch';
import { AuthPage } from './components/auth/AuthPage';
import { useAuth } from './context/AuthContext';
import {
  BRAND_NAME,
  BRAND_TAGLINE,
  ClarioLogo,
  Card,
  Button,
  RiskBadge,
  ChurnStatusBadge,
  UserAvatar
} from './components/ui';
import {
  PKL_PIPELINE_WEIGHTS,
  NOTEBOOK_PERMUTATION_IMPORTANCE,
  MODEL_COMPARISON_BENCHMARKS,
  INITIAL_CUSTOMERS,
  INITIAL_PREDICTION_HISTORY,
  MONTHLY_CHURN_TREND,
  CHURN_BY_CONTRACT,
  CHURN_BY_PAYMENT,
  computeChurnPrediction
} from './data/churnModelData';
import {
  buildCustomerRiskTimeline,
  buildIndividualCustomerAnalysis,
  parseCustomerCsv
} from './utils/customerAnalytics';
import { requestBackendPrediction } from './config/api';

// ==========================================
// MAIN APPLICATION COMPONENT
// ==========================================
export default function App() {
  const { user, profile, loading: authLoading, signOut, updateProfile } = useAuth();

  const [activePage, setActivePage] = useState(() => {
    const hash = window.location.hash.replace('#', '').trim();
    const validPages = ['dashboard', 'prediction', 'customers', 'analytics', 'revenue', 'datasets', 'models', 'model', 'history', 'settings', 'profile', 'auth'];
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

  // Sync authenticated user and Supabase profile
  useEffect(() => {
    if (user) {
      setProfileForm((prev: any) => ({
        ...prev,
        name: profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || prev.name,
        email: user.email || prev.email,
        avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || prev.avatarUrl,
        phone: profile?.phone || prev.phone,
        role: profile?.role || prev.role,
        bio: profile?.bio || prev.bio,
        createdAt: user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : prev.createdAt,
      }));
    }
  }, [user, profile]);

  // Profile Editor Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPhotoEditorModal, setShowPhotoEditorModal] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
  const [photoZoom, setPhotoZoom] = useState(1);
  const [photoRotation, setPhotoRotation] = useState(0);
  const [photoPan, setPhotoPan] = useState({ x: 0, y: 0 });

  const [editProfileForm, setEditProfileForm] = useState(profileForm);
  const profilePhotoInputRef = React.useRef<HTMLInputElement>(null);
  const mainScrollRef = React.useRef<HTMLDivElement>(null);
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
      scrollY: mainScrollRef.current?.scrollTop || 0,
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
      requestAnimationFrame(() => {
        mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      });
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
        mainScrollRef.current?.scrollTo({ top: previous.scrollY || 0, behavior: 'smooth' });
      });
    } else {
      // Fallback to root dashboard if history stack is empty (e.g. direct deep link)
      setActivePage('dashboard');
      window.history.replaceState({ page: 'dashboard', scrollY: 0 }, '', '#dashboard');
      requestAnimationFrame(() => {
        mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      });
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
      const validPages = ['dashboard', 'prediction', 'customers', 'analytics', 'revenue', 'datasets', 'models', 'model', 'history', 'settings', 'profile', 'auth'];
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileForm({ ...editProfileForm });
    setShowProfileModal(false);
    if (user) {
      await updateProfile({
        full_name: editProfileForm.name,
        phone: editProfileForm.phone,
        role: editProfileForm.role,
        bio: editProfileForm.bio,
      });
    }
    showToast('Profile Saved', 'Your updated profile information is now active in your workspace.');
  };

  const handleSignOut = async () => {
    await signOut();
    showToast('Signed Out', 'You have been securely signed out of your Clario workspace.');
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
  const customerRiskTimeline = useMemo(
    () => buildCustomerRiskTimeline(selectedAnalyticsCustomer, appliedRetentionActions, thresholds, activeModelKey),
    [selectedAnalyticsCustomer, appliedRetentionActions, thresholds, activeModelKey]
  );

  // Comprehensive Individual Customer Analysis derived strictly from the customer's actual record and ML model weights
  const selectedCustomerAnalysis = useMemo(
    () => buildIndividualCustomerAnalysis(selectedAnalyticsCustomer, allDatasetCustomers, thresholds, activeModelKey),
    [selectedAnalyticsCustomer, allDatasetCustomers, thresholds, activeModelKey]
  );

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
      const existingSameName = datasets.find((d) => d.name.toLowerCase() === file.name.toLowerCase());
      const newDs = parseCustomerCsv(text, file.name, file.size, thresholds, activeModelKey, existingSameName?.id);

      setDatasets(prev => {
        const withoutExisting = prev.filter(d => d.id !== newDs.id).map(d => ({ ...d, active: false }));
        return [newDs, ...withoutExisting];
      });
      setActiveDatasetId(newDs.id);
      if (newDs.records[0]?.id) {
        setSelectedAnalyticsCustomerId(newDs.records[0].id);
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

  const handleRunPrediction = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    const localRes = computeChurnPrediction(predictorInput, thresholds, activeModelKey);
    const remoteRes = await requestBackendPrediction({
      ...predictorInput,
      modelKey: activeModelKey
    });
    const finalProb = typeof remoteRes?.probability === 'number' ? remoteRes.probability : localRes.probability;
    const rec = {
      predId: `CHK-${Math.floor(9940 + Math.random() * 50)}`,
      customerId: predictorInput.customerId,
      customerName: predictorInput.customerName,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      tenure: Number(predictorInput.tenure),
      contract: predictorInput.contract,
      monthlyCharges: Number(predictorInput.monthlyCharges),
      probability: finalProb,
      actionStatus: finalProb >= thresholds.high ? 'Offer Discount / Call Customer' : finalProb >= thresholds.medium ? 'Send Friendly Check-In' : 'Happy — No Action Needed',
      internet: predictorInput.internet,
      payment: predictorInput.payment,
      tickets: Number(predictorInput.tickets),
      usageDrop: Number(predictorInput.usageDrop)
    };
    setPredictionHistory(prev => [rec, ...prev]);
    showToast(`Prediction Saved: ${finalProb}% Risk`, `Added ${predictorInput.customerName} to Saved Predictions.`);
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
        { id: 'revenue', label: 'Revenue & Profitability', icon: DollarSign, count: null },
      ]
    },
    {
      groupLabel: 'Data & Models',
      items: [
        { id: 'datasets', label: 'Customer Data', icon: Database, count: datasets.length },
        { id: 'models', label: 'Prediction Models', icon: GitBranch, count: models.length },
        { id: 'model', label: 'Model Performance', icon: Activity, count: `${activeModel.rocAuc}%` },
      ]
    },
    {
      groupLabel: 'Workspace',
      items: [
        { id: 'settings', label: 'Risk Thresholds', icon: Settings, count: null },
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
    revenue: {
      title: 'Revenue & Profitability',
      subtitle: 'Customer revenue performance, MRR, profitability evaluation, historical churn loss, and predicted revenue at risk.'
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

  // -------------------------------------------------------------
  // SUPABASE AUTHENTICATION GUARD & PROTECTED ROUTING
  // -------------------------------------------------------------
  if (authLoading) {
    return (
      <div
        className={`h-screen w-full flex flex-col items-center justify-center bg-[var(--bg-app)] text-[var(--text-primary)] ${
          theme === 'dark' ? 'dark' : ''
        }`}
      >
        <div className="flex flex-col items-center gap-4 animate-in fade-in">
          <ClarioLogo size={48} className="animate-pulse" />
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-medium">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            <span>Connecting to Clario Enterprise Workspace...</span>
          </div>
        </div>
      </div>
    );
  }

  // If unauthenticated, present the full-fidelity reference AuthPage (Sign In, Sign Up, Forgot Password)
  if (!user) {
    return (
      <AuthPage
        theme={theme}
        onToggleTheme={toggleTheme}
        onSuccessNavigate={() => navigateToPage('dashboard')}
      />
    );
  }

  if (activePage === 'auth') {
    navigateToPage('dashboard');
  }

  return (
    <div
      className={`h-screen w-full overflow-hidden flex font-sans antialiased selection:bg-[#6366F1]/30 selection:text-white transition-colors duration-200 bg-[var(--bg-app)] text-[var(--text-primary)] ${theme === 'dark' ? 'dark' : ''}`}
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

      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-2xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Fixed Sidebar Navigation */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-60 h-full shrink-0 bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)] flex flex-col overflow-hidden transition-transform duration-200 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-16 px-5 border-b border-[var(--border-subtle)] flex items-center justify-between shrink-0">
          <button onClick={() => navigateToPage('dashboard')} className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer">
            <ClarioLogo size={28} />
            <div>
              <span className="font-display font-bold text-[15px] tracking-tight block leading-none text-[var(--text-primary)]">{BRAND_NAME}</span>
              <span className="text-[11px] text-[var(--text-secondary)] block mt-1 leading-tight">Customer Intelligence</span>
            </div>
          </button>
          <button onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation menu" title="Close menu" className="lg:hidden text-[var(--text-secondary)] cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        <nav className="flex-1 min-h-0 p-3 space-y-4 overflow-y-auto overflow-x-hidden" aria-label="Sidebar Navigation">
          {navGroups.map(group => (
            <div key={group.groupLabel} className="space-y-0.5">
              <p className="px-2.5 pb-1 text-xs font-medium text-[var(--text-muted)]">{group.groupLabel}</p>
              {group.items.map(item => {
                const IconComponent = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateToPage(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] transition-colors cursor-pointer font-medium ${
                      isActive ? 'bg-[var(--bg-elevated)] text-indigo-500 font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComponent className={`w-4 h-4 ${isActive ? 'text-indigo-500' : 'text-[var(--text-secondary)]'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.count !== null && (
                      <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium tabular-nums ${isActive ? 'bg-indigo-500/20 text-indigo-400' : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'}`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-3.5 border-t border-[var(--border-subtle)] space-y-2 shrink-0">
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

      {/* Main Application Area (Fixed Header + Independent Scrollable Content) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden">
        {/* Fixed Top Header with Global Search on Left */}
        <header className="h-16 shrink-0 px-4 sm:px-6 lg:px-8 bg-[var(--bg-header)] border-b border-[var(--border-subtle)] flex items-center justify-between z-20 gap-3">
          {/* Left Header Area: Navigation Toggle, Mobile Logo, and Global Customer Search */}
          <div className="flex items-center gap-3 justify-start min-w-0 flex-1">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] border border-transparent hover:border-[var(--border-subtle)] cursor-pointer shrink-0 transition"
              aria-label="Open menu"
              title="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 lg:hidden shrink-0">
              <ClarioLogo size={24} />
              <span className="font-semibold text-sm tracking-tight text-[var(--text-primary)]">{BRAND_NAME}</span>
            </div>

            {/* Global Search Bar (Positioned on the left side of the header, after sidebar boundary) */}
            <GlobalHeaderSearch
              customers={allDatasetCustomers}
              onSelectCustomer={(customerId) => {
                handleAnalyseCustomer(customerId);
                const cust = allDatasetCustomers.find((c: any) => c.id === customerId);
                showToast(
                  'Customer Analysis',
                  cust ? `Opened ${cust.name} (${cust.id}) in Trends & Insights` : `Opened customer ${customerId}`
                );
              }}
              thresholds={thresholds}
              className="ml-0 sm:ml-1"
            />
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

            <div className="relative flex items-center gap-2 pl-2 border-l border-[var(--border-subtle)]">
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
              <button
                type="button"
                onClick={handleSignOut}
                aria-label="Sign Out"
                title="Sign Out of Workspace"
                className="h-8 w-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-rose-400 hover:border-rose-500/30 flex items-center justify-center transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Independent Main Content Scroll Container */}
        <div
          ref={mainScrollRef}
          className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden"
        >
          <main className="p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto space-y-6">
            <BackNavigation
              activePage={activePage}
              previousPage={navStack.length > 0 ? navStack[navStack.length - 1].page : 'dashboard'}
              onBack={handleBackNavigation}
            />

            {/* Premium Purple Curved Header Banner for All Sidebar Sections */}
            <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-r from-[#6D28D9] via-[#7C3AED] to-[#4F46E5] p-5 sm:p-6 lg:p-7 text-white shadow-[0_10px_30px_-8px_rgba(124,58,237,0.35)] border border-[#A78BFA]/30 mb-6 transition-all duration-200">
              {/* Subtle Ambient Decorative Glows */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-[#2E1065]/40 rounded-full blur-xl pointer-events-none" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/15 text-purple-100 text-[11px] font-semibold tracking-wide uppercase mb-2 border border-white/20 backdrop-blur-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{activePage === 'dashboard' ? 'Overview' : activePage.replace('-', ' ')}</span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white font-display">
                  {pageHeaders[activePage]?.title}
                </h1>
                <p className="text-xs sm:text-sm text-purple-100/90 mt-1.5 font-normal max-w-3xl leading-relaxed">
                  {pageHeaders[activePage]?.subtitle}
                </p>
              </div>
            </div>

            {/* ========================================== */}
            {/* PAGE: DASHBOARD                            */}
            {/* ========================================== */}
            {activePage === 'dashboard' && (
              !activeDataset || allDatasetCustomers.length === 0 ? (
                <Card variant="secondary" className="p-10 text-center space-y-3">
                  <p className="type-card-title text-[var(--text-primary)]">No Customer Data Loaded</p>
                  <p className="type-subheading text-[var(--text-secondary)]">
                    Please upload customer data in the Customer Data section to use this feature.
                  </p>
                  <Button variant="primary" size="sm" onClick={() => navigateToPage('datasets')}>
                    Open Customer Data
                  </Button>
                </Card>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total Customers */}
                    <Card variant="indigo" className="p-5 sm:p-6 shadow-sm border border-[#DDD6FE] dark:border-[#4C1D95]/40 transition-all hover:shadow-md">
                      <span className="type-label text-[#4C1D95] dark:text-purple-300 font-semibold text-xs block">Total Customers</span>
                      <h3 className="type-metric mt-2 text-[#0F172A] dark:text-white font-bold">{activeDataset.rows.toLocaleString()}</h3>
                      <p className="type-subheading mt-1 text-[#334155] dark:text-slate-300 truncate font-medium">{activeDataset.name}</p>
                    </Card>

                    {/* Card 2: High-Risk Accounts */}
                    <Card variant="rose" className="p-5 sm:p-6 shadow-sm border border-[#FECDD3] dark:border-[#881337]/40 transition-all hover:shadow-md">
                      <span className="type-label text-[#9F1239] dark:text-rose-300 font-semibold text-xs block">High-Risk Accounts</span>
                      <h3 className="type-metric mt-2 text-[#0F172A] dark:text-white font-bold">
                        {allDatasetCustomers.filter((c: any) => (c.probability || 0) >= thresholds.high).length}
                        <span className="text-xs font-normal text-[#475569] dark:text-slate-300"> / {allDatasetCustomers.length}</span>
                      </h3>
                      <p className="type-subheading mt-1 text-[#9F1239] dark:text-rose-300 font-medium">Risk score ≥ {thresholds.high}%</p>
                    </Card>

                    {/* Card 3: Projected Churn Rate */}
                    <Card variant="cyan" className="p-5 sm:p-6 shadow-sm border border-[#A5F3FC] dark:border-[#164E63]/40 transition-all hover:shadow-md">
                      <span className="type-label text-[#0E7490] dark:text-cyan-300 font-semibold text-xs block">Projected Churn Rate</span>
                      <h3 className="type-metric mt-2 text-[#0F172A] dark:text-white font-bold">
                        {activeDataset.id === 'ds-default'
                          ? '26.54%'
                          : `${Math.round((allDatasetCustomers.filter((c: any) => c.churnStatus === 'Churned' || c.churnStatus === 'At-Risk').length / (allDatasetCustomers.length || 1)) * 100)}%`}
                      </h3>
                      <p className="type-subheading mt-1 text-[#0E7490] dark:text-cyan-300 font-medium">Across active dataset</p>
                    </Card>

                    {/* Card 4: Model ROC-AUC */}
                    <Card variant="emerald" className="p-5 sm:p-6 shadow-sm border border-[#BBF7D0] dark:border-[#14532D]/40 transition-all hover:shadow-md">
                      <span className="type-label text-[#15803D] dark:text-emerald-300 font-semibold text-xs block">Model ROC-AUC</span>
                      <h3 className="type-metric mt-2 text-[#0F172A] dark:text-white font-bold">{activeModel.rocAuc}%</h3>
                      <p className="type-subheading mt-1 text-[#15803D] dark:text-emerald-300 font-medium">Recall: {activeModel.recall}% on test set</p>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card variant="primary" className="lg:col-span-2 p-6">
                      <h3 className="type-card-title mb-1 text-[var(--text-primary)]">Monthly Churn Trajectory</h3>
                      <p className="type-subheading mb-4 text-[var(--text-secondary)]">Observed churn rate compared with model predictions over 12 months</p>
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={MONTHLY_CHURN_TREND}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} unit="%" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'var(--bg-elevated)',
                                borderRadius: '10px',
                                border: '1px solid var(--border-secondary)',
                                color: 'var(--text-primary)',
                                fontSize: '12px',
                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)'
                              }}
                              itemStyle={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 500 }}
                              labelStyle={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600 }}
                            />
                            <Area type="monotone" dataKey="actualChurn" stroke="#6366F1" fillOpacity={0.2} fill="#6366F1" strokeWidth={2} name="Observed Churn (%)" />
                            <Area type="monotone" dataKey="predictedChurn" stroke="#22D3EE" fillOpacity={0.12} fill="#22D3EE" strokeWidth={2} name="Predicted Churn (%)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    <Card variant="primary" className="p-6">
                      <h3 className="type-card-title mb-1 text-[var(--text-primary)]">Risk Distribution</h3>
                      <p className="type-subheading mb-4">Accounts segmented by low, medium, and high risk</p>
                      <div className="h-52 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={riskDistributionData} dataKey="value" innerRadius={60} outerRadius={80} paddingAngle={4}>
                              {riskDistributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'var(--bg-elevated)',
                                borderRadius: '10px',
                                border: '1px solid var(--border-secondary)',
                                color: 'var(--text-primary)',
                                fontSize: '12px',
                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)'
                              }}
                              itemStyle={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 500 }}
                              labelStyle={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600 }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2 mt-2 text-xs">
                        {riskDistributionData.map(item => (
                          <div key={item.name} className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-[var(--text-secondary)]"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span>
                            <span className="font-medium tabular-nums text-[var(--text-primary)]">{item.value} ({item.pct}%)</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  {/* Priority At-Risk Customers from Shared Customer Data */}
                  <Card variant="secondary" className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                      <div>
                        <h3 className="type-card-title text-[var(--text-primary)]">Priority At-Risk Accounts</h3>
                        <p className="type-subheading">Highest cancellation probability accounts in {activeDataset.name}</p>
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => { setChurnStatusFilter('At-Risk'); navigateToPage('customers'); }}>
                        View At-Risk Accounts
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[var(--bg-card)] text-[var(--text-secondary)] border-b border-[var(--border-subtle)] font-medium">
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
                              <tr key={c.id} className="hover:bg-[var(--bg-card-secondary)]/60 transition">
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

                <Card variant="primary" className="p-8">
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
                          <h3 className="text-xl font-bold text-[var(--text-primary)]">{profileForm.name}</h3>
                          <p className="text-xs text-[var(--text-secondary)]">{profileForm.role} • <span className="font-mono">{profileForm.email}</span></p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                          <Button variant="primary" size="sm" onClick={() => { setEditProfileForm(profileForm); setShowProfileModal(true); }}>
                            Edit Profile
                          </Button>
                          {profileForm.avatarUrl && (
                            <Button variant="secondary" size="sm" onClick={handleRemovePhoto} className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10">
                              Remove Photo
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleSignOut}
                            className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10 flex items-center gap-1.5"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Sign Out</span>
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] pt-2">{profileForm.bio}</p>
                    </div>
                  </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card variant="secondary" className="p-6 space-y-4">
                    <h4 className="text-sm font-semibold border-b border-[var(--border-subtle)] pb-3 text-[var(--text-primary)]">Account Information</h4>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center"><span className="text-[var(--text-secondary)]">User UUID:</span><span className="font-mono text-[11px] font-medium text-[var(--text-primary)] truncate max-w-[200px]" title={user?.id}>{user?.id || 'Local'}</span></div>
                      <div className="flex justify-between items-center"><span className="text-[var(--text-secondary)]">Work Email:</span><span className="font-medium text-[var(--text-primary)]">{user?.email || profileForm.email}</span></div>
                      <div className="flex justify-between items-center"><span className="text-[var(--text-secondary)]">Phone Number:</span><span className="font-medium text-[var(--text-primary)]">{profileForm.phone || 'Not set'}</span></div>
                      <div className="flex justify-between items-center"><span className="text-[var(--text-secondary)]">Member Since:</span><span className="font-medium text-[var(--text-primary)]">{profileForm.createdAt}</span></div>
                      <div className="flex justify-between items-center"><span className="text-[var(--text-secondary)]">Workspace Tier:</span><span className="font-semibold text-indigo-400">Clario Enterprise</span></div>
                    </div>
                  </Card>

                  <Card variant="secondary" className="p-6 space-y-4">
                    <h4 className="text-sm font-semibold border-b border-[var(--border-subtle)] pb-3 text-[var(--text-primary)]">Account Security & Sign-In Status</h4>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center"><span className="text-[var(--text-secondary)]">Auth Provider:</span><span className="font-medium text-[var(--text-primary)]">Supabase PostgreSQL Auth</span></div>
                      <div className="flex justify-between items-center"><span className="text-[var(--text-secondary)]">Row-Level Security:</span><span className="text-indigo-400 font-medium">Tenant Isolated (Active)</span></div>
                      <div className="flex justify-between items-center"><span className="text-[var(--text-secondary)]">Email Status:</span><span className="text-emerald-400 font-medium">{user?.email_confirmed_at ? 'Verified' : 'Active Session'}</span></div>
                      <div className="flex justify-between items-center"><span className="text-[var(--text-secondary)]">Connection Security:</span><span className="text-emerald-400 font-medium">Encrypted & Private</span></div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Profile Edit Modal */}
            {showProfileModal && (
              <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl text-[var(--text-primary)]">
                  <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">Edit User Profile</h3>
                    <button type="button" onClick={() => setShowProfileModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"><X className="w-5 h-5" /></button>
                  </div>
                  <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-medium mb-1 text-[var(--text-secondary)]">Full Name</label>
                      <input type="text" value={editProfileForm.name} onChange={(e) => setEditProfileForm((p: any) => ({ ...p, name: e.target.value }))} required className="w-full h-9 px-3 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-medium mb-1 text-[var(--text-secondary)]">Email Address</label>
                        <input type="email" value={editProfileForm.email} onChange={(e) => setEditProfileForm((p: any) => ({ ...p, email: e.target.value }))} required className="w-full h-9 px-3 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="block font-medium mb-1 text-[var(--text-secondary)]">Phone Number</label>
                        <input type="text" value={editProfileForm.phone} onChange={(e) => setEditProfileForm((p: any) => ({ ...p, phone: e.target.value }))} className="w-full h-9 px-3 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg focus:outline-none focus:border-indigo-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block font-medium mb-1 text-[var(--text-secondary)]">Job Role / Title</label>
                      <input type="text" value={editProfileForm.role} onChange={(e) => setEditProfileForm((p: any) => ({ ...p, role: e.target.value }))} className="w-full h-9 px-3 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block font-medium mb-1 text-[var(--text-secondary)]">Bio / Short Description</label>
                      <textarea value={editProfileForm.bio} onChange={(e) => setEditProfileForm((p: any) => ({ ...p, bio: e.target.value }))} rows={3} className="w-full p-3 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg resize-none focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
                      <Button type="button" variant="secondary" size="sm" onClick={() => setShowProfileModal(false)}>Cancel</Button>
                      <Button type="submit" variant="primary" size="sm">Save Changes</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Profile Photo Cropper Modal */}
            {showPhotoEditorModal && (
              <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl text-xs text-[var(--text-primary)]">
                  <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Crop & Adjust Profile Photo</h3>
                    <button type="button" onClick={() => setShowPhotoEditorModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"><X className="w-4 h-4" /></button>
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
                          <button type="button" onClick={() => setPhotoZoom(z => Math.max(0.5, z - 0.25))} className="p-1.5 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] cursor-pointer"><ZoomOut className="w-3.5 h-3.5" /></button>
                          <button type="button" onClick={() => setPhotoZoom(z => Math.min(3.0, z + 0.25))} className="p-1.5 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] cursor-pointer"><ZoomIn className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-secondary)]">Rotate</span>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setPhotoRotation(r => r - 90)} className="p-1.5 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] cursor-pointer"><RotateCcw className="w-3.5 h-3.5" /></button>
                          <button type="button" onClick={() => setPhotoRotation(r => r + 90)} className="p-1.5 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] cursor-pointer"><RotateCw className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
                    <Button type="button" variant="secondary" size="sm" onClick={() => setShowPhotoEditorModal(false)}>Cancel</Button>
                    <Button type="submit" variant="primary" size="sm" onClick={handleApplyCroppedPhoto}>Save Photo</Button>
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
                  <Card variant="primary" className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Enter Customer Details</h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">Change any option below to see how it affects the customer's chance of canceling on the right.</p>
                      </div>
                    </div>
                    <form onSubmit={handleRunPrediction} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">Customer Name or Account Label</label>
                          <input
                            type="text"
                            value={predictorInput.customerName}
                            onChange={(e) => setPredictorInput(p => ({ ...p, customerName: e.target.value }))}
                            placeholder="e.g., Jane Doe or Acme Corp"
                            className="w-full h-9 px-3 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">Time with Company: <strong className="text-[var(--text-primary)]">{predictorInput.tenure} Months</strong></label>
                          <input type="range" min="0" max="72" value={predictorInput.tenure} onChange={(e) => {
                            const t = Number(e.target.value);
                            setPredictorInput(p => ({ ...p, tenure: t, totalCharges: Number((t * p.monthlyCharges).toFixed(2)) }));
                          }} className="w-full accent-indigo-500 mt-2 cursor-pointer" title="Slide left for a brand-new customer or right for a long-time customer (0 to 72 months)" />
                          <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">Longer-staying customers are much less likely to cancel.</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">Contract Length</label>
                          <select value={predictorInput.contract} onChange={(e) => setPredictorInput(p => ({ ...p, contract: e.target.value }))} className="w-full h-9 px-2.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs focus:outline-none focus:border-indigo-500">
                            <option value="Month-to-month">Month-to-month (Higher risk)</option>
                            <option value="One year">1-Year Contract (Lower risk)</option>
                            <option value="Two year">2-Year Contract (Most loyal)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">Internet Plan</label>
                          <select value={predictorInput.internet} onChange={(e) => setPredictorInput(p => ({ ...p, internet: e.target.value }))} className="w-full h-9 px-2.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs focus:outline-none focus:border-indigo-500">
                            <option value="Fiber optic">Fiber Optic (Fastest, pricier)</option>
                            <option value="DSL">Standard DSL Internet</option>
                            <option value="No">Phone Only (No Internet)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">How They Pay Their Bill</label>
                          <select value={predictorInput.payment} onChange={(e) => setPredictorInput(p => ({ ...p, payment: e.target.value }))} className="w-full h-9 px-2.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs focus:outline-none focus:border-indigo-500">
                            <option value="Electronic check">Electronic Check (Manual)</option>
                            <option value="Mailed check">Paper Check by Mail</option>
                            <option value="Bank transfer (automatic)">Auto-Pay: Bank Transfer</option>
                            <option value="Credit card (automatic)">Auto-Pay: Credit Card</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">Monthly Bill ($)</label>
                          <input type="number" step="0.05" placeholder="e.g., 75.00" value={predictorInput.monthlyCharges} onChange={(e) => {
                            const m = Number(e.target.value);
                            setPredictorInput(p => ({ ...p, monthlyCharges: m, totalCharges: Number((p.tenure * m).toFixed(2)) }));
                          }} className="w-full h-9 px-3 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">Total Paid So Far ($)</label>
                          <input type="number" step="0.05" placeholder="e.g., 570.00" value={predictorInput.totalCharges} onChange={(e) => setPredictorInput(p => ({ ...p, totalCharges: Number(e.target.value) }))} className="w-full h-9 px-3 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">Online Security Included?</label>
                          <select value={predictorInput.onlineSecurity} onChange={(e) => setPredictorInput(p => ({ ...p, onlineSecurity: e.target.value }))} className="w-full h-9 px-2.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs focus:outline-none focus:border-indigo-500">
                            <option value="No">No — Not included</option>
                            <option value="Yes">Yes — Included on plan</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">Tech Support Included?</label>
                          <select value={predictorInput.techSupport} onChange={(e) => setPredictorInput(p => ({ ...p, techSupport: e.target.value }))} className="w-full h-9 px-2.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs focus:outline-none focus:border-indigo-500">
                            <option value="No">No — Not included</option>
                            <option value="Yes">Yes — Included on plan</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">Paperless (Email) Billing?</label>
                          <select value={predictorInput.paperlessBilling} onChange={(e) => setPredictorInput(p => ({ ...p, paperlessBilling: e.target.value }))} className="w-full h-9 px-2.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs focus:outline-none focus:border-indigo-500">
                            <option value="Yes">Yes — Email bills</option>
                            <option value="No">No — Paper bills in mail</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">Family / Dependents on Plan?</label>
                          <select value={predictorInput.dependents} onChange={(e) => setPredictorInput(p => ({ ...p, dependents: e.target.value }))} className="w-full h-9 px-2.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs focus:outline-none focus:border-indigo-500">
                            <option value="No">No (Single user)</option>
                            <option value="Yes">Yes (Family / household)</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between gap-3">
                        <span className="text-[11px] text-[var(--text-secondary)]">Adjust contract length or support options to compare predicted risk.</span>
                        <Button type="submit" variant="primary" size="md">
                          Save Prediction
                        </Button>
                      </div>
                    </form>
                  </Card>
                </div>

                <div className="lg:col-span-5 space-y-4">
                  <Card variant="elevated" className="p-6 text-center space-y-4">
                    <span className="type-label text-[var(--text-secondary)]">Predicted Cancellation Risk</span>
                    <div>
                      <h3 className="text-3xl font-semibold tabular-nums tracking-tight text-[var(--text-primary)]">{livePrediction.probability}%</h3>
                      <div className="mt-2 inline-flex justify-center">
                        <RiskBadge probability={livePrediction.probability} thresholds={thresholds} size="lg" />
                      </div>
                    </div>
                    <p className="type-body px-2 text-[var(--text-secondary)]">
                      {livePrediction.probability >= thresholds.high
                        ? 'High churn probability. Consider a contract renewal incentive or support bundle.'
                        : livePrediction.probability >= thresholds.medium
                        ? 'Moderate churn exposure. Enrolling the account in automatic billing can improve retention.'
                        : 'Low churn probability. Current contract and service profile indicate stable retention.'}
                    </p>
                    <div className="pt-3 border-t border-[var(--border-subtle)] grid grid-cols-3 gap-2 text-left text-[11px]">
                      <div className="p-2.5 rounded-lg bg-[var(--bg-card-secondary)] border border-[var(--border-subtle)]" title={`Logit score: ${livePrediction.logit}`}>
                        <span className="text-[var(--text-secondary)] block">Direction</span>
                        <span className="font-medium text-[var(--text-primary)]">{livePrediction.logit > 0 ? 'Elevated Risk' : 'Stable'}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[var(--bg-card-secondary)] border border-[var(--border-subtle)]" title="Dataset average tenure is 32 months">
                        <span className="text-[var(--text-secondary)] block">Tenure</span>
                        <span className="font-medium text-[var(--text-primary)]">{predictorInput.tenure >= 32 ? 'Above Average' : 'Below Average'}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[var(--bg-card-secondary)] border border-[var(--border-subtle)]" title="Dataset average monthly charge is $65">
                        <span className="text-[var(--text-secondary)] block">Monthly Charge</span>
                        <span className="font-medium text-[var(--text-primary)]">{predictorInput.monthlyCharges >= 65 ? 'Above Avg ($65)' : 'Below Avg ($65)'}</span>
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
                <Card variant="secondary" className="p-10 text-center space-y-3">
                  <p className="type-card-title text-[var(--text-primary)]">No Customer Data Loaded</p>
                  <p className="type-subheading">
                    Please upload customer data in the Customer Data section to use this feature.
                  </p>
                  <Button variant="primary" size="sm" onClick={() => navigateToPage('datasets')}>
                    Open Customer Data
                  </Button>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Search, Filter & Sort Controls at Top of Customer List */}
                  <Card variant="secondary" className="p-4 space-y-4">
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
                          className="w-full h-10 pl-10 pr-10 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl text-xs sm:text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition shadow-2xs"
                        />
                        {globalSearch && (
                          <button
                            type="button"
                            onClick={() => setGlobalSearch('')}
                            aria-label="Clear search input"
                            title="Clear search"
                            className="absolute right-2.5 top-2 inline-flex items-center justify-center h-6 w-6 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
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
                            className="h-9 px-3 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer"
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
                            className="h-9 px-3 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer"
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
                            variant="secondary"
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
                        Select <strong className="text-[var(--text-primary)]">Analyse</strong> on any row to view individual account insights.
                      </span>
                    </div>
                  </Card>

                  <Card variant="primary" className="overflow-hidden">
                    <div className="overflow-x-auto">
                      {customers.length === 0 ? (
                        <div className="p-10 text-center space-y-2.5">
                          <p className="type-card-title text-[var(--text-primary)]">No customers found</p>
                          <p className="type-subheading">
                            No customer records matched{globalSearch.trim() ? ` "${globalSearch.trim()}"` : ''}{churnStatusFilter !== 'All' ? ` with status "${churnStatusFilter}"` : ''}.
                          </p>
                          <Button
                            variant="secondary"
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
                          <thead className="bg-[var(--bg-card-secondary)] text-[var(--text-secondary)] border-b border-[var(--border-subtle)] font-medium">
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
                              <tr key={c.id || i} className="hover:bg-[var(--bg-card-secondary)]/70 transition">
                                <td className="px-4 py-3 font-mono font-medium whitespace-nowrap text-[var(--text-secondary)]">{c.id}</td>
                                <td className="px-4 py-3">
                                  <span className="font-medium text-[var(--text-primary)] block">{c.name}</span>
                                  {c.email && <span className="text-[11px] text-[var(--text-secondary)] font-mono block">{c.email}</span>}
                                </td>
                                <td className="px-4 py-3"><ChurnStatusBadge status={c.churnStatus} /></td>
                                <td className="px-4 py-3 tabular-nums whitespace-nowrap text-[var(--text-primary)]">{c.tenure} mo</td>
                                <td className="px-4 py-3 tabular-nums whitespace-nowrap text-[var(--text-primary)]">${Number(c.monthlyCharges).toFixed(2)}/mo</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[var(--text-secondary)]">{c.contract}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[var(--text-secondary)]">{c.internet}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[var(--text-secondary)]">{c.payment}</td>
                                <td className="px-4 py-3 font-mono font-semibold tabular-nums whitespace-nowrap text-[var(--text-primary)]">{c.probability}%</td>
                                <td className="px-4 py-3"><RiskBadge probability={c.probability} thresholds={thresholds} /></td>
                                <td className="px-4 py-3 text-right">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleAnalyseCustomer(c.id)}
                                    aria-label={`Analyse ${c.name} (${c.id})`}
                                    title={`Open individual analysis for ${c.name} (${c.id})`}
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
                <Card variant="secondary" className="p-10 text-center space-y-3">
                  <p className="type-card-title text-[var(--text-primary)]">No Customer Data Loaded</p>
                  <p className="type-subheading text-[var(--text-secondary)]">
                    Please upload customer data in the Customer Data section to use this feature.
                  </p>
                  <Button variant="primary" size="sm" onClick={() => navigateToPage('datasets')}>
                    Open Customer Data
                  </Button>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Top Mode Switcher & Customer Navigation Bar */}
                  <Card variant="secondary" className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAnalyticsMode('individual')}
                        className={`h-9 px-3.5 rounded-lg text-xs font-medium inline-flex items-center transition cursor-pointer ${
                          analyticsMode === 'individual'
                            ? 'bg-[var(--accent-primary)] text-white shadow-xs'
                            : 'bg-[var(--bg-card-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                        }`}
                      >
                        Customer Analysis
                      </button>
                      <button
                        type="button"
                        onClick={() => setAnalyticsMode('dataset')}
                        className={`h-9 px-3.5 rounded-lg text-xs font-medium inline-flex items-center transition cursor-pointer ${
                          analyticsMode === 'dataset'
                            ? 'bg-[var(--accent-primary)] text-white shadow-xs'
                            : 'bg-[var(--bg-card-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                        }`}
                      >
                        Dataset Trends ({activeDataset.rows.toLocaleString()})
                      </button>
                    </div>

                    <Button
                      variant="secondary"
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
                                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-[var(--bg-app)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                                  {selectedCustomerAnalysis.customer.id}
                                </span>
                                <ChurnStatusBadge status={selectedCustomerAnalysis.customer.churnStatus || 'Active'} />
                                <RiskBadge probability={selectedCustomerAnalysis.baseProb} thresholds={thresholds} />
                              </div>
                              <h3 className="type-section-title text-[var(--text-primary)]">
                                {selectedCustomerAnalysis.customer.name}
                              </h3>
                              <p className="type-subheading">
                                Email: <span className="font-mono text-[var(--text-primary)]">{selectedCustomerAnalysis.formatAttr(selectedCustomerAnalysis.customer.email)}</span> • Dataset: {activeDataset.name}
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
                              className="h-9 px-3 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer"
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
                        <Card
                          variant={
                            selectedCustomerAnalysis.baseProb >= thresholds.high
                              ? 'rose'
                              : selectedCustomerAnalysis.baseProb >= thresholds.medium
                              ? 'amber'
                              : 'emerald'
                          }
                          className="p-5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="type-label">Cancellation Risk</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-medium">Predicted</span>
                          </div>
                          <div className="flex items-baseline gap-2.5 mt-2">
                            <h4 className="type-metric text-[var(--text-primary)]">{selectedCustomerAnalysis.baseProb}%</h4>
                            <RiskBadge probability={selectedCustomerAnalysis.baseProb} thresholds={thresholds} />
                          </div>
                          <p className="type-subheading mt-1 text-[var(--text-secondary)]">
                            Dataset avg: {selectedCustomerAnalysis.avgRisk}% ({selectedCustomerAnalysis.baseProb >= selectedCustomerAnalysis.avgRisk ? `+${(selectedCustomerAnalysis.baseProb - selectedCustomerAnalysis.avgRisk).toFixed(1)}%` : `${(selectedCustomerAnalysis.baseProb - selectedCustomerAnalysis.avgRisk).toFixed(1)}%`})
                          </p>
                        </Card>

                        <Card variant="secondary" className="p-5">
                          <div className="flex items-center justify-between">
                            <span className="type-label">Tenure</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-card-secondary)] text-[var(--text-secondary)] font-medium border border-[var(--border-subtle)]">Recorded</span>
                          </div>
                          <h4 className="type-metric mt-2 text-[var(--text-primary)]">
                            {selectedCustomerAnalysis.formatAttr(selectedCustomerAnalysis.customer.tenure, ' mo')}
                          </h4>
                          <p className="type-subheading mt-1">
                            Dataset avg: {selectedCustomerAnalysis.avgTenure} mo
                          </p>
                        </Card>

                        <Card variant="elevated" className="p-5">
                          <div className="flex items-center justify-between">
                            <span className="type-label">Billing</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-card-secondary)] text-[var(--text-secondary)] font-medium border border-[var(--border-subtle)]">Recorded</span>
                          </div>
                          <h4 className="type-metric mt-2 text-[var(--text-primary)]">
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

                        <Card variant="cyan" className="p-5">
                          <div className="flex items-center justify-between">
                            <span className="type-label text-cyan-300">Contract & Payment</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-card-secondary)] text-cyan-300 font-medium border border-cyan-500/30">Recorded</span>
                          </div>
                          <h4 className="type-section-title mt-2 truncate text-[var(--text-primary)]">
                            {selectedCustomerAnalysis.formatAttr(selectedCustomerAnalysis.customer.contract)}
                          </h4>
                          <p className="type-subheading mt-1 truncate">
                            {selectedCustomerAnalysis.formatAttr(selectedCustomerAnalysis.customer.payment)}
                          </p>
                        </Card>
                      </div>

                      {/* Complete Customer Attributes & Service Patterns Grid */}
                      <Card variant="primary" className="p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
                          <div>
                            <h3 className="type-card-title text-[var(--text-primary)]">Account Attributes</h3>
                            <p className="type-subheading">
                              Recorded service configuration for {selectedCustomerAnalysis.customer.name} ({selectedCustomerAnalysis.customer.id})
                            </p>
                          </div>
                          <span className="text-[11px] px-2.5 py-1 rounded-full bg-[var(--bg-card-secondary)] border border-[var(--border-subtle)] text-[var(--text-secondary)] font-medium self-start sm:self-center">
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
                            <div key={attr.label} className="p-3 rounded-lg bg-[var(--bg-card-secondary)] border border-[var(--border-subtle)]">
                              <span className="text-[11px] text-[var(--text-secondary)] block">{attr.label}</span>
                              <span className={`font-medium mt-0.5 block text-[var(--text-primary)] ${attr.value === 'Data not available' ? 'text-[var(--text-muted)] italic font-normal' : ''}`}>
                                {attr.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </Card>

                      {/* Risk Score Over Time & Retention Simulator for Selected Customer */}
                      <Card variant="primary" className="p-6 space-y-5">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="type-section-title text-[var(--text-primary)]">
                                Risk Score Over Time — {selectedCustomerAnalysis.customer.name}
                              </h3>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 font-medium border border-indigo-500/30">
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
                                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} />
                                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} unit="%" />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: 'var(--chart-tooltip-bg)',
                                      borderRadius: '10px',
                                      border: '1px solid var(--chart-tooltip-border)',
                                      color: 'var(--chart-tooltip-text)',
                                      fontSize: '12px'
                                    }}
                                    itemStyle={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 500 }}
                                    labelStyle={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600 }}
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
                                    activeDot={{ r: 7, fill: '#22D3EE', stroke: '#FFFFFF', strokeWidth: 2 }}
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
                          <div className="lg:col-span-4 space-y-4 bg-[var(--bg-card-secondary)] p-4 rounded-xl border border-[var(--border-subtle)]">
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
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
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
                              <p className="text-xs font-semibold text-[var(--text-primary)]">Simulate Retention Actions for {selectedCustomerAnalysis.customer.name}:</p>
                              <p className="text-[11px] text-[var(--text-secondary)]">
                                Toggle actions below to test how much they reduce {selectedCustomerAnalysis.customer.name}'s risk score:
                              </p>

                              <div className="space-y-2 pt-1 text-xs">
                                <label className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] cursor-pointer hover:border-indigo-500/50 transition">
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
                        <Card variant="primary" className="p-6 space-y-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                                Risk Factor Impact Breakdown for {selectedCustomerAnalysis.customer.name}
                              </h3>
                              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                Red bars push this customer's risk higher; green bars protect loyalty and lower risk.
                              </p>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 font-semibold shrink-0 border border-indigo-500/30">
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
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} />
                                <YAxis dataKey="factor" type="category" width={115} tick={{ fontSize: 11, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: 'var(--chart-tooltip-bg)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--chart-tooltip-border)',
                                    color: 'var(--chart-tooltip-text)',
                                    fontSize: '12px'
                                  }}
                                  itemStyle={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 500 }}
                                  labelStyle={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600 }}
                                  formatter={(value: any, _name: any, props: any) => [
                                    `${Number(value) > 0 ? `+${value}` : value} impact pts (${props?.payload?.customerValue || ''})`,
                                    Number(value) > 0 ? 'Increases Churn Risk' : 'Lowers Churn Risk'
                                  ]}
                                />
                                <ReferenceLine x={0} stroke="var(--chart-text)" />
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

                        <Card variant="secondary" className="p-6 space-y-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                                {selectedCustomerAnalysis.customer.name} vs. Active Dataset Average
                              </h3>
                              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                Compares this customer's actual metrics against the average of all {allDatasetCustomers.length} customers.
                              </p>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-card)] text-[var(--text-secondary)] font-semibold shrink-0 border border-[var(--border-subtle)]">
                              Actual Data vs. Avg
                            </span>
                          </div>
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={selectedCustomerAnalysis.benchmarkChartData} margin={{ top: 10, right: 15, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                                <XAxis dataKey="metric" tick={{ fontSize: 11, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: 'var(--chart-tooltip-bg)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--chart-tooltip-border)',
                                    color: 'var(--chart-tooltip-text)',
                                    fontSize: '12px'
                                  }}
                                  itemStyle={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 500 }}
                                  labelStyle={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600 }}
                                />
                                <Bar dataKey="customer" fill="#6366F1" radius={[4, 4, 0, 0]} name={selectedCustomerAnalysis.customer.name} />
                                <Bar dataKey="datasetAvg" fill="#22D3EE" radius={[4, 4, 0, 0]} name="Dataset Average" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </Card>
                      </div>

                      {/* Individual Customer Insights, Behaviour Patterns & Recommended Actions */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Column: Why At Risk, Contributing Factors & Behaviour Patterns */}
                        <Card variant="secondary" className="lg:col-span-6 p-6 space-y-5">
                          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className={`w-4 h-4 ${selectedCustomerAnalysis.baseProb >= thresholds.high ? 'text-rose-400' : selectedCustomerAnalysis.baseProb >= thresholds.medium ? 'text-amber-400' : 'text-emerald-400'}`} />
                              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Why This Customer May Be At Risk &amp; Behaviour Patterns</h3>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 font-semibold border border-indigo-500/30">
                              Model Diagnosis
                            </span>
                          </div>

                          <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs leading-relaxed text-[var(--text-primary)]">
                            {selectedCustomerAnalysis.whyAtRiskSummary}
                          </div>

                          <div className="space-y-3">
                            <h4 className="type-card-title text-[var(--text-primary)]">
                              Factors Contributing to Cancellation Risk
                            </h4>
                            {selectedCustomerAnalysis.riskIncreasingFactors.length === 0 ? (
                              <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
                                No major risk-increasing factors detected in {selectedCustomerAnalysis.customer.name}'s current profile.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {selectedCustomerAnalysis.riskIncreasingFactors.map((f) => (
                                  <div key={f.factor} className="p-3 rounded-lg bg-[var(--card-rose)] border border-rose-500/30 flex items-start justify-between gap-3 text-xs">
                                    <div>
                                      <span className="font-semibold block text-[var(--text-primary)]">{f.factor}: <span className="text-rose-400">{f.customerValue}</span></span>
                                      <span className="text-[11px] text-[var(--text-secondary)] mt-0.5 block">{f.explanation}</span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-semibold text-[11px] shrink-0 border border-rose-500/30">
                                      +{f.impactScore} pts
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {selectedCustomerAnalysis.protectiveFactors.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="type-card-title text-[var(--text-primary)]">
                                Protective Loyalty Factors (Keeping Customer Active)
                              </h4>
                              <div className="space-y-2">
                                {selectedCustomerAnalysis.protectiveFactors.slice(0, 3).map((f) => (
                                  <div key={f.factor} className="p-3 rounded-lg bg-[var(--card-emerald)] border border-emerald-500/30 flex items-start justify-between gap-3 text-xs">
                                    <div>
                                      <span className="font-semibold block text-[var(--text-primary)]">{f.factor}: <span className="text-emerald-400">{f.customerValue}</span></span>
                                      <span className="text-[11px] text-[var(--text-secondary)] mt-0.5 block">{f.explanation}</span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-semibold text-[11px] shrink-0 border border-emerald-500/30">
                                      {f.impactScore} pts
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
                            <h4 className="type-card-title text-[var(--text-primary)]">
                              Observed Customer Behaviour &amp; Usage Patterns (Actual Record)
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              {selectedCustomerAnalysis.behaviourPatterns.map((pat) => (
                                <div key={pat.label} className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                                  <span className="text-[11px] text-[var(--text-secondary)] block">{pat.label}</span>
                                  <span className={`font-semibold block mt-0.5 text-[var(--text-primary)] ${!pat.available ? 'text-[var(--text-muted)] italic font-normal' : ''}`}>
                                    {pat.value}
                                  </span>
                                  <span className="text-[11px] text-[var(--text-secondary)] block mt-1">{pat.detail}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </Card>

                        {/* Right Column: Recommended Retention Actions & Suggested Next Steps */}
                        <Card variant="elevated" className="lg:col-span-6 p-6 space-y-5">
                          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-indigo-400" />
                              <h3 className="type-card-title text-[var(--text-primary)]">Recommended Retention Actions &amp; Next Steps</h3>
                            </div>
                            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-medium border border-emerald-500/30">
                              Actionable Recommendations
                            </span>
                          </div>

                          <p className="text-xs text-[var(--text-secondary)]">
                            Recommendations below are generated specifically for <strong className="text-[var(--text-primary)]">{selectedCustomerAnalysis.customer.name}</strong> based on their actual plan attributes and simulated using the active prediction model.
                          </p>

                          <div className="space-y-3">
                            {selectedCustomerAnalysis.recommendations.map((rec) => {
                              const isApplied = rec.actionKey ? Boolean(currentCustomerActions[rec.actionKey]) : false;
                              return (
                                <div
                                  key={rec.id}
                                  className={`p-4 rounded-xl border transition space-y-2.5 text-xs ${
                                    isApplied
                                      ? 'bg-emerald-500/15 border-emerald-500/40 text-[var(--text-primary)]'
                                      : 'bg-[var(--bg-card-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)]'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                                          rec.priority === 'High Priority'
                                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                            : rec.priority === 'Recommended'
                                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        }`}>
                                          {rec.priority}
                                        </span>
                                        <span className="font-semibold text-sm text-[var(--text-primary)]">{rec.title}</span>
                                      </div>
                                      <p className="text-[var(--text-secondary)] pt-0.5">{rec.reason}</p>
                                    </div>
                                    {rec.riskReduction > 0 && (
                                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-semibold text-[11px] shrink-0 border border-emerald-500/30">
                                        -{rec.riskReduction}% Risk
                                      </span>
                                    )}
                                  </div>

                                  {rec.actionKey && (
                                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
                                      <span className="text-[11px] text-[var(--text-secondary)]">
                                        Projected risk with this action alone: <strong className="text-[var(--text-primary)]">{rec.projectedRisk}%</strong>
                                      </span>
                                      <Button
                                        variant={isApplied ? 'secondary' : 'primary'}
                                        size="sm"
                                        onClick={() => toggleRetentionAction(rec.actionKey!)}
                                      >
                                        {isApplied ? 'Applied in Simulator ✓' : 'Test in Simulator'}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2.5 text-xs">
                            <h4 className="type-card-title text-[var(--text-primary)]">
                              Suggested Next Steps for {selectedCustomerAnalysis.customer.name}
                            </h4>
                            <ol className="list-decimal list-inside space-y-1.5 text-[var(--text-secondary)]">
                              <li>
                                Review {selectedCustomerAnalysis.customer.name}'s top risk driver ({selectedCustomerAnalysis.riskIncreasingFactors[0] ? `${selectedCustomerAnalysis.riskIncreasingFactors[0].factor}: ${selectedCustomerAnalysis.riskIncreasingFactors[0].customerValue}` : `Current plan: ${selectedCustomerAnalysis.formatAttr(selectedCustomerAnalysis.customer.contract)}`}) before outreach.
                              </li>
                              <li>
                                Use the simulator toggles above to combine offers until {selectedCustomerAnalysis.customer.name}'s projected risk drops below the {thresholds.medium}% Low-Risk threshold (currently <strong className="text-[var(--text-primary)]">{customerRiskTimeline.currentRisk}%</strong>).
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
                        <Card variant="primary" className="p-6">
                          <h3 className="text-sm font-semibold mb-1 text-[var(--text-primary)]">Cancellation Rate by Contract Length</h3>
                          <p className="text-xs text-[var(--text-secondary)] mb-4">Based on active Customer Data ({activeDataset.name}).</p>
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={contractChurnData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                                <XAxis dataKey="contract" tick={{ fontSize: 11, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} unit="%" />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderRadius: '8px', border: '1px solid var(--chart-tooltip-border)', color: 'var(--chart-tooltip-text)', fontSize: '12px' }} />
                                <Bar dataKey="churnRate" fill="#6366F1" radius={[4, 4, 0, 0]} name="Customers Who Cancel (%)" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </Card>

                        <Card variant="primary" className="p-6">
                          <h3 className="text-sm font-semibold mb-1 text-[var(--text-primary)]">Cancellation Rate by Payment Method</h3>
                          <p className="text-xs text-[var(--text-secondary)] mb-4">Based on active Customer Data ({activeDataset.name}).</p>
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={paymentChurnData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                                <XAxis dataKey="payment" tick={{ fontSize: 10, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} unit="%" />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderRadius: '8px', border: '1px solid var(--chart-tooltip-border)', color: 'var(--chart-tooltip-text)', fontSize: '12px' }} />
                                <Bar dataKey="churnRate" fill="#22D3EE" radius={[4, 4, 0, 0]} name="Customers Who Cancel (%)" />
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
            {/* PAGE: REVENUE & PROFITABILITY              */}
            {/* ========================================== */}
            {activePage === 'revenue' && (
              <RevenueProfitabilitySection
                activeDataset={activeDataset}
                allDatasetCustomers={allDatasetCustomers}
                thresholds={thresholds}
                activeModelKey={activeModelKey}
                selectedCustomerId={selectedAnalyticsCustomerId}
                onSelectCustomer={handleAnalyseCustomer}
                onAnalyseCustomer={handleAnalyseCustomer}
                onNavigateToDatasets={() => navigateToPage('datasets')}
              />
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

                <Card variant="indigo" className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="type-section-title text-[var(--text-primary)]">Upload Customer Dataset</h3>
                      <p className="type-subheading mt-1 text-[var(--text-secondary)]">
                        Single data source for Overview, Customer List, Trends & Insights, and Revenue & Profitability.
                      </p>
                    </div>
                    <Button variant="primary" size="md" onClick={() => datasetUploadRef.current?.click()}>
                      Upload CSV
                    </Button>
                  </div>
                </Card>

                {datasets.length === 0 ? (
                  <Card variant="secondary" className="p-10 text-center space-y-2">
                    <p className="type-card-title text-[var(--text-primary)]">No datasets available</p>
                    <p className="type-subheading text-[var(--text-secondary)]">Select Upload CSV above to import a customer dataset.</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {datasets.map((ds) => (
                      <Card key={ds.id} variant={ds.active ? 'highlight' : 'secondary'} className="p-5 relative">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center"><FileSpreadsheet className="w-5 h-5" /></div>
                            <div>
                              <h4 className="text-xs font-semibold text-[var(--text-primary)]">{ds.name}</h4>
                              <p className="text-[11px] text-[var(--text-secondary)]">Added {ds.uploadedAt}</p>
                            </div>
                          </div>
                          {ds.active && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium flex items-center gap-1">
                              <FileCheck className="w-3 h-3" /> Active
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5 py-3 border-y border-[var(--border-subtle)] text-xs tabular-nums">
                          <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Accounts:</span><span className="font-medium text-[var(--text-primary)]">{ds.rows.toLocaleString()}</span></div>
                          <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Columns:</span><span className="font-medium text-[var(--text-primary)]">{ds.columns.length}</span></div>
                          <div className="flex justify-between" title="Records with blank total charges are imputed automatically"><span className="text-[var(--text-secondary)]">Imputed Values:</span><span className="font-medium text-amber-400">{ds.missingValuesCount}</span></div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          {!ds.active ? (
                            <Button variant="primary" size="sm" onClick={() => handleActivateDataset(ds.id)} className="flex-1">Set Active</Button>
                          ) : (
                            <span className="text-[11px] text-[var(--text-secondary)]">Active workspace dataset</span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteDataset(ds.id)}
                            className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition cursor-pointer shrink-0"
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
                <Card variant="primary" className="p-6">
                  <h3 className="type-section-title mb-1 text-[var(--text-primary)]">Scoring Models</h3>
                  <p className="type-subheading mb-6 text-[var(--text-secondary)]">Benchmarked on 1,409 holdout customer records. Select the model that matches your precision and recall targets.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {models.map((mod) => (
                      <Card key={mod.id} variant={activeModelKey === mod.key ? 'highlight' : 'secondary'} className="p-5 space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <Cpu className="w-5 h-5 text-indigo-400 shrink-0" />
                            <div>
                              <h4 className="text-xs font-semibold text-[var(--text-primary)]">{mod.name}</h4>
                              <p className="text-[11px] text-[var(--text-secondary)]">{mod.format} • Recall: {mod.recall}% • ROC-AUC: {mod.rocAuc}%</p>
                            </div>
                          </div>
                          {activeModelKey === mod.key && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium flex items-center gap-1 shrink-0">
                              <ShieldCheck className="w-3 h-3" /> Active
                            </span>
                          )}
                        </div>

                        <p className="type-body text-[var(--text-secondary)]">{mod.description}</p>

                        {activeModelKey !== mod.key && (
                          <div className="pt-1">
                            <Button variant="primary" size="sm" onClick={() => { setActiveModelKey(mod.key); showToast('Model Updated', `Active model: ${mod.name}`); }} className="w-full">Activate Model</Button>
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
                <Card variant="indigo" className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="type-card-title text-[var(--text-primary)]">{activeModel.name}</h3>
                    <p className="type-subheading text-[var(--text-secondary)]">Evaluated on 1,409 holdout accounts</p>
                  </div>
                  <span className="text-xs font-semibold text-indigo-400">ROC-AUC: {activeModel.rocAuc}%</span>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card variant="secondary" className="p-5">
                    <span className="type-label text-[var(--text-secondary)]">Accuracy</span>
                    <h3 className="type-metric mt-2 text-[var(--text-primary)]">{activeModel.accuracy}%</h3>
                    <p className="type-subheading mt-1 text-[var(--text-muted)]">Overall classification accuracy</p>
                  </Card>
                  <Card variant="secondary" className="p-5">
                    <span className="type-label text-[var(--text-secondary)]">Precision</span>
                    <h3 className="type-metric mt-2 text-[var(--text-primary)]">{activeModel.precision}%</h3>
                    <p className="type-subheading mt-1 text-[var(--text-muted)]">True churn rate among flagged accounts</p>
                  </Card>
                  <Card variant="cyan" className="p-5">
                    <span className="type-label text-cyan-300">Recall</span>
                    <h3 className="type-metric mt-2 text-cyan-400">{activeModel.recall}%</h3>
                    <p className="type-subheading mt-1 text-cyan-300/70">Share of actual cancellations identified</p>
                  </Card>
                  <Card variant="indigo" className="p-5">
                    <span className="type-label text-indigo-300">F1 Score</span>
                    <h3 className="type-metric mt-2 text-indigo-400">{activeModel.f1}%</h3>
                    <p className="type-subheading mt-1 text-indigo-300/70">Harmonic mean of precision and recall</p>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card variant="primary" className="p-6 space-y-4">
                    <div>
                      <h4 className="type-card-title text-[var(--text-primary)]">Feature Importance</h4>
                      <p className="type-subheading mt-0.5 text-[var(--text-secondary)]">Relative impact of account attributes on predicted churn</p>
                    </div>
                    <div className="space-y-3">
                      {NOTEBOOK_PERMUTATION_IMPORTANCE.map((item) => (
                        <div key={item.feature} className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="font-medium text-[var(--text-primary)]">{item.feature}</span>
                            <span className="text-[11px] text-[var(--text-secondary)]">{item.category}</span>
                          </div>
                          <div className="w-full h-2 bg-[var(--bg-app)] rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.max(4, (item.importance / 0.16) * 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card variant="elevated" className="p-6 space-y-4">
                    <div>
                      <h4 className="type-card-title text-[var(--text-primary)]">Confusion Matrix (1,409 Accounts)</h4>
                      <p className="type-subheading mt-0.5">Holdout validation results by predicted vs. actual outcome</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 text-center">
                      <div className="p-4 rounded-xl bg-[var(--bg-card-secondary)] border border-emerald-500/30">
                        <span className="text-[11px] font-medium text-[var(--text-secondary)] block">True Negative (Retained)</span>
                        <span className="type-metric text-emerald-400 mt-1 block">{activeModel.confusionMatrix.tn}</span>
                        <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">Correctly predicted active</span>
                      </div>
                      <div className="p-4 rounded-xl bg-[var(--bg-card-secondary)] border border-amber-500/30">
                        <span className="text-[11px] font-medium text-[var(--text-secondary)] block">False Positive</span>
                        <span className="type-metric text-amber-400 mt-1 block">{activeModel.confusionMatrix.fp}</span>
                        <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">Flagged at-risk, remained active</span>
                      </div>
                      <div className="p-4 rounded-xl bg-[var(--bg-card-secondary)] border border-rose-500/30">
                        <span className="text-[11px] font-medium text-[var(--text-secondary)] block">False Negative</span>
                        <span className="type-metric text-rose-400 mt-1 block">{activeModel.confusionMatrix.fn}</span>
                        <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">Unflagged cancellations</span>
                      </div>
                      <div className="p-4 rounded-xl bg-[var(--bg-card-secondary)] border border-indigo-500/30">
                        <span className="text-[11px] font-medium text-[var(--text-secondary)] block">True Positive (Churned)</span>
                        <span className="type-metric text-indigo-400 mt-1 block">{activeModel.confusionMatrix.tp}</span>
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
              <Card variant="primary" className="overflow-hidden">
                <div className="overflow-x-auto">
                  {predictionHistory.length === 0 ? (
                    <div className="p-10 text-center space-y-2">
                      <p className="type-card-title text-[var(--text-primary)]">No saved predictions</p>
                      <p className="type-subheading">Use the Risk Calculator to evaluate an account and save the result.</p>
                      <Button variant="primary" size="sm" onClick={() => navigateToPage('prediction')}>Open Risk Calculator</Button>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--bg-card-secondary)] text-[var(--text-secondary)] border-b border-[var(--border-subtle)] font-medium">
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
                          <tr key={item.predId} className="hover:bg-[var(--bg-card-secondary)]/70 transition">
                            <td className="px-4 py-3 font-mono text-[var(--text-secondary)]">{item.predId}</td>
                            <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{item.customerName}</td>
                            <td className="px-4 py-3 text-[var(--text-secondary)] tabular-nums">{item.timestamp}</td>
                            <td className="px-4 py-3 tabular-nums font-semibold text-[var(--text-primary)]">{item.probability}%</td>
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
              <div className="space-y-6 max-w-3xl">
                {/* 1. Theme & Appearance (Requirement 1) */}
                <Card variant="elevated" className="p-6 space-y-5">
                  <div>
                    <h3 className="type-card-title text-[var(--text-primary)]">Appearance & Theme</h3>
                    <p className="type-subheading mt-1">
                      Choose your preferred interface theme. Settings take effect immediately and are saved locally.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {/* Dark Mode Card */}
                    <button
                      type="button"
                      onClick={() => {
                        setThemeMode('dark');
                        showToast('Theme Updated', 'Switched to Dark Mode (True Black & Charcoal).');
                      }}
                      className={`p-4 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between space-y-3 ${
                        themeMode === 'dark'
                          ? 'bg-[var(--bg-card)] border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                          : 'bg-[var(--bg-card-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-secondary)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-lg bg-[#090909] text-amber-400 border border-[#2B2B2B]">
                          <Moon className="w-5 h-5 text-indigo-400" />
                        </div>
                        {themeMode === 'dark' && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">
                            Active
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-[13px] font-semibold text-[var(--text-primary)]">Dark Mode</h4>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-snug">
                          True black (#090909) and charcoal surfaces with violet accents.
                        </p>
                      </div>
                    </button>

                    {/* Light Mode Card */}
                    <button
                      type="button"
                      onClick={() => {
                        setThemeMode('light');
                        showToast('Theme Updated', 'Switched to Light Mode (Clean Neutral White).');
                      }}
                      className={`p-4 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between space-y-3 ${
                        themeMode === 'light'
                          ? 'bg-[var(--bg-card)] border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                          : 'bg-[var(--bg-card-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-secondary)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-lg bg-[#F5F5F5] text-amber-500 border border-[#E5E5E5]">
                          <Sun className="w-5 h-5 text-amber-500" />
                        </div>
                        {themeMode === 'light' && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">
                            Active
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-[13px] font-semibold text-[var(--text-primary)]">Light Mode</h4>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-snug">
                          Clean neutral whites, crisp typography, and soft gray borders.
                        </p>
                      </div>
                    </button>

                    {/* System Sync Card */}
                    <button
                      type="button"
                      onClick={() => {
                        setThemeMode('system');
                        showToast('Theme Updated', `Synchronized with OS preference (${systemPrefersDark ? 'Dark' : 'Light'}).`);
                      }}
                      className={`p-4 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between space-y-3 ${
                        themeMode === 'system'
                          ? 'bg-[var(--bg-card)] border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                          : 'bg-[var(--bg-card-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-secondary)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-lg bg-[var(--bg-input)] text-cyan-400 border border-[var(--border-subtle)]">
                          <Laptop className="w-5 h-5 text-cyan-400" />
                        </div>
                        {themeMode === 'system' && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">
                            Active
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-[13px] font-semibold text-[var(--text-primary)]">System Default</h4>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-snug">
                          Automatically follows your device operating system theme setting.
                        </p>
                      </div>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
                    <span>Active Theme: <strong className="font-semibold text-[var(--text-primary)] capitalize">{themeMode === 'system' ? `System (${theme})` : themeMode}</strong></span>
                    <span>Persisted via localStorage across refreshes</span>
                  </div>
                </Card>

                {/* 2. Risk Classification Thresholds */}
                <Card variant="elevated" className="p-6 space-y-5">
                  <div>
                    <h3 className="type-card-title text-[var(--text-primary)]">Risk Classification Thresholds</h3>
                    <p className="type-subheading mt-1">
                      Define the probability cutoffs (0%–100%) used to classify accounts as Medium Risk or High Risk.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block type-label mb-1">Medium Risk Threshold (%)</label>
                      <input
                        type="number"
                        min="5"
                        max="90"
                        value={thresholds.medium}
                        onChange={(e) => setThresholds(t => ({ ...t, medium: Number(e.target.value) }))}
                        className="w-full h-9 px-3 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                      />
                      <span className="text-[11px] text-[var(--text-muted)] block mt-1">Scores below {thresholds.medium}% are classified as Low Risk.</span>
                    </div>
                    <div>
                      <label className="block type-label mb-1">High Risk Threshold (%)</label>
                      <input
                        type="number"
                        min="10"
                        max="95"
                        value={thresholds.high}
                        onChange={(e) => setThresholds(t => ({ ...t, high: Number(e.target.value) }))}
                        className="w-full h-9 px-3 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                      />
                      <span className="text-[11px] text-[var(--text-muted)] block mt-1">Scores at or above {thresholds.high}% are classified as High Risk.</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
                    <span className="text-xs text-[var(--text-secondary)]">Default thresholds: 35% Medium Risk, 65% High Risk.</span>
                    <Button
                      variant="secondary"
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

                {/* 3. Supabase Authentication & Workspace Session */}
                <Card variant="elevated" className="p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="type-card-title text-[var(--text-primary)]">Enterprise Authentication & Session</h3>
                      <p className="type-subheading mt-1">
                        Manage your active Supabase session, tenant isolation, and security credentials.
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSignOut}
                      className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10 shrink-0 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-[var(--bg-card-secondary)] border border-[var(--border-subtle)] space-y-1">
                      <span className="text-[var(--text-secondary)] block text-[11px]">Authenticated Account</span>
                      <span className="font-semibold text-[var(--text-primary)] truncate block">{user?.email || profileForm.email}</span>
                      <span className="text-[10px] text-emerald-500 flex items-center gap-1 font-medium pt-1">
                        <CheckCircle2 className="w-3 h-3" /> Active Session
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[var(--bg-card-secondary)] border border-[var(--border-subtle)] space-y-1">
                      <span className="text-[var(--text-secondary)] block text-[11px]">Security Infrastructure</span>
                      <span className="font-semibold text-[var(--text-primary)] block">Supabase Auth</span>
                      <span className="text-[10px] text-indigo-400 flex items-center gap-1 font-medium pt-1">
                        <ShieldCheck className="w-3 h-3" /> Row-Level Security
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[var(--bg-card-secondary)] border border-[var(--border-subtle)] space-y-1">
                      <span className="text-[var(--text-secondary)] block text-[11px]">User UUID</span>
                      <span className="font-mono text-[var(--text-primary)] text-[11px] truncate block" title={user?.id}>
                        {user?.id ? `${user.id.substring(0, 14)}...` : 'Local Session'}
                      </span>
                      <span className="text-[10px] text-[var(--text-secondary)] block pt-1">Tenant ID</span>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
