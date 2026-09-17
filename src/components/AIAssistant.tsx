'use client';
import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, Key, Sparkles, RefreshCw, X, ChevronDown } from 'lucide-react';
import { ScheduleItem, ItemType, SDLCMethodology, DEFAULT_WATERFALL_PHASES, DEFAULT_AGILE_PHASES } from '@/lib/types';
import { generateId, daysFromNow } from '@/lib/utils';

interface AIAssistantProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  projectName: string;
  projectDescription: string;
  items: ScheduleItem[];
  onAddItems: (items: ScheduleItem[]) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  items?: ScheduleItem[];
}

const QUICK_PROMPTS = [
  'Generate a typical PeopleSoft HCM implementation schedule',
  'Suggest tasks for a Payroll module rollout',
  'Review my schedule for risks and gaps',
  'Create an agile sprint schedule for UAT phase',
  'What phases should I include for a PeopleSoft integration?',
];

const SYSTEM_PROMPT = `You are an expert PeopleSoft/Oracle ERP project manager specialising in government IT implementations.

You help PMO leads and BAs build comprehensive project schedules with:
- Epics, Stories, Tasks, Requirements, Design, Development, Testing, Business Process items
- SDLC phases (Waterfall/PeopleSoft: Initiation, Fit-Gap, Design, Development, Unit Testing, SIT, UAT, Training, Deployment, Post Go-Live)
- Agile phases (Sprint Planning, Development, Sprint Review, QA, Release)
- Realistic timelines for government ERP programmes

When asked to generate schedule items, respond with:
1. A brief explanation
2. A JSON block wrapped in \`\`\`json ... \`\`\` with an array of schedule items

Each item must have: name, description, type, startDate (YYYY-MM-DD), endDate (YYYY-MM-DD),
owner (generic role), status (Not Started), priority (Critical/High/Medium/Low),
methodology (waterfall/agile/hybrid), phases (percentages totalling 100), completionPct (0), tags.

For type, use one of: Epic, Story, Task, Requirement, Design, Development, Testing, Business Process.
For waterfall phases use: initiation, fitGap, design, development, unitTesting, sit, uat, training, deployment, postGoLive.
For agile phases use: sprintPlanning, development, sprintReview, qa, release.

Keep responses concise and professional. Focus on government ERP implementation context.`;

