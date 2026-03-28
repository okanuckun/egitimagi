import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Clock, AlertCircle, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface ClassItem { id: string; name: string; }
interface StudentItem { id: string; full_name: string; }
interface AttendanceRecord { id: string; student_id: string; status: string; }

const statusConfig = {
  present: { label: "Geldi", icon: CheckCircle, color: "text-success" },
  absent: { label: "Gelmedi", icon: XCircle, color: "text-destructive" },
  late: { label: "Geç Kaldı", icon: Clock, color: "text-warning" },
  excused: { label: "İzinli", icon: AlertCircle, color: "text-info" },
};

export default function TeacherAttendance() {
  const { user, role } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [existingRecords, setExistingRecords] = useState<AttendanceRecord[]>([]);
  const [date] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    if (!user) return;
    const fetchClasses = async () => {
      const isAdmin = role === "admin";
      const res = isAdmin
        ? await supabase.from("classes").select("id, name")
        : await supabase.from("classes").select("id, name").eq("teacher_id", user.id);
      setClasses(res.data || []);
    };
    fetchClasses();
  }, [user, role]);

  useEffect(() => {
    if (!selectedClass) return;
    const fetchStudents = async () => {
      const [studentsRes, attendanceRes] = await Promise.all([
        supabase.from("students").select("id, full_name").eq("class_id", selectedClass),
        supabase.from("attendance").select("id, student_id, status").eq("class_id", selectedClass).eq("date", date),
      ]);
      setStudents(studentsRes.data || []);
      setExistingRecords(attendanceRes.data || []);
      const existing: Record<string, string> = {};
      attendanceRes.data?.forEach((a) => { existing[a.student_id] = a.status; });
      setAttendance(existing);
    };
    fetchStudents();
  }, [selectedClass, date]);

  const toggleStatus = (studentId: string) => {
    const statuses = ["present", "absent", "late", "excused"];
    const current = attendance[studentId] || "present";
    const next = statuses[(statuses.indexOf(current) + 1) % statuses.length];
    setAttendance({ ...attendance, [studentId]: next });
  };

  const saveAttendance = async () => {
    if (!user || !selectedClass) return;
    const existingIds = existingRecords.map((r) => r.id);
    if (existingIds.length > 0) await supabase.from("attendance").delete().in("id", existingIds);
    const records = students.map((s) => ({
      student_id: s.id, class_id: selectedClass, date,
      status: attendance[s.id] || "present", teacher_id: user.id,
    }));
    const { error } = await supabase.from("attendance").insert(records);
    if (error) toast.error("Yoklama kaydedilemedi");
    else toast.success("Yoklama kaydedildi!");
  };

  return (
    <div className="page-container">
      <PageHeader title="Yoklama" subtitle={format(new Date(), "d MMMM yyyy, EEEE", { locale: tr })} />
      <Select value={selectedClass} onValueChange={setSelectedClass}>
        <SelectTrigger className="mb-4"><SelectValue placeholder="Sınıf seçin" /></SelectTrigger>
        <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
      </Select>
      {!selectedClass ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Yoklama almak için sınıf seçin</p>
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {students.map((s) => {
              const status = attendance[s.id] || "present";
              const config = statusConfig[status as keyof typeof statusConfig];
              const Icon = config.icon;
              return (
                <Card key={s.id} className="card-hover cursor-pointer" onClick={() => toggleStatus(s.id)}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{s.full_name[0]}</span>
                      </div>
                      <p className="font-medium text-sm">{s.full_name}</p>
                    </div>
                    <div className={`flex items-center gap-1 ${config.color}`}>
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-medium">{config.label}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {students.length > 0 && <Button className="w-full" onClick={saveAttendance}>Yoklamayı Kaydet</Button>}
        </>
      )}
      <BottomNav />
    </div>
  );
}
