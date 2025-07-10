export interface Test {
  id: string;
  startDate: string;
  productName: string;
  niche: string;
  offerSource: string;
  landingPageUrl: string;
  investedAmount: number;
  clicks: number;
  returnValue: number;
  cpa: number;
  roi: number;
  roas: number;
  status: 'Escalar' | 'Pausar' | 'Encerrar';
  observations: string;
  createdAt: string;
  offerId?: string;
}

export interface Offer {
  id: string;
  name: string;
  libraryLink: string;
  landingPageLink: string;
  checkoutLink: string;
  niche: string;
  createdAt: string;
}

export interface FinancialData {
  initialCapital: number;
  currentBalance: number;
  totalInvestment: number;
  totalRevenue: number;
  netProfit: number;
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  type: 'investment' | 'revenue' | 'expense';
  amount: number;
  description: string;
  date: string;
  testId?: string;
}

export interface Metrics {
  totalInvestment: number;
  totalTests: number;
  successRate: number;
  netResult: number;
  avgROI: number;
  avgCPA: number;
}

export interface ChartData {
  date: string;
  roi: number;
  investment: number;
  revenue: number;
}