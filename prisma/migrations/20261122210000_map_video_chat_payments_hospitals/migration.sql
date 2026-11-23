-- CreateEnum
CREATE TYPE "ConsultMode" AS ENUM ('CLINIC', 'VIDEO');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'REFUNDED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'HOSPITAL';

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "fee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "mode" "ConsultMode" NOT NULL DEFAULT 'CLINIC',
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentRef" TEXT,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID';

-- AlterTable
ALTER TABLE "DoctorProfile" ADD COLUMN     "latitude" DOUBLE PRECISION NOT NULL DEFAULT 22.72,
ADD COLUMN     "longitude" DOUBLE PRECISION NOT NULL DEFAULT 75.86,
ADD COLUMN     "offersVideo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "videoFee" INTEGER;

-- AlterTable
ALTER TABLE "Hospital" ADD COLUMN     "bedsAvailable" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "bloodGroups" TEXT[],
ADD COLUMN     "icuAvailable" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "latitude" DOUBLE PRECISION NOT NULL DEFAULT 22.72,
ADD COLUMN     "longitude" DOUBLE PRECISION NOT NULL DEFAULT 75.86,
ADD COLUMN     "oxygenAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "specialities" TEXT[],
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Message_appointmentId_createdAt_idx" ON "Message"("appointmentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_userId_key" ON "Hospital"("userId");

-- AddForeignKey
ALTER TABLE "Hospital" ADD CONSTRAINT "Hospital_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

