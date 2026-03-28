import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface QuizItem { id: string; title: string; subject: string; duration_minutes: number | null; description: string | null; }
interface QuizQuestion { id: string; quiz_id: string; question: string; options: string[]; correct_answer: number; points: number; sort_order: number; }

export default function QuizDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<QuizItem | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ question: "", options: ["", "", "", ""], correct_answer: 0, points: "10" });

  const fetchData = async () => {
    if (!id) return;
    const [qRes, questionsRes] = await Promise.all([
      supabase.from("quizzes").select("*").eq("id", id).single(),
      supabase.from("quiz_questions").select("*").eq("quiz_id", id).order("sort_order"),
    ]);
    setQuiz(qRes.data as QuizItem | null);
    setQuestions((questionsRes.data as QuizQuestion[]) || []);
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const { error } = await supabase.from("quiz_questions").insert({
      quiz_id: id,
      question: form.question,
      options: form.options.filter((o) => o.trim()),
      correct_answer: form.correct_answer,
      points: parseInt(form.points) || 10,
      sort_order: questions.length,
    });
    if (error) toast.error("Soru eklenemedi");
    else {
      toast.success("Soru eklendi!");
      setOpen(false);
      setForm({ question: "", options: ["", "", "", ""], correct_answer: 0, points: "10" });
      fetchData();
    }
  };

  const deleteQuestion = async (questionId: string) => {
    await supabase.from("quiz_questions").delete().eq("id", questionId);
    fetchData();
    toast.success("Soru silindi");
  };

  if (!quiz) return null;

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/teacher/quizzes")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-display font-bold text-lg">{quiz.title}</h1>
          <p className="text-xs text-muted-foreground">{quiz.subject} • {quiz.duration_minutes} dk</p>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full mb-4"><Plus className="w-4 h-4 mr-2" /> Soru Ekle</Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm mx-auto max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Yeni Soru</DialogTitle></DialogHeader>
          <form onSubmit={handleAddQuestion} className="space-y-4">
            <div className="space-y-2">
              <Label>Soru</Label>
              <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required />
            </div>
            {form.options.map((opt, i) => (
              <div key={i} className="space-y-1">
                <Label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct"
                    checked={form.correct_answer === i}
                    onChange={() => setForm({ ...form, correct_answer: i })}
                  />
                  Seçenek {String.fromCharCode(65 + i)}
                </Label>
                <Input
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...form.options];
                    newOpts[i] = e.target.value;
                    setForm({ ...form, options: newOpts });
                  }}
                  placeholder={`Seçenek ${String.fromCharCode(65 + i)}`}
                  required={i < 2}
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label>Puan</Label>
              <Input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} />
            </div>
            <Button type="submit" className="w-full">Ekle</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {questions.map((q, idx) => (
          <Card key={q.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-sm mb-2">
                    <span className="text-muted-foreground mr-1">{idx + 1}.</span>
                    {q.question}
                  </p>
                  <div className="space-y-1">
                    {q.options.map((opt, oi) => (
                      <p key={oi} className={`text-xs px-2 py-1 rounded ${oi === q.correct_answer ? "bg-success/10 text-success font-medium" : "text-muted-foreground"}`}>
                        {String.fromCharCode(65 + oi)}) {opt}
                      </p>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">{q.points} puan</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteQuestion(q.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
