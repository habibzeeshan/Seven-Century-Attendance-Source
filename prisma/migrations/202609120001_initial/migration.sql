-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TEAM_LEADER');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('NOT_UPDATED', 'PRESENT_OFFICE', 'VIEWING', 'MEETING', 'DEVELOPER_OFFICE', 'TRUCHECK', 'ABSENT', 'SICK', 'LEAVE');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "fullName" VARCHAR(120) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "lastLoginAt" TIMESTAMPTZ,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "teamLeaderId" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" UUID NOT NULL,
    "fullName" VARCHAR(120) NOT NULL,
    "jobTitle" VARCHAR(120) NOT NULL DEFAULT 'Property Consultant',
    "employeeCode" VARCHAR(80),
    "avatarUrl" TEXT,
    "teamId" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyAttendance" (
    "id" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "attendanceDate" DATE NOT NULL,
    "teamId" UUID,
    "leaderIdSnapshot" UUID,
    "currentStatus" "AttendanceStatus" NOT NULL DEFAULT 'NOT_UPDATED',
    "lastUpdatedAt" TIMESTAMPTZ,
    "lastUpdatedById" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "DailyAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceHistory" (
    "id" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "attendanceDate" DATE NOT NULL,
    "previousStatus" "AttendanceStatus",
    "newStatus" "AttendanceStatus" NOT NULL,
    "changedById" UUID NOT NULL,
    "changedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "companyName" VARCHAR(120) NOT NULL DEFAULT 'Seven Century Real Estate Brokers LLC',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Dubai',
    "attendanceDeadline" VARCHAR(5) NOT NULL DEFAULT '10:00',
    "logoUrl" TEXT,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_active_idx" ON "User"("active");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "PasswordReset_userId_idx" ON "PasswordReset"("userId");

-- CreateIndex
CREATE INDEX "Team_teamLeaderId_idx" ON "Team"("teamLeaderId");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_employeeCode_key" ON "Agent"("employeeCode");

-- CreateIndex
CREATE INDEX "Agent_teamId_active_idx" ON "Agent"("teamId", "active");

-- CreateIndex
CREATE INDEX "DailyAttendance_attendanceDate_currentStatus_idx" ON "DailyAttendance"("attendanceDate", "currentStatus");

-- CreateIndex
CREATE INDEX "DailyAttendance_teamId_attendanceDate_idx" ON "DailyAttendance"("teamId", "attendanceDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailyAttendance_agentId_attendanceDate_key" ON "DailyAttendance"("agentId", "attendanceDate");

-- CreateIndex
CREATE INDEX "AttendanceHistory_agentId_attendanceDate_changedAt_idx" ON "AttendanceHistory"("agentId", "attendanceDate", "changedAt");

-- CreateIndex
CREATE INDEX "AttendanceHistory_attendanceDate_idx" ON "AttendanceHistory"("attendanceDate");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_teamLeaderId_fkey" FOREIGN KEY ("teamLeaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAttendance" ADD CONSTRAINT "DailyAttendance_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAttendance" ADD CONSTRAINT "DailyAttendance_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAttendance" ADD CONSTRAINT "DailyAttendance_lastUpdatedById_fkey" FOREIGN KEY ("lastUpdatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceHistory" ADD CONSTRAINT "AttendanceHistory_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceHistory" ADD CONSTRAINT "AttendanceHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
