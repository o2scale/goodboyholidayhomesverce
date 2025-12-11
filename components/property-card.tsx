import Link from "next/link";
import Image from "next/image";
import { Star, MapPin } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Property } from "@/lib/data";

interface PropertyCardProps {
    property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
    return (
        <Link href={`/properties/${property.id}`} className="block h-full">
            <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer border-none bg-card/50">
                <div className="relative h-64 overflow-hidden">
                    <Image
                        src={property.images[0]}
                        alt={property.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                </div>
                <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="backdrop-blur-md bg-background/80">
                        <Star className="w-3 h-3 mr-1 fill-primary text-primary" />
                        {property.rating}
                    </Badge>
                </div>
                <CardContent className="p-4">
                    <div className="flex items-center text-muted-foreground text-sm mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        {property.location}
                    </div>
                    <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                        {property.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {property.description}
                    </p>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex items-center justify-between">
                    <div className="flex items-baseline gap-1">
                        <span className="text-md font-bold">${property.price}</span>
                        <span className="text-muted-foreground text-sm">/ night</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Max {property.maxGuests} Guests
                    </div>
                </CardFooter>
            </Card>
        </Link>
    );
}
