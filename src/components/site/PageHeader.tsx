import type { ReactNode } from "react";

/**
 * The sheet header used by every page under the storefront chrome.
 * A mono breadcrumb rail, the poster title, and an optional note on the right.
 */
export function PageHeader({
  title,
  crumbs,
  note,
}: {
  title: string;
  crumbs: ReactNode;
  note?: ReactNode;
}) {
  return (
    <section className="border-b border-[#171A17]/25 bg-[#E9EAE4] text-[#171A17]">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-end justify-between gap-6 px-5 py-8 md:px-10 md:py-10">
        <div>
          <div className="flex flex-wrap items-center gap-2 font-spec text-[10px] uppercase tracking-[0.2em] text-[#171A17]/60 [&_a:hover]:text-[#FF4D00]">
            {crumbs}
          </div>
          <h1 className="mt-4 font-poster text-[clamp(2.4rem,4.4vw,3.6rem)] uppercase leading-[0.9] tracking-[-0.01em] text-[#171A17]">
            {title}
          </h1>
        </div>
        {note ? (
          <div className="pb-1 font-spec text-[10px] uppercase tracking-[0.16em] text-[#171A17]/65">
            {note}
          </div>
        ) : null}
      </div>
    </section>
  );
}
