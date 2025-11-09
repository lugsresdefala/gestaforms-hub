import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import NovoAgendamento from "./pages/NovoAgendamento";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Aprovacoes from "./pages/Aprovacoes";
import MeusAgendamentos from "./pages/MeusAgendamentos";
import GerenciarUsuarios from "./pages/GerenciarUsuarios";
import CriarUsuariosPadrao from "./pages/CriarUsuariosPadrao";
import OcupacaoMaternidades from "./pages/OcupacaoMaternidades";
import ImportarPlanilha from "./pages/ImportarPlanilha";
import GuiaSistema from "./pages/GuiaSistema";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AuthRedirect = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return user ? <Navigate to="/" replace /> : <Auth />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthRedirect />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/criar-usuarios-padrao" element={<CriarUsuariosPadrao />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Index />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/novo-agendamento" 
              element={
                <ProtectedRoute requireMedicoUnidade>
                  <AppLayout>
                    <NovoAgendamento />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/aprovacoes" 
              element={
                <ProtectedRoute requireAdmin>
                  <AppLayout>
                    <Aprovacoes />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/meus-agendamentos" 
              element={
                <ProtectedRoute requireMedicoUnidade>
                  <AppLayout>
                    <MeusAgendamentos />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/gerenciar-usuarios" 
              element={
                <ProtectedRoute requireAdmin>
                  <AppLayout>
                    <GerenciarUsuarios />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ocupacao" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <OcupacaoMaternidades />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/importar-planilha" 
              element={
                <ProtectedRoute requireAdmin>
                  <AppLayout>
                    <ImportarPlanilha />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/guia" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <GuiaSistema />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
