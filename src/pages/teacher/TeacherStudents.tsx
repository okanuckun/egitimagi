import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

interface StudentWithClass {
  id: string;
  full_name: string;
  class_name: string;
}

export default function TeacherStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentWithClass[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const classesRes = await supabase.from("classes").select("id, name").eq("teacher_id", user.id);
      if (!classesRes.data?.length) return;
      const classMap = new Map(classesRes.data.map((c) => [c.id, c.name]));
      const studentsRes = await supabase.from("students").select("*").in("class_id", classesRes.data.map((c) => c.id));
      setStudents(
        (studentsRes.data || []).map((s) => ({
          id: s.id,
          full_name: s.full_name,
          class_name: classMap.get(s.class_id) || "",
        }))
      );
    };
    fetch();
  }, [user]);

  return (
    <div className="page-container">
      <PageHeader title="Öğrenciler" subtitle="Sınıflarınızdaki öğrenciler" />
      {students.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Henüz öğrenci bulunmuyor</p>
        </div>
      ) : (
        <div className="space-y-2">
          {students.map((s) => (
            <Card key={s.id} className="card-hover">
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{s.full_name}</p>
                  <p className="text-xs text-muted-foreground">{s.class_name}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <BottomNav />
    </div>
  );
}
