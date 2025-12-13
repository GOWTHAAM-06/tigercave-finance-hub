import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Shield, Zap } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen bg-gradient-hero overflow-hidden pt-20">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 -left-32 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-border/20 rounded-full opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-border/20 rounded-full opacity-20" />
      </div>

      <div className="container relative mx-auto px-6 py-24 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">Trusted by 1M+ investors across India</span>
          </div>

          {/* Main Headline */}
          <h1 className="animate-fade-up-delay-1 font-display text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6">
            Your Gateway to{" "}
            <span className="text-gradient">Smarter</span>
            <br />
            Investments
          </h1>

          {/* Subheadline */}
          <p className="animate-fade-up-delay-2 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Trade in stocks, mutual funds, IPOs, and more with zero brokerage on equity delivery. 
            Join India's fastest-growing investment platform.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button variant="hero" size="lg" className="w-full sm:w-auto">
              Start Investing Now
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Explore Products
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {[
              { icon: TrendingUp, label: "Zero Brokerage", sublabel: "on equity delivery" },
              { icon: Shield, label: "SEBI Registered", sublabel: "& fully compliant" },
              { icon: Zap, label: "Instant Execution", sublabel: "< 0.2s order speed" },
            ].map((item, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.sublabel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
