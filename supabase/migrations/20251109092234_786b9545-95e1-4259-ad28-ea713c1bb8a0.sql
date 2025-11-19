-- Create water_logs table for tracking water intake
CREATE TABLE IF NOT EXISTS public.water_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  glasses_logged INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own water logs" 
ON public.water_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own water logs" 
ON public.water_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own water logs" 
ON public.water_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own water logs" 
ON public.water_logs 
FOR DELETE 
USING (auth.uid() = user_id);