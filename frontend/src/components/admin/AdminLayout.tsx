import React from 'react';
import { useNavigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Dumbbell, 
  Utensils, 
  LogOut,
  Settings,
  CircleDollarSign,
  Bell,
  Sun,
  Moon,
  Soup,
  Shield,
  MessageSquare,
  Activity
} from 'lucide-react';
import { useAdminTheme } from '../../context/AdminThemeContext';

const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { themeMode, setThemeMode } = useAdminTheme();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/admin/login');
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Painel', path: '/admin' },
        { icon: Users, label: 'Usuários', path: '/admin/users' },
        { icon: Activity, label: 'Treinos IA', path: '/admin/workouts' },
        { icon: Utensils, label: 'Alimentos', path: '/admin/foods' },
        { icon: Shield, label: 'Logs do Sistema', path: '/admin/logs' },
        { icon: CircleDollarSign, label: 'MRR', path: '/admin/mrr' },
        { icon: Bell, label: 'Notificações', path: '/admin/notifications' },
        { icon: Soup, label: 'Pratos', path: '/admin/dishes' },
        { icon: MessageSquare, label: 'Suporte IA', path: '/admin/support' }
    ];

    const getBreadcrumb = () => {
        if (location.pathname.startsWith('/admin/users/')) {
            return 'Admin / Usuários / Perfil';
        }
        const item = navItems.find(i => i.path === location.pathname);
        return item ? `Admin / ${item.label}` : 'Admin / Painel';
    };

    return (
        <div className="flex h-screen min-w-full bg-[#F7F9FC] dark:bg-[#0F172A] overflow-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
            {/* Sidebar */}
            <aside className="w-[260px] bg-white dark:bg-[#1E293B] border-r border-[#E6EAF0] dark:border-[#334155] flex flex-col h-full z-20 flex-shrink-0 transition-colors duration-300 shadow-sm">
                <div className="p-6 border-b border-[#E6EAF0] dark:border-[#334155] flex items-center gap-2">
                    <div className="w-7 h-7 bg-[#2D3748] dark:bg-[#38A169] rounded-md flex items-center justify-center font-bold text-white text-sm">
                        P
                    </div>
                    <span className="text-[18px] font-bold tracking-tight text-[#1A202C] dark:text-white">Administrador <span className="text-[#38A169]">ProFit</span></span>
                </div>
                
                <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/admin'}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-[12px] py-[12px] rounded-[10px] transition-all duration-150 text-[14px]
                                ${isActive 
                                    ? 'bg-[#EDF2F7] dark:bg-[#334155] text-[#2D3748] dark:text-white font-semibold' 
                                    : 'text-[#718096] dark:text-slate-400 hover:bg-[#F7F9FC] dark:hover:bg-[#1E293B] hover:text-[#2D3748] dark:hover:text-white'}
                            `}
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon size={18} className={isActive ? 'text-[#38A169]' : 'text-[#A0AEC0] dark:text-slate-500'} />
                                    <span>{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-[#E6EAF0] dark:border-[#334155]">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-[12px] py-[12px] w-full rounded-[10px] text-[#718096] dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 transition-colors text-[14px]"
                    >
                        <LogOut size={18} />
                        <span>Sair</span>
                    </button>
                </div>
            </aside>

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#F7F9FC] dark:bg-[#0F172A] transition-colors duration-300">
                {/* Header Superior */}
                <header className="h-[64px] bg-white dark:bg-[#1E293B] border-b border-[#E6EAF0] dark:border-[#334155] flex items-center justify-between px-8 z-10 flex-shrink-0 transition-colors duration-300">
                    <h2 className="text-[14px] font-medium text-[#718096] dark:text-slate-400">{getBreadcrumb()}</h2>
                    <div className="flex items-center gap-4">
                        {/* Theme Toggle */}
                        <button 
                            onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
                            className="p-2 rounded-lg bg-[#EDF2F7] dark:bg-[#334155] text-[#718096] dark:text-slate-400 hover:bg-[#E2E8F0] dark:hover:bg-[#475569] transition-all"
                            title={themeMode === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
                        >
                            {themeMode === 'light' ? <Moon size={20} /> : <Sun size={20} className="text-amber-400" />}
                        </button>

                        <div className="h-6 w-[1px] bg-[#E6EAF0] dark:bg-[#334155]" />

                        <div className="text-right hidden sm:block">
                            <p className="text-[14px] font-semibold text-[#1A202C] dark:text-white">Administrador</p>
                            <p className="text-[12px] text-[#A0AEC0] dark:text-slate-500">Disponível</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#EDF2F7] dark:bg-[#334155] flex items-center justify-center border border-[#E2E8F0] dark:border-[#475569] shadow-sm">
                            <Settings size={16} className="text-[#718096] dark:text-slate-400" />
                        </div>
                    </div>
                </header>
                
                {/* Área de Conteúdo Principal */}
                <main className="flex-1 overflow-y-auto p-[30px] w-full bg-[#F7F9FC] dark:bg-[#0F172A] transition-colors duration-300">
                    <div className="max-w-[1400px] mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
