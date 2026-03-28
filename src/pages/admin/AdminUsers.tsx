import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Shield } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithRole {
  user_id: string;
  full_name: string;
  role: AppRole | null;
  role_id: string | null;
}

const roleLabels: Record<AppRole, string> = {
  admin: "Yönetici",
  teacher: "Öğretmen",
  parent: "Veli",
};

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);

  const fetchUsers = async () => {
    const profilesRes = await supabase.from("profiles").select("user_id, full_name");
    const rolesRes = await supabase.from("user_roles").select("*");

    const roleMap = new Map(rolesRes.data?.map((r) => [r.user_id, r]) || []);

    setUsers(
      (profilesRes.data || []).map((p) => {
        const r = roleMap.get(p.user_id);
        return {
          user_id: p.user_id,
          full_name: p.full_name,
          role: r?.role || null,
          role_id: r?.id || null,
        };
      })
    );
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId: string, newRole: AppRole, existingRoleId: string | null) => {
    if (existingRoleId) {
      const { error } = await supabase.from("user_roles").update({ role: newRole }).eq("id", existingRoleId);
      if (error) toast.error("Rol güncellenemedi");
      else toast.success("Rol güncellendi");
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
      if (error) toast.error("Rol atanamadı");
      else toast.success("Rol atandı");
    }
    fetchUsers();
  };

  return (
    <div className="page-container">
      <PageHeader title="Kullanıcılar" subtitle="Kullanıcı rolleri yönet" />
      {users.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Henüz kullanıcı yok</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <Card key={u.user_id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{u.full_name || "İsimsiz"}</p>
                    <p className="text-xs text-muted-foreground">
                      {u.role ? roleLabels[u.role] : "Rol atanmamış"}
                    </p>
                  </div>
                  <Select
                    value={u.role || ""}
                    onValueChange={(v) => handleRoleChange(u.user_id, v as AppRole, u.role_id)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Rol seç" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Yönetici</SelectItem>
                      <SelectItem value="teacher">Öğretmen</SelectItem>
                      <SelectItem value="parent">Veli</SelectItem>
                    </SelectContent>
                  </Select>
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
