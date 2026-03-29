import { useState, useMemo } from 'react';
import { Maximize2, Minimize2, Filter, CheckCircle2, X, Loader2, AlertCircle } from 'lucide-react';
import { mockCustomers, mockSignals } from './mockData';
import { Customer, Signal, SignalStatus, Channel } from './types';
import { supabase } from './lib/supabase';
import { analyzeConversation } from './lib/agent';

function App() {
  const [selectedCustomerId, setSelectedCustomerId] = useState(mockCustomers[0].id);
  const [customers, setCustomers] = useState(mockCustomers);
  const [signals, setSignals] = useState<Signal[]>(mockSignals);
  const [leftExpanded, setLeftExpanded] = useState(false);
  const [rightExpanded, setRightExpanded] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | SignalStatus>('all');
  const [conversationText, setConversationText] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<Channel>('wechat');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [notification, setNotification] = useState('');

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId)!;

  const filteredSignals = useMemo(() => {
    return signals
      .filter(s => s.customerId === selectedCustomerId)
      .filter(s => filterStatus === 'all' || s.status === filterStatus)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [signals, selectedCustomerId, filterStatus]);

  const handleAnalyze = async () => {
    if (!conversationText.trim()) return;
  
    setIsAnalyzing(true);
    setNotification('Agent正在分析对话内容...');
  
    try {
      // 1. 调用Agent分析
      const result = await analyzeConversation(
        conversationText,
        selectedCustomer.name
      );

      console.log('Agent结果:', result);
  
      // 2. 把对话存入Supabase
      const { data: convData } = await supabase
        .from('conversations')
        .insert({
          customer_id: selectedCustomerId,
          sales_rep: '销售-陈晨',
          raw_content: conversationText,
          channel: selectedChannel
        })
        .select()
        .single();

        console.log('conversations写入结果:', convData); 
  
      // 3. 把信号存入Supabase并更新前端状态
      const newSignals = await Promise.all(
        result.signals.map(async (s) => {
          const confidenceMap: Record<string, number> = {
            high: 90, medium: 75, low: 60
          };
  
          const { data: sigData } = await supabase
            .from('signals')
            .insert({
              customer_id: selectedCustomerId,
              conversation_id: convData?.id,
              signal_type: s.signal_type,
              content: s.content,
              confidence: s.confidence,
              frequency: 1,
              priority: s.priority === 'urgent' ? 'urgent' : 
                        s.priority === 'normal' ? 'normal' : 'low',
              status: 'pending_review',
              sales_confirmed: false
            })
            .select()
            .single();
  
  
          // 转换成前端Signal格式
          return {
            id: sigData?.id || `s${Date.now()}`,
            customerId: selectedCustomerId,
            type: s.signal_type as any,
            content: s.content,
            confidence: confidenceMap[s.confidence] || 75,
            priority: s.priority as any,
            salesTip: s.notification_message,
            status: 'pending' as const,
            timestamp: new Date()
          };
        })
      );
  
      // 4. 更新信号列表
      setSignals(prev => [...newSignals, ...prev]);
      setConversationText('');
  
    } catch (error) {
      console.error('分析失败:', error);
      setNotification('分析失败，请检查API配置');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleConfirm = async (signalId: string) => {
    setSignals(prev => prev.map(s =>
      s.id === signalId ? { ...s, status: 'confirmed' as SignalStatus } : s
    ));

    const confirmedSignal = signals.find(s => s.id === signalId);
    if (!confirmedSignal) return;

    // 只有真实UUID才写Supabase，mock数据的短id跳过
    const isRealId = signalId.includes('-');
    
    if (isRealId) {
      await supabase
        .from('signals')
        .update({ status: 'confirmed', sales_confirmed: true })
        .eq('id', signalId);

      await supabase.from('notifications').insert({
        customer_id: confirmedSignal.customerId,
        signal_id: signalId,
        message: confirmedSignal.salesTip,
        status: 'sent'
      });
    }

    // 客户档案更新（前端状态无论如何都更新）
    if (confirmedSignal.type === 'budget') {
      if (isRealId) {
        await supabase
          .from('customers')
          .update({ budget_signal: 'pressure' })
          .eq('id', confirmedSignal.customerId);
      }
      setCustomers(prev => prev.map(c =>
        c.id === confirmedSignal.customerId ? { ...c, budgetSignal: 'pressure' } : c
      ));
    }

    if (confirmedSignal.type === 'risk') {
      if (isRealId) {
        await supabase
          .from('customers')
          .update({ risk_level: 'high' })
          .eq('id', confirmedSignal.customerId);
      }
      setCustomers(prev => prev.map(c =>
        c.id === confirmedSignal.customerId ? { ...c, riskLevel: 'high' } : c
      ));
    }

    setNotification('信号已确认，客户档案已更新');
    setTimeout(() => setNotification(''), 3000);
  };

  const handleIgnore = (signalId: string) => {
    setSignals(prev => prev.map(s =>
      s.id === signalId ? { ...s, status: 'ignored' as SignalStatus } : s
    ));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="flex h-screen overflow-hidden">
        <div
          className={`transition-all duration-300 ${
            leftExpanded ? 'w-full' : rightExpanded ? 'w-0' : 'w-1/2'
          } ${rightExpanded ? 'hidden' : 'flex'} flex-col border-r border-gray-800`}
        >
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-semibold">客户档案</h1>
                <button
                  onClick={() => setLeftExpanded(!leftExpanded)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {leftExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
              </div>

              <div className="flex gap-2">
                {customers.map(customer => (
                  <button
                    key={customer.id}
                    onClick={() => setSelectedCustomerId(customer.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedCustomerId === customer.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-750'
                    }`}
                  >
                    {customer.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">{selectedCustomer.name}</h2>
                  <p className="text-gray-400">{selectedCustomer.contact} · {selectedCustomer.industry}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">当前阶段</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      selectedCustomer.stage === 'signed' ? 'bg-green-900/30 text-green-400' :
                      selectedCustomer.stage === 'negotiating' ? 'bg-blue-900/30 text-blue-400' :
                      selectedCustomer.stage === 'renewal' ? 'bg-purple-900/30 text-purple-400' :
                      'bg-gray-800 text-gray-300'
                    }`}>
                      {getStageLabel(selectedCustomer.stage)}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400 mb-1">预算信号</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      selectedCustomer.budgetSignal === 'healthy' ? 'bg-green-900/30 text-green-400' :
                      selectedCustomer.budgetSignal === 'pressure' ? 'bg-red-900/30 text-red-400' :
                      'bg-gray-800 text-gray-300'
                    }`}>
                      {getBudgetLabel(selectedCustomer.budgetSignal)}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400 mb-1">风险等级</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      selectedCustomer.riskLevel === 'low' ? 'bg-green-900/30 text-green-400' :
                      selectedCustomer.riskLevel === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-red-900/30 text-red-400'
                    }`}>
                      {getRiskLabel(selectedCustomer.riskLevel)}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-2">核心洞察</p>
                  <div className="bg-gray-900/50 rounded-lg p-4 text-gray-300 leading-relaxed">
                    {selectedCustomer.insights}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-800 bg-gray-900/30">
              <h3 className="text-lg font-semibold mb-4">输入新对话</h3>
              <textarea
                value={conversationText}
                onChange={(e) => setConversationText(e.target.value)}
                placeholder="粘贴销售对话内容..."
                className="w-full h-32 bg-gray-900 border border-gray-700 rounded-lg p-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />

              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-2">选择渠道</p>
                  <div className="flex gap-3">
                    {(['wechat', 'phone', 'email', 'meeting'] as Channel[]).map(channel => (
                      <label key={channel} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="channel"
                          value={channel}
                          checked={selectedChannel === channel}
                          onChange={() => setSelectedChannel(channel)}
                          className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-300">{getChannelLabel(channel)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !conversationText.trim()}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all shadow-lg shadow-blue-900/50 disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Agent分析中...</span>
                    </>
                  ) : (
                    <span>Agent 分析</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`transition-all duration-300 ${
            rightExpanded ? 'w-full' : leftExpanded ? 'w-0' : 'w-1/2'
          } ${leftExpanded ? 'hidden' : 'flex'} flex-col bg-gray-900`}
        >
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">信号分析</h2>
                  {isAnalyzing && (
                    <span className="flex items-center gap-2 text-sm text-blue-400">
                      <Loader2 size={16} className="animate-spin" />
                      Agent正在分析...
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setRightExpanded(!rightExpanded)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {rightExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-400" />
                {(['all', 'pending', 'confirmed', 'ignored'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      filterStatus === status
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                    }`}
                  >
                    {status === 'all' ? '全部' :
                     status === 'pending' ? '待确认' :
                     status === 'confirmed' ? '已确认' : '已忽略'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {filteredSignals.map((signal, index) => (
                  <div
                    key={signal.id}
                    style={{
                      animation: signal.status === 'pending' && index === 0 ? 'slideIn 0.5s ease-out' : undefined
                    }}
                    className={`relative bg-gray-850 rounded-lg overflow-hidden transition-all ${
                      signal.priority === 'urgent' && signal.status === 'pending' ? 'ring-2 ring-red-500/50' : ''
                    } ${signal.status === 'ignored' ? 'opacity-50' : ''}`}
                  >
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 ${getSignalColor(signal.type)}`}
                    />

                    <div className="p-4 pl-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            signal.type === 'budget' ? 'bg-red-900/30 text-red-400' :
                            signal.type === 'timeline' ? 'bg-blue-900/30 text-blue-400' :
                            signal.type === 'intent' ? 'bg-green-900/30 text-green-400' :
                            signal.type === 'risk' ? 'bg-orange-900/30 text-orange-400' :
                            'bg-purple-900/30 text-purple-400'
                          }`}>
                            {getSignalTypeLabel(signal.type)}
                          </span>
                          {signal.status === 'confirmed' && (
                            <CheckCircle2 size={16} className="text-green-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            置信度 {signal.confidence}%
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            signal.priority === 'urgent' ? 'bg-red-900/50 text-red-300' :
                            signal.priority === 'high' ? 'bg-orange-900/50 text-orange-300' :
                            signal.priority === 'medium' ? 'bg-yellow-900/50 text-yellow-300' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {signal.priority === 'urgent' ? '紧急' :
                             signal.priority === 'high' ? '高' :
                             signal.priority === 'medium' ? '中' : '低'}
                          </span>
                        </div>
                      </div>

                      <p className={`text-gray-200 mb-3 leading-relaxed ${
                        signal.status === 'ignored' ? 'line-through' : ''
                      }`}>
                        {signal.content}
                      </p>

                      <p className="text-sm text-gray-400 italic mb-3">
                        {signal.salesTip}
                      </p>

                      {signal.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleConfirm(signal.id)}
                            className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            确认
                          </button>
                          <button
                            onClick={() => handleIgnore(signal.id)}
                            className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors"
                          >
                            忽略
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {filteredSignals.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <AlertCircle size={48} className="mx-auto mb-3 opacity-50" />
                    <p>暂无{filterStatus !== 'all' ? getFilterLabel(filterStatus) : ''}信号</p>
                  </div>
                )}
              </div>
            </div>

            {notification && (
              <div className="p-4 bg-gray-800 border-t border-gray-700">
                <div className="flex items-center gap-2 text-sm text-blue-400">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  {notification}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

function getStageLabel(stage: string) {
  const labels = {
    prospecting: '初步接触',
    negotiating: '商务谈判',
    signed: '已签约',
    renewal: '续约跟进'
  };
  return labels[stage as keyof typeof labels];
}

function getBudgetLabel(budget: string) {
  const labels = {
    healthy: '充足',
    pressure: '紧张',
    unknown: '未知'
  };
  return labels[budget as keyof typeof labels];
}

function getRiskLabel(risk: string) {
  const labels = {
    low: '低风险',
    medium: '中风险',
    high: '高风险'
  };
  return labels[risk as keyof typeof labels];
}

function getSignalTypeLabel(type: string) {
  const labels = {
    budget: '预算信号',
    timeline: '时间线',
    intent: '购买意向',
    risk: '风险预警',
    competitor: '竞品动态'
  };
  return labels[type as keyof typeof labels];
}

function getSignalColor(type: string) {
  const colors = {
    budget: 'bg-red-500',
    timeline: 'bg-blue-500',
    intent: 'bg-green-500',
    risk: 'bg-orange-500',
    competitor: 'bg-purple-500'
  };
  return colors[type as keyof typeof colors];
}

function getChannelLabel(channel: string) {
  const labels = {
    wechat: '微信',
    phone: '电话',
    email: '邮件',
    meeting: '会议'
  };
  return labels[channel as keyof typeof labels];
}

function getFilterLabel(status: string) {
  const labels = {
    pending: '待确认',
    confirmed: '已确认',
    ignored: '已忽略'
  };
  return labels[status as keyof typeof labels];
}

export default App;
