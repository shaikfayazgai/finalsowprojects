"use client";

import { useState } from "react";
import {
  Settings2,
  Bell,
  Calendar,
  Save,
  X,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  Badge,
  Button,
} from "@/components/ui";
import { toast } from "@/lib/stores/toast-store";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const ALL_EXPERTISE = [
  "React",
  "TypeScript",
  "Node.js",
  "Python",
  "Java",
  "AWS",
  "Docker",
  "SQL",
  "UI/UX",
  "DevOps",
  "Spring Boot",
  "Go",
  "Kubernetes",
  "GraphQL",
  "Testing",
];

const REVIEW_TYPES = [
  "Code Review",
  "Documentation",
  "Architecture",
  "Testing",
  "Security",
  "Performance",
];

export default function MentorSettingsPage() {
  // Review Preferences
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([
    "React",
    "TypeScript",
    "Node.js",
    "AWS",
  ]);
  const [maxConcurrentReviews, setMaxConcurrentReviews] = useState(5);
  const [selectedReviewTypes, setSelectedReviewTypes] = useState<string[]>([
    "Code Review",
    "Architecture",
    "Testing",
  ]);

  // Notifications
  const [notifications, setNotifications] = useState({
    newAssignment: true,
    slaWarning: true,
    escalation: true,
  });

  // Availability
  const [availability, setAvailability] = useState<Record<string, boolean>>({
    Mon: true,
    Tue: true,
    Wed: true,
    Thu: true,
    Fri: true,
    Sat: false,
    Sun: false,
  });

  const [saving, setSaving] = useState(false);

  function toggleExpertise(skill: string) {
    setSelectedExpertise((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  function toggleReviewType(type: string) {
    setSelectedReviewTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  function toggleNotification(key: keyof typeof notifications) {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleDay(day: string) {
    setAvailability((prev) => ({ ...prev, [day]: !prev[day] }));
  }

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success(
        "Settings Saved",
        "Your reviewer preferences have been updated successfully."
      );
    }, 1000);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-semibold text-brown-950">
          Settings
        </h1>
        <p className="text-sm text-beige-600 mt-1">
          Manage your reviewer preferences, notifications, and availability.
        </p>
      </div>

      {/* Review Preferences */}
      <GlassCard hover="none">
        <GlassCardHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-beige-500" />
            <GlassCardTitle>Review Preferences</GlassCardTitle>
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="space-y-6">
            {/* Expertise Areas */}
            <div>
              <label className="block text-sm font-medium text-brown-900 mb-2">
                Expertise Areas
              </label>
              <p className="text-xs text-beige-600 mb-3">
                Select the skill areas you can review. Assignments will be
                matched to your expertise.
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_EXPERTISE.map((skill) => {
                  const isSelected = selectedExpertise.includes(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleExpertise(skill)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-forest-100 text-forest-700 border border-forest-300"
                          : "bg-beige-50 text-beige-600 border border-beige-200 hover:border-beige-300"
                      }`}
                    >
                      {isSelected ? (
                        <X className="w-3 h-3" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Max Concurrent Reviews */}
            <div>
              <label
                htmlFor="maxReviews"
                className="block text-sm font-medium text-brown-900 mb-2"
              >
                Max Concurrent Reviews
              </label>
              <p className="text-xs text-beige-600 mb-3">
                The maximum number of reviews you can handle at the same time.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setMaxConcurrentReviews(Math.max(1, maxConcurrentReviews - 1))
                  }
                  className="w-8 h-8 rounded-lg border border-beige-200 flex items-center justify-center text-brown-800 hover:bg-beige-50 transition-colors text-sm font-medium"
                >
                  -
                </button>
                <input
                  id="maxReviews"
                  type="number"
                  min={1}
                  max={20}
                  value={maxConcurrentReviews}
                  onChange={(e) =>
                    setMaxConcurrentReviews(
                      Math.max(1, Math.min(20, Number(e.target.value) || 1))
                    )
                  }
                  className="w-16 h-8 rounded-lg border border-beige-200 text-center text-sm font-semibold text-brown-900 focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400 bg-white"
                />
                <button
                  onClick={() =>
                    setMaxConcurrentReviews(
                      Math.min(20, maxConcurrentReviews + 1)
                    )
                  }
                  className="w-8 h-8 rounded-lg border border-beige-200 flex items-center justify-center text-brown-800 hover:bg-beige-50 transition-colors text-sm font-medium"
                >
                  +
                </button>
                <span className="text-xs text-beige-600">
                  (1 - 20 reviews)
                </span>
              </div>
            </div>

            {/* Preferred Review Types */}
            <div>
              <label className="block text-sm font-medium text-brown-900 mb-2">
                Preferred Review Types
              </label>
              <p className="text-xs text-beige-600 mb-3">
                Choose the types of reviews you prefer to handle.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {REVIEW_TYPES.map((type) => {
                  const isSelected = selectedReviewTypes.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => toggleReviewType(type)}
                      className={`p-3 rounded-xl text-sm font-medium transition-all text-left ${
                        isSelected
                          ? "bg-forest-50 border border-forest-300 text-forest-700"
                          : "bg-beige-50/50 border border-beige-100 text-beige-600 hover:border-beige-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-forest-500 border-forest-500"
                              : "border-beige-300"
                          }`}
                        >
                          {isSelected && (
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          )}
                        </div>
                        {type}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Notifications */}
      <GlassCard hover="none">
        <GlassCardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-beige-500" />
            <GlassCardTitle>Notifications</GlassCardTitle>
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="space-y-1">
            {[
              {
                key: "newAssignment" as const,
                label: "New Assignment",
                description:
                  "Receive a notification when a new review is assigned to you.",
                icon: CheckCircle2,
              },
              {
                key: "slaWarning" as const,
                label: "SLA Warning",
                description:
                  "Get alerted when a review is approaching its SLA deadline.",
                icon: AlertTriangle,
              },
              {
                key: "escalation" as const,
                label: "Escalation Alerts",
                description:
                  "Notify when a review is escalated due to missed SLA or contributor dispute.",
                icon: ShieldAlert,
              },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-4 rounded-xl hover:bg-beige-50/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <item.icon className="w-4 h-4 text-beige-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-brown-900">
                      {item.label}
                    </p>
                    <p className="text-xs text-beige-600 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleNotification(item.key)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    notifications[item.key]
                      ? "bg-forest-500"
                      : "bg-beige-200"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      notifications[item.key]
                        ? "translate-x-[22px]"
                        : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Availability */}
      <GlassCard hover="none">
        <GlassCardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-beige-500" />
            <GlassCardTitle>Availability</GlassCardTitle>
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          <p className="text-xs text-beige-600 mb-4">
            Set your weekly availability. You will only receive review
            assignments on available days.
          </p>
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map((day) => {
              const isAvailable = availability[day];
              return (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                    isAvailable
                      ? "bg-forest-50 border border-forest-300 text-forest-700"
                      : "bg-beige-50/50 border border-beige-100 text-beige-400"
                  }`}
                >
                  <span className="text-xs font-semibold">{day}</span>
                  <div
                    className={`w-3 h-3 rounded-full transition-colors ${
                      isAvailable ? "bg-forest-500" : "bg-beige-200"
                    }`}
                  />
                  <span className="text-[10px]">
                    {isAvailable ? "Available" : "Off"}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-beige-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-forest-500" />
              Available ({Object.values(availability).filter(Boolean).length}{" "}
              days)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-beige-200" />
              Off ({Object.values(availability).filter((v) => !v).length} days)
            </span>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          size="lg"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            "Saving..."
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
