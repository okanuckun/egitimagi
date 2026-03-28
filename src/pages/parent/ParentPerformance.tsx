import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, CheckCircle, Star, XCircle } from "lucide-react";

export default function ParentPerformance() {
  const { user } = useAuth();
  const [stats, setStats] = useState<{ name: string; notDone: number; done: number; wellDone: number; total: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const studentsRes = await supabase.from("students").select("id, full_name").eq("parent_id", user.id);
      if (!studentsRes.data?.length) return;

      const studentIds = studentsRes.data.map((s) => s.id);
      const gradesRes = await supabase.from("homework_grades").select("*").in("student_id", studentIds);

      const result = studentsRes.data.map((student) => {
        const grades = gradesRes.data?.filter((g) => g.student_id === student.id) || [];
        return {
          name: student.full_name,
          notDone: grades.filter((g) => g.grade === "not_done").length,
          done: grades.filter((g) => g.grade === "done").length,
          wellDone: grades.filter((g) => g.grade === "well_done").length,
          total: grades.length,
        };
      });
      setStats(result);
    };
    fetch();
  }, [user]);

  return (
    <div className="page-container">
      <PageHeader title="Performans" subtitle="Çocuğunuzun ödev performansı" />
      {stats.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Henüz veri bulunmuyor</p>
        </div>
      ) : (
        stats.map((s) => (
          <Card key={s.name} className="mb-4">
            <CardContent className="p-4">
              <h3 className="font-display font-semibold text-sm mb-4">{s.name}</h3>
              <div className="grid grid-cols-3 gap-3">
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
                <div className="mt-4">
                  <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                    {s.notDone > 0 && (
                      <div className="bg-destructive" style={{ width: `${(s.notDone / s.total) * 100}%` }} />
                    )}
                    {s.done > 0 && (
                      <div className="bg-info" style={{ width: `${(s.done / s.total) * 100}%` }} />
                    )}
                    {s.wellDone > 0 && (
                      <div className="bg-success" style={{ width: `${(s.wellDone / s.total) * 100}%` }} />
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
      <BottomNav />
    </div>
  );
}
