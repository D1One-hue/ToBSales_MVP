import { Customer, Signal } from './types';

export const mockCustomers: Customer[] = [
  {
    id: 'a1b2c3d4-0000-0000-0000-000000000001',
    name: '远航科技',
    contact: '张总 - 技术总监',
    industry: '企业服务 SaaS',
    stage: 'negotiating',
    budgetSignal: 'healthy',
    riskLevel: 'low',
    insights: '该客户正在积极寻找智能客服解决方案，目前使用竞品A但不满意响应速度。决策周期约2个月，预算充足，技术团队对我们的API集成方案很感兴趣。'
  },
  {
    id: 'a1b2c3d4-0000-0000-0000-000000000002',
    name: '聚合物流',
    contact: '李经理 - 运营负责人',
    industry: '物流运输',
    stage: 'prospecting',
    budgetSignal: 'pressure',
    riskLevel: 'medium',
    insights: '正在进行数字化转型，但预算有限。需要说服管理层ROI价值，关注成本控制。Q2有可能推进采购流程。'
  },
  {
    id: 'a1b2c3d4-0000-0000-0000-000000000003',
    name: '鼎盛零售',
    contact: '王VP - 信息化副总裁',
    industry: '零售连锁',
    stage: 'renewal',
    budgetSignal: 'unknown',
    riskLevel: 'high',
    insights: '现有客户，合同即将到期。最近提出多次服务问题，客户成功团队跟进中。竞品B正在接触，需要加强关系维护和价值展示。'
  }
];

export const mockSignals: Signal[] = [
  {
    id: 's1',
    customerId: 'a1b2c3d4-0000-0000-0000-000000000001',
    type: 'budget',
    content: '张总提到"公司刚完成B轮融资，今年在技术工具上的预算比去年增加了40%"',
    confidence: 95,
    priority: 'high',
    salesTip: '建议：现在是推进高价值方案的好时机，可以提出完整解决方案而非基础版',
    status: 'confirmed',
    timestamp: new Date('2024-03-28T10:30:00')
  },
  {
    id: 's2',
    customerId: 'a1b2c3d4-0000-0000-0000-000000000001',
    type: 'timeline',
    content: '客户要求"希望在Q2结束前完成系统上线，最好4月底前签约"',
    confidence: 92,
    priority: 'urgent',
    salesTip: '建议：立即准备合同和实施方案，强调我们的快速部署能力（2周内上线）',
    status: 'pending',
    timestamp: new Date('2024-03-28T14:20:00')
  },
  {
    id: 's3',
    customerId: 'a1b2c3d4-0000-0000-0000-000000000001',
    type: 'competitor',
    content: '技术团队反馈"之前用的竞品A响应太慢，经常超时，API文档也不清晰"',
    confidence: 88,
    priority: 'medium',
    salesTip: '建议：在方案中重点展示我们的性能优势（平均响应<200ms）和完善的开发者文档',
    status: 'confirmed',
    timestamp: new Date('2024-03-27T16:45:00')
  },
  {
    id: 's4',
    customerId: 'a1b2c3d4-0000-0000-0000-000000000002',
    type: 'budget',
    content: '李经理说"老板觉得这个价格有点高，能不能再优惠10%"',
    confidence: 90,
    priority: 'urgent',
    salesTip: '建议：不要直接降价，而是提供分期付款或减少一些非核心功能，保持单价和利润',
    status: 'pending',
    timestamp: new Date('2024-03-28T11:15:00')
  },
  {
    id: 's5',
    customerId: 'a1b2c3d4-0000-0000-0000-000000000002',
    type: 'intent',
    content: '客户主动询问"你们的系统能和我们现有的WMS系统集成吗？"',
    confidence: 85,
    priority: 'high',
    salesTip: '建议：这是强购买意向信号，立即安排技术预售进行集成方案讨论',
    status: 'pending',
    timestamp: new Date('2024-03-27T09:30:00')
  },
  {
    id: 's6',
    customerId: 'a1b2c3d4-0000-0000-0000-000000000002',
    type: 'risk',
    content: '客户提到"我们之前上过一个项目，实施了半年还没搞定，很头疼"',
    confidence: 78,
    priority: 'medium',
    salesTip: '建议：主动解决顾虑，提供成功案例和明确的实施时间表，强调项目管理能力',
    status: 'pending',
    timestamp: new Date('2024-03-26T15:20:00')
  },
  {
    id: 's7',
    customerId: 'a1b2c3d4-0000-0000-0000-000000000003',
    type: 'risk',
    content: '王VP在电话中语气不满"你们上个月的系统故障影响了我们业务，这个问题必须解决"',
    confidence: 95,
    priority: 'urgent',
    salesTip: '建议：立即升级至高管层处理，安排CEO或CTO亲自拜访，提供补偿方案',
    status: 'confirmed',
    timestamp: new Date('2024-03-28T13:45:00')
  },
  {
    id: 's8',
    customerId: 'a1b2c3d4-0000-0000-0000-000000000003',
    type: 'competitor',
    content: '客户透露"最近竞品B的销售一直在联系我，他们的价格比你们便宜20%"',
    confidence: 88,
    priority: 'urgent',
    salesTip: '建议：不要陷入价格战，重点强调续约客户的专属服务和已积累的定制化价值',
    status: 'pending',
    timestamp: new Date('2024-03-28T10:00:00')
  },
  {
    id: 's9',
    customerId: 'a1b2c3d4-0000-0000-0000-000000000003',
    type: 'timeline',
    content: '采购部门询问"合同5月15日到期，续约流程一般提前多久启动？"',
    confidence: 92,
    priority: 'high',
    salesTip: '建议：本周内提交续约方案，争取在4月10日前完成签约，留出缓冲时间',
    status: 'pending',
    timestamp: new Date('2024-03-27T14:30:00')
  }
];
