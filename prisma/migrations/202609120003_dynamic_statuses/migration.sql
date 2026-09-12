-- Replace the fixed AttendanceStatus enum with an admin-editable Status table.
-- Existing DailyAttendance/AttendanceHistory rows keep their exact values;
-- only the column type changes from a native enum to a text key referencing
-- the new Status table (no data is rewritten or reinterpreted).

CREATE TYPE "StatusRole" AS ENUM ('WORKING', 'ABSENT', 'SICK', 'LEAVE', 'PENDING', 'CUSTOM');

CREATE TABLE "Status" (
  "key" VARCHAR(60) NOT NULL,
  "label" VARCHAR(60) NOT NULL,
  "color" VARCHAR(20) NOT NULL,
  "icon" VARCHAR(40) NOT NULL,
  "role" "StatusRole" NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Status_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "Status_active_sortOrder_idx" ON "Status"("active", "sortOrder");

INSERT INTO "Status" ("key", "label", "color", "icon", "role", "sortOrder", "updatedAt") VALUES
  ('NOT_UPDATED', 'Not Updated', 'gray', 'Clock3', 'PENDING', 0, now()),
  ('PRESENT_OFFICE', 'Present / Office', 'green', 'Building2', 'WORKING', 1, now()),
  ('VIEWING', 'Viewing', 'blue', 'Car', 'WORKING', 2, now()),
  ('MEETING', 'Meeting', 'purple', 'Users', 'WORKING', 3, now()),
  ('DEVELOPER_OFFICE', 'Developer Office', 'orange', 'Building', 'WORKING', 4, now()),
  ('TRUCHECK', 'TruCheck', 'teal', 'BadgeCheck', 'WORKING', 5, now()),
  ('ABSENT', 'Absent', 'red', 'UserX', 'ABSENT', 6, now()),
  ('SICK', 'Sick', 'amber', 'HeartPulse', 'SICK', 7, now()),
  ('LEAVE', 'Leave', 'gold', 'Sun', 'LEAVE', 8, now());

ALTER TABLE "DailyAttendance" ALTER COLUMN "currentStatus" TYPE VARCHAR(60) USING "currentStatus"::text;
ALTER TABLE "DailyAttendance" ALTER COLUMN "currentStatus" SET DEFAULT 'NOT_UPDATED';

ALTER TABLE "AttendanceHistory" ALTER COLUMN "previousStatus" TYPE VARCHAR(60) USING "previousStatus"::text;
ALTER TABLE "AttendanceHistory" ALTER COLUMN "newStatus" TYPE VARCHAR(60) USING "newStatus"::text;

DROP TYPE "AttendanceStatus";

ALTER TABLE "DailyAttendance" ADD CONSTRAINT "DailyAttendance_currentStatus_fkey" FOREIGN KEY ("currentStatus") REFERENCES "Status"("key") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AttendanceHistory" ADD CONSTRAINT "AttendanceHistory_previousStatus_fkey" FOREIGN KEY ("previousStatus") REFERENCES "Status"("key") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AttendanceHistory" ADD CONSTRAINT "AttendanceHistory_newStatus_fkey" FOREIGN KEY ("newStatus") REFERENCES "Status"("key") ON DELETE RESTRICT ON UPDATE CASCADE;
