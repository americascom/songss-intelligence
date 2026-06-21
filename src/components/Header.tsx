import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import songssLogo from "@/assets/songss-logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];


const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();

  // Close the mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header
      className="sticky top-0 left-0 right-0 w-full bg-background/80 backdrop-blur-md border-b border-border"
      style={{ zIndex: 9999 }}
    >
      <div className="container flex items-center justify-between h-20 py-2">
        <Link to="/" className="flex items-center shrink-0">
          <img
            src={songssLogo}
            alt="SONGSS Intelligence"
            className="h-14 w-auto object-contain"
          />
        </Link>

        {/* Mobile/tablet: hamburger button (visible below lg) */}
        <button
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="lg:hidden p-2 text-foreground"
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop nav (visible lg and up) */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive(link.href) ? "text-primary" : "text-foreground/70"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop auth area */}
        <div className="hidden lg:flex items-center gap-3">
          {loading ? (
            <div className="w-20 h-9 bg-muted animate-pulse rounded" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="w-4 h-4" />
                  <span className="max-w-[120px] truncate">
                    {user.email?.split("@")[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent border-2 border-primary text-foreground hover:bg-primary/10 hover:text-foreground"
              >
                Log In
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile menu panel (only mounted when open, hidden on lg+) */}
      {isMenuOpen && (
        <div className="lg:hidden bg-background border-b border-border animate-fade-in">
          <nav className="container py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={`text-base font-medium py-3 border-b border-border/40 ${
                  isActive(link.href) ? "text-primary" : "text-foreground/70"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-4">
              {user ? (
                <>
                  <div className="px-2 py-1 text-sm text-muted-foreground">
                    {user.email}
                  </div>
                  <Button
                    variant="ghost"
                    className="justify-start gap-2"
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                    <Button
                      variant="outline"
                      className="w-full bg-transparent border-2 border-primary text-foreground hover:bg-primary/10 hover:text-foreground"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link to="/pricing" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full gradient-primary font-semibold">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
