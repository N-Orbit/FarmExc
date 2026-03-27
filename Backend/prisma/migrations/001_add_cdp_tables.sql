-- CreateTable
CREATE TABLE "cdp_events" (
    "id" TEXT NOT NULL,
    "anonymous_id" TEXT,
    "user_id" TEXT,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "properties" JSONB NOT NULL,
    "session_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "referrer" TEXT,
    "tenant_id" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cdp_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cdp_segments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "sql_query" TEXT,
    "visual_config" JSONB,
    "conditions" JSONB,
    "tenant_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cdp_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cdp_segment_memberships" (
    "id" TEXT NOT NULL,
    "segment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),

    CONSTRAINT "cdp_segment_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cdp_identity_matches" (
    "id" TEXT NOT NULL,
    "anonymous_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "match_type" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "tenant_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cdp_identity_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cdp_consents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "channel" TEXT,
    "purpose" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cdp_consents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cdp_events_user_id_idx" ON "cdp_events"("user_id");

CREATE INDEX "cdp_events_anonymous_id_idx" ON "cdp_events"("anonymous_id");

CREATE INDEX "cdp_events_timestamp_idx" ON "cdp_events"("timestamp");

CREATE INDEX "cdp_events_event_name_idx" ON "cdp_events"("event_name");

CREATE INDEX "cdp_events_tenant_id_idx" ON "cdp_events"("tenant_id");

CREATE INDEX "cdp_segments_tenant_id_idx" ON "cdp_segments"("tenant_id");

CREATE INDEX "cdp_segments_is_active_idx" ON "cdp_segments"("is_active");

CREATE INDEX "cdp_segment_memberships_user_id_idx" ON "cdp_segment_memberships"("user_id");

CREATE INDEX "cdp_segment_memberships_segment_id_idx" ON "cdp_segment_memberships"("segment_id");

CREATE INDEX "cdp_identity_matches_anonymous_id_idx" ON "cdp_identity_matches"("anonymous_id");

CREATE INDEX "cdp_identity_matches_user_id_idx" ON "cdp_identity_matches"("user_id");

CREATE INDEX "cdp_identity_matches_confidence_idx" ON "cdp_identity_matches"("confidence");

CREATE INDEX "cdp_consents_user_id_idx" ON "cdp_consents"("user_id");

-- AddForeignKey
ALTER TABLE "cdp_events" ADD CONSTRAINT "cdp_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cdp_segment_memberships" ADD CONSTRAINT "cdp_segment_memberships_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "cdp_segments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cdp_segment_memberships" ADD CONSTRAINT "cdp_segment_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cdp_identity_matches" ADD CONSTRAINT "cdp_identity_matches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cdp_consents" ADD CONSTRAINT "cdp_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddUniqueConstraint
CREATE UNIQUE INDEX "cdp_segment_memberships_segment_id_user_id_key" ON "cdp_segment_memberships"("segment_id", "user_id");

CREATE UNIQUE INDEX "cdp_consents_user_id_type_channel_key" ON "cdp_consents"("user_id", "type", "channel");
