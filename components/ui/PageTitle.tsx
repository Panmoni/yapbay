interface PageTitleProps {
  title: string;
  description?: string;
  appRoute?: boolean;
}

export function PageTitle({
  title,
  description,
  appRoute = false,
}: PageTitleProps) {
  return (
    <section className="flex-col md:flex-row flex items-center md:justify-between mt-12 mb-16 md:mb-12 max-w-2xl mx-auto">
      <h2
        className={`font-bold tracking-tighter leading-tight md:pr-8 ${
          appRoute ? "text-3xl md:text-4xl" : "text-5xl md:text-8xl"
        }`}
      >
        {title}
      </h2>
      {description && (
        <h4 className="text-center md:text-left text-lg mt-5 md:pl-8">
          {description}
        </h4>
      )}
    </section>
  );
}
