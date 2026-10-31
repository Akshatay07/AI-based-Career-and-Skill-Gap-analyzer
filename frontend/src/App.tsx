import { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import LandingHero from "./components/LandingHero";
import AuthModal from "./components/AuthModal";
import DashboardHeader from "./components/dashboard/DashboardHeader";
import DashboardOverview from "./components/dashboard/DashboardOverview";
import EditProfileView from "./components/dashboard/EditProfileView";
import SkillGapTab from "./components/dashboard/SkillGapTab";
import {
  checkBackendHealth,
  getStoredToken,
  getStoredUser,
  clearStoredAuth,
  fetchMyProfile,
} from "./services/api";
import type { UserProfile } from "./types/profile";
import type { AuthUser } from "./types/auth";
import "./App.css";

function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getStoredUser());
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  // Active Tab state for Dashboard ('overview' | 'gap' | 'edit')
  const [activeTab, setActiveTab] = useState<"overview" | "gap" | "edit">("overview");

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  // Health check
  const loadHealth = useCallback(async () => {
    const health = await checkBackendHealth();
    setBackendOnline(health.isOnline);
  }, []);

  // Fetch logged in user's profile
  const loadProfile = useCallback(async () => {
    if (!token) {
      setMyProfile(null);
      return;
    }
    setLoadingProfile(true);
    try {
      const data = await fetchMyProfile(token);
      setMyProfile(data);
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  }, [token]);

  useEffect(() => {
    loadHealth();
    loadProfile();
  }, [loadHealth, loadProfile]);

  const handleOpenAuth = (mode: "login" | "register") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (user: AuthUser, newToken: string) => {
    setCurrentUser(user);
    setToken(newToken);
    setActiveTab("overview");
  };

  const handleLogout = () => {
    clearStoredAuth();
    setCurrentUser(null);
    setToken(null);
    setMyProfile(null);
    setActiveTab("overview");
  };

  const handleProfileSaved = (saved: UserProfile) => {
    setMyProfile(saved);
    setActiveTab("overview"); // Switch back to overview tab on successful save
  };

  return (
    <div className="app-layout">
      {/* Top Navigation Bar */}
      <Header
        backendOnline={backendOnline}
        onRefreshHealth={loadHealth}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      <main className="main-content">
        {currentUser ? (
          /* Authenticated Dashboard Experience */
          <div className="dashboard-container">
            {/* Top Dashboard Header with Stats and Tab Navigation */}
            <DashboardHeader
              user={currentUser}
              profile={myProfile}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {/* Dynamic Tab Body */}
            <div className="dashboard-tab-content">
              {loadingProfile ? (
                <div className="card loading-state">
                  <div className="spinner"></div>
                  <p>Syncing your profile with MongoDB...</p>
                </div>
              ) : activeTab === "overview" ? (
                <DashboardOverview
                  user={currentUser}
                  profile={myProfile}
                  onGoToEdit={() => setActiveTab("edit")}
                  onGoToGap={() => setActiveTab("gap")}
                />
              ) : activeTab === "gap" ? (
                <SkillGapTab
                  profile={myProfile}
                  onGoToEdit={() => setActiveTab("edit")}
                />
              ) : (
                <EditProfileView
                  token={token}
                  initialProfile={myProfile}
                  defaultName={currentUser.name}
                  onProfileSaved={handleProfileSaved}
                  onCancel={() => setActiveTab("overview")}
                />
              )}
            </div>
          </div>
        ) : (
          /* Visitor Landing Screen */
          <LandingHero onOpenAuth={handleOpenAuth} />
        )}
      </main>

      {/* Auth Modal (Login / Sign Up) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authModalMode}
      />

      {/* Footer */}
      <footer className="app-footer">
        <p>
          AI-Based Career and Skill Gap Analyzer &bull; Final Year Capstone Project &bull; Built with
          React, Node.js, Express &amp; Local MongoDB
        </p>
      </footer>
    </div>
  );
}

export default App;
