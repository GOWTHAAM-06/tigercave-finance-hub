import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="relative rounded-3xl bg-gradient-card border border-border/50 p-12 lg:p-20 text-center overflow-hidden">
          {/* Background Elements */}
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Ready to Start Your{" "}
              <span className="text-gradient">Investment Journey?</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10">
              Open your free Demat account in just 5 minutes. No paperwork, 100% digital.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="lg">
                Open Free Account
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="lg">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
