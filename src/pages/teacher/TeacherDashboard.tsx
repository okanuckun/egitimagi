import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, CheckCircle, Clock } from "lucide-react";

export default function TeacherDashboard() {
  const { user, profile, role } = useAuth();
  const [stats, setStats] = useState({ classes: 0, students: 0, homework: 0, pending: 0 });

  useEffect(() => {
    if (!user) return;
    const isAdmin = role === "admin";
    const fetchStats = async () => {
      const [classesRes, homeworkRes] = await Promise.all([
        isAdmin
          ? supabase.from("classes").select("id")
          : supabase.from("classes").select("id").eq("teacher_id", user.id),
        isAdmin
          ? supabase.from("homework").select("id")
          : supabase.from("homework").select("id").eq("teacher_id", user.id),
      ]);
      const classIds = classesRes.data?.map((c) => c.id) || [];
      let studentCount = 0;
      if (classIds.length > 0) {
        const studentsRes = await supabase.from("students").select("id").in("class_id", classIds);
        studentCount = studentsRes.data?.length || 0;
      }
      setStats({
        classes: classesRes.data?.length || 0,
        students: studentCount,
        homework: homeworkRes.data?.length || 0,
        pending: 0,
      });
    };
    fetchStats();
  }, [user, role]);

  const statCards = [
    { icon: Users, label: "Sınıf", value: stats.classes, color: "bg-info/10 text-info" },
    { icon: Users, label: "Öğrenci", value: stats.students, color: "bg-success/10 text-success" },
    { icon: BookOpen, label: "Ödev", value: stats.homework, color: "bg-primary/10 text-primary" },
    { icon: Clock, label: "Bekleyen", value: stats.pending, color: "bg-warning/10 text-warning" },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title={`Merhaba, ${profile?.full_name || "Öğretmen"} 👋`}
        subtitle="Öğretmen Paneli"
      />
      <div className="grid grid-cols-2 gap-3 mb-6">
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
