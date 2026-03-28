import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import NoRole from "./pages/NoRole";
import NotFound from "./pages/NotFound";

// Teacher pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherHomework from "./pages/teacher/TeacherHomework";
import HomeworkDetail from "./pages/teacher/HomeworkDetail";
import TeacherStudents from "./pages/teacher/TeacherStudents";
import TeacherAnnouncements from "./pages/teacher/TeacherAnnouncements";
import TeacherLiveStream from "./pages/teacher/TeacherLiveStream";
import TeacherMessages from "./pages/teacher/TeacherMessages";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import TeacherCalendar from "./pages/teacher/TeacherCalendar";
import TeacherQuizzes from "./pages/teacher/TeacherQuizzes";
import QuizDetail from "./pages/teacher/QuizDetail";
import TeacherFiles from "./pages/teacher/TeacherFiles";

// Parent pages
import ParentDashboard from "./pages/parent/ParentDashboard";
import ParentHomework from "./pages/parent/ParentHomework";
import ParentPerformance from "./pages/parent/ParentPerformance";
import ParentLiveStream from "./pages/parent/ParentLiveStream";
import ParentMessages from "./pages/parent/ParentMessages";
import ParentAttendance from "./pages/parent/ParentAttendance";
import ParentCalendar from "./pages/parent/ParentCalendar";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminClasses from "./pages/admin/AdminClasses";
import AdminClassDetail from "./pages/admin/AdminClassDetail";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  if (!role) {
    return (
      <Routes>
        <Route path="*" element={<NoRole />} />
      </Routes>
    );
  }

  const homeRoute = role === "teacher" ? "/teacher" : role === "parent" ? "/parent" : "/admin";
  const isTeacherOrAdmin = role === "teacher" || role === "admin";
  const isParentOrAdmin = role === "parent" || role === "admin";

  return (
    <Routes>
      <Route path="/" element={<Navigate to={homeRoute} replace />} />

      {/* Teacher routes */}
      <Route path="/teacher" element={isTeacherOrAdmin ? <TeacherDashboard /> : <Navigate to={homeRoute} />} />
      <Route path="/teacher/homework" element={isTeacherOrAdmin ? <TeacherHomework /> : <Navigate to={homeRoute} />} />
      <Route path="/teacher/homework/:id" element={isTeacherOrAdmin ? <HomeworkDetail /> : <Navigate to={homeRoute} />} />
      <Route path="/teacher/students" element={isTeacherOrAdmin ? <TeacherStudents /> : <Navigate to={homeRoute} />} />
      <Route path="/teacher/announcements" element={isTeacherOrAdmin ? <TeacherAnnouncements /> : <Navigate to={homeRoute} />} />
      <Route path="/teacher/live" element={isTeacherOrAdmin ? <TeacherLiveStream /> : <Navigate to={homeRoute} />} />
      <Route path="/teacher/messages" element={isTeacherOrAdmin ? <TeacherMessages /> : <Navigate to={homeRoute} />} />
      <Route path="/teacher/attendance" element={isTeacherOrAdmin ? <TeacherAttendance /> : <Navigate to={homeRoute} />} />
      <Route path="/teacher/calendar" element={isTeacherOrAdmin ? <TeacherCalendar /> : <Navigate to={homeRoute} />} />
      <Route path="/teacher/quizzes" element={isTeacherOrAdmin ? <TeacherQuizzes /> : <Navigate to={homeRoute} />} />
      <Route path="/teacher/quizzes/:id" element={isTeacherOrAdmin ? <QuizDetail /> : <Navigate to={homeRoute} />} />
      <Route path="/teacher/files" element={isTeacherOrAdmin ? <TeacherFiles /> : <Navigate to={homeRoute} />} />

      {/* Parent routes */}
      <Route path="/parent" element={isParentOrAdmin ? <ParentDashboard /> : <Navigate to={homeRoute} />} />
      <Route path="/parent/homework" element={isParentOrAdmin ? <ParentHomework /> : <Navigate to={homeRoute} />} />
      <Route path="/parent/performance" element={isParentOrAdmin ? <ParentPerformance /> : <Navigate to={homeRoute} />} />
      <Route path="/parent/live" element={isParentOrAdmin ? <ParentLiveStream /> : <Navigate to={homeRoute} />} />
      <Route path="/parent/messages" element={isParentOrAdmin ? <ParentMessages /> : <Navigate to={homeRoute} />} />
      <Route path="/parent/attendance" element={isParentOrAdmin ? <ParentAttendance /> : <Navigate to={homeRoute} />} />
      <Route path="/parent/calendar" element={isParentOrAdmin ? <ParentCalendar /> : <Navigate to={homeRoute} />} />

      {/* Admin routes */}
      <Route path="/admin" element={role === "admin" ? <AdminDashboard /> : <Navigate to={homeRoute} />} />
      <Route path="/admin/users" element={role === "admin" ? <AdminUsers /> : <Navigate to={homeRoute} />} />
      <Route path="/admin/classes" element={role === "admin" ? <AdminClasses /> : <Navigate to={homeRoute} />} />
      <Route path="/admin/classes/:id" element={role === "admin" ? <AdminClassDetail /> : <Navigate to={homeRoute} />} />
      <Route path="/admin/announcements" element={role === "admin" ? <AdminAnnouncements /> : <Navigate to={homeRoute} />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
