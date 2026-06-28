import React from 'react'

import { AnimatePresence, motion } from 'framer-motion'
import { Bot, Loader2, MessageSquare, Send, Sparkles, User, X, Briefcase, Code2, Mic, MicOff, VolumeX } from 'lucide-react'

import { fetchChatHistory, sendAuditChatMessage, toChatMessage } from '../lib/api'
import { useStore } from '../store'
import { voiceRecognition, speechEngine } from '../lib/speech'

const suggestedPrompts = [
  "Explain this audit like I'm a beginner",
  'Which issue should I fix first?',
  'Show me the accessibility priority',
  'What is the fastest SEO win?',
]

export function ChatWidget() {
  const {
    addChatMessage,
    audit,
    chatInput,
    chatMessages,
    chatOpen,
    chatPending,
    chatPersona,
    resetChatForAudit,
    setActiveChatAuditId,
    setChatInput,
    setChatMessages,
    setChatOpen,
    setChatPending,
    setChatPersona,
  } = useStore()

  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const [historyLoaded, setHistoryLoaded] = React.useState(false)
  const [isListening, setIsListening] = React.useState(false)
  const [isVoiceMode, setIsVoiceMode] = React.useState(false)

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [chatMessages, chatPending, chatOpen])

  React.useEffect(() => {
    if (!audit?.id) {
      return
    }

    resetChatForAudit(audit.id)
    setHistoryLoaded(false)
  }, [audit?.id, resetChatForAudit])

  React.useEffect(() => {
    if (!chatOpen || !audit?.id || historyLoaded) {
      return
    }

    let cancelled = false

    const loadHistory = async () => {
      try {
        setChatPending(true)
        const history = await fetchChatHistory(audit.id)

        if (cancelled) {
          return
        }

        setActiveChatAuditId(audit.id)
        setChatMessages(history)
        setHistoryLoaded(true)
      } catch (error) {
        console.error(error)
      } finally {
        if (!cancelled) {
          setChatPending(false)
        }
      }
    }

    void loadHistory()

    return () => {
      cancelled = true
    }
  }, [
    audit?.id,
    chatOpen,
    historyLoaded,
    setActiveChatAuditId,
    setChatMessages,
    setChatPending,
  ])

  if (!audit) {
    return null
  }

  const handleSendMessage = async (message: string) => {
    const trimmedMessage = message.trim()

    if (!trimmedMessage || chatPending) {
      return
    }

    const optimisticUserMessage = toChatMessage(
      { role: 'user', content: trimmedMessage },
      `user-${Date.now()}`,
    )

    addChatMessage(optimisticUserMessage)
    setChatInput('')
    setChatPending(true)

    try {
      const reply = await sendAuditChatMessage(audit.id, trimmedMessage, chatPersona)
      addChatMessage(reply)
      setHistoryLoaded(true)
      if (isVoiceMode) {
        speechEngine.speak(reply.content)
      }
    } catch (error) {
      console.error(error)
      addChatMessage({
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'The backend chat request failed. Please make sure the FastAPI server is running and try again.',
      })
    } finally {
      setChatPending(false)
    }
  }

  const toggleListening = () => {
    if (isListening) {
      voiceRecognition.stop()
      setIsListening(false)
    } else {
      if (!voiceRecognition.isSupported()) {
        alert("Voice recognition is not supported in this browser.")
        return
      }
      setIsListening(true)
      setIsVoiceMode(true)
      speechEngine.stop() // stop any current speech
      voiceRecognition.start(
        (text, isFinal) => {
          setChatInput(text)
          if (isFinal) {
            void handleSendMessage(text)
            setIsListening(false)
          }
        },
        (err) => {
          console.error("Speech recognition error:", err)
          setIsListening(false)
        },
        () => {
          setIsListening(false)
        }
      )
    }
  }

  return (
    <>
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
            onClick={() => setChatOpen(false)}
          />
        )}
      </AnimatePresence>

      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-3 rounded-full border border-orange-400/20 bg-slate-900/90 px-4 py-3 text-sm font-medium text-white shadow-2xl shadow-slate-950/50 backdrop-blur-xl transition hover:scale-[1.02] hover:border-orange-300/30"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
            <MessageSquare className="h-5 w-5" />
          </span>
          <span className="hidden pr-1 sm:block">
            <span className="block text-left text-xs uppercase tracking-[0.24em] text-slate-400">Talk To AI</span>
            <span className="block text-left text-sm text-white">Ask about this audit</span>
          </span>
        </button>
      )}

      <AnimatePresence>
        {chatOpen && (
          <motion.aside
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-2xl md:w-[460px]"
          >
            <div className="border-b border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-500 p-3 text-white shadow-lg shadow-orange-500/20">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">Conversational Assistant</p>
                    <h3 className="mt-1 text-xl font-bold text-white">Talk to UX Guardian</h3>
                    <p className="mt-1 text-sm text-slate-400">Dummy state for now. Backend chat can plug in later.</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {isVoiceMode && (
                    <button
                      onClick={() => {
                        setIsVoiceMode(false)
                        speechEngine.stop()
                      }}
                      className="rounded-full border border-orange-500/30 bg-orange-500/10 p-2 text-orange-400 transition hover:bg-orange-500/20"
                      title="Stop speaking"
                    >
                      <VolumeX className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setChatOpen(false)
                      speechEngine.stop()
                    }}
                    className="rounded-full border border-white/10 p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Persona Toggle */}
              <div className="mt-5 flex rounded-xl border border-white/10 bg-slate-900/50 p-1">
                <button
                  onClick={() => setChatPersona('developer')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                    chatPersona === 'developer'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-300'
                  }`}
                >
                  <Code2 className="h-3.5 w-3.5" /> Developer Mode
                </button>
                <button
                  onClick={() => setChatPersona('ceo')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                    chatPersona === 'ceo'
                      ? 'bg-gradient-to-r from-orange-500/80 to-yellow-500/80 text-white shadow-sm'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-300'
                  }`}
                >
                  <Briefcase className="h-3.5 w-3.5" /> Executive Mode
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-orange-400/15 bg-orange-500/10 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-orange-200">
                  <Sparkles className="h-4 w-4" />
                  {chatPersona === 'developer' ? 'Technical context active' : 'Business impact context active'}
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {chatPersona === 'developer' 
                    ? 'Ask for priorities, CSS selectors, component architecture, or help deciding what to fix first.'
                    : 'Ask for ROI estimates, conversion drop-off analysis, and executive summaries of the audit.'}
                </p>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
              {!chatPending && chatMessages.length === 0 && (
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-slate-300">
                  No conversation yet. Ask for fix priority, accessibility guidance, or help understanding one specific issue.
                </div>
              )}

              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-200">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-lg ${
                      message.role === 'user'
                        ? 'rounded-br-md bg-white/10 text-slate-100'
                        : 'rounded-bl-md border border-orange-400/15 bg-orange-500/10 text-slate-200'
                    }`}
                  >
                    {message.content}
                  </div>

                  {message.role === 'user' && (
                    <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-slate-200">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {chatPending && (
                <div className="flex gap-3">
                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-200">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-3xl rounded-bl-md border border-orange-400/15 bg-orange-500/10 px-4 py-3 text-slate-200">
                    <Loader2 className="h-4 w-4 animate-spin text-orange-300" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => void handleSendMessage(prompt)}
                    className="whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-orange-400/20 hover:bg-orange-500/10 hover:text-white"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  void handleSendMessage(chatInput)
                }}
                className="flex items-end gap-3 rounded-[24px] border border-white/10 bg-slate-950/70 p-3"
              >
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition ${
                    isListening 
                      ? 'bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)] animate-pulse' 
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                  title={isListening ? "Stop listening" : "Start speaking"}
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
                <textarea
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder="Ask a question about the audit..."
                  rows={1}
                  className="max-h-32 min-h-[48px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatPending}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg shadow-orange-500/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
