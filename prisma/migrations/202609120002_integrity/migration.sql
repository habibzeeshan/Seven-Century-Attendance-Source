ALTER TABLE "SystemSettings" ADD CONSTRAINT "single_settings" CHECK (id = 1);
ALTER TABLE "SystemSettings" ADD CONSTRAINT "dubai_timezone" CHECK (timezone = 'Asia/Dubai');
ALTER TABLE "SystemSettings" ADD CONSTRAINT "valid_deadline" CHECK ("attendanceDeadline" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
CREATE FUNCTION prevent_audit_modification() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 RAISE EXCEPTION 'Attendance audit records are immutable';
END;
$$;
CREATE TRIGGER immutable_attendance_history BEFORE UPDATE OR DELETE ON "AttendanceHistory" FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
