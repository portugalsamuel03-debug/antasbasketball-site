import { listNotifications, createNotification, deleteNotification, NotificationRow } from '../cms';
import { useAdmin } from '../context/AdminContext';

interface NotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({ isOpen, onClose, isDarkMode }) => {
  const { isAdmin } = useAdmin();
  const [showSettings, setShowSettings] = useState(false);
  const [showAdminAdd, setShowAdminAdd] = useState(false);

  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

  // Form for admin
  const [newNotif, setNewNotif] = useState({ title: '', description: '', type: 'sistema' });

  const lastReadLocal = localStorage.getItem('antas_notifications_last_read') || '1970-01-01';
  const [lastReadAt, setLastReadAt] = useState(lastReadLocal);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const { data } = await listNotifications();
      if (data) setNotifications(data as NotificationRow[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      fetchNotifs();
      setShowAdminAdd(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const markAllRead = () => {
    const now = new Date().toISOString();
    localStorage.setItem('antas_notifications_last_read', now);
    setLastReadAt(now);
  };

  const clearAll = async () => {
    if (!isAdmin) return;
    if (confirm("Apagar TODAS as notificações do sistema?")) {
      // This is a global clear, should be careful.
      for (const n of notifications) {
        await deleteNotification(n.id);
      }
      fetchNotifs();
    }
  };

  const handleCreate = async () => {
    if (!newNotif.title || !newNotif.description) return;
    const { error } = await createNotification({
      ...newNotif,
      is_global: true
    });
    if (!error) {
      setNewNotif({ title: '', description: '', type: 'sistema' });
      setShowAdminAdd(false);
      fetchNotifs();
    }
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    fetchNotifs();
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'history': return <History size={16} className="text-blue-400" />;
      case 'podcast': return <Radio size={16} className="text-purple-400" />;
      case 'rank': return <Trophy size={16} className="text-yellow-400" />;
      default: return <Newspaper size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-8 sm:items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>

      <div className={`relative w-full max-w-sm border rounded-[40px] overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-10 duration-500 ${isDarkMode ? 'bg-[#0f0f0f] border-white/10' : 'bg-white border-[#0B1D33]/10'
        }`}>
        <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'border-white/5 bg-gray-900/30' : 'border-[#0B1D33]/5 bg-[#F0F2F5]/50'
          }`}>
          <div className="flex flex-col">
            <h3 className={`text-[10px] font-black tracking-[0.2em] uppercase flex items-center gap-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
              {showSettings ? 'Configurações' : 'Central de Avisos'}
            </h3>
            <span className={`text-lg font-black italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
              {showSettings ? 'PREFERÊNCIAS' : 'NOTIFICAÇÕES'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!showSettings && isAdmin && (
              <button
                onClick={() => setShowAdminAdd(!showAdminAdd)}
                className={`p-2 rounded-full transition-colors ${showAdminAdd ? 'bg-yellow-400 text-black' : isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-[#0B1D33] hover:bg-black/5'}`}
                title="Novo Aviso"
              >
                <Plus size={18} />
              </button>
            )}
            {!showSettings && !showAdminAdd && notifications.length > 0 && (
              <button
                onClick={markAllRead}
                className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-[#0B1D33] hover:bg-black/5'}`}
                title="Marcar todas como lidas"
              >
                <CheckCircle size={18} />
              </button>
            )}
            <button
              onClick={() => { setShowSettings(!showSettings); setShowAdminAdd(false); }}
              className={`p-2 rounded-full transition-all ${showSettings
                ? isDarkMode ? 'bg-yellow-400 text-black rotate-90' : 'bg-[#0B1D33] text-white rotate-90'
                : isDarkMode ? 'text-gray-400 hover:bg-white/5' : 'text-gray-400 hover:bg-black/5'
                }`}
            >
              <Settings size={18} />
            </button>
            <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-gray-400 hover:bg-white/5' : 'text-gray-400 hover:bg-black/5'
              }`}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[50vh] overflow-y-auto no-scrollbar">
          {showAdminAdd ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <input
                className={`w-full bg-black/10 border-none rounded-2xl py-3 px-4 text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}
                placeholder="Título (Ex: SISTEMA)"
                value={newNotif.title}
                onChange={e => setNewNotif({ ...newNotif, title: e.target.value.toUpperCase() })}
              />
              <textarea
                className={`w-full bg-black/10 border-none rounded-2xl py-3 px-4 text-sm h-24 resize-none ${isDarkMode ? 'text-white' : 'text-black'}`}
                placeholder="Mensagem do aviso..."
                value={newNotif.description}
                onChange={e => setNewNotif({ ...newNotif, description: e.target.value })}
              />
              <select
                className={`w-full bg-black/10 border-none rounded-2xl py-3 px-4 text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}
                value={newNotif.type}
                onChange={e => setNewNotif({ ...newNotif, type: e.target.value })}
              >
                <option value="sistema">Sistema</option>
                <option value="noticia">Notícia</option>
                <option value="podcast">Podcast</option>
                <option value="history">História</option>
              </select>
              <button
                onClick={handleCreate}
                className="w-full py-4 bg-yellow-400 text-black rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-yellow-400/20"
              >
                PUBLICAR AVISO
              </button>
            </div>
          ) : showSettings ? (
            <div className="space-y-3">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-4">Em breve: Filtros personalizados</p>
              {/* placeholder components if needed */}
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map(notif => {
                const isUnread = notif.created_at > lastReadAt;
                return (
                  <div key={notif.id} className={`p-5 rounded-[30px] border relative overflow-hidden transition-all group ${!isUnread ? 'opacity-50' : 'opacity-100'
                    } ${isDarkMode ? 'bg-[#161616] border-white/5' : 'bg-[#F9FAFB] border-[#0B1D33]/5 shadow-sm'
                    }`}>
                    {isUnread && (
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${isDarkMode ? 'bg-yellow-400' : 'bg-[#0B1D33]'}`}></div>
                    )}
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(notif.type)}
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{notif.title}</span>
                      </div>
                      <span className="text-[9px] text-gray-500 font-bold uppercase">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className={`text-[13px] leading-relaxed mb-3 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{notif.description}</p>
                    {isAdmin && (
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleDelete(notif.id)}
                          className="text-[9px] font-black uppercase tracking-widest text-red-500/50 hover:text-red-500 transition-colors"
                        >
                          APAGAR
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {isAdmin && (
                <button
                  onClick={clearAll}
                  className={`w-full py-4 rounded-[24px] text-[10px] font-black transition-all uppercase tracking-[0.3em] flex items-center justify-center gap-2 border ${isDarkMode ? 'border-white/5 text-gray-500 hover:text-white hover:bg-white/5' : 'border-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50'
                    }`}
                >
                  <Trash2 size={14} />
                  Limpar Tudo
                </button>
              )}
            </div>
          ) : (
            <div className="py-12 text-center animate-in zoom-in-95 duration-500">
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                <BellRing size={32} className="text-gray-400/50" />
              </div>
              <h4 className={`text-md font-black uppercase tracking-tighter mb-1 ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>Tudo Limpo!</h4>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Nenhuma notificação por enquanto.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPopup;
