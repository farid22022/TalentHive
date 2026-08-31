import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { PublicLayout } from './layouts/PublicLayout.jsx';
import { DashboardLayout } from './layouts/DashboardLayout.jsx';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { PageLoader } from './components/Loaders.jsx';

// Eager (small, always-needed) pages.
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import NotFound from './pages/NotFound.jsx';

// Lazy-loaded pages (code splitting).
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Onboarding = lazy(() => import('./pages/Onboarding.jsx'));
const FindTalent = lazy(() => import('./pages/FindTalent.jsx'));
const PublicProfile = lazy(() => import('./pages/PublicProfile.jsx'));
const FindJobs = lazy(() => import('./pages/FindJobs.jsx'));
const JobDetail = lazy(() => import('./pages/JobDetail.jsx'));
const PostJob = lazy(() => import('./pages/PostJob.jsx'));
const MyJobs = lazy(() => import('./pages/MyJobs.jsx'));
const SavedJobs = lazy(() => import('./pages/SavedJobs.jsx'));
const CvAnalysis = lazy(() => import('./pages/CvAnalysis.jsx'));
const Verification = lazy(() => import('./pages/Verification.jsx'));
const VerificationQueue = lazy(() => import('./pages/admin/VerificationQueue.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail.jsx'));
const Placeholder = lazy(() => import('./pages/Placeholder.jsx'));

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public site */}
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="/find-talent" element={<FindTalent />} />
            <Route path="/freelancers/:userId" element={<PublicProfile />} />
            <Route path="/find-jobs" element={<FindJobs />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/services" element={<Placeholder title="Services" phase="Phase 10" />} />
            <Route path="/how-it-works" element={<Placeholder title="How It Works" />} />
            <Route path="/about" element={<Placeholder title="About" />} />
            <Route path="/pricing" element={<Placeholder title="Pricing" />} />
            <Route path="/contact" element={<Placeholder title="Contact" />} />
            <Route path="/help" element={<Placeholder title="Help Center" />} />
            <Route path="/terms" element={<Placeholder title="Terms of Service" />} />
            <Route path="/privacy" element={<Placeholder title="Privacy Policy" />} />
          </Route>

          {/* Auth (no chrome) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          {/* Authenticated dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="jobs" element={<MyJobs />} />
            <Route path="jobs/new" element={<PostJob />} />
            <Route path="jobs/:id/edit" element={<PostJob />} />
            <Route path="saved-jobs" element={<SavedJobs />} />
            <Route path="cv-analysis" element={<CvAnalysis />} />
            <Route path="verification" element={<Verification />} />
            <Route
              path="admin/verification"
              element={
                <ProtectedRoute roles={['admin']}>
                  <VerificationQueue />
                </ProtectedRoute>
              }
            />
            <Route path="messages" element={<Placeholder title="Messages" phase="Phase 7" />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
