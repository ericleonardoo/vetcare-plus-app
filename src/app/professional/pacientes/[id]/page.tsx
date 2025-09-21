
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
    ArrowLeft, Cake, Bone, Cat, Dog, Heart, Stethoscope, Sparkles, BrainCircuit, Loader2, PlusCircle, Pencil, FilePlus, User
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useState, useTransition, useMemo } from 'react';
import { generateCarePlan } from '@/lib/actions';
import type { GenerateCarePlanOutput } from '@/ai/flows/generate-care-plan';
import { usePets } from '@/context/PetsContext';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useTutors } from '@/context/TutorsContext';
import { useInvoices } from '@/context/InvoicesContext';
import { Trash2 } from 'lucide-react';


const newHistoryEntrySchema = z.object({
  type: z.enum(['Consulta', 'Exame', 'Vacina', 'Emergência']),
  title: z.string().min(3, "O título é obrigatório."),
  vet: z.string().min(3, "O nome do veterinário é obrigatório."),
  details: z.string().min(10, "Os detalhes são obrigatórios."),
});
type NewHistoryEntryValues = z.infer<typeof newHistoryEntrySchema>;

const newInvoiceSchema = z.object({
    items: z.array(z.object({
        description: z.string().min(1, 'A descrição não pode estar vazia.'),
        quantity: z.coerce.number().min(1, 'A quantidade deve ser no mínimo 1.'),
        unitPrice: z.coerce.number().min(0, 'O preço deve ser positivo.'),
    })).min(1, 'A fatura deve ter pelo menos um item.')
});
type NewInvoiceValues = z.infer<typeof newInvoiceSchema>;


