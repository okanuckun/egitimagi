import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface CalendarEvent {
  id: string; title: string; description: string | null;
  event_date: string; event_time: string | null;
  class_id: string | null; author_id: string; event_type: string; created_at: string;
}

const eventTypeLabels: Record<string, string> = {
  exam: "Sınav", meeting: "Toplantı", holiday: "Tatil", general: "Genel", homework: "Ödev",
};
const eventTypeColors: Record<string, string> = {
  exam: "bg-destructive/10 text-destructive", meeting: "bg-info/10 text-info",
  holiday: "bg-success/10 text-success", general: "bg-muted text-muted-foreground",
  homework: "bg-primary/10 text-primary",
};

export default function ParentCalendar() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchEvents = async () => {
      const { data } = await supabase.from("events").select("*").order("event_date", { ascending: true });
      setEvents((data as CalendarEvent[]) || []);
    };
    fetchEvents();
  }, [user]);

  return (
    <div className="page-container">
      <PageHeader title="Takvim" subtitle="Etkinlikler ve önemli tarihler" />
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
                <div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${eventTypeColors[ev.event_type] || ""}`}>
                    {eventTypeLabels[ev.event_type] || ev.event_type}
                  </span>
                  <h3 className="font-display font-semibold text-sm mt-1">{ev.title}</h3>
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
