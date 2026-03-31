export type EventCategory =
  | "meeting" | "deadline" | "reminder" | "launch"
  | "client" | "personal" | "milestone";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end?: string;
  all_day: boolean;
  category: EventCategory;
  color?: string;
  tags: string[];
  created_by?: string;
  assigned_to?: string;
  idea_id?: string;
  doc_id?: string;
  recurrence: "none" | "daily" | "weekly" | "biweekly" | "monthly";
  recurrence_end?: string;
  parent_event_id?: string;
  completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export const CATEGORY_CONFIG: Record<EventCategory, { color: string; label: string }> = {
  meeting:   { color: "#2979ff", label: "Meeting"   },
  deadline:  { color: "#ff2052", label: "Deadline"  },
  reminder:  { color: "#ffb347", label: "Reminder"  },
  launch:    { color: "#22c55e", label: "Launch"    },
  client:    { color: "#ff6b9d", label: "Client"    },
  personal:  { color: "#8899aa", label: "Personal"  },
  milestone: { color: "#bf5fff", label: "Milestone" },
};
