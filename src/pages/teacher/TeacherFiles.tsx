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
import { Upload, FileText, Download, Trash2, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function TeacherFiles() {
  const { user, role } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const isAdmin = role === "admin";
    const clsRes = isAdmin
      ? await supabase.from("classes").select("id, name")
      : await supabase.from("classes").select("id, name").eq("teacher_id", user.id);
    setClasses(clsRes.data || []);

    // List files from storage
    const { data } = await supabase.storage.from("education-files").list(user.id, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    setFiles(data || []);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    
    const filePath = `${user.id}/${selectedClass || "general"}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("education-files").upload(filePath, file);
    
    if (error) toast.error("Dosya yüklenemedi");
    else {
      toast.success("Dosya yüklendi!");
      setOpen(false);
      fetchData();
    }
    setUploading(false);
  };

  const downloadFile = async (fileName: string) => {
    if (!user) return;
    const { data } = await supabase.storage.from("education-files").createSignedUrl(`${user.id}/${fileName}`, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const deleteFile = async (fileName: string) => {
    if (!user) return;
    await supabase.storage.from("education-files").remove([`${user.id}/${fileName}`]);
    toast.success("Dosya silindi");
    fetchData();
  };

  return (
    <div className="page-container">
      <PageHeader title="Dosyalar" subtitle="Ders materyalleri" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full mb-4"><Upload className="w-4 h-4 mr-2" /> Dosya Yükle</Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader><DialogTitle>Dosya Yükle</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sınıf (opsiyonel)</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger><SelectValue placeholder="Genel" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dosya</Label>
              <Input type="file" onChange={handleUpload} disabled={uploading} />
              {uploading && <p className="text-xs text-muted-foreground">Yükleniyor...</p>}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        {files.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Henüz dosya yok</p>
          </div>
        ) : (
          files.map((f) => (
            <Card key={f.name}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <FileText className="w-5 h-5 text-primary shrink-0" />
                  <p className="text-sm font-medium truncate">{f.name}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => downloadFile(f.name)}>
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteFile(f.name)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
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
