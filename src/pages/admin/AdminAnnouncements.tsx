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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Bell } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function AdminAnnouncements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "" });

  const fetchData = async () => {
    const res = await supabase.from("announcements").select("*").is("class_id", null).order("created_at", { ascending: false });
    if (res.data) setAnnouncements(res.data);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("announcements").insert({
      title: form.title,
      content: form.content,
      author_id: user.id,
      class_id: null,
    });
    if (error) toast.error("Duyuru oluşturulamadı");
    else {
      toast.success("Genel duyuru paylaşıldı!");
      setOpen(false);
      setForm({ title: "", content: "" });
      fetchData();
    }
  };

  return (
    <div className="page-container">
      <PageHeader title="Duyurular" subtitle="Okul geneli duyurular" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full mb-4"><Plus className="w-4 h-4 mr-2" /> Yeni Duyuru</Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader><DialogTitle>Genel Duyuru</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
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
        {announcements.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Henüz duyuru yok</p>
          </div>
        ) : (
          announcements.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                <h3 className="font-display font-semibold text-sm">{a.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{a.content}</p>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {format(new Date(a.created_at), "d MMM yyyy", { locale: tr })}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      <BottomNav />
    </div>
  );
}
