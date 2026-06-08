import {
  mockContributorProfile,
  mockContributorTasks,
  mockSubmissions,
  mockEarnings,
  mockPayouts,
  mockEarningsSummary,
  mockCredentials,
  mockLearningRecommendations,
  mockNotifications,
  mockDigitalTwin,
  mockWorkroomData,
  mockMessageThreads,
} from "@/mocks/data/contributor";

type MockResult = { status: number; body: unknown };

const profileApiShape = () => ({
  id: mockContributorProfile.id,
  display_name: mockContributorProfile.displayName,
  anonymous_id: mockContributorProfile.anonymousId,
  avatar: mockContributorProfile.avatar,
  email: mockContributorProfile.email,
  phone: mockContributorProfile.phone,
  track: mockContributorProfile.track,
  verification_status: mockContributorProfile.verificationStatus,
  joined_at: mockContributorProfile.joinedAt,
  profile_completeness: mockContributorProfile.profileCompleteness,
  timezone: mockContributorProfile.timezone,
  weekly_hours: mockContributorProfile.weeklyHours,
  availability: mockContributorProfile.availability,
  language: mockContributorProfile.language,
  bio: mockContributorProfile.bio,
  country: mockContributorProfile.country,
  city: mockContributorProfile.city,
  onboarding_complete: mockContributorProfile.onboardingComplete,
  skills: mockContributorProfile.skills.map((s) => ({
    name: s.name,
    proficiency: s.proficiency,
    source: s.source,
    validated_count: s.validatedCount,
    evidence_count: s.evidenceCount,
    last_validated_at: s.lastValidatedAt,
  })),
});

function listFromQuery<T>(items: T[], query: URLSearchParams) {
  const page = Number(query.get("page") ?? 1);
  const pageSize = Number(query.get("page_size") ?? 20);
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page,
    page_size: pageSize,
    total: items.length,
  };
}

