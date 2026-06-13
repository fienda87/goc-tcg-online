import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

type NavItemProps = {
  id: number;
  label: string;
  subMenus?: {
    title: string;
    items: {
      label: string;
      description: string;
      icon: React.ElementType;
      onClick?: () => void;
      isActive?: boolean;
    }[];
  }[];
  link?: string;
};

type Props = {
  navItems: NavItemProps[];
};

export function DropdownNavigation({ navItems }: Props) {
  const [openMenu, setOpenMenu] = React.useState<string | null>(null);
  const [isHover, setIsHover] = useState<number | null>(null);

  const handleHover = (menuLabel: string | null) => {
    setOpenMenu(menuLabel);
  };

  return (
    <div className="relative w-full flex items-start justify-start py-4 z-50">
      <div className="relative flex flex-col items-start justify-start">
        <ul className="relative flex items-center space-x-2 flex-wrap gap-y-2">
          {navItems.map((navItem) => (
            <li
              key={navItem.label}
              className="relative"
              onMouseEnter={() => handleHover(navItem.label)}
              onMouseLeave={() => handleHover(null)}
            >
              <button
                className={`text-sm py-2 px-4 rounded-full border transition-colors duration-300 flex items-center justify-center gap-2 relative ${
                  openMenu === navItem.label || isHover === navItem.id
                    ? "border-[#d7b73b] text-[#d7b73b] bg-black/40"
                    : "border-white/20 text-white hover:border-[#d7b73b] hover:text-[#d7b73b]"
                }`}
                onMouseEnter={() => setIsHover(navItem.id)}
                onMouseLeave={() => setIsHover(null)}
              >
                <span className="font-bold">{navItem.label}</span>
                {navItem.subMenus && (
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-300
                      ${openMenu === navItem.label ? "rotate-180" : ""}`}
                  />
                )}
              </button>

              <AnimatePresence>
                {openMenu === navItem.label && navItem.subMenus && (
                  <div className="absolute left-0 top-full pt-2 w-auto min-w-[200px]">
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-[#111] border border-[#d7b73b]/30 p-4 rounded-2xl shadow-2xl backdrop-blur-xl"
                      layoutId="menu"
                    >
                      <div className="flex space-x-8 overflow-hidden w-max">
                        {navItem.subMenus.map((sub) => (
                          <motion.div layout className="min-w-[150px]" key={sub.title}>
                            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#d7b73b]/60">
                              {sub.title}
                            </h3>
                            <ul className="space-y-2">
                              {sub.items.map((item) => {
                                const Icon = item.icon;
                                return (
                                  <li key={item.label}>
                                    <button
                                      onClick={item.onClick}
                                      className="w-full text-left flex items-center space-x-3 group py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors duration-200"
                                    >
                                      <div className={`border flex items-center justify-center size-8 shrink-0 rounded-md transition-colors duration-300 ${
                                        item.isActive 
                                          ? "border-[#d7b73b] bg-[#d7b73b]/20 text-[#d7b73b]" 
                                          : "border-white/10 text-white/60 group-hover:border-[#d7b73b]/50 group-hover:text-[#d7b73b]"
                                      }`}>
                                        <Icon className="h-4 w-4 flex-none" />
                                      </div>
                                      <div className="leading-tight">
                                        <p className={`text-sm font-bold transition-colors duration-300 ${
                                          item.isActive ? "text-[#d7b73b]" : "text-white group-hover:text-[#d7b73b]"
                                        }`}>
                                          {item.label}
                                        </p>
                                        <p className="text-[10px] text-white/40 mt-0.5 transition-colors duration-300 group-hover:text-white/60">
                                          {item.description}
                                        </p>
                                      </div>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
