--
-- PostgreSQL database dump for SMART Radio Content Hub
-- Export Date: 2025-08-03T06:54:00.463Z
-- Total Tables: 17
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;

--
-- Table: download_logs
--

CREATE TABLE IF NOT EXISTS public."download_logs" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "file_id" uuid NOT NULL,
    "user_id" character varying NOT NULL,
    "user_email" character varying,
    "user_name" character varying,
    "user_role" character varying,
    "ip_address" character varying(45),
    "user_agent" text,
    "download_size" integer,
    "download_duration" integer,
    "download_status" character varying(20) DEFAULT 'completed'::character varying,
    "entity_type" character varying(50),
    "entity_id" uuid,
    "referer_page" text,
    "downloaded_at" timestamp without time zone DEFAULT now()
);

--
-- Table: episodes
--

CREATE TABLE IF NOT EXISTS public."episodes" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "project_id" uuid NOT NULL,
    "title" character varying(255) NOT NULL,
    "created_at" timestamp without time zone DEFAULT now(),
    "updated_at" timestamp without time zone DEFAULT now()
);

--
-- Table: file_folders
--

CREATE TABLE IF NOT EXISTS public."file_folders" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" character varying(255) NOT NULL,
    "description" text,
    "parent_folder_id" uuid,
    "entity_type" character varying(50) NOT NULL,
    "entity_id" uuid NOT NULL,
    "folder_path" text,
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT now(),
    "updated_at" timestamp without time zone DEFAULT now()
);

--
-- Table: files
--

CREATE TABLE IF NOT EXISTS public."files" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "filename" character varying(255) NOT NULL,
    "original_name" character varying(255) NOT NULL,
    "mime_type" character varying(100) NOT NULL,
    "file_size" integer NOT NULL,
    "file_data" text NOT NULL,
    "entity_type" character varying(50) NOT NULL,
    "entity_id" uuid,
    "folder_id" uuid,
    "uploaded_by" character varying,
    "sort_order" integer DEFAULT 0,
    "tags" ARRAY,
    "description" text,
    "version" integer DEFAULT 1,
    "is_archived" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "file_path" text,
    "checksum" character varying(64),
    "access_level" character varying(20) DEFAULT 'project'::character varying,
    "download_count" integer DEFAULT 0,
    "last_accessed_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT now(),
    "updated_at" timestamp without time zone DEFAULT now()
);

--
-- Table: free_project_access
--

CREATE TABLE IF NOT EXISTS public."free_project_access" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "radio_station_id" uuid NOT NULL,
    "project_id" uuid NOT NULL,
    "granted_by_user_id" uuid,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT now()
);

--
-- Table: notifications
--

CREATE TABLE IF NOT EXISTS public."notifications" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" character varying NOT NULL,
    "type" character varying(50) NOT NULL,
    "title" character varying(255) NOT NULL,
    "message" text NOT NULL,
    "related_user_id" character varying,
    "related_user_email" character varying,
    "related_user_name" character varying,
    "is_read" boolean DEFAULT false,
    "is_archived" boolean DEFAULT false,
    "priority" character varying(20) DEFAULT 'normal'::character varying,
    "action_url" character varying(500),
    "metadata" jsonb,
    "created_at" timestamp without time zone DEFAULT now(),
    "read_at" timestamp without time zone
);

--
-- Table: onboarding_form_config
--

CREATE TABLE IF NOT EXISTS public."onboarding_form_config" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "version" integer DEFAULT 1,
    "is_active" boolean DEFAULT true,
    "questions" jsonb NOT NULL,
    "created_by" character varying NOT NULL,
    "created_at" timestamp without time zone DEFAULT now(),
    "updated_at" timestamp without time zone DEFAULT now()
);

--
-- Data for table: onboarding_form_config
--

INSERT INTO public."onboarding_form_config" ("id", "version", "is_active", "questions", "created_by", "created_at", "updated_at") VALUES ('1bc23c40-d0e8-4942-9acc-f463f8fae8c2', 1, true, '[{"id":"name","type":"text","label":"What is your name?","compulsory":true},{"id":"role","type":"radio","label":"What is your primary role?","options":["Radio Host","Producer","Script Writer","Content Manager","Technical Director"],"compulsory":true},{"id":"experience","type":"radio","label":"How many years of radio experience do you have?","options":["Less than 1 year","1-3 years","3-5 years","5-10 years","More than 10 years"],"compulsory":true},{"id":"interests","type":"checkbox","label":"What type of content are you most interested in? (Select all that apply)","options":["News & Current Affairs","Music Shows","Talk Shows","Educational Content","Community Programs","Sports Commentary"],"compulsory":false},{"id":"station_type","type":"radio","label":"What type of radio station are you affiliated with?","options":["Community Radio","Commercial Radio","Public Radio","Internet Radio","Podcast Network","Independent"],"compulsory":true},{"id":"goals","type":"text","label":"What are your main goals for using this platform?","compulsory":false}]', 'admin-001', '"2025-08-01T08:39:32.387Z"', '"2025-08-01T08:39:32.387Z"');

