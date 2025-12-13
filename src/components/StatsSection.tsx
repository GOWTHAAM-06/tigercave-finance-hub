const stats = [
  { value: "10M+", label: "Active Users", suffix: "" },
  { value: "₹50K", label: "Cr Daily Turnover", suffix: "+" },
  { value: "0.03%", label: "Brokerage on Intraday", suffix: "" },
  { value: "99.9%", label: "Uptime Guarantee", suffix: "" },
];

const StatsSection = () => {
  return (
    <section className="py-20 bg-gradient-card border-y border-border/50">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-gradient mb-2">
                {stat.value}
                {stat.suffix}
              </div>
              <p className="text-muted-foreground text-sm sm:text-base">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
