export interface TreeEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  mtime?: number;
  binary?: boolean;
  children?: TreeEntry[] | null;
}

export interface OpenFile {
  path: string;
  name: string;
  content: string;
  savedContent: string;
  dirty: boolean;
  mtime: number;
  loading: boolean;
  error?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignee?: string;
  due_date?: string;
  tags?: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TaskBoard {
  backlog: Task[];
  todo: Task[];
  in_progress: Task[];
  done: Task[];
}
