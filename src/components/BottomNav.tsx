import { useLocation, useNavigate } from "react-router-dom";
import { Home, BookOpen, Users, Bell, Settings, BarChart3, Video, MessageCircle, ClipboardCheck, Calendar, FileQuestion, FolderOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const teacherMainNav: NavItem[] = [
  { icon: Home, label: "Ana Sayfa", path: "/teacher" },
  { icon: BookOpen, label: "Ödevler", path: "/teacher/homework" },
  { icon: Users, label: "Öğrenciler", path: "/teacher/students" },
  { icon: MessageCircle, label: "Mesajlar", path: "/teacher/messages" },
  { icon: Settings, label: "Daha Fazla", path: "#more" },
];

const teacherMoreNav: NavItem[] = [
  { icon: ClipboardCheck, label: "Yoklama", path: "/teacher/attendance" },
  { icon: Calendar, label: "Takvim", path: "/teacher/calendar" },
  { icon: FileQuestion, label: "Quizler", path: "/teacher/quizzes" },
  { icon: FolderOpen, label: "Dosyalar", path: "/teacher/files" },
  { icon: Video, label: "Canlı", path: "/teacher/live" },
  { icon: Bell, label: "Duyurular", path: "/teacher/announcements" },
];

const parentMainNav: NavItem[] = [
  { icon: Home, label: "Ana Sayfa", path: "/parent" },
  { icon: BookOpen, label: "Ödevler", path: "/parent/homework" },
  { icon: MessageCircle, label: "Mesajlar", path: "/parent/messages" },
  { icon: BarChart3, label: "Performans", path: "/parent/performance" },
  { icon: Settings, label: "Daha Fazla", path: "#more" },
];

const parentMoreNav: NavItem[] = [
  { icon: ClipboardCheck, label: "Devamsızlık", path: "/parent/attendance" },
  { icon: Calendar, label: "Takvim", path: "/parent/calendar" },
  { icon: Video, label: "Canlı", path: "/parent/live" },
];

const adminNav: NavItem[] = [
  { icon: Home, label: "Panel", path: "/admin" },
  { icon: Users, label: "Kullanıcılar", path: "/admin/users" },
  { icon: Settings, label: "Sınıflar", path: "/admin/classes" },
  { icon: Bell, label: "Duyurular", path: "/admin/announcements" },
];

export default function BottomNav() {
  const { role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  let navItems: NavItem[];
  let moreItems: NavItem[] = [];

  if (role === "admin" && location.pathname.startsWith("/teacher")) {
    navItems = [...teacherMainNav.filter(n => n.path !== "#more"), { icon: Settings, label: "Admin", path: "/admin" }];
    moreItems = teacherMoreNav;
  } else if (role === "admin" && location.pathname.startsWith("/parent")) {
    navItems = [...parentMainNav.filter(n => n.path !== "#more"), { icon: Settings, label: "Admin", path: "/admin" }];
    moreItems = parentMoreNav;
  } else if (role === "teacher") {
    navItems = teacherMainNav;
    moreItems = teacherMoreNav;
  } else if (role === "parent") {
    navItems = parentMainNav;
    moreItems = parentMoreNav;
  } else {
    navItems = adminNav;
  }

  return (
    <>
      {/* More menu overlay */}
      {showMore && moreItems.length > 0 && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)}>
          <div className="absolute bottom-16 left-0 right-0 bg-background border-t rounded-t-2xl shadow-lg p-4" onClick={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-3 gap-3">
              {moreItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setShowMore(false); }}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-xl transition-colors",
                      isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav className="bottom-nav">
        {navItems.map((item) => {
          const isMore = item.path === "#more";
          const isActive = !isMore && location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => {
                if (isMore) setShowMore(!showMore);
                else { navigate(item.path); setShowMore(false); }
              }}
              className={cn("bottom-nav-item", isActive && "active", isMore && showMore && "active")}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
