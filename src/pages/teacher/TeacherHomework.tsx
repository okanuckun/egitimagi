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
import { Plus, Calendar, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const subjects = ["Matematik", "Türkçe", "Fen Bilimleri", "Sosyal Bilgiler", "İngilizce", "Hayat Bilgisi", "Müzik", "Beden Eğitimi", "Görsel Sanatlar"];

interface Homework {
  id: string;
  title: string;
  subject: string;
  due_date: string;
  description: string | null;
  class_id: string;
}

interface ClassItem {
  id: string;
  name: string;
}

export default function TeacherHomework() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [homework, setHomework] = useState<Homework[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", subject: "", due_date: "", class_id: "" });

  const fetchData = async () => {
    if (!user) return;
    const isAdmin = role === "admin";
    const [hwRes, clsRes] = await Promise.all([
      isAdmin
        ? supabase.from("homework").select("*").order("due_date", { ascending: false })
        : supabase.from("homework").select("*").eq("teacher_id", user.id).order("due_date", { ascending: false }),
      isAdmin
        ? supabase.from("classes").select("id, name")
        : supabase.from("classes").select("id, name").eq("teacher_id", user.id),
    ]);
    if (hwRes.data) setHomework(hwRes.data);
    if (clsRes.data) setClasses(clsRes.data);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("homework").insert({
      title: form.title,
      description: form.description || null,
      subject: form.subject,
      due_date: form.due_date,
      class_id: form.class_id,
      teacher_id: user.id,
    });
    if (error) {
      toast.error("Ödev oluşturulamadı: " + error.message);
    } else {
      toast.success("Ödev başarıyla oluşturuldu!");
      setOpen(false);
      setForm({ title: "", description: "", subject: "", due_date: "", class_id: "" });
      fetchData();
    }
  };

  return (
    <div className="page-container">
      <PageHeader title="Ödevler" subtitle="Ödev oluştur ve yönet" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full mb-4">
            <Plus className="w-4 h-4 mr-2" /> Yeni Ödev Oluştur
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Yeni Ödev</DialogTitle>
          </DialogHeader>
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
              <Label>Başlık</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Ödev başlığı" />
            </div>
            <div className="space-y-2">
              <Label>Ders</Label>
              <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                <SelectTrigger><SelectValue placeholder="Ders seçin" /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Son Teslim Tarihi</Label>
              <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ödev detayları..." rows={3} />
            </div>
            <Button type="submit" className="w-full">Oluştur</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {homework.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Henüz ödev bulunmuyor</p>
          </div>
        )}
        {homework.map((hw) => (
          <Card key={hw.id} className="card-hover cursor-pointer" onClick={() => navigate(`/teacher/homework/${hw.id}`)}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-sm">{hw.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{hw.subject}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(hw.due_date), "d MMM", { locale: tr })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