export function resolveContributorMock(path: string, method: string, body?: string): MockResult | null {
  if (!path.includes("/api/contributor") && !path.includes("/api/public/credentials")) return null;
  const url = new URL(path, "http://localhost");
  const p = url.pathname;
  const q = url.searchParams;
  const m = method.toUpperCase();

  if (p === "/api/contributor/dashboard" && m === "GET") {
    return {
      status: 200,
      body: {
        greeting_name: mockContributorProfile.displayName.split(" ")[0],
        kpis: [
          { key: "active_tasks", label: "Active Tasks", value: String(mockContributorTasks.length), trend: "flat" },
          { key: "total_earned", label: "Total Earned", value: `$${mockEarningsSummary.totalEarned}`, trend: "flat" },
          { key: "credentials", label: "Credentials", value: String(mockCredentials.length), trend: "flat" },
          { key: "skill_score", label: "Skill Score", value: "—", trend: "flat" },
        ],
        earnings_snapshot: {
          currency: mockEarningsSummary.currency,
          earned_this_month: mockEarningsSummary.currentMonth,
          total_paid_all_time: mockEarningsSummary.paidOut,
          pending_payout: mockEarningsSummary.pending,
        },
        action_items: [
          ...mockContributorTasks.slice(0, 1).map((t) => ({
            id: `action-${t.id}`,
            kind: "deadline_tomorrow",
            urgency: "high",
            title: "Deadline tomorrow",
            subtitle: `${t.projectTitle} - ${t.milestoneTitle}`,
            task_id: t.id,
            offer_id: "",
            cta_label: "Open workroom",
            cta_href: `/contributor/tasks/${t.id}`,
          })),
          {
            id: "action-payment-ready",
            kind: "payment_ready",
            urgency: "medium",
            title: "Payment ready",
            subtitle: `$${mockEarningsSummary.pending} pending confirmation`,
            task_id: "",
            offer_id: "",
            cta_label: "View earnings",
            cta_href: "/contributor/earnings",
          },
        ],
        system_banners: [],
        active_tasks: mockContributorTasks.map((t) => ({
          id: t.id,
          title: t.title,
          project_title: t.projectTitle,
          milestone_title: t.milestoneTitle,
          status: t.status,
          due_at: t.dueAt,
          due_relative: "Soon",
          priority: t.priority,
          workroom_path: `/contributor/tasks/${t.id}`,
        })),
        recent_earnings: mockEarnings.map((e) => ({
          id: e.id,
          amount: e.amount,
          currency: e.currency,
          label: e.status,
          earned_at: e.earnedAt,
        })),
        credentials: mockCredentials.map((c) => ({
          id: c.id,
          name: c.name,
          issuer: c.issuer,
          status: c.status,
          expires_at: c.expiresAt,
        })),
        skills: mockContributorProfile.skills.map((s, i) => ({ id: `sk-${i}`, name: s.name, level: s.proficiency })),
        notifications: mockNotifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          read: n.read,
          created_at: n.createdAt,
        })),
        recommended_learning: mockLearningRecommendations.map((r) => ({
          id: r.id,
          title: r.title,
          url: r.url,
          duration_minutes: r.durationMinutes,
          reason: r.reason,
        })),
      },
    };
  }

  if (p === "/api/contributor/notifications" && m === "GET") {
    return { status: 200, body: listFromQuery(mockNotifications.map((n) => ({ ...n, created_at: n.createdAt })), q) };
  }
  if (p.match(/^\/api\/contributor\/notifications\/[^/]+\/read$/) && m === "PATCH") {
    const id = p.split("/")[4] ?? "";
    const n = mockNotifications.find((x) => x.id === id) ?? mockNotifications[0];
    return { status: 200, body: { id: n.id, type: n.type, title: n.title, body: n.body, read: true, created_at: n.createdAt } };
  }
  if (p === "/api/contributor/notifications/read-all" && m === "POST") return { status: 200, body: { updated: mockNotifications.length } };

  if (p === "/api/contributor/settings" && m === "GET") {
    return {
      status: 200,
      body: {
        account_summary: {
          display_name: mockContributorProfile.displayName,
          email: mockContributorProfile.email,
          phone: mockContributorProfile.phone,
        },
        notification_preferences: {
          task_assignments: true,
          review_decisions: true,
          sla_reminders: true,
          payout_updates: true,
          learning: true,
        },
        language: mockContributorProfile.language,
        timezone: mockContributorProfile.timezone,
        quiet_hours_start: "23:00",
        quiet_hours_end: "07:00",
        two_factor_enabled: false,
      },
    };
  }
  if (p.startsWith("/api/contributor/settings/") && (m === "PATCH" || m === "POST")) {
    return resolveContributorMock("/api/contributor/settings", "GET");
  }
  if (p === "/api/contributor/account/deactivate" && m === "POST") return { status: 204, body: {} };

  if (p === "/api/contributor/tasks" && m === "GET") {
    const statusFilter = q.get("status");
    const priorityFilter = q.get("priority");
    let filtered = statusFilter && statusFilter !== "all"
      ? mockContributorTasks.filter((t) => t.status === statusFilter)
      : mockContributorTasks;
    if (priorityFilter && priorityFilter !== "all") {
      filtered = filtered.filter((t) => t.priority === priorityFilter);
    }
    return {
      status: 200,
      body: listFromQuery(
        filtered.map((t) => ({
          id: t.id,
          title: t.title,
          project_title: t.projectTitle,
          project_id: "proj-1",
          milestone_id: "ms-1",
          milestone_title: t.milestoneTitle,
          status: t.status,
          priority: t.priority,
          skills_required: t.tags ?? [],
          estimated_hours: t.estimatedHours ?? 0,
          pricing: { amount: t.payoutAmount, currency: t.payoutCurrency, model: "fixed" },
          match_score: 88,
          match_reason: "Strong skill overlap",
          due_date: t.dueAt,
          sla_deadline: t.dueAt,
          progress_percent: t.status === "completed" ? 100 : t.status === "in_progress" ? 60 : 20,
          hours_logged: t.status === "completed" ? t.estimatedHours : Math.max(1, (t.estimatedHours ?? 2) / 2),
          domain_tag: "frontend",
          seniority_required: "intermediate",
          contributor_seniority: "intermediate",
          skills_matched: t.tags ?? [],
          offer_expires_at: null,
          offered_at: null,
          data_sensitivity: "low",
          nda_required: false,
          effort_display: `${t.estimatedHours ?? 0}h`,
        })),
        q,
      ),
    };
  }
  if (p === "/api/contributor/tasks/summary" && m === "GET") return { status: 200, body: { available: 0, in_progress: 0, submitted: 0, completed: 0, rework: 0, active_offers: 0 } };
  if (p === "/api/contributor/tasks/discovery/summary" && m === "GET") return { status: 200, body: { active_offers: 0, server_time: new Date().toISOString() } };
  if (p.match(/^\/api\/contributor\/tasks\/[^/]+$/) && m === "GET") {
    const id = decodeURIComponent(p.split("/")[4] ?? "");
    const t = mockContributorTasks.find((x) => x.id === id) ?? mockContributorTasks[0];
    return {
      status: 200,
      body: {
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        project_title: t.projectTitle,
        milestone_title: t.milestoneTitle,
        due_date: t.dueAt,
        sla_deadline: t.dueAt,
        skills_required: t.tags ?? [],
        estimated_hours: t.estimatedHours ?? 0,
        progress_percent: t.status === "completed" ? 100 : t.status === "in_progress" ? 60 : 20,
        hours_logged: 2.5,
        pricing: {
          amount: t.payoutAmount ?? 0,
          currency: t.payoutCurrency ?? "USD",
          model: "fixed",
        },
        match_score: 88,
        match_reason: "Strong skill overlap",
        brief: "Complete task as per instructions.",
        acceptance_criteria: ["Follow rubric", "Submit required evidence", "Pass quality checks"],
        evidence_types_required: ["csv", "notes"],
        milestone_number: 1,
        reference_materials: [],
        reviewer_guidance_preview: null,
        domain_tag: "frontend",
        seniority_required: "intermediate",
        contributor_seniority: "intermediate",
        skills_matched: t.tags ?? [],
        offer_expires_at: null,
        offered_at: null,
        data_sensitivity: "low",
        nda_required: false,
        effort_display: `${t.estimatedHours ?? 0}h`,
        instructions: mockWorkroomData.instructions,
      },
    };
  }
  if (p.match(/^\/api\/contributor\/tasks\/[^/]+\/(start|accept|decline|request-extension)$/) && (m === "POST" || m === "PATCH")) return { status: 200, body: { ok: true } };
  if (p.match(/^\/api\/contributor\/tasks\/[^/]+\/accept-impact$/) && m === "GET") return { status: 200, body: { pricing: { amount: 0, currency: "USD" }, due_date: null, estimated_hours: 0 } };
  if (p.match(/^\/api\/contributor\/tasks\/[^/]+\/timeline$/) && m === "GET") {
    return {
      status: 200,
      body: [],
    };
  }
  if (p.match(/^\/api\/contributor\/tasks\/[^/]+\/workroom$/) && m === "GET") return { status: 200, body: mockWorkroomData };
  if (p.match(/^\/api\/contributor\/tasks\/[^/]+\/workroom\/templates$/) && m === "GET") return { status: 200, body: { items: mockWorkroomData.templates } };
  if (p.match(/^\/api\/contributor\/tasks\/[^/]+\/workroom\/links$/) && m === "GET") return { status: 200, body: { items: mockWorkroomData.links } };
  if (p.match(/^\/api\/contributor\/tasks\/[^/]+\/workroom\/messages/) && m === "GET") return { status: 200, body: { items: mockWorkroomData.qaMessages, total: mockWorkroomData.qaMessages.length } };
  if (p.match(/^\/api\/contributor\/tasks\/[^/]+\/workroom\/messages$/) && m === "POST") return { status: 200, body: { id: "qa-new", sender: "contributor", body: "Added update", sentAt: new Date().toISOString() } };
  if (p.match(/^\/api\/contributor\/tasks\/[^/]+\/workroom\/uploads/) && (m === "POST" || m === "DELETE")) return { status: 200, body: { ok: true } };
  if (p.match(/^\/api\/contributor\/tasks\/[^/]+\/workroom\/checklist\/[^/]+$/) && m === "PATCH") return { status: 200, body: { ok: true } };
  if (p.match(/^\/api\/contributor\/tasks\/[^/]+\/latest-submission$/) && m === "GET") return { status: 200, body: mockSubmissions[0] };
  if (p.match(/^\/api\/contributor\/tasks\/[^/]+\/review-feedback$/) && m === "GET") return { status: 200, body: { task_id: "", submission_id: "", reviewer_feedback: "", review_score: 0, rubric_score: 0, criteria: [] } };
  if (p.match(/^\/api\/contributor\/tasks\/[^/]+\/submissions$/) && m === "POST") {
    let parsed: Record<string, any> = {};
    try { parsed = body ? JSON.parse(body) : {}; } catch { /* ignore */ }
    const structured = parsed.structured_response ?? {};
    const files = Array.isArray(structured.submitted_files)
      ? structured.submitted_files
      : Array.isArray(parsed.file_ids)
        ? parsed.file_ids.map((id: string, i: number) => ({ id, filename: `attachment-${i + 1}`, mime_type: "application/octet-stream" }))
        : [];
    const evidence = Array.isArray(parsed.evidence_items)
      ? parsed.evidence_items.map((item: Record<string, any>, i: number) => ({
          id: `ev-${i + 1}`,
          label: item.label ?? "",
          description: item.url ?? item.description ?? "",
          file_id: item.file_id ?? "",
          checklist_item_id: item.checklist_item_id ?? "",
        }))
      : [];
    return {
      status: 200,
      body: {
        ...mockSubmissions[0],
        id: "sub-new",
        task_id: decodeURIComponent(p.split("/")[4] ?? mockSubmissions[0].taskId),
        submitted_at: new Date().toISOString(),
        status: parsed.submission_mode === "draft" ? "draft" : "submitted",
        notes: parsed.notes ?? "",
        files,
        evidence,
      },
    };
  }

  if (p === "/api/contributor/submissions" && m === "GET") return { status: 200, body: listFromQuery(mockSubmissions.map((s) => ({ ...s, task_id: s.taskId, submitted_at: s.submittedAt })), q) };
  if (p.match(/^\/api\/contributor\/submissions\/[^/]+$/) && m === "GET") return { status: 200, body: mockSubmissions[0] };
  if (p.match(/^\/api\/contributor\/submissions\/[^/]+$/) && m === "PATCH") return { status: 200, body: { ...mockSubmissions[0], status: "submitted" } };
  if (p.match(/^\/api\/contributor\/submissions\/[^/]+\/resubmit$/) && m === "POST") return { status: 200, body: { ...mockSubmissions[0], status: "submitted", version: 3 } };

  if (p === "/api/contributor/earnings/summary" && m === "GET") return { status: 200, body: { total_earned: mockEarningsSummary.totalEarned, eligible: mockEarningsSummary.eligible, pending: mockEarningsSummary.pending, processing: mockEarningsSummary.processing, paid_out: mockEarningsSummary.paidOut, currency: mockEarningsSummary.currency, current_month: mockEarningsSummary.currentMonth, previous_month: mockEarningsSummary.previousMonth, lifetime_tasks_completed: mockEarningsSummary.lifetimeTasksCompleted, average_per_task: mockEarningsSummary.averagePerTask } };
  if (p === "/api/contributor/earnings/overview" && m === "GET") return { status: 200, body: JSON.stringify({ note: "Mock overview enabled" }) };
  if (p === "/api/contributor/earnings" && m === "GET") {
    const statusFilter = q.get("status");
    const filtered = statusFilter && statusFilter !== "all"
      ? mockEarnings.filter((e) => e.status === statusFilter)
      : mockEarnings;
    return { status: 200, body: JSON.stringify(listFromQuery(filtered, q)) };
  }
  if (p.match(/^\/api\/contributor\/earnings\/[^/]+$/) && m === "GET") {
    const id = decodeURIComponent(p.split("/").pop() ?? "");
    const found = mockEarnings.find((x) => x.id === id) ?? mockEarnings[0];
    return { status: 200, body: JSON.stringify(found) };
  }
  if (p === "/api/contributor/earnings/kyc/status" && m === "GET") return { status: 200, body: JSON.stringify({ status: "verified" }) };
  if (p === "/api/contributor/earnings/kyc/start" && m === "POST") return { status: 200, body: JSON.stringify({ status: "in_progress" }) };
  if (p === "/api/contributor/payouts" && m === "GET") return { status: 200, body: JSON.stringify(listFromQuery(mockPayouts, q)) };
  if (p.match(/^\/api\/contributor\/payouts\/[^/]+$/) && m === "GET") {
    const id = decodeURIComponent(p.split("/").pop() ?? "");
    const found = mockPayouts.find((x) => x.id === id || x.reference === id) ?? mockPayouts[0];
    return { status: 200, body: JSON.stringify(found) };
  }
  if (p.match(/^\/api\/contributor\/payouts\/[^/]+\/receipt$/) && m === "GET") return { status: 200, body: JSON.stringify("https://example.com/receipt/mock.pdf") };
  if (p === "/api/contributor/payout-preferences" && m === "GET") return { status: 200, body: { preferred_method: "upi", minimum_payout_amount: "25", auto_payout: true, account_name: null, account_number: null, bank_name: null, routing_code: null, country: "IN", provider: null, phone_number: null, paypal_email: null, upi_id: "", wallet_address: null, network: null, token: null } };
  if (p === "/api/contributor/payout-preferences" && m === "PUT") return resolveContributorMock("/api/contributor/payout-preferences", "GET");
  if (p === "/api/contributor/earnings/chart" && m === "GET") return { status: 200, body: JSON.stringify([]) };

  if (p === "/api/contributor/learning/recommendations" && m === "GET") {
    return {
      status: 200,
      body: mockLearningRecommendations.map((r) => ({
        id: r.id,
        type: "skill_based",
        title: r.title,
        skill: "React",
        reason: r.reason,
        estimated_hours: Math.max(1, Math.round((r.durationMinutes ?? 30) / 60)),
        resource_url: r.url,
        related_task_id: null,
        priority: "medium",
        recommended_at: "2026-04-24T06:00:00.000Z",
      })),
    };
  }
  if (p.match(/^\/api\/contributor\/learning\/recommendations\/[^/]+\/dismiss$/) && m === "POST") return { status: 200, body: { recommendation_id: p.split("/")[5], dismissed: true } };
  if (p.match(/^\/api\/contributor\/learning\/recommendations\/[^/]+\/mark-opened$/) && m === "POST") return { status: 200, body: { recommendation_id: p.split("/")[5], opened: true } };

  if (p === "/api/contributor/messages/threads" && m === "GET") {
    return {
      status: 200,
      body: {
        items: mockMessageThreads.map((t) => ({
          id: t.id,
          sender_name: t.participantName,
          sender_role: "reviewer",
          project_name: "Contributor Program",
          task_title: t.subject,
          task_id: "task-504",
          last_message: t.messages[t.messages.length - 1]?.body ?? "",
          timestamp: t.updatedAt,
          unread_count: t.unreadCount,
          avatar: "https://i.pravatar.cc/100?img=22",
        })),
        page: 1,
        page_size: 20,
        total: mockMessageThreads.length,
      },
    };
  }
  if (p.match(/^\/api\/contributor\/messages\/threads\/[^/]+$/) && m === "GET") {
    const id = decodeURIComponent(p.split("/")[5] ?? "");
    const t = mockMessageThreads.find((x) => x.id === id) ?? mockMessageThreads[0];
    return {
      status: 200,
      body: {
        id: t.id,
        participants: [{ id: "u-reviewer", name: t.participantName, role: "reviewer", avatar: "https://i.pravatar.cc/100?img=22" }],
        project_name: "Contributor Program",
        task_id: "task-504",
        messages: t.messages.map((m1: Record<string, any>) => ({
          id: m1.id,
          sender_id: m1.sender === "contributor" ? "contrib-1001" : "u-reviewer",
          sender_name: m1.sender === "contributor" ? mockContributorProfile.displayName : t.participantName,
          sender_role: m1.sender,
          content: m1.body,
          timestamp: m1.sentAt,
          rating: null,
        })),
      },
    };
  }
  if (p.match(/^\/api\/contributor\/messages\/threads\/[^/]+\/messages$/) && m === "POST") {
    let content = "";
    let attachmentIds: string[] = [];
    try {
      const parsed = body ? JSON.parse(body) : {};
      content = typeof parsed.content === "string" ? parsed.content : "";
      attachmentIds = Array.isArray(parsed.attachment_ids) ? parsed.attachment_ids : [];
    } catch { /* ignore parse error, fall back to empty content */ }
    return {
      status: 200,
      body: {
        id: `msg-${Date.now()}`,
        sender_id: "contrib-1001",
        sender_name: mockContributorProfile.displayName,
        sender_role: "contributor",
        content,
        attachment_ids: attachmentIds,
        timestamp: new Date().toISOString(),
        rating: null,
      },
    };
  }
  if (p.match(/^\/api\/contributor\/messages\/threads\/[^/]+\/read$/) && m === "POST") return { status: 204, body: {} };
  if (p.match(/^\/api\/contributor\/messages\/[^/]+\/rating$/) && m === "POST") return { status: 204, body: {} };

  // Support tickets: always hit the real backend (no mock interception).
  if (p === "/api/contributor/support/tickets") return null;
  if (p.match(/^\/api\/contributor\/support\/tickets\/[^/]+$/)) return null;
  if (p.match(/^\/api\/contributor\/support\/tickets\/[^/]+\/messages$/)) return null;
  // Support grievances: always hit the real backend (no mock interception).
  if (p === "/api/contributor/support/grievances") return null;
  if (p.match(/^\/api\/contributor\/support\/grievances\/[^/]+$/)) return null;
  if (p === "/api/contributor/support/faqs" && m === "GET") return { status: 200, body: { items: [], total: 0 } };
  if (p === "/api/contributor/support/safety-reports" && m === "POST") return { status: 200, body: { id: "sr-1", category: "security", description: "Mock report", related_reference: null, attachment_ids: [], status: "submitted", created_at: new Date().toISOString() } };

  if (p === "/api/contributor/credentials/wallet/summary" && m === "GET") return { status: 200, body: { total_credentials: mockCredentials.length, skills_verified: mockContributorProfile.skills.length, tasks_accepted: 0, acceptance_rate: 0 } };
  if (p === "/api/contributor/credentials/wallet/cards" && m === "GET") return { status: 200, body: listFromQuery(mockCredentials.map((c) => ({ credential_id: c.id, credential_title: c.name, task_type: "annotation", skill_tags: ["React", "QA"], designation: "Contributor", seniority: "Intermediate", acceptance_date: c.issuedAt, quality_indicator: "high", platform_verified: true, certificate_pdf_url: "https://example.com/certificate.pdf", shareable_link: `https://example.com/share/${c.id}` })), q) };
  if (p === "/api/contributor/credentials" && m === "GET") return { status: 200, body: listFromQuery(mockCredentials.map((c) => ({ id: c.id, title: c.name, skill: "React", level: c.level, issued_at: c.issuedAt, task_id: "task-505", task_title: "Entity extraction QA", project_title: "Invoice Parser", pod_hash: "0x123abc", verification_url: `https://example.com/verify/${c.id}`, review_score: 92, hours_validated: 14, academic_mapping: null, skill_tags: ["React", "QA"], designation: "Contributor", seniority: "Intermediate", acceptance_data: c.issuedAt, quality_indicator: "high", platform_verified: true })), q) };
  if (p === "/api/contributor/credentials/skills/verification" && m === "GET") return { status: 200, body: { items: mockContributorProfile.skills.map((s) => ({ skill_tag: s.name, status: "verified", credential_count: 1, evidence_source: "task_history", seniority_level: "intermediate" })) } };
  if (p.match(/^\/api\/contributor\/credentials\/[^/]+\/verification$/) && m === "GET") return { status: 200, body: { verified: true, checked_at: new Date().toISOString() } };
  if (p.match(/^\/api\/contributor\/credentials\/[^/]+$/) && m === "GET") {
    const id = decodeURIComponent(p.split("/")[4] ?? "");
    const c = mockCredentials.find((x) => x.id === id) ?? mockCredentials[0];
    return { status: 200, body: { title: c.name, skill: "React", level: c.level, issued_at: c.issuedAt, task_id: "task-505", task_title: "Entity extraction QA", project_title: "Invoice Parser", pod_hash: "0x123abc", verification_url: `https://example.com/verify/${c.id}`, review_score: 92, hours_validated: 14, certificate_file_url: "https://example.com/certificate.pdf", academic_mapping: null, revoked: false, skill_tags: ["React", "QA"], designation: "Contributor", seniority: "Intermediate", acceptance_date: c.issuedAt, quality_indicator: "high", platform_verified: true } };
  }
  if (p.match(/^\/api\/contributor\/credentials\/[^/]+\/certificate$/) && m === "GET") return { status: 200, body: "https://example.com/certificate/mock.pdf" };
  if (p.match(/^\/api\/contributor\/credentials\/[^/]+\/share$/) && m === "POST") return { status: 200, body: { credential_id: p.split("/")[4], share_id: "share-mock", status: "shared", target_type: "public", target_id: "all", public_url: "https://example.com/public/credential/share-mock" } };
  if (p.match(/^\/api\/contributor\/credentials\/[^/]+\/academic-portfolio$/) && m === "POST") return { status: 200, body: { credential_id: p.split("/")[4], format: "pdf", download_url: "https://example.com/portfolio/mock.pdf", job_id: "job-1" } };

  if (p === "/api/contributor/profile" && m === "GET") return { status: 200, body: profileApiShape() };
  if (p === "/api/contributor/profile" && m === "PATCH") return { status: 200, body: profileApiShape() };
  if (p === "/api/contributor/profile/skills" && m === "PUT") return { status: 200, body: profileApiShape() };
  if (p === "/api/contributor/profile/evidence" && m === "GET") return { status: 200, body: { items: mockContributorProfile.evidence.map((e) => ({ id: e.id, title: e.title, type: e.type, url: e.url, file_id: "", description: "", skills: mockContributorProfile.skills.slice(0, 2).map((s) => ({ name: s.name, proficiency: s.proficiency })) })), total: mockContributorProfile.evidence.length } };
  if (p === "/api/contributor/profile/evidence" && m === "POST") return { status: 200, body: { id: "ev-new", title: "Mock evidence", type: "portfolio", url: "https://example.com/mock", file_id: "", description: "Created in mock mode", skills: [] } };
  if (p.match(/^\/api\/contributor\/profile\/evidence\/[^/]+$/) && m === "PATCH") return { status: 200, body: { id: p.split("/")[5], title: "Mock evidence (updated)", type: "portfolio", url: "https://example.com/mock", file_id: "", description: "Updated", skills: [] } };
  if (p.match(/^\/api\/contributor\/profile\/evidence\/[^/]+$/) && m === "DELETE") return { status: 200, body: { ok: true } };
  if (p === "/api/contributor/profile/digital-twin" && m === "GET") {
    return {
      status: 200,
      body: {
        contributor_id: mockDigitalTwin.contributorId,
        updated_at: mockDigitalTwin.updatedAt,
        tasks_completed: mockDigitalTwin.tasksCompleted,
        total_submissions: mockDigitalTwin.totalSubmissions,
        acceptance_rate: mockDigitalTwin.acceptanceRate,
        on_time_delivery: mockDigitalTwin.onTimeDelivery,
        sla_compliance: mockDigitalTwin.slaCompliance,
        average_review_score: mockDigitalTwin.averageReviewScore,
        total_hours_logged: mockDigitalTwin.totalHoursLogged,
        average_hours_per_task: mockDigitalTwin.averageHoursPerTask,
        skill_growth_rate: mockDigitalTwin.skillGrowthRate,
        rework_rate: mockDigitalTwin.reworkRate,
        streak_days: mockDigitalTwin.streakDays,
        longest_streak: mockDigitalTwin.longestStreak,
        top_skills: mockDigitalTwin.topSkills.map((s) => ({ skill: s.skill, tasks_completed: s.tasksCompleted, avg_score: s.avgScore })),
        monthly_activity: mockDigitalTwin.monthlyActivity.map((m1) => ({ month: m1.month, tasks_completed: m1.tasksCompleted, hours_logged: m1.hoursLogged, earned: m1.earned })),
        ai_insights: mockDigitalTwin.aiInsights,
      },
    };
  }
  if (p === "/api/contributor/profile/digital-twin/history" && m === "GET") return { status: 200, body: { period: q.get("period") ?? "3m", snapshots: mockDigitalTwin.monthlyActivity } };

  if (p.match(/^\/api\/public\/credentials\/[^/]+$/) && m === "GET") {
    return { status: 200, body: { task_type: "annotation", skills_evidenced: ["React", "QA"], designation: "Contributor", seniority: "Intermediate", quality_indicator: "high", platform_verified: true } };
  }

  return null;
}

