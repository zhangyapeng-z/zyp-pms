import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(path.join(__dirname, '../ipms.db'));

db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT,
  avatar_color TEXT
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,            -- 产品开发类 / 技术开发类 / 预研类
  manager_id INTEGER REFERENCES users(id),
  phase TEXT NOT NULL,               -- 概念 / 计划 / 开发 / 验证 / 发布 / 已结项
  status TEXT NOT NULL DEFAULT '进行中',
  health TEXT NOT NULL DEFAULT '正常', -- 正常 / 预警 / 风险
  start_date TEXT, end_date TEXT,
  progress INTEGER DEFAULT 0,
  budget_total REAL DEFAULT 0,
  budget_used REAL DEFAULT 0,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wbs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  parent_id INTEGER,
  name TEXT NOT NULL,
  owner TEXT,
  duration INTEGER,
  start_date TEXT, end_date TEXT,
  progress INTEGER DEFAULT 0,
  is_phase INTEGER DEFAULT 0,
  sort INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                -- TR1 概念评审 / DCP1 决策评审 ...
  type TEXT NOT NULL,                -- TR / DCP
  date TEXT,
  status TEXT DEFAULT '未开始'       -- 已通过 / 待评审 / 未开始
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT DEFAULT '任务',          -- 任务 / 需求 / 缺陷
  priority TEXT DEFAULT '中',
  status TEXT DEFAULT 'todo',        -- todo / inprogress / review / done
  assignee_id INTEGER REFERENCES users(id),
  sprint TEXT,
  due_date TEXT,
  sub_done INTEGER DEFAULT 0,
  sub_total INTEGER DEFAULT 0,
  related_req TEXT
);

CREATE TABLE IF NOT EXISTS risks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  kind TEXT DEFAULT '风险',          -- 风险 / 问题
  title TEXT NOT NULL,
  level TEXT DEFAULT '中',
  status TEXT DEFAULT '待处理',      -- 待处理 / 处理中 / 已关闭
  owner TEXT,
  due_date TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS worklogs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  task_title TEXT,
  date TEXT,
  hours REAL
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'TR',
  date TEXT,
  status TEXT DEFAULT '未开始',      -- 已通过 / 待评审 / 未开始
  conclusion TEXT
);

CREATE TABLE IF NOT EXISTS budget_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL,            -- 人力 / 物料 / 外协 / 差旅 / 设备
  planned REAL DEFAULT 0,
  actual REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phase TEXT,
  type TEXT,                         -- 需求 / 设计 / 测试 / 评审 / 其他
  author TEXT,
  updated_at TEXT,
  status TEXT DEFAULT '已发布'       -- 草稿 / 评审中 / 已发布
);

CREATE TABLE IF NOT EXISTS team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  role TEXT,
  allocation INTEGER DEFAULT 100
);

CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  type TEXT DEFAULT '任务',          -- 任务 / 审批 / 会议
  title TEXT NOT NULL,
  project_name TEXT,
  priority TEXT DEFAULT '中',
  due_date TEXT,
  done INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS flow_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT,
  phases TEXT,                       -- JSON array
  description TEXT,
  projects_count INTEGER DEFAULT 0
);
`);

export default db;
