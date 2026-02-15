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
  ArrowUpCircle,
  MessageSquare,
  Github
} from 'lucide-react'
import { translations } from './translations'
import { APP_CONFIG } from './config'
import logo from './assets/logo.png'

const OptionToggle = ({ label, icon: Icon, active, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
      active 
      ? 'bg-primary/10 border-primary/50 text-white shadow-neon-blue' 
      : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
    }`}
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${active ? 'bg-primary text-white' : 'bg-white/5 text-white/20'}`}>
        <Icon size={18} />
      </div>
      <span className="text-sm font-semibold">{label}</span>
    </div>
    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
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

  const [isUpdateRequired, setIsUpdateRequired] = useState(false)
  const [latestVersion, setLatestVersion] = useState(APP_CONFIG.version)
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(true)

  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const [showWelcomeBack, setShowWelcomeBack] = useState(false)
  const [welcomeUser, setWelcomeUser] = useState<any>(null)
  
  const [view, setView] = useState<'clone' | 'tokens' | 'templates' | 'settings'>('clone')
  const [showTokenHelp, setShowTokenHelp] = useState(false)
  const [showMarketHelp, setShowMarketHelp] = useState(false)
  const [token, setToken] = useState('')
  const [sourceId, setSourceId] = useState('')
  const [targetId, setTargetId] = useState('')
  const [isCloning, setIsCloning] = useState(false)
  const [streamerMode, setStreamerMode] = useState(false)
  
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
      console.log('Update check failed (likely no network or file missing)')
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
    const lastToken = localStorage.getItem('active_token')
    if (lastToken) {
      const savedUser = tokenList.find(t_item => t_item.token === lastToken)
      if (savedUser && savedUser.valid) {
        setWelcomeUser(savedUser.user)
        setShowWelcomeBack(true)
      } else {
        handleInitialAuth(lastToken)
      }
    }
  }, [])

  const handleInitialAuth = async (t_arg: string) => {
    setIsAuthorizing(true)
    const result = await window.api.checkToken(t_arg)
    if (result.valid) {
      setToken(t_arg)
      setIsAuthorized(true)
      if (!tokenList.find(item => item.token === t_arg)) {
        setTokenList(prev => [...prev, { token: t_arg, ...result, checking: false }])
      }
    } else {
      localStorage.removeItem('active_token')
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
      { id: '1', name: 'Elite Gaming Layout', sourceName: 'Pro League Server', sourceId: '123456789', options: {}, date: '2026-02-15' },
      { id: '2', name: 'NFT & Crypto Hub', sourceName: 'Bored Ape Yacht', sourceId: '987654321', options: {}, date: '2026-02-14' }
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
    serverName: true
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
    setIsCloning(true)
    try {
      await window.api.startClone({ token, sourceId, targetId, options })
    } catch (err: any) {
      addLog(err.message, 'error')
    } finally {
      setIsCloning(false)
    }
  }

  const handleStop = () => {
    window.api.stopClone()
    addLog(t('log_stop_sent'), 'info')
  }

  const toggleOption = (key: keyof typeof options) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleStreamerMode = (enabled: boolean) => {
    setStreamerMode(enabled)
    window.api.setStreamerMode(enabled)
  }

  const addToken = async (newToken: string) => {
    if (!newToken) return
    if (tokenList.find(t_item => t_item.token === newToken)) {
      addLog(t('log_token_exists'), 'info')
      return
    }

    const tempToken = { token: newToken, valid: false, checking: true }
    setTokenList(prev => [...prev, tempToken])
    
    try {
      const result = await window.api.checkToken(newToken)
      setTokenList(prev => prev.map(t_item => t_item.token === newToken ? { ...t_item, ...result, checking: false } : t_item))
      if (result.valid) {
        addLog(`${t('log_token_verified')} ${result.user.tag}`, 'success')
        if (!isAuthorized) {
          setToken(newToken)
          setIsAuthorized(true)
          localStorage.setItem('active_token', newToken)
        }
      } else {
        addLog(t('log_token_invalid'), 'error')
      }
    } catch (err) {
      setTokenList(prev => prev.map(t_item => t_item.token === newToken ? { ...t_item, checking: false, valid: false } : t_item))
    }
    if (isAuthorized) setToken('')
  }

  const handleLogin = async () => {
    if (!token) return
    setIsAuthorizing(true)
    const result = await window.api.checkToken(token)
    if (result.valid) {
      setIsAuthorized(true)
      localStorage.setItem('active_token', token)
      if (!tokenList.find(t_item => t_item.token === token)) {
        setTokenList(prev => [...prev, { token, ...result, checking: false }])
      }
    } else {
      addLog(t('log_auth_failed'), 'error')
      alert(t('log_auth_failed'))
    }
    setIsAuthorizing(false)
  }

  const removeToken = (tokenToRemove: string) => {
    setTokenList(prev => prev.filter(t_item => t_item.token !== tokenToRemove))
  }

  const deployTemplate = (tplSourceId: string) => {
    setSourceId(tplSourceId)
    setView('clone')
    addLog(t('log_template_loaded'), 'info')
  }

  const saveCurrentAsTemplate = () => {
    if (!sourceId) {
      alert(t('enter_source_first'))
      return
    }
    const name = prompt(t('enter_tpl_name'))
    if (!name) return

    const newTpl = {
      id: Date.now().toString(),
      name: name,
      sourceName: 'Custom Source',
      sourceId: sourceId,
      options: { ...options },
      date: new Date().toISOString().split('T')[0]
    }
    setSavedTemplates(prev => [newTpl, ...prev])
    addLog(t('log_template_saved'), 'success')
  }

  const deleteTemplate = (id: string) => {
    setSavedTemplates(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="flex flex-col h-screen w-full bg-background relative border border-white/5 rounded-xl overflow-hidden shadow-2xl">
      {/* Background Glow */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Custom Title Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/5 backdrop-blur-md border-b border-white/10 z-50 drag">
        <div className="flex items-center gap-2 no-drag">
          <div className="w-8 h-8 rounded-lg overflow-hidden shadow-neon-blue border border-white/10 bg-black/20">
            <img src={logo} alt="logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold tracking-widest text-white/90 uppercase">Conf CLONER</span>
        </div>
        
        <div className="flex items-center gap-1 no-drag">
          <button onClick={() => window.api.minimize()} className="p-1.5 hover:bg-white/10 rounded-md transition-colors">
            <Minus size={16} />
          </button>
          <button onClick={() => window.api.maximize()} className="p-1.5 hover:bg-white/10 rounded-md transition-colors">
            <Square size={14} />
          </button>
          <button onClick={() => window.api.close()} className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isUpdateRequired && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-2xl flex items-center justify-center p-8"
          >
            <div className="glass-card p-12 max-w-lg w-full text-center space-y-8 relative overflow-hidden border-primary/30">
              <div className="absolute top-0 left-0 w-full h-1 bg-premium-gradient" />
              
              <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto shadow-neon-blue animate-pulse border border-white/10 overflow-hidden bg-black/40">
                <img src={logo} alt="logo" className="w-full h-full object-cover" />
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl font-black tracking-wide text-white">{t('update_available')}</h1>
                <p className="text-white/40 leading-relaxed">
                  {t('update_desc')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                  <span className="block text-[10px] text-white/30 uppercase font-black mb-1">{t('current_version')}</span>
                  <span className="text-white/60 font-mono font-bold">{APP_CONFIG.version}</span>
                </div>
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl">
                  <span className="block text-[10px] text-primary uppercase font-black mb-1">{t('latest_version')}</span>
                  <span className="text-primary font-mono font-bold">{latestVersion}</span>
                </div>
              </div>

              <button 
                onClick={() => window.open(APP_CONFIG.github_repo)}
                className="w-full py-5 bg-premium-gradient rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-neon-blue hover:scale-[1.02] active:scale-95 transition-all"
              >
                <RefreshCw size={24} />
                {t('update_button')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!isAuthorized ? (
          showWelcomeBack ? (
            <motion.div 
              key="welcome-back"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex-1 flex items-center justify-center p-8 z-10"
            >
              <div className="glass-card p-10 w-full max-w-md space-y-8 relative overflow-hidden text-center">
                <div className="absolute top-0 left-0 w-full h-1 bg-premium-gradient" />
                
                <div className="space-y-4">
                  <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                    <div className="relative w-full h-full rounded-full border-2 border-primary/30 overflow-hidden shadow-neon-blue">
                      {welcomeUser?.avatar ? (
                        <img 
                          src={`https://cdn.discordapp.com/avatars/${welcomeUser.id}/${welcomeUser.avatar}.png?size=256`} 
                          alt="avatar" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-black/40 flex items-center justify-center">
                          <Users size={40} className="text-white/20" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h2 className="text-sm font-bold text-primary uppercase tracking-widest">{t('welcome_back')}</h2>
                    <h1 className="text-3xl font-black tracking-wide text-white">
                      {welcomeUser?.username}
                    </h1>
                    <p className="text-white/40 text-xs">{t('login_as')} {welcomeUser?.username}#{welcomeUser?.discriminator}?</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => handleInitialAuth(localStorage.getItem('active_token')!)}
                    disabled={isAuthorizing}
                    className="w-full py-4 bg-premium-gradient rounded-xl font-black text-white shadow-neon-blue hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {isAuthorizing ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                        <Activity size={20} />
                      </motion.div>
                    ) : (
                      <Check size={20} />
                    )}
                    {t('continue_btn')}
                  </button>
                  
                  <button 
                    onClick={() => {
                      localStorage.removeItem('active_token')
                      setShowWelcomeBack(false)
                    }}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/40 rounded-xl text-[10px] font-bold tracking-widest transition-all"
                  >
                    {t('different_account')}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex items-center justify-center p-8 z-10"
            >
              <div className="glass-card p-10 w-full max-w-md space-y-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-premium-gradient" />
                
                <div className="text-center space-y-2">
                  <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-neon-blue rotate-3 hover:rotate-0 transition-transform duration-500 border border-white/10 overflow-hidden bg-black/40">
                    <img src={logo} alt="logo" className="w-full h-full object-cover" />
                  </div>
                  <h1 className="text-3xl font-black tracking-wide">{t('auth_title')}</h1>
                  <p className="text-white/40 text-sm">{t('auth_subtitle')}</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-1">{t('access_token')}</label>
                    <input 
                      type="password"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder={t('token_placeholder')}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-primary/50 transition-all font-mono text-sm"
                    />
                  </div>

                  <button 
                    onClick={handleLogin}
                    disabled={isAuthorizing || !token}
                    className={`w-full py-4 rounded-xl font-black flex items-center justify-center gap-3 transition-all duration-500 shadow-neon-blue ${
                      isAuthorizing || !token
                      ? 'bg-primary/30 cursor-not-allowed grayscale' 
                      : 'bg-premium-gradient hover:scale-[1.02] active:scale-95'
                    }`}
                  >
                    {isAuthorizing ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                        <Activity size={20} />
                      </motion.div>
                    ) : (
                      <Zap size={20} />
                    )}
                    {isAuthorizing ? t('verifying') : t('enter_suite')}
                  </button>
                </div>

                <div className="pt-4 flex items-center justify-center gap-4 border-t border-white/5">
                  <div className="flex items-center gap-1.5 text-[10px] text-white/20 font-bold uppercase tracking-widest">
                    <Shield size={12} />
                    {t('secure')}
                  </div>
                  <div className="w-1 h-1 rounded-full bg-white/10" />
                  <div className="flex items-center gap-1.5 text-[10px] text-white/20 font-bold uppercase tracking-widest">
                    <Zap size={12} />
                    {t('fast')}
                  </div>
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
            {/* Sidebar */}
            <div className="w-20 border-r border-white/5 bg-white/[0.02] flex flex-col items-center py-6 gap-8">
              <div 
                onClick={() => setView('clone')}
                className={`p-3 rounded-xl cursor-pointer transition-all ${
                  view === 'clone' ? 'bg-primary/10 text-primary shadow-neon-blue' : 'text-white/40 hover:text-white/80'
                }`}
              >
                <Server size={24} />
              </div>
              <div 
                onClick={() => setView('templates')}
                className={`p-3 rounded-xl cursor-pointer transition-all ${
                  view === 'templates' ? 'bg-primary/10 text-primary shadow-neon-blue' : 'text-white/40 hover:text-white/80'
                }`}
              >
                <Activity size={24} />
              </div>
              <div 
                onClick={() => setView('tokens')}
                className={`p-3 rounded-xl cursor-pointer transition-all ${
                  view === 'tokens' ? 'bg-primary/10 text-primary shadow-neon-blue' : 'text-white/40 hover:text-white/80'
                }`}
              >
                <Shield size={24} />
              </div>
              <div 
                onClick={() => setView('settings')}
                className={`mt-auto p-3 rounded-xl cursor-pointer transition-all ${
                  view === 'settings' ? 'bg-primary/10 text-primary shadow-neon-blue' : 'text-white/40 hover:text-white/80'
                }`}
              >
                <Settings size={24} />
              </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto relative custom-scrollbar">
              <AnimatePresence mode="wait">
                                {view === 'clone' ? (
                                  <motion.div 
                                    key="clone"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.02 }}
                                    className="max-w-4xl mx-auto space-y-8 pb-8"
                                  >
                                                        <header>
                                                          <h1 className="text-4xl font-black tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/20 mb-2">
                                                            Conf CLONER <span className="text-primary text-2xl tracking-widest ml-3 font-black">Elite</span>
                                                          </h1>
                                                          <p className="text-white/40">{t('cloner_subtitle')} <span className="text-secondary/60">{t('caution')}</span></p>
                                                        </header>                
                                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                                      {/* Configuration Section */}
                                      <div className="lg:col-span-3 space-y-6">
                                        <div className="glass-card p-6 space-y-6">
                                          <div className="space-y-4">
                                            <div className="space-y-2">
                                              <div className="flex justify-between items-center px-1">
                                                <label className="text-sm font-medium text-white/60">{t('active_token')}</label>
                                                <div className="flex items-center gap-2">
                                                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                                  <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">{t('verified')}</span>
                                                </div>
                                              </div>
                                              <div className="relative">
                                                <input 
                                                  type="password" 
                                                  value={token}
                                                  readOnly
                                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 transition-all text-sm font-mono pr-12 opacity-60"
                                                />
                                                <button 
                                                  onClick={() => setView('tokens')}
                                                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-primary transition-colors"
                                                >
                                                  <Users size={16} />
                                                </button>
                                              </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                              <div className="space-y-2">
                                                <label className="text-sm font-medium text-white/60 ml-1">{t('source_id')}</label>
                                                <input 
                                                  type="text" 
                                                  value={sourceId}
                                                  onChange={(e) => setSourceId(e.target.value)}
                                                  placeholder="Source Server"
                                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 transition-all text-sm"
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <label className="text-sm font-medium text-white/60 ml-1">{t('target_id')}</label>
                                                <input 
                                                  type="text" 
                                                  value={targetId}
                                                  onChange={(e) => setTargetId(e.target.value)}
                                                  placeholder="New Destination"
                                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 transition-all text-sm"
                                                />
                                              </div>
                                            </div>
                                          </div>
                
                                          <div className="flex gap-4">
                                            <button 
                                              onClick={handleClone}
                                              disabled={isCloning}
                                              className={`flex-1 py-4 rounded-xl font-black text-lg flex items-center justify-center gap-3 transition-all duration-500 shadow-neon-blue ${
                                                isCloning 
                                                ? 'bg-primary/30 cursor-not-allowed opacity-50' 
                                                : 'bg-premium-gradient hover:scale-[1.01] active:scale-95'
                                              }`}
                                            >
                                              {isCloning ? (
                                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                                                  <Zap size={24} />
                                                </motion.div>
                                              ) : (
                                                <Copy size={24} />
                                              )}
                                              {isCloning ? t('cloning') : t('initiate_clone')}
                                            </button>
                                            
                                            {isCloning && (
                                              <button 
                                                onClick={handleStop}
                                                className="px-8 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-black text-lg transition-all animate-pulse"
                                              >
                                                {t('stop')}
                                              </button>
                                            )}
                                          </div>
                                        </div>
                
                                        {/* Console Section */}
                                        <div className="glass-card p-4 bg-black/80 border-white/5 font-mono text-[11px] min-h-[250px] max-h-[250px] flex flex-col shadow-inner">
                                          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                                            <div className="flex items-center gap-2">
                                              <Terminal size={12} className="text-primary" />
                                              <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{t('console_title')}</span>
                                            </div>
                                          </div>
                                          <div className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
                                            <AnimatePresence initial={false}>
                                              {logs.map((log, i) => (
                                                <motion.div 
                                                  key={`${i}-${log.msg}`}
                                                  initial={{ opacity: 0, y: 5 }}
                                                  animate={{ opacity: 1, y: 0 }}
                                                  className={`flex gap-3 py-1 border-l pl-3 transition-colors ${
                                                    log.type === 'success' ? 'border-green-500/30 text-green-400/80' : 
                                                    log.type === 'error' ? 'border-red-500/30 text-red-400/80' : 'border-white/10 text-white/50'
                                                  }`}
                                                >
                                                  <span className="opacity-20 tabular-nums">{new Date().toLocaleTimeString([], { hour12: false })}</span>
                                                  <span className="leading-tight">{log.msg}</span>
                                                </motion.div>
                                              ))}
                                            </AnimatePresence>
                                          </div>
                                        </div>
                                      </div>
                
                                      {/* Selector Section */}
                                      <div className="lg:col-span-2 space-y-4">
                                        <div className="glass-card p-5 h-full flex flex-col gap-3">
                                          <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Layout size={12} />
                                            {t('components_title')}
                                          </h3>
                                          
                                          <OptionToggle 
                                            label={t('roles')}
                                            icon={Users} 
                                            active={options.roles} 
                                            onClick={() => toggleOption('roles')} 
                                          />
                                          <OptionToggle 
                                            label={t('channels')}
                                            icon={Hash} 
                                            active={options.channels} 
                                            onClick={() => toggleOption('channels')} 
                                          />
                                          <OptionToggle 
                                            label={t('emojis')}
                                            icon={Smile} 
                                            active={options.emojis} 
                                            onClick={() => toggleOption('emojis')} 
                                          />
                                          <OptionToggle 
                                            label={t('stickers')}
                                            icon={Zap} 
                                            active={options.stickers} 
                                            onClick={() => toggleOption('stickers')} 
                                          />
                                          <OptionToggle 
                                            label={t('icon')}
                                            icon={ImageIcon} 
                                            active={options.serverIcon} 
                                            onClick={() => toggleOption('serverIcon')} 
                                          />
                                          <OptionToggle 
                                            label={t('name')}
                                            icon={Type} 
                                            active={options.serverName} 
                                            onClick={() => toggleOption('serverName')} 
                                          />
                
                                          <div className="mt-auto pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-2 text-white/20 italic text-[10px]">
                                              <Shield size={10} />
                                              <span>{t('security_note')}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                
                                ) : view === 'tokens' ? (
                
                                  <motion.div 
                
                                    key="tokens"
                
                                    initial={{ opacity: 0, x: 20 }}
                
                                    animate={{ opacity: 1, x: 0 }}
                
                                    exit={{ opacity: 0, x: -20 }}
                
                                    className="max-w-4xl mx-auto space-y-8"
                
                                  >
                
                                                    <header>
                
                                                      <div className="flex items-center gap-3 mb-2">
                
                                                        <h1 className="text-4xl font-black tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/20">
                
                                                          {t('token_manager_title')} <span className="text-primary text-2xl tracking-widest ml-3 font-black">Manager</span>
                
                                                        </h1>
                
                                                        <button 
                
                                                          onClick={() => setShowTokenHelp(!showTokenHelp)}
                
                                                          className={`p-2 rounded-full transition-all ${showTokenHelp ? 'bg-primary text-white shadow-neon-blue' : 'bg-white/5 text-white/20 hover:bg-white/10 hover:text-white/40'}`}
                
                                                        >
                
                                                          <HelpCircle size={20} />
                
                                                        </button>
                
                                                      </div>
                
                                                      <p className="text-white/40">{t('token_manager_subtitle')}</p>
                
                                                    </header>
                
                                    
                
                                                    <AnimatePresence>
                
                                                      {showTokenHelp && (
                
                                                        <motion.div 
                
                                                          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                
                                                          animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                
                                                          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                
                                                          className="overflow-hidden"
                
                                                        >
                
                                                          <div className="glass-card p-6 bg-primary/5 border-primary/20 flex gap-4 items-start">
                
                                                            <div className="p-2 bg-primary/20 rounded-lg text-primary">
                
                                                              <Info size={20} />
                
                                                            </div>
                
                                                            <p className="text-sm text-white/60 leading-relaxed italic">
                
                                                              {t('token_help')}
                
                                                            </p>
                
                                                          </div>
                
                                                        </motion.div>
                
                                                      )}
                
                                                    </AnimatePresence>
                
                                    
                
                
                
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                                      <div className="md:col-span-2 space-y-4">
                
                                        <div className="glass-card p-6 space-y-4">
                
                                          <div className="flex gap-2">
                
                                            <input 
                
                                              type="password"
                
                                              placeholder={t('paste_token')}
                
                                              value={token}
                
                                              onChange={(e) => setToken(e.target.value)}
                
                                              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 transition-all text-sm font-mono"
                
                                            />
                
                                            <button 
                
                                              onClick={() => addToken(token)}
                
                                              className="p-3 bg-primary rounded-xl hover:bg-primary/80 transition-all shadow-neon-blue"
                
                                            >
                
                                              <Plus size={20} />
                
                                            </button>
                
                                          </div>
                
                
                
                                          <div className="space-y-3">
                
                                            {tokenList.map((t_item, i) => (
                
                                              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                
                                                <div className="flex items-center gap-4">
                
                                                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                
                                                    {t_item.user?.avatar ? (
                
                                                      <img src={`https://cdn.discordapp.com/avatars/${t_item.user.id}/${t_item.user.avatar}.png`} alt="av" />
                
                                                    ) : <Users size={20} className="text-white/20" />}
                
                                                  </div>
                
                                                  <div>
                
                                                    <div className="flex items-center gap-2">
                
                                                      <span className="font-bold">{t_item.user?.username || 'Checking...'}</span>
                
                                                      {t_item.hasNitro && <Zap size={12} className="text-secondary fill-current" />}
                
                                                    </div>
                
                                                    <span className="text-[10px] font-mono text-white/30 truncate max-w-[150px] block">{t_item.token}</span>
                
                                                  </div>
                
                                                </div>
                
                                                <div className="flex items-center gap-3">
                
                                                  {t_item.valid && (
                
                                                    <button 
                
                                                      onClick={() => {
                
                                                        setToken(t_item.token)
                
                                                        setView('clone')
                
                                                        addLog(`Selected token: ${t_item.user?.username}`, 'info')
                
                                                      }}
                
                                                      className="px-3 py-1 bg-primary/20 hover:bg-primary/40 text-primary text-[10px] font-bold rounded-lg transition-all"
                
                                                    >
                
                                                      {t('use_token')}
                
                                                    </button>
                
                                                  )}
                
                                                  {t_item.checking ? (
                
                                                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                
                                                      <Activity size={16} className="text-primary" />
                
                                                    </motion.div>
                
                                                  ) : t_item.valid ? (
                
                                                    <div className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-[10px] font-bold">{t('valid')}</div>
                
                                                  ) : (
                
                                                    <div className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">{t('invalid')}</div>
                
                                                  )}
                
                                                  <button 
                
                                                    onClick={() => removeToken(t_item.token)}
                
                                                    className="p-2 text-white/20 hover:text-red-400 transition-colors"
                
                                                  >
                
                                                    <Trash2 size={16} />
                
                                                  </button>
                
                                                </div>
                
                                              </div>
                
                                            ))}
                
                                          </div>
                
                                        </div>
                
                                      </div>
                
                
                
                                      <div className="space-y-4">
                
                                        <div className="glass-card p-6 bg-primary/5 border-primary/20">
                
                                          <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-3">{t('token_stats')}</h3>
                
                                          <div className="space-y-4">
                
                                            <div className="flex justify-between">
                
                                              <span className="text-xs text-white/40">{t('total_loaded')}</span>
                
                                              <span className="text-xs font-bold">{tokenList.length}</span>
                
                                            </div>
                
                                            <div className="flex justify-between">
                
                                              <span className="text-xs text-white/40">{t('valid_accounts')}</span>
                
                                              <span className="text-xs font-bold text-green-400">{tokenList.filter(it => it.valid).length}</span>
                
                                            </div>
                
                                            <div className="flex justify-between">
                
                                              <span className="text-xs text-white/40">{t('nitro_accounts')}</span>
                
                                              <span className="text-xs font-bold text-secondary">{tokenList.filter(it => it.hasNitro).length}</span>
                
                                            </div>
                
                                          </div>
                
                                        </div>
                
                                      </div>
                
                                    </div>
                
                                  </motion.div>
                
                                ) : view === 'templates' ? (
                
                                  <motion.div 
                
                                    key="templates"
                
                                    initial={{ opacity: 0, y: 20 }}
                
                                    animate={{ opacity: 1, y: 0 }}
                
                                    exit={{ opacity: 0, y: -20 }}
                
                                    className="max-w-4xl mx-auto space-y-8"
                
                                  >
                
                                                    <header className="flex justify-between items-end">
                
                                                      <div>
                
                                                        <div className="flex items-center gap-3 mb-2">
                
                                                          <h1 className="text-4xl font-black tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/20">
                
                                                            {t('market_title')} <span className="text-primary text-2xl tracking-widest ml-3 font-black">Market</span>
                
                                                          </h1>
                
                                                          <button 
                
                                                            onClick={() => setShowMarketHelp(!showMarketHelp)}
                
                                                            className={`p-2 rounded-full transition-all ${showMarketHelp ? 'bg-primary text-white shadow-neon-blue' : 'bg-white/5 text-white/20 hover:bg-white/10 hover:text-white/40'}`}
                
                                                          >
                
                                                            <HelpCircle size={20} />
                
                                                          </button>
                
                                                        </div>
                
                                                        <p className="text-white/40">{t('market_subtitle')}</p>
                
                                                      </div>
                
                                                      <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all">
                
                                                        <Star size={14} className="text-accent" />
                
                                                        {t('favorites')}
                
                                                      </button>
                
                                                    </header>
                
                                    
                
                                                    <AnimatePresence>
                
                                                      {showMarketHelp && (
                
                                                        <motion.div 
                
                                                          initial={{ opacity: 0, height: 0 }}
                
                                                          animate={{ opacity: 1, height: 'auto' }}
                
                                                          exit={{ opacity: 0, height: 0 }}
                
                                                          className="overflow-hidden"
                
                                                        >
                
                                                          <div className="glass-card p-6 bg-primary/5 border-primary/20 flex gap-4 items-start">
                
                                                            <div className="p-2 bg-primary/20 rounded-lg text-primary">
                
                                                              <Info size={20} />
                
                                                            </div>
                
                                                            <p className="text-sm text-white/60 leading-relaxed italic">
                
                                                              {t('market_help')}
                
                                                            </p>
                
                                                          </div>
                
                                                        </motion.div>
                
                                                      )}
                
                                                    </AnimatePresence>
                
                                    
                
                
                
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                                      {savedTemplates.map((tpl) => (
                
                                        <div key={tpl.id} className="glass-card p-6 group hover:border-primary/50 transition-all duration-500 relative overflow-hidden">
                
                                          <div className="flex justify-between items-start mb-4 relative z-10">
                
                                            <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-primary/20 transition-all">
                
                                              <Server size={24} className="text-primary" />
                
                                            </div>
                
                                            <div className="flex gap-2">
                
                                              <button 
                
                                                onClick={() => deleteTemplate(tpl.id)}
                
                                                className="p-2 bg-white/5 rounded-lg text-white/20 hover:text-red-400 transition-all"
                
                                              >
                
                                                <Trash2 size={16} />
                
                                              </button>
                
                                            </div>
                
                                          </div>
                
                                          <h3 className="text-xl font-black mb-1 relative z-10">{tpl.name}</h3>
                
                                          <p className="text-xs text-white/30 mb-6 relative z-10">ID: {tpl.sourceId}</p>
                
                                          
                
                                          <div className="flex items-center justify-between relative z-10">
                
                                            <div className="flex -space-x-2">
                
                                              {[1,2,3].map(i => (
                
                                                <div key={i} className="w-6 h-6 rounded-full border-2 border-background bg-white/10 flex items-center justify-center text-[8px] font-bold">U{i}</div>
                
                                              ))}
                
                                              <div className="text-[10px] text-white/40 ml-4 mt-1">{t('ready')}</div>
                
                                            </div>
                
                                            <button 
                
                                              onClick={() => deployTemplate(tpl.sourceId)}
                
                                              className="flex items-center gap-2 px-6 py-2 bg-primary rounded-xl font-bold text-xs shadow-neon-blue hover:scale-105 transition-all"
                
                                            >
                
                                              <Download size={14} />
                
                                              {t('deploy')}
                
                                            </button>
                
                                          </div>
                
                                        </div>
                
                                      ))}
                
                
                
                                      <div 
                
                                        onClick={saveCurrentAsTemplate}
                
                                        className="border-2 border-dashed border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-white/20 hover:border-primary/20 hover:text-white/40 transition-all cursor-pointer group"
                
                                      >
                
                                        <div className="p-4 bg-white/5 rounded-full group-hover:bg-primary/10 transition-all">
                
                                          <Plus size={32} />
                
                                        </div>
                
                                        <span className="font-bold text-sm">{t('save_template')}</span>
                
                                      </div>
                
                                    </div>
                
                
                
                                                        <div className="glass-card p-6 border-secondary/20 bg-secondary/5">
                
                
                
                                                          <div className="flex items-center gap-3 mb-2">
                
                
                
                                                            <AlertCircle size={20} className="text-secondary" />
                
                
                
                                                            <h3 className="font-bold text-secondary">{t('pro_tip')}</h3>
                
                
                
                                                          </div>
                
                
                
                                                          <p className="text-xs text-white/40 leading-relaxed italic">
                
                
                
                                                            {t('pro_tip_desc')}
                
                
                
                                                          </p>
                
                
                
                                                        </div>
                
                
                
                                    
                
                                  </motion.div>
                
                
                ) : (
                  <motion.div 
                    key="settings"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="max-w-2xl mx-auto space-y-8"
                  >
                    <header>
                      <h1 className="text-4xl font-black tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/20 mb-2">
                        Conf <span className="text-primary text-2xl tracking-widest ml-3 font-black">SETTINGS</span>
                      </h1>
                      <p className="text-white/40">{t('settings_subtitle')}</p>
                    </header>

                    <div className="glass-card p-8 space-y-8">
                      {/* Discord Server Link */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold text-white/90 flex items-center gap-2">
                            <MessageSquare className="text-primary" size={20} />
                            {t('discord_server')}
                          </h3>
                          <p className="text-sm text-white/40 max-w-md">
                            Join our community for support and updates.
                          </p>
                        </div>
                        <button 
                          onClick={() => window.open('https://discord.com/conf')}
                          className="px-6 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                        >
                          {t('join_now')}
                          <ExternalLink size={14} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold text-white/90 flex items-center gap-2">
                            <Github className="text-primary" size={20} />
                            {t('github_profile')}
                          </h3>
                          <p className="text-sm text-white/40 max-w-md">
                            {t('github_desc')}
                          </p>
                        </div>
                        <button 
                          onClick={() => window.open('https://github.com/ayberkconfs')}
                          className="px-6 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                        >
                          {t('visit')}
                          <ExternalLink size={14} />
                        </button>
                      </div>

                      {/* Language Selection */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold text-white/90 flex items-center gap-2">
                            <Languages className="text-primary" size={20} />
                            {t('language')}
                          </h3>
                        </div>
                        <div className="flex gap-2 p-1 bg-black/40 border border-white/10 rounded-xl">
                          <button 
                            onClick={() => {
                              setLang('en')
                              localStorage.setItem('elite_lang', 'en')
                            }}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                              lang === 'en' ? 'bg-primary text-white shadow-neon-blue' : 'text-white/40 hover:text-white/60'
                            }`}
                          >
                            {t('lang_en')}
                          </button>
                          <button 
                            onClick={() => {
                              setLang('tr')
                              localStorage.setItem('elite_lang', 'tr')
                            }}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                              lang === 'tr' ? 'bg-primary text-white shadow-neon-blue' : 'text-white/40 hover:text-white/60'
                            }`}
                          >
                            {t('lang_tr')}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold text-white/90 flex items-center gap-2">
                            <Activity className="text-primary" size={20} />
                            {t('streamer_mode')}
                          </h3>
                          <p className="text-sm text-white/40 max-w-md">
                            {t('streamer_desc')}
                          </p>
                        </div>
                        <div 
                          onClick={() => handleStreamerMode(!streamerMode)}
                          className={`w-14 h-7 rounded-full p-1 cursor-pointer transition-all duration-300 ${
                            streamerMode ? 'bg-primary' : 'bg-white/10'
                          }`}
                        >
                          <motion.div 
                            animate={{ x: streamerMode ? 28 : 0 }}
                            className="w-5 h-5 bg-white rounded-full shadow-lg"
                          />
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-8 space-y-4">
                        <h3 className="text-xs font-bold text-white/20 uppercase tracking-[0.3em]">{t('system_info')}</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
                            <span className="block text-[10px] text-white/30 uppercase font-bold mb-1">{t('version')}</span>
                            <span className="text-white font-mono">1.0.0-Elite</span>
                          </div>
                          <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
                            <span className="block text-[10px] text-white/30 uppercase font-bold mb-1">{t('platform')}</span>
                            <span className="text-white font-mono">{navigator.platform}</span>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          localStorage.removeItem('active_token')
                          setIsAuthorized(false)
                        }}
                        className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-all"
                      >
                        {t('logout')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
