import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, FileQuestion, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function TeacherQuizzes() {
  const { user, role } = useAuth();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", class_id: "", subject: "", duration_minutes: "30" });
  const navigate = useNavigate();

  const fetchData = async () => {
    if (!user) return;
    const isAdmin = role === "admin";
    const [qRes, clsRes] = await Promise.all([
      isAdmin
        ? supabase.from("quizzes").select("*").order("created_at", { ascending: false })
        : supabase.from("quizzes").select("*").eq("teacher_id", user.id).order("created_at", { ascending: false }),
      isAdmin
        ? supabase.from("classes").select("id, name")
        : supabase.from("classes").select("id, name").eq("teacher_id", user.id),
    ]);
    setQuizzes(qRes.data || []);
    setClasses(clsRes.data || []);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("quizzes").insert({
      title: form.title,
      description: form.description || null,
      class_id: form.class_id,
      teacher_id: user.id,
      subject: form.subject,
      duration_minutes: parseInt(form.duration_minutes) || 30,
    });
    if (error) toast.error("Quiz oluşturulamadı");
    else {
      toast.success("Quiz oluşturuldu!");
      setOpen(false);
      setForm({ title: "", description: "", class_id: "", subject: "", duration_minutes: "30" });
      fetchData();
    }
  };

  const toggleActive = async (quizId: string, currentState: boolean) => {
    await supabase.from("quizzes").update({ is_active: !currentState }).eq("id", quizId);
    fetchData();
  };

  const getClassName = (classId: string) => classes.find((c) => c.id === classId)?.name || "";

  return (
    <div className="page-container">
      <PageHeader title="Quizler" subtitle="Online sınav ve testler" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full mb-4" disabled={classes.length === 0}>
            <Plus className="w-4 h-4 mr-2" /> Yeni Quiz
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader><DialogTitle>Yeni Quiz Oluştur</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Sınıf</Label>
              <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v })}>
                <SelectTrigger><SelectValue placeholder="Sınıf seçin" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ders</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required placeholder="Ör: Matematik" />
            </div>
            <div className="space-y-2">
              <Label>Başlık</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Süre (dakika)</Label>
              <Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <Button type="submit" className="w-full" disabled={!form.class_id}>Oluştur</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {quizzes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileQuestion className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Henüz quiz yok</p>
          </div>
        ) : (
          quizzes.map((q) => (
            <Card key={q.id} className="card-hover cursor-pointer" onClick={() => navigate(`/teacher/quizzes/${q.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-sm">{q.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{q.subject} • {getClassName(q.class_id)}</p>
                    <p className="text-xs text-muted-foreground">{q.duration_minutes} dakika</p>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] text-muted-foreground">{q.is_active ? "Aktif" : "Pasif"}</span>
                    <Switch checked={q.is_active} onCheckedChange={() => toggleActive(q.id, q.is_active)} />
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