export default function AIAssistant({ apiKey, onApiKeyChange, projectName, projectDescription, items, onAddItems }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I'm your AI project scheduling assistant, specialised in PeopleSoft and government ERP implementations.\n\nI can help you:\n• Generate schedule items for your programme\n• Suggest tasks for specific modules (HR, Payroll, Benefits, Finance)\n• Review your schedule for risks and gaps\n• Create realistic timelines for Waterfall or Agile delivery\n\nEnter your NVIDIA NIM API key to get started, then ask me anything!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(!apiKey);
  const [keyInput, setKeyInput] = useState(apiKey);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return;
    if (!apiKey) { setShowKeyInput(true); return; }

    const userMsg: Message = { role: 'user', content };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);
    setError('');

    const contextMsg = `Current project: "${projectName}". ${projectDescription ? `Description: ${projectDescription}. ` : ''}Current items: ${items.length} items in schedule.`;

    try {
      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-7b-instruct-v0.3',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: contextMsg },
            ...messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content },
          ],
          temperature: 0.7,
          max_tokens: 2000,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      const assistantContent: string = data.choices?.[0]?.message?.content || 'I encountered an issue. Please try again.';

      // Parse any JSON schedule items from response
      let parsedItems: ScheduleItem[] | undefined;
      const jsonMatch = assistantContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          const raw = JSON.parse(jsonMatch[1]);
          const arr = Array.isArray(raw) ? raw : raw.items || [];
          parsedItems = arr.map((i: Partial<ScheduleItem>) => ({
            id: generateId(),
            name: i.name || 'Unnamed Item',
            description: i.description || '',
            type: i.type || 'Story',
            startDate: i.startDate || daysFromNow(0),
            endDate: i.endDate || daysFromNow(30),
            owner: i.owner || '',
            status: 'Not Started' as const,
            priority: i.priority || 'Medium',
            methodology: (i.methodology || 'waterfall') as SDLCMethodology,
            phases: i.phases || DEFAULT_WATERFALL_PHASES,
            completionPct: 0,
            notes: i.notes || '',
            tags: i.tags || [],
          }));
        } catch {}
      }

      setMessages(m => [...m, { role: 'assistant', content: assistantContent, items: parsedItems }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to AI service.';
      setError(msg);
      setMessages(m => [...m, {
        role: 'assistant',
        content: `I encountered an error: ${msg}\n\nPlease check your API key and try again.`,
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function saveKey() {
    onApiKeyChange(keyInput);
    setShowKeyInput(false);
    setMessages(m => [...m, {
      role: 'assistant',
      content: 'API key saved! I\'m ready to help with your project schedule. What would you like to do?',
    }]);
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-slate-800 to-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
            <Bot size={16} className="text-green-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">AI Schedule Assistant</div>
            <div className="text-xs text-gray-400">Powered by NVIDIA NIM</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${apiKey ? 'bg-green-400' : 'bg-yellow-400'}`} />
          <span className="text-xs text-gray-400">{apiKey ? 'Connected' : 'No API Key'}</span>
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-slate-600 transition-colors"
            title="Configure API key"
          >
            <Key size={14} />
          </button>
        </div>
      </div>

      {/* API Key panel */}
      {showKeyInput && (
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 fade-in">
          <p className="text-xs font-medium text-amber-800 mb-2 flex items-center gap-1">
            <Key size={12} /> NVIDIA NIM API Key
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveKey()}
              placeholder="nvapi-xxxxxxxxxxxx"
              className="flex-1 px-3 py-2 text-sm border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            />
            <button
              onClick={saveKey}
              className="px-3 py-2 text-sm font-medium text-white rounded-lg"
              style={{ background: 'var(--fiscal-navy)' }}
            >
              Save
            </button>
            <button onClick={() => setShowKeyInput(false)} className="p-2 text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-amber-600 mt-1">
            Get your key from <span className="font-medium">build.nvidia.com</span>. Keys are stored in browser memory only.
          </p>
        </div>
      )}

      {/* Quick prompts */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto border-b border-gray-100 bg-gray-50">
        {QUICK_PROMPTS.map((p, i) => (
          <button
            key={i}
            onClick={() => sendMessage(p)}
            className="shrink-0 px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-full text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} fade-in`}>
            {/* Avatar */}
            <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
              msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-green-400'
            }`}>
              {msg.role === 'user' ? 'U' : <Bot size={14} />}
            </div>

            {/* Message */}
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-gray-100 text-gray-800 rounded-tl-sm'
              }`}>
                {msg.content.replace(/```json[\s\S]*?```/g, '[Schedule items generated — see below]')}
              </div>

              {/* Add items button */}
              {msg.items && msg.items.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 w-full">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={14} className="text-green-600" />
                    <span className="text-xs font-semibold text-green-700">
                      {msg.items.length} schedule item{msg.items.length > 1 ? 's' : ''} generated
                    </span>
                  </div>
                  <div className="space-y-1 mb-3">
                    {msg.items.slice(0, 5).map((item, j) => (
                      <div key={j} className="text-xs text-gray-600 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="font-medium">{item.name}</span>
                        <span className="text-gray-400">({item.type})</span>
                      </div>
                    ))}
                    {msg.items.length > 5 && (
                      <div className="text-xs text-gray-400">+{msg.items.length - 5} more items...</div>
                    )}
                  </div>
                  <button
                    onClick={() => onAddItems(msg.items!)}
                    className="w-full py-2 rounded-lg text-xs font-semibold text-white shadow-sm"
                    style={{ background: 'var(--fiscal-navy)' }}
                  >
                    Add {msg.items.length} Items to Schedule
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 fade-in">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center">
              <Bot size={14} className="text-green-400" />
            </div>
            <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-gray-500" />
              <span className="text-sm text-gray-500">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={apiKey ? 'Ask me to generate schedule items, review risks...' : 'Enter your API key above to start'}
            rows={2}
            disabled={!apiKey}
            className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading || !apiKey}
            className="p-2.5 rounded-xl text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'var(--fiscal-navy)' }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">Press Enter to send, Shift+Enter for new line</p>
      </div>
    </div>
  );
}
