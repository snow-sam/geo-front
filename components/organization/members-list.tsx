"use client";

import { useState } from "react";
import { MoreHorizontal, UserMinus, Shield, Loader2 } from "lucide-react";
import { organizationClient } from "@/lib/organization-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RoleManager } from "./role-manager";
import type { OrganizationMember, OrganizationRole } from "@/types/organization";

interface MembersListProps {
  members: OrganizationMember[];
  currentUserId: string;
  currentUserRole: OrganizationRole;
  onUpdate: () => void;
}

const roleLabelMap: Record<OrganizationRole, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  member: "Membro",
};

const roleColorMap: Record<OrganizationRole, string> = {
  owner: "bg-amber-500",
  admin: "bg-blue-500",
  member: "bg-gray-500",
};

export function MembersList({
  members,
  currentUserId,
  currentUserRole,
  onUpdate,
}: MembersListProps) {
  const [memberToRemove, setMemberToRemove] = useState<OrganizationMember | null>(null);
  const [memberToEditRole, setMemberToEditRole] = useState<OrganizationMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const canManageMembers = currentUserRole === "owner" || currentUserRole === "admin";
  const canManageRoles = currentUserRole === "owner";

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    setIsRemoving(true);
    try {
      await organizationClient.removeMember({
        memberIdOrEmail: memberToRemove.userId,
      });
      onUpdate();
    } catch (error) {
      console.error("Erro ao remover membro:", error);
    } finally {
      setIsRemoving(false);
      setMemberToRemove(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Membros</CardTitle>
          <CardDescription>
            {members.length} membro{members.length !== 1 ? "s" : ""} na organização
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membro</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Desde</TableHead>
                {canManageMembers && <TableHead className="w-[70px]">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const isCurrentUser = member.userId === currentUserId;
                const isOwner = member.role === "owner";

                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={member.user.image || undefined} />
                          <AvatarFallback>
                            {getInitials(member.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {member.user.name}
                            {isCurrentUser && (
                              <span className="text-muted-foreground ml-1">(você)</span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${roleColorMap[member.role]} text-white`}>
                        {roleLabelMap[member.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(member.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                    {canManageMembers && (
                      <TableCell>
                        {!isCurrentUser && !isOwner && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {canManageRoles && (
                                <DropdownMenuItem
                                  onClick={() => setMemberToEditRole(member)}
                                >
                                  <Shield className="mr-2 h-4 w-4" />
                                  Alterar Role
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => setMemberToRemove(member)}
                                className="text-destructive focus:text-destructive"
                              >
                                <UserMinus className="mr-2 h-4 w-4" />
                                Remover
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de confirmação de remoção */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover{" "}
              <strong>{memberToRemove?.user.name}</strong> da organização? Esta
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={isRemoving}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isRemoving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removendo...
                </>
              ) : (
                "Remover"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de alteração de role */}
      {memberToEditRole && (
        <RoleManager
          member={memberToEditRole}
          open={!!memberToEditRole}
          onClose={() => setMemberToEditRole(null)}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
}

