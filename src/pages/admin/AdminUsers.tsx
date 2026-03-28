import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithRole {
  user_id: string;
  full_name: string;
  role: AppRole | null;
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
    // Use SECURITY DEFINER functions to bypass RLS
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name"),
      supabase.rpc("admin_list_all_roles"),
    ]);

    const roleMap = new Map(
      (rolesRes.data as any[] || []).map((r: any) => [r.user_id, r.role])
    );

    setUsers(
      (profilesRes.data || []).map((p) => ({
        user_id: p.user_id,
        full_name: p.full_name,
        role: (roleMap.get(p.user_id) as AppRole) || null,
      }))
    );
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    const { error } = await supabase.rpc("admin_update_user_role", {
      _target_user_id: userId,
      _new_role: newRole,
    });
    if (error) {
      toast.error("Rol güncellenemedi: " + error.message);
    } else {
      toast.success("Rol güncellendi");
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
                    onValueChange={(v) => handleRoleChange(u.user_id, v as AppRole)}
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
