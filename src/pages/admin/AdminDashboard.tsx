import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Users, BookOpen, GraduationCap, Bell } from "lucide-react";

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ classes: 0, students: 0, homework: 0, announcements: 0 });

  useEffect(() => {
    const fetch = async () => {
      const [c, s, h, a] = await Promise.all([
        supabase.from("classes").select("id", { count: "exact", head: true }),
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("homework").select("id", { count: "exact", head: true }),
        supabase.from("announcements").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        classes: c.count || 0,
        students: s.count || 0,
        homework: h.count || 0,
        announcements: a.count || 0,
      });
    };
    fetch();
  }, []);

  const statCards = [
    { icon: GraduationCap, label: "Sınıf", value: stats.classes, color: "bg-primary/10 text-primary" },
    { icon: Users, label: "Öğrenci", value: stats.students, color: "bg-success/10 text-success" },
    { icon: BookOpen, label: "Ödev", value: stats.homework, color: "bg-info/10 text-info" },
    { icon: Bell, label: "Duyuru", value: stats.announcements, color: "bg-warning/10 text-warning" },
  ];

  return (
    <div className="page-container">
      <PageHeader title={`Merhaba, ${profile?.full_name || "Yönetici"} 👋`} subtitle="Yönetici Paneli" />
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((stat) => (
          <Card key={stat.label} className="card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
