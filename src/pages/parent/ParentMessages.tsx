import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Contact { user_id: string; full_name: string; }
interface Message {
  id: string; sender_id: string; receiver_id: string;
  content: string; read_at: string | null; created_at: string;
}

export default function ParentMessages() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchContacts = async () => {
      const { data: students } = await supabase.from("students").select("class_id").eq("parent_id", user.id);
      if (!students?.length) return;
      const { data: classes } = await supabase.from("classes").select("teacher_id").in("id", students.map((s) => s.class_id));
      if (!classes?.length) return;
      const teacherIds = [...new Set(classes.map((c) => c.teacher_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", teacherIds);
      setContacts((profiles || []).map((p) => ({ user_id: p.user_id, full_name: p.full_name || "Öğretmen" })));
    };
    fetchContacts();
  }, [user]);

  const fetchMessages = async (contactId: string) => {
    if (!user) return;
    const { data } = await supabase.from("messages").select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });
    setMessages((data as Message[]) || []);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    await supabase.from("messages").update({ read_at: new Date().toISOString() })
      .eq("sender_id", contactId).eq("receiver_id", user.id).is("read_at", null);
  };

  useEffect(() => {
    if (!selectedContact || !user) return;
    fetchMessages(selectedContact.user_id);
    const channel = supabase.channel("parent-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as Message;
        if (
          (msg.sender_id === user.id && msg.receiver_id === selectedContact.user_id) ||
          (msg.sender_id === selectedContact.user_id && msg.receiver_id === user.id)
        ) {
          setMessages((prev) => [...prev, msg]);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedContact, user]);

  const sendMessage = async () => {
    if (!user || !selectedContact || !newMessage.trim()) return;
    await supabase.from("messages").insert({ sender_id: user.id, receiver_id: selectedContact.user_id, content: newMessage.trim() });
    setNewMessage("");
  };

  if (selectedContact) {
    return (
      <div className="page-container flex flex-col h-screen">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedContact(null)}><ArrowLeft className="w-5 h-5" /></Button>
          <h2 className="font-display font-semibold text-sm">{selectedContact.full_name}</h2>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 pb-20">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${msg.sender_id === user?.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <p>{msg.content}</p>
                <p className="text-[10px] opacity-70 mt-1">{format(new Date(msg.created_at), "HH:mm", { locale: tr })}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-background border-t">
          <div className="flex gap-2 max-w-lg mx-auto">
            <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Mesaj yazın..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
            <Button size="icon" onClick={sendMessage} disabled={!newMessage.trim()}><Send className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader title="Mesajlar" subtitle="Öğretmenlerle iletişim" />
      <div className="space-y-2">
        {contacts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Henüz iletişim kurulacak öğretmen yok</p>
          </div>
        ) : contacts.map((c) => (
          <Card key={c.user_id} className="card-hover cursor-pointer" onClick={() => setSelectedContact(c)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">{c.full_name[0]}</span>
              </div>
              <div><p className="font-medium text-sm">{c.full_name}</p><p className="text-xs text-muted-foreground">Mesaj göndermek için tıklayın</p></div>
            </CardContent>
          </Card>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
