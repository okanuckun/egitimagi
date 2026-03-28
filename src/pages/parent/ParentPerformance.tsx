import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, CheckCircle, Star, XCircle, TrendingUp } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type HomeworkGrade = Database["public"]["Enums"]["homework_grade"];

interface StudentItem { id: string; full_name: string; }
interface GradeRecord { student_id: string; grade: HomeworkGrade; }
interface StudentStats {
  name: string; notDone: number; done: number; wellDone: number; total: number; successRate: number;
}

export default function ParentPerformance() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentStats[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const studentsRes = await supabase.from("students").select("id, full_name").eq("parent_id", user.id);
      if (!studentsRes.data?.length) return;
      const students = studentsRes.data as StudentItem[];
      const studentIds = students.map((s) => s.id);
      const gradesRes = await supabase.from("homework_grades").select("student_id, grade").in("student_id", studentIds);
      const grades = (gradesRes.data as GradeRecord[]) || [];

      const result: StudentStats[] = students.map((student) => {
        const sg = grades.filter((g) => g.student_id === student.id);
        const notDone = sg.filter((g) => g.grade === "not_done").length;
        const done = sg.filter((g) => g.grade === "done").length;
        const wellDone = sg.filter((g) => g.grade === "well_done").length;
        const total = sg.length;
        const successRate = total > 0 ? Math.round(((done + wellDone) / total) * 100) : 0;
        return { name: student.full_name, notDone, done, wellDone, total, successRate };
      });
      setStats(result);
    };
    fetchData();
  }, [user]);

  return (
    <div className="page-container">
      <PageHeader title="Performans" subtitle="Çocuğunuzun ödev performansı" />
      {stats.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Henüz veri bulunmuyor</p>
        </div>
      ) : stats.map((s) => (
        <Card key={s.name} className="mb-4">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold">{s.name}</h3>
              {s.total > 0 && (
                <div className="flex items-center gap-1.5 bg-success/10 rounded-full px-3 py-1">
                  <TrendingUp className="w-3.5 h-3.5 text-success" />
                  <span className="text-sm font-bold text-success">{s.successRate}%</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-3 rounded-xl bg-destructive/10">
                <XCircle className="w-5 h-5 text-destructive mx-auto mb-1" />
                <p className="text-xl font-bold text-destructive">{s.notDone}</p>
                <p className="text-[10px] text-muted-foreground">Yapmadı</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-info/10">
                <CheckCircle className="w-5 h-5 text-info mx-auto mb-1" />
                <p className="text-xl font-bold text-info">{s.done}</p>
                <p className="text-[10px] text-muted-foreground">Yaptı</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-success/10">
                <Star className="w-5 h-5 text-success mx-auto mb-1" />
                <p className="text-xl font-bold text-success">{s.wellDone}</p>
                <p className="text-[10px] text-muted-foreground">Çok İyi</p>
              </div>
            </div>
            {s.total > 0 && (
              <div>
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>{s.total} ödev değerlendirildi</span>
                  <span>Başarı: {s.successRate}%</span>
                </div>
                <div className="flex h-3 rounded-full overflow-hidden bg-muted gap-0.5">
                  {s.wellDone > 0 && <div className="bg-success transition-all" style={{ width: `${(s.wellDone / s.total) * 100}%` }} />}
                  {s.done > 0 && <div className="bg-info transition-all" style={{ width: `${(s.done / s.total) * 100}%` }} />}
                  {s.notDone > 0 && <div className="bg-destructive transition-all" style={{ width: `${(s.notDone / s.total) * 100}%` }} />}
                </div>
                <div className="flex gap-3 mt-2">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-success" /><span className="text-[10px] text-muted-foreground">Çok İyi</span></div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-info" /><span className="text-[10px] text-muted-foreground">Yaptı</span></div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-destructive" /><span className="text-[10px] text-muted-foreground">Yapmadı</span></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      <BottomNav />
    </div>
  );
}
