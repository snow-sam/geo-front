"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { OrganizationMember, OrganizationRole } from "@/types/organization";

interface RoleManagerProps {
  member: OrganizationMember;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const roleOptions: { value: OrganizationRole; label: string; description: string }[] = [
  {
    value: "admin",
    label: "Administrador",
    description: "Pode gerenciar membros e conteúdo",
  },
  {
    value: "member",
    label: "Membro",
    description: "Acesso básico à organização",
  },
];

export function RoleManager({ member, open, onClose, onUpdate }: RoleManagerProps) {
  const [selectedRole, setSelectedRole] = useState<OrganizationRole>(member.role);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (selectedRole === member.role) {
      onClose();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authClient.organization.updateMemberRole({
        memberIdOrEmail: member.userId,
        role: selectedRole,
      });
      onUpdate();
      onClose();
    } catch (err) {
      console.error("Erro ao alterar role:", err);
      setError("Erro ao alterar role do membro");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar Role</DialogTitle>
          <DialogDescription>
            Alterar a role de <strong>{member.user.name}</strong> na organização.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as OrganizationRole)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

