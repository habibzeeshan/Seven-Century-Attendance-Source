ALTER TABLE "Agent" ADD COLUMN "email" VARCHAR(254);
CREATE UNIQUE INDEX "Agent_email_key" ON "Agent"("email");
