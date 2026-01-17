"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useEffect, useMemo, useState } from "react";
import { PROVIDERS } from "@/lib/providers";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  const [enabledProviders, setEnabledProviders] = useState<string[] | null>(null);
  const [adultEnabled, setAdultEnabled] = useState<boolean>(false);
  const [loadingSettings, setLoadingSettings] = useState<boolean>(false);
  const [showAdultConfirm, setShowAdultConfirm] = useState<boolean>(false);

  useEffect(() => {
    async function loadSettings() {
      setLoadingSettings(true);
      try {
        const res = await fetch("/api/settings/providers");
        const json = await res.json();
        if (json?.success) {
          const settings = json.settings;
          setEnabledProviders(settings.enabledProviders ?? PROVIDERS.map((p) => p.name));
          setAdultEnabled(Boolean(settings.adultEnabled));
        }
      } catch {
        // ignore
      } finally {
        setLoadingSettings(false);
      }
    }
    loadSettings();
  }, []);

  const providerNames = useMemo(() => PROVIDERS.map((p) => p.name), []);

  async function saveSettings(partial: { enabledProviders?: string[]; adultEnabled?: boolean; confirmAdult?: boolean }) {
    await fetch("/api/settings/providers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Providers & Content</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Available Providers</Label>
            <p className="text-sm text-muted-foreground">Enable or disable providers for your global search.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providerNames.map((name) => {
              const checked = enabledProviders?.includes(name) ?? false;
              return (
                <div key={name} className="flex items-center justify-between border rounded-md p-3">
                  <div className="space-y-0.5">
                    <Label>{name}</Label>
                    <p className="text-xs text-muted-foreground">{name} search endpoint</p>
                  </div>
                  <Switch
                    checked={checked}
                    disabled={loadingSettings || !enabledProviders}
                    onCheckedChange={(val) => {
                      const next = new Set(enabledProviders ?? providerNames);
                      if (val) next.add(name);
                      else next.delete(name);
                      const list = Array.from(next);
                      setEnabledProviders(list);
                      saveSettings({ enabledProviders: list });
                    }}
                  />
                </div>
              );
            })}
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Adult Content</Label>
              <p className="text-sm text-muted-foreground">Access routes under adult providers (18+ confirmation required).</p>
            </div>
            <Switch
              checked={adultEnabled}
              onCheckedChange={(val) => {
                if (val && !adultEnabled) {
                  setShowAdultConfirm(true);
                } else {
                  setAdultEnabled(false);
                  saveSettings({ adultEnabled: false });
                }
              }}
            />
          </div>

          <AlertDialog open={showAdultConfirm} onOpenChange={setShowAdultConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you 18 or older?</AlertDialogTitle>
                <AlertDialogDescription>
                  Enabling adult content will allow access to 18+ providers. Please confirm you are of legal age.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowAdultConfirm(false)}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setShowAdultConfirm(false);
                    setAdultEnabled(true);
                    saveSettings({ adultEnabled: true, confirmAdult: true });
                  }}
                >
                  Yes, I am 18+
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Security</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type="password" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input id="confirm-password" type="password" />
          </div>

          <div className="flex justify-end">
            <Button variant="outline">Update Password</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
