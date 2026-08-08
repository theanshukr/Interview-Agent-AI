import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, Menu, Moon, Search, Settings, Sun, Upload, X } from "lucide-react";
import Logo from "@/components/Logo";
import Avatar from "@/components/Avatar";
import ImportDataModal from "@/components/ImportDataModal";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Candidates", to: "/select" },
  { label: "Curriculum", to: "/curriculum" },
];

export default function TopNav({ user, onSearch, searchValue }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();
  const [importOpen, setImportOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [navSearch, setNavSearch] = useState("");
  const searchRef = React.useRef(null);

  useEffect(() => {
    const handleOpenModal = () => setImportOpen(true);
    window.addEventListener("open-import-modal", handleOpenModal);
    return () => window.removeEventListener("open-import-modal", handleOpenModal);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleNavSearchSubmit(e) {
    e.preventDefault();
    const q = navSearch.trim();
    setMobileMenuOpen(false);
    navigate(q ? `/select?q=${encodeURIComponent(q)}` : "/select");
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl transition-colors">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-2 px-3 sm:px-6">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 pr-2">
            <Logo size={30} tile />
            <span className="text-[15px] font-bold tracking-tight text-foreground sm:inline">
              Interview Agent
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((l) => {
              const active = location.pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          {/* Search */}
          <form onSubmit={handleNavSearchSubmit} className="ml-4 hidden flex-1 max-w-xs lg:flex">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchRef}
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                placeholder="Search candidates..."
                className="w-full rounded-lg border border-border bg-secondary/60 py-1.5 pl-8 pr-10 text-xs outline-none transition-colors focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/15"
              />
              <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                ⌘K
              </kbd>
            </div>
          </form>

          {/* Right cluster */}
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Notifications"
              className="grid h-9 w-9 place-items-center rounded-lg border border-border/50 bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Bell className="h-4 w-4" />
            </button>
            <button
              onClick={() => setImportOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold text-foreground transition-all hover:bg-secondary hover:border-border/80 sm:px-3"
            >
              <Upload className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">Import Data</span>
            </button>

            <button
              onClick={toggle}
              aria-label="Toggle dark mode"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="grid h-9 w-9 place-items-center rounded-lg border border-border/50 bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {isDark ? <Sun className="h-4 w-4 text-warning" /> : <Moon className="h-4 w-4 text-foreground" />}
            </button>

            <Link
              to="/settings"
              aria-label="Settings"
              className="hidden sm:grid h-9 w-9 place-items-center rounded-lg border border-border/50 bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
            </Link>

            <Avatar name={(user && user.full_name) || "Admin User"} size={32} className="ml-1 hidden sm:block" />

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-secondary md:hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-border bg-background px-4 py-4 md:hidden">
            <form onSubmit={handleNavSearchSubmit} className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                placeholder="Search candidates..."
                className="w-full rounded-lg border border-border bg-secondary/60 py-2.5 pl-9 pr-10 text-sm outline-none transition-colors focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/15"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary"
              >
                Go
              </button>
            </form>

            <nav className="flex flex-col gap-1.5">
              {NAV_LINKS.map((l) => {
                const active = location.pathname === l.to;
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    {l.label}
                  </Link>
                );
              })}
              <div className="mt-2 flex items-center gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => setImportOpen(true)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  <Upload className="h-3.5 w-3.5 text-primary" /> Import Data
                </button>
                <button
                  type="button"
                  onClick={toggle}
                  aria-label="Toggle dark mode"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-secondary"
                >
                  {isDark ? <Sun className="h-4 w-4 text-warning" /> : <Moon className="h-4 w-4" />}
                </button>
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Settings"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-secondary"
                >
                  <Settings className="h-4 w-4" />
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <ImportDataModal open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  );
}