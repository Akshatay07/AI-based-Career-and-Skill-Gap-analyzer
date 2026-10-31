interface LandingHeroProps {
  onOpenAuth: (mode: "login" | "register") => void;
}

export default function LandingHero({ onOpenAuth }: LandingHeroProps) {
  return (
    <div className="landing-hero-container">
      <div className="landing-hero-card">
        <div className="landing-badge">Final Year Project &bull; AI Career Advisory</div>
        <h1 className="landing-headline">
          Bridge the Gap Between <span className="gradient-text">Your Current Skills</span> and Your{" "}
          <span className="gradient-text">Dream Role</span>
        </h1>
        <p className="landing-description">
          Create your personalized career profile, evaluate your technical skill gaps against
          real-world industry benchmarks, and unlock AI-powered learning paths.
        </p>

        <div className="landing-cta-group">
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => onOpenAuth("register")}
          >
            Create My Career Profile 🚀
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-lg"
            onClick={() => onOpenAuth("login")}
          >
            Already have an account? Log In
          </button>
        </div>

        {/* 3 Step Process */}
        <div className="landing-features-grid">
          <div className="feature-step-card">
            <div className="feature-step-number">1</div>
            <h3>Personal Profile</h3>
            <p>Sign up and securely save your education, current skill set, and target dream role.</p>
          </div>

          <div className="feature-step-card">
            <div className="feature-step-number">2</div>
            <h3>Skill Gap Analyzer</h3>
            <p>Automatically compare what you know against target role requirements and calculate match %.</p>
          </div>

          <div className="feature-step-card">
            <div className="feature-step-number">3</div>
            <h3>AI Roadmap (Gemini)</h3>
            <p>Receive tailored study plans, project recommendations, and courses to close the gap.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
