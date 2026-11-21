'use client';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getAgents, type Agent } from '@/services/chatService';
import { adminService, type AgentInput } from '@/services/adminService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Loader2, Pencil, Plus, Save, Trash2, X } from 'lucide-react';

const EMPTY: AgentInput = { name: '', system_prompt: '', description: '', color: '', icon: '' };

export function AgentManager() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<AgentInput>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setAgents(await getAgents());
    } catch (err) {
      console.error(err);
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startCreate = () => {
    setForm(EMPTY);
    setEditingId(null);
    setCreating(true);
  };

  const startEdit = (agent: Agent) => {
    setForm({
      name: agent.name,
      system_prompt: agent.system_prompt,
      description: agent.description ?? '',
      color: agent.color ?? '',
      icon: agent.icon ?? '',
    });
    setCreating(false);
    setEditingId(agent.id);
  };

  const cancel = () => {
    setCreating(false);
    setEditingId(null);
    setForm(EMPTY);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    if (form.system_prompt.trim().length < 5) {
      toast.error('System prompt must be at least 5 characters');
      return;
    }

    const payload: AgentInput = {
      name: form.name.trim(),
      system_prompt: form.system_prompt.trim(),
      description: form.description?.trim() || null,
      color: form.color?.trim() || null,
      icon: form.icon?.trim() || null,
    };

    setSaving(true);
    try {
      if (editingId) {
        await adminService.updateAgent(editingId, payload);
        toast.success('Agent updated');
      } else {
        await adminService.createAgent(payload);
        toast.success('Agent created');
      }
      cancel();
      await load();
    } catch (err) {
      console.error(err);
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (agent: Agent) => {
    if (!window.confirm(`Delete agent "${agent.name}"? This cannot be undone.`)) return;
    setDeletingId(agent.id);
    try {
      await adminService.deleteAgent(agent.id);
      toast.success('Agent deleted');
      await load();
    } catch (err) {
      console.error(err);
      toast.error('Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const showForm = creating || editingId !== null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" /> Agents
          </CardTitle>
          {!showForm && (
            <Button
              size="sm"
              onClick={startCreate}
              className="bg-[var(--ac-primary-blue)] hover:bg-[var(--ac-primary-hover)]"
            >
              <Plus className="mr-1 h-4 w-4" /> New Agent
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form onSubmit={handleSave} className="space-y-3 rounded-lg border border-border p-4">
            <div className="space-y-1">
              <Label htmlFor="agent-name">Name</Label>
              <Input
                id="agent-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Oracle"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="agent-desc">Description</Label>
              <Input
                id="agent-desc"
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Short description (optional)"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="agent-prompt">System prompt</Label>
              <textarea
                id="agent-prompt"
                value={form.system_prompt}
                onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
                rows={5}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ac-primary-blue)]"
                placeholder="You are a helpful assistant that..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="agent-color">Color</Label>
                <Input
                  id="agent-color"
                  value={form.color ?? ''}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  placeholder="#2563eb (optional)"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="agent-icon">Icon</Label>
                <Input
                  id="agent-icon"
                  value={form.icon ?? ''}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="icon name (optional)"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Button
                type="submit"
                disabled={saving}
                className="bg-[var(--ac-primary-blue)] hover:bg-[var(--ac-primary-hover)]"
              >
                {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                {editingId ? 'Update' : 'Create'}
              </Button>
              <Button type="button" variant="outline" onClick={cancel} disabled={saving}>
                <X className="mr-1 h-4 w-4" /> Cancel
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--ac-primary-blue)]" />
          </div>
        ) : agents.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No agents yet. Create your first one.
          </p>
        ) : (
          <ul className="space-y-2">
            {agents.map((agent) => (
              <li
                key={agent.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: agent.color || 'var(--ac-primary-blue)' }}
                    />
                    <p className="truncate font-medium">{agent.name}</p>
                  </div>
                  {agent.description && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{agent.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => startEdit(agent)} aria-label={`Edit ${agent.name}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(agent)}
                    disabled={deletingId === agent.id}
                    aria-label={`Delete ${agent.name}`}
                  >
                    {deletingId === agent.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-[var(--ac-error)]" />
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
