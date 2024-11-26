import Footer from "../common/Footer";
import Header from "../common/Header";
import MenuBar from "../common/MenuBar"; // MenuBar 컴포넌트 추가

export default function CommonLayout({ children }) {
  return (
    <div className="common-layout">
      <div className="menu-bar">
        <MenuBar />
      </div>
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}