export default function ProfessionalPetRecordPage({ params }: { params: { id: string } }) {
  const [isAIPending, startAITransition] = useTransition();
  const [isHistoryPending, startHistoryTransition] = useTransition();
  const [isInvoicePending, startInvoiceTransition] = useTransition();

  const { toast } = useToast();
  const [carePlan, setCarePlan] = useState<GenerateCarePlanOutput | null>(null);
  const router = useRouter();
  const { pets, addHealthHistoryEntry, loading: petsLoading } = usePets();
  const { tutors, loading: tutorsLoading } = useTutors();
  const { addInvoice } = useInvoices();

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const pet = pets.find((p) => p.id === params.id);
  const tutor = useMemo(() => {
    if (!pet || tutorsLoading) return null;
    return tutors.find(t => t.id === pet.tutorId);
  }, [pet, tutors, tutorsLoading]);

  const historyForm = useForm<NewHistoryEntryValues>({
    resolver: zodResolver(newHistoryEntrySchema),
    defaultValues: {
      vet: 'Dra. Emily Carter', // Pre-fill with logged in vet
    }
  });

  const invoiceForm = useForm<NewInvoiceValues>({
      resolver: zodResolver(newInvoiceSchema),
      defaultValues: {
          items: [{ description: '', quantity: 1, unitPrice: 0 }],
      },
  });
  const { fields, append, remove } = useFieldArray({
      control: invoiceForm.control,
      name: "items",
  });
  const watchedItems = invoiceForm.watch("items");
  const totalAmount = useMemo(() => {
    return watchedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }, [watchedItems]);


  const handleGenerateCarePlan = () => {
    if (!pet) return;
    startAITransition(async () => {
        const result = await generateCarePlan({
            species: pet.species,
            breed: pet.breed,
            age: pet.age,
            healthHistory: `Este é um ${pet.species} da raça ${pet.breed} com ${pet.age}. O histórico recente inclui: ${pet.healthHistory.map(h => h.title).join(', ')}.`
        });

        if (result.success) {
            setCarePlan(result.data);
            toast({
              title: "Plano de Cuidados Gerado!",
              description: `Um novo plano de cuidados foi criado para ${pet.name}.`,
            });
        } else {
            toast({
              variant: 'destructive',
              title: "Erro ao gerar plano",
              description: result.error,
            });
        }
    });
  };

  const handleAddHistoryEntry = (data: NewHistoryEntryValues) => {
    if (!pet) return;
    startHistoryTransition(async () => {
      try {
        await addHealthHistoryEntry(pet.id, data);
        toast({
          title: "Registro Adicionado!",
          description: `Novo item de histórico de saúde adicionado para ${pet.name}.`
        });
        historyForm.reset({vet: 'Dra. Emily Carter'});
        setIsHistoryModalOpen(false);
      } catch (error) {
        console.error("Erro ao adicionar histórico: ", error);
        toast({ variant: 'destructive', title: "Erro", description: "Não foi possível adicionar o registro."});
      }
    });
  }

  const handleAddInvoice = (status: 'Pendente' | 'Pago') => {
      if (!pet || !tutor) return;
      const data = invoiceForm.getValues();

      startInvoiceTransition(async () => {
          try {
              await addInvoice({
                  clientId: tutor.id,
                  petId: pet.id,
                  petName: pet.name,
                  items: data.items,
                  status: status
              });
              toast({
                  title: `Fatura Gerada como ${status}!`,
                  description: `A fatura para ${pet.name} foi salva com sucesso.`
              });
              invoiceForm.reset({ items: [{ description: '', quantity: 1, unitPrice: 0 }] });
              setIsInvoiceModalOpen(false);
          } catch(error) {
              console.error("Erro ao gerar fatura:", error);
              toast({variant: 'destructive', title: 'Erro', description: 'Não foi possível gerar a fatura.'})
          }
      });
  }

  if (petsLoading || tutorsLoading) {
    return (
      <div className="text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Carregando dados do paciente...</p>
      </div>
    );
  }

  if (!pet) {
     return (
        <div className='text-center'>
            <p className='text-lg font-semibold'>Paciente não encontrado</p>
            <p className='text-muted-foreground'>Não foi possível encontrar os dados deste paciente.</p>
             <Button variant="outline" size="sm" asChild className='mt-4'>
                <Link href="/professional/pacientes">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Pacientes
                </Link>
            </Button>
        </div>
    )
  }
  
  const PetIcon = pet.species === 'Gato' ? Cat : Dog;

  return (
    <div className="flex flex-col gap-8">
       <div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/professional/pacientes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Pacientes
          </Link>
        </Button>
      </div>
        <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-1 flex flex-col gap-8">
                <Card>
                    <CardContent className="p-6 text-center flex flex-col items-center">
                        <Avatar className="h-32 w-32 mb-4">
                            <AvatarImage src={pet.avatarUrl} alt={pet.name} data-ai-hint={pet.avatarHint} />
                            <AvatarFallback>{pet.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h1 className="text-3xl font-bold font-headline">{pet.name}</h1>
                        <p className="text-muted-foreground">{pet.breed}</p>
                         <Button variant="outline" size="sm" className="mt-4 w-full">
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar Perfil do Paciente
                        </Button>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Informações do Paciente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="flex items-center gap-3">
                            <PetIcon className="h-5 w-5 text-muted-foreground" />
                            <span>Espécie: <span className="font-medium">{pet.species}</span></span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Bone className="h-5 w-5 text-muted-foreground" />
                            <span>Raça: <span className="font-medium">{pet.breed}</span></span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Cake className="h-5 w-5 text-muted-foreground" />
                            <span>Idade: <span className="font-medium">{pet.age}</span></span>
                        </div>
                         <div className="flex items-center gap-3">
                            <Heart className="h-5 w-5 text-muted-foreground" />
                            <span>Gênero: <span className="font-medium">{pet.gender}</span></span>
                        </div>
                        <div className="border-t pt-4 flex items-center gap-3">
                           <User className="h-5 w-5 text-muted-foreground" />
                           <span>Tutor(a): <span className="font-medium">{tutor?.name || 'Carregando...'}</span></span>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2 flex flex-col gap-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="font-headline">Histórico de Saúde / Prontuário</CardTitle>
                            <CardDescription>Visualize e adicione registros ao histórico do paciente.</CardDescription>
                        </div>
                        <div className='flex gap-2'>
                          <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
                              <DialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                      <FilePlus className="mr-2 h-4 w-4" />
                                      Gerar Fatura
                                  </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-2xl">
                                  <DialogHeader>
                                      <DialogTitle>Gerar Nova Fatura para {pet.name}</DialogTitle>
                                      <DialogDescription>
                                          Adicione os itens e serviços para criar a fatura.
                                      </DialogDescription>
                                  </DialogHeader>
                                  <Form {...invoiceForm}>
                                      <form className="space-y-4 py-4">
                                          <div className="space-y-2">
                                              {fields.map((field, index) => (
                                                  <div key={field.id} className="grid grid-cols-[1fr_80px_100px_auto] gap-2 items-center">
                                                      <FormField control={invoiceForm.control} name={`items.${index}.description`} render={({ field }) => (
                                                          <Input placeholder="Ex: Consulta, Vacina V10..." {...field} />
                                                      )} />
                                                      <FormField control={invoiceForm.control} name={`items.${index}.quantity`} render={({ field }) => (
                                                          <Input type="number" placeholder="Qtd" {...field} />
                                                      )} />
                                                      <FormField control={invoiceForm.control} name={`items.${index}.unitPrice`} render={({ field }) => (
                                                          <Input type="number" placeholder="Preço Un." {...field} />
                                                      )} />
                                                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                                          <Trash2 className="h-4 w-4 text-destructive" />
                                                      </Button>
                                                  </div>
                                              ))}
                                          </div>
                                          <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}>
                                              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item
                                          </Button>

                                           <div className="text-right font-bold text-lg">
                                              Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)}
                                          </div>

                                          <DialogFooter>
                                              <Button type="button" variant="secondary" onClick={() => handleAddInvoice('Pendente')} disabled={isInvoicePending || watchedItems.length === 0}>
                                                  {isInvoicePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                  Salvar como Pendente
                                              </Button>
                                              <Button type="button" onClick={() => handleAddInvoice('Pago')} disabled={isInvoicePending || watchedItems.length === 0}>
                                                  {isInvoicePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                  Registrar Pagamento
                                              </Button>
                                          </DialogFooter>
                                      </form>
                                  </Form>
                              </DialogContent>
                          </Dialog>
                          <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Novo Registro
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[480px]">
                                <DialogHeader>
                                <DialogTitle>Adicionar Novo Registro ao Prontuário</DialogTitle>
                                <DialogDescription>
                                    Preencha as informações da nova entrada no histórico de {pet.name}.
                                </DialogDescription>
                                </DialogHeader>
                                <Form {...historyForm}>
                                    <form onSubmit={historyForm.handleSubmit(handleAddHistoryEntry)} className="space-y-4 py-4">
                                        <FormField control={historyForm.control} name="type" render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Tipo de Registro</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isHistoryPending}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Consulta">Consulta</SelectItem>
                                                    <SelectItem value="Exame">Exame</SelectItem>
                                                    <SelectItem value="Vacina">Vacina</SelectItem>
                                                    <SelectItem value="Emergência">Emergência</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={historyForm.control} name="title" render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Título / Procedimento</FormLabel>
                                            <FormControl><Input placeholder="Ex: Vacina Antirrábica" {...field} disabled={isHistoryPending}/></FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={historyForm.control} name="vet" render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Veterinário Responsável</FormLabel>
                                            <FormControl><Input {...field} disabled={isHistoryPending}/></FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={historyForm.control} name="details" render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Detalhes e Observações</FormLabel>
                                            <FormControl><Textarea placeholder="Descreva o que foi feito, diagnosticado ou prescrito..." {...field} disabled={isHistoryPending}/></FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )} />
                                        <DialogFooter>
                                            <DialogClose asChild><Button type="button" variant="outline" disabled={isHistoryPending}>Cancelar</Button></DialogClose>
                                            <Button type="submit" disabled={isHistoryPending}>
                                                {isHistoryPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Salvar Registro
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                          </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {pet.healthHistory.length > 0 ? (
                          <ul className="space-y-4">
                              {pet.healthHistory.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item, index) => (
                                  <li key={index} className="flex items-start gap-4">
                                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-primary">
                                          <item.icon className="h-5 w-5" />
                                      </div>
                                      <div className="flex-1">
                                          <div className='flex justify-between items-start'>
                                            <div>
                                                <p className="font-medium">{item.title}</p>
                                                <p className="text-sm text-muted-foreground">{new Date(item.date + "T00:00:00").toLocaleDateString('pt-BR', {day: '2-digit', month: 'long', year: 'numeric'})} - {item.vet}</p>
                                            </div>
                                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-secondary text-secondary-foreground whitespace-nowrap">
                                                {item.type}
                                            </span>
                                          </div>
                                          <p className='text-sm mt-1'>{item.details}</p>
                                      </div>
                                  </li>
                              ))}
                          </ul>
                        ) : (
                           <div className="text-center text-muted-foreground p-4 border-2 border-dashed rounded-lg">
                              <p>Nenhum histórico encontrado para {pet.name}.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Plano de Cuidados Personalizado (IA)</CardTitle>
                        <CardDescription>
                            Gere recomendações de saúde e bem-estar para o {pet.name} com base em suas características e histórico.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {carePlan ? (
                            <div className="space-y-6">
                                <div className="p-4 bg-secondary rounded-lg">
                                    <h4 className="font-semibold flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary"/> {carePlan.nutrition.title}</h4>
                                    <p className="text-sm text-muted-foreground mt-1">{carePlan.nutrition.recommendation}</p>
                                </div>
                                <div className="p-4 bg-secondary rounded-lg">
                                    <h4 className="font-semibold flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary"/> {carePlan.exercise.title}</h4>
                                    <p className="text-sm text-muted-foreground mt-1">{carePlan.exercise.recommendation}</p>
                                </div>
                                <div className="p-4 bg-secondary rounded-lg">
                                    <h4 className="font-semibold flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary"/> {carePlan.preventiveHealth.title}</h4>
                                    <p className="text-sm text-muted-foreground mt-1">{carePlan.preventiveHealth.recommendation}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center p-6 border-2 border-dashed rounded-lg">
                                <BrainCircuit className="h-12 w-12 mx-auto text-muted-foreground" />
                                <p className="mt-4 text-muted-foreground">Ainda não há um plano de cuidados para {pet.name}.</p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="border-t pt-4 flex justify-center">
                         <Button onClick={handleGenerateCarePlan} disabled={isAIPending}>
                            {isAIPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {carePlan ? "Gerar Novo Plano" : "Gerar Plano de Cuidados com IA"}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    </div>
  );
}


    