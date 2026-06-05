-- Create table for storing Google Fit OAuth tokens
CREATE TABLE IF NOT EXISTS public.google_fit_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.google_fit_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own tokens" 
ON public.google_fit_tokens 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens" 
ON public.google_fit_tokens 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens" 
ON public.google_fit_tokens 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens" 
ON public.google_fit_tokens 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_google_fit_tokens_updated_at
BEFORE UPDATE ON public.google_fit_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for storing synced fitness data
CREATE TABLE IF NOT EXISTS public.fitness_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  steps INTEGER,
  heart_rate INTEGER,
  calories INTEGER,
  distance DECIMAL,
  active_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.fitness_data ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own fitness data" 
ON public.fitness_data 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fitness data" 
ON public.fitness_data 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fitness data" 
ON public.fitness_data 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_fitness_data_updated_at
BEFORE UPDATE ON public.fitness_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();