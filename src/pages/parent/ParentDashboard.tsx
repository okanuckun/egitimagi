import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, CheckCircle, Star, XCircle } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function ParentDashboard() {
  const { user, profile } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [recentHomework, setRecentHomework] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const studentsRes = await supabase.from("students").select("id, full_name, class_id").eq("parent_id", user.id);
      setChildren(studentsRes.data || []);

      if (studentsRes.data?.length) {
        const classIds = studentsRes.data.map((s) => s.class_id);
        const hwRes = await supabase
          .from("homework")
          .select("*")
          .in("class_id", classIds)
          .order("due_date", { ascending: false })
          .limit(5);
        setRecentHomework(hwRes.data || []);
      }
    };
    fetch();
  }, [user]);

  return (
    <div className="page-container">
      <PageHeader
        title={`Merhaba, ${profile?.full_name || "Veli"} 👋`}
        subtitle="Veli Paneli"
      />

      {children.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-display font-semibold mb-2">Çocuklarınız</h2>
          <div className="flex gap-2">
            {children.map((c) => (
              <Card key={c.id} className="flex-1">
                <CardContent className="p-3 text-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1">
                    <span className="text-primary font-bold text-sm">{c.full_name[0]}</span>
                  </div>
                  <p className="text-xs font-medium truncate">{c.full_name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-sm font-display font-semibold mb-2">Son Ödevler</h2>
      <div className="space-y-3">
        {recentHomework.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Henüz ödev bulunmuyor</p>
          </div>
        ) : (
          recentHomework.map((hw) => (
            <Card key={hw.id} className="card-hover">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-display font-semibold text-sm">{hw.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{hw.subject}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(hw.due_date), "d MMM", { locale: tr })}
                  </span>
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
