import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Briefcase, AlertTriangle } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import './NotFoundPage.css';

const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <Layout>
      <motion.div
        className="nf-page"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
        >
          <AlertTriangle size={60} className="nf-icon" />
        </motion.div>
        <h1 className="nf-404">404</h1>
        <h2>Yeh Page Toh Nahi Mila 😅</h2>
        <p>Shayad aap galat jagah aa gaye. Chalo wapas chalte hain!</p>
        <div className="nf-actions">
          <motion.button
            className="nf-btn primary"
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
          >
            <Home size={16} /> Go Home
          </motion.button>
          <motion.button
            className="nf-btn secondary"
            onClick={() => navigate('/browse')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
          >
            <Briefcase size={16} /> Browse Jobs
          </motion.button>
        </div>
      </motion.div>
    </Layout>
  );
};

export default NotFoundPage;
