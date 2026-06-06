import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  Calendar,
  ClipboardList,
  BarChart3,
  Settings,
  Shield,
  Layers,
  UserCheck,
  Briefcase,
  FileText,
  Bell,
} from "lucide-react";
import type { ModuleConfig } from "@/lib/config/navigation";

// ── University Admin ──────────────────────────────────────────────────────────

export const uniAdminNav: ModuleConfig = {
  id: "uni-admin",
  name: "University Admin",
  shortName: "Admin",
  basePath: "/university/admin",
  homePath: "/university/admin/dashboard",
  accentColor: "blue",
  sections: [
    {
      zone: "primary",
      emphasis: "primary",
      items: [
        { label: "Dashboard", href: "/university/admin/dashboard", icon: LayoutDashboard, shortcut: "G D" },
      ],
    },
    {
      title: "Academic",
      zone: "primary",
      items: [
        { label: "Users", href: "/university/admin/users", icon: Users },
        { label: "Programmes", href: "/university/admin/programmes", icon: GraduationCap },
        { label: "Semesters", href: "/university/admin/semesters", icon: Calendar },
        { label: "Courses", href: "/university/admin/courses", icon: BookOpen },
        { label: "Sections", href: "/university/admin/sections", icon: Layers },
      ],
    },
    {
      title: "Oversight",
      zone: "governance",
      items: [
        { label: "Analytics", href: "/university/admin/analytics", icon: BarChart3 },
        { label: "Audit Trail", href: "/university/admin/audit", icon: ClipboardList },
        { label: "Notifications", href: "/university/admin/notifications", icon: Bell },
      ],
    },
    {
      title: "System",
      zone: "footer",
      items: [
        { label: "Settings", href: "/university/admin/settings", icon: Settings },
      ],
    },
  ],
};

// ── Faculty ───────────────────────────────────────────────────────────────────

export const uniFacultyNav: ModuleConfig = {
  id: "uni-faculty",
  name: "Faculty Portal",
  shortName: "Faculty",
  basePath: "/university/faculty",
  homePath: "/university/faculty/dashboard",
  accentColor: "violet",
  sections: [
    {
      zone: "primary",
      emphasis: "primary",
      items: [
        { label: "Dashboard", href: "/university/faculty/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "Teaching",
      zone: "primary",
      items: [
        { label: "My Courses", href: "/university/faculty/courses", icon: BookOpen },
        { label: "Students", href: "/university/faculty/students", icon: Users },
        { label: "Assignments", href: "/university/faculty/assignments", icon: FileText },
      ],
    },
    {
      title: "Management",
      zone: "footer",
      items: [
        { label: "Notifications", href: "/university/faculty/notifications", icon: Bell },
        { label: "Profile", href: "/university/faculty/profile", icon: UserCheck },
        { label: "Settings", href: "/university/faculty/settings", icon: Settings },
      ],
    },
  ],
};

// ── Student ───────────────────────────────────────────────────────────────────

export const uniStudentNav: ModuleConfig = {
  id: "uni-student",
  name: "Student Portal",
  shortName: "Student",
  basePath: "/university/student",
  homePath: "/university/student/dashboard",
  accentColor: "cyan",
  sections: [
    {
      zone: "primary",
      emphasis: "primary",
      items: [
        { label: "Dashboard", href: "/university/student/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "Academics",
      zone: "primary",
      items: [
        { label: "My Courses", href: "/university/student/courses", icon: BookOpen },
        { label: "Transcript", href: "/university/student/transcript", icon: FileText },
        { label: "Skills", href: "/university/student/skills", icon: Shield },
      ],
    },
    {
      title: "Career",
      zone: "governance",
      items: [
        { label: "Jobs", href: "/university/student/jobs", icon: Briefcase },
        { label: "Applications", href: "/university/student/applications", icon: ClipboardList },
        { label: "Portfolio", href: "/university/student/portfolio", icon: BarChart3 },
      ],
    },
    {
      title: "Support",
      zone: "footer",
      items: [
        { label: "Notifications", href: "/university/student/notifications", icon: Bell },
        { label: "Profile", href: "/university/student/profile", icon: UserCheck },
        { label: "Settings", href: "/university/student/settings", icon: Settings },
      ],
    },
  ],
};

// ── Placement ─────────────────────────────────────────────────────────────────

export const uniPlacementNav: ModuleConfig = {
  id: "uni-placement",
  name: "Placement Portal",
  shortName: "Placement",
  basePath: "/university/placement",
  homePath: "/university/placement/dashboard",
  accentColor: "green",
  sections: [
    {
      zone: "primary",
      emphasis: "primary",
      items: [
        { label: "Dashboard", href: "/university/placement/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "Operations",
      zone: "primary",
      items: [
        { label: "Students", href: "/university/placement/students", icon: Users },
        { label: "Employers", href: "/university/placement/employers", icon: Briefcase },
        { label: "Pipeline", href: "/university/placement/pipeline", icon: Layers },
      ],
    },
    {
      title: "Matching",
      zone: "governance",
      items: [
        { label: "Match Results", href: "/university/placement/matching", icon: UserCheck },
        { label: "Reports", href: "/university/placement/reports", icon: BarChart3 },
      ],
    },
    {
      title: "System",
      zone: "footer",
      items: [
        { label: "Settings", href: "/university/placement/settings", icon: Settings },
      ],
    },
  ],
};
