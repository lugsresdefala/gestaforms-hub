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
import TermosDeUso from "./pages/TermosDeUso";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import AprovacoesAgendamentos from "./pages/AprovacoesAgendamentos";
import EditarAgendamento from "./pages/EditarAgendamento";
import AprovacoesUsuarios from "./pages/AprovacoesUsuarios";
import MeusAgendamentos from "./pages/MeusAgendamentos";
import GerenciarUsuarios from "./pages/GerenciarUsuarios";
import CriarUsuariosPadrao from "./pages/CriarUsuariosPadrao";
import OcupacaoMaternidades from "./pages/OcupacaoMaternidades";
import GuiaSistema from "./pages/GuiaSistema";
import ImportarCalendario from "./pages/ImportarCalendario";
import CalendarioOcupacao from "./pages/CalendarioOcupacao";
import CalendarioCompleto from "./pages/CalendarioCompleto";
import CompararCSVs from "./pages/CompararCSVs";
import Onboarding from "./pages/Onboarding";
import AtualizarIG from "./pages/AtualizarIG";
import CorrigirParidade from "./pages/CorrigirParidade";
import ImportarAgendamentos2025 from "./pages/ImportarAgendamentos2025";
import ProcessarAgendas2025 from "./pages/ProcessarAgendas2025";
import ProcessarImportacoes from "./pages/ProcessarImportacoes";
import ImportarAgendamentosLote from "./pages/ImportarAgendamentosLote";
import ImportarSQL from "./pages/ImportarSQL";
import ProcessarCSVUpload from "./pages/ProcessarCSVUpload";
import ProcessarFormsParto from "./pages/ProcessarFormsParto";
import RecalcularDatas2025 from "./pages/RecalcularDatas2025";
import FAQ from "./pages/FAQ";
import LogsAuditoria from "./pages/LogsAuditoria";
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
            <Route path="/termos" element={<TermosDeUso />} />
            <Route path="/privacidade" element={<PoliticaPrivacidade />} />
            <Route path="/criar-usuarios-padrao" element={<CriarUsuariosPadrao />} />
            <Route path="/onboarding" element={<Onboarding />} />
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
                <ProtectedRoute>
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
              path="/aprovacoes-agendamentos" 
              element={
                <ProtectedRoute requireAdminMed>
                  <AppLayout>
                    <AprovacoesAgendamentos />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/editar-agendamento/:id" 
              element={
                <ProtectedRoute requireAdminMed>
                  <AppLayout>
                    <EditarAgendamento />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/aprovacoes-usuarios"
              element={
                <ProtectedRoute requireAdmin>
                  <AppLayout>
                    <AprovacoesUsuarios />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/meus-agendamentos" 
              element={
                <ProtectedRoute>
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
              path="/guia" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <GuiaSistema />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/importar-calendario" 
              element={
                <ProtectedRoute requireAdmin>
                  <AppLayout>
                    <ImportarCalendario />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/calendario-ocupacao" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CalendarioOcupacao />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/calendario-completo" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CalendarioCompleto />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/comparar-csvs" 
              element={
                <ProtectedRoute requireAdmin>
                  <AppLayout>
                    <CompararCSVs />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/atualizar-ig" 
              element={
                <ProtectedRoute requireAdmin>
                  <AppLayout>
                    <AtualizarIG />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/corrigir-paridade" 
              element={
                <ProtectedRoute requireAdmin>
                  <AppLayout>
                    <CorrigirParidade />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/importar-agendamentos-2025" 
              element={
                <ProtectedRoute requireAdmin>
                  <AppLayout>
                    <ImportarAgendamentos2025 />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/processar-agendas-2025" 
              element={
                <ProtectedRoute requireAdmin>
                  <AppLayout>
                    <ProcessarAgendas2025 />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/importar-sql" 
              element={
                <ProtectedRoute requireAdmin>
                  <AppLayout>
                    <ImportarSQL />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route
              path="/processar-importacoes" 
              element={
                <ProtectedRoute requireAdmin>
                  <AppLayout>
                    <ProcessarImportacoes />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/importar-agendamentos-lote" 
              element={
                <ProtectedRoute requireAdmin>
                  <AppLayout>
                    <ImportarAgendamentosLote />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/processar-csv-upload" 
              element={
                <ProtectedRoute requireAdmin>
                  <AppLayout>
                    <ProcessarCSVUpload />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/processar-forms-parto" 
              element={
                <ProtectedRoute requireAdmin>
                  <AppLayout>
                    <ProcessarFormsParto />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/recalcular-datas-2025" 
              element={
                <ProtectedRoute requireAdmin>
                  <AppLayout>
                    <RecalcularDatas2025 />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/faq" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <FAQ />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/logs-auditoria" 
              element={
                <ProtectedRoute requireAdmin>
                  <AppLayout>
                    <LogsAuditoria />
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
