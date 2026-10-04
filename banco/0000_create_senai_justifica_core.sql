CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'secretary');
CREATE TYPE public.justification_status AS ENUM ('pending', 'approved', 'rejected', 'correction_requested');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  cpf text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'student',
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  student_code text NOT NULL,
  course_name text NOT NULL,
  teacher_name text NOT NULL,
  sponsor text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read classes" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Secretary manages classes" ON public.classes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'secretary')) WITH CHECK (public.has_role(auth.uid(), 'secretary'));

CREATE TABLE public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT true,
  UNIQUE(student_id, class_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read own enrollments" ON public.enrollments FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Staff read enrollments" ON public.enrollments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'secretary'));
CREATE POLICY "Secretary manages enrollments" ON public.enrollments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'secretary')) WITH CHECK (public.has_role(auth.uid(), 'secretary'));

CREATE TABLE public.justifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  class_id uuid NOT NULL REFERENCES public.classes(id),
  type text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  professional_name text,
  professional_registry text,
  notes text,
  document_path text NOT NULL,
  document_name text NOT NULL,
  status public.justification_status NOT NULL DEFAULT 'pending',
  review_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.justifications TO authenticated;
GRANT ALL ON public.justifications TO service_role;
ALTER TABLE public.justifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read own justifications" ON public.justifications FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Students create own justifications" ON public.justifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Staff read justifications" ON public.justifications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'secretary'));
CREATE POLICY "Staff review justifications" ON public.justifications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'secretary')) WITH CHECK (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'secretary'));

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated creates notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'secretary'));

CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.email, ''))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();

CREATE POLICY "Users upload own documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'justificativas' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users read own documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'justificativas' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Staff read documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'justificativas' AND (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'secretary')));

CREATE INDEX justifications_student_idx ON public.justifications(student_id, created_at DESC);
CREATE INDEX justifications_class_idx ON public.justifications(class_id, status);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);