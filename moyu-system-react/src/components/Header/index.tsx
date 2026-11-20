import { Link } from "react-router-dom";
import { useAppStore } from "@/store/stores/app";
import CollapseButton from "./CollapseButton";
import HeaderBreadcrumb from "./Breadcrumb";
import TenantSwitch from "./TenantSwitch";
import SettingButton from "./SettingButton";
import Screenfull from "./Screenfull";
import Search from "./Search";
import SizeDropdown from "./SizeDropdown";
import LocaleDropdown from "./LocaleDropdown";
import MessageBell from "./MessageBell";
import Login from "./Login";
import logoUrl from "@/assets/images/logo.svg";
import "./index.scss";

export default function Index() {
  const { search, logo, title } = useAppStore();

  return (
    <header className="app-header">
      <div className="header-left">
        {logo ? (
          <Link to="/home" className="header-app">
            <img src={logoUrl} className="header-app-logo" alt="" />
            <span className="header-app-name">{title}</span>
          </Link>
        ) : null}
        <CollapseButton />
        <HeaderBreadcrumb />
      </div>
      <div className="header-right">
        {search ? <Search /> : null}
        <TenantSwitch />
        <SettingButton />
        <Screenfull />
        <SizeDropdown />
        <LocaleDropdown />
        <MessageBell />
        <Login />
      </div>
    </header>
  );
}
