"use client";

import { useSectionReveal } from "@/hooks/use-section-reveal";
import { TOPICS } from "@/lib/constants";
import { CheckCircle, Loader2 } from "lucide-react";
import * as React from "react";

type FormState = "error" | "idle" | "submitting" | "success";

export const Contact: React.FC = () => {
  //* State
  const [formState, setFormState] = React.useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = React.useState("");

  //* Refs
  const ref = useSectionReveal();

  //* Handlers
  const handleSubmit = React.useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormState("submitting");
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const body = {
      email: formData.get("email") as string,
      message: formData.get("message") as string,
      name: formData.get("name") as string,
      topic: formData.get("topic") as string,
    };

    try {
      const response = await fetch("/api/contact", {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setFormState("success");
    } catch {
      setFormState("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  }, []);

  if (formState === "success") {
    return (
      <section className="px-6 py-24 md:px-12" id="contact">
        <div className="section-reveal mx-auto max-w-xl text-center" ref={ref}>
          <div className="border-ns-card-border bg-ns-card-bg flex flex-col items-center gap-4 rounded-lg border p-12">
            <CheckCircle className="text-ns-accent animate-[fadeIn_0.5s_ease]" size={48} />
            <h2 className="text-ns-text-heading font-serif text-2xl">{"Message sent"}</h2>
            <p className="text-ns-text">{"Thanks for reaching out! We'll get back to you soon."}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-24 md:px-12" id="contact">
      <div className="section-reveal mx-auto max-w-xl" ref={ref}>
        <h2 className="text-ns-text-heading mb-4 text-center font-serif text-3xl md:text-4xl">{"Get in Touch"}</h2>
        <p className="text-ns-text-muted mb-10 text-center text-lg">
          {"Have a question or want to work together? Reach out."}
        </p>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-ns-text text-sm font-medium" htmlFor="name">
              {"Name"}
            </label>
            <input
              className="border-ns-input-border bg-ns-input-bg text-ns-input-text rounded-md border px-4 py-2.5 text-base transition-colors"
              id="name"
              name="name"
              placeholder="Your name"
              required
              type="text"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-ns-text text-sm font-medium" htmlFor="email">
              {"Email"}
            </label>
            <input
              className="border-ns-input-border bg-ns-input-bg text-ns-input-text rounded-md border px-4 py-2.5 text-base transition-colors"
              id="email"
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-ns-text text-sm font-medium" htmlFor="topic">
              {"What's this about?"}
            </label>
            <select
              className="border-ns-input-border bg-ns-input-bg text-ns-input-text rounded-md border px-4 py-2.5 text-base transition-colors"
              id="topic"
              name="topic"
              required
            >
              <option value="">{"Select a topic"}</option>
              {TOPICS.map((topic) => {
                return (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-ns-text text-sm font-medium" htmlFor="message">
              {"Message"}
            </label>
            <textarea
              className="border-ns-input-border bg-ns-input-bg text-ns-input-text resize-none rounded-md border px-4 py-2.5 text-base transition-colors"
              id="message"
              name="message"
              placeholder="Your message..."
              required
              rows={5}
            />
          </div>

          {formState === "error" && <p className="text-ns-error text-sm">{errorMessage}</p>}

          <button
            className="btn-primary bg-ns-btn-bg text-ns-btn-text mt-2 flex items-center justify-center gap-2 rounded-md px-6 py-3 text-base font-medium transition-colors duration-200 disabled:opacity-60"
            disabled={formState === "submitting"}
            type="submit"
          >
            {formState === "submitting" ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                {"Sending..."}
              </>
            ) : (
              "Send Message"
            )}
          </button>
        </form>
      </div>
    </section>
  );
};
