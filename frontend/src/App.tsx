import { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import LandingHero from "./components/LandingHero";
import AuthModal from "./components/AuthModal";
import DashboardHeader from "./components/dashboard/DashboardHeader";
import DashboardOverview from "./components/dashboard/DashboardOverview";
import EditProfileView from "./components/dashboard/EditProfileView";
import SkillGapTab from "./components/dashboard/SkillGapTab";
import AiRoadmapTab from "./components/dashboard/AiRoadmapTab";
import {
  checkBackendHealth,
  getStoredToken,
  getStoredUser,
  clearStoredAuth,
  fetchMyProfile,
  fetchCareerRoles,
  saveMyProfile,
  fetchMyRoadmap,
} from "./services/api";
import type { UserProfile } from "./types/profile";
import type { AuthUser } from "./types/auth";
import type { CareerRole } from "./types/role";
import type { Roadmap } from "./types/roadmap";
import "./App.css";

function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getStoredUser());
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<CareerRole[]>([]);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  // Active Tab state for Dashboard ('overview' | 'gap' | 'roadmap' | 'edit')
  const [activeTab, setActiveTab] = useState<"overview" | "gap" | "roadmap" | "edit">("overview");

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  // Health check
  const loadHealth = useCallback(async () => {
    const health = await checkBackendHealth();
    setBackendOnline(health.isOnline);
  }, []);

  // Fetch benchmark roles from MongoDB
  const loadRoles = useCallback(async () => {
    try {
      const data = await fetchCareerRoles();
      setRoles(data);
    } catch (err) {
      console.error("Failed to load career roles:", err);
    }
  }, []);

  // Fetch logged in user's profile and existing AI roadmap
  const loadUserData = useCallback(async () => {
    if (!token) {
      setMyProfile(null);
      setRoadmap(null);
      return;
    }
    setLoadingProfile(true);
    try {
      const profileData = await fetchMyProfile(token);
      setMyProfile(profileData);

      // Fetch saved AI roadmap if available
      const roadmapData = await fetchMyRoadmap(token);
      setRoadmap(roadmapData);
    } catch (err) {
      console.error("Failed to load user data:", err);
    } finally {
      setLoadingProfile(false);
    }
  }, [token]);

  useEffect(() => {
    loadHealth();
    loadRoles();
    loadUserData();
  }, [loadHealth, loadRoles, loadUserData]);

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
    setRoadmap(null);
    setActiveTab("overview");
  };

  const handleProfileSaved = (saved: UserProfile) => {
    setMyProfile(saved);
    setActiveTab("overview");
  };

  // Switch target role directly from SkillGapTab or Explorer modal
  const handleUpdateTargetRole = async (newRoleTitle: string) => {
    if (!token) return;
    try {
      const updated = await saveMyProfile(token, { targetRole: newRoleTitle });
      setMyProfile(updated);
    } catch (err) {
      console.error("Failed to update target role:", err);
    }
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
                  roles={roles}
                  onGoToEdit={() => setActiveTab("edit")}
                  onUpdateTargetRole={handleUpdateTargetRole}
                  onGoToRoadmap={() => setActiveTab("roadmap")}
                />
              ) : activeTab === "roadmap" ? (
                <AiRoadmapTab
                  token={token}
                  profile={myProfile}
                  roadmap={roadmap}
                  onRoadmapUpdated={setRoadmap}
                  onGoToEdit={() => setActiveTab("edit")}
                />
              ) : (
                <EditProfileView
                  token={token}
                  initialProfile={myProfile}
                  roles={roles}
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
