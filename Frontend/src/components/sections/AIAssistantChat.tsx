'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useAIAssistantStore } from '@/store/ai-assistant-store';

export function AIAssistantChat() {
  const { messages, isTyping, addMessage, setIsTyping } = useAIAssistantStore();
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    addMessage({ role: 'user', content: input });
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      addMessage({
        role: 'assistant',
        content: 'This is a demo response. Connect to your AI backend to get real responses.',
      });
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex h-[600px] flex-col rounded-2xl border border-white/10 bg-black/50 backdrop-blur-sm">
      <div className="border-b border-white/10 p-4">
        <h3 className="text-xl font-semibold text-white">Stellara AI Assistant</h3>
        <p className="text-sm text-white/60">Your 24/7 crypto learning companion</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-brand-blue text-white'
                    : 'bg-white/10 text-white'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="rounded-2xl bg-white/10 px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything about crypto..."
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-brand-blue focus:outline-none"
          />
          <Button onClick={handleSend} variant="primary" className="px-6">
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
