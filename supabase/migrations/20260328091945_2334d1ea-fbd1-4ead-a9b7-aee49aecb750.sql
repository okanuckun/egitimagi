
CREATE TABLE public.live_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  room_name text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  title text NOT NULL DEFAULT 'Canlı Yayın'
);

ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_live_streams" ON public.live_streams
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    teacher_id = auth.uid() OR
    is_parent_in_class(auth.uid(), class_id)
  );

CREATE POLICY "manage_live_streams" ON public.live_streams
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.live_streams;
