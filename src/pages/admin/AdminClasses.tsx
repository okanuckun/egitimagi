import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, GraduationCap, Pencil, Trash2, Users, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface ClassWithCount {
  id: string;
  name: string;
  teacher_id: string;
  created_at: string;
  student_count: number;
  teacher_name?: string;
}

export default function AdminClasses() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassWithCount[]>([]);
  const [teachers, setTeachers] = useState<{ user_id: string; full_name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editClass, setEditClass] = useState<ClassWithCount | null>(null);
  const [form, setForm] = useState({ name: "", teacher_id: "" });
  const [editForm, setEditForm] = useState({ name: "", teacher_id: "" });

  const fetchData = async () => {
    const [clsRes, teacherRoles, studentsRes] = await Promise.all([
      supabase.from("classes").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id").eq("role", "teacher"),
      supabase.from("students").select("id, class_id"),
    ]);

    let teacherList: { user_id: string; full_name: string }[] = [];
    if (teacherRoles.data?.length) {
      const teacherIds = teacherRoles.data.map((r) => r.user_id);
      const profilesRes = await supabase.from("profiles").select("user_id, full_name").in("user_id", teacherIds);
      teacherList = profilesRes.data || [];
      setTeachers(teacherList);
    }

    if (clsRes.data) {
      const studentCounts: Record<string, number> = {};
      studentsRes.data?.forEach((s) => {
        studentCounts[s.class_id] = (studentCounts[s.class_id] || 0) + 1;
      });

      setClasses(
        clsRes.data.map((c) => ({
          ...c,
          student_count: studentCounts[c.id] || 0,
          teacher_name: teacherList.find((t) => t.user_id === c.teacher_id)?.full_name || "—",
        }))
      );
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("classes").insert({ name: form.name, teacher_id: form.teacher_id });
    if (error) toast.error("Sınıf oluşturulamadı: " + error.message);
    else {
      toast.success("Sınıf oluşturuldu!");
      setOpen(false);
      setForm({ name: "", teacher_id: "" });
      fetchData();
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClass) return;
    const { error } = await supabase.from("classes").update({ name: editForm.name, teacher_id: editForm.teacher_id }).eq("id", editClass.id);
    if (error) toast.error("Güncellenemedi: " + error.message);
    else {
      toast.success("Sınıf güncellendi!");
      setEditOpen(false);
      setEditClass(null);
      fetchData();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" sınıfını silmek istediğinize emin misiniz?`)) return;
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (error) toast.error("Silinemedi: " + error.message);
    else {
      toast.success("Sınıf silindi!");
      fetchData();
    }
  };

  const openEdit = (c: ClassWithCount) => {
    setEditClass(c);
    setEditForm({ name: c.name, teacher_id: c.teacher_id });
    setEditOpen(true);
  };

  const ClassForm = ({ formState, setFormState, onSubmit, submitLabel }: {
    formState: { name: string; teacher_id: string };
    setFormState: (f: { name: string; teacher_id: string }) => void;
    onSubmit: (e: React.FormEvent) => void;
    submitLabel: string;
  }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Sınıf Adı</Label>
        <Input value={formState.name} onChange={(e) => setFormState({ ...formState, name: e.target.value })} required placeholder="Ör: 3-A" />
      </div>
      <div className="space-y-2">
        <Label>Öğretmen</Label>
        <Select value={formState.teacher_id} onValueChange={(v) => setFormState({ ...formState, teacher_id: v })}>
          <SelectTrigger><SelectValue placeholder="Öğretmen seçin" /></SelectTrigger>
          <SelectContent>
            {teachers.map((t) => <SelectItem key={t.user_id} value={t.user_id}>{t.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full">{submitLabel}</Button>
    </form>
  );

  return (
    <div className="page-container">
      <PageHeader title="Sınıflar" subtitle="Sınıf yönetimi" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full mb-4"><Plus className="w-4 h-4 mr-2" /> Yeni Sınıf</Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader><DialogTitle>Yeni Sınıf</DialogTitle></DialogHeader>
          <ClassForm formState={form} setFormState={setForm} onSubmit={handleCreate} submitLabel="Oluştur" />
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader><DialogTitle>Sınıfı Düzenle</DialogTitle></DialogHeader>
          <ClassForm formState={editForm} setFormState={setEditForm} onSubmit={handleEdit} submitLabel="Güncelle" />
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {classes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Henüz sınıf yok</p>
          </div>
        ) : (
          classes.map((c) => (
            <Card key={c.id} className="card-hover cursor-pointer" onClick={() => navigate(`/admin/classes/${c.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-sm text-foreground">{c.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.teacher_name}</p>
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      <span>{c.student_count} öğrenci</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(c); }}
                      className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(c.id, c.name); }}
                      className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      <BottomNav />
    </div>
  );
}
