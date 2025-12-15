// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role?: UserRole;
  membershipType?: 'basic' | 'premium' | 'vip';
  membershipExpiry?: string;
  createdAt: string;
  updatedAt: string;
}

// Auth types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  exp: number;
  iat: number;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Booking types
export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  capacity: number;
  available: number;
  trainer?: Trainer;
}

export interface Booking {
  id: string;
  userId: string;
  timeSlotId: string;
  scheduleId?: string;
  date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'waitlisted';
  createdAt: string;
  updatedAt: string;
  timeSlot?: TimeSlot;
  schedule?: Schedule;
}

export interface Trainer {
  id: string;
  name: string;
  specialization: string;
  avatar?: string;
  bio?: string;
  rating?: number;
}

// Form validation schemas (Zod compatible)
export type FormErrors<T> = Partial<Record<keyof T, string>>;

// Class types
export interface GymClass {
  id: string;
  name: string;
  description: string;
  category: ClassCategory;
  image: string;
  trainer: Trainer;
  duration: number; // in minutes
  capacity: number;
  enrolled: number;
  popularity: number;
  schedule: ClassSchedule[];
  createdAt: string;
  updatedAt: string;
}

export interface ClassSchedule {
  id: string;
  dayOfWeek: number; // 0-6, Sunday=0
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

export type ClassCategory =
  | 'yoga'
  | 'cardio'
  | 'strength'
  | 'flexibility'
  | 'sports'
  | 'martial-arts'
  | 'dance';

export type ClassSortOption = 'name' | 'popularity' | 'duration';

export interface ClassFilters {
  search?: string;
  category?: ClassCategory;
  sortBy?: ClassSortOption;
}

// Schedule types
export interface Schedule {
  id: string;
  class: GymClass;
  date: string; // ISO date string
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  capacity: number;
  enrolled: number;
  trainer: Trainer;
  status: ScheduleStatus;
  createdAt: string;
  updatedAt: string;
}

export type ScheduleStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface BookingConflict {
  hasConflict: boolean;
  conflictingBooking?: Booking;
  message?: string;
}

export interface ScheduleFilters {
  dateFrom?: string;
  dateTo?: string;
  classId?: string;
  trainerId?: string;
}

// Dashboard and Profile types
export interface UserStats {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  attendanceRate: number; // percentage
  upcomingBookings: number;
}

export interface BookingWithDetails extends Booking {
  schedule: Schedule;
  class: GymClass;
}

export type BookingTab = 'upcoming' | 'completed' | 'cancelled';

// Admin types
export type UserRole = 'user' | 'trainer' | 'admin';

export interface AdminStats {
  revenue: {
    total: number;
    change: number;
    history: { date: string; value: number }[];
  };
  bookings: {
    total: number;
    change: number;
    history: { date: string; value: number }[];
  };
  activeUsers: {
    total: number;
    change: number;
    history: { date: string; value: number }[];
  };
  popularClasses: {
    name: string;
    bookings: number;
    revenue: number;
  }[];
}

export interface ClassInput {
  name: string;
  description: string;
  category: ClassCategory;
  image: string;
  duration: number;
  capacity: number;
  trainerId: string;
}

export interface ScheduleInput {
  classId: string;
  trainerId: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
}
