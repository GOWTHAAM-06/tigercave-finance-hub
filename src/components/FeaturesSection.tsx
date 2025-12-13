import { TrendingUp, PiggyBank, LineChart, Landmark, CreditCard, Shield } from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "Stocks & Equity",
    description: "Invest in 5000+ stocks with real-time data, advanced charts, and zero brokerage on delivery.",
  },
  {
    icon: PiggyBank,
    title: "Mutual Funds",
    description: "Choose from 1500+ mutual funds with zero commission. Start SIP with just ₹100/month.",
  },
  {
    icon: LineChart,
    title: "F&O Trading",
    description: "Trade futures and options with powerful tools, low margins, and instant execution.",
  },
  {
    icon: Landmark,
    title: "IPO Investment",
    description: "Apply to upcoming IPOs directly from your account with UPI mandate integration.",
  },
  {
    icon: CreditCard,
    title: "Digital Gold",
    description: "Buy 24K digital gold starting at ₹10. Safe custody in secure vaults with insurance.",
  },
  {
    icon: Shield,
    title: "Insurance",
    description: "Protect your investments with life and health insurance products at best prices.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="products" className="py-24 bg-background relative">
      {/* Background accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Products
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Everything You Need to{" "}
            <span className="text-gradient">Grow Wealth</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From stocks to mutual funds, we've got all your investment needs covered under one roof.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 rounded-2xl bg-gradient-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-glow cursor-pointer"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3 text-foreground group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
