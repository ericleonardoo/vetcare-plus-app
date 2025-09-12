'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { usePets } from '@/context/PetsContext';
import { useAppointments } from '@/context/AppointmentsContext';
import { useMemo } from 'react';
import { useTutor } from '@/context/TutorContext';

export default function DashboardPage() {
  const { pets } = usePets();
  const { appointments } = useAppointments();
  const { tutor } = useTutor();

  const upcomingAppointments = useMemo(() => 
    appointments
      .filter(apt => new Date(apt.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5), // Limita a 5 agendamentos
    [appointments]
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">
          Olá, {tutor.name}!
        </h1>
        <p className="text-muted-foreground">
          Bem-vindo ao seu portal. Aqui você gerencia a saúde e o bem-estar dos seus pets.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Próximas Consultas</CardTitle>
            <Button asChild size="sm">
              <Link href="/portal/agendamentos">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length > 0 ? (
              <ul className="space-y-4">
                  {upcomingAppointments.map(apt => {
                      const pet = pets.find(p => p.id === apt.petId);
                      return (
                          <li key={apt.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-accent">
                              <Avatar className="h-10 w-10">
                                  {pet && <AvatarImage src={pet.avatarUrl} />}
                                  <AvatarFallback>{apt.petName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className='flex-1'>
                                  <p className="font-semibold">{apt.petName} - {apt.service}</p>
                                  <p className="text-sm text-muted-foreground">
                                      {new Date(apt.date).toLocaleDateString('pt-BR', {weekday: 'long', day: '2-digit', month: 'long'})} às {new Date(apt.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
                                  </p>
                              </div>
                              <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                              </Button>
                          </li>
                      )
                  })}
              </ul>
            ) : (
               <div className="text-center text-muted-foreground p-8">
                  <p>Nenhuma consulta agendada.</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button size="lg" asChild><Link href="/portal/agendamentos/novo">Agendar Nova Consulta</Link></Button>
            <Button size="lg" variant="secondary" asChild><Link href="/portal/pets/novo">Adicionar Novo Pet</Link></Button>
            <Button size="lg" variant="outline" asChild><Link href="/portal/historico">Ver Histórico de Saúde</Link></Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meus Pets</CardTitle>
          <CardDescription>
            Gerencie as informações e o histórico de cada um dos seus pets.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pets.map((pet) => (
            <Card key={pet.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6 flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 mb-4">
                        <AvatarImage src={pet.avatarUrl} alt={pet.name} data-ai-hint={pet.avatarHint} />
                        <AvatarFallback>{pet.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h3 className="text-xl font-bold font-headline">{pet.name}</h3>
                    <p className="text-sm text-muted-foreground">{pet.breed}</p>
                </div>
              </CardContent>
              <CardFooter className="p-0">
                <Button variant="ghost" className="w-full rounded-t-none" asChild><Link href={`/portal/pets/${pet.id}`}>Ver Detalhes</Link></Button>
              </CardFooter>
            </Card>
          ))}
           <Link href="/portal/pets/novo" className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                <PlusCircle className="h-10 w-10" />
                <span className="font-semibold">Adicionar Novo Pet</span>
            </Link>
        </CardContent>
      </Card>
    </div>
  );
}
