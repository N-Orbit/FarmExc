-- CreateTable
CREATE TABLE "regulatory_reports" (
    "id" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "regulatory_body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "report_period" TEXT NOT NULL,
    "submission_id" TEXT,
    "submission_date" TIMESTAMP(3),
    "acceptance_date" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "report_data" JSONB NOT NULL,
    "metadata" JSONB,
    "file_path" TEXT,
    "file_checksum" TEXT,
    "encryption_key_id" TEXT,
    "tenant_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regulatory_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulatory_transactions" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "transaction_hash" TEXT NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "from_address" TEXT NOT NULL,
    "to_address" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "asset" TEXT NOT NULL,
    "usd_value" BIGINT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "block_number" BIGINT,
    "block_hash" TEXT,
    "metadata" JSONB,
    "risk_score" DOUBLE PRECISION,
    "is_suspicious" BOOLEAN NOT NULL DEFAULT false,
    "suspicion_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regulatory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulatory_audit_trails" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "user_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regulatory_audit_trails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_configurations" (
    "id" TEXT NOT NULL,
    "regulatory_body" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "reporting_frequency" TEXT NOT NULL,
    "submission_format" TEXT NOT NULL,
    "threshold_rules" JSONB,
    "suspicious_patterns" JSONB,
    "retention_period_years" INTEGER NOT NULL DEFAULT 7,
    "encryption_required" BOOLEAN NOT NULL DEFAULT true,
    "notification_emails" TEXT[],
    "last_report_period" TEXT,
    "tenant_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examiner_access" (
    "id" TEXT NOT NULL,
    "examiner_id" TEXT NOT NULL,
    "regulatory_body" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "access_level" TEXT NOT NULL,
    "permissions" TEXT[],
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "ip_address" TEXT,
    "tenant_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "examiner_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "regulatory_reports_report_type_idx" ON "regulatory_reports"("report_type");

CREATE INDEX "regulatory_reports_regulatory_body_idx" ON "regulatory_reports"("regulatory_body");

CREATE INDEX "regulatory_reports_status_idx" ON "regulatory_reports"("status");

CREATE INDEX "regulatory_reports_report_period_idx" ON "regulatory_reports"("report_period");

CREATE INDEX "regulatory_reports_submission_date_idx" ON "regulatory_reports"("submission_date");

CREATE INDEX "regulatory_reports_tenant_id_idx" ON "regulatory_reports"("tenant_id");

CREATE INDEX "regulatory_transactions_report_id_idx" ON "regulatory_transactions"("report_id");

CREATE INDEX "regulatory_transactions_transaction_hash_idx" ON "regulatory_transactions"("transaction_hash");

CREATE INDEX "regulatory_transactions_from_address_idx" ON "regulatory_transactions"("from_address");

CREATE INDEX "regulatory_transactions_to_address_idx" ON "regulatory_transactions"("to_address");

CREATE INDEX "regulatory_transactions_timestamp_idx" ON "regulatory_transactions"("timestamp");

CREATE INDEX "regulatory_transactions_is_suspicious_idx" ON "regulatory_transactions"("is_suspicious");

CREATE INDEX "regulatory_audit_trails_report_id_idx" ON "regulatory_audit_trails"("report_id");

CREATE INDEX "regulatory_audit_trails_action_idx" ON "regulatory_audit_trails"("action");

CREATE INDEX "regulatory_audit_trails_created_at_idx" ON "regulatory_audit_trails"("created_at");

CREATE INDEX "compliance_configurations_regulatory_body_idx" ON "compliance_configurations"("regulatory_body");

CREATE INDEX "compliance_configurations_report_type_idx" ON "compliance_configurations"("report_type");

CREATE INDEX "compliance_configurations_is_active_idx" ON "compliance_configurations"("is_active");

CREATE INDEX "examiner_access_examiner_id_idx" ON "examiner_access"("examiner_id");

CREATE INDEX "examiner_access_regulatory_body_idx" ON "examiner_access"("regulatory_body");

CREATE INDEX "examiner_access_is_active_idx" ON "examiner_access"("is_active");

-- AddForeignKey
ALTER TABLE "regulatory_transactions" ADD CONSTRAINT "regulatory_transactions_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "regulatory_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "regulatory_audit_trails" ADD CONSTRAINT "regulatory_audit_trails_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "regulatory_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddUniqueConstraint
CREATE UNIQUE INDEX "regulatory_transactions_transaction_hash_key" ON "regulatory_transactions"("transaction_hash");

CREATE UNIQUE INDEX "compliance_configurations_regulatory_body_report_type_tenant_id_key" ON "compliance_configurations"("regulatory_body", "report_type", "tenant_id");

CREATE UNIQUE INDEX "examiner_access_examiner_id_key" ON "examiner_access"("examiner_id");
