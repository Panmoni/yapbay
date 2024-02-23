interface PageTitleProps {
  title: string;
  description?: string;
}

export function PageTitle({ title, description }: PageTitleProps) {
  return (
    <section className="flex-col md:flex-row flex items-center md:justify-between mt-12 mb-16 md:mb-12">
      <h2 className="text-5xl md:text-8xl font-bold tracking-tighter leading-tight md:pr-8">
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
