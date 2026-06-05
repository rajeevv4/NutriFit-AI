-- Create meal_analysis table
CREATE TABLE public.meal_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  photo_url TEXT,
  foods_json JSONB NOT NULL,
  totals_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.meal_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own meal analysis"
ON public.meal_analysis
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meal analysis"
ON public.meal_analysis
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal analysis"
ON public.meal_analysis
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal analysis"
ON public.meal_analysis
FOR DELETE
USING (auth.uid() = user_id);