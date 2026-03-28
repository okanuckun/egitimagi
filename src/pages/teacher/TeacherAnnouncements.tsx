import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Bell } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function TeacherAnnouncements() {
  const { user, role } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", class_id: "" });

  const fetchData = async () => {
    if (!user) return;
    const isAdmin = role === "admin";
    const [annRes, clsRes] = await Promise.all([
      isAdmin
        ? supabase.from("announcements").select("*").order("created_at", { ascending: false })
        : supabase.from("announcements").select("*").eq("author_id", user.id).order("created_at", { ascending: false }),
      isAdmin
        ? supabase.from("classes").select("id, name")
        : supabase.from("classes").select("id, name").eq("teacher_id", user.id),
    ]);
    if (annRes.data) setAnnouncements(annRes.data);
    if (clsRes.data) setClasses(clsRes.data);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("announcements").insert({
      title: form.title,
      content: form.content,
      class_id: form.class_id || null,
      author_id: user.id,
    });
    if (error) toast.error("Duyuru oluşturulamadı");
    else {
      toast.success("Duyuru paylaşıldı!");
      setOpen(false);
      setForm({ title: "", content: "", class_id: "" });
      fetchData();
    }
  };

  return (
    <div className="page-container">
      <PageHeader title="Duyurular" subtitle="Sınıf duyuruları" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full mb-4"><Plus className="w-4 h-4 mr-2" /> Yeni Duyuru</Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader><DialogTitle>Yeni Duyuru</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Sınıf (opsiyonel)</Label>
              <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v })}>
                <SelectTrigger><SelectValue placeholder="Tüm sınıflar" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Başlık</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>İçerik</Label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required rows={3} />
            </div>
            <Button type="submit" className="w-full">Paylaş</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {announcements.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Henüz duyuru yok</p>
          </div>
        )}
        {announcements.map((a) => (
          <Card key={a.id}>
            <CardContent className="p-4">
              <h3 className="font-display font-semibold text-sm">{a.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{a.content}</p>
              <p className="text-[10px] text-muted-foreground mt-2">
                {format(new Date(a.created_at), "d MMM yyyy", { locale: tr })}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
