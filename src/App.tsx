import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
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
import CalendarioOcupacao from "./pages/CalendarioOcupacao";
import CalendarioCompleto from "./pages/CalendarioCompleto";
import CompararCSVs from "./pages/CompararCSVs";
import CompararPacientes from "./pages/CompararPacientes";
import AnalisarForm1 from "./pages/AnalisarForm1";
import ListaAgendamentos from "./pages/ListaAgendamentos";
import Onboarding from "./pages/Onboarding";
import CorrigirParidade from "./pages/CorrigirParidade";
import ImportarSQL from "./pages/ImportarSQL";
import ProcessarCSVUpload from "./pages/ProcessarCSVUpload";
import ProcessarFormsParto from "./pages/ProcessarFormsParto";
import RecalcularDatas2025 from "./pages/RecalcularDatas2025";
import FAQ from "./pages/FAQ";
import Sobre from "./pages/Sobre";
import LogsAuditoria from "./pages/LogsAuditoria";
import ImportarPacientesPendentes from "./pages/ImportarPacientesPendentes";
import Protocolos from "./pages/Protocolos";
import Contato from "./pages/Contato";
import AgendamentosRejeitados from "./pages/AgendamentosRejeitados";
import ImportarAgendamentosHTML from "./pages/ImportarAgendamentosHTML";
import ImportarPacientes from "./pages/ImportarPacientes";
import ImportarPorTabela from "./pages/ImportarPorTabela";
import AuditoriaImportacoes from "./pages/AuditoriaImportacoes";
import AuditoriaAgendamentos from "./pages/admin/AuditoriaAgendamentos";
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
          <DataProvider>
            <Routes>
            <Route path="/auth" element={<AuthRedirect />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/termos" element={<TermosDeUso />} />
            <Route path="/privacidade" element={<PoliticaPrivacidade />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route 
              path="/criar-usuarios-padrao" 
              element={
                <ProtectedRoute requireAdminMed>
                  <AppLayout>
                    <CriarUsuariosPadrao />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
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
              path="/agendamentos-rejeitados" 
              element={
                <ProtectedRoute requireAdminMed>
                  <AppLayout>
                    <AgendamentosRejeitados />
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
                <ProtectedRoute requireAdminMed>
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
              path="/comparar-pacientes" 
              element={
                <ProtectedRoute requireAdmin>
                  <AppLayout>
                    <CompararPacientes />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/analisar-form1" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <AnalisarForm1 />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lista-agendamentos" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ListaAgendamentos />
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
              path="/importar-pacientes-pendentes" 
              element={
                <ProtectedRoute requireAdminMed>
                  <AppLayout>
                    <ImportarPacientesPendentes />
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
              path="/sobre" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Sobre />
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
            <Route 
              path="/auditoria-importacoes" 
              element={
                <ProtectedRoute requireAdminMed>
                  <AppLayout>
                    <AuditoriaImportacoes />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/auditoria-agendamentos" 
              element={
                <ProtectedRoute requireAdminMed>
                  <AppLayout>
                    <AuditoriaAgendamentos />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/protocolos" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Protocolos />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/contato" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Contato />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/importar-agendamentos-html" 
              element={
                <ProtectedRoute requireAdminMed>
                  <AppLayout>
                    <ImportarAgendamentosHTML />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/importar-pacientes" 
              element={
                <ProtectedRoute requireAdminMed>
                  <AppLayout>
                    <ImportarPacientes />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/importar-tabela" 
              element={
                <ProtectedRoute requireAdminMed>
                  <AppLayout>
                    <ImportarPorTabela />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </DataProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
