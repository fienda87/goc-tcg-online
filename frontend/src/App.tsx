import { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { AnimatedRoutes } from './components/layout/AnimatedRoutes';
import { ScatteredBackground } from './components/layout/ScatteredBackground';
import ClickSpark from './components/ui/ClickSpark';
import { useEnergyStore } from './store/energyStore';
import { useUserStore } from './store/userStore';
import { useCollectionStore } from './store/collectionStore';
import { useBinderStore } from './store/binderStore';
import { useMailboxStore } from './store/mailboxStore';
import { useAchievementStore } from './store/achievementStore';
import { DailyLoginModal } from './components/modals/DailyLoginModal';

function App() {
  const checkRefill = useEnergyStore((s) => s.checkRefill);
  const fetchEnergy = useEnergyStore((s) => s.fetchEnergy);
  const user = useUserStore((s) => s.user);
  const fetchCollection = useCollectionStore((s) => s.fetchCollection);
  const fetchBinders = useBinderStore((s) => s.fetchBinders);
  const cards = useCollectionStore((s) => s.cards);

  useEffect(() => {
    if (user) {
      const syncAll = async () => {
        await useCollectionStore.getState().migrateGuestData();
        await fetchCollection();
        await fetchEnergy();
        await fetchBinders();
        await useMailboxStore.getState().fetchMessages();
        await useAchievementStore.getState().fetchAchievements();
      };
      syncAll();
    }
  }, [user, fetchCollection, fetchEnergy, fetchBinders]);

  // Reactive achievement checks when collection updates
  useEffect(() => {
    if (user && cards.length > 0) {
      useAchievementStore.getState().checkAndUnlockAchievements();
    }
  }, [user, cards]);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    // Initialize Supabase Auth session
    useUserStore.getState().initialize().then((unsub) => {
      unsubscribe = unsub;
    });

    // Run refill check on mount
    checkRefill();

    // Check periodically in background (every 30 seconds)
    const interval = setInterval(checkRefill, 30000);

    // Run check on focus/visibility change (tab reactivation)
    const handleReactivation = () => checkRefill();
    window.addEventListener('focus', handleReactivation);
    document.addEventListener('visibilitychange', handleReactivation);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleReactivation);
      document.removeEventListener('visibilitychange', handleReactivation);
      if (unsubscribe) unsubscribe();
    };
  }, [checkRefill]);

  return (
    <ClickSpark
      sparkColor="#ffffff"
      sparkSize={10}
      sparkRadius={15}
      sparkCount={8}
      duration={400}
    >
      <Router>
        <ScatteredBackground />
        <div className="relative min-h-screen flex flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 w-full relative z-10">
            <AnimatedRoutes />
          </main>
          <DailyLoginModal />
        </div>
      </Router>
    </ClickSpark>
  );
}

export default App;
