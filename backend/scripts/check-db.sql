SELECT COUNT(*) as user_count FROM "User";
SELECT COUNT(*) as form_count FROM "Form";
SELECT COUNT(*) as workspace_count FROM "Workspace";
SELECT email, "firstName", "lastName" FROM "User" LIMIT 5;
SELECT id, title, status FROM "Form" LIMIT 5;
