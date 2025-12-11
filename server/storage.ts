import { db } from "./db";
import { eq, and, or, ilike, desc, gte, lte, sql, ne } from "drizzle-orm";
import {
  users, userRoles, profiles, agendamentosObst, agendamentosHistorico,
  capacidadeMaternidades, notificacoes, faqItems, formsConfig,
  solicitacoesAcesso, auditLogs, webhookLogs, agendamentosPendentes,
  InsertUser, User, InsertAgendamento, Agendamento,
  InsertCapacidade, Capacidade, InsertNotificacao, Notificacao,
  InsertFaqItem, FaqItem, InsertUserRole, UserRole, InsertAuditLog,
  InsertAgendamentoPendente, AgendamentoPendente
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  
  getUserRoles(userId: number): Promise<UserRole[]>;
  addUserRole(role: InsertUserRole): Promise<UserRole>;
  removeUserRole(userId: number, role: string): Promise<void>;
  
  getAgendamentos(filters?: AgendamentoFilters): Promise<Agendamento[]>;
  getAgendamento(id: string): Promise<Agendamento | undefined>;
  getAgendamentoByCarteirinha(carteirinha: string): Promise<Agendamento | undefined>;
  createAgendamento(agendamento: InsertAgendamento): Promise<Agendamento>;
  updateAgendamento(id: string, data: Partial<Agendamento>): Promise<Agendamento | undefined>;
  deleteAgendamento(id: string): Promise<void>;
  getAgendamentosByDate(date: string, maternidade?: string): Promise<Agendamento[]>;
  
  getCapacidades(): Promise<Capacidade[]>;
  getCapacidade(maternidade: string): Promise<Capacidade | undefined>;
  createCapacidade(capacidade: InsertCapacidade): Promise<Capacidade>;
  updateCapacidade(id: string, data: Partial<Capacidade>): Promise<Capacidade | undefined>;
  
  getNotificacoes(userId?: number): Promise<Notificacao[]>;
  createNotificacao(notificacao: InsertNotificacao): Promise<Notificacao>;
  markNotificacaoAsRead(id: string, userId: number): Promise<Notificacao | undefined>;
  
  getFaqItems(categoria?: string): Promise<FaqItem[]>;
  createFaqItem(item: InsertFaqItem): Promise<FaqItem>;
  updateFaqItem(id: string, data: Partial<FaqItem>): Promise<FaqItem | undefined>;
  deleteFaqItem(id: string): Promise<void>;
  
  createAuditLog(log: InsertAuditLog): Promise<void>;
  getAuditLogs(filters?: AuditLogFilters): Promise<typeof auditLogs.$inferSelect[]>;
  
  getAgendamentosPendentes(filters?: AgendamentoPendenteFilters): Promise<AgendamentoPendente[]>;
  getAgendamentoPendente(id: string): Promise<AgendamentoPendente | undefined>;
  createAgendamentoPendente(data: InsertAgendamentoPendente): Promise<AgendamentoPendente>;
  updateAgendamentoPendente(id: string, data: Partial<AgendamentoPendente>): Promise<AgendamentoPendente | undefined>;
}

export interface AgendamentoFilters {
  status?: string;
  maternidade?: string;
  startDate?: string;
  endDate?: string;
  createdBy?: number;
  search?: string;
}

export interface AuditLogFilters {
  userId?: number;
  tableName?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}

export interface AgendamentoPendenteFilters {
  status?: string;
  maternidade?: string;
  startDate?: string;
  endDate?: string;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async getUserRoles(userId: number): Promise<UserRole[]> {
    return db.select().from(userRoles).where(eq(userRoles.userId, userId));
  }

  async addUserRole(role: InsertUserRole): Promise<UserRole> {
    const [newRole] = await db.insert(userRoles).values(role).returning();
    return newRole;
  }

  async removeUserRole(userId: number, role: string): Promise<void> {
    await db.delete(userRoles).where(
      and(eq(userRoles.userId, userId), eq(userRoles.role, role as any))
    );
  }

