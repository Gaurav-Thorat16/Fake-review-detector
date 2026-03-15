import React from "react";
import { Link, useLocation } from "wouter";
import { Shield, LayoutDashboard, Search, Layers } from "lucide-react";
import { motion } from "framer-motion";

const NavLink = ({ href, icon: Icon, children }: { href: string; icon: React.ElementType; children: React.ReactNode }) => {
  const [location] = useLocation();
  const isActive = location === href;
  
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-display tracking-wider font-semibold transition-all duration-300 ${
        isActive 
          ? "bg-primary/10 text-primary border border-primary/30 box-glow-primary" 
          : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
      }`}
    >
      <Icon className="w-4 h-4" />
      {children}
    </Link>
  );
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative overflow-x-hidden bg-background selection:bg-primary/30 selection:text-primary">
      {/* Background Image & Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src={`${import.meta.env.BASE_URL}images/cyber-grid.png`} 
          alt="Cyber Grid" 
          className="w-full h-full object-cover opacity-15 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/95 to-background" />
      </div>

      {/* Navigation Bar */}
      <header className="relative z-40 border-b border-white/10 glass-panel sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 group-hover:box-glow-primary transition-all duration-300">
                <Shield className="w-5 h-5 text-primary" />
                <div className="absolute inset-0 rounded-xl bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-foreground tracking-widest uppercase flex items-center gap-1">
                  Nexus<span className="text-primary text-glow-primary">Guard</span>
                </h1>
                <p className="text-[10px] font-sans text-muted-foreground tracking-widest uppercase">Sentiment Analysis Core</p>
              </div>
            </Link>
            
            <nav className="hidden md:flex items-center gap-2">
              <NavLink href="/" icon={Search}>Analyzer</NavLink>
              <NavLink href="/batch" icon={Layers}>Batch Scanner</NavLink>
              <NavLink href="/dashboard" icon={LayoutDashboard}>Telemetry</NavLink>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
