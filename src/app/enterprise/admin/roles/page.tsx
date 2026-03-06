"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Plus,
  Users,
  ChevronDown,
  ChevronUp,
  Lock,
  Sparkles,
  FileText,
  FolderKanban,
  CircleDollarSign,
  UserCog,
  BarChart3,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import {
  Badge,
  Switch,
  Input,
  Label,
  Textarea,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui";
import { mockRoles } from "@/mocks/data/enterprise-analytics";

/* ── Permission grid categories with sub-permissions ── */
const permissionGrid = [
  { key: "SOW", icon: FileText, permissions: { read: "sow:read", write: "sow:edit", delete: "sow:*" } },
  { key: "Project", icon: FolderKanban, permissions: { read: "project:read", write: "project:edit", delete: "project:*" } },
  { key: "Billing", icon: CircleDollarSign, permissions: { read: "billing:read", write: "billing:edit", delete: "billing:*" } },
  { key: "Team", icon: Users, permissions: { read: "team:read", write: "team:edit", delete: "team:*" } },
  { key: "Admin", icon: UserCog, permissions: { read: "admin:users", write: "admin:config", delete: "admin:*" } },
  { key: "Analytics", icon: BarChart3, permissions: { read: "analytics:read", write: "analytics:cost", delete: "analytics:*" } },
];

/* ── All available permissions flat list ── */
const allPermissions = permissionGrid.flatMap((cat) =>
  Object.entries(cat.permissions).map(([level, perm]) => ({
    category: cat.key,
    level,
    permission: perm,
    label: `${cat.key} — ${level.charAt(0).toUpperCase() + level.slice(1)}`,
  }))
);

/* ── Helper to check permission ── */
function hasPermission(rolePerms: string[], perm: string): boolean {
  return (
    rolePerms.includes(perm) ||
    rolePerms.some(
      (p) => p.endsWith(":*") && perm.startsWith(p.replace(":*", ":"))
    ) ||
    rolePerms.includes(perm.split(":")[0] + ":*")
  );
}

/* ── Create Role Dialog ── */
function CreateRoleDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [selectedPerms, setSelectedPerms] = React.useState<string[]>([]);

  const togglePerm = (perm: string) => {
    setSelectedPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleCreate = () => {
    // In a real app, this would POST to API
    setOpen(false);
    setName("");
    setDescription("");
    setSelectedPerms([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="text-brown-900 font-heading">Create Custom Role</DialogTitle>
          <DialogDescription className="text-beige-500">
            Define a new role with specific permissions for your organization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-[12px] text-brown-700">Role Name</Label>
            <Input
              placeholder="e.g. Project Lead"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[12px] text-brown-700">Description</Label>
            <Textarea
              placeholder="Describe what this role can do..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-20 text-[12px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[12px] text-brown-700">
              Permissions ({selectedPerms.length} selected)
            </Label>
            <div className="rounded-xl border border-beige-100 bg-beige-50/40 p-4 max-h-[240px] overflow-y-auto">
              {permissionGrid.map((cat) => {
                const CatIcon = cat.icon;
                return (
                  <div key={cat.key} className="mb-3 last:mb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <CatIcon className="w-3.5 h-3.5 text-beige-400" />
                      <span className="text-[11px] font-semibold text-brown-700">{cat.key}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pl-5">
                      {Object.entries(cat.permissions).map(([level, perm]) => (
                        <label
                          key={perm}
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                          <Checkbox
                            checked={selectedPerms.includes(perm)}
                            onCheckedChange={() => togglePerm(perm)}
                          />
                          <span className="text-[11px] text-beige-600 group-hover:text-brown-700 transition-colors">
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={() => setOpen(false)}
            className="px-4 py-2 rounded-xl border border-beige-200 text-[12px] font-semibold text-brown-700 hover:bg-beige-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name}
            className="px-4 py-2.5 rounded-xl bg-brown-600 hover:bg-brown-700 text-white text-[12px] font-semibold shadow-md hover:shadow-lg hover:shadow-brown-500/25 transition-all disabled:opacity-50"
          >
            Create Role
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Role card component ── */
function RoleCard({ role }: { role: (typeof mockRoles)[0] }) {
  const [expanded, setExpanded] = React.useState(false);

  const accentGradients: Record<string, string> = {
    Owner: "from-brown-400 to-brown-600",
    Admin: "from-teal-400 to-teal-600",
    Manager: "from-forest-400 to-forest-600",
    Viewer: "from-beige-400 to-beige-500",
    "Finance Lead": "from-gold-400 to-gold-600",
  };

  return (
    <motion.div
      variants={scaleIn}
      className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden hover:shadow-lg hover:shadow-brown-100/15 transition-all"
    >
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-sm",
                accentGradients[role.name] || "from-brown-400 to-brown-600"
              )}
            >
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-semibold text-brown-800">{role.name}</h3>
                <Badge variant={role.isSystem ? "teal" : "gold"} size="sm">
                  {role.isSystem ? "System" : "Custom"}
                </Badge>
              </div>
              <p className="text-[11px] text-beige-500 mt-0.5">{role.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-beige-100/80 rounded-lg px-2.5 py-1">
            <Users className="w-3 h-3 text-beige-500" />
            <span className="text-[11px] font-bold text-brown-700">{role.userCount}</span>
          </div>
        </div>

        {/* Permission count + tags */}
        <div className="flex items-center gap-2 mt-3 mb-2">
          <Badge variant="beige" size="sm">
            {role.permissions.length} permissions
          </Badge>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {role.permissions.map((perm) => (
            <span
              key={perm}
              className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-beige-100 text-beige-700"
            >
              {perm}
            </span>
          ))}
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 mt-4 text-[11px] font-semibold text-teal-600 hover:text-teal-700 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Hide permission grid
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              View permission grid
            </>
          )}
        </button>
      </div>

      {/* Expandable permission grid */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div className="border-t border-beige-100 bg-beige-50/40 px-5 py-4">
              {/* Grid header */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="text-[10px] font-semibold text-beige-500 uppercase tracking-wider">Category</div>
                <div className="text-[10px] font-semibold text-beige-500 uppercase tracking-wider text-center">Read</div>
                <div className="text-[10px] font-semibold text-beige-500 uppercase tracking-wider text-center">Write</div>
                <div className="text-[10px] font-semibold text-beige-500 uppercase tracking-wider text-center">Full</div>
              </div>

              {/* Grid rows */}
              {permissionGrid.map((cat) => {
                const CatIcon = cat.icon;
                return (
                  <div
                    key={cat.key}
                    className="grid grid-cols-4 gap-2 py-2 border-b border-beige-100 last:border-0 items-center"
                  >
                    <div className="flex items-center gap-2">
                      <CatIcon className="w-3.5 h-3.5 text-beige-400" />
                      <span className="text-[12px] font-medium text-brown-700">{cat.key}</span>
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={hasPermission(role.permissions, cat.permissions.read)}
                        disabled
                        className="scale-75 pointer-events-none"
                      />
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={hasPermission(role.permissions, cat.permissions.write)}
                        disabled
                        className="scale-75 pointer-events-none"
                      />
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={hasPermission(role.permissions, cat.permissions.delete)}
                        disabled
                        className="scale-75 pointer-events-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════
   ROLES & PERMISSIONS PAGE (H2)
   ═══════════════════════════════ */
export default function RolesPage() {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1200px] mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
      >
        <div>
          <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em] font-heading">
            Roles & Permissions
          </h1>
          <p className="text-[13px] text-beige-500 mt-1">
            Define access levels and permission sets for your organization.
          </p>
        </div>
        <CreateRoleDialog
          trigger={
            <button className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brown-600 hover:bg-brown-700 text-white text-[12px] font-semibold shadow-md hover:shadow-lg hover:shadow-brown-500/25 transition-all hover:-translate-y-0.5">
              <Plus className="w-3.5 h-3.5" />
              Create Role
            </button>
          }
        />
      </motion.div>

      {/* Summary bar */}
      <motion.div
        variants={fadeUp}
        className="flex items-center gap-4 px-5 py-3 rounded-xl border border-beige-200/50 bg-white/60 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-beige-400" />
          <span className="text-[12px] text-beige-600">
            <span className="font-semibold text-brown-800">
              {mockRoles.filter((r) => r.isSystem).length}
            </span>{" "}
            system roles
          </span>
        </div>
        <div className="w-px h-4 bg-beige-200" />
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold-500" />
          <span className="text-[12px] text-beige-600">
            <span className="font-semibold text-brown-800">
              {mockRoles.filter((r) => !r.isSystem).length}
            </span>{" "}
            custom roles
          </span>
        </div>
        <div className="w-px h-4 bg-beige-200" />
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-teal-500" />
          <span className="text-[12px] text-beige-600">
            <span className="font-semibold text-brown-800">
              {mockRoles.reduce((sum, r) => sum + r.userCount, 0)}
            </span>{" "}
            total users
          </span>
        </div>
      </motion.div>

      {/* Roles grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {mockRoles.map((role) => (
          <RoleCard key={role.id} role={role} />
        ))}
      </div>
    </motion.div>
  );
}
