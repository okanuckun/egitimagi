import { useLocation, useNavigate } from "react-router-dom";
import { Home, BookOpen, Users, Bell, Settings, BarChart3, Video } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const teacherNav: NavItem[] = [
  { icon: Home, label: "Ana Sayfa", path: "/teacher" },
  { icon: BookOpen, label: "Ödevler", path: "/teacher/homework" },
  { icon: Users, label: "Öğrenciler", path: "/teacher/students" },
  { icon: Video, label: "Canlı", path: "/teacher/live" },
  { icon: Bell, label: "Duyurular", path: "/teacher/announcements" },
];

const parentNav: NavItem[] = [
  { icon: Home, label: "Ana Sayfa", path: "/parent" },
  { icon: BookOpen, label: "Ödevler", path: "/parent/homework" },
  { icon: BarChart3, label: "Performans", path: "/parent/performance" },
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

  // Admin viewing teacher/parent pages gets their nav + back to admin
  let navItems: NavItem[];
  if (role === "admin" && location.pathname.startsWith("/teacher")) {
    navItems = [
      ...teacherNav,
      { icon: Settings, label: "Admin", path: "/admin" },
    ];
  } else if (role === "admin" && location.pathname.startsWith("/parent")) {
    navItems = [
      ...parentNav,
      { icon: Settings, label: "Admin", path: "/admin" },
    ];
  } else {
    navItems = role === "teacher" ? teacherNav : role === "parent" ? parentNav : adminNav;
  }

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn("bottom-nav-item", isActive && "active")}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
