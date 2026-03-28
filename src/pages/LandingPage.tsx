import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  GraduationCap, MessageCircle, ClipboardCheck, Calendar, FileQuestion,
  FolderOpen, BookOpen, Video, Bell, BarChart3, Users, Shield,
  ArrowRight, CheckCircle, Sparkles
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Ödev Takibi",
    desc: "Ödevleri oluşturun, takip edin ve 3 kademeli not sistemiyle değerlendirin.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: MessageCircle,
    title: "Mesajlaşma",
    desc: "Öğretmen ve veli arasında anlık mesajlaşma ile hızlı iletişim kurun.",
    color: "bg-info/10 text-info",
  },
  {
    icon: ClipboardCheck,
    title: "Yoklama & Devamsızlık",
    desc: "Günlük yoklama alın, veliler çocuklarının devamsızlığını anlık takip etsin.",
    color: "bg-success/10 text-success",
  },
  {
    icon: Video,
    title: "Canlı Yayın",
    desc: "Sınıfınızla canlı ders yapın. Veliler de katılarak dersleri izleyebilir.",
    color: "bg-destructive/10 text-destructive",
  },
  {
    icon: FileQuestion,
    title: "Online Quiz",
    desc: "Çoktan seçmeli sınavlar oluşturun, otomatik değerlendirme yapın.",
    color: "bg-warning/10 text-warning",
  },
  {
    icon: Calendar,
    title: "Takvim & Etkinlikler",
    desc: "Sınav, toplantı, tatil gibi tüm etkinlikleri tek takvimde planlayın.",
    color: "bg-accent text-accent-foreground",
  },
  {
    icon: FolderOpen,
    title: "Dosya Paylaşımı",
    desc: "Ders materyallerini yükleyin, veliler ve öğrencilerle paylaşın.",
    color: "bg-secondary text-secondary-foreground",
  },
  {
    icon: BarChart3,
    title: "Performans Analizi",
    desc: "Öğrenci başarı grafiklerini görüntüleyin, gelişim süreçlerini izleyin.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Bell,
    title: "Duyurular",
    desc: "Sınıf veya okul genelinde duyuru paylaşın, herkesi bilgilendirin.",
    color: "bg-info/10 text-info",
  },
];

const roles = [
  {
    icon: Users,
    title: "Öğretmenler",
    items: ["Ödev oluşturma & notlandırma", "Yoklama alma", "Canlı ders", "Quiz oluşturma", "Dosya paylaşımı"],
  },
  {
    icon: Shield,
    title: "Veliler",
    items: ["Ödev takibi", "Devamsızlık görüntüleme", "Öğretmenle mesajlaşma", "Canlı derse katılım", "Performans analizi"],
  },
  {
    icon: GraduationCap,
    title: "Yöneticiler",
    items: ["Tüm sınıfları yönetme", "Kullanıcı rolleri", "Okul geneli duyurular", "Tüm verilere erişim"],
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-info/5" />
        <div className="relative max-w-5xl mx-auto px-4 pt-8 pb-16 md:pt-16 md:pb-24">
          <nav className="flex items-center justify-between mb-12 md:mb-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg">Eğitim Ağı</span>
            </div>
            <Button onClick={() => navigate("/login")} variant="outline" size="sm">
              Giriş Yap
            </Button>
          </nav>

          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
              <Sparkles className="w-3 h-3" />
              Eğitimde yeni nesil platform
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-extrabold leading-tight mb-4">
              Okulunuzu
              <span className="text-primary"> Dijitalleştirin</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg mb-8 leading-relaxed">
              Öğretmenler, veliler ve yöneticiler için tek bir platformda ödev takibi, canlı ders,
              mesajlaşma, yoklama ve çok daha fazlası.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={() => navigate("/login")} className="gap-2">
                Hemen Başla <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
                Özellikleri Keşfet
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section id="features" className="max-w-5xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">Tüm İhtiyaçlar Tek Platformda</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Eğitim süreçlerinizi kolaylaştıran kapsamlı özellikler
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <Card key={f.title} className="card-hover border-0 shadow-sm">
              <CardContent className="p-5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${f.color}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">Herkes İçin Tasarlandı</h2>
            <p className="text-muted-foreground">Her rol için özel paneller ve yetkiler</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {roles.map((r) => (
              <Card key={r.title} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <r.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-bold mb-3">{r.title}</h3>
                  <ul className="space-y-2">
                    {r.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 py-16 md:py-24 text-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">Hemen Başlayın</h2>
          <p className="text-muted-foreground mb-6">
            Ücretsiz hesap oluşturun ve okulunuzu dijital dünyaya taşıyın.
          </p>
          <Button size="lg" onClick={() => navigate("/login")} className="gap-2">
            Kayıt Ol <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-sm">Eğitim Ağı</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Eğitim Ağı. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}
