import { Link } from "react-router-dom";
import { useAppStore } from "@/store/stores/app";
import logoUrl from "@/assets/images/logo.svg";
import "./Logo.scss";

export default function Logo() {
  const { title, collapse, logo } = useAppStore();
  if (!logo) return null;

  return (
    <Link to="/home" className={`app-logo ${collapse ? "is-collapse" : ""}`}>
      <img src={logoUrl} className="app-logo-img" alt="" />
      {!collapse ? <span className="app-logo-title">{title}</span> : null}
    </Link>
  );
}
