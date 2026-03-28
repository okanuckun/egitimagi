import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, AlertCircle, Calendar } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const statusConfig = {
  present: { label: "Geldi", icon: CheckCircle, color: "text-success" },
  absent: { label: "Gelmedi", icon: XCircle, color: "text-destructive" },
  late: { label: "Geç Kaldı", icon: Clock, color: "text-warning" },
  excused: { label: "İzinli", icon: AlertCircle, color: "text-info" },
};

export default function ParentAttendance() {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: students } = await supabase
        .from("students")
        .select("id, full_name, class_id")
        .eq("parent_id", user.id);
      setChildren(students || []);

      if (students?.length) {
        const { data: att } = await supabase
          .from("attendance")
          .select("*")
          .in("student_id", students.map((s) => s.id))
          .order("date", { ascending: false })
          .limit(30);
        setRecords(att || []);
      }
    };
    fetchData();
  }, [user]);

  const getStudentName = (studentId: string) => children.find((c) => c.id === studentId)?.full_name || "";

  return (
    <div className="page-container">
      <PageHeader title="Devamsızlık" subtitle="Son 30 gün" />
      <div className="space-y-2">
        {records.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Yoklama kaydı yok</p>
          </div>
        ) : (
          records.map((r) => {
            const config = statusConfig[r.status as keyof typeof statusConfig] || statusConfig.present;
            const Icon = config.icon;
            return (
              <Card key={r.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{getStudentName(r.student_id)}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(r.date), "d MMMM yyyy, EEEE", { locale: tr })}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 ${config.color}`}>
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-medium">{config.label}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
      <BottomNav />
    </div>
  );
}
