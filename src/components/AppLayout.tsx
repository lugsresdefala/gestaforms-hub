// AppLayout.tsx
import { ReactNode, useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import {
  LayoutDashboard,
  Calendar,
  Building2,
  PlusCircle,
  Users,
  LogOut,
  CheckCircle,
  Upload,
  FileCheck,
  HelpCircle,
  Shield,
  BookOpen,
  FileText,
  Mail,
  UserPlus,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import NotificationBell from "@/components/NotificationBell";
import { Footer } from "@/components/Footer";

interface AppLayoutProps {
  children: ReactNode;
}

const menuItems = (isAdmin: boolean, isAdminMed: boolean, agendPend: number, userPend: number) => ({
  principal: [
    { title: "Início", url: "/", icon: LayoutDashboard },
    { title: "Listagem de Agendamentos", url: "/dashboard", icon: Calendar },
    { title: "Sistema de Ocupação", url: "/calendario-completo", icon: Building2 },
  ],
  agendamentos: [
    { title: "Novo", url: "/novo-agendamento", icon: PlusCircle },
    { title: "Meus", url: "/meus-agendamentos", icon: Calendar },
  ],
  administracao: [
    {
      title: "Aprovações Médicas",
      url: "/aprovacoes-agendamentos",
      icon: CheckCircle,
      show: isAdmin || isAdminMed,
      badge: agendPend > 0 ? agendPend : undefined,
    },
    {
      title: "Aprovações Usuários",
      url: "/aprovacoes-usuarios",
      icon: Users,
      show: isAdmin || isAdminMed,
      badge: userPend > 0 ? userPend : undefined,
    },
    {
      title: "Criar Usuários Padrão",
      url: "/criar-usuarios-padrao",
      icon: UserPlus,
      show: isAdmin || isAdminMed,
    },
    {
      title: "Importar Agendamentos 2025",
      url: "/importar-agendamentos-2025",
      icon: Upload,
      show: isAdmin,
    },
    {
      title: "Importar Lote",
      url: "/importar-agendamentos-lote",
      icon: Upload,
      show: isAdmin,
    },
    {
      title: "Processar CSV",
      url: "/processar-csv-upload",
      icon: Upload,
      show: isAdmin,
    },
    {
      title: "Pacientes Pendentes",
      url: "/importar-pacientes-pendentes",
      icon: Upload,
      show: isAdminMed,
    },
    {
      title: "Atualizar IG",
      url: "/atualizar-ig",
      icon: Calendar,
      show: isAdmin,
    },
    {
      title: "Corrigir Paridade",
      url: "/corrigir-paridade",
      icon: FileCheck,
      show: isAdmin,
    },
    {
      title: "Gerenciar Usuários",
      url: "/gerenciar-usuarios",
      icon: Users,
      show: isAdmin,
    },
    {
      title: "Logs de Auditoria",
      url: "/logs-auditoria",
      icon: Shield,
      show: isAdmin,
    },
    {
      title: "Comparar Pacientes",
      url: "/comparar-pacientes",
      icon: FileCheck,
      show: isAdmin,
    },
  ].filter((item) => item.show !== false),
  suporte: [
    { title: "Protocolos", url: "/protocolos", icon: FileText },
    { title: "Guia do Sistema", url: "/guia", icon: BookOpen },
    { title: "FAQ", url: "/faq", icon: HelpCircle },
    { title: "Sobre", url: "/sobre", icon: BookOpen },
  ],
});

const MenuGroup = ({ title, items, groupKey, collapsed, onItemClick }: any) => {
  const [expanded, setExpanded] = useState(true);
  const toggle = () => setExpanded((e) => !e);

  return (
    <SidebarGroup className="mb-2">
      {!collapsed && (
        <button
          onClick={toggle}
          className="w-full flex justify-between items-center px-3 py-2 uppercase text-xs font-semibold text-sky-200/70 hover:text-white"
        >
          <span>{title}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "" : "-rotate-90"}`} />
        </button>
      )}

      {(collapsed || expanded) && (
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item: any) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink
                    to={item.url}
                    end
                    onClick={onItemClick}
                    className="group flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-white/10 hover:backdrop-blur-md transition text-sky-50/80 hover:text-white"
                    activeClassName="bg-orange-500/20 text-white shadow-inner border border-orange-300/40"
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && (
                      <>
                        <span className="text-sm">{item.title}</span>
                        {item.badge && (
                          <Badge className="ml-auto bg-red-500 text-white h-4 px-1.5 text-xs animate-pulse">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      )}
    </SidebarGroup>
  );
};

const MenuContent = ({ collapsed = false, onItemClick }: { collapsed?: boolean; onItemClick?: () => void }) => {
  const { isAdmin, isAdminMed } = useAuth();
  const { solicitacoesPendentes, agendamentosPendentes } = useData();

  const sections = useMemo(
    () => menuItems(isAdmin(), isAdminMed(), agendamentosPendentes, solicitacoesPendentes),
    [isAdmin(), isAdminMed(), agendamentosPendentes, solicitacoesPendentes],
  );

  return (
    <>
      <div className="p-4 sm:p-6 border-b border-sky-400/20 bg-gradient-to-br from-white/5 to-sky-400/10 backdrop-blur-xl">
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-blue-50 border border-sky-100 rounded-lg shadow-inner">
            <img src="/hapvida-logo.png" className="h-12 object-contain" alt="Logo" />
          </div>
          {!collapsed && (
            <span className="text-xs uppercase text-sky-100 bg-sky-500/20 px-3 py-1 rounded-full border border-sky-400/30">
              Gestação Segura
            </span>
          )}
        </div>
      </div>

      <div className="py-4 space-y-2">
        <MenuGroup
          title="Principal"
          items={sections.principal}
          groupKey="principal"
          collapsed={collapsed}
          onItemClick={onItemClick}
        />
        <MenuGroup
          title="Agendamentos"
          items={sections.agendamentos}
          groupKey="agendamentos"
          collapsed={collapsed}
          onItemClick={onItemClick}
        />
        <MenuGroup
          title="Administração"
          items={sections.administracao}
          groupKey="admin"
          collapsed={collapsed}
          onItemClick={onItemClick}
        />

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-xs px-3 text-sky-200/70">Suporte</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {sections.suporte.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      onClick={onItemClick}
                      className="group flex items-center gap-2 px-2 py-2 text-sky-50/80 hover:text-white hover:bg-white/10 rounded-lg transition"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a
                    href="mailto:T_TIAGO.OLIVEIRA@HAPVIDA.COM.BR"
                    className="flex items-center gap-2 px-2 py-2 text-sky-50/80 hover:text-white hover:bg-white/10 rounded-lg transition"
                  >
                    <Mail className="h-4 w-4" />
                    {!collapsed && <span>Contato</span>}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </div>
    </>
  );
};

const AppSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar className={`hidden lg:flex ${collapsed ? "w-16" : "w-64"} transition-all duration-300`} collapsible="icon">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-800 via-blue-900 to-slate-900" />
      <SidebarContent className="relative z-10 bg-opacity-80 backdrop-blur-xl shadow-2xl">
        <MenuContent collapsed={collapsed} />
      </SidebarContent>
    </Sidebar>
  );
};

export const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const { signOut, isAdmin, isAdminMed } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const main = document.querySelector("main");
    const onScroll = (e: any) => setIsScrolled(e.target.scrollTop > 10);
    main?.addEventListener("scroll", onScroll);
    return () => main?.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-sky-50/40">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header
            className={`sticky top-0 z-50 h-16 flex items-center justify-between px-4 lg:px-6 border-b transition-all ${isScrolled ? "bg-white/90 backdrop-blur-xl shadow-md" : "bg-white/70 backdrop-blur-md"}`}
          >
            <div className="flex items-center gap-3">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} modal>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-72 p-0 bg-gradient-to-br from-blue-800 via-blue-900 to-slate-900 z-[100]"
                >
                  <SheetHeader className="p-4 border-b border-sky-200/10">
                    <div className="flex justify-between items-center text-white">
                      <SheetTitle className="text-white">Menu</SheetTitle>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-white hover:bg-white/10"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-80px)]">
                    <MenuContent onItemClick={() => setMobileMenuOpen(false)} />
                  </ScrollArea>
                </SheetContent>
              </Sheet>

              <SidebarTrigger className="hidden lg:flex" />

              <div className="flex flex-col">
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-800 to-sky-800 bg-clip-text text-transparent">
                  PGS
                </h1>
                <p className="text-xs text-blue-600">Programa Gestação Segura</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {(isAdmin() || isAdminMed()) && <NotificationBell />}
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  await signOut();
                  navigate("/auth");
                }}
                className="hover:text-red-500"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4">{children}</main>

          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
};
