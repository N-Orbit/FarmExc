import { create } from 'zustand';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantStore {
  messages: Message[];
  isTyping: boolean;
  isOpen: boolean;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  setIsTyping: (isTyping: boolean) => void;
  toggleOpen: () => void;
  clearMessages: () => void;
}

export const useAIAssistantStore = create<AIAssistantStore>((set) => ({
  messages: [
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m Stellara AI. Ask me anything about crypto, trading, or the Stellar blockchain.',
      timestamp: new Date(),
    },
  ],
  isTyping: false,
  isOpen: false,
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: Date.now().toString(),
          timestamp: new Date(),
        },
      ],
    })),
  setIsTyping: (isTyping) => set({ isTyping }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  clearMessages: () =>
    set({
      messages: [
        {
          id: '1',
          role: 'assistant',
          content: 'Hi! I\'m Stellara AI. Ask me anything about crypto, trading, or the Stellar blockchain.',
          timestamp: new Date(),
        },
      ],
    }),
}));
