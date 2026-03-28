import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, VideoOff, Radio } from "lucide-react";
import { toast } from "sonner";
import {
  LiveKitRoom,
  VideoConference,
} from "@livekit/components-react";
import "@livekit/components-styles";

export default function TeacherLiveStream() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [title, setTitle] = useState("Canlı Ders");
  const [token, setToken] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const isAdmin = role === "admin";

  useEffect(() => {
    if (!user) return;
    const fetchClasses = async () => {
      const res = isAdmin
        ? await supabase.from("classes").select("*")
        : await supabase.from("classes").select("*").eq("teacher_id", user.id);
      if (res.data) setClasses(res.data);
    };
    fetchClasses();
  }, [user, isAdmin]);

  const startStream = async () => {
    if (!selectedClassId || !user) {
      toast.error("Lütfen bir sınıf seçin");
      return;
    }

    setIsConnecting(true);
    try {
      const roomName = `class-${selectedClassId}-${Date.now()}`;

      // Create stream record
      const { data: stream, error: streamError } = await supabase
        .from("live_streams" as any)
        .insert({
          teacher_id: user.id,
          class_id: selectedClassId,
          room_name: roomName,
          title,
          status: "active",
        } as any)
        .select()
        .single();

      if (streamError) throw streamError;
      setActiveStreamId((stream as any).id);

      // Get LiveKit token
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke(
        "livekit-token",
        {
          body: {
            room_name: roomName,
            identity: "Öğretmen",
            is_publisher: true,
          },
        }
      );

      if (tokenError) throw tokenError;

      // Get WS URL from env
      const { data: configData } = await supabase.functions.invoke("livekit-token", {
        body: { room_name: "__config__", identity: "__config__", get_ws_url: true },
      });

      setToken(tokenData.token);
      // WS URL will be set from the edge function or use env
      const envWsUrl = import.meta.env.VITE_LIVEKIT_WS_URL;
      setWsUrl(envWsUrl || null);

      toast.success("Yayın başlatılıyor...");
    } catch (error: any) {
      toast.error("Yayın başlatılamadı: " + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const stopStream = async () => {
    if (activeStreamId) {
      await supabase
        .from("live_streams" as any)
        .update({ status: "ended", ended_at: new Date().toISOString() } as any)
        .eq("id", activeStreamId);
    }
    setToken(null);
    setWsUrl(null);
    setActiveStreamId(null);
    toast.success("Yayın sonlandırıldı");
  };

  if (token && wsUrl) {
    return (
      <div className="page-container pb-24">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-destructive animate-pulse" />
            <h1 className="text-lg font-display font-bold">Canlı Yayın</h1>
          </div>
          <Button variant="destructive" size="sm" onClick={stopStream}>
            <VideoOff className="w-4 h-4 mr-1" />
            Yayını Bitir
          </Button>
        </div>
        <div className="rounded-xl overflow-hidden border border-border" style={{ height: "calc(100vh - 180px)" }}>
          <LiveKitRoom
            token={token}
            serverUrl={wsUrl}
            connect={true}
            onDisconnected={stopStream}
            style={{ height: "100%" }}
          >
            <VideoConference />
          </LiveKitRoom>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="page-container pb-24">
      <PageHeader title="Canlı Yayın" subtitle="Sınıfınız için canlı ders başlatın" />

      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Sınıf</label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Sınıf seçin" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Yayın Başlığı</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ör: Matematik Canlı Ders"
            />
          </div>

          <Button
            onClick={startStream}
            disabled={!selectedClassId || isConnecting}
            className="w-full"
          >
            <Video className="w-4 h-4 mr-2" />
            {isConnecting ? "Bağlanıyor..." : "Yayını Başlat"}
          </Button>
        </CardContent>
      </Card>
      <BottomNav />
    </div>
  );
}
