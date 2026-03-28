import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface StudentWithClass {
  id: string;
  full_name: string;
  class_id: string;
  class_name: string;
}

export default function TeacherStudents() {
  const { user, role } = useAuth();
  const [students, setStudents] = useState<StudentWithClass[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", class_id: "" });
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const isAdmin = role === "admin";
    const classesRes = isAdmin
      ? await supabase.from("classes").select("id, name")
      : await supabase.from("classes").select("id, name").eq("teacher_id", user.id);
    if (!classesRes.data?.length) return;
    setClasses(classesRes.data);

    const classMap = new Map(classesRes.data.map((c) => [c.id, c.name]));
    const studentsRes = await supabase.from("students").select("*").in("class_id", classesRes.data.map((c) => c.id));
    setStudents(
      (studentsRes.data || []).map((s) => ({
        id: s.id,
        full_name: s.full_name,
        class_id: s.class_id,
        class_name: classMap.get(s.class_id) || "",
      }))
    );
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("students").insert({
      full_name: form.full_name,
      class_id: form.class_id,
    });
    if (error) {
      toast.error("Öğrenci eklenemedi: " + error.message);
    } else {
      toast.success("Öğrenci eklendi!");
      setOpen(false);
      setForm({ full_name: "", class_id: "" });
      fetchData();
    }
    setLoading(false);
  };

  // Group students by class
  const studentsByClass = classes.map((c) => ({
    ...c,
    students: students.filter((s) => s.class_id === c.id),
  }));

  return (
    <div className="page-container">
      <PageHeader title="Öğrenciler" subtitle="Sınıflarınızdaki öğrenciler" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full mb-4" disabled={classes.length === 0}>
            <UserPlus className="w-4 h-4 mr-2" /> Öğrenci Ekle
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader><DialogTitle>Yeni Öğrenci Ekle</DialogTitle></DialogHeader>
          <form onSubmit={handleAddStudent} className="space-y-4">
            <div className="space-y-2">
              <Label>Öğrenci Adı Soyadı</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
                placeholder="Ör: Ali Yılmaz"
              />
            </div>
            <div className="space-y-2">
              <Label>Sınıf</Label>
              <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v })}>
                <SelectTrigger><SelectValue placeholder="Sınıf seçin" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={loading || !form.class_id}>
              {loading ? "Ekleniyor..." : "Ekle"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {studentsByClass.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Henüz sınıfınız yok</p>
        </div>
      ) : (
        <div className="space-y-5">
          {studentsByClass.map((cls) => (
            <div key={cls.id}>
              <h3 className="text-sm font-display font-semibold text-muted-foreground mb-2 px-1">{cls.name}</h3>
              {cls.students.length === 0 ? (
                <Card>
                  <CardContent className="p-4 text-center text-muted-foreground text-sm">
                    Bu sınıfta henüz öğrenci yok
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {cls.students.map((s) => (
                    <Card key={s.id} className="card-hover">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">
                            {s.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <p className="font-medium text-sm">{s.full_name}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <BottomNav />
    </div>
  );
}
