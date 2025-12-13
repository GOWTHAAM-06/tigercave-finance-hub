import { Check } from "lucide-react";

const benefits = [
  "Zero account opening charges",
  "Free equity delivery trades",
  "Advanced charting tools",
  "Real-time market data",
  "Instant fund transfer",
  "24/7 customer support",
  "Mobile & web platform",
  "Research reports included",
];

const WhyChooseSection = () => {
  return (
    <section id="about" className="py-24 bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Why Tigercave
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Built for the{" "}
              <span className="text-gradient">Modern Investor</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              We combine cutting-edge technology with transparent pricing to give you the best investing experience. 
              No hidden fees, no surprises—just powerful tools at your fingertips.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Card */}
          <div className="relative">
            <div className="relative bg-gradient-card rounded-3xl border border-border/50 p-8 shadow-card">
              {/* App Preview Mockup */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Portfolio Value</p>
                    <p className="font-display text-3xl font-bold text-foreground">₹4,52,890</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground text-sm">Today's P&L</p>
                    <p className="font-display text-xl font-bold text-green-500">+₹2,450</p>
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* Mock Stock Items */}
                {[
                  { name: "RELIANCE", price: "2,847.50", change: "+1.24%", isUp: true },
                  { name: "TCS", price: "4,125.00", change: "+0.85%", isUp: true },
                  { name: "HDFC BANK", price: "1,678.25", change: "-0.32%", isUp: false },
                ].map((stock, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        <span className="font-semibold text-foreground text-xs">{stock.name.charAt(0)}</span>
                      </div>
                      <span className="font-medium text-foreground">{stock.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">₹{stock.price}</p>
                      <p className={`text-sm ${stock.isUp ? 'text-green-500' : 'text-red-500'}`}>
                        {stock.change}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Glow effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary/5 rounded-3xl blur-xl -z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseSection;
