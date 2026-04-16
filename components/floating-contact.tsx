"use client";

import { Phone } from "lucide-react";
import { siteConfig, buildWhatsAppUrl } from "@/lib/site-config";

export function FloatingContact() {
    const whatsappUrl = buildWhatsAppUrl();
    const telUrl = `tel:${siteConfig.contact.phoneE164}`;

    return (
        <div className="fixed right-4 bottom-4 md:right-6 md:bottom-6 z-40 flex flex-col gap-3 print:hidden">
            {/* WhatsApp */}
            <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with us on WhatsApp"
                className="group relative flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-transform hover:scale-110 active:scale-95"
            >
                <svg
                    viewBox="0 0 32 32"
                    className="h-6 w-6 md:h-7 md:w-7 fill-white"
                    aria-hidden="true"
                >
                    <path d="M16.004 0C7.164 0 0 7.164 0 16.004c0 2.822.74 5.58 2.15 8.004L0 32l8.196-2.116a15.94 15.94 0 0 0 7.808 2.022h.004C24.84 31.906 32 24.746 32 15.906S24.84 0 16.004 0Zm0 29.187h-.004a13.2 13.2 0 0 1-6.724-1.842l-.48-.286-4.866 1.258 1.294-4.72-.312-.484a13.188 13.188 0 0 1-2.024-7.11c.002-7.285 5.934-13.212 13.22-13.212 3.534 0 6.856 1.376 9.356 3.88a13.14 13.14 0 0 1 3.876 9.344c-.002 7.286-5.93 13.218-13.216 13.218Zm7.25-9.896c-.396-.2-2.346-1.158-2.712-1.29-.364-.134-.628-.2-.892.2-.264.394-1.024 1.29-1.254 1.554-.23.264-.46.296-.856.098-.394-.198-1.674-.618-3.188-1.968-1.18-1.052-1.974-2.352-2.204-2.748-.23-.394-.024-.608.174-.806.178-.176.394-.46.592-.69.198-.23.264-.396.396-.66.132-.266.066-.496-.034-.694-.098-.198-.892-2.148-1.222-2.942-.322-.772-.65-.668-.892-.68-.23-.012-.494-.014-.758-.014a1.45 1.45 0 0 0-1.054.494c-.364.396-1.388 1.354-1.388 3.304 0 1.95 1.42 3.832 1.616 4.096.198.264 2.794 4.27 6.772 5.986a22.96 22.96 0 0 0 2.26.838c.95.302 1.814.26 2.498.158.762-.114 2.346-.96 2.676-1.886.33-.926.33-1.718.232-1.884-.098-.166-.362-.264-.758-.462Z" />
                </svg>
                <span className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 whitespace-nowrap rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background opacity-0 shadow-md transition-opacity group-hover:opacity-100 hidden md:block">
                    WhatsApp
                </span>
            </a>

            {/* Call */}
            <a
                href={telUrl}
                aria-label={`Call ${siteConfig.contact.phoneDisplay}`}
                className="group relative flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-95"
            >
                <Phone className="h-5 w-5 md:h-6 md:w-6 fill-current" />
                <span className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 whitespace-nowrap rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background opacity-0 shadow-md transition-opacity group-hover:opacity-100 hidden md:block">
                    {siteConfig.contact.phoneDisplay}
                </span>
            </a>
        </div>
    );
}
