import { useState, useRef, useEffect } from 'react'
import { Mic, Send, X, Square, Settings, Minimize2, Download, Maximize2, Check, Cloud, HardDrive } from 'lucide-react'

// Define the API exposed by electron
declare global {
  interface Window {
    electronAPI: {
      sendMessageToAgent: (message: string) => Promise<{ response: string }>
      resizeWindow: (width: number, height: number) => void
      onExpandWindow: (callback: () => void) => void
      quitApp: () => void
      showContextMenu: () => void
      checkForUpdates: () => void
    }
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

type Message = {
  id: string
  role: 'user' | 'agent'
  content: string
}

type ModelInfo = {
  name: string
  size: string
}

const RECOMMENDED_LOCAL_MODELS = [
  { name: 'llama3', size: '~4.7 GB' },
  { name: 'qwen', size: '~4.5 GB' },
  { name: 'gemma', size: '~5.0 GB' },
  { name: 'phi3', size: '~2.3 GB' }
]

const CLOUD_PROVIDERS = [
  { id: 'local', name: 'Local' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'groq', name: 'Groq' },
  { id: 'xai', name: 'xAI (Grok)' },
  { id: 'gemini', name: 'Gemini' }
]

const CLOUD_MODELS: Record<string, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
  groq: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
  xai: ['grok-4.7', 'grok-build-0.1', 'grok-4.3', 'grok-4.20'],
  gemini: ['gemini-1.5-pro', 'gemini-1.5-flash']
}

function App() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'agent', content: 'Ready.' }
  ])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  
  // User Profile State
  const [userProfile, setUserProfile] = useState<{name: string, bio: string} | null>(() => {
    const saved = localStorage.getItem('orbitUserProfile')
    return saved ? JSON.parse(saved) : null
  })
  
  // Form state for onboarding
  const [onboardingName, setOnboardingName] = useState('')
  const [onboardingBio, setOnboardingBio] = useState('')
  
  const [localModels, setLocalModels] = useState<ModelInfo[]>([])
  
  // Settings state
  const [provider, setProvider] = useState<string>(() => localStorage.getItem('provider') || 'local')
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(() => JSON.parse(localStorage.getItem('apiKeys') || '{}'))
  const [selectedModel, setSelectedModel] = useState<string>(() => localStorage.getItem('selectedModel') || '')
  
  // Audio state
  const [micDevices, setMicDevices] = useState<{deviceId: string, label: string}[]>([])
  const [selectedMic, setSelectedMic] = useState<string>(() => localStorage.getItem('selectedMic') || '')
  const [isListening, setIsListening] = useState(false)
  
  const [downloadModelName, setDownloadModelName] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [showSavedMsg, setShowSavedMsg] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<BlobPart[]>([])
  const processingAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    processingAudioRef.current = new Audio('/daviddumaisaudio-sci-fi-technology-scanner-194042.mp3')
    processingAudioRef.current.loop = true
    processingAudioRef.current.volume = 0.5
  }, [])

  useEffect(() => {
    if (isProcessing) {
      processingAudioRef.current?.play().catch(e => console.log('Audio play prevented', e))
    } else {
      if (processingAudioRef.current) {
        processingAudioRef.current.pause()
      }
    }
  }, [isProcessing])

  const playClickSound = () => {
    const audio = new Audio('/soundshelfstudio-sci-fi-ui-click-sound-596258.mp3')
    audio.volume = 0.4
    audio.play().catch(e => console.log('Audio play prevented', e))
  }

  const handleStop = () => {
    playClickSound()
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsProcessing(false)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (window.electronAPI.onExpandWindow) {
      window.electronAPI.onExpandWindow(() => {
        setIsCollapsed(false)
        window.electronAPI.resizeWindow(400, 600)
      })
    }
  }, [])

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('provider', provider)
    localStorage.setItem('apiKeys', JSON.stringify(apiKeys))
    localStorage.setItem('selectedModel', selectedModel)
    localStorage.setItem('selectedMic', selectedMic)
  }, [provider, apiKeys, selectedModel, selectedMic])

  // When provider changes, select a default model if none selected
  useEffect(() => {
    if (provider !== 'local' && CLOUD_MODELS[provider]) {
      if (!selectedModel || !CLOUD_MODELS[provider].includes(selectedModel)) {
        setSelectedModel(CLOUD_MODELS[provider][0])
      }
    }
  }, [provider])
  
  // Persist chat history
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('orbitChatHistory', JSON.stringify(messages))
    }
  }, [messages])

  // Load chat history on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('orbitChatHistory')
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages))
      } catch (e) {}
    }
  }, [])
    if (provider !== 'local') {
      const models = CLOUD_MODELS[provider]
      if (models && !models.includes(selectedModel)) {
        setSelectedModel(models[0])
      }
    } else {
      if (localModels.length > 0 && !localModels.find(m => m.name === selectedModel)) {
        setSelectedModel(localModels[0].name)
      }
    }
  }, [provider, localModels])

  const fetchLocalModels = async () => {
    if (provider !== 'local' && !showSettings) return
    try {
      const res = await fetch('http://127.0.0.1:8000/api/models')
      const data = await res.json()
      if (data.models) {
        setLocalModels(data.models)
      }
    } catch (e) {
      console.error('Failed to fetch local models', e)
    }
  }
  
  const fetchMicDevices = async () => {
    try {
      // Ask for permission first to populate labels
      await navigator.mediaDevices.getUserMedia({ audio: true })
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioDevices = devices.filter(d => d.kind === 'audioinput')
      setMicDevices(audioDevices)
      if (audioDevices.length > 0 && !selectedMic) {
        setSelectedMic(audioDevices[0].deviceId)
      }
    } catch (e) {
      console.error("Mic access denied or error:", e)
    }
  }

  useEffect(() => {
    fetchLocalModels()
  }, [provider])

  useEffect(() => {
    if (showSettings) {
      fetchLocalModels()
      fetchMicDevices()
    }
  }, [showSettings])

  const handleDownloadModel = async () => {
    playClickSound()
    if (!downloadModelName.trim()) return
    setIsDownloading(true)
    try {
      const res = await fetch('http://127.0.0.1:8000/api/models/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_name: downloadModelName })
      })
      if (res.ok) {
        setDownloadModelName('')
        fetchLocalModels()
      } else {
        alert("Download failed. Make sure the local model provider is running.")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleApiKeyChange = (p: string, key: string) => {
    setApiKeys(prev => ({ ...prev, [p]: key }))
  }

  const handleSaveSettings = () => {
    playClickSound()
    setShowSavedMsg(true)
    setTimeout(() => {
      setShowSavedMsg(false)
      setShowSettings(false)
    }, 1000)
  }

  const handleMicClick = async () => {
    playClickSound()
    
    if (isListening) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      setIsListening(false)
      return
    }

    // Determine the groq key
    const groqKey = apiKeys['groq'] || ''
    if (!groqKey) {
      alert("Please configure a Groq API Key in Settings for speech recognition.")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: selectedMic ? { deviceId: { exact: selectedMic } } : true 
      })
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const formData = new FormData()
        formData.append('file', audioBlob, 'recording.webm')
        formData.append('api_key', groqKey)

        setIsProcessing(true)
        try {
          const res = await fetch('http://127.0.0.1:8000/api/transcribe', {
            method: 'POST',
            body: formData
          })
          if (res.ok) {
            const data = await res.json()
            if (data.text) {
              setInput(prev => prev + (prev ? ' ' : '') + data.text.trim())
            }
          } else {
            console.error("Transcription failed")
          }
        } catch (e) {
          console.error("Transcription API error", e)
        } finally {
          setIsProcessing(false)
        }
        
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsListening(true)
    } catch (e) {
      alert("Microphone permission denied or device error.")
      setIsListening(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing) return
    playClickSound()

    if (!selectedModel) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'agent', content: 'Please select or download a model first.' }])
      return
    }

    if (provider !== 'local' && !apiKeys[provider]) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'agent', content: `Please enter your ${CLOUD_PROVIDERS.find(p=>p.id===provider)?.name} API Key in settings first.` }])
      return
    }

    const userMessage = input.trim()
    setInput('')
    setIsProcessing(true)

    const finalMessageContext = userProfile && messages.length <= 1
      ? `[User Profile - Name: ${userProfile.name}, Bio: ${userProfile.bio}]\n${userMessage}`
      : userMessage

    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMessage }])

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const res = await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: finalMessageContext, 
          model: selectedModel,
          provider: provider,
          api_key: apiKeys[provider] || ''
        })
      })
      const result = await res.json()
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'agent', content: result.response }])
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'agent', content: 'Task aborted by user.' }])
      } else {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'agent', content: 'System Error: Could not connect to Python agent backend. Is it running?' }])
      }
    } finally {
      setIsProcessing(false)
      abortControllerRef.current = null
    }
  }

  const toggleCollapse = () => {
    playClickSound()
    const nextState = !isCollapsed
    setIsCollapsed(nextState)
    if (nextState) {
      window.electronAPI.resizeWindow(100, 100)
    } else {
      window.electronAPI.resizeWindow(400, 600)
    }
  }

  const handleRightClickContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    if (window.electronAPI.showContextMenu) {
      window.electronAPI.showContextMenu()
    }
  }

  const handleQuitApp = () => {
    if (window.electronAPI.quitApp) {
      window.electronAPI.quitApp()
    }
  }
  
  const handleCheckUpdates = () => {
    playClickSound()
    if (window.electronAPI.checkForUpdates) {
      window.electronAPI.checkForUpdates()
    }
  }
  
  const handleSaveOnboarding = () => {
    playClickSound()
    const profile = { name: onboardingName.trim() || 'User', bio: onboardingBio.trim() || 'No bio provided' }
    setUserProfile(profile)
    localStorage.setItem('orbitUserProfile', JSON.stringify(profile))
  }
  
  const clearHistory = () => {
    playClickSound()
    setMessages([])
    localStorage.removeItem('orbitChatHistory')
    setShowHistory(false)
  }

  const availableModels = provider === 'local' ? localModels.map(m => m.name) : CLOUD_MODELS[provider] || []

  if (isCollapsed) {
    return (
      <div 
        className="relative w-screen h-screen flex items-center justify-center bg-transparent group"
        onContextMenu={handleRightClickContextMenu}
      >
        <div className="absolute inset-0" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />
        
        <div className="w-16 h-16 rounded-full overflow-hidden shadow-[0_0_20px_rgba(110,231,183,0.5)] animate-pulse border-2 border-[#6EE7B7] relative pointer-events-none">
          <img src="/icon.png" alt="Orbit Logo" className="w-full h-full object-cover" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-[#0B0D10] text-[#E6EAF0] overflow-hidden rounded-lg border border-[#252B33] cyber-glow relative">
      <video 
        autoPlay 
        loop 
        muted 
        playsInline 
        className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none z-0"
      >
        <source src="/258439.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D10]/80 to-[#0B0D10]/95 pointer-events-none z-0" />

      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col h-full">
      {/* Header (Drag Area) */}
      <div className="h-12 flex items-center justify-between px-3 bg-[#12161B]/80 backdrop-blur-sm border-b border-[#252B33]" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <div className="flex items-center gap-2 shrink-0">
          <img src="/icon.png" alt="Logo" className="w-5 h-5 rounded-full pointer-events-none" />
          <div className="text-xs font-bold tracking-widest text-[#E6EAF0]">ORBIT</div>
        </div>
        
        {/* Model Selector */}
        {!showSettings && (
          <div className="flex-1 flex justify-center items-center gap-1.5 mx-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <div 
              className="flex items-center gap-1 px-2 py-1 bg-[#12161B] border border-[#252B33] rounded text-[10px] uppercase font-semibold tracking-wider text-[#8B949E]"
              title={provider === 'local' ? "Local Provider" : "Cloud Provider"}
            >
              {provider === 'local' ? <HardDrive size={10} /> : <Cloud size={10} />}
              <span className="hidden sm:inline">{CLOUD_PROVIDERS.find(p=>p.id===provider)?.name || provider}</span>
            </div>
            
            <select 
              value={selectedModel} 
              onChange={e => {
                playClickSound()
                setSelectedModel(e.target.value)
              }}
              className="bg-[#181D23]/80 border border-[#252B33] rounded px-2 py-1 text-xs outline-none focus:border-[#6EE7B7] w-full max-w-[140px] text-ellipsis text-center appearance-none cursor-pointer"
              title={`Provider: ${CLOUD_PROVIDERS.find(p => p.id === provider)?.name}`}
            >
              <option value="" disabled>Select Model...</option>
              {availableModels.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-1 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button onClick={toggleCollapse} className="p-1.5 text-[#8B949E] hover:text-[#E6EAF0] transition-colors" title="Collapse">
            <Minimize2 size={16} />
          </button>
          <button onClick={() => { playClickSound(); setShowSettings(!showSettings) }} className={`p-1.5 transition-colors ${showSettings ? 'text-[#6EE7B7]' : 'text-[#8B949E] hover:text-[#E6EAF0]'}`} title="Settings">
            <Settings size={16} />
          </button>
        </div>
      </div>

      {showSettings ? (
        <div className="flex-1 p-6 bg-transparent overflow-y-auto custom-scrollbar flex flex-col z-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-[#6EE7B7]">App Settings</h2>
          </div>
          
          <div className="mb-6 flex-1">
            <h3 className="text-sm font-medium text-[#8B949E] mb-2">Microphone Device</h3>
            <select 
              value={selectedMic} 
              onChange={e => { playClickSound(); setSelectedMic(e.target.value) }}
              className="w-full bg-[#181D23] border border-[#252B33] rounded px-3 py-2 text-sm outline-none focus:border-[#6EE7B7] mb-6 cursor-pointer"
            >
              {micDevices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || 'Default Microphone'}</option>
              ))}
            </select>

            <h3 className="text-sm font-medium text-[#8B949E] mb-2">AI Provider</h3>
            <select 
              value={provider} 
              onChange={e => { playClickSound(); setProvider(e.target.value) }}
              className="w-full bg-[#181D23] border border-[#252B33] rounded px-3 py-2 text-sm outline-none focus:border-[#6EE7B7] mb-3 cursor-pointer"
            >
              {CLOUD_PROVIDERS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            
            {provider !== 'local' && (
              <div className="mb-4">
                <label className="block text-xs text-[#8B949E] mb-1">API Key</label>
                <div className="flex gap-2">
                  <input 
                    type="password" 
                    value={apiKeys[provider] || ''}
                    onChange={e => handleApiKeyChange(provider, e.target.value)}
                    placeholder={`Enter ${CLOUD_PROVIDERS.find(p=>p.id===provider)?.name} API Key`}
                    className="flex-1 bg-[#181D23] border border-[#252B33] rounded px-3 py-2 text-sm outline-none focus:border-[#6EE7B7]"
                  />
                </div>
              </div>
            )}

            {provider === 'local' && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-[#8B949E] mb-2">Download Recommended Local Models</h3>
                <div className="flex gap-2 flex-wrap mb-3">
                  {RECOMMENDED_LOCAL_MODELS.map(m => (
                    <button 
                      key={m.name}
                      onClick={() => setDownloadModelName(m.name)}
                      className="bg-[#181D23] border border-[#252B33] rounded px-3 py-1 text-xs hover:border-[#6EE7B7] transition-colors"
                    >
                      {m.name} <span className="text-[#8B949E] ml-1">{m.size}</span>
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={downloadModelName}
                    onChange={e => setDownloadModelName(e.target.value)}
                    placeholder="Or type model name..." 
                    className="flex-1 bg-[#181D23] border border-[#252B33] rounded px-3 py-1 text-sm outline-none focus:border-[#6EE7B7]"
                  />
                  <button 
                    onClick={handleDownloadModel}
                    disabled={isDownloading || !downloadModelName.trim()}
                    className="bg-[#6EE7B7] text-[#0B0D10] px-3 py-1 rounded text-sm font-semibold flex items-center gap-1 hover:bg-opacity-80 disabled:opacity-50 min-w-[80px] justify-center"
                  >
                    {isDownloading ? 'Pulling...' : <><Download size={14} /> Pull</>}
                  </button>
                </div>
                {isDownloading && <p className="text-xs text-[#6EE7B7] mt-2 animate-pulse">Download started. This may take several minutes depending on your internet connection and the model size.</p>}
              </div>
            )}

            {provider === 'local' && (
              <div>
                <h3 className="text-sm font-medium text-[#8B949E] mb-2">Installed Models</h3>
                {localModels.length === 0 ? (
                  <p className="text-xs text-[#8B949E]">No models found. Make sure the local model provider is running and download a model above.</p>
                ) : (
                  <ul className="space-y-2">
                    {localModels.map(m => (
                      <li key={m.name} className="flex justify-between bg-[#181D23] border border-[#252B33] px-3 py-2 rounded text-sm">
                        <span>{m.name}</span>
                        <span className="text-[#8B949E] text-xs">{m.size}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-3 mt-auto">
            <button 
              onClick={handleCheckUpdates}
              className="w-full bg-transparent border border-[#6EE7B7] text-[#6EE7B7] py-2 rounded font-semibold flex items-center justify-center gap-2 hover:bg-[#6EE7B7] hover:text-[#0B0D10] transition-colors"
            >
              Check for OTA Updates
            </button>
            
            <button 
              onClick={handleSaveSettings}
              className="w-full bg-[#6EE7B7] text-[#0B0D10] py-2 rounded font-semibold flex items-center justify-center gap-2 hover:bg-opacity-90 transition-colors"
            >
              {showSavedMsg ? <><Check size={18} /> Saved & Applied</> : 'Save Settings'}
            </button>
            
            <button 
              onClick={handleQuitApp}
              className="w-full bg-transparent border border-[#EF4444] text-[#EF4444] py-2 rounded font-semibold flex items-center justify-center gap-2 hover:bg-[#EF4444] hover:text-white transition-colors"
            >
              <X size={18} /> Quit Orbit
            </button>
          </div>
        </div>
      ) : showHistory ? (
        <div className="flex-1 p-6 bg-transparent overflow-y-auto custom-scrollbar flex flex-col z-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-[#6EE7B7]">Chat History</h2>
            <button 
              onClick={clearHistory} 
              className="bg-[#EF4444] text-white px-3 py-1 text-xs rounded hover:bg-[#DC2626] transition-colors flex items-center gap-1"
            >
              <RefreshCw size={12} /> Clear Session
            </button>
          </div>
          
          <div className="flex-1 flex items-center justify-center text-sm text-[#8B949E] text-center px-4 bg-[#12161B]/80 rounded p-4 border border-[#252B33]">
            <p>Your chat is automatically restored when you open Orbit. 
            <br/><br/>Click the 'Clear Session' button above to start a fresh context.</p>
          </div>
          
          <button 
            onClick={() => setShowHistory(false)}
            className="w-full mt-6 bg-[#6EE7B7] text-[#0B0D10] py-2 rounded font-semibold flex items-center justify-center gap-2 hover:bg-opacity-90 transition-colors"
          >
            Back to Chat
          </button>
        </div>
      ) : (
        <>
          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar z-10">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 break-words whitespace-pre-wrap ${
                  msg.role === 'user' 
                    ? 'bg-[#181D23]/90 border border-[#252B33]' 
                    : 'bg-transparent text-[#E6EAF0]'
                }`}>
                  {msg.role === 'agent' && <span className="font-semibold text-[#6EE7B7] mr-2">Orbit:</span>}
                  {msg.content}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl px-4 py-2 text-[#8B949E] animate-pulse">
                  Orbit is thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-[#12161B]/90 backdrop-blur-md border-t border-[#252B33] z-10">
            <form onSubmit={handleSubmit} className="flex items-center bg-[#0B0D10]/80 rounded-full border border-[#252B33] p-1 px-3 focus-within:border-[#6EE7B7] transition-colors">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Orbit..."
                className="flex-1 bg-transparent border-none outline-none text-sm px-2 py-2 text-[#E6EAF0] placeholder-[#8B949E]"
              />
              <button 
                type="button" 
                onClick={handleMicClick}
                className={`p-2 transition-colors ${isListening ? 'text-[#6EE7B7] animate-pulse' : 'text-[#8B949E] hover:text-[#E6EAF0]'}`}
                title="Voice Input"
              >
                <Mic size={18} />
              </button>
              {isProcessing ? (
                <button 
                  type="button" 
                  onClick={handleStop}
                  className="p-2 text-[#F87171] hover:text-[#EF4444] transition-colors"
                  title="Stop processing"
                >
                  <Square size={18} fill="currentColor" />
                </button>
              ) : (
                <button 
                  type="submit" 
                  disabled={!input.trim()}
                  className={`p-2 transition-colors ${input.trim() ? 'text-[#6EE7B7]' : 'text-[#8B949E]'}`}
                >
                  <Send size={18} />
                </button>
              )}
            </form>
          </div>
        </>
      )}
      </div>
    </div>
  )
}

export default App
