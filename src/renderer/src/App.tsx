import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Copy, 
  Settings, 
  Shield, 
  Zap, 
  X, 
  Minus, 
  Square,
  Layout,
  Terminal,
  Activity,
  Check,
  Server,
  Hash,
  Users,
  Smile,
  Image as ImageIcon,
  Type,
  Plus,
  Trash2,
  ExternalLink,
  Star,
  Download,
  AlertCircle,
  Languages,
  HelpCircle,
  Info,
  RefreshCw,
  MessageSquare,
  Github,
  ArrowUpCircle
} from 'lucide-react'
import { translations } from './translations'
import { APP_CONFIG } from './config'
import logo from './assets/logo.png'

const OptionToggle = ({ label, icon: Icon, active, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
      active 
      ? 'bg-primary/5 border-primary/40 text-white shadow-neon-blue' 
      : 'bg-white/[0.02] border-white/5 text-white/30 hover:bg-white/[0.05] hover:border-white/10'
    }`}
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg transition-colors ${active ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/20'}`}>
        <Icon size={18} />
      </div>
      <span className="text-sm font-bold tracking-tight">{label}</span>
    </div>
    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
      active ? 'bg-primary border-primary' : 'border-white/10'
    }`}>
      {active && <Check size={12} className="text-white" />}
    </div>
  </div>
)

const App = () => {
  const [lang, setLang] = useState<'en' | 'tr'>(() => {
    return (localStorage.getItem('elite_lang') as 'en' | 'tr') || 'en'
  })
  const t = (key: keyof typeof translations['en']) => translations[lang][key]

  const [theme, setTheme] = useState<'dark' | 'night'>(() => {
    return (localStorage.getItem('elite_theme') as 'dark' | 'night') || 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('theme-night')
    if (theme === 'night') root.classList.add('theme-night')
    localStorage.setItem('elite_theme', theme)
  }, [theme])

  const [isUpdateRequired, setIsUpdateRequired] = useState(false)
  const [latestVersion, setLatestVersion] = useState(APP_CONFIG.version)
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(true)

  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(true)
  const [showWelcome, setShowWelcome] = useState(false)
  const [rememberedUser, setRememberedUser] = useState<any>(null)
  
  const [view, setView] = useState<'clone' | 'tokens' | 'templates' | 'settings' | 'mirror' | 'deleter' | 'hypesquad'>('clone')
  const [token, setToken] = useState('')
  const [sourceId, setSourceId] = useState('')
  const [targetId, setTargetId] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [messageLimit, setMessageLimit] = useState(50)
  const [isCloning, setIsCloning] = useState(false)
  const [isMirroring, setIsMirroring] = useState(false)
  const [isDeletingWebhook, setIsDeletingWebhook] = useState(false)
  const [isUpdatingHypeSquad, setIsUpdatingHypeSquad] = useState(false)
  const [selectedHouse, setSelectedHouse] = useState<number>(1)
  const [streamerMode, setStreamerMode] = useState(() => {
    return localStorage.getItem('elite_streamer_mode') === 'true'
  })

  useEffect(() => {
    window.api.setStreamerMode(streamerMode)
    localStorage.setItem('elite_streamer_mode', streamerMode.toString())
  }, [streamerMode])
  
  useEffect(() => {
    checkUpdates()
  }, [])

  const checkUpdates = async () => {
    setIsCheckingUpdate(true)
    try {
      const response = await fetch(APP_CONFIG.version_url)
      const data = await response.json()
      setLatestVersion(data.version)
      
      if (data.version !== APP_CONFIG.version) {
        setIsUpdateRequired(true)
      }
    } catch (err) {
      console.log('Update check failed')
    }
    setIsCheckingUpdate(false)
  }

  const [tokenList, setTokenList] = useState<{
    token: string;
    valid: boolean;
    user?: any;
    hasNitro?: boolean;
    checking?: boolean;
  }[]>(() => {
    const saved = localStorage.getItem('elite_tokens')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('elite_tokens', JSON.stringify(tokenList))
  }, [tokenList])

  useEffect(() => {
    const savedToken = localStorage.getItem('remembered_token')
    const savedUser = localStorage.getItem('remembered_user')
    
    if (savedToken && savedUser) {
      setRememberedUser(JSON.parse(savedUser))
      setShowWelcome(true)
      setToken(savedToken)
    } else if (savedToken) {
      handleInitialAuth(savedToken)
    }
  }, [])

  const handleInitialAuth = async (t_arg: string) => {
    setIsAuthorizing(true)
    const result = await window.api.checkToken(t_arg)
    if (result.valid) {
      setToken(t_arg)
      setIsAuthorized(true)
      if (rememberMe) {
        localStorage.setItem('remembered_user', JSON.stringify(result.user))
      }
    } else {
      localStorage.removeItem('remembered_token')
      localStorage.removeItem('remembered_user')
    }
    setIsAuthorizing(false)
  }

  const [savedTemplates, setSavedTemplates] = useState<{
    id: string;
    name: string;
    sourceName: string;
    sourceId: string;
    options: any;
    date: string;
  }[]>(() => {
    const saved = localStorage.getItem('elite_templates')
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Elite Carbon Layout', sourceName: 'Gaming Hub', sourceId: '123456789', options: {}, date: '2026-02-15' }
    ]
  })

  useEffect(() => {
    localStorage.setItem('elite_templates', JSON.stringify(savedTemplates))
  }, [savedTemplates])

  const [options, setOptions] = useState({
    roles: true,
    channels: true,
    emojis: true,
    stickers: true,
    serverIcon: true,
    serverName: true,
    pastMessages: false,
    allHistory: false,
    live: false
  })
  
  const [logs, setLogs] = useState<{msg: string, type: 'info' | 'success' | 'error'}[]>(() => [
    { msg: translations[(localStorage.getItem('elite_lang') as 'en' | 'tr') || 'en'].log_init, type: 'info' }
  ])

  useEffect(() => {
    window.api.onLog((log) => {
      setLogs(prev => [...prev, log].slice(-50))
    })
  }, [])

  const addLog = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [...prev, { msg, type }].slice(-50))
  }

  const handleClone = async () => {
    if (!token || !sourceId || !targetId) {
      addLog(t('log_auth_required'), 'error')
      return
    }
    setLogs([]) // Clear logs for new session
    setIsCloning(true)
    try {
      await window.api.startClone({ token, sourceId, targetId, options })
    } catch (err: any) {
      addLog(err.message, 'error')
    } finally {
      setIsCloning(false)
    }
  }

  const handleMirror = async () => {
    if (!token || !sourceId || !webhookUrl) {
      addLog(t('log_auth_required'), 'error')
      return
    }
    if (!options.pastMessages && !options.live && !options.allHistory) {
      addLog(translations[lang].log_mirror_option_required, 'error')
      return
    }
    setLogs([]) // Clear logs for new session
    setIsMirroring(true)
    try {
      // Direct call with extra existence check
      const mirrorFunc = window.api?.mirror || (window as any).mirror
      
      if (typeof mirrorFunc !== 'function') {
        console.error('Mirror function is missing in window.api:', window.api)
        throw new Error('Elite Engine: Mirror function not detected. Please RUN THE CLEAN COMMAND from terminal.')
      }

      await mirrorFunc({ 
        token, 
        channelId: sourceId, 
        webhookUrl, 
        options: { 
          pastMessages: options.pastMessages || options.allHistory, 
          live: options.live,
          limit: options.allHistory ? 0 : messageLimit 
        } 
      })
    } catch (err: any) {
      addLog(err.message, 'error')
    } finally {
      setIsMirroring(false)
    }
  }

  const handleStop = () => {
    window.api.stopClone()
    addLog(t('log_stop_sent'), 'info')
    setIsCloning(false)
    setIsMirroring(false)
  }

  const handleDeleteWebhook = async () => {
    if (!webhookUrl) return
    setIsDeletingWebhook(true)
    addLog(`Initiating destruction sequence for: ${webhookUrl}`, 'info')
    
    try {
      const result = await window.api.deleteWebhook(webhookUrl)
      if (result.success) {
        addLog(t('log_webhook_deleted'), 'success')
        setWebhookUrl('')
      } else {
        addLog(t('log_webhook_delete_failed'), 'error')
      }
    } catch (err: any) {
      addLog(err.message, 'error')
    } finally {
      setIsDeletingWebhook(false)
    }
  }

  const handleChangeHypeSquad = async () => {
    if (!token) {
      addLog(t('log_auth_required'), 'error')
      return
    }
    setIsUpdatingHypeSquad(true)
    addLog(`Updating HypeSquad house to ID: ${selectedHouse}`, 'info')
    
    try {
      const result = await window.api.changeHypeSquad({ token, houseId: selectedHouse })
      if (result.success) {
        addLog(t('log_hypesquad_updated'), 'success')
      } else {
        addLog(t('log_hypesquad_failed'), 'error')
      }
    } catch (err: any) {
      addLog(err.message, 'error')
    } finally {
      setIsUpdatingHypeSquad(false)
    }
  }

  const toggleOption = (key: keyof typeof options) => {
    setOptions(prev => {
      const next = { ...prev };
      if (key === 'live') {
        next.live = !prev.live;
        if (next.live) { 
          next.pastMessages = false; 
          next.allHistory = false; 
        }
      } else if (key === 'pastMessages') {
        next.pastMessages = !prev.pastMessages;
        if (next.pastMessages) { 
          next.live = false; 
          next.allHistory = false; 
        }
      } else if (key === 'allHistory') {
        next.allHistory = !prev.allHistory;
        if (next.allHistory) { 
          next.pastMessages = false; 
          next.live = false; 
        }
      } else {
        (next as any)[key] = !(prev as any)[key];
      }
      return next;
    });
  }

  const toggleAllOptions = () => {
    const cloneKeys: (keyof typeof options)[] = ['roles', 'channels', 'emojis', 'stickers', 'serverIcon', 'serverName']
    const allSelected = cloneKeys.every(k => options[k])
    
    setOptions(prev => {
      const next = { ...prev }
      cloneKeys.forEach(k => {
        next[k] = !allSelected
      })
      return next
    })
  }

  const handleStreamerMode = (enabled: boolean) => {
    setStreamerMode(enabled)
  }

  const addToken = async (newToken: string) => {
    if (!newToken) return
    const tempToken = { token: newToken, valid: false, checking: true }
    setTokenList(prev => [...prev, tempToken])
    try {
      const result = await window.api.checkToken(newToken)
      setTokenList(prev => prev.map(t_item => t_item.token === newToken ? { ...t_item, ...result, checking: false } : t_item))
      if (result.valid) {
        addLog(`${t('log_token_verified')} ${result.user.tag}`, 'success')
      }
    } catch (err) {
      setTokenList(prev => prev.map(t_item => t_item.token === newToken ? { ...t_item, checking: false, valid: false } : t_item))
    }
  }

  const handleLogin = async () => {
    if (!token) return
    setIsAuthorizing(true)
    setAuthError(null)
    const result = await window.api.checkToken(token)
    if (result.valid) {
      setIsAuthorized(true)
      if (rememberMe) {
        localStorage.setItem('remembered_token', token)
        localStorage.setItem('remembered_user', JSON.stringify(result.user))
      }
      if (!tokenList.find(t_item => t_item.token === token)) {
        setTokenList(prev => [...prev, { token, ...result, checking: false }])
      }
    } else {
      setAuthError(t('log_auth_failed'))
      addLog(t('log_auth_failed'), 'error')
    }
    setIsAuthorizing(false)
  }

  const removeToken = (tokenToRemove: string) => {
    setTokenList(prev => prev.filter(t_item => t_item.token !== tokenToRemove))
  }

  return (
    <div className="flex flex-col h-screen w-full bg-background relative border border-white/5 rounded-xl overflow-hidden shadow-2xl text-white">
      {/* Dynamic Background Effects */}
      {theme === 'dark' && (
        <>
          <div className="absolute inset-0 bg-dark-gradient opacity-40 pointer-events-none" />
          <div className="absolute -top-48 -left-48 w-full h-full bg-primary/5 rounded-full blur-[160px] pointer-events-none" />
        </>
      )}

      {/* Title Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-black/40 backdrop-blur-xl border-b border-white/[0.03] z-50 drag">
        <div className="flex items-center gap-3 no-drag">
          <img src={logo} alt="logo" className="w-6 h-6 grayscale opacity-60" />
          <span className="font-black tracking-[0.3em] text-[10px] text-white/40 uppercase">Conf CLONER Elite</span>
        </div>
        
        <div className="flex items-center gap-2 no-drag">
          <button onClick={() => window.api.minimize()} className="p-1.5 hover:bg-white/5 rounded-md transition-colors text-white/20 hover:text-white/60">
            <Minus size={14} />
          </button>
          <button onClick={() => window.api.close()} className="p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-md transition-colors text-white/20">
            <X size={14} />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isAuthorized ? (
          showWelcome ? (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex-1 flex items-center justify-center p-8 z-10"
            >
              <div className="glass-card p-12 w-full max-w-md space-y-8 text-center relative border-white/[0.05] bg-black/40 shadow-2xl">
                <div className="space-y-6">
                  <div className="relative w-24 h-24 mx-auto group">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse group-hover:bg-primary/40 transition-all duration-700" />
                    <div className="relative w-full h-full rounded-full border-2 border-white/10 overflow-hidden shadow-neon-blue">
                      {rememberedUser?.avatar ? (
                        <img 
                          src={`https://cdn.discordapp.com/avatars/${rememberedUser.id}/${rememberedUser.avatar}.png?size=256`} 
                          alt="avatar" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-white/5 flex items-center justify-center">
                          <Users size={40} className="text-white/20" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">{translations[lang].welcome_back}</h2>
                    <h1 className="text-3xl font-black tracking-tight text-white/90">
                      {rememberedUser?.username || 'User'}
                    </h1>
                    <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">
                      Session Securely Loaded
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <button 
                    onClick={() => setIsAuthorized(true)}
                    className="w-full py-4 bg-primary text-white rounded-xl font-black text-xs tracking-[0.2em] uppercase shadow-neon-blue hover:brightness-110 transition-all"
                  >
                    {translations[lang].continue_btn}
                  </button>
                  
                  <button 
                    onClick={() => {
                      localStorage.removeItem('remembered_token')
                      localStorage.removeItem('remembered_user')
                      setShowWelcome(false)
                      setToken('')
                      setAuthError(null)
                    }}
                    className="w-full py-3 bg-white/[0.02] hover:bg-white/5 text-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    {translations[lang].different_account}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="login"
              initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex items-center justify-center p-8 z-10"
          >
            <div className="glass-card p-12 w-full max-w-md space-y-10 relative border-white/[0.05] bg-black/40 shadow-xl">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-white/[0.02] border border-white/[0.05] rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-neon-blue">
                  <img src={logo} alt="logo" className="w-10 h-10 grayscale opacity-40" />
                </div>
                <h1 className="text-2xl font-black tracking-widest uppercase text-white/90 opacity-90">{t('auth_title')}</h1>
                <p className="text-white/20 opacity-40 text-[10px] font-bold tracking-[0.2em] uppercase">{t('auth_subtitle')}</p>
              </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <input 
                      type="password"
                      value={token}
                      onChange={(e) => {
                        setToken(e.target.value)
                        setAuthError(null)
                      }}
                      placeholder={t('token_placeholder')}
                      className={`w-full bg-black/60 border rounded-xl px-5 py-4 focus:outline-none transition-all font-mono text-sm text-center tracking-widest text-white ${
                        authError ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'border-white/[0.05] focus:border-primary/40'
                      }`}
                    />
                    
                    {authError && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-center gap-2 text-red-400 text-[10px] font-bold uppercase tracking-wider"
                      >
                        <AlertCircle size={14} />
                        {authError}
                      </motion.div>
                    )}
                    
                    <div 
                      onClick={() => setRememberMe(!rememberMe)}
                      className="flex items-center justify-center gap-4 py-4 group cursor-pointer select-none"
                    >
                      <div className={`relative w-12 h-6 rounded-full transition-all duration-500 border ${rememberMe ? 'bg-primary/20 border-primary/50 shadow-neon-blue' : 'bg-white/5 border-white/10'}`}>
                        <motion.div 
                          initial={false}
                          animate={{ x: rememberMe ? 26 : 4 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className={`absolute top-1 w-3.5 h-3.5 rounded-full shadow-lg transition-colors duration-500 ${rememberMe ? 'bg-white' : 'bg-white/20'}`}
                        />
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${rememberMe ? 'text-primary' : 'text-white/20 group-hover:text-white/40'}`}>
                        {t('remember_me')}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={handleLogin}
                    disabled={isAuthorizing || !token}
                    className="w-full py-4 bg-primary text-white rounded-xl font-black text-xs tracking-[0.2em] uppercase shadow-neon-blue hover:bg-primary/80 transition-all disabled:opacity-20 disabled:grayscale"
                  >
                    {isAuthorizing ? t('verifying') : t('enter_suite')}
                  </button>
                </div>
              </div>
            </motion.div>
          )
        ) : (
          <motion.div 
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-1 overflow-hidden"
          >
            {/* Minimal Sidebar */}
            <div className="w-20 border-r border-white/[0.03] bg-black/20 flex flex-col items-center py-8 gap-10">
              {[
                { id: 'clone', icon: Server },
                { id: 'mirror', icon: ArrowUpCircle },
                { id: 'deleter', icon: Trash2 },
                { id: 'hypesquad', icon: Star },
                { id: 'tokens', icon: Shield },
                { id: 'templates', icon: Activity },
                { id: 'settings', icon: Settings }
              ].map((item) => (
                <div 
                  key={item.id}
                  onClick={() => setView(item.id as any)}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    view === item.id 
                    ? 'bg-primary/10 text-primary shadow-neon-blue' 
                    : 'text-white/10 hover:text-white/40'
                  }`}
                >
                  <item.icon size={20} />
                </div>
              ))}
            </div>

            {/* Content Area */}
            <main className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-black/10">
              <div className="max-w-5xl mx-auto space-y-10">
                {view === 'clone' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                    <header className="space-y-2">
                      <h1 className="text-4xl font-black tracking-tight text-white/90">
                        CLONE <span className="text-primary">CORE</span>
                      </h1>
                      <p className="text-white/20 text-xs font-medium tracking-wide uppercase">{t('cloner_subtitle')}</p>
                    </header>

                    <div className="grid grid-cols-12 gap-8">
                      <div className="col-span-8 space-y-8">
                        <div className="glass-card p-8 bg-black/40 border-white/[0.03] space-y-8 shadow-sm">
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">{t('source_id')}</label>
                              <input 
                                type="text" 
                                value={sourceId}
                                onChange={(e) => setSourceId(e.target.value)}
                                placeholder="000000000000"
                                className="w-full bg-black/60 border border-white/[0.05] rounded-xl px-5 py-3 focus:outline-none focus:border-primary/40 transition-all text-sm font-mono"
                              />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">{t('target_id')}</label>
                              <input 
                                type="text" 
                                value={targetId}
                                onChange={(e) => setTargetId(e.target.value)}
                                placeholder="000000000000"
                                className="w-full bg-black/60 border border-white/[0.05] rounded-xl px-5 py-3 focus:outline-none focus:border-primary/40 transition-all text-sm font-mono"
                              />
                            </div>
                          </div>

                          <div className="flex gap-4">
                            <button 
                              onClick={handleClone}
                              disabled={isCloning}
                              className="flex-1 py-4 bg-primary text-white rounded-xl font-black text-xs tracking-widest uppercase shadow-neon-blue hover:brightness-110 transition-all disabled:opacity-30"
                            >
                              {isCloning ? t('cloning') : t('initiate_clone')}
                            </button>
                            {isCloning && (
                              <button onClick={handleStop} className="px-8 py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-black text-xs uppercase transition-all">
                                {t('stop')}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="glass-card p-6 bg-black/90 border-white/[0.03] min-h-[300px] max-h-[400px] flex flex-col font-mono shadow-2xl">
                          <div className="flex items-center justify-between mb-6 text-white/20 border-b border-white/[0.03] pb-4">
                            <div className="flex items-center gap-2">
                              <Terminal size={14} className="text-primary" />
                              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('console_title')}</span>
                            </div>
                            <div className="flex gap-1">
                              <div className="w-2 h-2 rounded-full bg-red-500/20" />
                              <div className="w-2 h-2 rounded-full bg-yellow-500/20" />
                              <div className="w-2 h-2 rounded-full bg-green-500/20" />
                            </div>
                          </div>
                          <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
                            {logs.length === 0 && (
                              <div className="h-full flex items-center justify-center opacity-10 uppercase tracking-[0.5em] text-[10px]">
                                Awaiting Command...
                              </div>
                            )}
                            {logs.map((log, i) => (
                              <div key={i} className={`flex gap-4 text-[11px] leading-relaxed transition-all animate-in fade-in slide-in-from-left-2 duration-300`}>
                                <span className="opacity-20 select-none whitespace-nowrap">{new Date().toLocaleTimeString([], { hour12: false })}</span>
                                <span className={`flex-1 ${
                                  log.type === 'error' ? 'text-red-400 font-bold' : 
                                  log.type === 'success' ? 'text-primary font-bold' : 'text-white/50'
                                }`}>
                                  {log.type === 'success' && '✓ '}
                                  {log.type === 'error' && '✕ '}
                                  {log.type === 'info' && '» '}
                                  {log.msg}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="col-span-4 space-y-4">
                        <div className="glass-card p-6 bg-black/20 border-white/[0.03] space-y-4">
                          <h3 className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-4">{t('components_title')}</h3>
                          <OptionToggle label={t('roles')} icon={Users} active={options.roles} onClick={() => toggleOption('roles')} />
                          <OptionToggle label={t('channels')} icon={Hash} active={options.channels} onClick={() => toggleOption('channels')} />
                          <OptionToggle label={t('emojis')} icon={Smile} active={options.emojis} onClick={() => toggleOption('emojis')} />
                          <OptionToggle label={t('stickers')} icon={Zap} active={options.stickers} onClick={() => toggleOption('stickers')} />
                          <OptionToggle label={t('icon')} icon={ImageIcon} active={options.serverIcon} onClick={() => toggleOption('serverIcon')} />
                          <OptionToggle label={t('name')} icon={Type} active={options.serverName} onClick={() => toggleOption('serverName')} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {view === 'mirror' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                    <header className="space-y-2">
                      <h1 className="text-4xl font-black tracking-tight text-white/90">
                        WEBHOOK <span className="text-primary">MIRROR</span>
                      </h1>
                      <p className="text-white/20 text-xs font-medium tracking-wide uppercase">{t('mirror_subtitle')}</p>
                    </header>

                    <div className="grid grid-cols-12 gap-8">
                      <div className="col-span-8 space-y-8">
                        <div className="glass-card p-8 bg-black/40 border-white/[0.03] space-y-8 shadow-sm">
                          <div className="space-y-6">
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">{t('source_channel_id')}</label>
                              <input 
                                type="text" 
                                value={sourceId}
                                onChange={(e) => setSourceId(e.target.value)}
                                placeholder="Source Channel ID"
                                className="w-full bg-black/60 border border-white/[0.05] rounded-xl px-5 py-3 focus:outline-none focus:border-primary/40 transition-all text-sm font-mono"
                              />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">{t('webhook_url')}</label>
                              <input 
                                type="text" 
                                value={webhookUrl}
                                onChange={(e) => setWebhookUrl(e.target.value)}
                                placeholder="https://discord.com/api/webhooks/..."
                                className="w-full bg-black/60 border border-white/[0.05] rounded-xl px-5 py-3 focus:outline-none focus:border-primary/40 transition-all text-sm font-mono"
                              />
                            </div>
                          </div>

                          <div className="flex gap-4">
                            <button 
                              onClick={handleMirror}
                              disabled={isMirroring}
                              className="flex-1 py-4 bg-primary text-white rounded-xl font-black text-xs tracking-widest uppercase shadow-neon-blue hover:brightness-110 transition-all disabled:opacity-30"
                            >
                              {isMirroring ? t('mirroring') : t('start_mirror')}
                            </button>
                            {isMirroring && (
                              <button onClick={handleStop} className="px-8 py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-black text-xs uppercase transition-all">
                                {t('stop')}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="glass-card p-6 bg-black/80 border-white/[0.03] min-h-[250px] flex flex-col font-mono shadow-2xl">
                          <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar text-[11px]">
                            {logs.map((log, i) => (
                              <div key={i} className={`flex gap-4 text-[11px] leading-relaxed transition-all animate-in fade-in slide-in-from-left-2 duration-300`}>
                                <span className="opacity-20 select-none whitespace-nowrap">{new Date().toLocaleTimeString([], { hour12: false })}</span>
                                <span className={`flex-1 ${
                                  log.type === 'error' ? 'text-red-400 font-bold' : 
                                  log.type === 'success' ? 'text-primary font-bold' : 'text-white/50'
                                }`}>
                                  {log.type === 'success' && '✓ '}
                                  {log.type === 'error' && '✕ '}
                                  {log.type === 'info' && '» '}
                                  {log.msg}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="col-span-4 space-y-4">
                        <div className="glass-card p-6 bg-black/20 border-white/[0.03] space-y-4">
                          <h3 className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-4">{t('components_title')}</h3>
                          
                          <OptionToggle label={t('all_history')} icon={Layout} active={options.allHistory} onClick={() => toggleOption('allHistory')} />

                          <OptionToggle label={t('past_messages')} icon={Activity} active={options.pastMessages} onClick={() => toggleOption('pastMessages')} />
                          
                          <AnimatePresence mode="popLayout">
                            {options.pastMessages && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="space-y-2 pb-2"
                              >
                                <label className="text-[9px] font-black text-primary uppercase tracking-widest ml-1">{t('message_limit')}</label>
                                <input 
                                  type="text"
                                  inputMode="numeric"
                                  value={messageLimit === 0 ? '' : messageLimit}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    if (val.length <= 3) {
                                      setMessageLimit(val === '' ? 0 : parseInt(val));
                                    }
                                  }}
                                  className="w-full bg-primary/5 border border-primary/20 rounded-xl px-4 py-2 focus:outline-none focus:border-primary/50 transition-all text-xs font-mono text-white text-center"
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <OptionToggle label={t('live_sync')} icon={Zap} active={options.live} onClick={() => toggleOption('live')} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {view === 'deleter' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                    <header className="space-y-2 text-center max-w-2xl mx-auto">
                      <h1 className="text-4xl font-black tracking-tight text-white/90">
                        WEBHOOK <span className="text-red-500">DELETER</span>
                      </h1>
                      <p className="text-white/20 text-xs font-medium tracking-wide uppercase">{t('webhook_deleter_subtitle')}</p>
                    </header>

                    <div className="max-w-2xl mx-auto space-y-8">
                      <div className="glass-card p-10 bg-black/40 border-red-500/10 space-y-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-500/20 group-hover:bg-red-500/40 transition-all" />
                        
                        <div className="space-y-6">
                          <div className="space-y-3 text-center">
                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{t('webhook_url')}</label>
                            <input 
                              type="text" 
                              value={webhookUrl}
                              onChange={(e) => setWebhookUrl(e.target.value)}
                              placeholder="https://discord.com/api/webhooks/..."
                              className="w-full bg-black/60 border border-white/[0.05] rounded-xl px-5 py-4 focus:outline-none focus:border-red-500/40 transition-all text-sm font-mono text-center text-red-100 shadow-inner"
                            />
                          </div>

                          <button 
                            onClick={handleDeleteWebhook}
                            disabled={isDeletingWebhook || !webhookUrl}
                            className="w-full py-5 bg-red-500 text-white rounded-xl font-black text-sm tracking-[0.3em] uppercase shadow-[0_0_30px_rgba(239,68,68,0.2)] hover:bg-red-600 hover:shadow-[0_0_40px_rgba(239,68,68,0.4)] transition-all disabled:opacity-20 disabled:grayscale flex items-center justify-center gap-3"
                          >
                            <Trash2 size={18} />
                            {isDeletingWebhook ? t('deleting_webhook') : t('delete_webhook')}
                          </button>
                        </div>
                      </div>

                      <div className="glass-card p-6 bg-black/90 border-white/[0.03] min-h-[200px] flex flex-col font-mono shadow-2xl">
                          <div className="flex items-center justify-between mb-4 text-white/20 border-b border-white/[0.03] pb-4">
                            <div className="flex items-center gap-2">
                              <Terminal size={14} className="text-red-500" />
                              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('console_title')}</span>
                            </div>
                          </div>
                          <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar text-[11px]">
                            {logs.map((log, i) => (
                              <div key={i} className="flex gap-4 animate-in fade-in slide-in-from-left-2">
                                <span className="opacity-20">{new Date().toLocaleTimeString([], { hour12: false })}</span>
                                <span className={log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-white/40'}>
                                  {log.msg}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                    </div>
                  </motion.div>
                )}

                {view === 'hypesquad' && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10">
                    <header className="space-y-2 text-center max-w-2xl mx-auto">
                      <h1 className="text-4xl font-black tracking-tight text-white/90">
                        HYPESQUAD <span className="text-primary">CHANGER</span>
                      </h1>
                      <p className="text-white/20 text-xs font-medium tracking-wide uppercase">{t('hypesquad_subtitle')}</p>
                    </header>

                    <div className="max-w-4xl mx-auto grid grid-cols-12 gap-8">
                      <div className="col-span-12 lg:col-span-7 space-y-6">
                        <div className="glass-card p-8 bg-black/40 border-white/[0.03] space-y-8 shadow-2xl">
                          <div className="grid grid-cols-1 gap-4">
                            {[
                              { id: 1, name: t('hypesquad_bravery'), color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
                              { id: 2, name: t('hypesquad_brilliance'), color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
                              { id: 3, name: t('hypesquad_balance'), color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
                            ].map((house) => (
                              <div 
                                key={house.id}
                                onClick={() => setSelectedHouse(house.id)}
                                className={`flex items-center justify-between p-5 rounded-2xl border cursor-pointer transition-all duration-300 ${
                                  selectedHouse === house.id 
                                  ? `${house.bg} ${house.border} shadow-neon-blue scale-[1.02]` 
                                  : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`p-3 rounded-xl ${selectedHouse === house.id ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/20'}`}>
                                    <Star size={20} className={selectedHouse === house.id ? 'fill-current' : ''} />
                                  </div>
                                  <span className={`font-black text-sm uppercase tracking-widest ${selectedHouse === house.id ? 'text-white' : 'text-white/40'}`}>
                                    {house.name}
                                  </span>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                  selectedHouse === house.id ? 'bg-primary border-primary' : 'border-white/10'
                                }`}>
                                  {selectedHouse === house.id && <Check size={14} className="text-white" />}
                                </div>
                              </div>
                            ))}
                          </div>

                          <button 
                            onClick={handleChangeHypeSquad}
                            disabled={isUpdatingHypeSquad}
                            className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xs tracking-[0.3em] uppercase shadow-neon-blue hover:brightness-110 transition-all disabled:opacity-30 flex items-center justify-center gap-3"
                          >
                            <RefreshCw size={18} className={isUpdatingHypeSquad ? 'animate-spin' : ''} />
                            {isUpdatingHypeSquad ? t('updating_hypesquad') : t('change_house')}
                          </button>
                        </div>
                      </div>

                      <div className="col-span-12 lg:col-span-5 space-y-6">
                        <div className="glass-card p-6 bg-black/90 border-white/[0.03] min-h-[400px] flex flex-col font-mono shadow-2xl">
                          <div className="flex items-center justify-between mb-6 text-white/20 border-b border-white/[0.03] pb-4">
                            <div className="flex items-center gap-2">
                              <Terminal size={14} className="text-primary" />
                              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('console_title')}</span>
                            </div>
                          </div>
                          <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
                            {logs.map((log, i) => (
                              <div key={i} className="flex gap-4 text-[11px] leading-relaxed transition-all animate-in fade-in slide-in-from-left-2">
                                <span className="opacity-20 select-none">{new Date().toLocaleTimeString([], { hour12: false })}</span>
                                <span className={log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-primary font-black' : 'text-white/50'}>
                                  {log.msg}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {view === 'tokens' && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                    <header className="space-y-2">
                      <h1 className="text-3xl font-black tracking-tight text-white/90">TOKEN <span className="text-primary">VAULT</span></h1>
                      <p className="text-white/20 text-xs font-medium tracking-wide uppercase">{t('token_manager_subtitle')}</p>
                    </header>
                    
                    <div className="glass-card p-8 bg-black/40 border-white/[0.03] space-y-6">
                      <div className="flex gap-4">
                        <input 
                          type="password"
                          placeholder={t('paste_token')}
                          value={token}
                          onChange={(e) => setToken(e.target.value)}
                          className="flex-1 bg-black/60 border border-white/[0.05] rounded-xl px-5 py-3 focus:outline-none focus:border-primary/40 transition-all text-sm font-mono"
                        />
                        <button onClick={() => addToken(token)} className="px-6 bg-primary text-white rounded-xl font-black text-xs uppercase shadow-neon-blue">
                          <Plus size={20} />
                        </button>
                      </div>

                      <div className="space-y-3">
                        {tokenList.map((t_item, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.03] rounded-xl group hover:border-white/10 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center overflow-hidden">
                                {t_item.user?.avatar ? (
                                  <img src={`https://cdn.discordapp.com/avatars/${t_item.user.id}/${t_item.user.avatar}.png`} alt="av" className="grayscale opacity-60" />
                                ) : <Users size={20} className="text-white/10" />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white/80">{t_item.user?.username || 'Loading...'}</span>
                                  {t_item.hasNitro && <Zap size={10} className="text-primary fill-current" />}
                                </div>
                                <span className="text-[9px] font-mono text-white/10 truncate max-w-[200px] block">{t_item.token}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {t_item.valid && (
                                <button onClick={() => { setToken(t_item.token); setView('clone'); }} className="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black rounded-lg hover:bg-primary/20 transition-all">
                                  {t('use_token')}
                                </button>
                              )}
                              <button onClick={() => removeToken(t_item.token)} className="text-white/10 hover:text-red-500 transition-colors">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {view === 'templates' && (
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10">
                    <header className="space-y-2">
                      <h1 className="text-3xl font-black tracking-tight text-white/90 uppercase">Elite <span className="text-primary">Market</span></h1>
                      <p className="text-white/20 text-[10px] font-black tracking-widest uppercase">{t('market_subtitle')}</p>
                    </header>

                    <div className="grid grid-cols-2 gap-8">
                      {savedTemplates.map((tpl) => (
                        <div key={tpl.id} className="glass-card p-8 bg-black/40 border-white/[0.03] hover:border-primary/20 transition-all group relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => {
                              setSavedTemplates(prev => prev.filter(t => t.id !== tpl.id))
                            }} className="text-white hover:text-red-500">
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="space-y-6">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-neon-blue">
                              <Server size={24} />
                            </div>
                            <div>
                              <h3 className="text-lg font-black text-white/90 uppercase">{tpl.name}</h3>
                              <p className="text-[10px] font-mono text-white/20 mt-1">ID: {tpl.sourceId}</p>
                            </div>
                            <button 
                              onClick={() => {
                                setSourceId(tpl.sourceId);
                                setView('clone');
                                addLog(t('log_template_loaded'), 'info');
                              }}
                              className="w-full py-3 bg-white/[0.03] border border-white/[0.05] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center justify-center gap-2"
                            >
                              <Download size={14} /> {t('deploy')}
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      <div 
                        onClick={() => {
                          if (!sourceId) { alert(t('enter_source_first')); return; }
                          const name = prompt(t('enter_tpl_name'));
                          if (!name) return;
                          const newTpl = {
                            id: Date.now().toString(),
                            name,
                            sourceName: 'Custom',
                            sourceId,
                            options: { ...options },
                            date: new Date().toISOString().split('T')[0]
                          };
                          setSavedTemplates(prev => [...prev, newTpl]);
                          addLog(t('log_template_saved'), 'success');
                        }}
                        className="border-2 border-dashed border-white/[0.03] rounded-3xl p-8 flex flex-col items-center justify-center gap-4 text-white/10 hover:border-primary/20 hover:text-primary transition-all cursor-pointer group"
                      >
                        <div className="w-16 h-16 bg-white/[0.02] rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-all">
                          <Plus size={32} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{t('save_template')}</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {view === 'settings' && (
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto space-y-10">
                    <header className="text-center space-y-2">
                      <h1 className="text-3xl font-black tracking-tight text-white/90 uppercase">Elite Settings</h1>
                      <p className="text-white/20 text-[10px] font-black tracking-widest uppercase">{t('settings_subtitle')}</p>
                    </header>

                    <div className="glass-card p-10 bg-black/40 border-white/[0.03] space-y-10">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="text-sm font-black text-white/80 uppercase tracking-wider">{t('theme_title')}</h3>
                        </div>
                        <div className="flex gap-2 p-1 bg-black/40 border border-white/[0.05] rounded-xl">
                          {(['dark', 'night'] as const).map(th => (
                            <button 
                              key={th}
                              onClick={() => setTheme(th)}
                              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${theme === th ? 'bg-primary text-white shadow-neon-blue' : 'text-white/20 hover:text-white/40'}`}
                            >
                              {t(`theme_${th}` as any)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="text-sm font-black text-white/80 uppercase tracking-wider">{t('language')}</h3>
                        </div>
                        <div className="flex gap-2 p-1 bg-black/40 border border-white/[0.05] rounded-xl">
                          {['en', 'tr'].map(l => (
                            <button 
                              key={l}
                              onClick={() => { setLang(l as any); localStorage.setItem('elite_lang', l); }}
                              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${lang === l ? 'bg-primary text-white' : 'text-white/20 hover:text-white/40'}`}
                            >
                              {l === 'en' ? 'English' : 'Türkçe'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="text-sm font-black text-white/80 uppercase tracking-wider">{t('streamer_mode')}</h3>
                          <p className="text-[10px] text-white/20 font-bold uppercase">{t('streamer_desc')}</p>
                        </div>
                        <div 
                          onClick={() => handleStreamerMode(!streamerMode)}
                          className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all duration-300 ${streamerMode ? 'bg-primary' : 'bg-white/5'}`}
                        >
                          <motion.div animate={{ x: streamerMode ? 24 : 0 }} className="w-4 h-4 bg-white rounded-full" />
                        </div>
                      </div>

                      <div className="pt-8 border-t border-white/[0.03] grid grid-cols-2 gap-6">
                        <button onClick={() => window.open('https://github.com/ayberkconfs')} className="flex items-center justify-center gap-3 p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl text-white/40 hover:text-white hover:border-white/10 transition-all text-[10px] font-black uppercase">
                          <Github size={16} /> GitHub
                        </button>
                        <button onClick={() => window.open('https://discord.gg/conf')} className="flex items-center justify-center gap-3 p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl text-white/40 hover:text-white hover:border-white/10 transition-all text-[10px] font-black uppercase">
                          <MessageSquare size={16} /> Discord
                        </button>
                      </div>

                      <button 
                        onClick={() => { localStorage.removeItem('remembered_token'); setIsAuthorized(false); }}
                        className="w-full py-4 bg-red-500/5 text-red-500 border border-red-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all"
                      >
                        {t('logout')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
