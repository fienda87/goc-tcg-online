import React, { Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './PageTransition';

const Home = React.lazy(() => import('../../pages/Home').then(m => ({ default: m.Home })));
const Gacha = React.lazy(() => import('../../pages/Gacha').then(m => ({ default: m.Gacha })));
const Collection = React.lazy(() => import('../../pages/Collection').then(m => ({ default: m.Collection })));
const Rules = React.lazy(() => import('../../pages/Rules').then(m => ({ default: m.Rules })));
const Login = React.lazy(() => import('../../pages/Login').then(m => ({ default: m.Login })));
const Register = React.lazy(() => import('../../pages/Register').then(m => ({ default: m.Register })));
const BindersPage = React.lazy(() => import('../../pages/Binders/BindersPage').then(m => ({ default: m.BindersPage })));
const BinderDetailPage = React.lazy(() => import('../../pages/Binders/BinderDetailPage').then(m => ({ default: m.BinderDetailPage })));

const LoadingFallback = () => (
  <div className="w-full h-[60vh] flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-white/20 border-t-[#d7b73b] rounded-full animate-spin" />
  </div>
);

export const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<LoadingFallback />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/gacha" element={<PageTransition><Gacha /></PageTransition>} />
          <Route path="/collection" element={<PageTransition><Collection /></PageTransition>} />
          <Route path="/rules" element={<PageTransition><Rules /></PageTransition>} />
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
          <Route path="/binders" element={<PageTransition><BindersPage /></PageTransition>} />
          <Route path="/binders/:binderId" element={<PageTransition><BinderDetailPage /></PageTransition>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};
