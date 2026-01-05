"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Filter, X, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClienteCard } from "@/components/clientes/cliente-card";
import { ClienteForm } from "@/components/clientes/cliente-form";
import { ClienteImport } from "@/components/clientes/cliente-import";
import type { Cliente, ClienteFilters } from "@/types/cliente";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  createCliente,
  updateCliente,
  deleteCliente,
  type CreateClienteData,
  type UpdateClienteData,
} from "@/lib/api";

const ITEMS_PER_PAGE = 6;

interface ClientesListProps {
  initialClientes: Cliente[];
}

export function ClientesList({ initialClientes }: ClientesListProps) {
  const [clientes, setClientes] = useState<Cliente[]>(initialClientes);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<ClienteFilters>({
    search: "",
    hasEmail: null,
    hasTelefone: null,
    hasUltimaVisita: null,
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredClientes = useMemo(() => {
    return clientes.filter((cliente) => {
      // Filtro de busca por texto
      const matchesSearch =
        searchTerm === "" ||
        cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.telefone?.includes(searchTerm);

      // Filtro de email
      const matchesEmail =
        filters.hasEmail === null ||
        (filters.hasEmail && cliente.email) ||
        (!filters.hasEmail && !cliente.email);

      // Filtro de telefone
      const matchesTelefone =
        filters.hasTelefone === null ||
        (filters.hasTelefone && cliente.telefone) ||
        (!filters.hasTelefone && !cliente.telefone);

      // Filtro de última visita
      const matchesUltimaVisita =
        filters.hasUltimaVisita === null ||
        (filters.hasUltimaVisita && cliente.ultimaVisita) ||
        (!filters.hasUltimaVisita && !cliente.ultimaVisita);

      return (
        matchesSearch &&
        matchesEmail &&
        matchesTelefone &&
        matchesUltimaVisita
      );
    });
  }, [clientes, searchTerm, filters]);

  // Paginação
  const totalPages = Math.ceil(filteredClientes.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentClientes = filteredClientes.slice(startIndex, endIndex);

  // Reset para primeira página quando filtros mudarem
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (
    key: keyof ClienteFilters,
    value: boolean | null
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      hasEmail: null,
      hasTelefone: null,
      hasUltimaVisita: null,
    });
    setCurrentPage(1);
  };

  const hasActiveFilters =
    filters.hasEmail !== null ||
    filters.hasTelefone !== null ||
    filters.hasUltimaVisita !== null;

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      await deleteCliente(id);
      setClientes((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Erro ao deletar cliente:", error);
      alert("Erro ao deletar cliente. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    const cliente = clientes.find((c) => c.id === id);
    if (cliente) {
      setSelectedCliente(cliente);
      setIsEditDialogOpen(true);
    }
  };

  const handleCreate = async (values: CreateClienteData) => {
    try {
      setIsLoading(true);
      const newCliente = await createCliente(values);
      setClientes((prev) => [newCliente, ...prev]);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
      alert("Erro ao criar cliente. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (values: UpdateClienteData) => {
    if (!selectedCliente) return;

    try {
      setIsLoading(true);
      const updatedCliente = await updateCliente(selectedCliente.id, values);
      setClientes((prev) =>
        prev.map((c) => (c.id === selectedCliente.id ? updatedCliente : c))
      );
      setIsEditDialogOpen(false);
      setSelectedCliente(null);
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      alert("Erro ao atualizar cliente. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportSuccess = (importedClientes: Cliente[]) => {
    setClientes((prev) => [...importedClientes, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Barra de ações */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar clientes por nome, endereço, email ou telefone..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="mr-2 h-4 w-4" />
                Filtros
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs text-white flex items-center justify-center">
                    {[
                      filters.hasEmail,
                      filters.hasTelefone,
                      filters.hasUltimaVisita,
                    ].filter((f) => f !== null).length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
                <SheetDescription>
                  Refine sua busca com filtros avançados
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6 px-8">
                {/* Filtro Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <div className="flex gap-2">
                    <Button
                      variant={
                        filters.hasEmail === true ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handleFilterChange("hasEmail", true)}
                      className="flex-1"
                    >
                      Com email
                    </Button>
                    <Button
                      variant={
                        filters.hasEmail === false ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handleFilterChange("hasEmail", false)}
                      className="flex-1"
                    >
                      Sem email
                    </Button>
                  </div>
                  {filters.hasEmail !== null && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFilterChange("hasEmail", null)}
                      className="w-full"
                    >
                      Limpar
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Filtro Telefone */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefone</label>
                  <div className="flex gap-2">
                    <Button
                      variant={
                        filters.hasTelefone === true ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handleFilterChange("hasTelefone", true)}
                      className="flex-1"
                    >
                      Com telefone
                    </Button>
                    <Button
                      variant={
                        filters.hasTelefone === false ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handleFilterChange("hasTelefone", false)}
                      className="flex-1"
                    >
                      Sem telefone
                    </Button>
                  </div>
                  {filters.hasTelefone !== null && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFilterChange("hasTelefone", null)}
                      className="w-full"
                    >
                      Limpar
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Filtro Última Visita */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Última Visita</label>
                  <div className="flex gap-2">
                    <Button
                      variant={
                        filters.hasUltimaVisita === true ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        handleFilterChange("hasUltimaVisita", true)
                      }
                      className="flex-1"
                    >
                      Com visita
                    </Button>
                    <Button
                      variant={
                        filters.hasUltimaVisita === false
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        handleFilterChange("hasUltimaVisita", false)
                      }
                      className="flex-1"
                    >
                      Sem visita
                    </Button>
                  </div>
                  {filters.hasUltimaVisita !== null && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleFilterChange("hasUltimaVisita", null)
                      }
                      className="w-full"
                    >
                      Limpar
                    </Button>
                  )}
                </div>

                {hasActiveFilters && (
                  <>
                    <Separator />
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="w-full"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Limpar todos os filtros
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <Button
            variant="outline"
            onClick={() => setIsImportDialogOpen(true)}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Importar Excel
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Contador de resultados */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Mostrando {currentClientes.length} de {filteredClientes.length}{" "}
        cliente(s)
        {filteredClientes.length !== clientes.length && " (filtrados)"}
      </div>

      {/* Lista de clientes */}
      {currentClientes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Nenhum cliente encontrado
          </p>
          {searchTerm || hasActiveFilters ? (
            <Button
              variant="link"
              onClick={() => {
                setSearchTerm("");
                clearFilters();
              }}
              className="mt-2"
            >
              Limpar busca e filtros
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentClientes.map((cliente) => (
            <ClienteCard
              key={cliente.id}
              cliente={cliente}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="min-w-[40px]"
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
          >
            Próxima
          </Button>
        </div>
      )}

      {/* Modal de Criação */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo cliente. Campos marcados com * são
              obrigatórios.
            </DialogDescription>
          </DialogHeader>
          <ClienteForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateDialogOpen(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Atualize os dados do cliente. Campos marcados com * são
              obrigatórios.
            </DialogDescription>
          </DialogHeader>
          {selectedCliente && (
            <ClienteForm
              cliente={selectedCliente}
              onSubmit={handleUpdate}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedCliente(null);
              }}
              isLoading={isLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Importação */}
      <ClienteImport
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}

