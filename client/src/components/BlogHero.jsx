export default function BlogHero({
    title = "Blog – OLS",
    subtitle = "Own Label Supply Guide",
    imageUrl = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2000&auto=format&fit=crop" // replace any time
  }) {
    return (
      <section className="relative w-full overflow-hidden rounded-2xl mb-10">
        <img
          src={imageUrl}
          alt={title}
          className="h-56 md:h-72 lg:h-80 w-full object-cover"
          loading="eager"
          fetchpriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
        <div className="absolute inset-0 flex items-end p-6 md:p-10">
          <div className="text-white">
            <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-3 py-1 backdrop-blur">
              <span className="text-xl">🧭</span>
              <span className="text-sm tracking-wide">Own Label Supply Guide</span>
            </div>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold drop-shadow-sm">
              {title}
            </h1>
            <p className="mt-1 opacity-90">{subtitle}</p>
          </div>
        </div>
      </section>
    );
  }
  