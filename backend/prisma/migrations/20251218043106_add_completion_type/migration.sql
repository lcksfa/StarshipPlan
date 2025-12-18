-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_task_completions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "starCoins" INTEGER NOT NULL,
    "expGained" INTEGER NOT NULL,
    "streak" INTEGER,
    "bonusMultiplier" REAL DEFAULT 1.0,
    "completionType" TEXT NOT NULL DEFAULT 'SINGLE',
    CONSTRAINT "task_completions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "task_completions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_task_completions" ("bonusMultiplier", "completedAt", "expGained", "id", "starCoins", "streak", "taskId", "userId") SELECT "bonusMultiplier", "completedAt", "expGained", "id", "starCoins", "streak", "taskId", "userId" FROM "task_completions";
DROP TABLE "task_completions";
ALTER TABLE "new_task_completions" RENAME TO "task_completions";
CREATE UNIQUE INDEX "task_completions_taskId_userId_completedAt_key" ON "task_completions"("taskId", "userId", "completedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
