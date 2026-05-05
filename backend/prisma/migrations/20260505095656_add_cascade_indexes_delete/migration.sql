-- DropForeignKey
ALTER TABLE "credentials" DROP CONSTRAINT "credentials_student_id_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_user_id_fkey";

-- CreateIndex
CREATE INDEX "activity_logs_actor_id_idx" ON "activity_logs"("actor_id");

-- CreateIndex
CREATE INDEX "activity_logs_action_type_idx" ON "activity_logs"("action_type");

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");

-- CreateIndex
CREATE INDEX "credentials_student_id_idx" ON "credentials"("student_id");

-- CreateIndex
CREATE INDEX "credentials_status_idx" ON "credentials"("status");

-- CreateIndex
CREATE INDEX "credentials_credential_hash_idx" ON "credentials"("credential_hash");

-- CreateIndex
CREATE INDEX "students_faculty_idx" ON "students"("faculty");

-- CreateIndex
CREATE INDEX "students_academic_status_idx" ON "students"("academic_status");

-- CreateIndex
CREATE INDEX "students_enrollment_year_idx" ON "students"("enrollment_year");

-- CreateIndex
CREATE INDEX "verification_logs_credential_id_idx" ON "verification_logs"("credential_id");

-- CreateIndex
CREATE INDEX "verification_logs_checked_at_idx" ON "verification_logs"("checked_at");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
