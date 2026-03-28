import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, UserRound, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Student {
  id: string;
  full_name: string;
  class_id: string;
  parent_id: string | null;
  created_at: string;
}

export default function AdminClassDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [className, setClassName] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [newName, setNewName] = useState("");
  const [editName, setEditName] = useState("");

  const fetchData = async () => {
    if (!id) return;
    const [clsRes, studRes] = await Promise.all([
      supabase.from("classes").select("name").eq("id", id).single(),
      supabase.from("students").select("*").eq("class_id", id).order("full_name"),
    ]);
    if (clsRes.data) setClassName(clsRes.data.name);
    if (studRes.data) setStudents(studRes.data);
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const { error } = await supabase.from("students").insert({ full_name: newName, class_id: id });
    if (error) toast.error("Eklenemedi: " + error.message);
    else {
      toast.success("Öğrenci eklendi!");
      setAddOpen(false);
      setNewName("");
      fetchData();
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;
    const { error } = await supabase.from("students").update({ full_name: editName }).eq("id", editStudent.id);
    if (error) toast.error("Güncellenemedi: " + error.message);
    else {
      toast.success("Öğrenci güncellendi!");
      setEditOpen(false);
      setEditStudent(null);
      fetchData();
    }
  };

  const handleDelete = async (student: Student) => {
    if (!confirm(`"${student.full_name}" öğrencisini silmek istediğinize emin misiniz?`)) return;
    const { error } = await supabase.from("students").delete().eq("id", student.id);
    if (error) toast.error("Silinemedi: " + error.message);
    else {
      toast.success("Öğrenci silindi!");
      fetchData();
    }
  };

  const openEditDialog = (s: Student) => {
    setEditStudent(s);
    setEditName(s.full_name);
    setEditOpen(true);
  };

  return (
    <div className="page-container">
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => navigate("/admin/classes")} className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <PageHeader title={className || "Sınıf"} subtitle={`${students.length} öğrenci`} />
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogTrigger asChild>
          <Button className="w-full mb-4"><Plus className="w-4 h-4 mr-2" /> Öğrenci Ekle</Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader><DialogTitle>Yeni Öğrenci</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label>Ad Soyad</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="Ör: Ali Yılmaz" />
            </div>
            <Button type="submit" className="w-full">Ekle</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader><DialogTitle>Öğrenciyi Düzenle</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>Ad Soyad</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full">Güncelle</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        {students.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <UserRound className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Bu sınıfta henüz öğrenci yok</p>
          </div>
        ) : (
          students.map((s) => (
            <Card key={s.id} className="card-hover">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserRound className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{s.full_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {s.parent_id ? "Veli bağlı" : "Veli atanmamış"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => openEditDialog(s)}
                    className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(s)}
                    className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
