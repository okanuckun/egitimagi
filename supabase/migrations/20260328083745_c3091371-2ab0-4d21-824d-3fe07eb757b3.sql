-- Fix: Add explicit SELECT policies for admin on all tables
-- The FOR ALL policy doesn't always cover SELECT in Postgres

-- Classes
DROP POLICY IF EXISTS "Admins can manage all classes" ON public.classes;
CREATE POLICY "Admins can select all classes"
ON public.classes FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  OR teacher_id = auth.uid()
);
CREATE POLICY "Admins can insert classes"
ON public.classes FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  OR teacher_id = auth.uid()
);
CREATE POLICY "Admins can update classes"
ON public.classes FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  OR teacher_id = auth.uid()
);
CREATE POLICY "Admins can delete classes"
ON public.classes FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  OR teacher_id = auth.uid()
);

-- Drop old teacher policies that overlap
DROP POLICY IF EXISTS "Teachers can manage own classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can view own classes" ON public.classes;

-- Students
DROP POLICY IF EXISTS "Admins can manage all students" ON public.students;
CREATE POLICY "Admin or teacher select students"
ON public.students FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = students.class_id AND c.teacher_id = auth.uid())
  OR parent_id = auth.uid()
);
CREATE POLICY "Admin or teacher insert students"
ON public.students FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.teacher_id = auth.uid())
);
CREATE POLICY "Admin or teacher update students"
ON public.students FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = students.class_id AND c.teacher_id = auth.uid())
);
CREATE POLICY "Admin or teacher delete students"
ON public.students FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = students.class_id AND c.teacher_id = auth.uid())
);

-- Drop old overlapping student policies
DROP POLICY IF EXISTS "Teachers can manage students in own classes" ON public.students;
DROP POLICY IF EXISTS "Teachers can view students in own classes" ON public.students;
DROP POLICY IF EXISTS "Parents can view own children" ON public.students;

-- Homework
DROP POLICY IF EXISTS "Admins can view all homework" ON public.homework;
DROP POLICY IF EXISTS "Teachers can manage own homework" ON public.homework;
DROP POLICY IF EXISTS "Parents can view homework for their children" ON public.homework;
CREATE POLICY "Select homework"
ON public.homework FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  OR teacher_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.students s WHERE s.class_id = homework.class_id AND s.parent_id = auth.uid())
);
CREATE POLICY "Teachers manage own homework"
ON public.homework FOR ALL TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

-- Announcements
DROP POLICY IF EXISTS "Admins can manage all announcements" ON public.announcements;
DROP POLICY IF EXISTS "Authors can manage own announcements" ON public.announcements;
DROP POLICY IF EXISTS "Parents can view announcements" ON public.announcements;
DROP POLICY IF EXISTS "Teachers can view class announcements" ON public.announcements;
CREATE POLICY "Select announcements"
ON public.announcements FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  OR author_id = auth.uid()
  OR class_id IS NULL
  OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = announcements.class_id AND c.teacher_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.students s WHERE s.class_id = announcements.class_id AND s.parent_id = auth.uid())
);
CREATE POLICY "Admin or author manage announcements"
ON public.announcements FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  OR author_id = auth.uid()
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  OR author_id = auth.uid()
);

-- Homework grades
DROP POLICY IF EXISTS "Admins can view all grades" ON public.homework_grades;
DROP POLICY IF EXISTS "Parents can view own child grades" ON public.homework_grades;
DROP POLICY IF EXISTS "Teachers can manage grades for own classes" ON public.homework_grades;
CREATE POLICY "Select grades"
ON public.homework_grades FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  OR EXISTS (SELECT 1 FROM public.homework h JOIN public.classes c ON c.id = h.class_id WHERE h.id = homework_grades.homework_id AND c.teacher_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = homework_grades.student_id AND s.parent_id = auth.uid())
);
CREATE POLICY "Teachers manage grades"
ON public.homework_grades FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.homework h JOIN public.classes c ON c.id = h.class_id WHERE h.id = homework_grades.homework_id AND c.teacher_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.homework h JOIN public.classes c ON c.id = h.class_id WHERE h.id = homework_grades.homework_id AND c.teacher_id = auth.uid())
);

-- Profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Select profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);
CREATE POLICY "Update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id);