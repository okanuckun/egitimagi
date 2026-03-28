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

interface ClassItem { id: string; name: string; }
interface FileEntry {
  name: string; fullPath: string; folder: string | null;
  created_at: string | undefined; size: number | undefined;
}

export default function TeacherFiles() {
  const { user, role } = useAuth();
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
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

    const { data: topLevel } = await supabase.storage.from("education-files").list(user.id, { limit: 100 });
    const result: FileEntry[] = [];

    for (const item of topLevel || []) {
      if (!item.id) {
        const { data: contents } = await supabase.storage
          .from("education-files")
          .list(`${user.id}/${item.name}`, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
        for (const file of contents || []) {
          if (file.id) {
            result.push({
              name: file.name, fullPath: `${user.id}/${item.name}/${file.name}`,
              folder: item.name, created_at: file.created_at ?? undefined,
              size: (file.metadata as { size?: number } | null)?.size,
            });
          }
        }
      } else {
        result.push({
          name: item.name, fullPath: `${user.id}/${item.name}`,
          folder: null, created_at: item.created_at ?? undefined,
          size: (item.metadata as { size?: number } | null)?.size,
        });
      }
    }
    result.sort((a, b) => (!a.created_at ? 1 : !b.created_at ? -1 : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    setFiles(result);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const filePath = `${user.id}/${selectedClass || "general"}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("education-files").upload(filePath, file);
    if (error) toast.error("Dosya yüklenemedi: " + error.message);
    else { toast.success("Dosya yüklendi!"); setOpen(false); setSelectedClass(""); fetchData(); }
    setUploading(false);
    e.target.value = "";
  };

  const downloadFile = async (fullPath: string, fileName: string) => {
    const { data } = await supabase.storage.from("education-files").createSignedUrl(fullPath, 3600);
    if (data?.signedUrl) {
      const a = document.createElement("a");
      a.href = data.signedUrl; a.download = fileName; a.target = "_blank"; a.click();
    }
  };

  const deleteFile = async (fullPath: string) => {
    const { error } = await supabase.storage.from("education-files").remove([fullPath]);
    if (error) toast.error("Silinemedi"); else { toast.success("Dosya silindi"); fetchData(); }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const getFolderLabel = (folderId: string | null) => {
    if (!folderId || folderId === "general") return "Genel";
    return classes.find((c) => c.id === folderId)?.name || folderId;
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
                <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
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
        ) : files.map((f) => (
          <Card key={f.fullPath}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{f.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {getFolderLabel(f.folder)}{f.size ? ` • ${formatSize(f.size)}` : ""}
                    {f.created_at ? ` • ${format(new Date(f.created_at), "d MMM", { locale: tr })}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => downloadFile(f.fullPath, f.name)}><Download className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => deleteFile(f.fullPath)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
