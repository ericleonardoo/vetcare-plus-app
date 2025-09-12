'use client';

import { usePets } from "@/context/PetsContext";
import { 
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription
} from "@/components/ui/card";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, PlusCircle, Users, Bone, Cat, Dog } from "lucide-react";
import Link from "next/link";
import { useTutor } from "@/context/TutorContext";


export default function ProfessionalPatientsPage() {
  const { pets } = usePets();
  const { tutor } = useTutor();

  const getPetIcon = (species: string) => {
    switch (species) {
        case 'Cachorro': return Dog;
        case 'Gato': return Cat;
        default: return Bone;
    }
  }

  return (
    <>
      <header className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                <Users className="w-8 h-8" />
                Gerenciamento de Pacientes
            </h1>
            <p className="text-muted-foreground">
                Busque, visualize e gerencie os prontuários de todos os pacientes.
            </p>
        </div>
        <Button asChild>
          <Link href="/portal/pets/novo">
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Novo Paciente
          </Link>
        </Button>
      </header>
       <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle>Todos os Pacientes</CardTitle>
            <CardDescription>
             Total de {pets.length} pacientes cadastrados na clínica.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Espécie</TableHead>
                <TableHead>Raça</TableHead>
                <TableHead>Tutor(a)</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pets.length > 0 ? (
                pets.map((pet) => {
                  const Icon = getPetIcon(pet.species);
                  return (
                    <TableRow key={pet.id}>
                       <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={pet.avatarUrl} alt={pet.name} />
                                <AvatarFallback>{pet.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="font-medium">{pet.name}</div>
                          </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            {pet.species}
                        </div>
                      </TableCell>
                       <TableCell>{pet.breed}</TableCell>
                       <TableCell>{tutor.name}</TableCell>
                      <TableCell className="text-right">
                         <Button asChild variant="outline" size="sm">
                            <Link href={`/portal/pets/${pet.id}`}>Ver Prontuário</Link>
                         </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    Nenhum paciente encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
