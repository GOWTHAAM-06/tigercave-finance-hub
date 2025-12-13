import { Button } from "@/components/ui/button";

const Navbar = () => {
  const navLinks = [
    { name: "Products", href: "#products" },
    { name: "Pricing", href: "#pricing" },
    { name: "About", href: "#about" },
    { name: "Support", href: "#support" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-lg">T</span>
            </div>
            <span className="font-display font-bold text-xl text-foreground">
              Tiger<span className="text-gradient">cave</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Button key={link.name} variant="nav" size="sm">
                {link.name}
              </Button>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              Login
            </Button>
            <Button variant="hero" size="sm">
              Open Account
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
