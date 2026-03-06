"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeDollarSign,
  DollarSign,
  TrendingUp,
  Users,
  Layers,
  Code2,
  Palette,
  Bug,
  Server,
  Plus,
  Pencil,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import {
  Badge,
  Button,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui";

/* ---------- Types ---------- */
interface RateCard {
  id: string;
  skill: string;
  level: "Junior" | "Mid" | "Senior";
  hourlyRate: number;
  dailyRate: number;
  currency: string;
  status: "active" | "draft";
  icon: React.ElementType;
  gradient: string;
  shadow: string;
}

/* ---------- Mock data ---------- */
const initialRateCards: RateCard[] = [
  { id: "rc-1", skill: "Frontend Development", level: "Junior", hourlyRate: 25, dailyRate: 200, currency: "USD", status: "active", icon: Code2, gradient: "from-teal-500 to-teal-600", shadow: "shadow-teal-500/20" },
  { id: "rc-2", skill: "Frontend Development", level: "Mid", hourlyRate: 50, dailyRate: 400, currency: "USD", status: "active", icon: Code2, gradient: "from-teal-400 to-forest-500", shadow: "shadow-teal-400/20" },
  { id: "rc-3", skill: "Frontend Development", level: "Senior", hourlyRate: 85, dailyRate: 680, currency: "USD", status: "active", icon: Code2, gradient: "from-forest-500 to-forest-600", shadow: "shadow-forest-500/20" },
  { id: "rc-4", skill: "Backend Development", level: "Junior", hourlyRate: 30, dailyRate: 240, currency: "USD", status: "active", icon: Server, gradient: "from-brown-400 to-brown-600", shadow: "shadow-brown-400/20" },
  { id: "rc-5", skill: "Backend Development", level: "Mid", hourlyRate: 55, dailyRate: 440, currency: "USD", status: "active", icon: Server, gradient: "from-brown-500 to-brown-600", shadow: "shadow-brown-500/20" },
  { id: "rc-6", skill: "Backend Development", level: "Senior", hourlyRate: 95, dailyRate: 760, currency: "USD", status: "active", icon: Server, gradient: "from-brown-600 to-brown-700", shadow: "shadow-brown-600/20" },
  { id: "rc-7", skill: "UI/UX Design", level: "Junior", hourlyRate: 28, dailyRate: 224, currency: "USD", status: "active", icon: Palette, gradient: "from-gold-400 to-gold-500", shadow: "shadow-gold-400/20" },
  { id: "rc-8", skill: "UI/UX Design", level: "Mid", hourlyRate: 50, dailyRate: 400, currency: "USD", status: "active", icon: Palette, gradient: "from-gold-500 to-gold-600", shadow: "shadow-gold-500/20" },
  { id: "rc-9", skill: "UI/UX Design", level: "Senior", hourlyRate: 75, dailyRate: 600, currency: "USD", status: "active", icon: Palette, gradient: "from-gold-600 to-brown-500", shadow: "shadow-gold-600/20" },
  { id: "rc-10", skill: "QA Engineering", level: "Mid", hourlyRate: 40, dailyRate: 320, currency: "USD", status: "draft", icon: Bug, gradient: "from-teal-400 to-forest-500", shadow: "shadow-teal-400/20" },
];

/* ---------- Helpers ---------- */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const levelConfig = {
  Junior: { variant: "teal" as const, dot: true },
  Mid: { variant: "gold" as const, dot: true },
  Senior: { variant: "brown" as const, dot: true },
};

/* ---------- Rate Card Form Dialog ---------- */
function RateCardFormDialog({
  trigger,
  editCard,
  onSave,
}: {
  trigger: React.ReactNode;
  editCard?: RateCard;
  onSave: (data: Omit<RateCard, "id" | "icon" | "gradient" | "shadow">) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [skill, setSkill] = React.useState(editCard?.skill || "");
  const [level, setLevel] = React.useState<string>(editCard?.level || "Junior");
  const [hourlyRate, setHourlyRate] = React.useState(editCard?.hourlyRate?.toString() || "");
  const [dailyRate, setDailyRate] = React.useState(editCard?.dailyRate?.toString() || "");
  const [currency, setCurrency] = React.useState(editCard?.currency || "USD");

  React.useEffect(() => {
    if (editCard) {
      setSkill(editCard.skill);
      setLevel(editCard.level);
      setHourlyRate(editCard.hourlyRate.toString());
      setDailyRate(editCard.dailyRate.toString());
      setCurrency(editCard.currency);
    }
  }, [editCard]);

  const handleSubmit = () => {
    onSave({
      skill,
      level: level as RateCard["level"],
      hourlyRate: Number(hourlyRate),
      dailyRate: Number(dailyRate),
      currency,
      status: "active",
    });
    setOpen(false);
    if (!editCard) {
      setSkill("");
      setLevel("Junior");
      setHourlyRate("");
      setDailyRate("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-brown-900 font-heading">
            {editCard ? "Edit Rate Card" : "Add Rate Card"}
          </DialogTitle>
          <DialogDescription className="text-beige-500">
            {editCard ? "Update the rate card details below." : "Define a new pricing tier for a skill and level."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-[12px] text-brown-700">Skill</Label>
            <Input
              placeholder="e.g. Frontend Development"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-[12px] text-brown-700">Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Junior">Junior</SelectItem>
                  <SelectItem value="Mid">Mid</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[12px] text-brown-700">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="PKR">PKR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-[12px] text-brown-700">Hourly Rate</Label>
              <Input
                type="number"
                placeholder="0"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                icon={<DollarSign className="w-3.5 h-3.5" />}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[12px] text-brown-700">Daily Rate</Label>
              <Input
                type="number"
                placeholder="0"
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
                icon={<DollarSign className="w-3.5 h-3.5" />}
              />
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
            onClick={handleSubmit}
            disabled={!skill || !hourlyRate}
            className="px-4 py-2.5 rounded-xl bg-brown-600 hover:bg-brown-700 text-white text-[12px] font-semibold shadow-md hover:shadow-lg hover:shadow-brown-500/25 transition-all disabled:opacity-50"
          >
            {editCard ? "Save Changes" : "Add Rate Card"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Page ---------- */
export default function RateCardsPage() {
  const [rateCards, setRateCards] = React.useState(initialRateCards);

  const avgHourly = Math.round(
    rateCards.reduce((sum, r) => sum + r.hourlyRate, 0) / rateCards.length
  );
  const activeCount = rateCards.filter((r) => r.status === "active").length;

  const handleAddCard = (data: Omit<RateCard, "id" | "icon" | "gradient" | "shadow">) => {
    const newCard: RateCard = {
      ...data,
      id: `rc-${Date.now()}`,
      icon: Code2,
      gradient: "from-teal-500 to-teal-600",
      shadow: "shadow-teal-500/20",
    };
    setRateCards((prev) => [...prev, newCard]);
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1200px] mx-auto space-y-6"
    >
      {/* Page Header */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brown-500 to-gold-500 flex items-center justify-center shadow-md shadow-brown-500/20">
            <BadgeDollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brown-900 tracking-tight font-heading">
              Rate Cards
            </h1>
            <p className="text-sm text-beige-600 mt-0.5">
              Manage pricing tiers for different skill levels and contributor roles.
            </p>
          </div>
        </div>

        <RateCardFormDialog
          trigger={
            <button className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brown-600 hover:bg-brown-700 text-white text-[12px] font-semibold shadow-md hover:shadow-lg hover:shadow-brown-500/25 transition-all hover:-translate-y-0.5">
              <Plus className="w-3.5 h-3.5" />
              Add Rate Card
            </button>
          }
          onSave={handleAddCard}
        />
      </motion.div>

      {/* Summary Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4 hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <span className="text-[11px] font-semibold text-beige-500 uppercase tracking-wider">
              Active Rate Cards
            </span>
          </div>
          <p className="text-2xl font-bold text-brown-900 tracking-tight">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4 hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-forest-50 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 text-forest-600" />
            </div>
            <span className="text-[11px] font-semibold text-beige-500 uppercase tracking-wider">
              Avg Hourly Rate
            </span>
          </div>
          <p className="text-2xl font-bold text-brown-900 tracking-tight">${avgHourly}</p>
        </div>
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4 hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-gold-50 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-gold-600" />
            </div>
            <span className="text-[11px] font-semibold text-beige-500 uppercase tracking-wider">
              Total Cards
            </span>
          </div>
          <p className="text-2xl font-bold text-brown-900 tracking-tight">{rateCards.length}</p>
        </div>
      </motion.div>

      {/* Rate Cards Table */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden"
      >
        {/* Column Headers */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-5 py-3 bg-beige-50/40 border-b border-beige-100 text-[10px] font-semibold text-beige-500 uppercase tracking-wider">
          <div className="col-span-3">Skill</div>
          <div className="col-span-2">Level</div>
          <div className="col-span-2 text-right">Hourly Rate</div>
          <div className="col-span-2 text-right">Daily Rate</div>
          <div className="col-span-1 text-center">Currency</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-1 text-center">Actions</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-beige-100/60">
          {rateCards.map((card) => {
            const Icon = card.icon;
            const lConfig = levelConfig[card.level];

            return (
              <motion.div
                key={card.id}
                variants={scaleIn}
                className="group"
              >
                {/* Desktop row */}
                <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center px-5 py-4 hover:bg-beige-50/40 transition-colors">
                  <div className="col-span-3 flex items-center gap-3">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-sm shrink-0",
                        card.gradient,
                        card.shadow
                      )}
                    >
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[13px] font-semibold text-brown-900">
                      {card.skill}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <Badge variant={lConfig.variant} size="sm" dot={lConfig.dot}>
                      {card.level}
                    </Badge>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-[14px] font-bold text-brown-900 tabular-nums">
                      {formatCurrency(card.hourlyRate)}
                    </span>
                    <span className="text-[10px] text-beige-500 ml-1">/hr</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-[14px] font-bold text-brown-900 tabular-nums">
                      {formatCurrency(card.dailyRate)}
                    </span>
                    <span className="text-[10px] text-beige-500 ml-1">/day</span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="text-[11px] font-medium text-beige-600">
                      {card.currency}
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Badge variant={card.status === "active" ? "forest" : "beige"} size="sm" dot>
                      {card.status === "active" ? "Active" : "Draft"}
                    </Badge>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <RateCardFormDialog
                      trigger={
                        <button className="p-2 rounded-lg text-beige-400 hover:text-brown-600 hover:bg-beige-50 transition-all opacity-0 group-hover:opacity-100">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      }
                      editCard={card}
                      onSave={(data) => {
                        setRateCards((prev) =>
                          prev.map((c) =>
                            c.id === card.id ? { ...c, ...data } : c
                          )
                        );
                      }}
                    />
                  </div>
                </div>

                {/* Mobile card */}
                <div className="lg:hidden p-4 hover:bg-beige-50/40 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-sm",
                          card.gradient,
                          card.shadow
                        )}
                      >
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-brown-900">{card.skill}</p>
                        <Badge variant={lConfig.variant} size="sm" dot={lConfig.dot}>
                          {card.level}
                        </Badge>
                      </div>
                    </div>
                    <RateCardFormDialog
                      trigger={
                        <button className="p-2 rounded-lg text-beige-400 hover:text-brown-600 hover:bg-beige-50 transition-all">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      }
                      editCard={card}
                      onSave={(data) => {
                        setRateCards((prev) =>
                          prev.map((c) =>
                            c.id === card.id ? { ...c, ...data } : c
                          )
                        );
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-beige-100/60">
                    <div>
                      <p className="text-[10px] text-beige-500 uppercase tracking-wider">Hourly</p>
                      <p className="text-[14px] font-bold text-brown-900">{formatCurrency(card.hourlyRate)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-beige-500 uppercase tracking-wider">Daily</p>
                      <p className="text-[14px] font-bold text-brown-900">{formatCurrency(card.dailyRate)}</p>
                    </div>
                    <Badge variant={card.status === "active" ? "forest" : "beige"} size="sm" dot>
                      {card.status === "active" ? "Active" : "Draft"}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
