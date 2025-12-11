"use client";

import { useState } from "react";
import { Property } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Image as ImageIcon, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PropertyFormProps {
    initialData?: Property;
    onSubmit: (data: Partial<Property>) => Promise<void>;
    onCancel?: () => void;
}

export function PropertyForm({ initialData, onSubmit, onCancel }: PropertyFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [images, setImages] = useState<string[]>(initialData?.images || []);
    const [currentImageUrl, setCurrentImageUrl] = useState("");

    // Default values for other fields handled by native form inputs, 
    // but typically controlled state is better for complex validation. 
    // We'll use native FormData for simplicity where possible, but images need state.

    const handleAddImage = () => {
        if (!currentImageUrl) return;
        if (images.length >= 15) {
            alert("Maximum 15 images allowed.");
            return;
        }
        setImages([...images, currentImageUrl]);
        setImageUrl("");
    };

    const handleRemoveImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    // Helper wrapper for native input setImageUrl
    const setImageUrl = (url: string) => setCurrentImageUrl(url);


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const amenitiesString = formData.get('amenities') as string;
        const amenities = amenitiesString.split(',').map(s => s.trim()).filter(s => s.length > 0);

        const data: Partial<Property> = {
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            location: formData.get('location') as string,
            price: Number(formData.get('price')),
            maxGuests: Number(formData.get('maxGuests')),
            images: images,
            amenities: amenities,
        };

        if (initialData) {
            data.id = initialData.id;
            data.rating = initialData.rating; // Preserve rating
        }

        try {
            await onSubmit(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Title</Label>
                    <Input name="title" defaultValue={initialData?.title} required placeholder="e.g. Seaside Villa" />
                </div>
                <div className="space-y-2">
                    <Label>Location</Label>
                    <Input name="location" defaultValue={initialData?.location} required placeholder="e.g. Goa, India" />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Description</Label>
                <Textarea name="description" defaultValue={initialData?.description} required rows={4} placeholder="Describe the property..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Price (₹ per night)</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                        <Input name="price" type="number" defaultValue={initialData?.price} required className="pl-7" placeholder="4500" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Max Guests</Label>
                    <Input name="maxGuests" type="number" defaultValue={initialData?.maxGuests} required placeholder="4" />
                </div>
            </div>

            {/* Image Manager */}
            <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                <div className="flex justify-between items-center">
                    <Label>Gallery Images ({images.length}/15)</Label>
                    <div className="flex gap-2">
                        <Button type="button" variant="secondary" onClick={() => document.getElementById('image-upload')?.click()}>
                            <Plus className="w-4 h-4 mr-2" /> Upload Image
                        </Button>
                        <input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                if (images.length >= 15) {
                                    alert("Maximum 15 images allowed.");
                                    return;
                                }

                                const formData = new FormData();
                                formData.append('file', file);

                                try {
                                    const res = await fetch('/api/upload', {
                                        method: 'POST',
                                        body: formData
                                    });
                                    if (res.ok) {
                                        const { url } = await res.json();
                                        setImages([...images, url]);
                                    } else {
                                        alert("Upload failed.");
                                    }
                                } catch (err) {
                                    alert("Upload error.");
                                }
                                // Reset input
                                e.target.value = '';
                            }}
                        />
                    </div>
                </div>

                {/* Fallback URL Input */}
                <div className="flex gap-2">
                    <Input
                        value={currentImageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="Or paste image URL"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddImage();
                            }
                        }}
                    />
                    <Button type="button" onClick={handleAddImage} variant="outline" size="icon">
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>

                {images.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {images.map((img, i) => (
                            <div key={i} className="group relative aspect-square rounded-md overflow-hidden border bg-background hover:shadow-md transition-all">
                                <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover" />

                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(i)}
                                            className="bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                                            title="Remove Image"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>

                                    {i !== 0 && (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            className="w-full text-xs h-7"
                                            onClick={() => {
                                                const newImages = [...images];
                                                const [selected] = newImages.splice(i, 1);
                                                newImages.unshift(selected);
                                                setImages(newImages);
                                            }}
                                        >
                                            Set Cover
                                        </Button>
                                    )}
                                </div>

                                {i === 0 && (
                                    <Badge className="absolute bottom-2 left-2 bg-green-500 hover:bg-green-600 pointer-events-none">Cover Image</Badge>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground dashed border-2 border-dashed rounded-lg bg-background/50">
                        <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm">No images added</p>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <Label>Amenities (Comma separated)</Label>
                <Input name="amenities" defaultValue={initialData?.amenities.join(", ")} placeholder="Wifi, Pool, Kitchen, Parking" />
            </div>

            <div className="flex justify-end gap-3 pt-4">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {initialData ? "Save Changes" : "Create Property"}
                </Button>
            </div>
        </form>
    );
}
