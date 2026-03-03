-- Horizon CS Server Manager Database Schema
-- This script is automatically executed by PostgreSQL on first container startup
-- when the data volume is empty (via docker-entrypoint-initdb.d)

-- Create Servers table
CREATE TABLE "Servers" (
    "ServerKey" VARCHAR(50) PRIMARY KEY,
    "ScoreCt" INTEGER NOT NULL DEFAULT 0,
    "ScoreT" INTEGER NOT NULL DEFAULT 0,
    "Map" VARCHAR(100),
    "Rounds" INTEGER NOT NULL DEFAULT 0,
    "Admin" BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create Teams table
CREATE TABLE "Teams" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL
);

-- Create Players table with foreign key to Teams
CREATE TABLE "Players" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "TeamId" INTEGER NOT NULL,
    CONSTRAINT "FK_Players_Teams_TeamId" FOREIGN KEY ("TeamId")
        REFERENCES "Teams"("Id") ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX "IX_Players_TeamId" ON "Players"("TeamId");
CREATE INDEX "IX_Servers_Map" ON "Servers"("Map");

-- Optional: Insert seed data for testing
-- Uncomment below to add test data

-- INSERT INTO "Servers" ("ServerKey", "ScoreCt", "ScoreT", "Map", "Rounds", "Admin")
-- VALUES ('test-server-1', 0, 0, 'de_dust2', 0, FALSE);

-- INSERT INTO "Teams" ("Name") VALUES ('Counter-Terrorists'), ('Terrorists');
