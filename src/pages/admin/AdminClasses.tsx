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
import { Plus, GraduationCap } from "lucide-react";
import { toast } from "sonner";

export default function AdminClasses() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<{ user_id: string; full_name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", teacher_id: "" });

  const fetchData = async () => {
    const [clsRes, teacherRoles] = await Promise.all([
      supabase.from("classes").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id").eq("role", "teacher"),
    ]);

    if (clsRes.data) setClasses(clsRes.data);

    if (teacherRoles.data?.length) {
      const teacherIds = teacherRoles.data.map((r) => r.user_id);
      const profilesRes = await supabase.from("profiles").select("user_id, full_name").in("user_id", teacherIds);
      setTeachers(profilesRes.data || []);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("classes").insert({
      name: form.name,
      teacher_id: form.teacher_id,
    });
    if (error) toast.error("Sınıf oluşturulamadı: " + error.message);
    else {
      toast.success("Sınıf oluşturuldu!");
      setOpen(false);
      setForm({ name: "", teacher_id: "" });
      fetchData();
    }
  };

  return (
    <div className="page-container">
      <PageHeader title="Sınıflar" subtitle="Sınıf yönetimi" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full mb-4"><Plus className="w-4 h-4 mr-2" /> Yeni Sınıf</Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader><DialogTitle>Yeni Sınıf</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Sınıf Adı</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Ör: 3-A" />
            </div>
            <div className="space-y-2">
              <Label>Öğretmen</Label>
              <Select value={form.teacher_id} onValueChange={(v) => setForm({ ...form, teacher_id: v })}>
                <SelectTrigger><SelectValue placeholder="Öğretmen seçin" /></SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => <SelectItem key={t.user_id} value={t.user_id}>{t.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">Oluştur</Button>
          </form>
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
            <Card key={c.id} className="card-hover">
              <CardContent className="p-4">
                <h3 className="font-display font-semibold text-sm">{c.name}</h3>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      <BottomNav />
    </div>
  );
}
