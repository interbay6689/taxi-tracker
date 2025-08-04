-- Add location fields to trips table
ALTER TABLE public.trips 
ADD COLUMN start_location_address TEXT,
ADD COLUMN start_location_city TEXT,
ADD COLUMN start_location_lat DECIMAL,
ADD COLUMN start_location_lng DECIMAL,
ADD COLUMN end_location_address TEXT,
ADD COLUMN end_location_city TEXT,
ADD COLUMN end_location_lat DECIMAL,
ADD COLUMN end_location_lng DECIMAL,
ADD COLUMN trip_status TEXT DEFAULT 'completed' CHECK (trip_status IN ('active', 'completed')),
ADD COLUMN trip_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN trip_end_time TIMESTAMP WITH TIME ZONE;