--
-- Table: onboarding_form_responses
--

CREATE TABLE IF NOT EXISTS public."onboarding_form_responses" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" character varying NOT NULL,
    "form_config_id" uuid NOT NULL,
    "question_id" character varying NOT NULL,
    "question_type" character varying(20) NOT NULL,
    "question_label" text NOT NULL,
    "response" jsonb NOT NULL,
    "is_compulsory" boolean DEFAULT false,
    "submitted_at" timestamp without time zone DEFAULT now()
);

--
-- Data for table: onboarding_form_responses
--

INSERT INTO public."onboarding_form_responses" ("id", "user_id", "form_config_id", "question_id", "question_type", "question_label", "response", "is_compulsory", "submitted_at") VALUES ('1d4d791d-466d-4912-bc9e-67a5bfc40021', 'BD_AbZEBFPJtuv6HoyKVB', '1bc23c40-d0e8-4942-9acc-f463f8fae8c2', 'name', 'text', 'What is your name?', 'Ashwani Swami', true, '"2025-08-03T06:26:14.247Z"');
INSERT INTO public."onboarding_form_responses" ("id", "user_id", "form_config_id", "question_id", "question_type", "question_label", "response", "is_compulsory", "submitted_at") VALUES ('5a272c0c-caed-4a8d-beb9-a2e165bef3e2', 'BD_AbZEBFPJtuv6HoyKVB', '1bc23c40-d0e8-4942-9acc-f463f8fae8c2', 'role', 'radio', 'What is your primary role?', 'Radio Host', true, '"2025-08-03T06:26:14.247Z"');
INSERT INTO public."onboarding_form_responses" ("id", "user_id", "form_config_id", "question_id", "question_type", "question_label", "response", "is_compulsory", "submitted_at") VALUES ('ba649fc6-b639-4523-ba11-c8f631e6c253', 'BD_AbZEBFPJtuv6HoyKVB', '1bc23c40-d0e8-4942-9acc-f463f8fae8c2', 'experience', 'radio', 'How many years of radio experience do you have?', 'Less than 1 year', true, '"2025-08-03T06:26:14.247Z"');
INSERT INTO public."onboarding_form_responses" ("id", "user_id", "form_config_id", "question_id", "question_type", "question_label", "response", "is_compulsory", "submitted_at") VALUES ('8447fd4d-0e60-4654-ad38-5d4c00a600a9', 'BD_AbZEBFPJtuv6HoyKVB', '1bc23c40-d0e8-4942-9acc-f463f8fae8c2', 'interests', 'checkbox', 'What type of content are you most interested in? (Select all that apply)', '["talk shows"]', false, '"2025-08-03T06:26:14.247Z"');
INSERT INTO public."onboarding_form_responses" ("id", "user_id", "form_config_id", "question_id", "question_type", "question_label", "response", "is_compulsory", "submitted_at") VALUES ('49dad86d-aba9-4594-944c-3b8ce3da6668', 'BD_AbZEBFPJtuv6HoyKVB', '1bc23c40-d0e8-4942-9acc-f463f8fae8c2', 'station_type', 'radio', 'What type of radio station are you affiliated with?', 'Internet Radio', true, '"2025-08-03T06:26:14.247Z"');
INSERT INTO public."onboarding_form_responses" ("id", "user_id", "form_config_id", "question_id", "question_type", "question_label", "response", "is_compulsory", "submitted_at") VALUES ('c64c9452-278c-4de2-8d71-47d43c08075e', 'BD_AbZEBFPJtuv6HoyKVB', '1bc23c40-d0e8-4942-9acc-f463f8fae8c2', 'goals', 'text', 'What are your main goals for using this platform?', 'Research', false, '"2025-08-03T06:26:14.247Z"');

--
-- Table: otp_verifications
--

CREATE TABLE IF NOT EXISTS public."otp_verifications" (
    "id" character varying NOT NULL,
    "user_id" character varying NOT NULL,
    "otp_code" character varying(6) NOT NULL,
    "purpose" character varying(50) NOT NULL,
    "expires_at" timestamp without time zone NOT NULL,
    "is_used" boolean DEFAULT false,
    "created_at" timestamp without time zone DEFAULT now()
);

--
-- Table: projects
--

CREATE TABLE IF NOT EXISTS public."projects" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" character varying(255) NOT NULL,
    "theme_id" uuid,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT now(),
    "updated_at" timestamp without time zone DEFAULT now()
);

--
-- Table: radio_stations
--

CREATE TABLE IF NOT EXISTS public."radio_stations" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid,
    "name" character varying(255) NOT NULL,
    "contact_person" character varying(255),
    "email" character varying(255) NOT NULL,
    "phone" character varying(50),
    "address" text,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT now(),
    "updated_at" timestamp without time zone DEFAULT now()
);

--
-- Table: script_topics
--

CREATE TABLE IF NOT EXISTS public."script_topics" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "script_id" uuid NOT NULL,
    "topic_id" uuid NOT NULL
);

--
-- Table: scripts
--

