-- Add purchased_icons column to user_stats table to track purchased focus icons
ALTER TABLE public.user_stats 
ADD COLUMN IF NOT EXISTS purchased_icons TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.user_stats.purchased_icons IS 'Array of purchased focus icon IDs';