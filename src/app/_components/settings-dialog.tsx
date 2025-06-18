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
  const { openRouterApiKey, setOpenRouterApiKey, serperApiKey, setSerperApiKey } = useMainStore();
  const [apiKey, setApiKey] = useState(openRouterApiKey || "");
  const [serperKey, setSerperKey] = useState(serperApiKey || "");
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    setOpenRouterApiKey(apiKey);
    setSerperApiKey(serperKey);
    setOpen(false);
    toast.success("API keys saved successfully");
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
            Configure your API keys to use the chat and web search services.
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
          <div className="space-y-2">
            <label htmlFor="serper-api-key" className="text-sm font-medium">
              Serper API Key
            </label>
            <Input
              id="serper-api-key"
              type="password"
              value={serperKey}
              onChange={(e) => setSerperKey(e.target.value)}
              placeholder="Enter your Serper API key"
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