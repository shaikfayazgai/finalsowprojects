-- Migration M10 · skill_taxonomy_mentor_pool
-- Phase 1 foundations · doc 06 §10.0 priority #3
--
-- Adds Skill + ContributorSkill + Mentor + MentorSkill (cross-tenant,
-- no RLS — these are global taxonomies; access is permission-based).
-- Seeds 6 new permissions + role mappings + ~60 starter skills.
--
-- Schema highlights:
--   - Skill: hierarchical (parentId). Category roots are top-level rows
--            with a category string and no parent. Specific skills sit
--            under a parent.
--   - ContributorSkill: one row per user×skill claim. Source field
--            indicates trust (self / assessment / verified).
--   - Mentor: 1:1 with User. Holds review-domain state (capacity,
--            mentorship willingness, status).
--   - MentorSkill: which skills a mentor reviews + how deep (lead /
--            depth / aware).
--
-- DDL applied via `prisma db push` (Phase 1 dev mode). This file is
-- the canonical record for production migration cleanup. Permissions
-- + skill seed below ARE applied via psql directly.

-- ═════════════════════════════════════════════════════════════════════
-- PERMISSIONS
-- ═════════════════════════════════════════════════════════════════════

INSERT INTO "Permission" ("code", "resource", "action", "description") VALUES
  ('read.skill',                     'skill',             'read',     'Read the global skill taxonomy'),
  ('manage.skill',                   'skill',             'manage',   'Create / update / archive skills'),
  ('read.mentor_pool',               'mentor',            'read',     'Read mentor pool listing + profiles'),
  ('manage.mentor_pool',             'mentor',            'manage',   'Add / remove / update mentor profiles'),
  ('claim.contributor_skill',        'contributor_skill', 'claim',    'Self-claim a skill on own profile'),
  ('read.contributor_skill',         'contributor_skill', 'read',     'Read another contributor''s skill claims (mentor / admin)')
ON CONFLICT (code) DO NOTHING;

-- ─── Role-permission mappings ───

-- plat.admin: manage everything
INSERT INTO "RolePermission" ("roleCode", "permissionCode")
SELECT 'plat.admin', code FROM "Permission"
WHERE "resource" IN ('skill', 'mentor', 'contributor_skill')
ON CONFLICT DO NOTHING;

-- plat.tns (Trust & Safety): read mentor pool, read contributor skills
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('plat.tns', 'read.skill'),
  ('plat.tns', 'read.mentor_pool'),
  ('plat.tns', 'read.contributor_skill')
ON CONFLICT DO NOTHING;

-- plat.compliance: read-only oversight
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('plat.compliance', 'read.skill'),
  ('plat.compliance', 'read.mentor_pool'),
  ('plat.compliance', 'read.contributor_skill')
ON CONFLICT DO NOTHING;

-- contributor: read taxonomy + claim own skills
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('contributor', 'read.skill'),
  ('contributor', 'claim.contributor_skill')
ON CONFLICT DO NOTHING;

-- mentor.* roles: read taxonomy, see contributor skills (for review context)
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('mentor',        'read.skill'),
  ('mentor',        'read.mentor_pool'),
  ('mentor',        'read.contributor_skill'),
  ('mentor.senior', 'read.skill'),
  ('mentor.senior', 'read.mentor_pool'),
  ('mentor.senior', 'read.contributor_skill'),
  ('mentor.lead',   'read.skill'),
  ('mentor.lead',   'read.mentor_pool'),
  ('mentor.lead',   'read.contributor_skill')
ON CONFLICT DO NOTHING;

-- Enterprise users see the taxonomy + mentor pool (for SOW skill tagging
-- and reviewer selection). Per-tenant scopes are unaffected — these are
-- platform-wide reads.
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('ent.admin',      'read.skill'),
  ('ent.admin',      'read.mentor_pool'),
  ('ent.sponsor',    'read.skill'),
  ('ent.sponsor',    'read.mentor_pool'),
  ('ent.pmo',        'read.skill'),
  ('ent.pmo',        'read.mentor_pool'),
  ('ent.reviewer',   'read.skill'),
  ('ent.reviewer',   'read.contributor_skill')
