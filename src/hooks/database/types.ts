
// Shared types for the database hooks

export interface Trip {
  id: string;
  amount: number;
  payment_method:
    | 'cash'
    | 'card'
    | 'app'
    | 'מזומן'
    | 'ביט'
    | 'אשראי'
    | 'GetTaxi'
    | 'דהרי';
  timestamp: string;
  start_location_address?: string;
  start_location_city?: string;
  start_location_lat?: number;
  start_location_lng?: number;
  end_location_address?: string;
  end_location_city?: string;
  end_location_lat?: number;
  end_location_lng?: number;
  trip_status?: string;
  trip_start_time?: string;
  trip_end_time?: string;
}

export interface WorkDay {
  id: string;
  start_time: string;
  end_time?: string;
  total_income: number;
  total_trips: number;
  is_active: boolean;
}

export interface DailyGoals {
  income_goal: number;
  trips_goal: number;
  goal_type?: 'daily' | 'shift';
  weekly_income_goal?: number;
  monthly_income_goal?: number;
}

export interface DailyExpenses {
  maintenance: number;
  other: number;
  daily_fixed_price?: number;
}

export interface ShiftExpense {
  id: string;
  work_day_id: string;
  payment_method: string;
  amount: number;
  description?: string;
  created_at: string;
}
