import { Hero } from "@/components/hero";
import { PropertyCard } from "@/components/property-card";
import { FeaturesSection, TestimonialsSection, CTASection } from "@/components/home-sections";
import { getProperties } from "@/lib/data";
import { FadeIn } from "@/components/animations";

export default async function Home() {
  const properties = await getProperties();

  return (
    <div className="min-h-screen pb-20">
      <Hero />

      <FadeIn>
        <FeaturesSection />
      </FadeIn>

      <section className="container mx-auto px-4 py-16">
        <FadeIn>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Featured Properties</h2>
              <p className="text-muted-foreground">Hand-picked homes for your next adventure.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property, i) => (
              <FadeIn key={property.id} delay={i * 0.1}>
                <PropertyCard property={property} />
              </FadeIn>
            ))}
          </div>
        </FadeIn>
      </section>

      <FadeIn>
        <TestimonialsSection />
      </FadeIn>

      <FadeIn>
        <CTASection />
      </FadeIn>
    </div>
  );
}
