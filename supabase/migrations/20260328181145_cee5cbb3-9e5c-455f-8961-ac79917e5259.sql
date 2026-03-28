
-- Messages table for teacher-parent messaging
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  content text NOT NULL,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can see messages they sent or received
CREATE POLICY "select_messages" ON public.messages
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR has_role(auth.uid(), 'admin'::app_role));

-- Users can insert messages they send
CREATE POLICY "insert_messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Users can update messages they received (for read_at)
CREATE POLICY "update_messages" ON public.messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Attendance table
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
  note text,
  teacher_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(student_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_attendance" ON public.attendance
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR is_teacher_of_class(auth.uid(), class_id) OR is_parent_in_class(auth.uid(), class_id));

CREATE POLICY "manage_attendance" ON public.attendance
  FOR ALL TO authenticated
  USING (is_teacher_of_class(auth.uid(), class_id))
  WITH CHECK (is_teacher_of_class(auth.uid(), class_id));

-- Events/Calendar table
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_time time,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  event_type text NOT NULL DEFAULT 'general' CHECK (event_type IN ('exam', 'meeting', 'holiday', 'general', 'homework')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_events" ON public.events
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR author_id = auth.uid() OR class_id IS NULL OR is_teacher_of_class(auth.uid(), class_id) OR is_parent_in_class(auth.uid(), class_id));

CREATE POLICY "manage_events" ON public.events
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR author_id = auth.uid())
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR author_id = auth.uid());

-- Quizzes table
CREATE TABLE public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL,
  subject text NOT NULL,
  duration_minutes int DEFAULT 30,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_quizzes" ON public.quizzes
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR teacher_id = auth.uid() OR is_parent_in_class(auth.uid(), class_id));

CREATE POLICY "manage_quizzes" ON public.quizzes
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- Quiz questions
CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]',
  correct_answer int NOT NULL DEFAULT 0,
  points int NOT NULL DEFAULT 10,
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_quiz_questions" ON public.quiz_questions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND (q.teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR is_parent_in_class(auth.uid(), q.class_id))));

CREATE POLICY "manage_quiz_questions" ON public.quiz_questions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND q.teacher_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND q.teacher_id = auth.uid()));

-- Quiz answers from students
CREATE TABLE public.quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}',
  score int,
  completed_at timestamp with time zone DEFAULT now(),
  UNIQUE(quiz_id, student_id)
);

ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_quiz_answers" ON public.quiz_answers
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND (q.teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

CREATE POLICY "manage_quiz_answers" ON public.quiz_answers
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND q.teacher_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND q.teacher_id = auth.uid()));

-- File storage bucket for homework submissions and materials
INSERT INTO storage.buckets (id, name, public) VALUES ('education-files', 'education-files', true);

-- Storage policies
CREATE POLICY "authenticated_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'education-files');

CREATE POLICY "authenticated_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'education-files');

CREATE POLICY "owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'education-files' AND (storage.foldername(name))[1] = auth.uid()::text);
