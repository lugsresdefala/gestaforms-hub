import { pgTable, text, serial, integer, boolean, timestamp, varchar, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const appRoleEnum = pgEnum("app_role", ["admin", "medico_unidade", "medico_maternidade", "admin_med"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  nomeCompleto: text("nome_completo").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userRoles = pgTable("user_roles", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: integer("user_id").notNull().references(() => users.id),
  role: appRoleEnum("role").notNull(),
  maternidade: text("maternidade"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const profiles = pgTable("profiles", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: integer("user_id").notNull().references(() => users.id),
  email: text("email").notNull(),
  nomeCompleto: text("nome_completo").notNull(),
  statusAprovacao: text("status_aprovacao").notNull().default("pendente"),
  tipoAcessoSolicitado: text("tipo_acesso_solicitado"),
  maternidadeSolicitada: text("maternidade_solicitada"),
  aprovadoPor: text("aprovado_por"),
  aprovadoEm: timestamp("aprovado_em"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const agendamentosObst = pgTable("agendamentos_obst", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  carteirinha: text("carteirinha").notNull(),
  nomeCompleto: text("nome_completo").notNull(),
  dataNascimento: text("data_nascimento").notNull(),
  telefones: text("telefones").notNull(),
  emailPaciente: text("email_paciente").notNull(),
  maternidade: text("maternidade").notNull(),
  centroClinico: text("centro_clinico").notNull(),
  medicoResponsavel: text("medico_responsavel").notNull(),
  numeroGestacoes: integer("numero_gestacoes").notNull(),
  numeroPartosNormais: integer("numero_partos_normais").notNull(),
  numeroPartosCesareas: integer("numero_partos_cesareas").notNull(),
  numeroAbortos: integer("numero_abortos").notNull(),
  procedimentos: text("procedimentos").array().notNull(),
  diagnosticosMaternos: text("diagnosticos_maternos"),
  diagnosticosFetais: text("diagnosticos_fetais"),
  diagnosticosFetaisOutros: text("diagnosticos_fetais_outros"),
  placentaPrevia: text("placenta_previa"),
  indicacaoProcedimento: text("indicacao_procedimento").notNull(),
  medicacao: text("medicacao"),
  dumStatus: text("dum_status").notNull(),
  dataDum: text("data_dum"),
  dataPrimeiroUsg: text("data_primeiro_usg").notNull(),
  semanasUsg: integer("semanas_usg").notNull(),
  diasUsg: integer("dias_usg").notNull(),
  usgRecente: text("usg_recente").notNull(),
  igPretendida: text("ig_pretendida").notNull(),
  historiaObstetrica: text("historia_obstetrica"),
  necessidadeUtiMaterna: text("necessidade_uti_materna"),
  necessidadeReservaSangue: text("necessidade_reserva_sangue"),
  status: text("status").notNull().default("pendente"),
  createdBy: integer("created_by").references(() => users.id),
  dataAgendamentoCalculada: text("data_agendamento_calculada"),
  idadeGestacionalCalculada: text("idade_gestacional_calculada"),
  observacoesAgendamento: text("observacoes_agendamento"),
  observacoesAprovacao: text("observacoes_aprovacao"),
  aprovadoPor: text("aprovado_por"),
  aprovadoEm: timestamp("aprovado_em"),
  dppCalculado: text("dpp_calculado"),
  metodoCalculo: text("metodo_calculo"),
  categoriaDiagnostico: text("categoria_diagnostico"),
  diagnosticoEncontrado: text("diagnostico_encontrado"),
  diasAdiados: integer("dias_adiados"),
  excelRowId: text("excel_row_id"),
  formsRowId: text("forms_row_id"),
  sourceType: text("source_type"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const agendamentosHistorico = pgTable("agendamentos_historico", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  agendamentoId: varchar("agendamento_id", { length: 36 }).notNull().references(() => agendamentosObst.id),
  userId: integer("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  campoAlterado: text("campo_alterado"),
  valorAnterior: text("valor_anterior"),
  valorNovo: text("valor_novo"),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const capacidadeMaternidades = pgTable("capacidade_maternidades", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  maternidade: text("maternidade").notNull().unique(),
  vagasDiaUtil: integer("vagas_dia_util").notNull().default(3),
  vagasSabado: integer("vagas_sabado").notNull().default(2),
  vagasDomingo: integer("vagas_domingo").notNull().default(1),
  vagasDiaMax: integer("vagas_dia_max").notNull().default(5),
  vagasSemanaMax: integer("vagas_semana_max").notNull().default(20),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notificacoes = pgTable("notificacoes", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  agendamentoId: varchar("agendamento_id", { length: 36 }).notNull().references(() => agendamentosObst.id),
  tipo: text("tipo").notNull(),
  mensagem: text("mensagem").notNull(),
  lida: boolean("lida").default(false),
  lidaEm: timestamp("lida_em"),
  lidaPor: text("lida_por"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const faqItems = pgTable("faq_items", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  categoria: text("categoria").notNull(),
  pergunta: text("pergunta").notNull(),
  resposta: text("resposta").notNull(),
  ordem: integer("ordem").default(0),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const formsConfig = pgTable("forms_config", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  onedriveUrl: text("onedrive_url"),
  webhookSecret: text("webhook_secret"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const solicitacoesAcesso = pgTable("solicitacoes_acesso", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: integer("user_id").notNull().references(() => users.id),
  tipoAcesso: text("tipo_acesso").notNull(),
  maternidade: text("maternidade"),
  justificativa: text("justificativa"),
  status: text("status").notNull().default("pendente"),
  observacoesAprovacao: text("observacoes_aprovacao"),
  aprovadoPor: text("aprovado_por"),
  aprovadoEm: timestamp("aprovado_em"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: integer("user_id").notNull().references(() => users.id),
  tableName: text("table_name").notNull(),
  action: text("action").notNull(),
  recordId: text("record_id"),
  oldData: json("old_data"),
  newData: json("new_data"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const webhookLogs = pgTable("webhook_logs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  sourceType: text("source_type").notNull().default("unknown"),
  payload: json("payload").notNull(),
  status: text("status").notNull().default("pending"),
  response: json("response"),
  errorMessage: text("error_message"),
  excelRowId: text("excel_row_id"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users);
export const insertAgendamentoSchema = createInsertSchema(agendamentosObst);
export const insertCapacidadeSchema = createInsertSchema(capacidadeMaternidades);
export const insertNotificacaoSchema = createInsertSchema(notificacoes);
export const insertFaqItemSchema = createInsertSchema(faqItems);
export const insertUserRoleSchema = createInsertSchema(userRoles);
export const insertAuditLogSchema = createInsertSchema(auditLogs);

export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertAgendamento = typeof agendamentosObst.$inferInsert;
export type Agendamento = typeof agendamentosObst.$inferSelect;
export type InsertCapacidade = typeof capacidadeMaternidades.$inferInsert;
export type Capacidade = typeof capacidadeMaternidades.$inferSelect;
export type InsertNotificacao = typeof notificacoes.$inferInsert;
export type Notificacao = typeof notificacoes.$inferSelect;
export type InsertFaqItem = typeof faqItems.$inferInsert;
export type FaqItem = typeof faqItems.$inferSelect;
export type InsertUserRole = typeof userRoles.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type AgendamentoHistorico = typeof agendamentosHistorico.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type SolicitacaoAcesso = typeof solicitacoesAcesso.$inferSelect;
export type FormsConfig = typeof formsConfig.$inferSelect;
export type WebhookLog = typeof webhookLogs.$inferSelect;
