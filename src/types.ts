export type CustomerStage = 'prospecting' | 'negotiating' | 'signed' | 'renewal';
export type BudgetSignal = 'healthy' | 'pressure' | 'unknown';
export type RiskLevel = 'low' | 'medium' | 'high';
export type SignalType = 'budget' | 'timeline' | 'intent' | 'risk' | 'competitor';
export type SignalPriority = 'urgent' | 'high' | 'medium' | 'low';
export type SignalStatus = 'pending' | 'confirmed' | 'ignored';
export type Channel = 'wechat' | 'phone' | 'email' | 'meeting';

export interface Customer {
  id: string;
  name: string;
  contact: string;
  industry: string;
  stage: CustomerStage;
  budgetSignal: BudgetSignal;
  riskLevel: RiskLevel;
  insights: string;
}

export interface Signal {
  id: string;
  customerId: string;
  type: SignalType;
  content: string;
  confidence: number;
  priority: SignalPriority;
  salesTip: string;
  status: SignalStatus;
  timestamp: Date;
}
