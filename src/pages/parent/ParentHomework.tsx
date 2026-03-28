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

interface StudentItem { id: string; full_name: string; class_id: string; }
interface HomeworkGradeRecord { homework_id: string; student_id: string; grade: HomeworkGrade; note: string | null; }
interface ChildGrade { student_name: string; grade: HomeworkGrade | undefined; note: string | null; }
interface HomeworkWithGrades {
  id: string; title: string; subject: string; due_date: string;
  description: string | null; class_id: string; childGrades: ChildGrade[];
}

const gradeConfig: Record<HomeworkGrade, { label: string; icon: React.ElementType; cls: string }> = {
  not_done: { label: "Yapmadı", icon: X, cls: "grade-not-done" },
  done: { label: "Yaptı", icon: Check, cls: "grade-done" },
  well_done: { label: "Çok İyi", icon: Star, cls: "grade-well-done" },
};

export default function ParentHomework() {
  const { user } = useAuth();
  const [homeworkList, setHomeworkList] = useState<HomeworkWithGrades[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const studentsRes = await supabase.from("students").select("id, full_name, class_id").eq("parent_id", user.id);
      if (!studentsRes.data?.length) return;

      const students = studentsRes.data as StudentItem[];
      const classIds = students.map((s) => s.class_id);
      const studentIds = students.map((s) => s.id);

      const [hwRes, gradesRes] = await Promise.all([
        supabase.from("homework").select("id, title, subject, due_date, description, class_id")
          .in("class_id", classIds).order("due_date", { ascending: false }),
        supabase.from("homework_grades").select("homework_id, student_id, grade, note").in("student_id", studentIds),
      ]);

      const gradeMap = new Map<string, HomeworkGradeRecord>();
      (gradesRes.data as HomeworkGradeRecord[] || []).forEach((g) => {
        gradeMap.set(`${g.homework_id}-${g.student_id}`, g);
      });

      const list: HomeworkWithGrades[] = (hwRes.data || []).map((hw) => ({
        ...hw,
        description: hw.description ?? null,
        childGrades: students.map((s) => {
          const g = gradeMap.get(`${hw.id}-${s.id}`);
          return { student_name: s.full_name, grade: g?.grade, note: g?.note ?? null };
        }),
      }));

      setHomeworkList(list);
    };
    fetchData();
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
        ) : homeworkList.map((hw) => (
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
              {hw.childGrades.map((cg) => {
                const cfg = cg.grade ? gradeConfig[cg.grade] : null;
                const Icon = cfg?.icon;
                return (
                  <div key={cg.student_name} className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                    <span className="text-xs font-medium">{cg.student_name}</span>
                    {cfg && Icon ? (
                      <div className="flex flex-col items-end gap-0.5">
                        <span className={cfg.cls}>{cfg.label}</span>
                        {cg.note && <span className="text-[10px] text-muted-foreground italic">{cg.note}</span>}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Henüz değerlendirilmedi</span>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