ON CONFLICT DO NOTHING;

-- ═════════════════════════════════════════════════════════════════════
-- SKILL TAXONOMY SEED — 6 category roots + ~55 child skills = 61 rows
-- ═════════════════════════════════════════════════════════════════════
-- Phase 1 ships a starter taxonomy that covers the dominant contribution
-- types in the SOW v1.1 spec (engineering / design / product / data /
-- ops / GTM). The taxonomy is editable post-launch via the admin UI;
-- these are defaults, not contracts.

INSERT INTO "Skill" ("id", "code", "name", "category", "parentId", "description", "active", "updatedAt") VALUES
  -- ─────── Category roots ───────
  ('skl-cat-engineering', 'engineering',  'Engineering',  'engineering', NULL, 'Software engineering disciplines',         true, CURRENT_TIMESTAMP),
  ('skl-cat-design',      'design',       'Design',       'design',      NULL, 'Product, UX, visual, and design system work', true, CURRENT_TIMESTAMP),
  ('skl-cat-product',     'product',      'Product',      'product',     NULL, 'Product management + strategy',            true, CURRENT_TIMESTAMP),
  ('skl-cat-data',        'data',         'Data + AI',    'data',        NULL, 'Data engineering, analytics, ML, AI work', true, CURRENT_TIMESTAMP),
  ('skl-cat-ops',         'ops',          'Operations',   'ops',         NULL, 'DevOps, SRE, security operations',         true, CURRENT_TIMESTAMP),
  ('skl-cat-gtm',         'gtm',          'Go-to-market', 'gtm',         NULL, 'Marketing, sales engineering, content',    true, CURRENT_TIMESTAMP),

  -- ─────── Engineering children ───────
  ('skl-eng-frontend',    'engineering.frontend',     'Frontend Engineering',     'engineering', 'skl-cat-engineering', 'Browser/web app development',          true, CURRENT_TIMESTAMP),
  ('skl-eng-backend',     'engineering.backend',      'Backend Engineering',      'engineering', 'skl-cat-engineering', 'Server-side service development',      true, CURRENT_TIMESTAMP),
  ('skl-eng-fullstack',   'engineering.fullstack',    'Full-stack Engineering',   'engineering', 'skl-cat-engineering', 'Both frontend and backend',            true, CURRENT_TIMESTAMP),
  ('skl-eng-mobile-ios',  'engineering.mobile.ios',   'iOS Engineering',          'engineering', 'skl-cat-engineering', 'Swift / SwiftUI native iOS',           true, CURRENT_TIMESTAMP),
  ('skl-eng-mobile-and',  'engineering.mobile.android','Android Engineering',     'engineering', 'skl-cat-engineering', 'Kotlin / Jetpack Compose native Android', true, CURRENT_TIMESTAMP),
  ('skl-eng-mobile-rn',   'engineering.mobile.cross', 'Cross-platform Mobile',    'engineering', 'skl-cat-engineering', 'React Native / Flutter',               true, CURRENT_TIMESTAMP),
  ('skl-eng-react',       'engineering.react',        'React',                    'engineering', 'skl-eng-frontend',    'React + ecosystem (Next.js etc.)',     true, CURRENT_TIMESTAMP),
  ('skl-eng-vue',         'engineering.vue',          'Vue',                      'engineering', 'skl-eng-frontend',    'Vue 3 / Nuxt',                         true, CURRENT_TIMESTAMP),
  ('skl-eng-angular',     'engineering.angular',      'Angular',                  'engineering', 'skl-eng-frontend',    'Angular 16+',                          true, CURRENT_TIMESTAMP),
  ('skl-eng-node',        'engineering.node',         'Node.js',                  'engineering', 'skl-eng-backend',     'Server-side JavaScript / TypeScript',  true, CURRENT_TIMESTAMP),
  ('skl-eng-python',      'engineering.python',       'Python',                   'engineering', 'skl-eng-backend',     'Django / FastAPI / Flask',             true, CURRENT_TIMESTAMP),
  ('skl-eng-java',        'engineering.java',         'Java',                     'engineering', 'skl-eng-backend',     'Spring / Quarkus',                     true, CURRENT_TIMESTAMP),
  ('skl-eng-go',          'engineering.go',           'Go',                       'engineering', 'skl-eng-backend',     'Golang services',                      true, CURRENT_TIMESTAMP),
  ('skl-eng-rust',        'engineering.rust',         'Rust',                     'engineering', 'skl-eng-backend',     'Systems / performance-critical',       true, CURRENT_TIMESTAMP),
  ('skl-eng-dotnet',      'engineering.dotnet',       '.NET',                     'engineering', 'skl-eng-backend',     'C# / ASP.NET Core',                    true, CURRENT_TIMESTAMP),
  ('skl-eng-arch',        'engineering.architecture', 'Software Architecture',    'engineering', 'skl-cat-engineering', 'System design + architecture review',  true, CURRENT_TIMESTAMP),
  ('skl-eng-testing',     'engineering.testing',      'Testing / QA',             'engineering', 'skl-cat-engineering', 'Test strategy + automation',           true, CURRENT_TIMESTAMP),

  -- ─────── Design children ───────
  ('skl-des-product',     'design.product',           'Product Design',           'design', 'skl-cat-design', 'End-to-end product design',                  true, CURRENT_TIMESTAMP),
  ('skl-des-ux-research', 'design.research',          'UX Research',              'design', 'skl-cat-design', 'User research, interviews, usability tests', true, CURRENT_TIMESTAMP),
  ('skl-des-ui',          'design.ui',                'UI Design',                'design', 'skl-cat-design', 'Visual interface design',                    true, CURRENT_TIMESTAMP),
  ('skl-des-system',      'design.system',            'Design Systems',           'design', 'skl-cat-design', 'Token + component library work',             true, CURRENT_TIMESTAMP),
  ('skl-des-illust',      'design.illustration',      'Illustration',             'design', 'skl-cat-design', 'Editorial + product illustration',           true, CURRENT_TIMESTAMP),
  ('skl-des-motion',      'design.motion',            'Motion + Interaction',     'design', 'skl-cat-design', 'Animation + microinteractions',              true, CURRENT_TIMESTAMP),
  ('skl-des-a11y',        'design.accessibility',     'Accessibility (A11y)',     'design', 'skl-cat-design', 'WCAG-compliant inclusive design',            true, CURRENT_TIMESTAMP),

  -- ─────── Product children ───────
  ('skl-prd-strategy',    'product.strategy',         'Product Strategy',         'product', 'skl-cat-product', 'Roadmap, vision, market framing',        true, CURRENT_TIMESTAMP),
  ('skl-prd-discovery',   'product.discovery',        'Product Discovery',        'product', 'skl-cat-product', 'User problem framing + validation',      true, CURRENT_TIMESTAMP),
  ('skl-prd-spec',        'product.spec',             'Spec + PRD Writing',       'product', 'skl-cat-product', 'Detailed product requirement docs',      true, CURRENT_TIMESTAMP),
  ('skl-prd-growth',      'product.growth',           'Growth Product',           'product', 'skl-cat-product', 'Funnel, retention, monetization',        true, CURRENT_TIMESTAMP),
  ('skl-prd-analytics',   'product.analytics',        'Product Analytics',        'product', 'skl-cat-product', 'Mixpanel / Amplitude / SQL analysis',    true, CURRENT_TIMESTAMP),

  -- ─────── Data + AI children ───────
  ('skl-dat-eng',         'data.engineering',         'Data Engineering',         'data', 'skl-cat-data', 'Pipelines, ETL, warehousing',                   true, CURRENT_TIMESTAMP),
  ('skl-dat-analytics',   'data.analytics',           'Data Analytics',           'data', 'skl-cat-data', 'BI, dashboards, ad-hoc analysis',               true, CURRENT_TIMESTAMP),
  ('skl-dat-science',     'data.science',             'Data Science / ML',        'data', 'skl-cat-data', 'Modeling, statistics, ML',                      true, CURRENT_TIMESTAMP),
  ('skl-dat-ml-ops',      'data.ml-ops',              'ML Ops',                   'data', 'skl-cat-data', 'Model deployment + lifecycle',                  true, CURRENT_TIMESTAMP),
  ('skl-dat-ai-applied',  'data.ai.applied',          'Applied AI',               'data', 'skl-cat-data', 'LLM / vision / multimodal integration',         true, CURRENT_TIMESTAMP),
  ('skl-dat-ai-prompt',   'data.ai.prompt',           'Prompt Engineering',       'data', 'skl-cat-data', 'LLM prompt design + evaluation',                true, CURRENT_TIMESTAMP),
  ('skl-dat-ai-rag',      'data.ai.rag',              'RAG / Retrieval',          'data', 'skl-cat-data', 'Retrieval-augmented generation systems',        true, CURRENT_TIMESTAMP),

  -- ─────── Operations children ───────
  ('skl-ops-devops',      'ops.devops',               'DevOps',                   'ops', 'skl-cat-ops', 'CI/CD + infra automation',                         true, CURRENT_TIMESTAMP),
  ('skl-ops-sre',         'ops.sre',                  'SRE',                      'ops', 'skl-cat-ops', 'Reliability + on-call engineering',                true, CURRENT_TIMESTAMP),
  ('skl-ops-cloud-aws',   'ops.cloud.aws',            'AWS',                      'ops', 'skl-cat-ops', 'AWS architecture + admin',                         true, CURRENT_TIMESTAMP),
  ('skl-ops-cloud-gcp',   'ops.cloud.gcp',            'Google Cloud',             'ops', 'skl-cat-ops', 'GCP architecture + admin',                         true, CURRENT_TIMESTAMP),
  ('skl-ops-cloud-azure', 'ops.cloud.azure',          'Azure',                    'ops', 'skl-cat-ops', 'Azure architecture + admin',                       true, CURRENT_TIMESTAMP),
  ('skl-ops-k8s',         'ops.kubernetes',           'Kubernetes',               'ops', 'skl-cat-ops', 'K8s orchestration + admin',                        true, CURRENT_TIMESTAMP),
  ('skl-ops-sec-appsec',  'ops.security.appsec',      'Application Security',     'ops', 'skl-cat-ops', 'Code-level security + SAST/DAST',                  true, CURRENT_TIMESTAMP),
  ('skl-ops-sec-infrasec','ops.security.infrasec',    'Infrastructure Security',  'ops', 'skl-cat-ops', 'Network + cloud security',                         true, CURRENT_TIMESTAMP),
  ('skl-ops-sec-compl',   'ops.security.compliance',  'Security Compliance',      'ops', 'skl-cat-ops', 'SOC2, ISO27001, GDPR controls',                    true, CURRENT_TIMESTAMP),

  -- ─────── Go-to-market children ───────
  ('skl-gtm-content',     'gtm.content',              'Content Marketing',        'gtm', 'skl-cat-gtm', 'Long-form + technical content',                    true, CURRENT_TIMESTAMP),
  ('skl-gtm-copy',        'gtm.copy',                 'Copywriting',              'gtm', 'skl-cat-gtm', 'Marketing copy + landing pages',                   true, CURRENT_TIMESTAMP),
  ('skl-gtm-seo',         'gtm.seo',                  'SEO',                      'gtm', 'skl-cat-gtm', 'Technical + content SEO',                          true, CURRENT_TIMESTAMP),
  ('skl-gtm-paid',        'gtm.paid',                 'Paid Acquisition',         'gtm', 'skl-cat-gtm', 'PPC, social ads, campaign mgmt',                   true, CURRENT_TIMESTAMP),
  ('skl-gtm-brand',       'gtm.brand',                'Brand + Visual Identity',  'gtm', 'skl-cat-gtm', 'Brand systems + visual identity',                  true, CURRENT_TIMESTAMP),
  ('skl-gtm-sales-eng',   'gtm.sales-engineering',    'Sales Engineering',        'gtm', 'skl-cat-gtm', 'Pre-sales technical solutioning',                  true, CURRENT_TIMESTAMP),
  ('skl-gtm-customer-suc','gtm.customer-success',     'Customer Success',         'gtm', 'skl-cat-gtm', 'Post-sale customer enablement',                    true, CURRENT_TIMESTAMP)
ON CONFLICT (code) DO NOTHING;
