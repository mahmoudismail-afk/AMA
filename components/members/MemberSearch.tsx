'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';

/** Live member search: updates ?q= in the URL as you type (debounced). */
export default function MemberSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const firstRender = useRef(true);

  // Keep input in sync when q changes from elsewhere (e.g. topbar search)
  useEffect(() => { setValue(initialQuery); }, [initialQuery]);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const handle = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const q = value.trim();
      if (q) {
        params.set('q', q);
        // Searching should look across all statuses unless the user picked one explicitly
        if (!params.get('status')) params.set('status', 'all');
      } else {
        params.delete('q');
      }
      if (q === (searchParams.get('q') ?? '')) return;
      startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }));
    }, 300);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <form className="search-input-wrapper" role="search" onSubmit={(e) => e.preventDefault()}>
      {isPending
        ? <Loader2 size={16} className="search-icon animate-spin" />
        : <Search size={16} className="search-icon" />}
      <input
        name="q"
        type="search"
        className="search-input"
        placeholder="Search by name, phone or email…"
        aria-label="Search members by name, phone or email"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        id="member-search"
        autoComplete="off"
      />
    </form>
  );
}
