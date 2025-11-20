import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, LayoutDashboard, PlusCircle, CheckCircle, Users, Building2, LogOut, BookOpen, FileCheck, Upload, HelpCircle, Shield, FileText, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import NotificationBell from "@/components/NotificationBell";
import { Footer } from "@/components/Footer";
import { ProtocolosModal } from "@/components/ProtocolosModal";
interface AppLayoutProps {
  children: ReactNode;
}
const AppSidebar = () => {
  const {
    state
  } = useSidebar();
  const {
    isAdmin,
    isAdminMed,
    isMedicoUnidade
  } = useAuth();
  const collapsed = state === "collapsed";
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
    show: isAdminMed() || isAdmin()
  }, {
    title: "Aprovações Usuários",
    url: "/aprovacoes-usuarios",
    icon: Users,
    show: isAdmin() || isAdminMed()
  }, {
    title: "Importar Agendamentos 2025",
    url: "/importar-agendamentos-2025",
    icon: Upload,
    show: isAdmin()
  }, {
    title: "Importar Lote (Com Base Cálculo)",
    url: "/importar-agendamentos-lote",
    icon: Upload,
    show: isAdmin()
  }, {
    title: "Processar CSV Enviado",
    url: "/processar-csv-upload",
    icon: Upload,
    show: isAdmin()
  }, {
    title: "Importar Pacientes Pendentes",
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
  }].filter(item => item.show);
  return <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b border-border/50">
          {!collapsed && <div className="flex flex-col gap-1">
              <img src="/hapvida-logo.png" alt="Hapvida" className="h-24 object-contain" />
              <span className="text-xs text-muted-foreground/80 font-medium tracking-wide">
                Gestação Segura
              </span>
            </div>}
          {collapsed && <img src="/hapvida-logo.png" alt="Hapvida" className="h-8 object-contain" />}
        </div>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-xs font-semibold tracking-wider uppercase opacity-60">Principal</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {principalItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className="transition-all hover:bg-accent/20 rounded-lg" activeClassName="glass-card text-primary font-semibold shadow-sm">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {agendamentoItems.length > 0 && <SidebarGroup>
            {!collapsed && <SidebarGroupLabel className="text-xs font-semibold tracking-wider uppercase opacity-60">Agendamentos</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {agendamentoItems.map(item => <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} end className="transition-all hover:bg-accent/20 rounded-lg" activeClassName="glass-card text-primary font-semibold shadow-sm">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span className="text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>}

        {adminItems.length > 0 && <SidebarGroup>
            {!collapsed && <SidebarGroupLabel className="text-xs font-semibold tracking-wider uppercase opacity-60">Administração</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map(item => <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} end className="transition-all hover:bg-accent/20 rounded-lg" activeClassName="glass-card text-primary font-semibold shadow-sm">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span className="text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>}

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-xs font-semibold tracking-wider uppercase opacity-60">Ajuda</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/guia" end className="transition-all hover:bg-accent/20 rounded-lg" activeClassName="glass-card text-primary font-semibold shadow-sm">
                    <BookOpen className="h-4 w-4" />
                    {!collapsed && <span className="text-sm">Guia</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/faq" end className="transition-all hover:bg-accent/20 rounded-lg" activeClassName="glass-card text-primary font-semibold shadow-sm">
                    <HelpCircle className="h-4 w-4" />
                    {!collapsed && <span className="text-sm">FAQ</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <div className="px-2">
                  <ProtocolosModal trigger={
                    <Button variant="ghost" className="w-full justify-start gap-2 transition-all hover:bg-accent/20 rounded-lg">
                      <FileText className="h-4 w-4" />
                      {!collapsed && <span className="text-sm">Protocolos</span>}
                    </Button>
                  } />
                </div>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="mailto:T_TIAGO.OLIVEIRA@HAPVIDA.COM.BR" className="transition-all hover:bg-accent/20 rounded-lg">
                    <Mail className="h-4 w-4" />
                    {!collapsed && <span className="text-sm">Contato</span>}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/sobre" end className="transition-all hover:bg-accent/20 rounded-lg" activeClassName="glass-card text-primary font-semibold shadow-sm">
                    <BookOpen className="h-4 w-4" />
                    {!collapsed && <span className="text-sm">Sobre</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };
  return <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />

        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b border-border/50 glass-surface px-4 sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-8 w-8 hover:bg-accent/20 transition-all rounded-lg" />
              <h1 className="tracking-tight hidden sm:block font-medium text-blue-900 text-lg">
                PGS - Programa Gestação Segura
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {(isAdmin() || isAdminMed()) && <NotificationBell />}
              <Button onClick={handleLogout} variant="ghost" size="icon" className="hover:bg-destructive/10 hover:text-destructive transition-all rounded-lg" title="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto flex flex-col">
            <div className="flex-1">{children}</div>
            <Footer />
          </main>
        </div>
      </div>
    </SidebarProvider>;
};