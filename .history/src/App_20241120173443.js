import React from 'react';
import './App.css';
import { Route, Routes, useLocation } from 'react-router-dom';
import LandingPageLayout from './components/layout/LandingPageLayout';
import routes from './routes';
import { AuthProvider } from './AuthContext'; // AuthProvider import
import MenuBar from "./components/common/MenuBar";

function App() {
  const location = useLocation(); // React Router의 useLocation 훅 사용

  const getRoutes = (allRoutes) =>
    allRoutes.map((route) => {
      if (route.route) {
        return (
          <Route
            exact
            path={route.route}
            element={route.component}
            key={route.key}
          />
        );
      }
      return null;
    });
  // 로그인 페이지 여부 확인
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="App">
      <AuthProvider>
        {/* Flexbox 컨테이너 */}
        <div className="layout">
          <div class="menu-bar">
            <MenuBar></MenuBar>
          </div>
          {/* 오른쪽 본문 */}
          <div className="main-content1" style={{
              width: isLoginPage ? '100%' : 'calc(100% - 200px)', // 메뉴바가 없을 때는 전체 폭 사용
              marginLeft: isLoginPage ? '0' : '200px', // 메뉴바가 없을 때는 여백 제거
            }}
>
            <Routes>
              {getRoutes(routes)}
              <Route path="*" element={<LandingPageLayout />} />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </div>
  );
}

export default App;