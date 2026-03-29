const SILICONFLOW_API_KEY = import.meta.env.VITE_SILICONFLOW_API_KEY;

const SYSTEM_PROMPT = `你是一个ToB销售智能助手，负责从销售对话中提取关键业务信号。

## 信号类型定义
- budget：预算相关信号
- timeline：时间节点信号
- intent：购买意向信号
- risk：风险信号
- competitor：竞品信号

## 优先级判断规则
- budget类信号：默认urgent
- risk类信号：默认urgent
- competitor类信号：明确威胁为urgent，模糊提及为normal
- timeline类信号：一个月内为urgent，否则为normal
- intent类信号：默认normal

## 置信度判断规则
- high：客户明确表达，无歧义
- medium：有一定暗示，但不够明确
- low：推断成分较多

## 输出格式
严格按照以下JSON格式输出，不要输出任何其他内容：

{
  "signals": [
    {
      "signal_type": "budget|timeline|intent|risk|competitor",
      "content": "用一句话描述这个信号的具体内容",
      "confidence": "high|medium|low",
      "priority": "urgent|normal|low",
      "notification_message": "用一句话写给销售的提醒，口语化，直接说重点"
    }
  ],
  "customer_updates": {
    "budget_signal": "healthy|pressure|unknown",
    "risk_level": "low|medium|high",
    "key_insights_append": "如果有新洞察需要补充到客户档案则填写，否则返回null"
  }
}`;

export interface AgentResult {
  signals: {
    signal_type: string;
    content: string;
    confidence: string;
    priority: string;
    notification_message: string;
  }[];
  customer_updates: {
    budget_signal: string;
    risk_level: string;
    key_insights_append: string | null;
  };
}

export async function analyzeConversation(
  conversationText: string,
  customerName: string
): Promise<AgentResult> {
  const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SILICONFLOW_API_KEY}`
    },
    body: JSON.stringify({
      model: 'moonshotai/Kimi-K2-Instruct',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { 
          role: 'user', 
          content: `客户名称：${customerName}\n\n对话内容：\n${conversationText}` 
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    })
  });

  const data = await response.json();
  const text = data.choices[0].message.content;
  
  // 清理可能的markdown代码块
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}