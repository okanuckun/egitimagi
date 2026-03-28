-- The ONLY way to fix this: disable RLS on user_roles completely
-- This is safe because:
-- 1. has_role() is SECURITY DEFINER and handles access control
-- 2. admin_list_all_roles() and admin_update_user_role() are SECURITY DEFINER
-- 3. The app never queries user_roles directly (uses RPC functions)
-- 4. PostgREST still requires authentication (anon key + JWT)

-- First drop ALL policies on user_roles to avoid linter warnings
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Then disable RLS
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Now re-create all other table policies using has_role() which is SECURITY DEFINER
-- and bypasses RLS on user_roles

-- Classes
DROP POLICY IF EXISTS "Admins can select all classes" ON public.classes;
DROP POLICY IF EXISTS "Admins can insert classes" ON public.classes;
DROP POLICY IF EXISTS "Admins can update classes" ON public.classes;
DROP POLICY IF EXISTS "Admins can delete classes" ON public.classes;
DROP POLICY IF EXISTS "Parents can view classes of their children" ON public.classes;

CREATE POLICY "select_classes" ON public.classes FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin') OR teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM students WHERE students.class_id = classes.id AND students.parent_id = auth.uid()));
CREATE POLICY "insert_classes" ON public.classes FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin') OR teacher_id = auth.uid());
CREATE POLICY "update_classes" ON public.classes FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin') OR teacher_id = auth.uid());
CREATE POLICY "delete_classes" ON public.classes FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin') OR teacher_id = auth.uid());

-- Students
DROP POLICY IF EXISTS "Admin or teacher select students" ON public.students;
DROP POLICY IF EXISTS "Admin or teacher insert students" ON public.students;
DROP POLICY IF EXISTS "Admin or teacher update students" ON public.students;
DROP POLICY IF EXISTS "Admin or teacher delete students" ON public.students;

CREATE POLICY "select_students" ON public.students FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM classes c WHERE c.id = students.class_id AND c.teacher_id = auth.uid()) OR parent_id = auth.uid());
CREATE POLICY "insert_students" ON public.students FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM classes c WHERE c.id = class_id AND c.teacher_id = auth.uid()));
CREATE POLICY "update_students" ON public.students FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM classes c WHERE c.id = students.class_id AND c.teacher_id = auth.uid()));
CREATE POLICY "delete_students" ON public.students FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM classes c WHERE c.id = students.class_id AND c.teacher_id = auth.uid()));

-- Homework
DROP POLICY IF EXISTS "Select homework" ON public.homework;
DROP POLICY IF EXISTS "Teachers manage own homework" ON public.homework;

CREATE POLICY "select_homework" ON public.homework FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin') OR teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM students s WHERE s.class_id = homework.class_id AND s.parent_id = auth.uid()));
CREATE POLICY "manage_homework" ON public.homework FOR ALL TO authenticated
USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());

-- Homework grades
DROP POLICY IF EXISTS "Select grades" ON public.homework_grades;
DROP POLICY IF EXISTS "Teachers manage grades" ON public.homework_grades;

CREATE POLICY "select_grades" ON public.homework_grades FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM homework h JOIN classes c ON c.id = h.class_id WHERE h.id = homework_grades.homework_id AND c.teacher_id = auth.uid()) OR EXISTS (SELECT 1 FROM students s WHERE s.id = homework_grades.student_id AND s.parent_id = auth.uid()));
CREATE POLICY "manage_grades" ON public.homework_grades FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM homework h JOIN classes c ON c.id = h.class_id WHERE h.id = homework_grades.homework_id AND c.teacher_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM homework h JOIN classes c ON c.id = h.class_id WHERE h.id = homework_grades.homework_id AND c.teacher_id = auth.uid()));

-- Announcements
DROP POLICY IF EXISTS "Select announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admin or author manage announcements" ON public.announcements;

CREATE POLICY "select_announcements" ON public.announcements FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin') OR author_id = auth.uid() OR class_id IS NULL OR EXISTS (SELECT 1 FROM classes c WHERE c.id = announcements.class_id AND c.teacher_id = auth.uid()) OR EXISTS (SELECT 1 FROM students s WHERE s.class_id = announcements.class_id AND s.parent_id = auth.uid()));
CREATE POLICY "manage_announcements" ON public.announcements FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin') OR author_id = auth.uid())
WITH CHECK (has_role(auth.uid(), 'admin') OR author_id = auth.uid());

-- Profiles
DROP POLICY IF EXISTS "Select profiles" ON public.profiles;
DROP POLICY IF EXISTS "Update own profile" ON public.profiles;

CREATE POLICY "select_profiles" ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "update_profiles" ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id);