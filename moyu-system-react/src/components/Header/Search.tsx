import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SearchOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { usePermissionStore } from "@/store/stores/permission";
import "./Search.scss";

function flattenMenus(
  nodes: any[],
  acc: { path: string; title: string }[] = [],
) {
  for (const node of nodes || []) {
    if (node.path && (!node.children || node.children.length === 0)) {
      acc.push({ path: node.path, title: node.title || "" });
    }
    if (node.children?.length) flattenMenus(node.children, acc);
  }
  return acc;
}

export default function Search() {
  const { t } = useTranslation();
  const { getMenuList } = usePermissionStore();
  const [searchText, setSearchText] = useState("");

  const allList = useMemo(() => flattenMenus(getMenuList || []), [getMenuList]);

  const linkList = useMemo(() => {
    if (!searchText) return [];
    return allList.filter((item) => item.title.includes(searchText));
  }, [searchText, allList]);

  return (
    <div className="nav-search">
      <div className="search-input">
        <SearchOutlined className="icon" />
        <input
          value={searchText}
          className="input"
          placeholder={t("common.inputText")}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>
      {linkList.length > 0 && (
        <ul className="search-result">
          {linkList.map((item) => (
            <li className="search-li" key={item.path}>
              <Link to={item.path} className="link" onClick={() => setSearchText("")}>
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
