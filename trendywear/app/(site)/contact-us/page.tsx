"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiPhone, FiMail, FiX, FiChevronDown } from "react-icons/fi";
import Breadcrumb from "../components/Breadcrumb";
import { createClient } from "@/utils/supabase/client";

type CamanavaCity = "Caloocan" | "Malabon" | "Navotas" | "Valenzuela";

const CONTACT_INFO: Record<
    CamanavaCity,
    {
        phoneHours: string;
        phoneNumber: string;
        emailNote: string;
        email: string;
    }
> = {
    Caloocan: {
        phoneHours: "Monday to Sunday from 9:00 AM to 6:00 PM (PHT).",
        phoneNumber: "(+63) 9XX XXX XXXX",
        emailNote: "Your inquiry will receive a response from our Customer Care Team.",
        email: "support@trendywear.com",
    },
    Malabon: {
        phoneHours: "Monday to Sunday from 9:00 AM to 6:00 PM (PHT).",
        phoneNumber: "(+63) 9XX XXX XXXX",
        emailNote: "Your inquiry will receive a response from our Customer Care Team.",
        email: "support@trendywear.com",
    },
    Navotas: {
        phoneHours: "Monday to Sunday from 9:00 AM to 6:00 PM (PHT).",
        phoneNumber: "(+63) 9XX XXX XXXX",
        emailNote: "Your inquiry will receive a response from our Customer Care Team.",
        email: "support@trendywear.com",
    },
    Valenzuela: {
        phoneHours: "Monday to Sunday from 9:00 AM to 6:00 PM (PHT).",
        phoneNumber: "(+63) 9XX XXX XXXX",
        emailNote: "Your inquiry will receive a response from our Customer Care Team.",
        email: "support@trendywear.com",
    },
};

type EmailFormState = {
    title: "" | "Mr" | "Ms" | "Mrs";
    firstName: string;
    lastName: string;
    email: string;
    phonePrefix: "+63" | "+1" | "+65";
    phoneNumber: string;
    subject: "" | "Order Concern" | "Shipping" | "Product Inquiry" | "Feedback";
    message: string;
};

const MAX_MESSAGE = 1000;