CREATE TABLE IF NOT EXISTS public."scripts" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "project_id" uuid NOT NULL,
    "author_id" character varying NOT NULL,
    "title" character varying(255) NOT NULL,
    "content" text NOT NULL,
    "status" character varying(50) NOT NULL DEFAULT 'Draft'::character varying,
    "language" character varying(10) NOT NULL DEFAULT 'en'::character varying,
    "original_script_id" uuid,
    "language_group" character varying(100),
    "is_original" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT now(),
    "updated_at" timestamp without time zone DEFAULT now()
);

--
-- Table: sessions
--

CREATE TABLE IF NOT EXISTS public."sessions" (
    "sid" character varying NOT NULL,
    "sess" jsonb NOT NULL,
    "expire" timestamp without time zone NOT NULL
);

--
-- Table: themes
--

CREATE TABLE IF NOT EXISTS public."themes" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" character varying(255) NOT NULL,
    "created_at" timestamp without time zone DEFAULT now(),
    "updated_at" timestamp without time zone DEFAULT now()
);

--
-- Data for table: themes
--

INSERT INTO public."themes" ("id", "name", "created_at", "updated_at") VALUES ('0f9b9165-18c4-4272-906e-e17e30721ea4', 'Technology', '"2025-08-01T08:30:49.041Z"', '"2025-08-01T08:30:49.041Z"');
INSERT INTO public."themes" ("id", "name", "created_at", "updated_at") VALUES ('44e1696f-69ea-41e2-9122-1902478b5685', 'Music', '"2025-08-01T08:30:49.041Z"', '"2025-08-01T08:30:49.041Z"');
INSERT INTO public."themes" ("id", "name", "created_at", "updated_at") VALUES ('2809ef39-cf4a-4f65-9f7a-caa8d7738dcc', 'News', '"2025-08-01T08:30:49.041Z"', '"2025-08-01T08:30:49.041Z"');
INSERT INTO public."themes" ("id", "name", "created_at", "updated_at") VALUES ('d54ed581-78ff-45a9-8a4d-14b5ee8909bb', 'Education', '"2025-08-01T08:30:49.041Z"', '"2025-08-01T08:41:46.709Z"');

--
-- Table: topics
--

CREATE TABLE IF NOT EXISTS public."topics" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" character varying(255) NOT NULL,
    "created_at" timestamp without time zone DEFAULT now()
);

--
-- Table: users
--

CREATE TABLE IF NOT EXISTS public."users" (
    "id" character varying NOT NULL,
    "email" character varying,
    "first_name" character varying,
    "last_name" character varying,
    "profile_image_url" character varying,
    "username" character varying,
    "password" character varying,
    "role" character varying DEFAULT 'member'::character varying,
    "is_active" boolean DEFAULT true,
    "is_verified" boolean DEFAULT false,
    "login_count" integer DEFAULT 0,
    "last_login_at" timestamp without time zone,
    "first_login_completed" boolean DEFAULT false,
    "location" jsonb,
    "onboarding_responses" jsonb,
    "created_at" timestamp without time zone DEFAULT now(),
    "updated_at" timestamp without time zone DEFAULT now()
);

--
-- Data for table: users
--

INSERT INTO public."users" ("id", "email", "first_name", "last_name", "profile_image_url", "username", "password", "role", "is_active", "is_verified", "login_count", "last_login_at", "first_login_completed", "location", "onboarding_responses", "created_at", "updated_at") VALUES ('BD_AbZEBFPJtuv6HoyKVB', 'ashwaniswami858@gmail.com', 'Ashwani ', '', NULL, NULL, '$2b$10$cT38kZa2Iu/t11Zyy4LVPu.Edh.5ueSG8ChGLbPOw8dzpPGleaYTK', 'member', true, true, 1, '"2025-08-03T06:20:59.725Z"', true, '{"city":"Delhi","country":"India","latitude":0,"longitude":0}', '{"name":"Ashwani Swami","role":"Radio Host","goals":"Research","location":{"city":"Delhi","country":"India","latitude":0,"longitude":0},"interests":["talk shows"],"experience":"Less than 1 year","station_type":"Internet Radio"}', '"2025-08-03T06:20:38.038Z"', '"2025-08-03T06:20:59.725Z"');
INSERT INTO public."users" ("id", "email", "first_name", "last_name", "profile_image_url", "username", "password", "role", "is_active", "is_verified", "login_count", "last_login_at", "first_login_completed", "location", "onboarding_responses", "created_at", "updated_at") VALUES ('tTfRVB6nhIAt7cPQxiXmG', 'ashwani@gmail.com', 'Ashwani ', '', NULL, NULL, '$2b$10$Y/xJXdKQJ3NzetSPdb8SJu.hRB6iV88eR57pzJ/GhLSo1RTJrNjFa', 'admin', true, true, 2, '"2025-08-03T06:26:10.131Z"', false, NULL, NULL, '"2025-08-03T06:19:42.118Z"', '"2025-08-03T06:26:10.131Z"');

--
-- End of dump
--
