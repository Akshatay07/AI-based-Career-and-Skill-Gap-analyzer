import { useState, useMemo } from "react";
import type { CareerRole } from "../../types/role";

interface RoleExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  roles: CareerRole[];
  currentRoleTitle?: string;
  onSelectRole: (roleTitle: string) => void;
  onSimulateRole: (role: CareerRole) => void;
}

export default function RoleExplorerModal({
  isOpen,
  onClose,
  roles,
  currentRoleTitle,
  onSelectRole,
  onSimulateRole,
}: RoleExplorerModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = useMemo(() => {
    const cats = new Set(roles.map((r) => r.category));
    return ["All", ...Array.from(cats)];
  }, [roles]);

  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const matchesSearch =
        role.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.coreSkills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
        role.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat =
        selectedCategory === "All" || role.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [roles, searchTerm, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card role-explorer-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          title="Close"
        >
          ✕
        </button>

        <div className="modal-body explorer-body">
          <div className="explorer-header">
            <span className="explorer-kicker">Industry Benchmarks Library</span>
            <h2 className="explorer-title">Explore Career Roles</h2>
            <p className="explorer-sub">
              Browse standard job roles stored in MongoDB and compare your current skills against
              their real-world requirements.
            </p>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="explorer-controls">
            <input
              type="text"
              className="form-control explorer-search"
              placeholder="Search by role name, description, or skill (e.g. React, Python)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="category-pills">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`category-pill ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Roles Grid */}
          <div className="explorer-roles-grid">
            {filteredRoles.length === 0 ? (
              <div className="no-roles-notice">
                <p>No roles found matching your filter.</p>
              </div>
            ) : (
              filteredRoles.map((role) => {
                const isCurrent =
                  currentRoleTitle?.toLowerCase() === role.title.toLowerCase();

                return (
                  <div
                    key={role._id}
                    className={`explorer-role-item ${isCurrent ? "current-active" : ""}`}
                  >
                    <div className="role-item-top">
                      <div className="role-item-title-wrap">
                        <span className="role-cat-badge">{role.category}</span>
                        <h3 className="role-item-name">{role.title}</h3>
                      </div>
                      <span className={`demand-badge demand-${role.demandLevel.toLowerCase().replace(" ", "-")}`}>
                        {role.demandLevel} Demand
                      </span>
                    </div>

                    <p className="role-item-desc">{role.description}</p>

                    <div className="role-skills-preview">
                      <span className="role-skills-label">
                        Core Skills ({role.coreSkills.length}):
                      </span>
                      <div className="skills-mini-list">
                        {role.coreSkills.map((skill) => (
                          <span key={skill} className="mini-skill-pill">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="role-item-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          onSimulateRole(role);
                          onClose();
                        }}
                      >
                        ⚡ Simulate Gap Score
                      </button>

                      {isCurrent ? (
                        <span className="current-target-tag">✓ Your Target Role</span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            onSelectRole(role.title);
                            onClose();
                          }}
                        >
                          Set as Target
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