export default function ContactUsPage() {
    const [city, setCity] = useState<CamanavaCity>("Caloocan");
    const info = useMemo(() => CONTACT_INFO[city], [city]);

    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState<EmailFormState>({
        title: "",
        firstName: "",
        lastName: "",
        email: "",
        phonePrefix: "+63",
        phoneNumber: "",
        subject: "",
        message: "",
    });

    const setField = <K extends keyof EmailFormState>(
        key: K,
        value: EmailFormState[K]
    ) => setForm((prev) => ({ ...prev, [key]: value }));

    const resetForm = () => {
        setForm({
            title: "",
            firstName: "",
            lastName: "",
            email: "",
            phonePrefix: "+63",
            phoneNumber: "",
            subject: "",
            message: "",
        });
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const supabase = createClient();
        const fullName = [form.title, form.firstName, form.lastName]
            .filter(Boolean)
            .join(" ")
            .trim();

        try {
            setIsSubmitting(true);

            const { error } = await supabase.from("contact_messages").insert({
                full_name: fullName,
                email: form.email,
                subject: form.subject,
                message: [
                    `City: ${city}`,
                    form.phoneNumber
                        ? `Phone: ${form.phonePrefix} ${form.phoneNumber}`
                        : null,
                    "",
                    form.message,
                ]
                    .filter(Boolean)
                    .join("\n"),
                status: "unread",
            });

            if (error) {
                console.error("Error sending message:", error);
                alert("Failed to send message. Please try again.");
                return;
            }

            alert("Your message has been sent successfully.");
            resetForm();
            setIsOpen(false);
        } catch (error) {
            console.error("Unexpected error:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <main className="max-w-[1000px] mx-auto px-6 md:px-10 py-12 md:py-20">
                <Breadcrumb
                    items={[
                        { label: "Home", href: "/" },
                        { label: "Contact Us" },
                    ]}
                />

                {/* Heading */}
                <section className="text-center mt-10">
                    <h1 className="uppercase tracking-[0.18em] text-[32px] md:text-[52px] font-light text-[#003049]">
                        HOW TO CONTACT{" "}
                        <span className="text-[#C1121F] font-normal">TRENDYWEAR</span>
                    </h1>

                    <p className="mt-4 text-[12px] md:text-[14px] uppercase tracking-[0.14em] text-[#003049]/70">
                        Select your CAMANAVA city to view contact details
                    </p>
                </section>

                {/* Dropdown */}
                <section className="mt-14 flex flex-col items-center">
                    <div className="w-full max-w-[600px] relative">
                        <select
                            value={city}
                            onChange={(e) => setCity(e.target.value as CamanavaCity)}
                            className="w-full appearance-none bg-white border border-gray-300 rounded-md px-5 py-4 text-[#003049] outline-none focus:border-[#003049] focus:ring-2 focus:ring-[#003049]/15"
                        >
                            <option value="Caloocan">Caloocan</option>
                            <option value="Malabon">Malabon</option>
                            <option value="Navotas">Navotas</option>
                            <option value="Valenzuela">Valenzuela</option>
                        </select>

                        <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[#003049]/70">
                            <FiChevronDown />
                        </div>
                    </div>
                </section>

                {/* Phone + Email */}
                <section className="mt-16 md:mt-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
                        {/* PHONE */}
                        <div className="text-center">
                            <h2 className="text-[14px] uppercase tracking-[0.18em] text-[#003049] font-semibold">
                                PHONE
                            </h2>

                            <p className="mt-6 text-[16px] md:text-[18px] text-[#003049]/85 leading-relaxed">
                                {info.phoneHours}
                            </p>

                            <div className="mt-8">
                                <a
                                    href={`tel:${info.phoneNumber.replace(/[^\d+]/g, "")}`}
                                    className="inline-flex items-center gap-3 text-[#003049] font-medium hover:text-[#C1121F] transition"
                                >
                                    <FiPhone />
                                    <span className="underline underline-offset-8">
                                        Call Us {info.phoneNumber}
                                    </span>
                                </a>
                            </div>
                        </div>

                        {/* EMAIL */}
                        <div className="text-center">
                            <h2 className="text-[14px] uppercase tracking-[0.18em] text-[#003049] font-semibold">
                                EMAIL
                            </h2>

                            <p className="mt-6 text-[16px] md:text-[18px] text-[#003049]/85 leading-relaxed">
                                {info.emailNote}
                            </p>

                            <div className="mt-8">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(true)}
                                    className="inline-flex items-center gap-3 text-[#003049] font-medium hover:text-[#C1121F] transition"
                                >
                                    <FiMail />
                                    <span className="underline underline-offset-8">Write Us</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-20 h-px w-full bg-gray-200" />
                </section>

                <section className="mt-8 text-center">
                    <p className="text-xs text-gray-500">
                        For order concerns, please include your order number in your message.
                    </p>
                </section>
            </main>

            {isOpen && (
                <EmailDrawer
                    city={city}
                    form={form}
                    setField={setField}
                    onClose={() => setIsOpen(false)}
                    onSubmit={onSubmit}
                    isSubmitting={isSubmitting}
                />
            )}
        </div>
    );
}

function EmailDrawer({
    city,
    form,
    setField,
    onClose,
    onSubmit,
    isSubmitting,
}: {
    city: string;
    form: EmailFormState;
    setField: <K extends keyof EmailFormState>(
        key: K,
        value: EmailFormState[K]
    ) => void;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
}) {
    const panelRef = useRef<HTMLDivElement | null>(null);

    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    const ANIM_MS = 260;

    const requestClose = () => {
        if (isClosing || isSubmitting) return;
        setIsClosing(true);
        setIsVisible(false);
        window.setTimeout(() => onClose(), ANIM_MS);
    };

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") requestClose();
        };
        window.addEventListener("keydown", onKeyDown);

        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const t = window.setTimeout(() => setIsVisible(true), 10);
        window.setTimeout(() => panelRef.current?.focus(), 20);

        return () => {
            window.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = prev;
            window.clearTimeout(t);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50">
            {/* overlay */}
            <button
                type="button"
                className={[
                    "absolute inset-0 bg-black/40 transition-opacity duration-200",
                    isVisible && !isClosing ? "opacity-100" : "opacity-0",
                ].join(" ")}
                onClick={requestClose}
                aria-label="Close modal"
            />

            {/* drawer */}
            <div
                ref={panelRef}
                tabIndex={-1}
                className={[
                    "absolute right-0 top-0 h-full",
                    "w-full sm:w-[460px] lg:w-[520px]",
                    "bg-white shadow-2xl outline-none overflow-hidden",
                    "transition-transform duration-300 ease-out will-change-transform",
                    isVisible && !isClosing ? "translate-x-0" : "translate-x-full",
                ].join(" ")}
            >
                {/* X button */}
                <button
                    type="button"
                    onClick={requestClose}
                    aria-label="Close"
                    disabled={isSubmitting}
                    className={[
                        "group absolute top-6 right-6",
                        "w-12 h-12 rounded-full bg-black text-white",
                        "flex items-center justify-center shadow-lg",
                        "transition-transform duration-200 ease-out hover:scale-105 disabled:opacity-50",
                    ].join(" ")}
                >
                    <FiX className="text-lg transition-transform duration-200 ease-out group-hover:rotate-90" />
                </button>

                {/* header */}
                <div className="px-10 pt-16 pb-6">
                    <p className="text-[12px] uppercase tracking-[0.18em] text-[#003049]/60">
                        {city} • CAMANAVA
                    </p>
                    <h3 className="mt-2 text-[22px] tracking-[0.12em] uppercase text-black">
                        EMAIL US
                    </h3>
                </div>

                {/* body */}
                <div className="px-10 pb-10 overflow-y-auto h-[calc(100%-96px)]">
                    <form onSubmit={onSubmit} className="space-y-4">
                        <SelectField
                            label="Title*"
                            value={form.title}
                            onChange={(v) => setField("title", v as EmailFormState["title"])}
                            options={[
                                { label: "Mr", value: "Mr" },
                                { label: "Ms", value: "Ms" },
                                { label: "Mrs", value: "Mrs" },
                            ]}
                        />

                        <InputField
                            label="First Name*"
                            value={form.firstName}
                            onChange={(v) => setField("firstName", v)}
                            required
                        />

                        <InputField
                            label="Last Name*"
                            value={form.lastName}
                            onChange={(v) => setField("lastName", v)}
                            required
                        />

                        <InputField
                            label="Email address*"
                            value={form.email}
                            onChange={(v) => setField("email", v)}
                            type="email"
                            required
                        />

                        <div className="grid grid-cols-[0.9fr_1.3fr] gap-3">
                            <SelectField
                                label="Phone prefix"
                                value={form.phonePrefix}
                                onChange={(v) =>
                                    setField("phonePrefix", v as EmailFormState["phonePrefix"])
                                }
                                options={[
                                    { label: "+63", value: "+63" },
                                    { label: "+1", value: "+1" },
                                    { label: "+65", value: "+65" },
                                ]}
                                required={false}
                            />

                            <InputField
                                label="Phone number"
                                value={form.phoneNumber}
                                onChange={(v) => setField("phoneNumber", v)}
                                inputMode="tel"
                                required={false}
                            />
                        </div>

                        <SelectField
                            label="Subject*"
                            value={form.subject}
                            onChange={(v) =>
                                setField("subject", v as EmailFormState["subject"])
                            }
                            options={[
                                { label: "Order Concern", value: "Order Concern" },
                                { label: "Shipping", value: "Shipping" },
                                { label: "Product Inquiry", value: "Product Inquiry" },
                                { label: "Feedback", value: "Feedback" },
                            ]}
                        />

                        <TextareaField
                            label="Your inquiry or comment*"
                            value={form.message}
                            onChange={(v) => setField("message", v)}
                            maxLen={MAX_MESSAGE}
                            required
                            rows={6}
                        />

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-black text-white py-4 mt-2 text-[12px] tracking-[0.25em] uppercase font-semibold hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "SENDING..." : "SEND EMAIL"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

/* ---------------- Floating Label Fields ---------------- */

function InputField({
    label,
    value,
    onChange,
    type = "text",
    inputMode,
    required = true,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: React.HTMLInputTypeAttribute;
    inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
    required?: boolean;
}) {
    const id = `tw-${label.replace(/\s+/g, "-").toLowerCase()}`;

    return (
        <div className="relative">
            <input
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                type={type}
                inputMode={inputMode}
                required={required}
                placeholder=" "
                className="
          peer w-full border border-gray-300 bg-white
          px-4 pt-5 pb-3 text-sm outline-none
          focus:border-black
        "
            />

            <label
                htmlFor={id}
                className="
          pointer-events-none absolute left-4 top-4
          origin-[0] text-sm text-gray-500
          transition-all duration-200 ease-out
          peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400
          peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-black
          peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-black
        "
            >
                {label}
            </label>
        </div>
    );
}

function SelectField({
    label,
    value,
    onChange,
    options,
    required = true,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { label: string; value: string }[];
    required?: boolean;
}) {
    const id = `tw-${label.replace(/\s+/g, "-").toLowerCase()}`;
    const hasValue = value !== "";

    return (
        <div className="relative">
            <select
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                className="
          peer w-full appearance-none border border-gray-300 bg-white
          px-4 pt-5 pb-3 text-sm outline-none
          focus:border-black
        "
            >
                <option value="" disabled></option>

                {options.map((opt) => (
                    <option key={opt.label} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>

            <label
                htmlFor={id}
                className={[
                    "pointer-events-none absolute left-4 origin-[0] transition-all duration-200 ease-out",
                    hasValue ? "top-2 text-[11px] text-black" : "top-4 text-sm text-gray-400",
                    "peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-black",
                ].join(" ")}
            >
                {label}
            </label>

            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black/70">
                <FiChevronDown />
            </div>
        </div>
    );
}

function TextareaField({
    label,
    value,
    onChange,
    required = true,
    rows = 6,
    maxLen = 1000,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    required?: boolean;
    rows?: number;
    maxLen?: number;
}) {
    const id = `tw-${label.replace(/\s+/g, "-").toLowerCase()}`;

    return (
        <div className="relative">
            <textarea
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value.slice(0, maxLen))}
                placeholder=" "
                rows={rows}
                required={required}
                className="
          peer w-full border border-gray-300 bg-white
          px-4 pt-5 pb-3 text-sm outline-none
          focus:border-black placeholder:text-transparent
        "
            />

            <label
                htmlFor={id}
                className="
          pointer-events-none absolute left-4 top-4
          origin-[0] text-sm text-gray-500
          transition-all duration-200 ease-out
          peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400
          peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-black
          peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-black
        "
            >
                {label}
            </label>

            <div className="mt-2 text-xs text-gray-500 flex justify-center">
                {value.length}/{maxLen}
            </div>
        </div>
    );
}