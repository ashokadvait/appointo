export interface DailyMetric {
  date: string;
  count: number;
}

export interface DayDistribution {
  dayName: string;
  count: number;
}

export interface TopEventType {
  id: string;
  name: string;
  bookingsCount: number;
  revenue: number;
}

export interface TeamWorkload {
  userId: string;
  name: string;
  avatar?: string;
  totalMeetings: number;
  completedMeetings: number;
}

export interface AnalyticsOverview {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowCount: number;
  rescheduledCount: number;
  completionRate: number; // percentage, e.g. 85.5
  cancellationRate: number;
  noShowRate: number;
  totalRevenue: number;
  recentTrends?: DailyMetric[];
  popularDays: DayDistribution[];
  topEventTypes: TopEventType[];
  teamWorkload?: TeamWorkload[];
}
