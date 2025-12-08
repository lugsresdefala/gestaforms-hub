import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAgendamentoSchema, insertCapacidadeSchema, insertUserSchema, insertUserRoleSchema, insertFaqItemSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/agendamentos", async (req, res) => {
    try {
      const { status, maternidade, startDate, endDate, search, id } = req.query;
      
      if (id) {
        const agendamento = await storage.getAgendamento(id as string);
        res.json(agendamento ? [agendamento] : []);
        return;
      }
      
      const agendamentos = await storage.getAgendamentos({
        status: status as string,
        maternidade: maternidade as string,
        startDate: startDate as string,
        endDate: endDate as string,
        search: search as string,
      });
      res.json(agendamentos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/agendamentos/:id", async (req, res) => {
    try {
      const agendamento = await storage.getAgendamento(req.params.id);
      if (!agendamento) {
        return res.status(404).json({ error: "Agendamento não encontrado" });
      }
      res.json(agendamento);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agendamentos", async (req, res) => {
    try {
      const data = insertAgendamentoSchema.parse(req.body);
      
      const existing = await storage.getAgendamentoByCarteirinha(data.carteirinha);
      if (existing) {
        return res.status(400).json({ error: "Paciente já possui agendamento" });
      }
      
      const agendamento = await storage.createAgendamento(data);
      res.status(201).json(agendamento);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/agendamentos/:id", async (req, res) => {
    try {
      const agendamento = await storage.updateAgendamento(req.params.id, req.body);
      if (!agendamento) {
        return res.status(404).json({ error: "Agendamento não encontrado" });
      }
      res.json(agendamento);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/agendamentos/:id", async (req, res) => {
    try {
      await storage.deleteAgendamento(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agendamentos/:id/aprovar", async (req, res) => {
    try {
      const { observacoes, userId } = req.body;
      const agendamento = await storage.updateAgendamento(req.params.id, {
        status: "aprovado",
        aprovadoPor: String(userId),
        aprovadoEm: new Date() as any,
        observacoesAprovacao: observacoes,
      });
      if (!agendamento) {
        return res.status(404).json({ error: "Agendamento não encontrado" });
      }
      res.json(agendamento);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agendamentos/:id/rejeitar", async (req, res) => {
    try {
      const { observacoes, userId } = req.body;
      const agendamento = await storage.updateAgendamento(req.params.id, {
        status: "rejeitado",
        aprovadoPor: String(userId),
        aprovadoEm: new Date() as any,
        observacoesAprovacao: observacoes,
      });
      if (!agendamento) {
        return res.status(404).json({ error: "Agendamento não encontrado" });
      }
      res.json(agendamento);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/agendamentos/data/:date", async (req, res) => {
    try {
      const { maternidade } = req.query;
      const agendamentos = await storage.getAgendamentosByDate(
        req.params.date,
        maternidade as string
      );
      res.json(agendamentos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/capacidades", async (req, res) => {
    try {
      const capacidades = await storage.getCapacidades();
      res.json(capacidades);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/capacidades/:maternidade", async (req, res) => {
    try {
      const capacidade = await storage.getCapacidade(req.params.maternidade);
      if (!capacidade) {
        return res.status(404).json({ error: "Capacidade não encontrada" });
      }
      res.json(capacidade);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/capacidades", async (req, res) => {
    try {
      const data = insertCapacidadeSchema.parse(req.body);
      const capacidade = await storage.createCapacidade(data);
      res.status(201).json(capacidade);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/capacidades/:id", async (req, res) => {
    try {
      const capacidade = await storage.updateCapacidade(req.params.id, req.body);
      if (!capacidade) {
        return res.status(404).json({ error: "Capacidade não encontrada" });
      }
      res.json(capacidade);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/notificacoes", async (req, res) => {
    try {
      const { user_id, lida } = req.query;
      const notificacoes = await storage.getNotificacoes(user_id ? Number(user_id) : undefined);
      res.json(notificacoes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/notificacoes/:id/read", async (req, res) => {
    try {
      const { userId } = req.body;
      const notificacao = await storage.markNotificacaoAsRead(req.params.id, userId);
      if (!notificacao) {
        return res.status(404).json({ error: "Notificação não encontrada" });
      }
      res.json(notificacao);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/faq", async (req, res) => {
    try {
      const { categoria } = req.query;
      const items = await storage.getFaqItems(categoria as string);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/faq", async (req, res) => {
    try {
      const data = insertFaqItemSchema.parse(req.body);
      const item = await storage.createFaqItem(data);
      res.status(201).json(item);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/faq/:id", async (req, res) => {
    try {
      const item = await storage.updateFaqItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: "FAQ não encontrado" });
      }
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/faq/:id", async (req, res) => {
    try {
      await storage.deleteFaqItem(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/audit-logs", async (req, res) => {
    try {
      const { userId, tableName, action } = req.query;
      const logs = await storage.getAuditLogs({
        userId: userId ? Number(userId) : undefined,
        tableName: tableName as string,
        action: action as string,
      });
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, nomeCompleto } = req.body;
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email já cadastrado" });
      }
      
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ error: "Nome de usuário já existe" });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        nomeCompleto,
      } as any);
      
      await storage.addUserRole({
        userId: user.id,
        role: "medico_unidade",
        maternidade: null,
      } as any);
      
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }
      
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }
      
      const roles = await storage.getUserRoles(user.id);
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, roles });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/users/:id/roles", async (req, res) => {
    try {
      const roles = await storage.getUserRoles(Number(req.params.id));
      res.json(roles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users/:id/roles", async (req, res) => {
    try {
      const { role, maternidade } = req.body;
      const userRole = await storage.addUserRole({
        userId: Number(req.params.id),
        role,
        maternidade,
      } as any);
      res.status(201).json(userRole);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/users/:id/roles/:role", async (req, res) => {
    try {
      await storage.removeUserRole(Number(req.params.id), req.params.role);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/user-roles", async (req, res) => {
    try {
      const { user_id } = req.query;
      if (user_id) {
        const roles = await storage.getUserRoles(Number(user_id));
        res.json(roles);
      } else {
        const roles = await storage.getAllUserRoles();
        res.json(roles);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/user-roles", async (req, res) => {
    try {
      const role = await storage.addUserRole(req.body);
      res.status(201).json(role);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/user-roles/:id", async (req, res) => {
    try {
      const role = await storage.updateUserRole(Number(req.params.id), req.body);
      res.json(role);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/user-roles/:id", async (req, res) => {
    try {
      await storage.deleteUserRole(Number(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/solicitacoes-acesso", async (req, res) => {
    try {
      const solicitacoes = await storage.getSolicitacoesAcesso();
      res.json(solicitacoes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/solicitacoes-acesso", async (req, res) => {
    try {
      const solicitacao = await storage.createSolicitacaoAcesso(req.body);
      res.status(201).json(solicitacao);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/solicitacoes-acesso/:id", async (req, res) => {
    try {
      const solicitacao = await storage.updateSolicitacaoAcesso(Number(req.params.id), req.body);
      res.json(solicitacao);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/profiles", async (req, res) => {
    try {
      const profiles = await storage.getProfiles();
      res.json(profiles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/profiles/:id", async (req, res) => {
    try {
      const profile = await storage.getProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/profiles/:id", async (req, res) => {
    try {
      const profile = await storage.updateProfile(req.params.id, req.body);
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/agendamentos-historico", async (req, res) => {
    try {
      const historico = await storage.getAgendamentosHistorico();
      res.json(historico);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/notificacoes", async (req, res) => {
    try {
      const notificacao = await storage.createNotificacao(req.body);
      res.status(201).json(notificacao);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/notificacoes/:id", async (req, res) => {
    try {
      const notificacao = await storage.updateNotificacao(Number(req.params.id), req.body);
      res.json(notificacao);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
