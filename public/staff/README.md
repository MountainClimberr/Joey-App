# Staff photos

Drop staff pictures in this folder. They are served at `/staff/<file>`.

- Use lowercase first names: `carol.jpg`, `sandra.jpg`, `robert.jpg`, `priya.jpg`,
  `marcus.jpg`, `lena.jpg`, `tom.jpg`, `dana.jpg` (matches the mock data in `src/api.js`).
- Square or portrait photos work best; faces are cropped toward the top-center.
- Keep each file under ~300 KB (resize to about 600×600).
- A missing photo is fine: that person shows their initials instead.

For real data, set `employees.photo_url` (e.g. `/staff/carol.jpg`) and
`employees.job_title` in the database (see `server/migrations/003_employee_photos.sql`).
