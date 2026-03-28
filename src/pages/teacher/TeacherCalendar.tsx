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
import { Calendar, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface CalendarEvent { id: string; title: string; description: string | null; event_date: string; event_time: string | null; class_id: string | null; author_id: string; event_type: string; created_at: string; }
interface ClassItem { id: string; name: string; }

const eventTypeLabels: Record<string, string> = {
  exam: "Sınav", meeting: "Toplantı", holiday: "Tatil", general: "Genel", homework: "Ödev",
};
const eventTypeColors: Record<string, string> = {
  exam: "bg-destructive/10 text-destructive", meeting: "bg-info/10 text-info",
  holiday: "bg-success/10 text-success", general: "bg-muted text-muted-foreground",
  homework: "bg-primary/10 text-primary",
};

export default function TeacherCalendar() {
  const { user, role } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", event_date: "", event_time: "", class_id: "", event_type: "general" });

  const fetchData = async () => {
    if (!user) return;
    const isAdmin = role === "admin";
    const [evRes, clsRes] = await Promise.all([
      supabase.from("events").select("*").order("event_date", { ascending: true }),
      isAdmin
        ? supabase.from("classes").select("id, name")
        : supabase.from("classes").select("id, name").eq("teacher_id", user.id),
    ]);
    setEvents((evRes.data as CalendarEvent[]) || []);
    setClasses(clsRes.data || []);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("events").insert({
      title: form.title, description: form.description || null,
      event_date: form.event_date, event_time: form.event_time || null,
      class_id: form.class_id || null, author_id: user.id, event_type: form.event_type,
    });
    if (error) toast.error("Etkinlik oluşturulamadı");
    else {
      toast.success("Etkinlik oluşturuldu!");
      setOpen(false);
      setForm({ title: "", description: "", event_date: "", event_time: "", class_id: "", event_type: "general" });
      fetchData();
    }
  };

  return (
    <div className="page-container">
      <PageHeader title="Takvim" subtitle="Etkinlikler ve planlar" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full mb-4"><Plus className="w-4 h-4 mr-2" /> Yeni Etkinlik</Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader><DialogTitle>Yeni Etkinlik</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Tür</Label>
              <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(eventTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Başlık</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Tarih</Label>
              <Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Saat (opsiyonel)</Label>
              <Input type="time" value={form.event_time} onChange={(e) => setForm({ ...form, event_time: e.target.value })} />
            </div>
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
              <Label>Açıklama (opsiyonel)</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <Button type="submit" className="w-full">Oluştur</Button>
          </form>
        </DialogContent>
      </Dialog>
      <div className="space-y-2">
        {events.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Henüz etkinlik yok</p>
          </div>
        ) : events.map((ev) => (
          <Card key={ev.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${eventTypeColors[ev.event_type] || ""}`}>
                      {eventTypeLabels[ev.event_type] || ev.event_type}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-sm">{ev.title}</h3>
                  {ev.description && <p className="text-xs text-muted-foreground mt-1">{ev.description}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium">{format(new Date(ev.event_date), "d MMM", { locale: tr })}</p>
                  {ev.event_time && <p className="text-[10px] text-muted-foreground">{ev.event_time.slice(0, 5)}</p>}
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
