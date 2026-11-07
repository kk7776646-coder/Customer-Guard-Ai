import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  BarChart3
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  Card,
  Button,
  RiskBadge,
  ChurnStatusBadge,
  FinancialStatusBadge
} from './ui';
import { buildIndividualCustomerAnalysis } from '../utils/customerAnalytics';

interface RevenueProfitabilitySectionProps {
  activeDataset: any;
  allDatasetCustomers: any[];
  thresholds: { medium: number; high: number };
  activeModelKey: string;
  selectedCustomerId: string;
  onSelectCustomer: (customerId: string) => void;
  onAnalyseCustomer: (customerId: string) => void;
  onNavigateToDatasets: () => void;
}

export type FinancialStatusType =
  | 'Profitable'
  | 'Break-even'
  | 'Loss-making'
  | 'Insufficient Data';

export interface EnrichedFinancialCustomer {
  raw: any;
  id: string;
  name: string;
  email: string;
  contract: string;
  payment: string;
  internet: string;
  tenure: number;
  monthlyCharges: number;
  revenue: number; // Actual cumulative customer revenue (totalCharges or tenure * monthlyCharges)
  hasCostData: boolean;
  estimatedCost: number | null;
  estimatedProfit: number | null;
  profitMargin: number | null;
  financialStatus: FinancialStatusType;
  probability: number;
  riskLevel: 'High Risk' | 'Medium Risk' | 'Low Risk';
  churnStatus: 'Active' | 'At-Risk' | 'Churned';
  isChurned: boolean;
  isAtRiskActive: boolean;
  revenueAtRisk: number;
  mrrAtRisk: number;
  historicalLostRevenue: number;
  lostMrr: number;
  segment: 'High-Value ($80+/mo)' | 'Mid-Market ($45–$79/mo)' | 'Standard (<$45/mo)';
  usageDrop: number | null;
  seniorCitizen: number;
  dependents: string;
}

