import type { UserProfile, CreateProfileInput } from "../types/profile";
import type { AuthUser, AuthResponse } from "../types/auth";

const API_BASE_URL = "http://localhost:5000/api";

// Local storage keys
const TOKEN_KEY = "career_analyzer_token";
const USER_KEY = "career_analyzer_user";

// Auth Storage Helpers
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function setStoredAuth(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Check backend server health
export async function checkBackendHealth(): Promise<{ isOnline: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return { isOnline: true, message: data.message || "Backend is online" };
  } catch (error) {
    return {
      isOnline: false,
      message: error instanceof Error ? error.message : "Unable to reach backend",
    };
  }
}

// Register User
export async function registerUser(name: string, email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || "Failed to register account");
  }

  setStoredAuth(data.token, data.user);
  return data;
}

// Login User
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || "Invalid credentials");
  }

  setStoredAuth(data.token, data.user);
  return data;
}

// Fetch Logged-in User's Profile
export async function fetchMyProfile(token: string): Promise<UserProfile | null> {
  const response = await fetch(`${API_BASE_URL}/profiles/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to load profile");
  }

  const result = await response.json();
  return result.data || null;
}

// Save or Update Logged-in User's Profile
export async function saveMyProfile(token: string, profileData: Partial<CreateProfileInput>): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/profiles/me`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profileData),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || result.error || "Failed to update profile");
  }

  return result.data;
}

// Fetch all profiles (legacy / admin view)
export async function fetchProfiles(): Promise<UserProfile[]> {
  const response = await fetch(`${API_BASE_URL}/profiles`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch profiles (${response.status})`);
  }
  const result = await response.json();
  return result.data || [];
}
