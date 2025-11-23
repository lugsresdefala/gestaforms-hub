import { ReactNode, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, LayoutDashboard, PlusCircle, CheckCircle, Users, Building2, LogOut, BookOpen, FileCheck, Upload, HelpCircle, Shield, FileText, Mail, UserPlus, ChevronDown, Bell, Menu, X } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavLink } from "@/components/NavLink";
import NotificationBell from "@/components/NotificationBell";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useData } from "@/contexts/DataContext";
interface AppLayoutProps {
  children: ReactNode;
}

// Componente de conteúdo do menu (reutilizável para desktop e mobile)
const MenuContent = ({
  collapsed = false,
  onItemClick
}: {
  collapsed?: boolean;
  onItemClick?: () => void;
}) => {
  const {
    isAdmin,
    isAdminMed
  } = useAuth();
  const {
    solicitacoesPendentes,
    agendamentosPendentes
  } = useData();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["principal", "agendamentos"]));
  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  };
  const principalItems = [{
    title: "Início",
    url: "/",
    icon: LayoutDashboard,
    show: true
  }, {
    title: "Listagem de Agendamentos",
    url: "/dashboard",
    icon: Calendar,
    show: true
  }, {
    title: "Sistema de Ocupação",
    url: "/calendario-completo",
    icon: Building2,
    show: true
  }].filter(item => item.show);
  const agendamentoItems = [{
    title: "Novo",
    url: "/novo-agendamento",
    icon: PlusCircle,
    show: true
  }, {
    title: "Meus",
    url: "/meus-agendamentos",
    icon: Calendar,
    show: true
  }].filter(item => item.show);
  const adminItems = [{
    title: "Aprovações Médicas",
    url: "/aprovacoes-agendamentos",
    icon: CheckCircle,
    show: isAdminMed() || isAdmin(),
    badge: agendamentosPendentes > 0 ? agendamentosPendentes : undefined
  }, {
    title: "Aprovações Usuários",
    url: "/aprovacoes-usuarios",
    icon: Users,
    show: isAdmin() || isAdminMed(),
    badge: solicitacoesPendentes > 0 ? solicitacoesPendentes : undefined
  }, {
    title: "Criar Usuários Padrão",
    url: "/criar-usuarios-padrao",
    icon: UserPlus,
    show: isAdmin() || isAdminMed()
  }, {
    title: "Importar Agendamentos 2025",
    url: "/importar-agendamentos-2025",
    icon: Upload,
    show: isAdmin()
  }, {
    title: "Importar Lote",
    url: "/importar-agendamentos-lote",
    icon: Upload,
    show: isAdmin()
  }, {
    title: "Processar CSV",
    url: "/processar-csv-upload",
    icon: Upload,
    show: isAdmin()
  }, {
    title: "Pacientes Pendentes",
    url: "/importar-pacientes-pendentes",
    icon: Upload,
    show: isAdminMed()
  }, {
    title: "Atualizar IG",
    url: "/atualizar-ig",
    icon: Calendar,
    show: isAdmin()
  }, {
    title: "Corrigir Paridade",
    url: "/corrigir-paridade",
    icon: FileCheck,
    show: isAdmin()
  }, {
    title: "Gerenciar Usuários",
    url: "/gerenciar-usuarios",
    icon: Users,
    show: isAdmin()
  }, {
    title: "Logs de Auditoria",
    url: "/logs-auditoria",
    icon: Shield,
    show: isAdmin()
  }, {
    title: "Comparar Pacientes",
    url: "/comparar-pacientes",
    icon: FileCheck,
    show: isAdmin()
  }].filter(item => item.show);
  const suporteItems = [{
    title: "Protocolos",
    url: "/protocolos",
    icon: FileText
  }, {
    title: "Guia do Sistema",
    url: "/guia",
    icon: BookOpen
  }, {
    title: "FAQ",
    url: "/faq",
    icon: HelpCircle
  }, {
    title: "Sobre",
    url: "/sobre",
    icon: BookOpen
  }];
  const MenuGroup = ({
    title,
    items,
    groupKey
  }: {
    title: string;
    items: any[];
    groupKey: string;
  }) => {
    const isExpanded = expandedGroups.has(groupKey);
    return <SidebarGroup className="mb-2">
        {!collapsed && <button onClick={() => toggleGroup(groupKey)} className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold tracking-wider uppercase text-sky-200/70 hover:text-sky-100 transition-all duration-200 group">
            <span>{title}</span>
            <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${isExpanded ? "rotate-0" : "-rotate-90"}`} />
          </button>}

        <div className={`overflow-hidden transition-all duration-300 ${collapsed || isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end onClick={onItemClick} className="group relative transition-all duration-300 hover:bg-white/10 hover:backdrop-blur-md rounded-lg text-sky-50/90 hover:text-white hover:shadow-lg hover:shadow-orange-500/20" activeClassName="bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-white font-semibold shadow-xl shadow-orange-500/30 backdrop-blur-sm border border-orange-400/30">
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-400/0 to-amber-400/0 group-hover:from-orange-400/10 group-hover:to-amber-400/10 transition-all duration-300 shadow-lg rounded-sm opacity-90" />
                      <item.icon className="h-4 w-4 transition-colors duration-300" />
                      {!collapsed && <span className="text-sm flex-1">{item.title}</span>}
                      {!collapsed && item.badge && <Badge variant="destructive" className="ml-auto h-5 px-2 text-xs bg-red-500 hover:bg-red-600 animate-pulse">
                          {item.badge}
                        </Badge>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </div>
      </SidebarGroup>;
  };
  return <>
      {/* Logo Header */}
      <div className={`p-4 sm:p-6 border-b border-sky-400/20 bg-gradient-to-br from-white/5 to-sky-400/5 backdrop-blur-xl transition-all duration-300 ${collapsed ? "px-3" : ""}`}>
        {!collapsed ? <div className="flex flex-col gap-3">
            <div className="backdrop-blur-MD p-3 sm:p-4 shadow-sky-900/60 border border-sky-200/50 bg-blue-50 py-[16px] px-[10px] rounded-sm shadow-inner opacity-95">
              <img src="/hapvida-logo.png" alt="Hapvida" className="h-12 sm:h-16 w-full object-contain drop-shadow-lg" />
            </div>
            <div className="text-center">
              <span className="text-xs text-sky-100 tracking-wider uppercase bg-sky-500/20 px-3 py-1.5 rounded-full border border-sky-400/30 backdrop-blur-md font-medium text-center">
                Gestação Segura
              </span>
            </div>
          </div> : <div className="bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-xl">
            <img src="/hapvida-logo.png" alt="Hapvida" className="h-8 object-contain" />
          </div>}
      </div>

      {/* Menu Groups */}
      <div className="py-4 space-y-2">
        <MenuGroup title="Principal" items={principalItems} groupKey="principal" />
        {agendamentoItems.length > 0 && <MenuGroup title="Agendamentos" items={agendamentoItems} groupKey="agendamentos" />}
        {adminItems.length > 0 && <MenuGroup title="Administração" items={adminItems} groupKey="administracao" />}

        <SidebarGroup className="mb-2">
          {!collapsed && <SidebarGroupLabel className="text-xs font-semibold tracking-wider uppercase text-sky-200/70 px-3">
              Suporte
            </SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {suporteItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end onClick={onItemClick} className="group relative transition-all duration-300 hover:bg-white/10 hover:backdrop-blur-md rounded-lg text-sky-50/90 hover:text-white hover:shadow-lg hover:shadow-orange-500/20" activeClassName="bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-white font-semibold shadow-xl shadow-orange-500/30 backdrop-blur-sm border border-orange-400/30">
                      <item.icon className="h-4 w-4 transition-colors duration-300" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="mailto:T_TIAGO.OLIVEIRA@HAPVIDA.COM.BR" className="group relative transition-all duration-300 hover:bg-white/10 hover:backdrop-blur-md rounded-lg text-sky-50/90 hover:text-white hover:shadow-lg hover:shadow-orange-500/20">
                    <Mail className="h-4 w-4 transition-colors duration-300" />
                    {!collapsed && <span className="text-sm">Contato</span>}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </div>
    </>;
};

// Desktop Sidebar
const AppSidebar = () => {
  const {
    state
  } = useSidebar();
  const collapsed = state === "collapsed";
  return <Sidebar className={`hidden lg:flex ${collapsed ? "w-16" : "w-64"} transition-all duration-300`} collapsible="icon">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-800 via-blue-900 to-slate-900" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />

      <SidebarContent className="relative">
        <MenuContent collapsed={collapsed} />
      </SidebarContent>
    </Sidebar>;
};
export const AppLayout = ({
  children
}: AppLayoutProps) => {
  const navigate = useNavigate();
  const {
    signOut,
    isAdmin,
    isAdminMed
  } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      setIsScrolled(target.scrollTop > 10);
    };
    const mainElement = document.querySelector("main");
    mainElement?.addEventListener("scroll", handleScroll);
    return () => mainElement?.removeEventListener("scroll", handleScroll);
  }, []);
  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };
  return <SidebarProvider>
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-sky-50/50 flex">
        {/* Desktop Sidebar */}
        <AppSidebar />

        <div className="flex-1 flex flex-col min-h-screen w-full lg:w-auto">
          {/* Header - Responsivo */}
          <header className={`h-14 sm:h-16 flex items-center justify-between border-b px-3 sm:px-4 lg:px-6 sticky top-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white/95 backdrop-blur-xl shadow-lg shadow-sky-900/5 border-sky-200/50" : "bg-white/80 backdrop-blur-md border-sky-200/30"}`}>
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Mobile Menu Button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9 hover:bg-orange-50 hover:shadow-md hover:shadow-orange-500/20 transition-all duration-300 rounded-lg">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0 bg-gradient-to-br from-blue-800 via-blue-900 to-slate-900">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
                  
                  <SheetHeader className="p-4 border-b border-sky-400/20">
                    <div className="flex items-center justify-between">
                      <SheetTitle className="text-white">Menu</SheetTitle>
                      <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="h-8 w-8 text-white hover:bg-white/10">
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </SheetHeader>
                  
                  <ScrollArea className="h-[calc(100vh-80px)] relative">
                    <MenuContent onItemClick={() => setMobileMenuOpen(false)} />
                  </ScrollArea>
                </SheetContent>
              </Sheet>

              {/* Desktop Sidebar Toggle */}
              <SidebarTrigger className="hidden lg:flex h-9 w-9 hover:bg-orange-50 hover:shadow-md hover:shadow-orange-500/20 transition-all duration-300 rounded-lg" />
              
              <div className="flex flex-col">
                <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-blue-800 to-blue-900 bg-clip-text text-transparent tracking-tight">
                  PGS
                </h1>
                <p className="text-xs text-blue-700/70 font-medium hidden sm:block">Programa Gestação Segura</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {(isAdmin() || isAdminMed()) && <div className="relative">
                  <NotificationBell />
                </div>}
              <Button onClick={handleLogout} variant="ghost" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9 hover:bg-red-50 hover:text-red-600 hover:shadow-md hover:shadow-red-500/20 transition-all duration-300 rounded-lg group" title="Sair">
                <LogOut className="h-4 w-4 transition-colors duration-300" />
              </Button>
            </div>
          </header>

          {/* Main Content - Responsivo */}
          <main className="flex-1 overflow-y-auto flex flex-col">
            <div className="flex-1 p-3 sm:p-4 md:p-6">
              {children}
            </div>
            <Footer />
          </main>
        </div>
      </div>
    </SidebarProvider>;
};