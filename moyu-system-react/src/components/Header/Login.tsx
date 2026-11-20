import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Image } from "antd";
import { useTranslation } from "react-i18next";

import imgAvatar from "./images/avatar.png";
import imgMycenter from "./images/mycenter.png";
import imgMyid from "./images/myid.png";
import imgLogout from "./images/logout.png";

import Token from "@/utils/token";
import Storage from "@/utils/storage";
import { useAuth } from "@/hooks/useAuth";
import { useUserStore } from "@/store/stores/user";

function deriveUserInfo(storeUserInfo: any) {
  const userData: any = storeUserInfo || Storage.get("USER_DATA");
  if (!userData) {
    return { userName: "", userId: "", avatar: "" };
  }
  return {
    userName: userData.nickname || userData.username || userData.account || "administrator",
    userId: String(userData.id || userData.uuid || ""),
    avatar: userData.avatar || userData.profile?.avatar || "",
  };
}

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const $user = useUserStore();
  const { logout } = useAuth();

  const storeUserInfo = $user.getUserInfo;
  const tokenNow = Token.getToken() || "";
  const derivedUserInfo = deriveUserInfo(storeUserInfo);
  const [token, setToken] = useState(tokenNow);
  const [userInfo, setUserInfo] = useState(derivedUserInfo);
  const [baseline, setBaseline] = useState({ token: tokenNow, storeUserInfo });

  if (tokenNow !== baseline.token || storeUserInfo !== baseline.storeUserInfo) {
    setBaseline({ token: tokenNow, storeUserInfo });
    setToken(tokenNow);
    setUserInfo(derivedUserInfo);
  }

  const clickLogin = () => {
    navigate("/login");
  };

  const loginOut = () => {
    void logout();
    setToken("");
    setUserInfo({ userName: "", userId: "", avatar: "" });
    setBaseline({ token: Token.getToken() || "", storeUserInfo: $user.getUserInfo });
  };

  return (
    <div className="login-box">
      {!token ? (
        <div className="unLogin-box">
          <a className="btn" onClick={clickLogin}>
            <span className="text">{t("common.login")}</span>
          </a>
        </div>
      ) : (
        <div className="logined-box">
          <div className="logined-user">
            <a className="btn">
              <span className="user-avatar">
                <Image src={userInfo.avatar ? userInfo.avatar : imgAvatar} className="img" alt="" preview={false} />
              </span>
              <span className="user-name">{userInfo.userName}</span>
            </a>
          </div>
          <div className="logined-popover">
            <div className="popover-list">
              <a className="link" onClick={() => navigate("/profile")}>
                <i className="icon">
                  <Image src={imgMycenter} className="img" alt="" preview={false} />
                </i>
                <span className="text">{t("common.profile")}</span>
              </a>
            </div>
            <div className="popover-list">
              <div className="user-code">
                <i className="icon">
                  <Image src={imgMyid} className="img" alt="" preview={false} />
                </i>
                <span className="text">{userInfo.userId}</span>
              </div>
            </div>
            <div className="popover-list">
              <a className="btn" onClick={loginOut}>
                <i className="icon">
                  <Image src={imgLogout} className="img" alt="" preview={false} />
                </i>
                <span className="text">{t("common.loginOut")}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
