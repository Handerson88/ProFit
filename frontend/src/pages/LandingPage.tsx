import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  CheckCircle2, 
  Smartphone, 
  Zap, 
  Target, 
  Camera, 
  BarChart3, 
  Heart, 
  Layout,
  MessageSquare,
  ShieldCheck,
  Play,
  ArrowRight,
  Menu,
  X,
  Star,
  Plus,
  Minus
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [expandedFaq, setExpandedFaq] = React.useState<number | null>(null);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  const navItems = [
    { label: 'Funcionalidades', href: '#features' },
    { label: 'Como Funciona', href: '#how-it-works' },
    { label: 'Depoimentos', href: '#testimonials' },
    { label: 'Preços', href: '#pricing' },
  ];

  const features = [
    { 
      icon: <Layout className="text-emerald-500" />, 
      title: 'Treinos Organizados', 
      desc: 'Planos mensais estruturados para máxima eficiência.' 
    },
    { 
      icon: <Zap className="text-orange-500" />, 
      title: 'Controle de Calorias', 
      desc: 'Acompanhe cada macro com precisão matemática.' 
    },
    { 
      icon: <BarChart3 className="text-blue-500" />, 
      title: 'Registro de Progresso', 
      desc: 'Gráficos detalhados sobre sua evolução física.' 
    },
    { 
      icon: <Target className="text-rose-500" />, 
      title: 'Metas Fitness', 
      desc: 'Defina e alcance objetivos reais com inteligência.' 
    },
    { 
      icon: <Camera className="text-emerald-400" />, 
      title: 'Scanner de IA', 
      desc: 'Analise qualquer prato instantaneamente via câmera.' 
    },
    { 
      icon: <ShieldCheck className="text-emerald-500" />, 
      title: 'Segurança Total', 
      desc: 'Seus dados protegidos e sempre acessíveis.' 
    },
  ];

  const testimonials = [
    {
      name: 'Ricardo Silva',
      role: 'Entusiasta Fitness',
      text: 'O ProFit me ajudou a organizar meus treinos e perder 6kg em apenas 2 meses. O scanner de comida é mágico!',
      rating: 5,
    },
    {
      name: 'Mariana Costa',
      role: 'Atleta Amadora',
      text: 'A função de controle de calorias é incrível. Nunca foi tão fácil manter a dieta nos trilhos.',
      rating: 5,
    },
    {
      name: 'João Pedro',
      role: 'Focado em Hipertrofia',
      text: 'Interface limpa e funções diretas ao ponto. O melhor app de fitness que já usei.',
      rating: 5,
    }
  ];

  const faqs = [
    { q: 'O ProFit é gratuito?', a: 'Sim, você pode começar gratuitamente e acessar as funções básicas. Temos a versão Elite por um preço único para quem quer ir além.' },
    { q: 'Quanto custa o ProFit Elite?', a: 'O acesso Elite custa apenas 599 MZN. É um pagamento único, sem mensalidades recorrentes.' },
    { q: 'Posso cancelar quando quiser?', a: 'Como é um pagamento único para acesso vitalício às funções Elite, não há o que cancelar! O acesso é seu para sempre.' },
    { q: 'Funciona no celular?', a: 'Sim! O ProFit foi desenhado primeiro para mobile, garantindo uma experiência fluida em qualquer smartphone.' },
    { q: 'Preciso de experiência com treino?', a: 'Não. O app se adapta ao seu nível, seja você um iniciante ou um atleta experiente.' },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-emerald-500/30 font-sans overflow-x-hidden relative">
      {/* Global Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="absolute top-[30%] right-[10%] w-[20%] h-[20%] bg-purple-500/5 rounded-full blur-[80px]" />
      </div>

      {/* Header */}
      <nav className="fixed top-0 w-full z-50 bg-[#020617]/70 backdrop-blur-2xl border-b border-white/[0.03]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center font-black text-[#020617] shadow-lg shadow-emerald-500/20 transform group-hover:rotate-6 transition-transform">P</div>
            <span className="text-2xl font-black tracking-tighter" translate="no">Pro<span className="text-emerald-500">Fit</span></span>
          </div>

          <div className="hidden md:flex items-center gap-10">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className="text-[13px] font-semibold text-slate-400 hover:text-white transition-all uppercase tracking-widest">
                {item.label}
              </a>
            ))}
            <Link to="/login" className="px-8 py-2.5 bg-white text-[#020617] font-bold rounded-full transition-all hover:bg-emerald-500 hover:text-white shadow-xl hover:shadow-emerald-500/40">
              Entrar
            </Link>
          </div>

          <button className="md:hidden w-10 h-10 flex items-center justify-center bg-white/5 rounded-lg border border-white/10" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden absolute top-20 left-0 w-full bg-[#020617] border-b border-white/5 overflow-hidden shadow-2xl"
            >
              <div className="p-8 space-y-6">
                {navItems.map((item) => (
                  <a 
                    key={item.label} 
                    href={item.href} 
                    className="block text-xl font-bold text-slate-300 hover:text-emerald-500 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
                <Link 
                  to="/login" 
                  className="block w-full py-5 bg-emerald-500 text-[#020617] text-center font-black text-lg rounded-2xl shadow-lg shadow-emerald-500/20"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Começar Agora
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="relative z-10">
        {/* Section 1: Hero */}
        <section className="relative min-h-screen flex items-center px-6 pt-20">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center w-full">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="space-y-10"
            >
              <div className="inline-flex items-center gap-3 px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.2em]">Inteligência Artificial Fitness</span>
              </div>
              
              <h1 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter">
                Seu corpo <br /> em sua <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600">Melhor Versão.</span>
              </h1>
              
              <p className="text-lg md:text-2xl text-slate-400 max-w-xl leading-relaxed font-medium">
                O ProFit combina inteligência artificial com planos de treino reais para que você alcance resultados espetaculares em tempo recorde.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-5">
                <button 
                  onClick={() => navigate('/login')}
                  className="px-12 py-6 bg-emerald-500 hover:bg-emerald-400 text-[#020617] font-black text-xl rounded-2xl transition-all hover:scale-[1.03] hover:shadow-[0_0_50px_rgba(16,185,129,0.4)] flex items-center justify-center gap-3 active:scale-95 group"
                >
                  Começar agora <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={() => document.getElementById('video-demo')?.scrollIntoView({ behavior: 'smooth' })} className="px-12 py-6 bg-white/5 hover:bg-white/10 text-white font-bold text-xl rounded-2xl transition-all border border-white/10 backdrop-blur-sm flex items-center justify-center gap-3 active:scale-95">
                  <Play fill="currentColor" size={20} /> Ver demonstração
                </button>
              </div>

              <div className="flex items-center gap-6 pt-10 border-t border-white/5">
                <div className="flex -space-x-3">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="w-11 h-11 rounded-full border-[3px] border-[#020617] bg-slate-800 flex items-center justify-center overflow-hidden">
                      <div className={`w-full h-full bg-gradient-to-br ${i % 2 === 0 ? 'from-emerald-500 to-blue-500' : 'from-orange-400 to-rose-500'} opacity-70`} />
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-[15px] font-bold text-white tracking-tight">Junte-se a +25.000 membros</p>
                  <div className="flex items-center gap-1 mt-0.5">
                     {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="#fbbf24" stroke="#fbbf24" />)}
                     <span className="text-[11px] font-black text-yellow-500/70 ml-1">4.9/5</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
              className="relative lg:h-[800px] flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/30 to-blue-600/30 rounded-full blur-[150px] animate-pulse scale-75" />
              <img 
                src="/landing/hero.png" 
                alt="Application Showcase" 
                className="relative z-10 w-full max-w-[550px] h-auto drop-shadow-[0_60px_100px_rgba(0,0,0,0.8)] filter brightness-[1.1] contrast-[1.1]"
              />
              
              {/* Floating Badges */}
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 -left-10 z-20 bg-white/10 backdrop-blur-2xl p-4 rounded-2xl border border-white/20 shadow-2xl hidden xl:block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white"><Zap fill="currentColor" /></div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-emerald-400">Scanner IA</p>
                    <p className="text-sm font-bold">1.2s p/ analisar</p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-1/4 -right-10 z-20 bg-white/10 backdrop-blur-2xl p-4 rounded-2xl border border-white/20 shadow-2xl hidden xl:block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white"><BarChart3 size={20} /></div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-blue-400">Progresso</p>
                    <p className="text-sm font-bold">+12% Hipertrofia</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Section 2: O Problema */}
        <section className="py-32 px-6 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8 mb-24 relative z-10">
            <motion.h2 {...fadeIn} className="text-4xl md:text-7xl font-black tracking-tighter">O fitness tradicional <br /><span className="text-slate-600">não funciona mais.</span></motion.h2>
            <motion.p {...fadeIn} className="text-slate-400 text-xl font-medium max-w-2xl mx-auto leading-relaxed">Pausas longas, dietas impossíveis e treinos chatos são coisa do passado. O ProFit traz a ciência para o seu bolso.</motion.p>
          </div>

          <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <Target className="text-emerald-500" />, title: 'Consistência', desc: 'Acordar sem saber o treino do dia mata o seu progresso.' },
              { icon: <Smartphone className="text-blue-500" />, title: 'Nutrição IA', desc: 'Comer "limpo" sem pesar macros é como dirigir no escuro.' },
              { icon: <BarChart3 className="text-orange-500" />, title: 'Métricas Reais', desc: 'Se você não mede, você não melhora. Simples assim.' },
              { icon: <Heart className="text-rose-500" />, title: 'Foco Mental', desc: 'Muitas opções geram paralisia. Nós simplificamos tudo.' },
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-10 bg-white/[0.02] border border-white/[0.05] rounded-[2.5rem] hover:bg-white/[0.05] transition-all group hover:-translate-y-2 duration-500"
              >
                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-all shadow-xl">
                  {item.icon}
                </div>
                <h3 className="text-2xl font-black mb-4 tracking-tight">{item.title}</h3>
                <p className="text-slate-400 font-medium leading-[1.6]">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Section 2.5: Video Demo */}
        <section id="video-demo" className="py-32 px-6 relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20 space-y-6">
              <h2 className="text-4xl md:text-7xl font-black tracking-tighter">Assista em ação</h2>
              <p className="text-slate-400 text-xl max-w-2xl mx-auto">Tecnologia avançada para quem busca resultados extraordinários.</p>
            </div>
            
            <motion.div 
               {...fadeIn}
               className="relative aspect-video max-w-5xl mx-auto rounded-[3.5rem] overflow-hidden group shadow-[0_40px_100px_rgba(0,0,0,0.6)] border border-white/10"
            >
               <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
               <img 
                 src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=2000" 
                 alt="Video Placeholder" 
                 className="w-full h-full object-cover grayscale-[0.3] transition-transform duration-[2000ms] group-hover:scale-110" 
               />
               <button className="absolute inset-0 m-auto w-28 h-28 bg-emerald-500 rounded-full flex items-center justify-center text-[#020617] shadow-[0_0_80px_rgba(16,185,129,0.5)] z-20 group-hover:scale-110 transition-all active:scale-95">
                  <Play fill="currentColor" size={40} className="ml-1.5" />
               </button>
               <div className="absolute bottom-12 left-12 z-20">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-emerald-500 text-[#020617] text-[10px] font-black uppercase rounded-full">New</span>
                    <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Demo v2.0</span>
                  </div>
                  <p className="text-4xl font-black tracking-tight">O Poder do Scanner IA</p>
               </div>
            </motion.div>
          </div>
        </section>

        {/* Section 3: A Solução (Features) */}
        <section id="features" className="py-36 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-1 py-10 space-y-8">
                <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-tight">Engine de <br /><span className="text-emerald-500">Performance.</span></h2>
                <p className="text-slate-400 text-xl font-medium leading-relaxed">Desenvolvido com tecnologia de visão computacional para tornar sua jornada invisível e eficiente.</p>
                <button 
                  onClick={() => navigate('/home')}
                  className="px-8 py-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-2xl border border-emerald-500/30 flex items-center gap-3 transition-all"
                >
                  Explorar todos os recursos <ArrowRight size={20} />
                </button>
              </div>
              {features.map((f, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative p-12 bg-white/[0.02] border border-white/[0.05] rounded-[3.5rem] overflow-hidden group hover:border-emerald-500/30 transition-all shadow-2xl h-full flex flex-col justify-between"
                >
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="mb-10 w-16 h-16 flex items-center justify-center bg-slate-900 rounded-2xl group-hover:scale-110 transition-transform shadow-lg">
                    {React.cloneElement(f.icon as React.ReactElement, { size: 30 })}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black mb-5 tracking-tight group-hover:text-emerald-400 transition-colors">{f.title}</h3>
                    <p className="text-slate-400 leading-relaxed font-medium text-lg">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: Como Funciona */}
        <section id="how-it-works" className="py-40 px-6 relative bg-[#020617]/50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-5xl md:text-8xl font-black text-center mb-36 tracking-tighter">Simples. <span className="text-slate-700 tracking-normal font-normal italic">Mas não fácil.</span></h2>
            <div className="grid md:grid-cols-3 gap-24 relative">
              <div className="absolute top-24 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent hidden lg:block" />
              {[
                { step: '01', title: 'Onboarding IA', desc: 'Entendemos seu metabolismo e criamos seu perfil único em segundos.' },
                { step: '02', title: 'Plano Dinâmico', desc: 'Sua rotina se adapta ao seu progresso real, não ao contrário.' },
                { step: '03', title: 'Domínio Real', desc: 'Scaneie cada refeição e veja seus macros em tempo real.' },
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="text-center group"
                >
                  <div className="w-28 h-28 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-[#020617] text-4xl font-black mx-auto relative z-10 shadow-[0_20px_50px_rgba(16,185,129,0.4)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-700">
                    {item.step}
                  </div>
                  <h3 className="text-3xl font-black mt-12 mb-6 tracking-tight">{item.title}</h3>
                  <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-sm mx-auto">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 5: App Demo (Scanner) */}
        <section className="py-40 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-24">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
              className="lg:w-1/2 space-y-12"
            >
              <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9]">
                Scanner <br /> <span className="text-emerald-500 font-serif italic font-normal lowercase tracking-normal">Instântaneo.</span>
              </h2>
              <div className="space-y-8">
                {[
                  { t: 'Visão Computacional', d: 'Identifica alimentos com precisão de 98%.' },
                  { t: 'Macros em Tempo Real', d: 'Proteínas, Carbs e Gorduras em 1.2 segundos.' },
                  { t: 'Registro Automático', d: 'Esqueça digitar nomes de alimentos. Aponte e registre.' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 items-start group">
                    <div className="mt-1 w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-[#020617] transition-all">
                      <Camera size={20} />
                    </div>
                    <div>
                      <h4 className="text-2xl font-black mb-1">{item.t}</h4>
                      <p className="text-slate-400 text-lg font-medium">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/home')} className="px-12 py-6 bg-white text-[#020617] font-black text-xl rounded-2xl flex items-center gap-3 transition-all hover:bg-emerald-500 hover:text-white group active:scale-95 shadow-2xl">
                Testar Scanner agora <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="lg:w-1/2 relative"
            >
              <div className="absolute inset-0 bg-emerald-500/20 blur-[150px] rounded-full scale-110 animate-pulse" />
              <img 
                src="/landing/scanner.png" 
                alt="Scanner Demo" 
                className="relative z-10 w-full max-w-[550px] mx-auto drop-shadow-[0_50px_100px_rgba(0,0,0,0.8)] rounded-[3rem]" 
              />
            </motion.div>
          </div>
        </section>

        {/* Section 6: Benefícios */}
        <section className="py-24 px-6 bg-[#0F172A]">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <h2 className="text-4xl font-bold">Tudo que você precisa para evoluir</h2>
              <p className="text-slate-400">Uma experiência premium completa, focada em resultados reais e usabilidade simplificada.</p>
            </div>
            {[
              { icon: <ShieldCheck />, title: 'Ambiente Seguro', desc: 'Seus dados são criptografados e protegidos.' },
              { icon: <Smartphone />, title: 'Focado em Mobile', desc: 'Sempre com você, na academia ou na cozinha.' },
              { icon: <Heart />, title: 'Saúde Mental', desc: 'Reduza o estresse da organização manual.' },
              { icon: <Zap />, title: 'Performance', desc: 'Carregamento instantâneo para não perder tempo.' },
              { icon: <BarChart3 />, title: 'Insights', desc: 'Relatórios que mostram de onde vem seu resultado.' }
            ].map((item, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -5 }}
                className="p-8 bg-white/5 border border-white/5 rounded-3xl"
              >
                <div className="text-emerald-500 mb-6">{item.icon}</div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Section 7: Prova Social (Testimonials) */}
        <section id="testimonials" className="py-40 px-6 relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="max-w-7xl mx-auto relative z-10">
            <h2 className="text-5xl md:text-8xl font-black text-center mb-32 tracking-tighter">Impacto <span className="text-slate-600">Real.</span></h2>
            <div className="grid md:grid-cols-3 gap-10">
              {testimonials.map((t, i) => (
                <motion.div 
                   key={i} 
                   initial={{ opacity: 0, y: 30 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   transition={{ delay: i * 0.1 }}
                   className="p-12 bg-white/[0.02] border border-white/[0.05] rounded-[3.5rem] flex flex-col h-full hover:bg-white/[0.04] transition-all hover:-translate-y-2 group"
                >
                  <div className="flex gap-1 text-yellow-500 mb-8">
                    {Array.from({ length: t.rating }).map((_, j) => <Star key={j} size={18} fill="currentColor" />)}
                  </div>
                  <p className="text-2xl font-medium text-white mb-10 flex-grow leading-snug">"{t.text}"</p>
                  <div className="flex items-center gap-5 pt-8 border-t border-white/[0.03]">
                    <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10">
                       <img src={`https://i.pravatar.cc/150?u=${t.name}`} alt={t.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-black text-xl text-white leading-none">{t.name}</p>
                      <p className="text-sm font-bold text-emerald-500 mt-2 uppercase tracking-widest">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 8: Estatísticas */}
        <section className="py-24 border-y border-white/5">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Usuários Ativos', val: '10.000+' },
              { label: 'Treinos Realizados', val: '200.000+' },
              { label: 'Refeições Scaneadas', val: '50.000+' },
              { label: 'Avaliação Média', val: '4.9/5' },
            ].map((stat, i) => (
              <motion.div key={i} {...fadeIn} className="text-center space-y-2">
                <p className="text-4xl md:text-5xl font-black text-emerald-500">{stat.val}</p>
                <p className="text-slate-400 font-medium uppercase tracking-widest text-[10px]">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Section 9: Preços (Pricing) */}
        <section id="pricing" className="py-40 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-5xl md:text-8xl font-black text-center mb-10 tracking-tighter">Invista em <br /> <span className="text-emerald-500 italic font-normal font-serif lowercase tracking-normal">Você.</span></h2>
            <p className="text-slate-400 text-2xl text-center mb-32 font-medium">Planos flexíveis para cada fase do seu progresso.</p>
            
            <div className="max-w-3xl mx-auto">
              <motion.div 
                whileHover={{ y: -10 }}
                className="p-16 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[4rem] shadow-[0_40px_100px_rgba(79,70,229,0.3)] relative overflow-hidden group transition-all text-center"
              >
                <div className="absolute top-10 right-10 px-6 py-2 bg-white/20 rounded-full text-[11px] font-black uppercase tracking-widest text-white border border-white/20">Acesso Vitalício</div>
                <div className="space-y-12 relative z-10">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-black uppercase tracking-widest text-white/70">ProFit Elite</h3>
                    <div className="flex items-baseline justify-center gap-1 text-white">
                      <span className="text-8xl font-black">599</span>
                      <span className="font-bold mb-4 uppercase tracking-tighter">MZN</span>
                    </div>
                    <p className="text-indigo-100 font-bold opacity-80 uppercase tracking-widest text-xs">Pague uma vez, use para sempre</p>
                  </div>
                  <ul className="grid md:grid-cols-2 gap-6 text-left max-w-2xl mx-auto">
                    {[
                      'Scanner IA ilimitado', 
                      'Planos de treino personalizados', 
                      'Suporte prioritário 24/7', 
                      'Estatísticas avançadas', 
                      'Zero mensalidades',
                      'Macros detalhados'
                    ].map(item => (
                      <li key={item} className="flex items-center gap-4 text-lg font-bold text-white">
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white"><CheckCircle2 size={14} /></div> {item}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => navigate('/login')} className="w-full max-w-md mx-auto py-7 bg-white text-indigo-600 font-black text-2xl rounded-3xl transition-all shadow-2xl hover:bg-indigo-50 active:scale-95 uppercase tracking-tighter">
                    Garantir Acesso Elite
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Section 10 & 11: FAQ & CTA Final */}
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-32 items-start">
            <div className="space-y-12">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter">Ficou com <br /><span className="text-slate-600">alguma dúvida?</span></h2>
              <div className="space-y-4">
                {faqs.map((faq, i) => (
                  <div key={i} className="border-b border-white/[0.05] last:border-none">
                    <button 
                      onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                      className="w-full flex justify-between items-center py-8 text-left group"
                    >
                      <span className={`text-xl font-black transition-colors ${expandedFaq === i ? 'text-emerald-500' : 'text-slate-300 group-hover:text-white'}`}>{faq.q}</span>
                      <div className={`w-8 h-8 rounded-full border border-white/10 flex items-center justify-center transition-all ${expandedFaq === i ? 'bg-emerald-500 border-emerald-500 text-[#020617] rotate-45' : ''}`}>
                        <Plus size={18} />
                      </div>
                    </button>
                    {expandedFaq === i && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-slate-400 pb-8 pr-12 text-lg font-medium leading-relaxed"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-emerald-500 p-16 md:p-24 rounded-[4rem] text-[#020617] space-y-12 text-center md:text-left relative overflow-hidden group shadow-[0_50px_100px_rgba(16,185,129,0.3)]">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px] group-hover:bg-white/30 transition-all duration-1000" />
              <div className="space-y-6 relative z-10">
                <h2 className="text-5xl md:text-7xl font-black leading-[0.9] tracking-tighter">
                  Sua melhor versão <br /> começa aqui.
                </h2>
                <p className="text-2xl font-bold text-[#020617]/70 leading-relaxed">
                  Não deixe para amanhã o corpo que você pode começar a construir hoje.
                </p>
              </div>
              <button 
                onClick={() => navigate('/home')}
                className="w-full md:w-auto px-16 py-7 bg-[#020617] text-white font-black text-2xl rounded-[2rem] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-4 relative z-10 group shadow-2xl"
              >
                Começar Grátis agora <ArrowRight size={28} className="group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-24 px-6 border-t border-white/5 relative bg-[#020617]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-20 mb-24">
            <div className="md:col-span-5 space-y-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center font-black text-[#020617] text-2xl shadow-lg">P</div>
                <span className="text-3xl font-black tracking-tighter" translate="no">Pro<span className="text-emerald-500">Fit</span></span>
              </div>
              <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-sm">
                A plataforma definitiva para quem busca performance, saúde e resultados reais através de tecnologia.
              </p>
              <div className="flex gap-4">
                {['Twitter', 'Instagram', 'LinkedIn'].map(social => (
                  <a key={social} href="#" className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-[#020617] hover:border-emerald-500 transition-all">
                    <span className="sr-only">{social}</span>
                    <div className="w-5 h-5 bg-current rounded-full" />
                  </a>
                ))}
              </div>
            </div>
            
            <div className="md:col-span-2 space-y-8">
              <h4 className="text-lg font-black uppercase tracking-widest text-slate-500">Produto</h4>
              <ul className="space-y-4 text-slate-400 font-bold text-lg">
                <li><a href="#features" className="hover:text-emerald-500 transition-colors">Features</a></li>
                <li><a href="#video-demo" className="hover:text-emerald-500 transition-colors">Demo</a></li>
                <li><a href="#pricing" className="hover:text-emerald-500 transition-colors">Preços</a></li>
                <li><a href="#testimonials" className="hover:text-emerald-500 transition-colors">Feedback</a></li>
              </ul>
            </div>

            <div className="md:col-span-2 space-y-8">
              <h4 className="text-lg font-black uppercase tracking-widest text-slate-500">Suporte</h4>
              <ul className="space-y-4 text-slate-400 font-bold text-lg">
                <li><a href="#" className="hover:text-emerald-500 transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-emerald-500 transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-emerald-500 transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-emerald-500 transition-colors">API</a></li>
              </ul>
            </div>

            <div className="md:col-span-3 space-y-8">
              <h4 className="text-lg font-black uppercase tracking-widest text-slate-500">Newsletter</h4>
              <p className="text-slate-400 font-medium">Receba dicas exclusivas de performance.</p>
              <div className="flex bg-white/[0.03] border border-white/[0.05] rounded-2xl p-2 group-focus-within:border-emerald-500/50 transition-all">
                <input type="email" placeholder="Email" className="bg-transparent border-none outline-none px-4 py-3 flex-grow text-white font-medium" />
                <button className="w-12 h-12 bg-emerald-500 text-[#020617] rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg">
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="pt-12 border-t border-white/[0.03] flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-slate-500 font-bold text-sm">
               © {new Date().getFullYear()} ProFit Labs. Crafted with precision for high performers.
            </p>
            <div className="flex gap-10 text-slate-500 font-bold text-sm">
              <a href="#" className="hover:text-slate-300">Termos</a>
              <a href="#" className="hover:text-slate-300">Privacidade</a>
              <a href="#" className="hover:text-slate-300">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
