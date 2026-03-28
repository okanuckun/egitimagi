
-- Enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'parent');

-- Enum for homework grades
CREATE TYPE public.homework_grade AS ENUM ('not_done', 'done', 'well_done');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate from profiles!)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Classes table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Homework assignments
CREATE TABLE public.homework (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  due_date DATE NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Student homework grades
CREATE TABLE public.homework_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id UUID NOT NULL REFERENCES public.homework(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  grade homework_grade NOT NULL DEFAULT 'not_done',
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(homework_id, student_id)
);

-- Announcements
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_homework_updated_at BEFORE UPDATE ON public.homework FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PROFILES RLS
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- USER ROLES RLS
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- CLASSES RLS
CREATE POLICY "Teachers can view own classes" ON public.classes FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage own classes" ON public.classes FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Admins can manage all classes" ON public.classes FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Parents can view classes of their children" ON public.classes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.students WHERE students.class_id = classes.id AND students.parent_id = auth.uid())
);

-- STUDENTS RLS
CREATE POLICY "Teachers can view students in own classes" ON public.students FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.classes WHERE classes.id = students.class_id AND classes.teacher_id = auth.uid())
);
CREATE POLICY "Teachers can manage students in own classes" ON public.students FOR ALL USING (
  EXISTS (SELECT 1 FROM public.classes WHERE classes.id = students.class_id AND classes.teacher_id = auth.uid())
);
CREATE POLICY "Parents can view own children" ON public.students FOR SELECT USING (auth.uid() = parent_id);
CREATE POLICY "Admins can manage all students" ON public.students FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- HOMEWORK RLS
CREATE POLICY "Teachers can manage own homework" ON public.homework FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Parents can view homework for their children" ON public.homework FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.class_id = homework.class_id AND s.parent_id = auth.uid()
  )
);
CREATE POLICY "Admins can view all homework" ON public.homework FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- HOMEWORK GRADES RLS
CREATE POLICY "Teachers can manage grades for own classes" ON public.homework_grades FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.homework h
    JOIN public.classes c ON c.id = h.class_id
    WHERE h.id = homework_grades.homework_id AND c.teacher_id = auth.uid()
  )
);
CREATE POLICY "Parents can view own child grades" ON public.homework_grades FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = homework_grades.student_id AND s.parent_id = auth.uid()
  )
);
CREATE POLICY "Admins can view all grades" ON public.homework_grades FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ANNOUNCEMENTS RLS
CREATE POLICY "Authors can manage own announcements" ON public.announcements FOR ALL USING (auth.uid() = author_id);
CREATE POLICY "Teachers can view class announcements" ON public.announcements FOR SELECT USING (
  class_id IS NULL OR EXISTS (SELECT 1 FROM public.classes WHERE classes.id = announcements.class_id AND classes.teacher_id = auth.uid())
);
CREATE POLICY "Parents can view announcements" ON public.announcements FOR SELECT USING (
  class_id IS NULL OR EXISTS (
    SELECT 1 FROM public.students s WHERE s.class_id = announcements.class_id AND s.parent_id = auth.uid()
  )
);
CREATE POLICY "Admins can manage all announcements" ON public.announcements FOR ALL USING (public.has_role(auth.uid(), 'admin'));
