CREATE TYPE "public"."medtask_actor_type" AS ENUM('user', 'agent', 'automation', 'system');--> statement-breakpoint
CREATE TYPE "public"."medtask_agent_run_status" AS ENUM('queued', 'claimed', 'running', 'waiting_approval', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."medtask_agent_status" AS ENUM('active', 'paused', 'error');--> statement-breakpoint
CREATE TYPE "public"."medtask_approval_status" AS ENUM('pending', 'approved', 'rejected', 'adjusted');--> statement-breakpoint
CREATE TYPE "public"."medtask_area_member_role" AS ENUM('lead', 'member', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."medtask_assignee_type" AS ENUM('user', 'agent');--> statement-breakpoint
CREATE TYPE "public"."medtask_dependency_type" AS ENUM('blocks', 'blocked_by', 'relates_to', 'duplicates');--> statement-breakpoint
CREATE TYPE "public"."medtask_member_role" AS ENUM('owner', 'admin', 'member', 'guest');--> statement-breakpoint
CREATE TYPE "public"."medtask_project_methodology" AS ENUM('simple', 'kanban', 'scrum', 'scrumban');--> statement-breakpoint
CREATE TYPE "public"."medtask_sprint_status" AS ENUM('future', 'active', 'completed');--> statement-breakpoint
CREATE TYPE "public"."medtask_status_category" AS ENUM('backlog', 'todo', 'in_progress', 'review', 'done', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."medtask_task_priority" AS ENUM('urgent', 'high', 'medium', 'low', 'none');--> statement-breakpoint
CREATE TYPE "public"."medtask_task_type" AS ENUM('task', 'bug', 'story', 'epic', 'subtask', 'agent_task');--> statement-breakpoint
CREATE TABLE "medtask_activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid,
	"task_id" uuid,
	"actor_type" "medtask_actor_type" NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" varchar(100) NOT NULL,
	"before_state" jsonb,
	"after_state" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medtask_agent_run_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medtask_agent_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"status" "medtask_agent_run_status" DEFAULT 'queued' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"heartbeat_at" timestamp with time zone,
	"lease_expires_at" timestamp with time zone,
	"token_usage" jsonb DEFAULT '{"prompt":0,"completion":0,"total":0}'::jsonb,
	"cost_estimate" real DEFAULT 0,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "medtask_agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"avatar_url" text,
	"description" text,
	"role" varchar(255) NOT NULL,
	"model" varchar(100) DEFAULT 'gemini-2.0-flash' NOT NULL,
	"system_prompt" text,
	"allowed_tools" jsonb DEFAULT '[]'::jsonb,
	"max_concurrent_tasks" integer DEFAULT 3 NOT NULL,
	"monthly_token_budget" integer DEFAULT 5000000 NOT NULL,
	"current_tokens_used" integer DEFAULT 0 NOT NULL,
	"timeout_seconds" integer DEFAULT 300 NOT NULL,
	"status" "medtask_agent_status" DEFAULT 'active' NOT NULL,
	"owner_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medtask_api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid,
	"agent_id" uuid,
	"name" varchar(255) NOT NULL,
	"key_hash" varchar(255) NOT NULL,
	"prefix" varchar(20) NOT NULL,
	"scopes" jsonb DEFAULT '["read","write"]'::jsonb NOT NULL,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medtask_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"run_id" uuid,
	"agent_id" uuid NOT NULL,
	"requested_action" varchar(255) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "medtask_approval_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"review_comment" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medtask_area_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"area_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"role" "medtask_area_member_role" DEFAULT 'member' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medtask_areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"icon" varchar(50) DEFAULT 'folder',
	"color" varchar(50) DEFAULT '#3b82f6',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "medtask_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"storage_path" text NOT NULL,
	"public_url" text NOT NULL,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medtask_automation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"automation_id" uuid NOT NULL,
	"task_id" uuid,
	"status" varchar(50) NOT NULL,
	"error" text,
	"executed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medtask_automations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid,
	"name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"trigger_type" varchar(100) NOT NULL,
	"trigger_config" jsonb DEFAULT '{}'::jsonb,
	"conditions" jsonb DEFAULT '[]'::jsonb,
	"actions" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medtask_checklist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"checklist_id" uuid NOT NULL,
	"title" text NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_by" uuid,
	"position" real DEFAULT 0 NOT NULL,
	"due_date" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "medtask_checklists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"title" varchar(255) DEFAULT 'Checklist' NOT NULL,
	"position" real DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medtask_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"author_type" "medtask_actor_type" DEFAULT 'user' NOT NULL,
	"author_id" uuid NOT NULL,
	"content" text NOT NULL,
	"reactions" jsonb DEFAULT '{}'::jsonb,
	"parent_comment_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medtask_custom_field_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid,
	"name" varchar(100) NOT NULL,
	"field_type" varchar(50) NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint
CREATE TABLE "medtask_form_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"task_id" uuid,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medtask_forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"slug" varchar(255) NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"field_mapping" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "medtask_forms_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "medtask_labels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid,
	"name" varchar(100) NOT NULL,
	"color" varchar(50) DEFAULT '#64748b' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medtask_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"avatar_url" text,
	"role" "medtask_member_role" DEFAULT 'member' NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medtask_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medtask_project_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"role" "medtask_area_member_role" DEFAULT 'member' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medtask_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"area_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"icon" varchar(50) DEFAULT 'layout',
	"color" varchar(50) DEFAULT '#10b981',
	"methodology" "medtask_project_methodology" DEFAULT 'kanban' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "medtask_sprints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"goal" text,
	"status" "medtask_sprint_status" DEFAULT 'future' NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"capacity_points" integer DEFAULT 0,
	"committed_points" integer DEFAULT 0,
	"completed_points" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medtask_statuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(50) DEFAULT '#94a3b8' NOT NULL,
	"position" real DEFAULT 0 NOT NULL,
	"category" "medtask_status_category" DEFAULT 'todo' NOT NULL,
	"wip_limit" integer,
	"definition_of_done" text
);
--> statement-breakpoint
CREATE TABLE "medtask_task_assignees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"assignee_type" "medtask_assignee_type" DEFAULT 'user' NOT NULL,
	"assignee_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medtask_task_dependencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"depends_on_task_id" uuid NOT NULL,
	"dependency_type" "medtask_dependency_type" DEFAULT 'blocks' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medtask_task_labels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"label_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medtask_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"area_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"task_type" "medtask_task_type" DEFAULT 'task' NOT NULL,
	"status_id" uuid NOT NULL,
	"priority" "medtask_task_priority" DEFAULT 'none' NOT NULL,
	"reporter_id" uuid,
	"parent_id" uuid,
	"epic_id" uuid,
	"sprint_id" uuid,
	"position" real DEFAULT 0 NOT NULL,
	"start_date" timestamp with time zone,
	"due_date" timestamp with time zone,
	"estimated_hours" real,
	"story_points" integer,
	"ai_context" text,
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"recurrence_rule" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "medtask_time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"description" text,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"is_running" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medtask_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid,
	"user_id" uuid,
	"name" varchar(100) NOT NULL,
	"view_type" varchar(50) NOT NULL,
	"filters" jsonb DEFAULT '{}'::jsonb,
	"grouping" jsonb DEFAULT '{}'::jsonb,
	"sorting" jsonb DEFAULT '{}'::jsonb,
	"columns" jsonb DEFAULT '[]'::jsonb,
	"is_shared" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medtask_webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_id" uuid NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status_code" integer,
	"response_body" text,
	"success" boolean DEFAULT false NOT NULL,
	"attempt" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medtask_webhooks_out" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"url" text NOT NULL,
	"secret" varchar(255) NOT NULL,
	"event_types" jsonb DEFAULT '["*"]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medtask_workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"logo_url" text,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"owner_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "medtask_workspaces_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "medtask_activity_log" ADD CONSTRAINT "medtask_activity_log_workspace_id_medtask_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."medtask_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_agent_run_events" ADD CONSTRAINT "medtask_agent_run_events_run_id_medtask_agent_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."medtask_agent_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_agent_runs" ADD CONSTRAINT "medtask_agent_runs_workspace_id_medtask_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."medtask_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_agent_runs" ADD CONSTRAINT "medtask_agent_runs_agent_id_medtask_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."medtask_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_agent_runs" ADD CONSTRAINT "medtask_agent_runs_task_id_medtask_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."medtask_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_agents" ADD CONSTRAINT "medtask_agents_workspace_id_medtask_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."medtask_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_api_keys" ADD CONSTRAINT "medtask_api_keys_workspace_id_medtask_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."medtask_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_api_keys" ADD CONSTRAINT "medtask_api_keys_agent_id_medtask_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."medtask_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_approvals" ADD CONSTRAINT "medtask_approvals_workspace_id_medtask_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."medtask_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_approvals" ADD CONSTRAINT "medtask_approvals_task_id_medtask_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."medtask_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_approvals" ADD CONSTRAINT "medtask_approvals_run_id_medtask_agent_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."medtask_agent_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_approvals" ADD CONSTRAINT "medtask_approvals_agent_id_medtask_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."medtask_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_area_members" ADD CONSTRAINT "medtask_area_members_area_id_medtask_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."medtask_areas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_area_members" ADD CONSTRAINT "medtask_area_members_member_id_medtask_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."medtask_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_areas" ADD CONSTRAINT "medtask_areas_workspace_id_medtask_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."medtask_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_attachments" ADD CONSTRAINT "medtask_attachments_workspace_id_medtask_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."medtask_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_attachments" ADD CONSTRAINT "medtask_attachments_task_id_medtask_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."medtask_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_automation_runs" ADD CONSTRAINT "medtask_automation_runs_automation_id_medtask_automations_id_fk" FOREIGN KEY ("automation_id") REFERENCES "public"."medtask_automations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_automations" ADD CONSTRAINT "medtask_automations_workspace_id_medtask_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."medtask_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_automations" ADD CONSTRAINT "medtask_automations_project_id_medtask_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."medtask_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_checklist_items" ADD CONSTRAINT "medtask_checklist_items_checklist_id_medtask_checklists_id_fk" FOREIGN KEY ("checklist_id") REFERENCES "public"."medtask_checklists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_checklists" ADD CONSTRAINT "medtask_checklists_task_id_medtask_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."medtask_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_comments" ADD CONSTRAINT "medtask_comments_workspace_id_medtask_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."medtask_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_comments" ADD CONSTRAINT "medtask_comments_task_id_medtask_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."medtask_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_custom_field_definitions" ADD CONSTRAINT "medtask_custom_field_definitions_workspace_id_medtask_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."medtask_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_custom_field_definitions" ADD CONSTRAINT "medtask_custom_field_definitions_project_id_medtask_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."medtask_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_form_submissions" ADD CONSTRAINT "medtask_form_submissions_form_id_medtask_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."medtask_forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_form_submissions" ADD CONSTRAINT "medtask_form_submissions_task_id_medtask_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."medtask_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_forms" ADD CONSTRAINT "medtask_forms_workspace_id_medtask_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."medtask_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_forms" ADD CONSTRAINT "medtask_forms_project_id_medtask_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."medtask_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_labels" ADD CONSTRAINT "medtask_labels_workspace_id_medtask_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."medtask_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_labels" ADD CONSTRAINT "medtask_labels_project_id_medtask_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."medtask_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_members" ADD CONSTRAINT "medtask_members_workspace_id_medtask_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."medtask_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_notifications" ADD CONSTRAINT "medtask_notifications_workspace_id_medtask_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."medtask_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_project_members" ADD CONSTRAINT "medtask_project_members_project_id_medtask_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."medtask_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_project_members" ADD CONSTRAINT "medtask_project_members_member_id_medtask_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."medtask_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_projects" ADD CONSTRAINT "medtask_projects_workspace_id_medtask_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."medtask_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_projects" ADD CONSTRAINT "medtask_projects_area_id_medtask_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."medtask_areas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_sprints" ADD CONSTRAINT "medtask_sprints_workspace_id_medtask_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."medtask_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_sprints" ADD CONSTRAINT "medtask_sprints_project_id_medtask_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."medtask_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_statuses" ADD CONSTRAINT "medtask_statuses_workspace_id_medtask_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."medtask_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_statuses" ADD CONSTRAINT "medtask_statuses_project_id_medtask_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."medtask_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_task_assignees" ADD CONSTRAINT "medtask_task_assignees_task_id_medtask_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."medtask_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_task_dependencies" ADD CONSTRAINT "medtask_task_dependencies_task_id_medtask_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."medtask_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_task_dependencies" ADD CONSTRAINT "medtask_task_dependencies_depends_on_task_id_medtask_tasks_id_fk" FOREIGN KEY ("depends_on_task_id") REFERENCES "public"."medtask_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_task_labels" ADD CONSTRAINT "medtask_task_labels_task_id_medtask_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."medtask_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_task_labels" ADD CONSTRAINT "medtask_task_labels_label_id_medtask_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."medtask_labels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_tasks" ADD CONSTRAINT "medtask_tasks_workspace_id_medtask_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."medtask_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_tasks" ADD CONSTRAINT "medtask_tasks_project_id_medtask_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."medtask_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_tasks" ADD CONSTRAINT "medtask_tasks_area_id_medtask_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."medtask_areas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_tasks" ADD CONSTRAINT "medtask_tasks_status_id_medtask_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."medtask_statuses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_tasks" ADD CONSTRAINT "medtask_tasks_sprint_id_medtask_sprints_id_fk" FOREIGN KEY ("sprint_id") REFERENCES "public"."medtask_sprints"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_time_entries" ADD CONSTRAINT "medtask_time_entries_workspace_id_medtask_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."medtask_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_time_entries" ADD CONSTRAINT "medtask_time_entries_task_id_medtask_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."medtask_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_views" ADD CONSTRAINT "medtask_views_workspace_id_medtask_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."medtask_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_views" ADD CONSTRAINT "medtask_views_project_id_medtask_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."medtask_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_webhook_deliveries" ADD CONSTRAINT "medtask_webhook_deliveries_webhook_id_medtask_webhooks_out_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."medtask_webhooks_out"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medtask_webhooks_out" ADD CONSTRAINT "medtask_webhooks_out_workspace_id_medtask_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."medtask_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "medtask_activity_task_idx" ON "medtask_activity_log" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "medtask_activity_ws_idx" ON "medtask_activity_log" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "medtask_agent_run_events_run_idx" ON "medtask_agent_run_events" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "medtask_agent_runs_agent_idx" ON "medtask_agent_runs" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "medtask_agent_runs_task_idx" ON "medtask_agent_runs" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "medtask_agents_ws_idx" ON "medtask_agents" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "medtask_api_keys_hash_idx" ON "medtask_api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "medtask_approvals_ws_idx" ON "medtask_approvals" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "medtask_approvals_task_idx" ON "medtask_approvals" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "medtask_areas_ws_idx" ON "medtask_areas" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "medtask_comments_task_idx" ON "medtask_comments" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "medtask_members_ws_idx" ON "medtask_members" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "medtask_members_email_idx" ON "medtask_members" USING btree ("email");--> statement-breakpoint
CREATE INDEX "medtask_notifications_recipient_idx" ON "medtask_notifications" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "medtask_projects_ws_idx" ON "medtask_projects" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "medtask_projects_area_idx" ON "medtask_projects" USING btree ("area_id");--> statement-breakpoint
CREATE INDEX "medtask_sprints_project_idx" ON "medtask_sprints" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "medtask_statuses_project_idx" ON "medtask_statuses" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "medtask_assignees_task_idx" ON "medtask_task_assignees" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "medtask_assignees_id_idx" ON "medtask_task_assignees" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "medtask_tasks_ws_idx" ON "medtask_tasks" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "medtask_tasks_project_idx" ON "medtask_tasks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "medtask_tasks_status_idx" ON "medtask_tasks" USING btree ("status_id");--> statement-breakpoint
CREATE INDEX "medtask_tasks_sprint_idx" ON "medtask_tasks" USING btree ("sprint_id");