import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Check, X, Star } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type HomeworkGrade = Database["public"]["Enums"]["homework_grade"];

interface HomeworkItem {
  id: string; title: string; subject: string; due_date: string;
  description: string | null; class_id: string;
}

interface StudentGrade {
  student_id: string; student_name: string; grade: HomeworkGrade;
  grade_id?: string; note: string;
}

const gradeLabels: Record<HomeworkGrade, string> = { not_done: "Yapmadı", done: "Yaptı", well_done: "Çok İyi" };
const gradeStyles: Record<HomeworkGrade, string> = { not_done: "grade-not-done", done: "grade-done", well_done: "grade-well-done" };
const gradeIcons: Record<HomeworkGrade, React.ElementType> = { not_done: X, done: Check, well_done: Star };

export default function HomeworkDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [homework, setHomework] = useState<HomeworkItem | null>(null);
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([]);

  const fetchData = async () => {
    if (!id || !user) return;
    const hwRes = await supabase.from("homework").select("*").eq("id", id).single();
    if (hwRes.data) {
      const hw = hwRes.data as HomeworkItem;
      setHomework(hw);
      const [studentsRes, gradesRes] = await Promise.all([
        supabase.from("students").select("id, full_name").eq("class_id", hw.class_id),
        supabase.from("homework_grades").select("id, student_id, grade, note").eq("homework_id", id),
      ]);
      const gradeMap = new Map(gradesRes.data?.map((g) => [g.student_id, g]) || []);
      const list: StudentGrade[] = (studentsRes.data || []).map((s) => {
        const g = gradeMap.get(s.id);
        return {
          student_id: s.id, student_name: s.full_name,
          grade: (g?.grade as HomeworkGrade) || "not_done",
          grade_id: g?.id,
          note: (g as { note?: string } | undefined)?.note || "",
        };
      });
      setStudentGrades(list);
    }
  };

  useEffect(() => { fetchData(); }, [id, user]);

  const handleGrade = async (studentId: string, grade: HomeworkGrade, existingGradeId?: string) => {
    if (existingGradeId) {
      await supabase.from("homework_grades").update({ grade, graded_at: new Date().toISOString() }).eq("id", existingGradeId);
    } else {
      await supabase.from("homework_grades").insert({
        homework_id: id!, student_id: studentId, grade, graded_at: new Date().toISOString(),
      });
    }
    toast.success("Not güncellendi");
    fetchData();
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setStudentGrades((prev) => prev.map((sg) => (sg.student_id === studentId ? { ...sg, note } : sg)));
  };

  const handleNoteSave = async (sg: StudentGrade) => {
    if (sg.grade_id) {
      await supabase.from("homework_grades").update({ note: sg.note }).eq("id", sg.grade_id);
    } else {
      await supabase.from("homework_grades").insert({
        homework_id: id!, student_id: sg.student_id, grade: sg.grade,
        note: sg.note, graded_at: new Date().toISOString(),
      });
    }
    toast.success("Not kaydedildi");
    fetchData();
  };

  const grades: HomeworkGrade[] = ["not_done", "done", "well_done"];
  if (!homework) return null;

  return (
    <div className="page-container">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Geri
      </button>
      <div className="mb-6">
        <h1 className="text-xl font-display font-bold">{homework.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{homework.subject} • {homework.due_date}</p>
        {homework.description && <p className="text-sm mt-2 text-foreground/80">{homework.description}</p>}
      </div>
      <h2 className="text-sm font-display font-semibold mb-3">Öğrenci Notları</h2>
      <div className="space-y-3">
        {studentGrades.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Bu sınıfta henüz öğrenci yok</p>
        )}
        {studentGrades.map((sg) => (
          <Card key={sg.student_id}>
            <CardContent className="p-4">
              <p className="font-medium text-sm mb-3">{sg.student_name}</p>
              <div className="flex gap-2">
                {grades.map((g) => {
                  const Icon = gradeIcons[g];
                  const isActive = sg.grade === g;
                  return (
                    <button key={g} onClick={() => handleGrade(sg.student_id, g, sg.grade_id)}
                      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold transition-all ${isActive ? gradeStyles[g] : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                      <Icon className="w-3.5 h-3.5" />{gradeLabels[g]}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex gap-2">
                <input type="text" placeholder="Not ekle..." value={sg.note || ""}
                  onChange={(e) => handleNoteChange(sg.student_id, e.target.value)}
                  className="flex-1 text-xs px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                <button onClick={() => handleNoteSave(sg)}
                  className="text-xs px-3 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
                  Kaydet
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
