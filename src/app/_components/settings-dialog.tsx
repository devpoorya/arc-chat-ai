"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SettingsIcon } from "lucide-react";
import { useMainStore } from "../store/mainStore";
import { useState } from "react";
import { toast } from "sonner";

export default function SettingsDialog() {
  const { openRouterApiKey, setOpenRouterApiKey } = useMainStore();
  const [apiKey, setApiKey] = useState(openRouterApiKey || "");
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    setOpenRouterApiKey(apiKey);
    setOpen(false);
    toast.success("API key saved successfully");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="ml-2">
          <SettingsIcon className="h-4 w-4" style={{ color: "black" }} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your OpenRouter API key to use the chat service.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="api-key" className="text-sm font-medium">
              OpenRouter API Key
            </label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your OpenRouter API key"
            />
          </div>
          <Button onClick={handleSave} className="w-full">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 