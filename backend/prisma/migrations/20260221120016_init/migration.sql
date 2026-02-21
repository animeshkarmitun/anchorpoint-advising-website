-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'TAX_ADVISOR', 'OPERATIONS', 'SUPPORT', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('EMAIL', 'GOOGLE', 'PHONE');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "IncomeSource" AS ENUM ('SALARY', 'BUSINESS', 'FREELANCE', 'RENTAL', 'INVESTMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "TaxpayerCategory" AS ENUM ('INDIVIDUAL', 'COMPANY', 'PARTNERSHIP', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('NID', 'TIN_CERTIFICATE', 'SALARY_CERTIFICATE', 'BANK_STATEMENT', 'RENTAL_AGREEMENT', 'INVESTMENT_PROOF', 'PREVIOUS_RETURN', 'TRADE_LICENSE', 'ASSET_STATEMENT', 'FILED_RETURN', 'ACKNOWLEDGEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'NEEDS_REUPLOAD');

-- CreateEnum
CREATE TYPE "FilingStatus" AS ENUM ('INITIATED', 'DOCUMENTS_PENDING', 'DOCUMENTS_RECEIVED', 'UNDER_PREPARATION', 'REVIEW_READY', 'CUSTOMER_APPROVED', 'E_FILED', 'ACKNOWLEDGED', 'COMPLETED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BKASH', 'NAGAD', 'ROCKET', 'CARD', 'BANK_TRANSFER', 'CASH');

-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ConsultationMedium" AS ENUM ('PHONE', 'VIDEO', 'IN_PERSON');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('BILLING', 'TECHNICAL', 'TAX_QUERY', 'DOCUMENT', 'GENERAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "authProvider" "AuthProvider" NOT NULL DEFAULT 'EMAIL',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InviteToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InviteToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "fullNameBn" TEXT,
    "nid" TEXT,
    "tin" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "address" TEXT,
    "city" TEXT,
    "district" TEXT,
    "taxZone" TEXT,
    "taxCircle" TEXT,
    "taxpayerCategory" "TaxpayerCategory" NOT NULL DEFAULT 'INDIVIDUAL',
    "incomeSources" "IncomeSource"[],
    "employerName" TEXT,
    "businessName" TEXT,
    "tradeLicenseNo" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifySms" BOOLEAN NOT NULL DEFAULT true,
    "referralCode" TEXT,
    "referredBy" TEXT,
    "vip" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filingId" TEXT,
    "category" "DocumentCategory" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionNote" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "parentId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Filing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "advisorId" TEXT,
    "assessmentYear" TEXT NOT NULL,
    "status" "FilingStatus" NOT NULL DEFAULT 'INITIATED',
    "serviceType" TEXT NOT NULL,
    "totalIncome" DECIMAL(65,30),
    "taxPayable" DECIMAL(65,30),
    "taxPaid" DECIMAL(65,30),
    "refundAmount" DECIMAL(65,30),
    "filedAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Filing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FilingStatusLog" (
    "id" TEXT NOT NULL,
    "filingId" TEXT NOT NULL,
    "from" "FilingStatus" NOT NULL,
    "to" "FilingStatus" NOT NULL,
    "changedBy" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FilingStatusLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filingId" TEXT,
    "consultationId" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "gatewayResponse" JSONB,
    "couponId" TEXT,
    "discountAmount" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "fileKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "processedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountType" TEXT NOT NULL,
    "discountValue" DECIMAL(65,30) NOT NULL,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "minAmount" DECIMAL(65,30),
    "expiresAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consultation" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "medium" "ConsultationMedium" NOT NULL,
    "meetingLink" TEXT,
    "status" "ConsultationStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "followUp" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvisorSchedule" (
    "id" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotDuration" INTEGER NOT NULL DEFAULT 30,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AdvisorSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleException" (
    "id" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,

    CONSTRAINT "ScheduleException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "participantA" TEXT NOT NULL,
    "participantB" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachmentKey" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedTo" TEXT,
    "subject" TEXT NOT NULL,
    "category" "TicketCategory" NOT NULL,
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketReply" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsContent" (
    "id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "data" JSONB NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoMeta" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImage" TEXT,
    "canonicalUrl" TEXT,
    "robots" TEXT NOT NULL DEFAULT 'index, follow',
    "structuredData" JSONB,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InviteToken_token_key" ON "InviteToken"("token");

-- CreateIndex
CREATE INDEX "InviteToken_token_idx" ON "InviteToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_userId_key" ON "CustomerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_referralCode_key" ON "CustomerProfile"("referralCode");

-- CreateIndex
CREATE INDEX "CustomerProfile_tin_idx" ON "CustomerProfile"("tin");

-- CreateIndex
CREATE INDEX "CustomerProfile_nid_idx" ON "CustomerProfile"("nid");

-- CreateIndex
CREATE INDEX "Document_userId_idx" ON "Document"("userId");

-- CreateIndex
CREATE INDEX "Document_filingId_idx" ON "Document"("filingId");

-- CreateIndex
CREATE INDEX "Document_status_idx" ON "Document"("status");

-- CreateIndex
CREATE INDEX "Document_category_idx" ON "Document"("category");

-- CreateIndex
CREATE INDEX "Filing_advisorId_idx" ON "Filing"("advisorId");

-- CreateIndex
CREATE INDEX "Filing_status_idx" ON "Filing"("status");

-- CreateIndex
CREATE INDEX "Filing_assessmentYear_idx" ON "Filing"("assessmentYear");

-- CreateIndex
CREATE UNIQUE INDEX "Filing_userId_assessmentYear_key" ON "Filing"("userId", "assessmentYear");

-- CreateIndex
CREATE INDEX "FilingStatusLog_filingId_idx" ON "FilingStatusLog"("filingId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_paymentId_key" ON "Invoice"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNo_key" ON "Invoice"("invoiceNo");

-- CreateIndex
CREATE INDEX "Refund_paymentId_idx" ON "Refund"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Consultation_clientId_idx" ON "Consultation"("clientId");

-- CreateIndex
CREATE INDEX "Consultation_advisorId_idx" ON "Consultation"("advisorId");

-- CreateIndex
CREATE INDEX "Consultation_scheduledAt_idx" ON "Consultation"("scheduledAt");

-- CreateIndex
CREATE INDEX "Consultation_status_idx" ON "Consultation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AdvisorSchedule_advisorId_dayOfWeek_key" ON "AdvisorSchedule"("advisorId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleException_advisorId_date_key" ON "ScheduleException"("advisorId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_participantA_participantB_key" ON "Conversation"("participantA", "participantB");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_receiverId_read_idx" ON "Message"("receiverId", "read");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Ticket_userId_idx" ON "Ticket"("userId");

-- CreateIndex
CREATE INDEX "Ticket_assignedTo_idx" ON "Ticket"("assignedTo");

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");

-- CreateIndex
CREATE INDEX "TicketReply_ticketId_idx" ON "TicketReply"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "CmsContent_section_locale_key" ON "CmsContent"("section", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "SeoMeta_page_locale_key" ON "SeoMeta"("page", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerProfile" ADD CONSTRAINT "CustomerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_filingId_fkey" FOREIGN KEY ("filingId") REFERENCES "Filing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Filing" ADD CONSTRAINT "Filing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Filing" ADD CONSTRAINT "Filing_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FilingStatusLog" ADD CONSTRAINT "FilingStatusLog_filingId_fkey" FOREIGN KEY ("filingId") REFERENCES "Filing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketReply" ADD CONSTRAINT "TicketReply_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
