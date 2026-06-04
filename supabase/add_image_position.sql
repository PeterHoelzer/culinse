-- Adds a focal point ("object-position") for user recipe photos so creators can
-- reposition the image instead of having it cropped blindly. Value is a CSS
-- object-position string, e.g. "50% 35%". Existing rows default to centered.
--
-- Run this in the Supabase SQL editor BEFORE deploying the code that writes it.

ALTER TABLE user_recipes
  ADD COLUMN IF NOT EXISTS image_position text DEFAULT '50% 50%';
