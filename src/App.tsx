import { HashRouter, Routes, Route } from 'react-router-dom';
import { setData, chaptersData, questionsData } from './data/loader';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ChapterList from './components/ChapterList';
import KnowledgePointList from './components/KnowledgePointList';
import KnowledgePointDetail from './components/KnowledgePointDetail';
import Practice from './components/Practice';
import WrongBook from './components/WrongBook';
import Review from './components/Review';
import Stats from './components/Stats';

// Initialize data
setData(chaptersData, questionsData);

function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/chapters" element={<ChapterList />} />
          <Route path="/chapter/:chId" element={<KnowledgePointList />} />
          <Route path="/kp/:kpId" element={<KnowledgePointDetail />} />
          <Route path="/practice/:type" element={<Practice />} />
          <Route path="/wrongbook" element={<WrongBook />} />
          <Route path="/review" element={<Review />} />
          <Route path="/stats" element={<Stats />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;
