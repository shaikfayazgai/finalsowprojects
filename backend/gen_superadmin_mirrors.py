"""Generate /superadmin/* mirror pages that re-export enterprise page components."""
import os

FRONTEND = "e:/GLIMMORA/educore/GTPROJECT/frontend/src/app"

# All enterprise sub-paths (static + dynamic)
PAGES = [
    "analytics",
    "analytics/economic",
    "analytics/governance",
    "analytics/reports",
    "audit",
    "billing",
    "billing/budget",
    "billing/history",
    "billing/invoices",
    "billing/invoices/[invoiceId]",
    "billing/pricing",
    "billing/rate-cards",
    "billing/reports",
    "compliance/documents",
    "compliance/esg",
    "compliance/evidence",
    "compliance/podl",
    "dashboard",
    "decomposition",
    "decomposition/[planId]",
    "decomposition/[planId]/approve",
    "decomposition/[planId]/edit",
    "decomposition/approval",
    "notifications",
    "profile",
    "projects",
    "projects/[projectId]",
    "projects/[projectId]/milestones",
    "projects/[projectId]/monitor",
    "projects/[projectId]/tasks/[taskId]",
    "projects/completed",
    "projects/exceptions",
    "review",
    "review/[deliverableId]",
    "review/[deliverableId]/feedback",
    "review/history",
    "reviewer",
    "reviewer/mentoring-log",
    "reviewer/my-metrics",
    "reviewer/notifications",
    "reviewer/qa-inbox",
    "reviewer/review-history",
    "reviewer/review-queue",
    "reviewer/review-queue/[reviewId]",
    "reviewer/task-monitor",
    "reviewer/task-monitor/[taskId]",
    "settings",
    "settings/security",
    "sow",
    "sow/[sowId]",
    "sow/[sowId]/approve",
    "sow/[sowId]/compare",
    "sow/[sowId]/contract",
    "sow/[sowId]/kickoff",
    "sow/approval",
    "sow/approval/[sowId]",
    "sow/archive",
    "sow/blueprint",
    "sow/generate",
    "sow/generate/review",
    "sow/intake",
    "sow/upload",
    "sow/upload/details",
    "sow/upload/extraction-report",
    "sow/upload/gap-analysis",
    "sow/upload/gaps",
    "sow/upload/generate",
    "sow/upload/parsed-review",
    "sow/upload/preview-confirm",
    "sow/upload/report",
    "sow/upload/review",
    "sow/versions",
    "team",
    "team/[teamId]",
    "team/[teamId]/confirm",
]

created = 0
for page in PAGES:
    # depth from superadmin/page to enterprise/page
    parts = page.split("/")
    depth = len(parts) + 1  # +1 for superadmin/ itself
    dots = "../" * depth

    out_dir = os.path.join(FRONTEND, "superadmin", page)
    out_file = os.path.join(out_dir, "page.tsx")
    enterprise_path = f"{dots}enterprise/{page}/page"

    os.makedirs(out_dir, exist_ok=True)

    content = f'export {{ default }} from "@/app/enterprise/{page}/page";\n'

    with open(out_file, "w") as f:
        f.write(content)
    created += 1
    print(f"  created: /superadmin/{page}")

print(f"\nDone — {created} mirror pages created.")
