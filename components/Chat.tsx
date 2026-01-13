import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Camera, X, CheckSquare, Sparkles } from 'lucide-react';
import { Message, Sender, UserProfile } from '../types';
import { generateCoachResponse, generateInitialCoachGreeting, AIResponse } from '../services/geminiService';

interface ChatProps {
  messages: Message[];
  onNewMessage: (msg: Message) => void;
  profile: UserProfile;
  onUpdatePlan: (plan: string[]) => void;
  onAddHabit: (title: string) => void;
}

interface StagedPlan {
  messageId: string;
  plan: string[];
}

const Chat: React.FC<ChatProps> = ({ messages: propsMessages, onNewMessage, profile, onUpdatePlan, onAddHabit }) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [stagedPlan, setStagedPlan] = useState<StagedPlan | null>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>(propsMessages);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const previousTextRef = useRef('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep local messages in sync with props
  useEffect(() => {
    setLocalMessages(propsMessages);
  }, [propsMessages]);

  const scrollToBottom = () => {
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  useEffect(() => {
    scrollToBottom();
  }, [localMessages, isTyping, stagedPlan]);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let currentSessionTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
            currentSessionTranscript += event.results[i][0].transcript;
        }
        const prev = previousTextRef.current;
        const separator = prev && !prev.endsWith(' ') ? ' ' : '';
        setInputText(prev + separator + currentSessionTranscript);
      };
      
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = () => setIsListening(false);
    }
  }, []);

  const handleAIResponse = (aiData: AIResponse) => {
      const msgId = Date.now().toString();
      const botMsg: Message = {
        id: msgId,
        text: aiData.chatResponse,
        sender: Sender.BOT,
        timestamp: Date.now(),
      };
      
      setLocalMessages(prev => [...prev, botMsg]);
      onNewMessage(botMsg);

      if (aiData.suggestedPlan && aiData.suggestedPlan.length > 0) {
        setStagedPlan({ messageId: msgId, plan: aiData.suggestedPlan });
      }

      if (aiData.newHabits && aiData.newHabits.length > 0) {
        aiData.newHabits.forEach(habit => onAddHabit(habit));
      }
  };

  useEffect(() => {
    const initChat = async () => {
      if (localMessages.length === 0 && !initRef.current) {
        initRef.current = true;
        setIsTyping(true);
        try {
          const aiData = await generateInitialCoachGreeting(profile);
          handleAIResponse(aiData);
        } catch (e) {
          console.error("Init Chat Error", e);
        } finally {
          setIsTyping(false);
        }
      }
    };
    initChat();
  }, [profile]); 

  const handleConfirmPlan = () => {
    if (stagedPlan) {
      onUpdatePlan(stagedPlan.plan);
      setStagedPlan(null);
    }
  };

  const toggleListening = () => {
      if (isTyping) return;
      if (!recognitionRef.current) {
          alert("Voice input not supported.");
          return;
      }
      if (isListening) {
          recognitionRef.current.stop();
          setIsListening(false);
      } else {
          previousTextRef.current = inputText;
          recognitionRef.current.start();
          setIsListening(true);
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !selectedImage) || isTyping) return;

    if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: Sender.USER,
      timestamp: Date.now(),
      image: selectedImage || undefined
    };

    setLocalMessages(prev => [...prev, userMsg]);
    onNewMessage(userMsg);
    
    const currentInput = inputText;
    const currentImage = selectedImage;
    const historySnapshot = [...localMessages, userMsg];
    
    setInputText('');
    setSelectedImage(null);
    setIsTyping(true);

    try {
      const aiData = await generateCoachResponse(
        currentInput || "Analyze this image.", 
        profile, 
        historySnapshot, 
        currentImage || undefined
      );
      handleAIResponse(aiData);
    } catch (error) {
      console.error("Error in chat send:", error);
      const errorMsg: Message = {
          id: Date.now().toString(),
          text: "Momentum interruption. Re-sending signal. Give it another shot, I'm still locked in.",
          sender: Sender.BOT,
          timestamp: Date.now(),
      };
      setLocalMessages(prev => [...prev, errorMsg]);
      onNewMessage(errorMsg);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessageText = (text: string) => {
    return text.split('\n').map((line, i) => {
      const boldParts = line.split(/(\*\*.*?\**)/g);
      const content = boldParts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} className="text-blue-300 font-extrabold">{part.slice(2, -2)}</strong>;
        }
        const linkParts = part.split(/(\[.*?\]\(.*?\))/g);
        return linkParts.map((lPart, k) => {
          const match = lPart.match(/\[(.*?)\]\((.*?)\)/);
          if (match) return <a key={k} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline font-bold">{match[1]}</a>;
          return lPart;
        });
      });
      return <React.Fragment key={i}>{content}{i !== text.split('\n').length - 1 && <br />}</React.Fragment>;
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
        {localMessages.map((msg) => (
          <div key={msg.id} className="space-y-3 animate-slide-in">
            <div className={`flex ${msg.sender === Sender.USER ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-2xl p-4 text-sm leading-relaxed shadow-xl ${msg.sender === Sender.USER ? 'bg-blue-600 text-white rounded-br-none border border-blue-500/50' : 'bg-slate-900 text-slate-200 rounded-bl-none border border-slate-800'}`}>
                {msg.image && (
                    <img src={msg.image} alt="Upload" className="rounded-xl mb-3 max-h-72 w-full object-cover border border-white/5 shadow-inner" />
                )}
                <div className="prose prose-sm prose-invert max-w-none">
                  {renderMessageText(msg.text)}
                </div>
                </div>
            </div>
            {stagedPlan && stagedPlan.messageId === msg.id && (
                <div className="flex justify-start pl-2 animate-fade-in">
                    <button 
                        onClick={handleConfirmPlan}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3.5 rounded-2xl flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.15em] shadow-lg shadow-emerald-900/30 active:scale-95 transition-all border border-emerald-500/30"
                    >
                        <CheckSquare size={16} /> Deploy Plan to Dashboard
                    </button>
                </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-slate-900 rounded-2xl rounded-bl-none p-5 shadow-lg border border-slate-800 flex gap-2 items-center">
              <Sparkles size={14} className="text-blue-500 animate-pulse" />
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-900/50 backdrop-blur-xl border-t border-slate-800/50">
        {selectedImage && (
          <div className="mb-4 relative inline-block animate-bounce-in">
             <img src={selectedImage} alt="Preview" className="h-28 w-28 object-cover rounded-2xl border-2 border-blue-500 shadow-2xl shadow-blue-900/40" />
             <button onClick={() => setSelectedImage(null)} className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full border-2 border-slate-900 hover:bg-red-600 transition-all shadow-lg active:scale-90">
               <X size={16} />
             </button>
          </div>
        )}
        <div className="flex gap-2 items-center max-w-md mx-auto relative">
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
          
          <div className="flex gap-1">
            <button onClick={() => fileInputRef.current?.click()} disabled={isTyping} className="p-3.5 rounded-2xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all active:scale-90 disabled:opacity-30">
              <Camera size={20} />
            </button>

            <button onClick={toggleListening} disabled={isTyping} className={`p-3.5 rounded-2xl transition-all active:scale-90 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400 disabled:opacity-30'}`}>
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          </div>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isTyping} 
            placeholder={isTyping ? "Coach is calculating..." : "Send intel..."}
            className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-slate-700 text-sm font-medium"
          />
          
          <button 
            onClick={handleSend} 
            disabled={(!inputText.trim() && !selectedImage) || isTyping} 
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-20 disabled:grayscale text-white p-3.5 rounded-2xl transition-all active:scale-90 shadow-lg shadow-blue-900/40"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
