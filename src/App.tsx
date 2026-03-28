import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Login from "./pages/Login";
import NoRole from "./pages/NoRole";
import NotFound from "./pages/NotFound";

// Teacher pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherHomework from "./pages/teacher/TeacherHomework";
import HomeworkDetail from "./pages/teacher/HomeworkDetail";
import TeacherStudents from "./pages/teacher/TeacherStudents";
import TeacherAnnouncements from "./pages/teacher/TeacherAnnouncements";

// Parent pages
import ParentDashboard from "./pages/parent/ParentDashboard";
import ParentHomework from "./pages/parent/ParentHomework";
import ParentPerformance from "./pages/parent/ParentPerformance";

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

  return (
    <Routes>
      <Route path="/" element={<Navigate to={homeRoute} replace />} />

      {/* Teacher routes - admin can also access */}
      <Route path="/teacher" element={role === "teacher" || role === "admin" ? <TeacherDashboard /> : <Navigate to={homeRoute} />} />
      <Route path="/teacher/homework" element={role === "teacher" || role === "admin" ? <TeacherHomework /> : <Navigate to={homeRoute} />} />
      <Route path="/teacher/homework/:id" element={role === "teacher" || role === "admin" ? <HomeworkDetail /> : <Navigate to={homeRoute} />} />
      <Route path="/teacher/students" element={role === "teacher" || role === "admin" ? <TeacherStudents /> : <Navigate to={homeRoute} />} />
      <Route path="/teacher/announcements" element={role === "teacher" || role === "admin" ? <TeacherAnnouncements /> : <Navigate to={homeRoute} />} />

      {/* Parent routes - admin can also access */}
      <Route path="/parent" element={role === "parent" || role === "admin" ? <ParentDashboard /> : <Navigate to={homeRoute} />} />
      <Route path="/parent/homework" element={role === "parent" || role === "admin" ? <ParentHomework /> : <Navigate to={homeRoute} />} />
      <Route path="/parent/performance" element={role === "parent" || role === "admin" ? <ParentPerformance /> : <Navigate to={homeRoute} />} />

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
