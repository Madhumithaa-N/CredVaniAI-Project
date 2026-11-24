import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Language, VoiceState, ChatMessage, EmploymentType } from '../types';
import { useAuthLanguage } from '../contexts/AuthLanguageContext';
import {
  LANG_BCP47_MAP,
  askLiveGeminiAdvisor,
  getWelcomeResponseForLanguage,
  speakText,
  stopSpeaking,
  AIAdvisorResponse,
} from '../services/aiAdvisor';
import { ApiError } from '../services/api';
import {
  Mic,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  User,
  AlertCircle,
  CheckCircle2,
  Gauge,
  Headphones,
} from 'lucide-react';

interface VoiceAiAdvisorProps {
  currentLanguage?: Language;
  onNavigateSection: (sectionId: string, payload?: any) => void;
  externalTriggerPrompt?: string | null;
}

export const VoiceAiAdvisor: React.FC<VoiceAiAdvisorProps> = ({
  externalTriggerPrompt,
}) => {
  const { t } = useTranslation();
  const { language, supportedLanguages } = useAuthLanguage();

  const [inputText, setInputText] = useState('');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isSpeakingAudio, setIsSpeakingAudio] = useState(false);
  const [transcriptDraft, setTranscriptDraft] = useState('');
  const [voiceErrorNotice, setVoiceErrorNotice] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(0.95);
  const [activeSpeakingMsgId, setActiveSpeakingMsgId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const welcomeRes = getWelcomeResponseForLanguage(language);
    return [
      {
        id: 'welcome-1',
        sender: 'ai',
        text: welcomeRes.text,
        spokenAudioText: welcomeRes.vernacularNativeSlang,
        spokenPhoneticSlang: welcomeRes.phoneticColloquialSlang,
        spokenSlangDialect: welcomeRes.dialectLabel,
        language,
        timestamp: new Date(),
      },
    ];
  });

  const recognitionRef = useRef<any>(null);
  const accumulatedTranscriptRef = useRef<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSpokenResMap = useRef<Record<string, AIAdvisorResponse>>({});

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, voiceState]);

  useEffect(() => {
    if (externalTriggerPrompt) {
      handleUserQuery(externalTriggerPrompt);
    }
  }, [externalTriggerPrompt]);

  useEffect(() => {
    if (messages.length === 1 && messages[0].sender === 'ai') {
      const welcomeRes = getWelcomeResponseForLanguage(language);
      setMessages([
        {
          id: 'welcome-1',
          sender: 'ai',
          text: welcomeRes.text,
          spokenAudioText: welcomeRes.vernacularNativeSlang,
          spokenPhoneticSlang: welcomeRes.phoneticColloquialSlang,
          spokenSlangDialect: welcomeRes.dialectLabel,
          language,
          timestamp: new Date(),
        },
      ]);
    }
  }, [language]);

  useEffect(() => {
    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const currentLangObj =
    supportedLanguages.find((l) => l.code === language) || supportedLanguages[0];

  const startListening = () => {
    stopSpeaking();
    setIsSpeakingAudio(false);
    setActiveSpeakingMsgId(null);
    setVoiceErrorNotice(null);
    accumulatedTranscriptRef.current = '';
    setTranscriptDraft('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceErrorNotice(t('advisorIdleHint'));
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = LANG_BCP47_MAP[language] || 'en-IN';

      recognition.onstart = () => {
        setVoiceState('listening');
        accumulatedTranscriptRef.current = '';
        setTranscriptDraft('');
      };

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';
        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) finalText += res[0].transcript + ' ';
          else interimText += res[0].transcript + ' ';
        }
        const currentCombined = (finalText || interimText).trim();
        if (currentCombined) {
          accumulatedTranscriptRef.current = currentCombined;
          setTranscriptDraft(currentCombined);
          setInputText(currentCombined);
        }
      };

      recognition.onerror = () => {
        const captured = accumulatedTranscriptRef.current.trim();
        if (captured) {
          handleUserQuery(captured);
        } else {
          setVoiceErrorNotice(t('advisorIdleHint'));
          setVoiceState('idle');
        }
      };

      recognition.onend = () => {
        const finalCaptured = accumulatedTranscriptRef.current.trim();
        if (finalCaptured) {
          handleUserQuery(finalCaptured);
        } else {
          setVoiceState('idle');
        }
      };

      recognition.start();
    } catch {
      setVoiceErrorNotice(t('advisorIdleHint'));
      setVoiceState('idle');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    const capturedText = (
      accumulatedTranscriptRef.current ||
      transcriptDraft ||
      inputText
    ).trim();
    if (capturedText) {
      handleUserQuery(capturedText);
    } else {
      setVoiceState('idle');
    }
  };

  const handleUserQuery = async (query: string) => {
    if (!query.trim()) return;

    setVoiceErrorNotice(null);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      language,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setTranscriptDraft('');
    accumulatedTranscriptRef.current = '';
    setVoiceState('processing');

    try {
      const { conversationId: nextConvId, response: aiResult } =
        await askLiveGeminiAdvisor(query.trim(), language, conversationId);
      setConversationId(nextConvId);

      const msgId = `ai-${Date.now()}`;
      lastSpokenResMap.current[msgId] = aiResult;

      const aiMsg: ChatMessage = {
        id: msgId,
        sender: 'ai',
        text: aiResult.text,
        spokenAudioText: aiResult.vernacularNativeSlang,
        spokenPhoneticSlang: aiResult.phoneticColloquialSlang,
        spokenSlangDialect: aiResult.dialectLabel,
        language,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setVoiceState('speaking');
      setIsSpeakingAudio(true);
      setActiveSpeakingMsgId(msgId);

      speakText(
        aiResult,
        language,
        () => {
          setIsSpeakingAudio(false);
          setActiveSpeakingMsgId(null);
          setVoiceState('idle');
        },
        playbackSpeed
      );
    } catch (err) {
      setVoiceState('idle');
      if (err instanceof ApiError) {
        setVoiceErrorNotice(err.message);
      } else {
        setVoiceErrorNotice(t('errNetwork'));
      }
    }
  };

  const handleReplayAudio = (msg: ChatMessage) => {
    if (isSpeakingAudio && activeSpeakingMsgId === msg.id) {
      stopSpeaking();
      setIsSpeakingAudio(false);
      setActiveSpeakingMsgId(null);
      setVoiceState('idle');
    } else {
      stopSpeaking();
      setIsSpeakingAudio(true);
      setActiveSpeakingMsgId(msg.id);
      setVoiceState('speaking');

      const savedRes = lastSpokenResMap.current[msg.id];
      const audioPayload: AIAdvisorResponse = savedRes || {
        text: msg.text,
        vernacularNativeSlang: msg.spokenAudioText || msg.text,
        phoneticColloquialSlang: msg.spokenPhoneticSlang || msg.text,
        dialectLabel: msg.spokenSlangDialect || currentLangObj.nativeName,
      };

      speakText(
        audioPayload,
        msg.language || language,
        () => {
          setIsSpeakingAudio(false);
          setActiveSpeakingMsgId(null);
          setVoiceState('idle');
        },
        playbackSpeed
      );
    }
  };

  const EMPLOYMENT_PROMPTS: { id: EmploymentType; label: string }[] = [
    { id: 'salaried', label: t('salaried') },
    { id: 'self_employed', label: t('selfEmployed') },
    { id: 'business', label: t('businessOwner') },
    { id: 'freelancer', label: t('freelancer') },
    { id: 'gov_psu', label: t('govPsu') },
    { id: 'farmer', label: t('farmer') },
    { id: 'student', label: t('student') },
    { id: 'retired', label: t('retired') },
    { id: 'homemaker', label: t('homemaker') },
    { id: 'other', label: t('other') },
  ];

  return (
    <section
      id="ai-advisor"
      className="py-10 sm:py-12 scroll-mt-18 bg-[#000000] border-b border-white/15"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div
          className="relative rounded-[16px] bg-[#0f0f0f] border border-white/15 p-5 sm:p-7"
          style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15)' }}
        >
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#161616] border border-white/15 flex items-center justify-center">
                <Bot className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {t('advisorTitle')}
                  </h3>
                  <span className="text-[10px] font-mono font-bold uppercase text-emerald-400">
                    · {t('advisorVoiceActive')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span>{t('advisorBadge')}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-teal-400 font-mono text-[11px]">
                    {currentLangObj.nativeName} ({currentLangObj.code.toUpperCase()})
                  </span>
                </div>
              </div>
            </div>

            {/* Voice Status & Speed Controls */}
            <div className="flex items-center gap-2.5 text-xs">
              <div className="hidden sm:flex items-center gap-1 bg-[#161616] p-0.5 rounded-lg border border-white/15 text-[11px]">
                <Gauge className="w-3 h-3 text-zinc-400 ms-1" />
                {[0.85, 0.95, 1.15].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-1.5 py-0.5 rounded font-mono transition-colors cursor-pointer ${
                      playbackSpeed === spd
                        ? 'bg-white text-black font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {spd === 0.95 ? '1.0x' : `${spd}x`}
                  </button>
                ))}
              </div>

              {voiceState === 'listening' && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-red-500/15 border border-red-500/40 text-red-400 font-mono font-semibold">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span>{t('advisorListening')}</span>
                </div>
              )}
              {voiceState === 'processing' && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-500/15 border border-teal-500/40 text-teal-300 font-mono font-semibold animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-spin" />
                  <span>{t('advisorAnalyzing')}</span>
                </div>
              )}
              {voiceState === 'speaking' && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono font-semibold">
                  <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                  <span>{t('advisorSpeaking')}</span>
                </div>
              )}
              {voiceState === 'idle' && (
                <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{t('advisorReady')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Error Notice */}
          {voiceErrorNotice && (
            <div className="my-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-2 text-xs text-amber-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{voiceErrorNotice}</span>
              </div>
              <button
                onClick={() => setVoiceErrorNotice(null)}
                className="text-amber-300 hover:text-white font-bold ms-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Chat Messages Stream */}
          <div className="py-4 space-y-4 max-h-[380px] overflow-y-auto pe-1">
            {messages.map((msg) => {
              const isAiSpeakingThis =
                isSpeakingAudio && activeSpeakingMsgId === msg.id;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.sender === 'ai' && (
                    <div className="w-7 h-7 rounded-lg bg-[#181818] border border-white/15 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    </div>
                  )}

                  <div
                    className={`max-w-[90%] sm:max-w-[85%] rounded-xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-white text-black font-semibold rounded-te-none'
                        : 'bg-[#161616] text-zinc-200 border border-white/15 rounded-ts-none'
                    }`}
                  >
                    {msg.sender === 'ai' && msg.spokenSlangDialect && (
                      <div className="mb-2 flex items-center justify-between gap-2 pb-1.5 border-b border-white/10 text-[11px]">
                        <span className="inline-flex items-center gap-1 font-semibold text-teal-400">
                          <Headphones className="w-3 h-3 text-teal-400" />
                          <span>{msg.spokenSlangDialect}</span>
                        </span>
                      </div>
                    )}

                    <div className="whitespace-pre-line">{msg.text}</div>

                    {msg.sender === 'ai' && (
                      <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleReplayAudio(msg)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-semibold transition-all cursor-pointer ${
                            isAiSpeakingThis
                              ? 'bg-amber-500/20 border-amber-400/50 text-amber-300 animate-pulse'
                              : 'bg-[#0f0f0f] hover:bg-white/10 border-white/15 text-zinc-200'
                          }`}
                        >
                          {isAiSpeakingThis ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                              <span>{t('advisorStopBtn')}</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-teal-400" />
                              <span>{t('advisorListenBtn')}</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-[#181818] border border-white/15 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-zinc-300" />
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Listening Bar */}
          {voiceState === 'listening' && (
            <div className="mb-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wide font-mono">
                    {t('advisorListening')}
                  </span>
                  {transcriptDraft && (
                    <div className="text-xs text-zinc-300 font-medium italic mt-0.5">
                      "{transcriptDraft}"
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={stopListening}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('advisorStopBtn')}</span>
              </button>
            </div>
          )}

          {/* Conversational Input Bar */}
          <div className="relative mt-1">
            <div className="relative flex items-center bg-[#060606] border border-white/15 focus-within:border-white/40 rounded-xl transition-all">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUserQuery(inputText);
                  }
                }}
                placeholder={t('advisorPlaceholder')}
                className="w-full py-3.5 ps-4 pe-24 bg-transparent text-white placeholder:text-zinc-500 text-xs sm:text-sm focus:outline-none"
              />

              <div className="absolute end-1.5 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={voiceState === 'listening' ? stopListening : startListening}
                  className={`p-2.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                    voiceState === 'listening'
                      ? 'bg-red-600 text-white ring-2 ring-red-400 animate-pulse'
                      : 'bg-teal-500 hover:bg-teal-400 text-black'
                  }`}
                  aria-label="Voice Input"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleUserQuery(inputText)}
                  disabled={!inputText.trim() || voiceState === 'processing'}
                  className="p-2.5 rounded-lg bg-white hover:bg-zinc-200 disabled:opacity-25 text-black transition-all cursor-pointer font-bold"
                  aria-label="Send Query"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 px-1 font-mono">
              <span>{t('advisorIdleHint')}</span>
              <span className="hidden sm:inline">{t('advisorSendHint')}</span>
            </div>
          </div>

          {/* Quick Starter Prompts */}
          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              {t('advisorStarterTitle')}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                t('voicePrompt1'),
                t('voicePrompt2'),
                t('voicePrompt3'),
                t('voicePrompt4'),
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleUserQuery(prompt)}
                  className="text-start text-xs bg-[#161616] hover:bg-white/10 hover:border-white/30 text-zinc-200 px-2.5 py-1.5 rounded-lg border border-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Mic className="w-3 h-3 text-teal-400 shrink-0" />
                  <span>"{prompt}"</span>
                </button>
              ))}
            </div>
          </div>

          {/* 10 Employment Profiles Quick Chips */}
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              {t('advisorProfileTitle')}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {EMPLOYMENT_PROMPTS.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => handleUserQuery(`${emp.label}: ${t('voicePrompt2')}`)}
                  className="text-start text-[11px] font-mono bg-[#0a0a0a] hover:bg-white/10 hover:border-teal-400/50 text-zinc-300 hover:text-white px-2 py-1 rounded-md border border-white/10 transition-all cursor-pointer font-medium"
                >
                  [ {emp.label} ]
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
