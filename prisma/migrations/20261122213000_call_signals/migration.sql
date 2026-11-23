-- CreateTable
CREATE TABLE "CallSignal" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CallSignal_appointmentId_createdAt_idx" ON "CallSignal"("appointmentId", "createdAt");

