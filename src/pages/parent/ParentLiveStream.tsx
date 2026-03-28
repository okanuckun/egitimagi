import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Radio, ArrowLeft } from "lucide-react";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import { toast } from "sonner";

interface LiveStream {
  id: string; title: string; room_name: string;
  class_id: string; teacher_id: string; status: string; started_at: string;
}

export default function ParentLiveStream() {
  const { user } = useAuth();
  const [activeStreams, setActiveStreams] = useState<LiveStream[]>([]);
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [livekitAvailable, setLivekitAvailable] = useState<boolean | null>(null);

  const fetchActiveStreams = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("live_streams" as Parameters<typeof supabase.from>[0])
      .select("*")
      .eq("status", "active");
    setActiveStreams((data as LiveStream[]) || []);
  };

  useEffect(() => {
    fetchActiveStreams();
    const channel = supabase.channel("live-streams-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_streams" }, () => {
        fetchActiveStreams();
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const joinStream = async (stream: LiveStream) => {
    try {
      const { data, error } = await supabase.functions.invoke("livekit-token", {
        body: { room_name: stream.room_name, identity: "Veli", is_publisher: false },
      });
      if (error) throw error;
      if (!data?.ws_url) { setLivekitAvailable(false); return; }
      setLivekitAvailable(true);
      setToken(data.token);
      setWsUrl(data.ws_url);
      setSelectedStream(stream);
    } catch {
      setLivekitAvailable(false);
      toast.error("Canlı yayın bağlantısı kurulamadı");
    }
  };

  const leaveStream = () => { setToken(null); setWsUrl(null); setSelectedStream(null); };

  if (livekitAvailable === false) {
    return (
      <div className="page-container">
        <PageHeader title="Canlı Yayınlar" subtitle="Aktif canlı dersleri izleyin" />
        <div className="text-center py-16">
          <Radio className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <p className="font-display font-semibold text-sm mb-2">Canlı yayın henüz aktif değil</p>
          <p className="text-xs text-muted-foreground">Bu özellik yakında kullanıma açılacak</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (token && selectedStream && wsUrl) {
    return (
      <div className="page-container pb-24">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-destructive animate-pulse" />
            <h1 className="text-lg font-display font-bold">{selectedStream.title}</h1>
          </div>
          <Button variant="outline" size="sm" onClick={leaveStream}><ArrowLeft className="w-4 h-4 mr-1" /> Ayrıl</Button>
        </div>
        <div className="rounded-xl overflow-hidden border border-border" style={{ height: "calc(100vh - 180px)" }}>
          <LiveKitRoom token={token} serverUrl={wsUrl} connect={true} onDisconnected={leaveStream} style={{ height: "100%" }}>
            <VideoConference />
          </LiveKitRoom>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="page-container pb-24">
      <PageHeader title="Canlı Yayınlar" subtitle="Aktif canlı dersleri izleyin" />
      {activeStreams.length === 0 ? (
        <div className="text-center py-12">
          <Radio className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-sm text-muted-foreground">Şu an aktif yayın yok</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeStreams.map((stream) => (
            <Card key={stream.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Radio className="w-4 h-4 text-destructive animate-pulse" />
                      <span className="font-medium text-sm">{stream.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(stream.started_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })} başladı
                    </p>
                  </div>
                  <Button size="sm" onClick={() => joinStream(stream)}>İzle</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <BottomNav />
    </div>
  );
}
