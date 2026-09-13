import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { PublicLayout } from './layouts/PublicLayout.jsx';
import { DashboardLayout } from './layouts/DashboardLayout.jsx';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { PageLoader } from './components/Loaders.jsx';
import PwaStatus from './components/PwaStatus.jsx';

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
const SubmitProposal = lazy(() => import('./pages/SubmitProposal.jsx'));
const MyProposals = lazy(() => import('./pages/MyProposals.jsx'));
const ProposalsReceived = lazy(() => import('./pages/ProposalsReceived.jsx'));
const CvAnalysis = lazy(() => import('./pages/CvAnalysis.jsx'));
const Verification = lazy(() => import('./pages/Verification.jsx'));
const VerificationQueue = lazy(() => import('./pages/admin/VerificationQueue.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail.jsx'));
const Placeholder = lazy(() => import('./pages/Placeholder.jsx'));
const Messages = lazy(() => import('./pages/Messages.jsx'));
const Payments = lazy(() => import('./pages/Payments.jsx'));
const Projects = lazy(() => import('./pages/Projects.jsx'));
const ReviewForm = lazy(() => import('./pages/ReviewForm.jsx'));
const CandidateMatches = lazy(() => import('./pages/CandidateMatches.jsx'));
const Services = lazy(() => import('./pages/Services.jsx'));
const HowItWorks = lazy(() => import('./pages/HowItWorks.jsx'));
const Agencies = lazy(() => import('./pages/Agencies.jsx'));
const HourlyWork = lazy(() => import('./pages/HourlyWork.jsx'));
const ResolutionCenter = lazy(() => import('./pages/ResolutionCenter.jsx'));
const Notifications = lazy(() => import('./pages/Notifications.jsx'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const Applicants = lazy(() => import('./pages/Applicants.jsx'));
const MyOffers = lazy(() => import('./pages/MyOffers.jsx'));
const VirtualCardPage = lazy(() => import('./pages/VirtualCardPage.jsx'));

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
            <Route path="/services" element={<Services />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/agencies" element={<Agencies />} />
            <Route path="/agencies/:slug" element={<Agencies />} />
            <Route path="/agencies/:slug/dashboard" element={<ProtectedRoute><Agencies /></ProtectedRoute>} />
            <Route path="/agencies/create" element={<ProtectedRoute><Agencies /></ProtectedRoute>} />
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
            <Route path="jobs/:jobId/applicants" element={<Applicants />} />
            <Route path="jobs/:id/apply" element={<SubmitProposal />} />
            <Route path="saved-jobs" element={<SavedJobs />} />
            <Route path="proposals" element={<MyProposals />} />
            <Route path="offers" element={<ProtectedRoute roles={['freelancer']}><MyOffers /></ProtectedRoute>} />
            <Route path="proposals/received" element={<ProposalsReceived />} />
            <Route path="proposals/:id/edit" element={<SubmitProposal mode="edit" />} />
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
            <Route path="admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="messages" element={<Messages />} />
            <Route path="messages/:conversationId" element={<Messages />} />
            <Route path="payments" element={<Payments />} />
            <Route path="payments/:paymentId" element={<Payments />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:projectId" element={<Projects />} />
            <Route path="contracts/:contractId/review" element={<ReviewForm />} />
            <Route path="contracts/:contractId/time" element={<HourlyWork />} />
            <Route path="resolution-center" element={<ResolutionCenter />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="jobs/:jobId/matches" element={<CandidateMatches />} />
            <Route path="card" element={<ProtectedRoute roles={['freelancer']}><VirtualCardPage /></ProtectedRoute>} />
            <Route path="card/transactions" element={<ProtectedRoute roles={['freelancer']}><VirtualCardPage /></ProtectedRoute>} />
            <Route path="developer/card" element={<ProtectedRoute roles={['freelancer']}><VirtualCardPage /></ProtectedRoute>} />
            <Route path="developer/wallet" element={<ProtectedRoute roles={['freelancer']}><VirtualCardPage /></ProtectedRoute>} />
            <Route path="settings" element={<Settings />} />
          </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          <PwaStatus />
      </Suspense>
    </ErrorBoundary>
  );
}
