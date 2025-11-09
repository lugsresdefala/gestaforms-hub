import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Calendar,
  LayoutDashboard,
  PlusCircle,
  CheckCircle,
  Users,
  Building2,
  LogOut,
  Upload,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { NavLink } from "@/components/NavLink";
import NotificationBell from "@/components/NotificationBell";

interface AppLayoutProps {
  children: ReactNode;
}

const AppSidebar = () => {
  const { state } = useSidebar();
  const { isAdmin, isMedicoUnidade } = useAuth();
  const collapsed = state === "collapsed";

  const menuItems = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, show: true },
    { title: "Listagem", url: "/dashboard", icon: Calendar, show: true },
    {
      title: "Guia do Sistema",
      url: "/guia",
      icon: BookOpen,
      show: true,
    },
    {
      title: "Novo Agendamento",
      url: "/novo-agendamento",
      icon: PlusCircle,
      show: isMedicoUnidade() || isAdmin(),
    },
    {
      title: "Meus Agendamentos",
      url: "/meus-agendamentos",
      icon: Calendar,
      show: isMedicoUnidade(),
    },
    {
      title: "Aprovações",
      url: "/aprovacoes",
      icon: CheckCircle,
      show: isAdmin(),
    },
    {
      title: "Ocupação",
      url: "/ocupacao",
      icon: Building2,
      show: isAdmin(),
    },
    {
      title: "Calendário",
      url: "/calendario-ocupacao",
      icon: Calendar,
      show: true,
    },
    {
      title: "Usuários",
      url: "/gerenciar-usuarios",
      icon: Users,
      show: isAdmin(),
    },
    {
      title: "Importar Calendário",
      url: "/importar-calendario",
      icon: Upload,
      show: isAdmin(),
    },
  ].filter((item) => item.show);

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b border-border">
          {!collapsed && (
            <div className="flex flex-col gap-1">
              <img
                src="/hapvida-logo.png"
                alt="Hapvida"
                className="h-10 object-contain"
              />
              <span className="text-xs text-muted-foreground font-medium">
                Gestação Segura
              </span>
            </div>
          )}
          {collapsed && (
            <img
              src="/hapvida-logo.png"
              alt="Hapvida"
              className="h-8 object-contain"
            />
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-muted/50"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const { signOut, isAdmin } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />

        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm px-4 sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-8 w-8" />
              <h1 className="font-semibold text-foreground hidden sm:block">
                PGS - Programa Gestação Segura
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin() && <NotificationBell />}
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="icon"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};
