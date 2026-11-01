import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Navbar = () => {
  const navLinks = [
    { name: "Markets", href: "#markets" },
    { name: "Products", href: "#products" },
    { name: "Wealth tools", href: "#tools" },
    { name: "Trust", href: "#trust" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/85 backdrop-blur-xl">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-lg">T</span>
            </div>
            <span className="font-display font-bold text-xl text-foreground">
              Tiger<span className="text-gradient">cave</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Button key={link.name} asChild variant="nav" size="sm">
                <a href={link.href}>{link.name}</a>
              </Button>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Link to="/trading-dashboard">
              <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                Trading
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                Login
              </Button>
            </Link>
            <Link to="/open-account">
              <Button variant="hero" size="sm">
                Open Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
