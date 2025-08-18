-- Remove the CHECK constraint on trip_status to allow free-form tags
ALTER TABLE public.trips DROP CONSTRAINT trips_trip_status_check;