  async getAgendamentos(filters?: AgendamentoFilters): Promise<Agendamento[]> {
    let query = db.select().from(agendamentosObst);
    const conditions: any[] = [];

    if (filters?.status) {
      conditions.push(eq(agendamentosObst.status, filters.status));
    }
    if (filters?.maternidade) {
      conditions.push(ilike(agendamentosObst.maternidade, filters.maternidade));
    }
    if (filters?.startDate) {
      conditions.push(gte(agendamentosObst.dataAgendamentoCalculada, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(agendamentosObst.dataAgendamentoCalculada, filters.endDate));
    }
    if (filters?.createdBy) {
      conditions.push(eq(agendamentosObst.createdBy, filters.createdBy));
    }
    if (filters?.search) {
      conditions.push(
        or(
          ilike(agendamentosObst.nomeCompleto, `%${filters.search}%`),
          ilike(agendamentosObst.carteirinha, `%${filters.search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      return db.select().from(agendamentosObst).where(and(...conditions)).orderBy(desc(agendamentosObst.createdAt));
    }
    return db.select().from(agendamentosObst).orderBy(desc(agendamentosObst.createdAt));
  }

  async getAgendamento(id: string): Promise<Agendamento | undefined> {
    const [agendamento] = await db.select().from(agendamentosObst).where(eq(agendamentosObst.id, id));
    return agendamento;
  }

  async getAgendamentoByCarteirinha(carteirinha: string): Promise<Agendamento | undefined> {
    const [agendamento] = await db.select().from(agendamentosObst).where(eq(agendamentosObst.carteirinha, carteirinha));
    return agendamento;
  }

  async createAgendamento(agendamento: InsertAgendamento): Promise<Agendamento> {
    const [newAgendamento] = await db.insert(agendamentosObst).values(agendamento).returning();
    return newAgendamento;
  }

  async updateAgendamento(id: string, data: Partial<Agendamento>): Promise<Agendamento | undefined> {
    const [updated] = await db
      .update(agendamentosObst)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(agendamentosObst.id, id))
      .returning();
    return updated;
  }

  async deleteAgendamento(id: string): Promise<void> {
    await db.delete(agendamentosObst).where(eq(agendamentosObst.id, id));
  }

  async getAgendamentosByDate(date: string, maternidade?: string): Promise<Agendamento[]> {
    const conditions = [
      eq(agendamentosObst.dataAgendamentoCalculada, date),
      ne(agendamentosObst.status, "rejeitado")
    ];
    if (maternidade) {
      conditions.push(ilike(agendamentosObst.maternidade, maternidade));
    }
    return db.select().from(agendamentosObst).where(and(...conditions));
  }

  async getCapacidades(): Promise<Capacidade[]> {
    return db.select().from(capacidadeMaternidades);
  }

  async getCapacidade(maternidade: string): Promise<Capacidade | undefined> {
    const [cap] = await db.select().from(capacidadeMaternidades)
      .where(ilike(capacidadeMaternidades.maternidade, maternidade));
    return cap;
  }

  async createCapacidade(capacidade: InsertCapacidade): Promise<Capacidade> {
    const [newCap] = await db.insert(capacidadeMaternidades).values(capacidade).returning();
    return newCap;
  }

  async updateCapacidade(id: string, data: Partial<Capacidade>): Promise<Capacidade | undefined> {
    const [updated] = await db
      .update(capacidadeMaternidades)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(capacidadeMaternidades.id, id))
      .returning();
    return updated;
  }

  async getNotificacoes(userId?: number): Promise<Notificacao[]> {
    return db.select().from(notificacoes).where(eq(notificacoes.lida, false)).orderBy(desc(notificacoes.createdAt));
  }

  async createNotificacao(notificacao: InsertNotificacao): Promise<Notificacao> {
    const [newNotif] = await db.insert(notificacoes).values(notificacao).returning();
    return newNotif;
  }

  async markNotificacaoAsRead(id: string, userId: number): Promise<Notificacao | undefined> {
    const [updated] = await db
      .update(notificacoes)
      .set({ lida: true, lidaEm: new Date(), lidaPor: String(userId) })
      .where(eq(notificacoes.id, id))
      .returning();
    return updated;
  }

  async getFaqItems(categoria?: string): Promise<FaqItem[]> {
    if (categoria) {
      return db.select().from(faqItems)
        .where(and(eq(faqItems.categoria, categoria), eq(faqItems.ativo, true)))
        .orderBy(faqItems.ordem);
    }
    return db.select().from(faqItems).where(eq(faqItems.ativo, true)).orderBy(faqItems.ordem);
  }

  async createFaqItem(item: InsertFaqItem): Promise<FaqItem> {
    const [newItem] = await db.insert(faqItems).values(item).returning();
    return newItem;
  }

  async updateFaqItem(id: string, data: Partial<FaqItem>): Promise<FaqItem | undefined> {
    const [updated] = await db
      .update(faqItems)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(faqItems.id, id))
      .returning();
    return updated;
  }

  async deleteFaqItem(id: string): Promise<void> {
    await db.delete(faqItems).where(eq(faqItems.id, id));
  }

  async createAuditLog(log: InsertAuditLog): Promise<void> {
    await db.insert(auditLogs).values(log);
  }

  async getAuditLogs(filters?: AuditLogFilters): Promise<typeof auditLogs.$inferSelect[]> {
    const conditions: any[] = [];
    
    if (filters?.userId) conditions.push(eq(auditLogs.userId, filters.userId));
    if (filters?.tableName) conditions.push(eq(auditLogs.tableName, filters.tableName));
    if (filters?.action) conditions.push(eq(auditLogs.action, filters.action));

    if (conditions.length > 0) {
      return db.select().from(auditLogs).where(and(...conditions)).orderBy(desc(auditLogs.createdAt));
    }
    return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
  }

  async getAllUserRoles(): Promise<UserRole[]> {
    return db.select().from(userRoles);
  }

  async updateUserRole(id: string, data: Partial<UserRole>): Promise<UserRole | undefined> {
    const [updated] = await db.update(userRoles).set(data as any).where(eq(userRoles.id, id)).returning();
    return updated;
  }

  async deleteUserRole(id: string): Promise<void> {
    await db.delete(userRoles).where(eq(userRoles.id, id));
  }

  async getSolicitacoesAcesso(): Promise<typeof solicitacoesAcesso.$inferSelect[]> {
    return db.select().from(solicitacoesAcesso).orderBy(desc(solicitacoesAcesso.createdAt));
  }

  async createSolicitacaoAcesso(data: any): Promise<typeof solicitacoesAcesso.$inferSelect> {
    const [newSol] = await db.insert(solicitacoesAcesso).values(data).returning();
    return newSol;
  }

  async updateSolicitacaoAcesso(id: string, data: any): Promise<typeof solicitacoesAcesso.$inferSelect | undefined> {
    const [updated] = await db.update(solicitacoesAcesso).set(data).where(eq(solicitacoesAcesso.id, id)).returning();
    return updated;
  }

  async getProfiles(): Promise<typeof profiles.$inferSelect[]> {
    return db.select().from(profiles);
  }

  async getProfile(id: string): Promise<typeof profiles.$inferSelect | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
    return profile;
  }

  async updateProfile(id: string, data: any): Promise<typeof profiles.$inferSelect | undefined> {
    const [updated] = await db.update(profiles).set(data).where(eq(profiles.id, id)).returning();
    return updated;
  }

  async getAgendamentosHistorico(): Promise<typeof agendamentosHistorico.$inferSelect[]> {
    return db.select().from(agendamentosHistorico).orderBy(desc(agendamentosHistorico.createdAt));
  }

  async updateNotificacao(id: number, data: any): Promise<Notificacao | undefined> {
    const [updated] = await db.update(notificacoes).set(data).where(eq(notificacoes.id, id as any)).returning();
    return updated;
  }

  async createWebhookLog(data: any): Promise<typeof webhookLogs.$inferSelect> {
    const [log] = await db.insert(webhookLogs).values(data).returning();
    return log;
  }

  async updateWebhookLog(id: string, data: any): Promise<typeof webhookLogs.$inferSelect | undefined> {
    const [updated] = await db.update(webhookLogs).set(data).where(eq(webhookLogs.id, id)).returning();
    return updated;
  }

  async getWebhookLogs(): Promise<typeof webhookLogs.$inferSelect[]> {
    return db.select().from(webhookLogs).orderBy(desc(webhookLogs.createdAt));
  }

  async getAgendamentosPendentes(filters?: AgendamentoPendenteFilters): Promise<AgendamentoPendente[]> {
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(agendamentosPendentes.status, filters.status));
    }
    if (filters?.maternidade) {
      conditions.push(eq(agendamentosPendentes.maternidade, filters.maternidade));
    }
    if (filters?.startDate) {
      conditions.push(gte(agendamentosPendentes.criadoEm, new Date(filters.startDate)));
    }
    if (filters?.endDate) {
      conditions.push(lte(agendamentosPendentes.criadoEm, new Date(filters.endDate)));
    }
    
    const query = db.select().from(agendamentosPendentes);
    
    if (conditions.length > 0) {
      return query.where(and(...conditions)).orderBy(desc(agendamentosPendentes.criadoEm));
    }
    
    return query.orderBy(desc(agendamentosPendentes.criadoEm));
  }

  async getAgendamentoPendente(id: string): Promise<AgendamentoPendente | undefined> {
    const [pendente] = await db.select().from(agendamentosPendentes).where(eq(agendamentosPendentes.id, id));
    return pendente;
  }

  async createAgendamentoPendente(data: InsertAgendamentoPendente): Promise<AgendamentoPendente> {
    const [pendente] = await db.insert(agendamentosPendentes).values(data).returning();
    return pendente;
  }

  async updateAgendamentoPendente(id: string, data: Partial<AgendamentoPendente>): Promise<AgendamentoPendente | undefined> {
    const [updated] = await db.update(agendamentosPendentes).set(data).where(eq(agendamentosPendentes.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
