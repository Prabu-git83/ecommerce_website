import ContactForm from "@/components/ContactForm";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-content px-5 py-10 sm:px-10 sm:py-16">
      <div className="eyebrow">Get in touch</div>
      <h1 className="mt-2 font-display text-[36px] font-semibold tracking-tight text-ink sm:text-[44px]">Contact us</h1>
      <p className="mt-3 max-w-[440px] text-[14.5px] leading-relaxed text-muted">
        Questions about an order, a product, or anything else — send a message and our team will get back to you within 1-2 business days.
      </p>

      <div className="rule-strong mt-8 grid gap-10 pt-8 lg:grid-cols-[1fr_320px]">
        <ContactForm />
        <div className="font-body text-[13.5px] leading-relaxed text-muted">
          <div className="eyebrow mb-2">Email</div>
          <p className="mb-6">support@arca.local</p>
          <div className="eyebrow mb-2">Hours</div>
          <p>Monday–Saturday, 10am–7pm IST</p>
        </div>
      </div>
    </div>
  );
}
