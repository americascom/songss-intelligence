import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-12 md:py-16">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-2xl font-bold text-foreground mb-2">SONGSS</h3>
            <p className="text-xs text-primary mb-4">Intelligence</p>
            <p className="text-sm text-muted-foreground mb-3">
              Global music analytics for artists, labels, and industry professionals.
            </p>
            <p className="text-xs text-muted-foreground/70 leading-relaxed">
              A product of Americascom, Inc. — Registered in Delaware, USA.
              <br />
              Payments processed by AmericasPay, by Stripe Technology.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
              <li><Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><a href="#" className="hover:text-primary transition-colors">API</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 Americascom, Inc. All rights reserved. SONGSS Intelligence is a trademark of Americascom, Inc.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground/60 font-medium" style={{ fontVariant: 'small-caps' }}>
              Powered by Americascom Neural Intelligence · Opus Maximus - Powered by Claude · Anthropic
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
