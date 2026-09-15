"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import RequireAuth from "@/components/RequireAuth";
import { logout } from "@/lib/auth";

const TABS = [
  { href: "/account", label: "Profile" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/orders", label: "Orders" },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <RequireAuth>
      <div className="mx-auto max-w-content px-5 py-8 sm:px-10 sm:py-12">
        <div className="rule-strong flex flex-wrap items-center gap-6 pb-4 font-mono text-[11px] uppercase tracking-[0.1em] text-faint">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={pathname === tab.href ? "border-b-[1.5px] border-accent pb-0.5 text-accent" : "text-ink"}
            >
              {tab.label}
            </Link>
          ))}
          <button
            onClick={async () => {
              await logout();
              router.push("/");
            }}
            className="ml-auto normal-case tracking-normal text-muted hover:text-ink"
          >
            Sign out
          </button>
        </div>
        <div className="pt-8">{children}</div>
      </div>
    </RequireAuth>
  );
}
