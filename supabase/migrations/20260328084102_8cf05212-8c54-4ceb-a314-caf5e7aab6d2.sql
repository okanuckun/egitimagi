
-- Fix circular recursion: classes <-> students policies reference each other
-- Solution: use security definer functions to break the cycle

-- Function to check if user is a parent of a student in a class (avoids querying classes table)
CREATE OR REPLACE FUNCTION public.is_parent_in_class(_user_id uuid, _class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students WHERE parent_id = _user_id AND class_id = _class_id
  )
$$;

-- Function to check if user is teacher of a class (avoids querying classes table from students policy)
CREATE OR REPLACE FUNCTION public.is_teacher_of_class(_user_id uuid, _class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes WHERE teacher_id = _user_id AND id = _class_id
  )
$$;

-- Drop and recreate classes policies
DROP POLICY IF EXISTS "select_classes" ON public.classes;
DROP POLICY IF EXISTS "insert_classes" ON public.classes;
DROP POLICY IF EXISTS "update_classes" ON public.classes;
DROP POLICY IF EXISTS "delete_classes" ON public.classes;

CREATE POLICY "select_classes" ON public.classes FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin') OR teacher_id = auth.uid() OR is_parent_in_class(auth.uid(), id));

CREATE POLICY "insert_classes" ON public.classes FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin') OR teacher_id = auth.uid());

CREATE POLICY "update_classes" ON public.classes FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin') OR teacher_id = auth.uid());

CREATE POLICY "delete_classes" ON public.classes FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin') OR teacher_id = auth.uid());

-- Drop and recreate students policies using security definer function
DROP POLICY IF EXISTS "select_students" ON public.students;
DROP POLICY IF EXISTS "insert_students" ON public.students;
DROP POLICY IF EXISTS "update_students" ON public.students;
DROP POLICY IF EXISTS "delete_students" ON public.students;

CREATE POLICY "select_students" ON public.students FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin') OR is_teacher_of_class(auth.uid(), class_id) OR parent_id = auth.uid());

CREATE POLICY "insert_students" ON public.students FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin') OR is_teacher_of_class(auth.uid(), class_id));

CREATE POLICY "update_students" ON public.students FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin') OR is_teacher_of_class(auth.uid(), class_id));

CREATE POLICY "delete_students" ON public.students FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin') OR is_teacher_of_class(auth.uid(), class_id));

-- Fix homework policies too (they reference classes)
DROP POLICY IF EXISTS "select_homework" ON public.homework;
DROP POLICY IF EXISTS "manage_homework" ON public.homework;

CREATE POLICY "select_homework" ON public.homework FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin') OR teacher_id = auth.uid() OR is_parent_in_class(auth.uid(), class_id));

CREATE POLICY "manage_homework" ON public.homework FOR ALL TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

-- Fix announcements policies (they reference classes and students)
DROP POLICY IF EXISTS "select_announcements" ON public.announcements;
DROP POLICY IF EXISTS "manage_announcements" ON public.announcements;

CREATE POLICY "select_announcements" ON public.announcements FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin') OR author_id = auth.uid() OR class_id IS NULL
  OR is_teacher_of_class(auth.uid(), class_id) OR is_parent_in_class(auth.uid(), class_id));

CREATE POLICY "manage_announcements" ON public.announcements FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin') OR author_id = auth.uid())
WITH CHECK (has_role(auth.uid(), 'admin') OR author_id = auth.uid());

-- Fix homework_grades policies (they reference homework+classes)
DROP POLICY IF EXISTS "select_grades" ON public.homework_grades;
DROP POLICY IF EXISTS "manage_grades" ON public.homework_grades;

-- Function to check teacher owns a homework
CREATE OR REPLACE FUNCTION public.is_teacher_of_homework(_user_id uuid, _homework_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.homework WHERE id = _homework_id AND teacher_id = _user_id
  )
$$;

-- Function to check parent has student linked to homework
CREATE OR REPLACE FUNCTION public.is_parent_of_homework_student(_user_id uuid, _homework_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.homework h ON h.class_id = s.class_id
    WHERE h.id = _homework_id AND s.id = _student_id AND s.parent_id = _user_id
  )
$$;

CREATE POLICY "select_grades" ON public.homework_grades FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin') OR is_teacher_of_homework(auth.uid(), homework_id)
  OR is_parent_of_homework_student(auth.uid(), homework_id, student_id));

CREATE POLICY "manage_grades" ON public.homework_grades FOR ALL TO authenticated
USING (is_teacher_of_homework(auth.uid(), homework_id))
WITH CHECK (is_teacher_of_homework(auth.uid(), homework_id));

-- Fix profiles select to also allow teachers to see profiles
DROP POLICY IF EXISTS "select_profiles" ON public.profiles;
CREATE POLICY "select_profiles" ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));
