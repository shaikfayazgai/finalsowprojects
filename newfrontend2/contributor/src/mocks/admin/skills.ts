/**
 * Admin · skill taxonomy mock — spec doc 04 §5.E.
 * Phase 1 exit: ≥200 seeded skills. Mock seeds ~30 across categories; rest can be added.
 */

export type SkillStatus = "active" | "deprecated" | "pending";

export interface MockSkillLevel {
  level: 1 | 2 | 3 | 4;
  label: string;
  description: string;
}

export interface MockSkill {
  id: string;
  name: string;
  category: "Frontend" | "Backend" | "Data" | "Design" | "Marketing" | "Documentation" | "DevOps" | "AI/ML" | "Other";
  aliases: string[];
  status: SkillStatus;
  holders: number;
  adjacency: string[];       // skill ids
  levels: MockSkillLevel[];
  createdAt: string;
  createdBy?: string;
}

const STD_LEVELS: MockSkillLevel[] = [
  { level: 1, label: "Familiar",  description: "Have done it; need supervision." },
  { level: 2, label: "Competent", description: "Can deliver to spec." },
  { level: 3, label: "Strong",    description: "Can deliver + help others." },
  { level: 4, label: "Expert",    description: "Can shape the spec." },
];

export const MOCK_SKILLS: MockSkill[] = [
  { id: "s-react",      name: "React",                 category: "Frontend",      aliases: ["ReactJS", "React.js"], status: "active",     holders: 48, adjacency: ["s-vue", "s-svelte", "s-nextjs"], levels: STD_LEVELS, createdAt: "2025-08-12T00:00:00Z" },
  { id: "s-nextjs",     name: "Next.js",               category: "Frontend",      aliases: ["NextJS"],              status: "active",     holders: 36, adjacency: ["s-react"],                       levels: STD_LEVELS, createdAt: "2025-08-12T00:00:00Z" },
  { id: "s-vue",        name: "Vue",                   category: "Frontend",      aliases: ["Vue.js", "VueJS"],     status: "active",     holders: 14, adjacency: ["s-react", "s-svelte"],            levels: STD_LEVELS, createdAt: "2025-08-12T00:00:00Z" },
  { id: "s-svelte",     name: "Svelte",                category: "Frontend",      aliases: [],                       status: "active",     holders: 6,  adjacency: ["s-react", "s-vue"],               levels: STD_LEVELS, createdAt: "2025-09-02T00:00:00Z" },
  { id: "s-ts",         name: "TypeScript",            category: "Frontend",      aliases: ["TS"],                  status: "active",     holders: 62, adjacency: ["s-js"],                           levels: STD_LEVELS, createdAt: "2025-08-12T00:00:00Z" },
  { id: "s-js",         name: "JavaScript",            category: "Frontend",      aliases: ["JS"],                  status: "active",     holders: 88, adjacency: ["s-ts"],                           levels: STD_LEVELS, createdAt: "2025-08-12T00:00:00Z" },
  { id: "s-tailwind",   name: "Tailwind CSS",          category: "Frontend",      aliases: [],                       status: "active",     holders: 41, adjacency: ["s-react"],                       levels: STD_LEVELS, createdAt: "2025-09-04T00:00:00Z" },
  { id: "s-figma",      name: "Figma",                 category: "Design",        aliases: [],                       status: "active",     holders: 28, adjacency: ["s-design-systems"],              levels: STD_LEVELS, createdAt: "2025-08-12T00:00:00Z" },
  { id: "s-a11y",       name: "Accessibility (WCAG)",  category: "Design",        aliases: ["a11y", "WCAG"],         status: "active",     holders: 18, adjacency: ["s-figma"],                        levels: STD_LEVELS, createdAt: "2025-08-12T00:00:00Z" },
  { id: "s-design-systems", name: "Design Systems",    category: "Design",        aliases: [],                       status: "active",     holders: 11, adjacency: ["s-figma"],                        levels: STD_LEVELS, createdAt: "2025-08-21T00:00:00Z" },
  { id: "s-illust",     name: "Illustration",          category: "Design",        aliases: [],                       status: "active",     holders: 9,  adjacency: [],                                 levels: STD_LEVELS, createdAt: "2025-08-12T00:00:00Z" },
  { id: "s-flash",      name: "Adobe Flash",           category: "Design",        aliases: [],                       status: "deprecated", holders: 2,  adjacency: ["s-illust"],                       levels: STD_LEVELS, createdAt: "2024-01-10T00:00:00Z" },
  { id: "s-python",     name: "Python",                category: "Backend",       aliases: [],                       status: "active",     holders: 58, adjacency: ["s-fastapi"],                      levels: STD_LEVELS, createdAt: "2025-08-12T00:00:00Z" },
  { id: "s-fastapi",    name: "FastAPI",               category: "Backend",       aliases: [],                       status: "active",     holders: 22, adjacency: ["s-python"],                       levels: STD_LEVELS, createdAt: "2025-08-12T00:00:00Z" },
  { id: "s-node",       name: "Node.js",               category: "Backend",       aliases: ["NodeJS"],              status: "active",     holders: 44, adjacency: ["s-js"],                           levels: STD_LEVELS, createdAt: "2025-08-12T00:00:00Z" },
  { id: "s-go",         name: "Go",                    category: "Backend",       aliases: ["Golang"],              status: "active",     holders: 16, adjacency: [],                                 levels: STD_LEVELS, createdAt: "2025-09-15T00:00:00Z" },
  { id: "s-rust",       name: "Rust",                  category: "Backend",       aliases: [],                       status: "pending",    holders: 8,  adjacency: ["s-go"],                           levels: STD_LEVELS, createdAt: "2026-05-20T00:00:00Z", createdBy: "Suggested by 4 contributors" },
  { id: "s-postgres",   name: "PostgreSQL",            category: "Backend",       aliases: ["Postgres"],            status: "active",     holders: 38, adjacency: [],                                 levels: STD_LEVELS, createdAt: "2025-08-12T00:00:00Z" },
  { id: "s-django",     name: "Django",                category: "Backend",       aliases: [],                       status: "active",     holders: 19, adjacency: ["s-python"],                       levels: STD_LEVELS, createdAt: "2025-09-04T00:00:00Z" },
  { id: "s-spark",      name: "Apache Spark",          category: "Data",          aliases: ["Spark"],               status: "active",     holders: 12, adjacency: [],                                 levels: STD_LEVELS, createdAt: "2025-09-04T00:00:00Z" },
  { id: "s-sql",        name: "SQL",                   category: "Data",          aliases: [],                       status: "active",     holders: 58, adjacency: ["s-postgres"],                     levels: STD_LEVELS, createdAt: "2025-08-12T00:00:00Z" },
  { id: "s-pandas",     name: "Pandas",                category: "Data",          aliases: [],                       status: "active",     holders: 30, adjacency: ["s-python"],                       levels: STD_LEVELS, createdAt: "2025-08-12T00:00:00Z" },
  { id: "s-tableau",    name: "Tableau",               category: "Data",          aliases: [],                       status: "active",     holders: 14, adjacency: [],                                 levels: STD_LEVELS, createdAt: "2025-08-12T00:00:00Z" },
  { id: "s-pytorch",    name: "PyTorch",               category: "AI/ML",         aliases: [],                       status: "active",     holders: 11, adjacency: [],                                 levels: STD_LEVELS, createdAt: "2025-10-02T00:00:00Z" },
  { id: "s-llm-fine",   name: "LLM fine-tuning",       category: "AI/ML",         aliases: ["RLHF"],                status: "pending",    holders: 4,  adjacency: ["s-pytorch"],                      levels: STD_LEVELS, createdAt: "2026-05-22T00:00:00Z", createdBy: "Suggested by Mentor MPM" },
  { id: "s-aws",        name: "AWS",                   category: "DevOps",        aliases: ["Amazon Web Services"], status: "active",     holders: 29, adjacency: [],                                 levels: STD_LEVELS, createdAt: "2025-08-12T00:00:00Z" },
  { id: "s-k8s",        name: "Kubernetes",            category: "DevOps",        aliases: ["K8s"],                 status: "active",     holders: 18, adjacency: ["s-docker"],                       levels: STD_LEVELS, createdAt: "2025-08-12T00:00:00Z" },
  { id: "s-docker",     name: "Docker",                category: "DevOps",        aliases: [],                       status: "active",     holders: 33, adjacency: ["s-k8s"],                          levels: STD_LEVELS, createdAt: "2025-08-12T00:00:00Z" },
  { id: "s-tech-write", name: "Technical writing",     category: "Documentation", aliases: [],                       status: "active",     holders: 22, adjacency: [],                                 levels: STD_LEVELS, createdAt: "2025-08-12T00:00:00Z" },
  { id: "s-content",    name: "Content marketing",     category: "Marketing",     aliases: [],                       status: "active",     holders: 16, adjacency: [],                                 levels: STD_LEVELS, createdAt: "2025-08-12T00:00:00Z" },
  { id: "s-seo",        name: "SEO",                   category: "Marketing",     aliases: [],                       status: "active",     holders: 9,  adjacency: ["s-content"],                      levels: STD_LEVELS, createdAt: "2025-08-12T00:00:00Z" },
  { id: "s-reactjs",    name: "ReactJS",               category: "Frontend",      aliases: [],                       status: "pending",    holders: 12, adjacency: ["s-react"],                        levels: STD_LEVELS, createdAt: "2026-05-26T00:00:00Z", createdBy: "Auto-flagged duplicate of React" },
];

export function findSkillById(id: string): MockSkill | undefined {
  return MOCK_SKILLS.find((s) => s.id === id);
}
