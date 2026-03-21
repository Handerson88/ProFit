import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Onboarding } from './pages/Onboarding';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { FoodSearch } from './pages/FoodSearch';
import { AddMeal } from './pages/AddMeal';
import { Statistics } from './pages/Statistics';
import { History } from './pages/History';
import { Profile } from './pages/Profile';
import { FoodScanner } from './pages/Scanner';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/add-meal" element={<FoodSearch />} />
        <Route path="/log-meal" element={<AddMeal />} />
        <Route path="/stats" element={<Statistics />} />
        <Route path="/history" element={<History />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/scanner" element={<FoodScanner />} />
        {/* Redirect unknown routes to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
