import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface StudentItem { id: string; full_name: string; class_id: string; }
interface HomeworkItem {
  id: string; title: string; subject: string; due_date: string; class_id: string;
}

export default function ParentDashboard() {
  const { user, profile } = useAuth();
  const [children, setChildren] = useState<StudentItem[]>([]);
  const [recentHomework, setRecentHomework] = useState<HomeworkItem[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const studentsRes = await supabase.from("students").select("id, full_name, class_id").eq("parent_id", user.id);
      setChildren(studentsRes.data || []);
      if (studentsRes.data?.length) {
        const classIds = studentsRes.data.map((s) => s.class_id);
        const hwRes = await supabase.from("homework").select("id, title, subject, due_date, class_id")
          .in("class_id", classIds).order("due_date", { ascending: false }).limit(5);
        setRecentHomework(hwRes.data || []);
      }
    };
    fetchData();
  }, [user]);

  return (
    <div className="page-container">
      <PageHeader title={`Merhaba, ${profile?.full_name || "Veli"} 👋`} subtitle="Veli Paneli" />
      {children.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Henüz bir çocuk hesabınıza bağlanmamış</p>
          <p className="text-xs mt-1">Okul yöneticinizle iletişime geçin</p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-sm font-display font-semibold text-muted-foreground mb-2">Çocuklarım</p>
            <div className="flex gap-2 flex-wrap">
              {children.map((c) => (
                <div key={c.id} className="flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1.5">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary-foreground">{c.full_name[0]}</span>
                  </div>
                  <span className="text-sm font-medium">{c.full_name}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-sm font-display font-semibold text-muted-foreground mb-2">Son Ödevler</p>
          <div className="space-y-2">
            {recentHomework.map((hw) => (
              <Card key={hw.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-sm">{hw.title}</h3>
                    <p className="text-xs text-muted-foreground">{hw.subject}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{format(new Date(hw.due_date), "d MMM", { locale: tr })}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
      <BottomNav />
    </div>
  );
}
