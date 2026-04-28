// Navigation types
export type RootTabParamList = {
  Home: undefined;
  Chat: undefined;
  Schedule: undefined;
  Grades: undefined;
  Write: undefined;
};

// Data types
export interface Deadline {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  daysLeft: number;
  type: 'assignment' | 'exam' | 'project' | 'quiz';
  priority: 'high' | 'medium' | 'low';
}

export interface GradeEntry {
  id: string;
  course: string;
  courseCode: string;
  grade: string;
  percentage: number;
  credits: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

export interface ScheduleItem {
  id: string;
  title: string;
  course: string;
  location: string;
  startTime: string;
  endTime: string;
  type: 'class' | 'exam' | 'office-hours' | 'deadline';
  date: string;
  color: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  isRead: boolean;
  isSystemNotice?: boolean; // true = AI provider switch notice, styled differently
}

export interface StudyTip {
  id: string;
  title: string;
  body: string;
  icon: string;
  category: string;
}

export interface ProfileSetting {
  id: string;
  label: string;
  icon: string;
  value?: string;
  type: 'navigate' | 'toggle' | 'info';
}
