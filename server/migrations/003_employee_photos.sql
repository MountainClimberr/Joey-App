-- Staff photos: each employee can have a picture shown on the HR roster, their
-- weekly view, and their own check-in screen. Store a path under /team/ (served
-- from public/team/) or a full image URL. NULL = show initials instead.
ALTER TABLE employees ADD COLUMN photo_url text;
