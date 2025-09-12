import Image from 'next/image';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';

export default function Hero() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-image');

  return (
    <section className="relative w-full h-[60vh] md:h-[80vh]">
        {heroImage && (
            <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                fill
                className="object-cover"
                data-ai-hint={heroImage.imageHint}
                priority
            />
        )}
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative container mx-auto h-full flex flex-col items-center justify-center text-center text-white space-y-6 px-4 md:px-6">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none font-headline">
          Cuidado Excepcional para o Seu Melhor Amigo
        </h1>
        <p className="max-w-[700px] text-lg md:text-xl">
          Na VetCare+, oferecemos serviços veterinários de ponta e com compaixão para garantir que seus familiares peludos vivam vidas longas, saudáveis e felizes.
        </p>
        <div>
          <Button asChild size="lg">
            <Link href="#agendamento">Agendar uma Consulta</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
