export interface LoginRequest {
  email: string;
  password: string;
  ipAddress?: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  fullName: string;
  role?: 'OWNER' | 'MANAGER' | 'STAFF';
  ipAddress?: string;
}

export interface ResetPasswordRequest {
  userId: number;
  currentPassword: string;
  newPassword: string;
  ipAddress?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    role: 'OWNER' | 'MANAGER' | 'STAFF';
  };
}
