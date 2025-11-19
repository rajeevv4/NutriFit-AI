-- Create mood_logs table
CREATE TABLE IF NOT EXISTS public.mood_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
  energy_level INTEGER NOT NULL CHECK (energy_level >= 1 AND energy_level <= 5),
  stress_level INTEGER NOT NULL CHECK (stress_level >= 1 AND stress_level <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own mood logs"
ON public.mood_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mood logs"
ON public.mood_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mood logs"
ON public.mood_logs
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mood logs"
ON public.mood_logs
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_mood_logs_user_date ON public.mood_logs(user_id, date DESC);