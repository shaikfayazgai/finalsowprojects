-- CreateEnum
CREATE TYPE "Role" AS ENUM ('contributor', 'enterprise', 'admin', 'reviewer');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "phone" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "provider" TEXT NOT NULL DEFAULT 'credentials',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContributorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contribType" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL,
    "departmentCategory" TEXT NOT NULL,
    "departmentOther" TEXT,
    "availability" TEXT NOT NULL,
    "degree" TEXT,
    "branch" TEXT,
    "linkedin" TEXT,
    "careerStage" TEXT,
    "yearsExperience" TEXT,
    "workStart" TEXT,
    "workEnd" TEXT,
    "primarySkills" TEXT[],
    "secondarySkills" TEXT[],
    "otherSkills" TEXT[],
    "ndaAccepted" BOOLEAN NOT NULL DEFAULT false,
    "ndaSignature" TEXT,
    "resumeFileKey" TEXT,
    "acceptTos" BOOLEAN NOT NULL DEFAULT false,
    "acceptCoc" BOOLEAN NOT NULL DEFAULT false,
    "acceptPrivacy" BOOLEAN NOT NULL DEFAULT false,
    "acceptFee" BOOLEAN NOT NULL DEFAULT false,
    "acceptAhp" BOOLEAN NOT NULL DEFAULT false,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContributorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnterpriseProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgName" TEXT NOT NULL,
    "orgType" TEXT NOT NULL,
    "orgTypeOther" TEXT,
    "industry" TEXT NOT NULL,
    "industryOther" TEXT,
    "companySize" TEXT NOT NULL,
    "website" TEXT,
    "hqCountry" TEXT,
    "hqCity" TEXT,
    "adminTitle" TEXT NOT NULL,
    "adminDept" TEXT,
    "incorporationCountry" TEXT,
    "incorporationFileKey" TEXT,
    "acceptTos" BOOLEAN NOT NULL DEFAULT false,
    "acceptPp" BOOLEAN NOT NULL DEFAULT false,
    "acceptEsa" BOOLEAN NOT NULL DEFAULT false,
    "acceptAhp" BOOLEAN NOT NULL DEFAULT false,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnterpriseProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ContributorProfile_userId_key" ON "ContributorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EnterpriseProfile_userId_key" ON "EnterpriseProfile"("userId");

-- AddForeignKey
ALTER TABLE "ContributorProfile" ADD CONSTRAINT "ContributorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseProfile" ADD CONSTRAINT "EnterpriseProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
