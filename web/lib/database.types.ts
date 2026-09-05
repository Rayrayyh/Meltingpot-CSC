// Generated from the Supabase project schema (supabase/migrations/*).
// Regenerate with the Supabase MCP generate_typescript_types tool after any
// schema migration and replace this file wholesale.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PotRole = "member" | "maintainer" | "owner";
export type ContributionStatus =
  | "draft"
  | "organizing"
  | "ready_to_review"
  | "shared"
  | "failed";
export type ProposalStatus =
  | "pending"
  | "accepted"
  | "revision_requested"
  | "declined";
export type ProposalEventKind =
  | "submitted"
  | "edited"
  | "resubmitted"
  | "accepted"
  | "revision_requested"
  | "declined"
  | "comment";
export type AttachmentKind = "image" | "pdf" | "file" | "link";
export type LmsProvider = "google_classroom" | "canvas";
export type LmsItemKind =
  | "assignment"
  | "quiz"
  | "discussion"
  | "announcement"
  | "material"
  | "event";
/** Not a Postgres enum: study_sets.kind is a checked text column. */
export type StudySetKind = "summary" | "flashcards" | "practice";

/** Not a Postgres enum: pots.study_generation is a checked text column. */
export type PotStudyGeneration = "members" | "maintainers";

export type Database = {
  public: {
    Tables: {
      attachments: {
        Row: {
          contribution_id: string | null;
          created_at: string;
          created_by: string;
          id: string;
          kind: AttachmentKind;
          name: string;
          pot_id: string;
          storage_path: string | null;
          url: string | null;
          ai_caption: string | null;
          ai_extracted_text: string | null;
          ai_useful_for_note: boolean | null;
          ai_model: string | null;
          ai_analyzed_at: string | null;
        };
        Insert: {
          contribution_id?: string | null;
          created_at?: string;
          created_by: string;
          id?: string;
          kind: AttachmentKind;
          name: string;
          pot_id: string;
          storage_path?: string | null;
          url?: string | null;
          ai_caption?: string | null;
          ai_extracted_text?: string | null;
          ai_useful_for_note?: boolean | null;
          ai_model?: string | null;
          ai_analyzed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["attachments"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "attachments_contribution_id_fkey";
            columns: ["contribution_id"];
            isOneToOne: false;
            referencedRelation: "contributions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attachments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attachments_pot_id_fkey";
            columns: ["pot_id"];
            isOneToOne: false;
            referencedRelation: "pots";
            referencedColumns: ["id"];
          },
        ];
      };
      contributions: {
        Row: {
          author_id: string;
          created_at: string;
          id: string;
          organized: Json | null;
          pot_id: string;
          raw_text: string;
          section_id: string | null;
          shared_note_id: string | null;
          source_lms_item_id: string | null;
          status: ContributionStatus;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          created_at?: string;
          id?: string;
          organized?: Json | null;
          pot_id: string;
          raw_text?: string;
          section_id?: string | null;
          shared_note_id?: string | null;
          source_lms_item_id?: string | null;
          status?: ContributionStatus;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["contributions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "contributions_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contributions_pot_id_fkey";
            columns: ["pot_id"];
            isOneToOne: false;
            referencedRelation: "pots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contributions_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "sections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contributions_shared_note_fk";
            columns: ["shared_note_id"];
            isOneToOne: false;
            referencedRelation: "shared_notes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contributions_source_lms_item_id_fkey";
            columns: ["source_lms_item_id"];
            isOneToOne: false;
            referencedRelation: "lms_items";
            referencedColumns: ["id"];
          },
        ];
      };
      lms_connections: {
        Row: {
          consent_at: string;
          courses: Json;
          courses_fetched_at: string | null;
          created_at: string;
          external_display: string | null;
          external_user_id: string;
          id: string;
          instance_url: string | null;
          last_error: string | null;
          needs_reconnect_at: string | null;
          provider: LmsProvider;
          refresh_secret_id: string | null;
          scopes: string[];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          consent_at?: string;
          courses?: Json;
          courses_fetched_at?: string | null;
          created_at?: string;
          external_display?: string | null;
          external_user_id: string;
          id?: string;
          instance_url?: string | null;
          last_error?: string | null;
          needs_reconnect_at?: string | null;
          provider: LmsProvider;
          refresh_secret_id?: string | null;
          scopes?: string[];
          updated_at?: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["lms_connections"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "lms_connections_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      lms_course_links: {
        Row: {
          connection_id: string;
          course_name: string;
          course_url: string | null;
          created_at: string;
          enrollment: string;
          external_course_id: string;
          id: string;
          item_count: number;
          pot_id: string | null;
          provider: LmsProvider;
          sync_cursor: Json;
          sync_error: string | null;
          sync_finished_at: string | null;
          sync_started_at: string | null;
          sync_status: string;
          user_id: string;
        };
        Insert: {
          connection_id: string;
          course_name: string;
          course_url?: string | null;
          created_at?: string;
          enrollment?: string;
          external_course_id: string;
          id?: string;
          item_count?: number;
          pot_id?: string | null;
          provider: LmsProvider;
          sync_cursor?: Json;
          sync_error?: string | null;
          sync_finished_at?: string | null;
          sync_started_at?: string | null;
          sync_status?: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["lms_course_links"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "lms_course_links_connection_id_fkey";
            columns: ["connection_id"];
            isOneToOne: false;
            referencedRelation: "lms_connections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_course_links_pot_id_fkey";
            columns: ["pot_id"];
            isOneToOne: false;
            referencedRelation: "pots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_course_links_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      lms_items: {
        Row: {
          available_from: string | null;
          changed_at: string;
          content_hash: string;
          description: string;
          due_all_day: boolean;
          due_at: string | null;
          external_id: string;
          external_updated_at: string | null;
          first_seen_at: string;
          id: string;
          kind: LmsItemKind;
          last_seen_at: string;
          link_id: string;
          materials: Json;
          posted_at: string | null;
          pot_id: string | null;
          provider: LmsProvider;
          removed_at: string | null;
          title: string;
          url: string | null;
          user_id: string;
        };
        Insert: {
          available_from?: string | null;
          changed_at?: string;
          content_hash: string;
          description?: string;
          due_all_day?: boolean;
          due_at?: string | null;
          external_id: string;
          external_updated_at?: string | null;
          first_seen_at?: string;
          id?: string;
          kind: LmsItemKind;
          last_seen_at?: string;
          link_id: string;
          materials?: Json;
          posted_at?: string | null;
          pot_id?: string | null;
          provider: LmsProvider;
          removed_at?: string | null;
          title: string;
          url?: string | null;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["lms_items"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "lms_items_link_id_fkey";
            columns: ["link_id"];
            isOneToOne: false;
            referencedRelation: "lms_course_links";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_items_pot_id_fkey";
            columns: ["pot_id"];
            isOneToOne: false;
            referencedRelation: "pots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_items_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      memberships: {
        Row: {
          created_at: string;
          last_seen_note_id: string | null;
          pot_id: string;
          role: PotRole;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          last_seen_note_id?: string | null;
          pot_id: string;
          role?: PotRole;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["memberships"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "memberships_pot_id_fkey";
            columns: ["pot_id"];
            isOneToOne: false;
            referencedRelation: "pots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "memberships_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "memberships_last_seen_fk";
            columns: ["last_seen_note_id"];
            isOneToOne: false;
            referencedRelation: "shared_notes";
            referencedColumns: ["id"];
          },
        ];
      };
      note_versions: {
        Row: {
          body: Json;
          body_text: string;
          change_summary: string | null;
          contributor_id: string;
          correction_contributor_id: string | null;
          created_at: string;
          id: string;
          note_id: string;
          proposal_id: string | null;
          reviewed_by: string | null;
          source: string | null;
          summary: string;
          takeaways: string[];
          title: string;
          version_number: number;
          reason: string | null;
          explanation: string | null;
        };
        Insert: {
          body: Json;
          body_text: string;
          change_summary?: string | null;
          contributor_id: string;
          correction_contributor_id?: string | null;
          created_at?: string;
          id?: string;
          note_id: string;
          proposal_id?: string | null;
          reviewed_by?: string | null;
          source?: string | null;
          summary: string;
          takeaways?: string[];
          title: string;
          version_number: number;
          reason?: string | null;
          explanation?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["note_versions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "note_versions_contributor_id_fkey";
            columns: ["contributor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "note_versions_correction_contributor_id_fkey";
            columns: ["correction_contributor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "note_versions_note_id_fkey";
            columns: ["note_id"];
            isOneToOne: false;
            referencedRelation: "shared_notes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "note_versions_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      pot_preferences: {
        Row: {
          favorited_at: string | null;
          last_viewed_at: string | null;
          position: number | null;
          pot_id: string;
          user_id: string;
        };
        Insert: {
          favorited_at?: string | null;
          last_viewed_at?: string | null;
          position?: number | null;
          pot_id: string;
          user_id: string;
        };
        Update: {
          favorited_at?: string | null;
          last_viewed_at?: string | null;
          position?: number | null;
          pot_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pot_preferences_pot_id_fkey";
            columns: ["pot_id"];
            isOneToOne: false;
            referencedRelation: "pots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pot_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      pots: {
        Row: {
          archived_at: string | null;
          class_code: string;
          created_at: string;
          description: string | null;
          id: string;
          join_open: boolean;
          owner_id: string;
          study_generation: PotStudyGeneration;
          title: string;
        };
        Insert: {
          archived_at?: string | null;
          class_code: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          join_open?: boolean;
          owner_id: string;
          study_generation?: PotStudyGeneration;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["pots"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "pots_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string;
          avatar_url: string | null;
          id: string;
        };
        Insert: {
          created_at?: string;
          display_name: string;
          avatar_url?: string | null;
          id: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      proposal_events: {
        Row: {
          actor_id: string;
          body: string | null;
          created_at: string;
          id: string;
          kind: ProposalEventKind;
          proposal_id: string;
        };
        Insert: {
          actor_id: string;
          body?: string | null;
          created_at?: string;
          id?: string;
          kind: ProposalEventKind;
          proposal_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["proposal_events"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "proposal_events_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proposal_events_proposal_id_fkey";
            columns: ["proposal_id"];
            isOneToOne: false;
            referencedRelation: "revision_proposals";
            referencedColumns: ["id"];
          },
        ];
      };
      revision_proposals: {
        Row: {
          created_at: string;
          decided_at: string | null;
          decided_by: string | null;
          decision_note: string | null;
          diff_summary: string | null;
          explanation: string | null;
          id: string;
          note_id: string;
          pot_id: string;
          proposed_organized: Json | null;
          proposed_text: string;
          proposer_id: string;
          reason: string | null;
          selected_text: string;
          source: string | null;
          status: ProposalStatus;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          decision_note?: string | null;
          diff_summary?: string | null;
          explanation?: string | null;
          id?: string;
          note_id: string;
          pot_id: string;
          proposed_organized?: Json | null;
          proposed_text: string;
          proposer_id: string;
          reason?: string | null;
          selected_text: string;
          source?: string | null;
          status?: ProposalStatus;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["revision_proposals"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "revision_proposals_decided_by_fkey";
            columns: ["decided_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "revision_proposals_note_id_fkey";
            columns: ["note_id"];
            isOneToOne: false;
            referencedRelation: "shared_notes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "revision_proposals_pot_id_fkey";
            columns: ["pot_id"];
            isOneToOne: false;
            referencedRelation: "pots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "revision_proposals_proposer_id_fkey";
            columns: ["proposer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      sections: {
        Row: {
          created_at: string;
          id: string;
          position: number;
          pot_id: string;
          title: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          position?: number;
          pot_id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["sections"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "sections_pot_id_fkey";
            columns: ["pot_id"];
            isOneToOne: false;
            referencedRelation: "pots";
            referencedColumns: ["id"];
          },
        ];
      };
      shared_notes: {
        Row: {
          contribution_id: string;
          contributor_id: string;
          current_version_id: string | null;
          id: string;
          pot_id: string;
          section_id: string | null;
          shared_at: string;
          removed_at: string | null;
          removed_by: string | null;
          removed_reason: string | null;
        };
        Insert: {
          contribution_id: string;
          contributor_id: string;
          current_version_id?: string | null;
          id?: string;
          pot_id: string;
          section_id?: string | null;
          shared_at?: string;
          removed_at?: string | null;
          removed_by?: string | null;
          removed_reason?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["shared_notes"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "shared_notes_contribution_id_fkey";
            columns: ["contribution_id"];
            isOneToOne: false;
            referencedRelation: "contributions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shared_notes_contributor_id_fkey";
            columns: ["contributor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shared_notes_current_version_fk";
            columns: ["current_version_id"];
            isOneToOne: false;
            referencedRelation: "note_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shared_notes_pot_id_fkey";
            columns: ["pot_id"];
            isOneToOne: false;
            referencedRelation: "pots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shared_notes_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "sections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shared_notes_removed_by_fkey";
            columns: ["removed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      sidebar_preferences: {
        Row: {
          nav_hidden: string[];
          nav_order: string[];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          nav_hidden?: string[];
          nav_order?: string[];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          nav_hidden?: string[];
          nav_order?: string[];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sidebar_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      study_attempts: {
        Row: {
          id: string;
          pot_id: string;
          set_id: string;
          user_id: string;
          kind: "practice" | "flashcards";
          first_pass: boolean;
          correct: number | null;
          total: number | null;
          known: number | null;
          learning: number | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "study_attempts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      study_responses: {
        Row: {
          attempt_id: string;
          question_index: number;
          choice: number | null;
          correct: boolean;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      study_sets: {
        Row: {
          id: string;
          pot_id: string;
          kind: StudySetKind;
          source_fingerprint: string;
          payload: Json;
          model: string | null;
          options: Json | null;
          generated_by: string;
          secured: boolean;
          created_at: string;
          removed_at: string | null;
          removed_by: string | null;
          removed_reason: string | null;
        };
        Insert: {
          id?: string;
          pot_id: string;
          kind: StudySetKind;
          source_fingerprint: string;
          payload: Json;
          model?: string | null;
          options?: Json | null;
          generated_by: string;
          secured?: boolean;
          removed_at?: string | null;
          removed_by?: string | null;
          removed_reason?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["study_sets"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "study_sets_generated_by_fkey";
            columns: ["generated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "study_sets_pot_id_fkey";
            columns: ["pot_id"];
            isOneToOne: false;
            referencedRelation: "pots";
            referencedColumns: ["id"];
          },
        ];
      };
      note_flashcards: {
        Row: {
          id: string;
          pot_id: string;
          note_id: string | null;
          front: string;
          back: string;
          tags: string[];
          source_excerpt: string | null;
          created_by: string;
          created_at: string;
          removed_at: string | null;
          removed_by: string | null;
        };
        Insert: {
          id?: string;
          pot_id: string;
          note_id?: string | null;
          front: string;
          back: string;
          tags?: string[];
          source_excerpt?: string | null;
          created_by: string;
          created_at?: string;
          removed_at?: string | null;
          removed_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["note_flashcards"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "note_flashcards_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "note_flashcards_note_id_fkey";
            columns: ["note_id"];
            isOneToOne: false;
            referencedRelation: "shared_notes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "note_flashcards_pot_id_fkey";
            columns: ["pot_id"];
            isOneToOne: false;
            referencedRelation: "pots";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      consume_ai_generation: {
        Args: { p_kind: string };
        Returns: undefined;
      };
      create_pot: {
        Args: { p_description?: string; p_title: string };
        Returns: Json;
      };
      decide_proposal: {
        Args: {
          p_change_summary?: string;
          p_decision: string;
          p_expected_version_id?: string;
          p_new_body?: Json;
          p_new_body_text?: string;
          p_new_summary?: string;
          p_new_takeaways?: string[];
          p_new_title?: string;
          p_note?: string;
          p_proposal_id: string;
        };
        Returns: undefined;
      };
      join_pot_with_code: { Args: { p_code: string }; Returns: string };
      open_correction_count: {
        Args: { p_pot_id: string };
        Returns: number;
      };
      own_standing: { Args: never; Returns: Json };
      lookup_pot_by_code: { Args: { p_code: string }; Returns: Json };
      regenerate_class_code: { Args: { p_pot_id: string }; Returns: string };
      register_student: {
        Args: { p_display_name: string; p_email: string; p_password: string };
        Returns: string;
      };
      remove_member: {
        Args: { p_pot_id: string; p_user_id: string };
        Returns: undefined;
      };
      resubmit_proposal: {
        Args: {
          p_diff_summary?: string;
          p_explanation?: string;
          p_proposal_id: string;
          p_proposed_organized?: Json | null;
          p_proposed_text: string;
          p_selected_text: string;
          p_source?: string;
        };
        Returns: undefined;
      };
      set_member_role: {
        Args: { p_pot_id: string; p_role: PotRole; p_user_id: string };
        Returns: undefined;
      };
      share_contribution: {
        Args: {
          p_body: Json;
          p_body_text: string;
          p_contribution_id: string;
          p_section_id?: string;
          p_summary: string;
          p_takeaways: string[];
          p_title: string;
        };
        Returns: string;
      };
      save_attachment_analysis: {
        Args: {
          p_attachment_id: string;
          p_caption: string;
          p_extracted_text: string;
          p_useful_for_note: boolean;
          p_model: string;
        };
        Returns: undefined;
      };
      restore_study_set: { Args: { p_study_set_id: string }; Returns: undefined };
      set_flashcard_removed: { Args: { p_card_id: string; p_removed: boolean }; Returns: undefined };
      save_study_set: {
        Args: {
          p_pot_id: string;
          p_kind: StudySetKind;
          p_fingerprint: string;
          p_payload: Json;
          /** text, and nullable: study_sets.model is nullable and left(null, n) is null. */
          p_model: string | null;
          p_options?: Json | null;
          p_keys?: Json | null;
        };
        Returns: string;
      };
      submit_practice_test: {
        Args: { p_attempt_id: string; p_set_id: string; p_answers: Json };
        Returns: Json;
      };
      record_flashcard_run: {
        Args: {
          p_attempt_id: string;
          p_set_id: string;
          p_known: number;
          p_learning: number;
        };
        Returns: undefined;
      };
      admin_study_overview: { Args: { p_pot_id: string }; Returns: Json };
      class_topic_evidence: { Args: { p_pot_id: string }; Returns: Json };
      update_my_profile: {
        Args: { p_display_name: string; p_avatar_url?: string | null };
        Returns: undefined;
      };
      delete_study_set: { Args: { p_study_set_id: string }; Returns: undefined };
      add_note_flashcard: {
        Args: {
          p_pot_id: string;
          p_note_id: string | null;
          p_front: string;
          p_back: string;
          p_tags: string[];
          p_source_excerpt: string;
        };
        Returns: string;
      };
      set_shared_note_removed: {
        Args: { p_note_id: string; p_removed: boolean; p_reason: string };
        Returns: undefined;
      };
      link_lms_course: {
        Args: {
          p_connection_id: string;
          p_course_name: string;
          p_course_url: string | null;
          p_enrollment: string;
          p_external_course_id: string;
          p_pot_id?: string | null;
        };
        Returns: string;
      };
      unlink_lms_course: {
        Args: { p_link_id: string };
        Returns: undefined;
      };
      lms_connect: {
        Args: {
          p_courses: Json;
          p_external_display: string | null;
          p_external_user_id: string;
          p_instance_url: string | null;
          p_provider: LmsProvider;
          p_refresh_token: string;
          p_scopes: string[];
          p_server_key: string;
        };
        Returns: string;
      };
      lms_disconnect: {
        Args: { p_connection_id: string; p_server_key: string };
        Returns: string | null;
      };
      lms_set_courses: {
        Args: { p_connection_id: string; p_courses: Json; p_server_key: string };
        Returns: undefined;
      };
      lms_sync_begin: {
        Args: { p_force: boolean; p_link_id: string; p_server_key: string };
        Returns: Json;
      };
      lms_sync_apply: {
        Args: {
          p_cursor: Json;
          p_done: boolean;
          p_items: Json;
          p_link_id: string;
          p_server_key: string;
        };
        Returns: Json;
      };
      lms_sync_finish: {
        Args: {
          p_error: string | null;
          p_link_id: string;
          p_server_key: string;
          p_status: string;
        };
        Returns: undefined;
      };
      lms_connection_token: {
        Args: { p_connection_id: string; p_server_key: string };
        Returns: string | null;
      };
      lms_connection_needs_reconnect: {
        Args: { p_connection_id: string; p_error: string | null; p_server_key: string };
        Returns: undefined;
      };
      lms_sync_claim_due: {
        Args: { p_server_key: string };
        Returns: Json;
      };
      lms_cron_apply: {
        Args: {
          p_cursor: Json;
          p_done: boolean;
          p_items: Json;
          p_link_id: string;
          p_server_key: string;
        };
        Returns: Json;
      };
      lms_cron_finish: {
        Args: {
          p_error: string | null;
          p_link_id: string;
          p_server_key: string;
          p_status: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      attachment_kind: AttachmentKind;
      contribution_status: ContributionStatus;
      lms_item_kind: LmsItemKind;
      lms_provider: LmsProvider;
      pot_role: PotRole;
      proposal_event_kind: ProposalEventKind;
      proposal_status: ProposalStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
