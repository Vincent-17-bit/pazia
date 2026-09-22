import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import BottomNav from './components/BottomNav.jsx';
import SearchOverlay from './components/SearchOverlay.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Search from './pages/Search.jsx';
import TitleDetail from './pages/TitleDetail.jsx';
import Watch from './pages/Watch.jsx';
import MyList from './pages/MyList.jsx';
import History from './pages/History.jsx';
import Legal from './pages/Legal.jsx';

export default function App() {
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const isPlayer = location.pathname.startsWith('/watch/');

  if (isPlayer) {
    return (
      <Routes>
        <Route path="/watch/:mediaType/:id" element={<Watch />} />
      </Routes>
    );
  }

  return (
    <>
      <Header onSearchClick={() => setSearchOpen(true)} />
      <main className="pb-20 md:pb-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/title/:mediaType/:id" element={<TitleDetail />} />
          <Route path="/my-list" element={<MyList />} />
          <Route path="/history" element={<History />} />
          <Route path="/terms" element={<Legal page="terms" />} />
          <Route path="/privacy" element={<Legal page="privacy" />} />
          <Route path="/dmca" element={<Legal page="dmca" />} />
        </Routes>
        <Footer />
      </main>
      <BottomNav />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
