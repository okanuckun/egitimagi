import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, LogOut } from "lucide-react";

export default function NoRole() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-sm w-full animate-fade-in">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-warning/20 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7 text-warning" />
          </div>
          <h2 className="text-lg font-display font-bold">Onay Bekleniyor</h2>
          <p className="text-sm text-muted-foreground">
            Hesabınız henüz bir role atanmadı. Lütfen okul yöneticinizle iletişime geçin.
          </p>
          <Button variant="outline" onClick={signOut} className="w-full">
            <LogOut className="w-4 h-4 mr-2" />
            Çıkış Yap
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
