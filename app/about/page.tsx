import Image from "next/image";

export default function AboutPage() {
    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">Our Story</h1>

                <div className="prose prose-lg dark:prose-invert mx-auto">
                    <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                        At <span className="font-semibold text-foreground">Goodboy Holiday Homes</span>, we believe that the best holidays are found in the quiet corners of the hills.
                    </p>

                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-12 shadow-lg">
                        <Image
                            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80"
                            alt="Misty mountains"
                            fill
                            className="object-cover"
                        />
                    </div>

                    <h2 className="text-3xl font-semibold mb-4">Discover Your Private Sanctuary</h2>
                    <p className="mb-6">
                        It started with a simple trip to Munnar. We found a beautiful heritage bungalow, tucked away from the crowds, offering nothing but the sound of birds and the view of endless tea gardens. It felt like home, but better.
                    </p>
                    <p className="mb-6">
                        We realized that true luxury is <strong>privacy</strong> and <strong>nature</strong>. It's having a whole house to yourself, waking up to the mist, and enjoying a hot cup of tea on a balcony that overlooks the valley.
                    </p>

                    <h2 className="text-3xl font-semibold mb-4">More Than Just a Stay</h2>
                    <p className="mb-6">
                        Today, we curate a collection of the finest scenic homestays in Kerala and Tamil Nadu. From colonial cottages in Ooty to cloud-kissed villas in Wayanad.
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-8">
                        <li><strong>Complete Homes:</strong> Never just a room. You get the entire property.</li>
                        <li><strong>Verified Views:</strong> If we say "mountain view", we mean it.</li>
                        <li><strong>Local Experiences:</strong> Home-cooked meals and local guides.</li>
                    </ul>

                    <p className="text-muted-foreground italic">
                        "Goodboy" is our promise of a good, honest, and memorable stay. Come find your peace with us.
                    </p>
                </div>
            </div>
        </div>
    );
}
