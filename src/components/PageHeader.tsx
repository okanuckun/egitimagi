import { useAuth } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  const { profile, signOut } = useAuth();

  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-display font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <button
        onClick={signOut}
        className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
        title="Çıkış Yap"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </div>
  );
}