function formatCurrency(val: number, decimals = 2): string {
  return `$${val.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
}

function formatCompactCurrency(val: number): string {
  if (Math.abs(val) >= 1_000_000) {
    return `$${(val / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(val) >= 10_000) {
    return `$${(val / 1_000).toFixed(1)}K`;
  }
  return `$${val.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function RevenueProfitabilitySection({
  activeDataset,
  allDatasetCustomers,
  thresholds,
  activeModelKey,
  selectedCustomerId,
  onSelectCustomer,
  onAnalyseCustomer,
  onNavigateToDatasets
}: RevenueProfitabilitySectionProps) {
  // Section Filters (Requirement 7)
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('All');
  const [contractFilter, setContractFilter] = useState<string>('All');
  const [segmentFilter, setSegmentFilter] = useState<string>('All');
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('All');
  const [financialStatusFilter, setFinancialStatusFilter] = useState<string>('All');
  const [paymentFilter, setPaymentFilter] = useState<string>('All');

  // Profitability Table Search & Sorting (Requirement 4)
  const [tableSearch, setTableSearch] = useState<string>('');
  const [tableSortBy, setTableSortBy] = useState<
    | 'revenue-desc'
    | 'revenue-asc'
    | 'monthly-desc'
    | 'profit-desc'
    | 'profit-asc'
    | 'margin-desc'
    | 'risk-desc'
    | 'name-asc'
  >('revenue-desc');

  // Deduplicate and enrich every customer record strictly from actual dataset fields (Requirement 8 & 10)
  const enrichedCustomers = useMemo<EnrichedFinancialCustomer[]>(() => {
    const seen = new Set<string>();
    const list: EnrichedFinancialCustomer[] = [];

    for (const c of allDatasetCustomers) {
      const id = String(c.id || '');
      if (!id || seen.has(id)) continue;
      seen.add(id);

      const tenure = Math.max(0, Number(c.tenure ?? 0));
      const monthlyCharges = Math.max(0, Number(c.monthlyCharges ?? 0));
      const hasTotalCharges =
        c.totalCharges !== undefined &&
        c.totalCharges !== null &&
        String(c.totalCharges).trim() !== '' &&
        !Number.isNaN(Number(c.totalCharges));

      // Revenue = Actual customer revenue (totalCharges) or supported billing amount (monthlyCharges * tenure)
      const revenue = hasTotalCharges
        ? Number(Number(c.totalCharges).toFixed(2))
        : Number((monthlyCharges * Math.max(1, tenure)).toFixed(2));

      // Inspect actual cost fields in dataset — never invent operating or acquisition costs
      const rawCostVal =
        c.cost ?? c.totalCost ?? c.estimatedCost ?? c.operatingCost ?? c.serviceCost;
      const rawMonthlyCostVal = c.monthlyCost ?? c.unitCost;

      const hasDirectCost =
        rawCostVal !== undefined &&
        rawCostVal !== null &&
        String(rawCostVal).trim() !== '' &&
        !Number.isNaN(Number(rawCostVal));
      const hasMonthlyCost =
        rawMonthlyCostVal !== undefined &&
        rawMonthlyCostVal !== null &&
        String(rawMonthlyCostVal).trim() !== '' &&
        !Number.isNaN(Number(rawMonthlyCostVal));

      const hasCostData = hasDirectCost || hasMonthlyCost;
      const estimatedCost = hasDirectCost
        ? Number(Number(rawCostVal).toFixed(2))
        : hasMonthlyCost
        ? Number((Number(rawMonthlyCostVal) * Math.max(1, tenure)).toFixed(2))
        : null;

      // Profit = Revenue - Total Cost; Profit Margin = (Profit / Revenue) * 100
      const estimatedProfit =
        hasCostData && estimatedCost !== null
          ? Number((revenue - estimatedCost).toFixed(2))
          : null;

      const profitMargin =
        hasCostData && estimatedProfit !== null && revenue > 0
          ? Number(((estimatedProfit / revenue) * 100).toFixed(1))
          : null;

      let financialStatus: FinancialStatusType = 'Insufficient Data';
      if (hasCostData && estimatedProfit !== null) {
        const breakEvenBand = Math.max(1, revenue * 0.01);
        if (estimatedProfit > breakEvenBand) {
          financialStatus = 'Profitable';
        } else if (estimatedProfit < -breakEvenBand) {
          financialStatus = 'Loss-making';
        } else {
          financialStatus = 'Break-even';
        }
      }

      const probability = Number(c.probability ?? 0);
      const riskLevel: 'High Risk' | 'Medium Risk' | 'Low Risk' =
        probability >= thresholds.high
          ? 'High Risk'
          : probability >= thresholds.medium
          ? 'Medium Risk'
          : 'Low Risk';

      const churnStatus: 'Active' | 'At-Risk' | 'Churned' =
        c.churnStatus === 'Churned'
          ? 'Churned'
          : c.churnStatus === 'At-Risk' || probability >= thresholds.high
          ? 'At-Risk'
          : 'Active';

      // Strict separation: Churned accounts vs Active At-Risk accounts (prevents double-counting)
      const isChurned = churnStatus === 'Churned';
      const isAtRiskActive =
        !isChurned && (probability >= thresholds.high || c.churnStatus === 'At-Risk');

      const revenueAtRisk = isAtRiskActive ? revenue : 0;
      const mrrAtRisk = isAtRiskActive ? monthlyCharges : 0;
      const historicalLostRevenue = isChurned ? revenue : 0;
      const lostMrr = isChurned ? monthlyCharges : 0;

      const segment: 'High-Value ($80+/mo)' | 'Mid-Market ($45–$79/mo)' | 'Standard (<$45/mo)' =
        monthlyCharges >= 80
          ? 'High-Value ($80+/mo)'
          : monthlyCharges >= 45
          ? 'Mid-Market ($45–$79/mo)'
          : 'Standard (<$45/mo)';

      const usageDrop =
        c.usageDrop !== undefined && c.usageDrop !== null && String(c.usageDrop).trim() !== ''
          ? Number(c.usageDrop)
          : null;

      list.push({
        raw: c,
        id,
        name: String(c.name || `Customer ${id}`),
        email: String(c.email || ''),
        contract: String(c.contract || 'Month-to-month'),
        payment: String(c.payment || 'Electronic check'),
        internet: String(c.internet || 'No'),
        tenure,
        monthlyCharges,
        revenue,
        hasCostData,
        estimatedCost,
        estimatedProfit,
        profitMargin,
        financialStatus,
        probability,
        riskLevel,
        churnStatus,
        isChurned,
        isAtRiskActive,
        revenueAtRisk,
        mrrAtRisk,
        historicalLostRevenue,
        lostMrr,
        segment,
        usageDrop,
        seniorCitizen: Number(c.seniorCitizen ?? 0),
        dependents: String(c.dependents || 'No')
      });
    }

    return list;
  }, [allDatasetCustomers, thresholds.high, thresholds.medium]);

  // Apply all 6 filters dynamically across the section (Requirement 7)
  const filteredCustomers = useMemo(() => {
    return enrichedCustomers.filter((c) => {
      // 1. Date range / tenure cohort filter
      if (dateRangeFilter === 'Last 3 Months' && c.tenure > 3) return false;
      if (dateRangeFilter === 'Last 6 Months' && c.tenure > 6) return false;
      if (dateRangeFilter === 'Last 12 Months' && c.tenure > 12) return false;
      if (dateRangeFilter === '1–2 Years' && (c.tenure <= 12 || c.tenure > 24)) return false;
      if (dateRangeFilter === 'Long-Term (24m+)' && c.tenure <= 24) return false;

      // 2. Contract type filter
      if (contractFilter !== 'All' && c.contract.toLowerCase() !== contractFilter.toLowerCase()) {
        return false;
      }

      // 3. Customer segment filter
      if (segmentFilter !== 'All') {
        if (segmentFilter === 'Senior Citizens' && c.seniorCitizen !== 1) return false;
        if (segmentFilter === 'Family / Dependents' && c.dependents !== 'Yes') return false;
        if (
          ['High-Value ($80+/mo)', 'Mid-Market ($45–$79/mo)', 'Standard (<$45/mo)'].includes(
            segmentFilter
          ) &&
          c.segment !== segmentFilter
        ) {
          return false;
        }
      }

      // 4. Risk level filter
      if (riskLevelFilter !== 'All' && c.riskLevel !== riskLevelFilter) return false;

      // 5. Financial status filter
      if (financialStatusFilter !== 'All' && c.financialStatus !== financialStatusFilter) {
        return false;
      }

      // 6. Payment method filter
      if (paymentFilter !== 'All' && c.payment.toLowerCase() !== paymentFilter.toLowerCase()) {
        return false;
      }

      return true;
    });
  }, [
    enrichedCustomers,
    dateRangeFilter,
    contractFilter,
    segmentFilter,
    riskLevelFilter,
    financialStatusFilter,
    paymentFilter
  ]);

  const hasActiveFilters =
    dateRangeFilter !== 'All' ||
    contractFilter !== 'All' ||
    segmentFilter !== 'All' ||
    riskLevelFilter !== 'All' ||
    financialStatusFilter !== 'All' ||
    paymentFilter !== 'All';

  const resetAllFilters = () => {
    setDateRangeFilter('All');
    setContractFilter('All');
    setSegmentFilter('All');
    setRiskLevelFilter('All');
    setFinancialStatusFilter('All');
    setPaymentFilter('All');
  };

  // Financial KPIs computed strictly from filtered customers (Requirement 2 & 8)
  const kpis = useMemo(() => {
    const totalCustomers = filteredCustomers.length;
    const activeCustomers = filteredCustomers.filter((c) => !c.isChurned);
    const churnedCustomers = filteredCustomers.filter((c) => c.isChurned);
    const atRiskActiveCustomers = filteredCustomers.filter((c) => c.isAtRiskActive);

    const totalRevenue = Number(
      filteredCustomers.reduce((sum, c) => sum + c.revenue, 0).toFixed(2)
    );
    const activeRetainedRevenue = Number(
      activeCustomers.reduce((sum, c) => sum + c.revenue, 0).toFixed(2)
    );
    const mrr = Number(
      activeCustomers.reduce((sum, c) => sum + c.monthlyCharges, 0).toFixed(2)
    );
    const arpcCumulative =
      totalCustomers > 0 ? Number((totalRevenue / totalCustomers).toFixed(2)) : 0;
    const arpcMonthly =
      activeCustomers.length > 0 ? Number((mrr / activeCustomers.length).toFixed(2)) : 0;

    const revenueAtRisk = Number(
      atRiskActiveCustomers.reduce((sum, c) => sum + c.revenueAtRisk, 0).toFixed(2)
    );
    const mrrAtRisk = Number(
      atRiskActiveCustomers.reduce((sum, c) => sum + c.mrrAtRisk, 0).toFixed(2)
    );

    const estimatedLostRevenue = Number(
      churnedCustomers.reduce((sum, c) => sum + c.historicalLostRevenue, 0).toFixed(2)
    );
    const lostMonthlyRunRate = Number(
      churnedCustomers.reduce((sum, c) => sum + c.lostMrr, 0).toFixed(2)
    );

    const customersWithCost = filteredCustomers.filter((c) => c.hasCostData);
    const profitableCustomers = customersWithCost.filter(
      (c) => c.financialStatus === 'Profitable'
    );
    const lossMakingCustomers = customersWithCost.filter(
      (c) => c.financialStatus === 'Loss-making'
    );
    const breakEvenCustomers = customersWithCost.filter(
      (c) => c.financialStatus === 'Break-even'
    );

    const totalNetProfit =
      customersWithCost.length > 0
        ? Number(
            customersWithCost
              .reduce((sum, c) => sum + (c.estimatedProfit ?? 0), 0)
              .toFixed(2)
          )
        : null;

    return {
      totalCustomers,
      activeCustomersCount: activeCustomers.length,
      churnedCustomersCount: churnedCustomers.length,
      atRiskActiveCount: atRiskActiveCustomers.length,
      totalRevenue,
      activeRetainedRevenue,
      mrr,
      arpcCumulative,
      arpcMonthly,
      revenueAtRisk,
      mrrAtRisk,
      estimatedLostRevenue,
      lostMonthlyRunRate,
      hasAnyCostData: customersWithCost.length > 0,
      customersWithCostCount: customersWithCost.length,
      profitableCount: profitableCustomers.length,
      lossMakingCount: lossMakingCustomers.length,
      breakEvenCount: breakEvenCustomers.length,
      totalNetProfit
    };
  }, [filteredCustomers]);

  // 1. Monthly / Tenure Cohort Revenue Trend Chart (Requirement 3)
  const monthlyRevenueTrendData = useMemo(() => {
    const cohorts = [
      { period: '1–3 Mo', min: 0, max: 3 },
      { period: '4–6 Mo', min: 4, max: 6 },
      { period: '7–12 Mo', min: 7, max: 12 },
      { period: '13–24 Mo', min: 13, max: 24 },
      { period: '25–48 Mo', min: 25, max: 48 },
      { period: '49+ Mo', min: 49, max: 999 }
    ];

    return cohorts.map((cohort) => {
      const matching = filteredCustomers.filter(
        (c) => c.tenure >= cohort.min && c.tenure <= cohort.max
      );
      const activeHealthyRev = Number(
        matching
          .filter((c) => !c.isChurned && !c.isAtRiskActive)
          .reduce((sum, c) => sum + c.revenue, 0)
          .toFixed(2)
      );
      const atRiskRev = Number(
        matching
          .filter((c) => c.isAtRiskActive)
          .reduce((sum, c) => sum + c.revenueAtRisk, 0)
          .toFixed(2)
      );
      const lostRev = Number(
        matching
          .filter((c) => c.isChurned)
          .reduce((sum, c) => sum + c.historicalLostRevenue, 0)
          .toFixed(2)
      );
      const cohortMrr = Number(
        matching
          .filter((c) => !c.isChurned)
          .reduce((sum, c) => sum + c.monthlyCharges, 0)
          .toFixed(2)
      );
      return {
        period: cohort.period,
        retainedRevenue: activeHealthyRev,
        revenueAtRisk: atRiskRev,
        lostRevenue: lostRev,
        mrr: cohortMrr,
        accounts: matching.length
      };
    });
  }, [filteredCustomers]);

  // 2. Revenue Distribution by Customer Billing Bracket (Requirement 3)
  const revenueDistributionByCustomer = useMemo(() => {
    const brackets = [
      { tier: '< $35/mo', min: 0, max: 34.99 },
      { tier: '$35–$59/mo', min: 35, max: 59.99 },
      { tier: '$60–$79/mo', min: 60, max: 79.99 },
      { tier: '$80–$99/mo', min: 80, max: 99.99 },
      { tier: '$100+/mo', min: 100, max: 99999 }
    ];
    return brackets.map((b) => {
      const group = filteredCustomers.filter(
        (c) => c.monthlyCharges >= b.min && c.monthlyCharges <= b.max
      );
      return {
        tier: b.tier,
        totalRevenue: Number(group.reduce((s, c) => s + c.revenue, 0).toFixed(2)),
        mrr: Number(
          group
            .filter((c) => !c.isChurned)
            .reduce((s, c) => s + c.monthlyCharges, 0)
            .toFixed(2)
        ),
        customers: group.length
      };
    });
  }, [filteredCustomers]);

  // 3. Revenue by Contract Type (Requirement 3 & 5)
  const revenueByContract = useMemo(() => {
    const types = ['Month-to-month', 'One year', 'Two year'];
    return types.map((contract) => {
      const group = filteredCustomers.filter(
        (c) => c.contract.toLowerCase() === contract.toLowerCase()
      );
      const totalRevenue = Number(group.reduce((s, c) => s + c.revenue, 0).toFixed(2));
      const retainedRevenue = Number(
        group
          .filter((c) => !c.isChurned && !c.isAtRiskActive)
          .reduce((s, c) => s + c.revenue, 0)
          .toFixed(2)
      );
      const revenueAtRisk = Number(
        group.reduce((s, c) => s + c.revenueAtRisk, 0).toFixed(2)
      );
      const lostRevenue = Number(
        group.reduce((s, c) => s + c.historicalLostRevenue, 0).toFixed(2)
      );
      return {
        contract,
        totalRevenue,
        retainedRevenue,
        revenueAtRisk,
        lostRevenue,
        customers: group.length
      };
    });
  }, [filteredCustomers]);

  // 4. Revenue by Payment Method (Requirement 3)
  const revenueByPayment = useMemo(() => {
    const map = new Map<
      string,
      { method: string; totalRevenue: number; mrr: number; revenueAtRisk: number; lostRevenue: number; count: number }
    >();
    filteredCustomers.forEach((c) => {
      const key = c.payment || 'Other';
      const existing = map.get(key) || {
        method: key,
        totalRevenue: 0,
        mrr: 0,
        revenueAtRisk: 0,
        lostRevenue: 0,
        count: 0
      };
      existing.totalRevenue = Number((existing.totalRevenue + c.revenue).toFixed(2));
      if (!c.isChurned) {
        existing.mrr = Number((existing.mrr + c.monthlyCharges).toFixed(2));
      }
      existing.revenueAtRisk = Number((existing.revenueAtRisk + c.revenueAtRisk).toFixed(2));
      existing.lostRevenue = Number((existing.lostRevenue + c.historicalLostRevenue).toFixed(2));
      existing.count += 1;
      map.set(key, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredCustomers]);

  // 5. Revenue by Internet Service (Requirement 3)
  const revenueByInternet = useMemo(() => {
    const services = ['Fiber optic', 'DSL', 'No'];
    return services.map((service) => {
      const group = filteredCustomers.filter(
        (c) => c.internet.toLowerCase() === service.toLowerCase()
      );
      const totalRevenue = Number(group.reduce((s, c) => s + c.revenue, 0).toFixed(2));
      const mrr = Number(
        group
          .filter((c) => !c.isChurned)
          .reduce((s, c) => s + c.monthlyCharges, 0)
          .toFixed(2)
      );
      const revenueAtRisk = Number(group.reduce((s, c) => s + c.revenueAtRisk, 0).toFixed(2));
      return {
        service: service === 'No' ? 'No Internet (Phone Only)' : service,
        totalRevenue,
        mrr,
        revenueAtRisk,
        customers: group.length
      };
    });
  }, [filteredCustomers]);

  // 6. Revenue Contribution by Customer Segment (Requirement 3 & 5)
  const revenueBySegment = useMemo(() => {
    const segments: Array<'High-Value ($80+/mo)' | 'Mid-Market ($45–$79/mo)' | 'Standard (<$45/mo)'> = [
      'High-Value ($80+/mo)',
      'Mid-Market ($45–$79/mo)',
      'Standard (<$45/mo)'
    ];
    return segments.map((segment) => {
      const group = filteredCustomers.filter((c) => c.segment === segment);
      const totalRevenue = Number(group.reduce((s, c) => s + c.revenue, 0).toFixed(2));
      const mrr = Number(
        group
          .filter((c) => !c.isChurned)
          .reduce((s, c) => s + c.monthlyCharges, 0)
          .toFixed(2)
      );
      const revenueAtRisk = Number(group.reduce((s, c) => s + c.revenueAtRisk, 0).toFixed(2));
      const lostRevenue = Number(
        group.reduce((s, c) => s + c.historicalLostRevenue, 0).toFixed(2)
      );
      const sharePct =
        kpis.totalRevenue > 0
          ? Number(((totalRevenue / kpis.totalRevenue) * 100).toFixed(1))
          : 0;
      return {
        segment,
        totalRevenue,
        mrr,
        revenueAtRisk,
        lostRevenue,
        combinedExposure: Number((revenueAtRisk + lostRevenue).toFixed(2)),
        sharePct,
        customers: group.length
      };
    });
  }, [filteredCustomers, kpis.totalRevenue]);

  // 7. Top Revenue-Generating Customers (Requirement 3)
  const topRevenueCustomers = useMemo(() => {
    return [...filteredCustomers]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [filteredCustomers]);

  // 8. Customers with Declining Revenue / Usage Drop (Requirement 3 & 5)
  const decliningRevenueCustomers = useMemo(() => {
    return [...filteredCustomers]
      .filter((c) => (c.usageDrop !== null && c.usageDrop >= 10) || c.isAtRiskActive)
      .sort((a, b) => (b.usageDrop ?? 0) - (a.usageDrop ?? 0) || b.monthlyCharges - a.monthlyCharges)
      .slice(0, 6);
  }, [filteredCustomers]);

  // Quantified Potential Revenue Recovery Opportunities (Requirement 5)
  const recoveryOpportunities = useMemo(() => {
    const mtmAtRisk = filteredCustomers.filter(
      (c) => c.isAtRiskActive && c.contract === 'Month-to-month'
    );
    const mtmRecoverableRev = Number(
      mtmAtRisk.reduce((s, c) => s + c.revenueAtRisk, 0).toFixed(2)
    );
    const mtmRecoverableMrr = Number(
      mtmAtRisk.reduce((s, c) => s + c.mrrAtRisk, 0).toFixed(2)
    );

    const echeckAtRisk = filteredCustomers.filter(
      (c) => c.isAtRiskActive && !c.payment.toLowerCase().includes('automatic')
    );
    const echeckRecoverableRev = Number(
      echeckAtRisk.reduce((s, c) => s + c.revenueAtRisk, 0).toFixed(2)
    );
    const echeckRecoverableMrr = Number(
      echeckAtRisk.reduce((s, c) => s + c.mrrAtRisk, 0).toFixed(2)
    );

    const fiberAtRisk = filteredCustomers.filter(
      (c) => c.isAtRiskActive && c.internet === 'Fiber optic'
    );
    const fiberRecoverableRev = Number(
      fiberAtRisk.reduce((s, c) => s + c.revenueAtRisk, 0).toFixed(2)
    );
    const fiberRecoverableMrr = Number(
      fiberAtRisk.reduce((s, c) => s + c.mrrAtRisk, 0).toFixed(2)
    );

    return [
      {
        id: 'opp-contract',
        title: 'Convert At-Risk Month-to-Month Accounts to 1-Year Plans',
        accountsCount: mtmAtRisk.length,
        revenueProtected: mtmRecoverableRev,
        mrrProtected: mtmRecoverableMrr,
        mechanism:
          'Annual contract commitment reduces cancellation risk by ~31% on average across active month-to-month accounts.'
      },
      {
        id: 'opp-autopay',
        title: 'Migrate Manual Check Payers to Automatic Billing',
        accountsCount: echeckAtRisk.length,
        revenueProtected: echeckRecoverableRev,
        mrrProtected: echeckRecoverableMrr,
        mechanism:
          'Removing manual monthly check friction lowers involuntary and impulse churn on high-bill accounts.'
      },
      {
        id: 'opp-fiber',
        title: 'Bundle Tech Support & Security for High-Bill Fiber Accounts',
        accountsCount: fiberAtRisk.length,
        revenueProtected: fiberRecoverableRev,
        mrrProtected: fiberRecoverableMrr,
        mechanism:
          'Adding complimentary support & security add-ons stabilizes price-sensitive fiber optic subscribers.'
      }
    ];
  }, [filteredCustomers]);

  // Customer Profitability Table Search + Sort (Requirement 4)
  const profitabilityTableRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    const searched = q
      ? filteredCustomers.filter(
          (c) =>
            c.id.toLowerCase().includes(q) ||
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.contract.toLowerCase().includes(q) ||
            c.payment.toLowerCase().includes(q) ||
            c.financialStatus.toLowerCase().includes(q)
        )
      : filteredCustomers;

    return [...searched].sort((a, b) => {
      if (tableSortBy === 'revenue-desc') return b.revenue - a.revenue;
      if (tableSortBy === 'revenue-asc') return a.revenue - b.revenue;
      if (tableSortBy === 'monthly-desc') return b.monthlyCharges - a.monthlyCharges;
      if (tableSortBy === 'profit-desc') {
        if (a.estimatedProfit === null && b.estimatedProfit === null) return b.revenue - a.revenue;
        if (a.estimatedProfit === null) return 1;
        if (b.estimatedProfit === null) return -1;
        return b.estimatedProfit - a.estimatedProfit;
      }
      if (tableSortBy === 'profit-asc') {
        if (a.estimatedProfit === null && b.estimatedProfit === null) return a.revenue - b.revenue;
        if (a.estimatedProfit === null) return 1;
        if (b.estimatedProfit === null) return -1;
        return a.estimatedProfit - b.estimatedProfit;
      }
      if (tableSortBy === 'margin-desc') {
        if (a.profitMargin === null && b.profitMargin === null) return b.revenue - a.revenue;
        if (a.profitMargin === null) return 1;
        if (b.profitMargin === null) return -1;
        return b.profitMargin - a.profitMargin;
      }
      if (tableSortBy === 'risk-desc') return b.probability - a.probability;
      if (tableSortBy === 'name-asc') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [filteredCustomers, tableSearch, tableSortBy]);

  // Selected Customer for Customer-Level Financial Details (Requirement 6)
  const selectedFinancialCustomer = useMemo(() => {
    return (
      filteredCustomers.find((c) => c.id === selectedCustomerId) ||
      enrichedCustomers.find((c) => c.id === selectedCustomerId) ||
      filteredCustomers[0] ||
      enrichedCustomers[0] ||
      null
    );
  }, [filteredCustomers, enrichedCustomers, selectedCustomerId]);

  const selectedCustomerMlInsights = useMemo(() => {
    if (!selectedFinancialCustomer) return null;
    return buildIndividualCustomerAnalysis(
      selectedFinancialCustomer.raw,
      allDatasetCustomers,
      thresholds,
      activeModelKey
    );
  }, [selectedFinancialCustomer, allDatasetCustomers, thresholds, activeModelKey]);

  // Empty Dataset Guard (Requirement 2 & 10)
  if (!activeDataset || allDatasetCustomers.length === 0) {
    return (
      <Card className="p-10 text-center space-y-3">
        <h2 className="type-card-title">No Customer Data Loaded</h2>
        <p className="type-subheading">
          Please upload customer data in the Customer Data section to use this feature.
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={onNavigateToDatasets}
          className="bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Open Customer Data
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ========================================== */}
      {/* 1. FILTERS BAR (Requirement 7)             */}
      {/* ========================================== */}
      <Card variant="elevated" className="p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="type-card-title">Financial & Cohort Filters</h2>
            <p className="type-subheading">
              Showing {filteredCustomers.length.toLocaleString()} of{' '}
              {enrichedCustomers.length.toLocaleString()} unique customer accounts from{' '}
              <span className="text-[var(--text-primary)] font-medium">{activeDataset.name}</span>.
            </p>
          </div>
          {hasActiveFilters && (
            <Button variant="secondary" size="sm" onClick={resetAllFilters}>
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-1">
          <div>
            <label className="block type-label mb-1">Date / Tenure Range</label>
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              aria-label="Filter by Date or Tenure Range"
              className="w-full h-9 px-2.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Time (All Tenures)</option>
              <option value="Last 3 Months">Last 3 Months (≤ 3m)</option>
              <option value="Last 6 Months">Last 6 Months (≤ 6m)</option>
              <option value="Last 12 Months">Last 12 Months (≤ 12m)</option>
              <option value="1–2 Years">1–2 Years (13–24m)</option>
              <option value="Long-Term (24m+)">Long-Term (24m+)</option>
            </select>
          </div>

          <div>
            <label className="block type-label mb-1">Contract Type</label>
            <select
              value={contractFilter}
              onChange={(e) => setContractFilter(e.target.value)}
              aria-label="Filter by Contract Type"
              className="w-full h-9 px-2.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Contracts</option>
              <option value="Month-to-month">Month-to-month</option>
              <option value="One year">One year</option>
              <option value="Two year">Two year</option>
            </select>
          </div>

          <div>
            <label className="block type-label mb-1">Customer Segment</label>
            <select
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value)}
              aria-label="Filter by Customer Segment"
              className="w-full h-9 px-2.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Segments</option>
              <option value="High-Value ($80+/mo)">High-Value ($80+/mo)</option>
              <option value="Mid-Market ($45–$79/mo)">Mid-Market ($45–$79/mo)</option>
              <option value="Standard (<$45/mo)">Standard (&lt;$45/mo)</option>
              <option value="Senior Citizens">Senior Citizens</option>
              <option value="Family / Dependents">Family / Dependents</option>
            </select>
          </div>

          <div>
            <label className="block type-label mb-1">Risk Level</label>
            <select
              value={riskLevelFilter}
              onChange={(e) => setRiskLevelFilter(e.target.value)}
              aria-label="Filter by Risk Level"
              className="w-full h-9 px-2.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Risk Levels</option>
              <option value="High Risk">High Risk (≥ {thresholds.high}%)</option>
              <option value="Medium Risk">Medium Risk ({thresholds.medium}–{thresholds.high - 1}%)</option>
              <option value="Low Risk">Low Risk (&lt; {thresholds.medium}%)</option>
            </select>
          </div>

          <div>
            <label className="block type-label mb-1">Financial Status</label>
            <select
              value={financialStatusFilter}
              onChange={(e) => setFinancialStatusFilter(e.target.value)}
              aria-label="Filter by Financial Status"
              className="w-full h-9 px-2.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Statuses</option>
              <option value="Profitable">Profitable</option>
              <option value="Break-even">Break-even</option>
              <option value="Loss-making">Loss-making</option>
              <option value="Insufficient Data">Insufficient Data (No Cost)</option>
            </select>
          </div>

          <div>
            <label className="block type-label mb-1">Payment Method</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              aria-label="Filter by Payment Method"
              className="w-full h-9 px-2.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Payment Methods</option>
              <option value="Electronic check">Electronic check</option>
              <option value="Mailed check">Mailed check</option>
              <option value="Bank transfer (automatic)">Bank transfer (automatic)</option>
              <option value="Credit card (automatic)">Credit card (automatic)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ========================================== */}
      {/* 2. REVENUE OVERVIEW DASHBOARD (7 KPIs)     */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <Card variant="cyan" className="p-4 flex flex-col justify-between">
          <div>
            <span className="type-label">Total Revenue</span>
            <h3 className="type-metric mt-1.5 text-cyan-400">
              {formatCompactCurrency(kpis.totalRevenue)}
            </h3>
          </div>
          <p className="type-subheading mt-2">
            Cumulative billed revenue across {kpis.totalCustomers} unique accounts.
          </p>
        </Card>

        <Card variant="indigo" className="p-4 flex flex-col justify-between">
          <div>
            <span className="type-label">Monthly Recurring (MRR)</span>
            <h3 className="type-metric mt-1.5 text-indigo-300">
              {formatCurrency(kpis.mrr)}
            </h3>
          </div>
          <p className="type-subheading mt-2">
            Active monthly billing from {kpis.activeCustomersCount} non-churned accounts.
          </p>
        </Card>

        <Card variant="secondary" className="p-4 flex flex-col justify-between">
          <div>
            <span className="type-label">Avg Revenue / Customer</span>
            <h3 className="type-metric mt-1.5 text-[var(--text-primary)]">
              {formatCurrency(kpis.arpcCumulative)}
            </h3>
          </div>
          <p className="type-subheading mt-2">
            ARPC lifetime ({formatCurrency(kpis.arpcMonthly)}/mo active average).
          </p>
        </Card>

        <Card variant="amber" className="p-4 flex flex-col justify-between">
          <div>
            <span className="type-label">Revenue at Risk (Est.)</span>
            <h3 className="type-metric mt-1.5 text-amber-400">
              {formatCompactCurrency(kpis.revenueAtRisk)}
            </h3>
          </div>
          <p className="type-subheading mt-2">
            Predicted future risk across {kpis.atRiskActiveCount} active at-risk accounts ({formatCurrency(kpis.mrrAtRisk)}/mo).
          </p>
        </Card>

        <Card variant="rose" className="p-4 flex flex-col justify-between">
          <div>
            <span className="type-label">Estimated Lost Revenue</span>
            <h3 className="type-metric mt-1.5 text-rose-400">
              {formatCompactCurrency(kpis.estimatedLostRevenue)}
            </h3>
          </div>
          <p className="type-subheading mt-2">
            Historical billed revenue from {kpis.churnedCustomersCount} already-churned accounts ({formatCurrency(kpis.lostMonthlyRunRate)}/mo lost).
          </p>
        </Card>

        <Card variant="emerald" className="p-4 flex flex-col justify-between">
          <div>
            <span className="type-label">Profitable Customers</span>
            <h3 className="type-metric mt-1.5 text-emerald-400">
              {kpis.hasAnyCostData ? kpis.profitableCount.toLocaleString() : 'N/A'}
            </h3>
          </div>
          <p className="type-subheading mt-2">
            {kpis.hasAnyCostData
              ? `${kpis.profitableCount} of ${kpis.customersWithCostCount} accounts with positive net profit.`
              : 'Cost data unavailable in current dataset.'}
          </p>
        </Card>

        <Card variant="rose" className="p-4 flex flex-col justify-between">
          <div>
            <span className="type-label">Loss-Making Customers</span>
            <h3 className="type-metric mt-1.5 text-rose-400">
              {kpis.hasAnyCostData ? kpis.lossMakingCount.toLocaleString() : 'N/A'}
            </h3>
          </div>
          <p className="type-subheading mt-2">
            {kpis.hasAnyCostData
              ? `${kpis.lossMakingCount} accounts where total cost exceeds billed revenue.`
              : 'Cost data unavailable — profit not assumed.'}
          </p>
        </Card>
      </div>

      {/* Honest Data Transparency Notice when Cost column is not in the uploaded dataset */}
      {!kpis.hasAnyCostData && (
        <Card variant="amber" className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-medium text-[var(--text-primary)]">
                Cost Data Unavailable in Active Dataset ({activeDataset.name})
              </p>
              <p className="type-subheading mt-0.5">
                Clario does not treat Monthly Charges as profit or invent operating costs. Revenue, MRR, ARPC, Revenue at Risk, and Historical Lost Revenue are calculated from actual billing records. Upload a CSV with a <code className="font-mono text-xs">cost</code> or <code className="font-mono text-xs">monthlyCost</code> column in Customer Data to compute net profit and profit margins.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================== */}
      {/* 3. REVENUE ANALYSIS CHARTS (Requirement 3) */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly / Tenure Cohort Revenue Trajectory */}
        <Card variant="primary" className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="type-card-title">Revenue Trajectory Across Customer Tenure Cohorts</h2>
              <p className="type-subheading">
                 compares healthy retained revenue, predicted revenue at risk, and historical lost revenue.
              </p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="period" stroke="var(--chart-text)" fontSize={12} />
                <YAxis
                  stroke="var(--chart-text)"
                  fontSize={12}
                  tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                />
                <Tooltip
                  formatter={(value: any, name: string) => [formatCurrency(Number(value)), name]}
                  contentStyle={{
                    backgroundColor: 'var(--chart-tooltip-bg)',
                    borderColor: 'var(--chart-tooltip-border)',
                    borderRadius: '0.75rem',
                    color: 'var(--chart-tooltip-text)',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: 'var(--chart-tooltip-text)', fontSize: '12px', fontWeight: 500 }}
                  labelStyle={{ color: 'var(--chart-tooltip-text)', fontSize: '12px', fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="retainedRevenue"
                  name="Retained Active Revenue"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.16}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="revenueAtRisk"
                  name="Predicted Revenue at Risk"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  fillOpacity={0.14}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="lostRevenue"
                  name="Historical Lost Revenue"
                  stroke="#F43F5E"
                  fill="#F43F5E"
                  fillOpacity={0.12}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: Revenue Distribution by Customer Billing Bracket */}
        <Card variant="primary" className="p-5 space-y-4">
          <div>
            <h2 className="type-card-title">Revenue Distribution by Monthly Billing Tier</h2>
            <p className="type-subheading">
              Cumulative billed revenue and active MRR grouped by customer monthly billing brackets.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueDistributionByCustomer} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="tier" stroke="var(--chart-text)" fontSize={12} />
                <YAxis
                  stroke="var(--chart-text)"
                  fontSize={12}
                  tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                />
                <Tooltip
                  formatter={(value: any, name: string) => [formatCurrency(Number(value)), name]}
                  contentStyle={{
                    backgroundColor: 'var(--chart-tooltip-bg)',
                    borderColor: 'var(--chart-tooltip-border)',
                    borderRadius: '0.75rem',
                    color: 'var(--chart-tooltip-text)',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: 'var(--chart-tooltip-text)', fontSize: '12px', fontWeight: 500 }}
                  labelStyle={{ color: 'var(--chart-tooltip-text)', fontSize: '12px', fontWeight: 600 }}
                />
                <Bar
                  dataKey="totalRevenue"
                  name="Cumulative Revenue"
                  fill="#6366F1"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="mrr"
                  name="Active Monthly Recurring (MRR)"
                  fill="#10B981"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 3: Revenue by Contract Type */}
        <Card variant="primary" className="p-5 space-y-4">
          <div>
            <h2 className="type-card-title">Revenue & Loss Exposure by Contract Type</h2>
            <p className="type-subheading">
              Compares retained active revenue, future revenue at risk, and historical lost revenue per contract.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByContract} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="contract" stroke="var(--chart-text)" fontSize={12} />
                <YAxis
                  stroke="var(--chart-text)"
                  fontSize={12}
                  tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                />
                <Tooltip
                  formatter={(value: any, name: string) => [formatCurrency(Number(value)), name]}
                  contentStyle={{
                    backgroundColor: 'var(--chart-tooltip-bg)',
                    borderColor: 'var(--chart-tooltip-border)',
                    borderRadius: '0.75rem',
                    color: 'var(--chart-tooltip-text)',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: 'var(--chart-tooltip-text)', fontSize: '12px', fontWeight: 500 }}
                  labelStyle={{ color: 'var(--chart-tooltip-text)', fontSize: '12px', fontWeight: 600 }}
                />
                <Bar
                  dataKey="retainedRevenue"
                  name="Retained Active Revenue"
                  fill="#10B981"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="revenueAtRisk"
                  name="Revenue at Risk (Est.)"
                  fill="#F59E0B"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="lostRevenue"
                  name="Historical Lost Revenue"
                  fill="#F43F5E"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 4: Revenue by Payment Method */}
        <Card variant="primary" className="p-5 space-y-4">
          <div>
            <h2 className="type-card-title">Revenue by Payment Method</h2>
            <p className="type-subheading">
              Total revenue, active MRR, and at-risk revenue across customer billing methods.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByPayment} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis
                  type="number"
                  stroke="var(--chart-text)"
                  fontSize={12}
                  tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                />
                <YAxis type="category" dataKey="method" stroke="var(--chart-text)" fontSize={11} width={145} />
                <Tooltip
                  formatter={(value: any, name: string) => [formatCurrency(Number(value)), name]}
                  contentStyle={{
                    backgroundColor: 'var(--chart-tooltip-bg)',
                    borderColor: 'var(--chart-tooltip-border)',
                    borderRadius: '0.75rem',
                    color: 'var(--chart-tooltip-text)',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: 'var(--chart-tooltip-text)', fontSize: '12px', fontWeight: 500 }}
                  labelStyle={{ color: 'var(--chart-tooltip-text)', fontSize: '12px', fontWeight: 600 }}
                />
                <Bar dataKey="totalRevenue" name="Total Revenue" fill="#6366F1" radius={[0, 6, 6, 0]} />
                <Bar dataKey="revenueAtRisk" name="Revenue at Risk" fill="#F59E0B" radius={[0, 6, 6, 0]} />
                <Bar dataKey="lostRevenue" name="Historical Lost Revenue" fill="#F43F5E" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 5: Revenue by Internet Service */}
        <Card variant="primary" className="p-5 space-y-4">
          <div>
            <h2 className="type-card-title">Revenue by Internet Service Plan</h2>
            <p className="type-subheading">
              Cumulative revenue, active monthly recurring billing, and at-risk exposure by internet tier.
            </p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByInternet} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="service" stroke="var(--chart-text)" fontSize={12} />
                <YAxis
                  stroke="var(--chart-text)"
                  fontSize={12}
                  tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                />
                <Tooltip
                  formatter={(value: any, name: string) => [formatCurrency(Number(value)), name]}
                  contentStyle={{
                    backgroundColor: 'var(--chart-tooltip-bg)',
                    borderColor: 'var(--chart-tooltip-border)',
                    borderRadius: '0.75rem',
                    color: 'var(--chart-tooltip-text)',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: 'var(--chart-tooltip-text)', fontSize: '12px', fontWeight: 500 }}
                  labelStyle={{ color: 'var(--chart-tooltip-text)', fontSize: '12px', fontWeight: 600 }}
                />
                <Bar dataKey="totalRevenue" name="Total Revenue" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="revenueAtRisk" name="Revenue at Risk" fill="#F43F5E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 6: Revenue Contribution by Customer Segment */}
        <Card variant="primary" className="p-5 space-y-4">
          <div>
            <h2 className="type-card-title">Revenue Contribution by Customer Segment</h2>
            <p className="type-subheading">
              Breakdown of cumulative revenue share, active MRR, and churn risk exposure across segments.
            </p>
          </div>
          <div className="space-y-3 pt-1">
            {revenueBySegment.map((seg) => (
              <div
                key={seg.segment}
                className="p-3.5 rounded-lg bg-[var(--bg-card-secondary)] border border-[var(--border-subtle)] space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[13px] font-semibold text-[var(--text-primary)]">
                      {seg.segment}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)] ml-2">
                      · {seg.customers} accounts ({seg.sharePct}% of total revenue)
                    </span>
                  </div>
                  <span className="text-[13px] font-semibold tabular-nums text-emerald-400">
                    {formatCurrency(seg.totalRevenue)}
                  </span>
                </div>
                <div className="w-full h-2 bg-[var(--bg-app)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(4, seg.sharePct))}%` }}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-secondary)] tabular-nums">
                  <span>Active MRR: {formatCurrency(seg.mrr)}/mo</span>
                  <span className="text-amber-400">
                    At-Risk (Est.): {formatCurrency(seg.revenueAtRisk)}
                  </span>
                  <span className="text-rose-400">
                    Historical Lost: {formatCurrency(seg.lostRevenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ========================================== */}
      {/* 4. TOP REVENUE CUSTOMERS & DECLINING REV   */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Revenue-Generating Customers */}
        <Card variant="primary" className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="type-card-title">Top Revenue-Generating Customers</h2>
              <p className="type-subheading">
                Highest cumulative billed revenue contributors in the current filtered view.
              </p>
            </div>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {topRevenueCustomers.length === 0 ? (
              <p className="type-subheading py-6 text-center">No matching customers in current filter.</p>
            ) : (
              topRevenueCustomers.map((cust, index) => (
                <div
                  key={cust.id}
                  className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[var(--text-secondary)]">
                        0{index + 1}.
                      </span>
                      <button
                        type="button"
                        onClick={() => onAnalyseCustomer(cust.id)}
                        className="text-[13px] font-semibold text-[var(--text-primary)] hover:text-indigo-400 transition cursor-pointer truncate"
                      >
                        {cust.name}
                      </button>
                      <span className="text-xs font-mono text-[var(--text-secondary)]">
                        {cust.id}
                      </span>
                    </div>
                    <p className="type-subheading mt-0.5">
                      {cust.contract} · {cust.tenure} mo tenure · {formatCurrency(cust.monthlyCharges)}/mo
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[13px] font-semibold tabular-nums text-emerald-400 block">
                        {formatCurrency(cust.revenue)}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)] tabular-nums">
                        {cust.probability}% risk
                      </span>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onAnalyseCustomer(cust.id)}
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Inspect</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Customers with Declining Revenue / Usage Drop */}
        <Card variant="primary" className="p-5 space-y-4">
          <div>
            <h2 className="type-card-title">Customers with Declining Activity & Revenue Risk</h2>
            <p className="type-subheading">
              Accounts showing recent usage drops or elevated cancellation risk requiring retention action.
            </p>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {decliningRevenueCustomers.length === 0 ? (
              <p className="type-subheading py-6 text-center">
                No accounts with declining usage or elevated risk in current filter.
              </p>
            ) : (
              decliningRevenueCustomers.map((cust) => (
                <div
                  key={cust.id}
                  className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onAnalyseCustomer(cust.id)}
                        className="text-[13px] font-semibold text-[var(--text-primary)] hover:text-indigo-400 transition cursor-pointer truncate"
                      >
                        {cust.name}
                      </button>
                      <span className="text-xs font-mono text-[var(--text-secondary)]">
                        {cust.id}
                      </span>
                      <ChurnStatusBadge status={cust.churnStatus} />
                    </div>
                    <p className="type-subheading mt-0.5">
                      {cust.usageDrop !== null
                        ? `${cust.usageDrop}% usage drop recorded`
                        : 'Usage drop N/A'}{' '}
                      · Bill: {formatCurrency(cust.monthlyCharges)}/mo · Cumulative: {formatCurrency(cust.revenue)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right">
                      <span className="text-[13px] font-semibold tabular-nums text-rose-400 block">
                        {formatCurrency(cust.isChurned ? cust.historicalLostRevenue : cust.revenue)}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {cust.isChurned ? 'Lost Revenue' : 'At-Risk Exposure'}
                      </span>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onAnalyseCustomer(cust.id)}
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Inspect</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* ========================================== */}
      {/* 5. REVENUE LOSS & RECOVERY ANALYSIS        */}
      {/* ========================================== */}
      <Card variant="elevated" className="p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-4">
          <div>
            <h2 className="type-section-title">Revenue Loss & Future Risk Analysis</h2>
            <p className="type-subheading mt-0.5">
              Strictly separates historical revenue lost from already-churned accounts vs. predicted future revenue at risk among active accounts.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Actual Historical Revenue Loss */}
          <div className="p-4 rounded-xl bg-[var(--bg-card-secondary)] border border-rose-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="type-label text-rose-400">Actual Historical Loss (Churned Accounts)</span>
              <TrendingDown className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex items-baseline gap-3">
              <h3 className="type-metric text-rose-400">
                {formatCurrency(kpis.estimatedLostRevenue)}
              </h3>
              <span className="text-xs text-[var(--text-secondary)] tabular-nums">
                ({formatCurrency(kpis.lostMonthlyRunRate)}/mo recurring billing lost)
              </span>
            </div>
            <p className="type-subheading">
              Derived from {kpis.churnedCustomersCount} customers with status <strong className="font-medium text-[var(--text-primary)]">Churned</strong>. Excluded from active MRR and excluded from predicted future risk to prevent double-counting.
            </p>
          </div>

          {/* Predicted Future Revenue Risk */}
          <div className="p-4 rounded-xl bg-[var(--bg-card-secondary)] border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="type-label text-amber-400">Predicted Future Revenue Risk (Active At-Risk)</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-3">
              <h3 className="type-metric text-amber-400">
                {formatCurrency(kpis.revenueAtRisk)}
              </h3>
              <span className="text-xs text-[var(--text-secondary)] tabular-nums">
                ({formatCurrency(kpis.mrrAtRisk)}/mo active MRR at risk)
              </span>
            </div>
            <p className="type-subheading">
              Derived from {kpis.atRiskActiveCount} currently active accounts with churn probability ≥ {thresholds.high}% or marked <strong className="font-medium text-[var(--text-primary)]">At-Risk</strong>. Recoverable through targeted retention outreach.
            </p>
          </div>
        </div>

        {/* Quantified Revenue Recovery Opportunities */}
        <div className="space-y-3 pt-1">
          <h3 className="type-card-title">Potential Revenue Recovery Opportunities (Estimated)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recoveryOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="p-4 rounded-xl bg-[var(--bg-card-secondary)] border border-[var(--border-subtle)] flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-indigo-400">
                      {opp.accountsCount} At-Risk Account{opp.accountsCount === 1 ? '' : 's'}
                    </span>
                    <span className="text-xs font-semibold tabular-nums text-emerald-400">
                      Est. {formatCurrency(opp.mrrProtected)}/mo
                    </span>
                  </div>
                  <h4 className="text-[14px] font-semibold text-[var(--text-primary)] leading-snug">
                    {opp.title}
                  </h4>
                  <p className="type-subheading">{opp.mechanism}</p>
                </div>
                <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Protected Cumulative Revenue:</span>
                  <span className="font-semibold tabular-nums text-emerald-400">
                    {formatCurrency(opp.revenueProtected)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* ========================================== */}
      {/* 6. CUSTOMER-LEVEL FINANCIAL DETAILS        */}
      {/* ========================================== */}
      {selectedFinancialCustomer && (
        <Card variant="indigo" className="p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="type-section-title">
                  Customer Financial Profile — {selectedFinancialCustomer.name}
                </h2>
                <span className="text-xs font-mono text-[var(--text-secondary)]">
                  ({selectedFinancialCustomer.id})
                </span>
                <ChurnStatusBadge status={selectedFinancialCustomer.churnStatus} />
                <RiskBadge
                  probability={selectedFinancialCustomer.probability}
                  thresholds={thresholds}
                />
                <FinancialStatusBadge status={selectedFinancialCustomer.financialStatus} />
              </div>
              <p className="type-subheading mt-1">
                Individual financial record, billing history, cost & profit evaluation, and recommended retention action.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={selectedFinancialCustomer.id}
                onChange={(e) => onSelectCustomer(e.target.value)}
                aria-label="Select Customer for Financial Details"
                className="h-9 px-2.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
              >
                {filteredCustomers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.id}) — {formatCurrency(c.revenue)}
                  </option>
                ))}
              </select>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onAnalyseCustomer(selectedFinancialCustomer.id)}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Full Customer Analysis</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-3.5 rounded-lg bg-[var(--bg-card-secondary)] border border-[var(--border-subtle)]">
              <span className="type-label">Customer Revenue</span>
              <p className="text-lg font-bold tabular-nums text-emerald-400 mt-1">
                {formatCurrency(selectedFinancialCustomer.revenue)}
              </p>
              <span className="text-xs text-[var(--text-secondary)] block mt-0.5 tabular-nums">
                {formatCurrency(selectedFinancialCustomer.monthlyCharges)}/mo · {selectedFinancialCustomer.tenure} mo billed
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-[var(--bg-card-secondary)] border border-[var(--border-subtle)]">
              <span className="type-label">Estimated Cost</span>
              <p className="text-lg font-bold tabular-nums text-[var(--text-primary)] mt-1">
                {selectedFinancialCustomer.hasCostData &&
                selectedFinancialCustomer.estimatedCost !== null
                  ? formatCurrency(selectedFinancialCustomer.estimatedCost)
                  : 'Cost data unavailable'}
              </p>
              <span className="text-xs text-[var(--text-secondary)] block mt-0.5">
                {selectedFinancialCustomer.hasCostData
                  ? 'From dataset cost column'
                  : 'Not present in dataset'}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-[var(--bg-card-secondary)] border border-[var(--border-subtle)]">
              <span className="type-label">Estimated Profit & Margin</span>
              <p
                className={`text-lg font-bold tabular-nums mt-1 ${
                  selectedFinancialCustomer.hasCostData &&
                  selectedFinancialCustomer.estimatedProfit !== null
                    ? selectedFinancialCustomer.estimatedProfit >= 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                {selectedFinancialCustomer.hasCostData &&
                selectedFinancialCustomer.estimatedProfit !== null
                  ? `${formatCurrency(selectedFinancialCustomer.estimatedProfit)} (${selectedFinancialCustomer.profitMargin}%)`
                  : 'Cost data unavailable'}
              </p>
              <span className="text-xs text-[var(--text-secondary)] block mt-0.5">
                {selectedFinancialCustomer.hasCostData
                  ? 'Profit = Revenue − Total Cost'
                  : 'Profit not calculated without cost data'}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-[var(--bg-card-secondary)] border border-[var(--border-subtle)]">
              <span className="type-label">Churn Probability</span>
              <p
                className={`text-lg font-bold tabular-nums mt-1 ${
                  selectedFinancialCustomer.probability >= thresholds.high
                    ? 'text-rose-400'
                    : selectedFinancialCustomer.probability >= thresholds.medium
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {selectedFinancialCustomer.probability}%
              </p>
              <span className="text-xs text-[var(--text-secondary)] block mt-0.5">
                {selectedFinancialCustomer.contract} · {selectedFinancialCustomer.payment}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-[var(--bg-card-secondary)] border border-[var(--border-subtle)]">
              <span className="type-label">
                {selectedFinancialCustomer.isChurned
                  ? 'Historical Lost Revenue'
                  : 'Revenue at Risk (Est.)'}
              </span>
              <p
                className={`text-lg font-bold tabular-nums mt-1 ${
                  selectedFinancialCustomer.isChurned
                    ? 'text-rose-400'
                    : selectedFinancialCustomer.revenueAtRisk > 0
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {selectedFinancialCustomer.isChurned
                  ? formatCurrency(selectedFinancialCustomer.historicalLostRevenue)
                  : selectedFinancialCustomer.revenueAtRisk > 0
                  ? formatCurrency(selectedFinancialCustomer.revenueAtRisk)
                  : '$0.00 (Low Risk)'}
              </p>
              <span className="text-xs text-[var(--text-secondary)] block mt-0.5">
                {selectedFinancialCustomer.isChurned
                  ? 'Account has already churned'
                  : selectedFinancialCustomer.revenueAtRisk > 0
                  ? `${formatCurrency(selectedFinancialCustomer.mrrAtRisk)}/mo active MRR at risk`
                  : 'Healthy retained account'}
              </span>
            </div>
          </div>

          {/* Available Billing Summary & Recommended Retention Action */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[var(--bg-card-secondary)] border border-[var(--border-subtle)] space-y-2">
              <h3 className="type-card-title">Available Billing History & Service Attributes</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 text-xs">
                <div>
                  <span className="text-[var(--text-secondary)] block">Monthly Charge</span>
                  <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                    {formatCurrency(selectedFinancialCustomer.monthlyCharges)}/mo
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)] block">Total Billed Over Tenure</span>
                  <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                    {formatCurrency(selectedFinancialCustomer.revenue)} ({selectedFinancialCustomer.tenure} mo)
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)] block">Contract & Billing</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {selectedFinancialCustomer.contract}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)] block">Payment Method</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {selectedFinancialCustomer.payment}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)] block">Internet Service</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {selectedFinancialCustomer.internet}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)] block">Customer Segment</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {selectedFinancialCustomer.segment}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-card-secondary)] border border-[var(--border-subtle)] space-y-2">
              <h3 className="type-card-title">Recommended Retention & Revenue Action</h3>
              {selectedCustomerMlInsights?.recommendations?.[0] ? (
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-[var(--text-primary)]">
                      {selectedCustomerMlInsights.recommendations[0].title}
                    </span>
                    {selectedCustomerMlInsights.recommendations[0].riskReduction > 0 && (
                      <span className="text-xs font-semibold text-emerald-400 tabular-nums shrink-0">
                        −{selectedCustomerMlInsights.recommendations[0].riskReduction}% Risk
                      </span>
                    )}
                  </div>
                  <p className="type-subheading">
                    {selectedCustomerMlInsights.recommendations[0].reason}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] pt-1">
                    Projected Churn Risk After Action:{' '}
                    <strong className="text-[var(--text-primary)] tabular-nums">
                      {selectedCustomerMlInsights.recommendations[0].projectedRisk}%
                    </strong>{' '}
                    (Protecting {formatCurrency(selectedFinancialCustomer.monthlyCharges)}/mo in recurring billing).
                  </p>
                </div>
              ) : (
                <p className="type-subheading">
                  Maintain regular account check-ins to preserve recurring revenue.
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ========================================== */}
      {/* 7. CUSTOMER PROFITABILITY TABLE            */}
      {/* ========================================== */}
      <Card variant="primary" className="overflow-hidden">
        <div className="p-5 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="type-section-title">Customer Profitability Analysis</h2>
            <p className="type-subheading mt-0.5">
              Customer-level revenue, cost, profit, margin, and financial status. Click any customer row to inspect their financial details above.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search ID, name, contract..."
                aria-label="Search Customer Profitability Table"
                className="w-full h-9 pl-8 pr-7 bg-[var(--bg-card-secondary)] border border-[var(--border-subtle)] rounded-lg text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-indigo-500"
              />
              {tableSearch && (
                <button
                  type="button"
                  onClick={() => setTableSearch('')}
                  aria-label="Clear table search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={tableSortBy}
              onChange={(e) => setTableSortBy(e.target.value as any)}
              aria-label="Sort Customer Profitability Table"
              className="h-9 px-2.5 bg-[var(--bg-card-secondary)] border border-[var(--border-subtle)] rounded-lg text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
            >
              <option value="revenue-desc">Sort: Highest Revenue</option>
              <option value="revenue-asc">Sort: Lowest Revenue</option>
              <option value="monthly-desc">Sort: Highest Monthly Bill</option>
              <option value="profit-desc">Sort: Highest Profit</option>
              <option value="profit-asc">Sort: Lowest Profit</option>
              <option value="margin-desc">Sort: Highest Margin (%)</option>
              <option value="risk-desc">Sort: Highest Churn Risk</option>
              <option value="name-asc">Sort: Name (A–Z)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {profitabilityTableRows.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <p className="type-card-title">No Matching Customers Found</p>
              <p className="type-subheading">
                No customer records match your current search or filter criteria.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-[var(--bg-card-secondary)] text-[var(--text-secondary)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer ID</th>
                  <th className="px-4 py-3 font-medium">Customer Name</th>
                  <th className="px-4 py-3 font-medium text-right">Revenue</th>
                  <th className="px-4 py-3 font-medium text-right">Estimated Cost</th>
                  <th className="px-4 py-3 font-medium text-right">Estimated Profit</th>
                  <th className="px-4 py-3 font-medium text-right">Profit Margin</th>
                  <th className="px-4 py-3 font-medium">Financial Status</th>
                  <th className="px-4 py-3 font-medium">Churn Risk</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {profitabilityTableRows.map((row) => {
                  const isSelected = selectedFinancialCustomer?.id === row.id;
                  return (
                    <tr
                      key={row.id}
                      onClick={() => onSelectCustomer(row.id)}
                      className={`transition cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-500/15'
                          : 'hover:bg-[var(--bg-card-secondary)]/70'
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)] whitespace-nowrap">
                        {row.id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-[var(--text-primary)]">{row.name}</div>
                        <div className="text-xs text-[var(--text-secondary)]">
                          {row.contract} · {row.tenure} mo
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                        <div className="font-semibold text-[var(--text-primary)]">
                          {formatCurrency(row.revenue)}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)]">
                          {formatCurrency(row.monthlyCharges)}/mo
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap text-[var(--text-secondary)]">
                        {row.hasCostData && row.estimatedCost !== null
                          ? formatCurrency(row.estimatedCost)
                          : 'Cost data unavailable'}
                      </td>
                      <td
                        className={`px-4 py-3 text-right tabular-nums whitespace-nowrap font-medium ${
                          row.hasCostData && row.estimatedProfit !== null
                            ? row.estimatedProfit >= 0
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                            : 'text-[var(--text-secondary)] font-normal'
                        }`}
                      >
                        {row.hasCostData && row.estimatedProfit !== null
                          ? formatCurrency(row.estimatedProfit)
                          : 'Cost data unavailable'}
                      </td>
                      <td
                        className={`px-4 py-3 text-right tabular-nums whitespace-nowrap font-medium ${
                          row.hasCostData && row.profitMargin !== null
                            ? row.profitMargin >= 0
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                            : 'text-[var(--text-secondary)] font-normal'
                        }`}
                      >
                        {row.hasCostData && row.profitMargin !== null
                          ? `${row.profitMargin}%`
                          : 'Cost data unavailable'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <FinancialStatusBadge status={row.financialStatus} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold tabular-nums">{row.probability}%</span>
                          <RiskBadge probability={row.probability} thresholds={thresholds} />
                        </div>
                      </td>
                      <td
                        className="px-4 py-3 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onAnalyseCustomer(row.id)}
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Analyse</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
