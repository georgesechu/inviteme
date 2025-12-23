-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "location" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_userId_idx" ON "Event"("userId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add eventId column as nullable first
ALTER TABLE "Guest" ADD COLUMN "eventId" TEXT;

-- Create default events for users who have guests and assign guests to those events
DO $$
DECLARE
    user_record RECORD;
    default_event_id TEXT;
BEGIN
    -- Loop through each user that has guests
    FOR user_record IN 
        SELECT DISTINCT "userId" FROM "Guest" WHERE "eventId" IS NULL
    LOOP
        -- Generate a UUID for the default event
        default_event_id := gen_random_uuid()::TEXT;
        
        -- Create a default event for this user
        INSERT INTO "Event" ("id", "userId", "name", "createdAt", "updatedAt")
        VALUES (default_event_id, user_record."userId", 'Default Event', NOW(), NOW());
        
        -- Assign all guests of this user to the default event
        UPDATE "Guest" 
        SET "eventId" = default_event_id 
        WHERE "userId" = user_record."userId" AND "eventId" IS NULL;
    END LOOP;
END $$;

-- Now make eventId required
ALTER TABLE "Guest" ALTER COLUMN "eventId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Guest_eventId_idx" ON "Guest"("eventId");

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
