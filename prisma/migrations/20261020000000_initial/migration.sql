CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'HIDDEN');

CREATE TABLE "Campaign" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "KrathongDesign" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "emoji" TEXT NOT NULL,
  "palette" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KrathongDesign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Submission" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "designId" TEXT NOT NULL,
  "nickname" VARCHAR(40) NOT NULL,
  "wish" VARCHAR(240) NOT NULL,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
  "shareToken" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ModerationReport" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "reason" VARCHAR(120) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ModerationReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Campaign_slug_key" ON "Campaign"("slug");
CREATE INDEX "Campaign_isActive_startsAt_endsAt_idx" ON "Campaign"("isActive", "startsAt", "endsAt");
CREATE UNIQUE INDEX "KrathongDesign_key_key" ON "KrathongDesign"("key");
CREATE UNIQUE INDEX "Submission_shareToken_key" ON "Submission"("shareToken");
CREATE INDEX "Submission_campaignId_status_createdAt_idx" ON "Submission"("campaignId", "status", "createdAt");
CREATE INDEX "Submission_isPublic_status_createdAt_idx" ON "Submission"("isPublic", "status", "createdAt");
CREATE INDEX "ModerationReport_submissionId_createdAt_idx" ON "ModerationReport"("submissionId", "createdAt");

ALTER TABLE "Submission" ADD CONSTRAINT "Submission_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_designId_fkey" FOREIGN KEY ("designId") REFERENCES "KrathongDesign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ModerationReport" ADD CONSTRAINT "ModerationReport_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
