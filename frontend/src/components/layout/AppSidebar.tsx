import React from 'react';
import { NavLink } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  Dna,
  Sparkles,
  CheckCircle2,
  Mail,
  Reply,
  Target,
  Gauge,
  Settings,
  Palette,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useApp } from '@/lib/AppContext';

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ collapsed, onToggle }) => {
  const { reviewQueue } = useApp();
  const pendingReviewCount = reviewQueue.length;

  const navItems = [
    { section: 'LIVE WORKFLOW' },
    { to: '/pipeline', label: 'Visual Pipeline', icon: Zap, badge: 'Live', badgeVariant: 'ai' as const },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },

    { section: 'PIPELINE STAGES' },
    { to: '/import', label: '1. Input & Extract', icon: FileSpreadsheet },
    { to: '/people', label: '2. Profile Cleaning', icon: Users },
    { to: '/research', label: '3. Context & Vision', icon: Dna },
    { to: '/personalization', label: '4. AI Multi-Variants', icon: Sparkles, badge: '10x', badgeVariant: 'ai' as const },
    {
      to: '/review',
      label: '5. Review Queue',
      icon: CheckCircle2,
      badge: pendingReviewCount > 0 ? String(pendingReviewCount) : undefined,
      badgeVariant: 'warning' as const
    },
    { to: '/outreach', label: '6. SendGrid Outreach', icon: Mail },
    { to: '/replies', label: '7. Replies & Drips', icon: Reply, badge: 'Active', badgeVariant: 'success' as const },

    { section: 'MANAGEMENT' },
    { to: '/campaigns', label: 'Campaigns', icon: Target },
    { to: '/bulk-send', label: 'Rate Limiter', icon: Gauge },
    { to: '/settings', label: 'Settings & API', icon: Settings },

    { section: 'FOUNDATIONS' },
    { to: '/design-system', label: 'Design Tokens', icon: Palette },
  ];

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-30 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <NavLink to="/pipeline" className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-accent flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">
            AI
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sm text-foreground tracking-tight">Outreach V2</span>
              <span className="text-[10px] font-medium text-muted-foreground">AI Automation Engine</span>
            </div>
          )}
        </NavLink>
        <button
          onClick={onToggle}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item, idx) => {
          if ('section' in item) {
            if (collapsed) return null;
            return (
              <div
                key={idx}
                className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider px-3 pt-3 pb-1"
              >
                {item.section}
              </div>
            );
          }

          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold shadow-xs'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <Badge variant={item.badgeVariant || 'default'} className="ml-auto text-[10px] py-0 px-1.5 h-4">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      {!collapsed && (
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 p-2 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-success shadow-sm animate-pulse" />
            <span className="text-[11px] truncate">LLM & SendGrid Connected</span>
          </div>
        </div>
      )}
    </aside>
  );
};
