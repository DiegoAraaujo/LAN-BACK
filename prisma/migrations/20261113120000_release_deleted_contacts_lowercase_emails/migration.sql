-- Contacts of soft-deleted customers blocked reusing the same WhatsApp/Instagram.
DELETE FROM "contacts"
WHERE "customerId" IN (SELECT "id" FROM "customers" WHERE "deletedAt" IS NOT NULL);

-- Store emails lowercased. Rows whose lowercase form would collide with another
-- account are left untouched (login still finds them case-insensitively).
UPDATE "users" AS u
SET "email" = lower(u."email")
WHERE u."email" <> lower(u."email")
  AND NOT EXISTS (
    SELECT 1 FROM "users" AS o
    WHERE o."id" <> u."id" AND lower(o."email") = lower(u."email")
  );
