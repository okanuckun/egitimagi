import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Calendar, Check, X, Star } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";

type HomeworkGrade = Database["public"]["Enums"]["homework_grade"];

const gradeLabels: Record<HomeworkGrade, string> = {
  not_done: "Yapmadı",
  done: "Yaptı",
  well_done: "Çok İyi",
};

export default function ParentHomework() {
  const { user } = useAuth();
  const [homeworkList, setHomeworkList] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const studentsRes = await supabase.from("students").select("id, full_name, class_id").eq("parent_id", user.id);
      if (!studentsRes.data?.length) return;

      const classIds = studentsRes.data.map((s) => s.class_id);
      const studentIds = studentsRes.data.map((s) => s.id);

      const hwRes = await supabase.from("homework").select("*").in("class_id", classIds).order("due_date", { ascending: false });
      const gradesRes = await supabase.from("homework_grades").select("*").in("student_id", studentIds);

      const gradeMap = new Map<string, any>();
      gradesRes.data?.forEach((g) => {
        gradeMap.set(`${g.homework_id}-${g.student_id}`, g);
      });

      const list = (hwRes.data || []).map((hw) => {
        const childGrades = studentsRes.data!.map((s) => ({
          student_name: s.full_name,
          grade: gradeMap.get(`${hw.id}-${s.id}`)?.grade as HomeworkGrade | undefined,
        }));
        return { ...hw, childGrades };
      });

      setHomeworkList(list);
    };
    fetch();
  }, [user]);

  return (
    <div className="page-container">
      <PageHeader title="Ödevler" subtitle="Çocuğunuzun ödevleri" />
      <div className="space-y-3">
        {homeworkList.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Henüz ödev bulunmuyor</p>
          </div>
        ) : (
          homeworkList.map((hw) => (
            <Card key={hw.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-display font-semibold text-sm">{hw.title}</h3>
                    <p className="text-xs text-muted-foreground">{hw.subject}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(hw.due_date), "d MMM", { locale: tr })}
                  </div>
                </div>
                {hw.description && <p className="text-xs text-foreground/70 mb-2">{hw.description}</p>}
                {hw.childGrades.map((cg: any) => (
                  <div key={cg.student_name} className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                    <span className="text-xs font-medium">{cg.student_name}</span>
                    {cg.grade ? (
                      <span className={`grade-${cg.grade === "not_done" ? "not-done" : cg.grade === "well_done" ? "well-done" : "done"}`}>
                        {gradeLabels[cg.grade]}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Henüz değerlendirilmedi</span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>
      <BottomNav />
    </div>
  );
}
