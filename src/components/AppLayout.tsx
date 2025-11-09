import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, LayoutDashboard, PlusCircle, CheckCircle, Users, Building2, LogOut, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import NotificationBell from "@/components/NotificationBell";
import { Footer } from "@/components/Footer";
interface AppLayoutProps {
  children: ReactNode;
}
const AppSidebar = () => {
  const { state } = useSidebar();
  const { isAdmin, isMedicoUnidade } = useAuth();
  const collapsed = state === "collapsed";

  const principalItems = [
    { title: "Início", url: "/", icon: LayoutDashboard, show: true },
    { title: "Listagem", url: "/dashboard", icon: Calendar, show: true },
    { title: "Calendário", url: "/calendario-ocupacao", icon: Calendar, show: true },
  ].filter(item => item.show);

  const agendamentoItems = [
    { title: "Novo", url: "/novo-agendamento", icon: PlusCircle, show: isMedicoUnidade() || isAdmin() },
    { title: "Meus", url: "/meus-agendamentos", icon: Calendar, show: isMedicoUnidade() },
  ].filter(item => item.show);

  const adminItems = [
    { title: "Aprovações", url: "/aprovacoes", icon: CheckCircle, show: isAdmin() },
    { title: "Ocupação", url: "/ocupacao", icon: Building2, show: isAdmin() },
    { title: "Atualizar IG", url: "/atualizar-ig", icon: Calendar, show: isAdmin() },
    { title: "Usuários", url: "/gerenciar-usuarios", icon: Users, show: isAdmin() },
  ].filter(item => item.show);

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b border-border/50">
          {!collapsed && (
            <div className="flex flex-col gap-1">
              <img src="/hapvida-logo.png" alt="Hapvida" className="h-24 object-contain" />
              <span className="text-xs text-muted-foreground/80 font-medium tracking-wide">
                Gestação Segura
              </span>
            </div>
          )}
          {collapsed && <img src="/hapvida-logo.png" alt="Hapvida" className="h-8 object-contain" />}
        </div>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-xs font-semibold tracking-wider uppercase opacity-60">Principal</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {principalItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className="transition-all hover:bg-accent/20 rounded-lg" 
                      activeClassName="glass-card text-primary font-semibold shadow-sm"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {agendamentoItems.length > 0 && (
          <SidebarGroup>
            {!collapsed && <SidebarGroupLabel className="text-xs font-semibold tracking-wider uppercase opacity-60">Agendamentos</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {agendamentoItems.map(item => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end 
                        className="transition-all hover:bg-accent/20 rounded-lg" 
                        activeClassName="glass-card text-primary font-semibold shadow-sm"
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span className="text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {adminItems.length > 0 && (
          <SidebarGroup>
            {!collapsed && <SidebarGroupLabel className="text-xs font-semibold tracking-wider uppercase opacity-60">Administração</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map(item => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end 
                        className="transition-all hover:bg-accent/20 rounded-lg" 
                        activeClassName="glass-card text-primary font-semibold shadow-sm"
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span className="text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-xs font-semibold tracking-wider uppercase opacity-60">Ajuda</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/guia" 
                    end 
                    className="transition-all hover:bg-accent/20 rounded-lg" 
                    activeClassName="glass-card text-primary font-semibold shadow-sm"
                  >
                    <BookOpen className="h-4 w-4" />
                    {!collapsed && <span className="text-sm">Guia</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
export const AppLayout = ({
  children
}: AppLayoutProps) => {
  const navigate = useNavigate();
  const {
    signOut,
    isAdmin
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
              <h1 className="font-bold text-lg text-foreground tracking-tight hidden sm:block">
                PGS - Programa Gestação Segura
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin() && <NotificationBell />}
              <Button 
                onClick={handleLogout} 
                variant="ghost" 
                size="icon" 
                className="hover:bg-destructive/10 hover:text-destructive transition-all rounded-lg"
                title="Sair"
              >
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