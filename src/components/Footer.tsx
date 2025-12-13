const Footer = () => {
  const footerLinks = {
    Products: ["Stocks", "Mutual Funds", "IPO", "F&O", "Digital Gold", "Insurance"],
    Company: ["About Us", "Careers", "Press", "Blog", "Partners"],
    Support: ["Help Center", "Contact Us", "FAQs", "Grievance", "Status"],
    Legal: ["Privacy Policy", "Terms of Service", "Disclosures", "SEBI Regulations"],
  };

  return (
    <footer className="bg-card border-t border-border/50 py-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-4 lg:mb-0">
            <a href="/" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold text-lg">T</span>
              </div>
              <span className="font-display font-bold text-xl text-foreground">
                Tiger<span className="text-gradient">cave</span>
              </span>
            </a>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              India's trusted investment platform. SEBI registered stockbroker since 2020.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-foreground mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-muted-foreground text-sm hover:text-primary transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              © 2024 Tigercave Financial Services Pvt. Ltd. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <span className="text-muted-foreground text-sm">SEBI Reg. No: INZ000123456</span>
            </div>
          </div>
          <p className="text-muted-foreground text-xs mt-6 leading-relaxed">
            Investment in securities market are subject to market risks, read all the related documents carefully before investing. 
            Brokerage will not exceed SEBI prescribed limit.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
