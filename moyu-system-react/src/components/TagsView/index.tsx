import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CloseOutlined, DownOutlined } from "@ant-design/icons";
import { Dropdown } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/store/stores/app";
import { usePermissionStore } from "@/store/stores/permission";
import { findMenuTitle } from "@/store/stores/permission/menu";
import { HOME_PATH, useTagsViewStore, type TagView } from "@/store/stores/tagsView";
import "./index.scss";

const GAP = 4;

function pickVisiblePaths(
  tags: TagView[],
  widths: number[],
  activePath: string,
  limit: number,
): Set<string> {
  const visible = new Set<string>();
  let used = 0;

  const tryAdd = (index: number, force = false) => {
    const tag = tags[index];
    if (!tag || visible.has(tag.path)) return;
    const next = used + (visible.size > 0 ? GAP : 0) + widths[index];
    if (!force && visible.size > 0 && next > limit) return;
    visible.add(tag.path);
    used = next;
  };

  const activeIndex = tags.findIndex((tag) => tag.path === activePath);
  if (activeIndex >= 0) tryAdd(activeIndex, true);
  tags.forEach((_, index) => tryAdd(index));
  return visible;
}

export default function TagsView() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { tagsView, tagsViewImmerse } = useAppStore();
  const { getMenuList } = usePermissionStore();
  const { visited, addTag, removeTag, closeOthers, closeAll, refreshTag } = useTagsViewStore();
  const wrapRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [hiddenPaths, setHiddenPaths] = useState<string[]>([]);

  useEffect(() => {
    const path = location.pathname;
    if (!path || path === "/login") return;
    const menuTitle = findMenuTitle(getMenuList || [], path);
    const errorTitle = path === "/401" || path === "/403" || path === "/404" ? path.slice(1) : "";
    const title = path === HOME_PATH ? "router.home" : menuTitle || errorTitle || path;
    addTag({ path, title });
  }, [addTag, getMenuList, location.pathname]);

  const resolveTitle = (title: string) => (title.includes(".") ? t(title) : title);

  const closeTag = useCallback(
    (path: string) => {
      const remaining = visited.filter((item) => item.path !== path);
      if (location.pathname === path) {
        const fallback = remaining.at(-1)?.path || HOME_PATH;
        if (fallback !== location.pathname) navigate(fallback);
      }
      removeTag(path);
    },
    [location.pathname, navigate, removeTag, visited],
  );

  const goTag = useCallback(
    (path: string) => {
      if (path !== HOME_PATH) refreshTag(path);
      if (path !== location.pathname) navigate(path);
    },
    [location.pathname, navigate, refreshTag],
  );

  const contextMenu = (tag: TagView) => ({
    items: [
      { key: "close", label: t("common.closeTab") },
      { key: "others", label: t("common.closeOther") },
      { key: "all", label: t("common.closeAll") },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === "close") {
        closeTag(tag.path);
      } else if (key === "others") {
        closeOthers(tag.path);
        goTag(tag.path);
      } else if (key === "all") {
        closeAll();
        if (location.pathname !== HOME_PATH) navigate(HOME_PATH);
      }
    },
  });

  const visibleTags = useMemo(
    () => visited.filter((tag) => !hiddenPaths.includes(tag.path)),
    [visited, hiddenPaths],
  );
  const hiddenTags = useMemo(
    () => visited.filter((tag) => hiddenPaths.includes(tag.path)),
    [visited, hiddenPaths],
  );

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const measure = measureRef.current;
    if (!wrap || !measure) return;

    const calc = () => {
      const items = Array.from(measure.querySelectorAll<HTMLElement>("[data-tag-path]"));
      const more = measure.querySelector<HTMLElement>(".tags-view-more");
      if (items.length !== visited.length) return;

      const style = getComputedStyle(wrap);
      const available =
        wrap.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const widths = items.map((el) => el.offsetWidth);
      const total = widths.reduce((sum, w, i) => sum + w + (i > 0 ? GAP : 0), 0);

      if (total <= available) {
        setHiddenPaths((prev) => (prev.length ? [] : prev));
        return;
      }

      const moreWidth = more?.offsetWidth || 36;
      const limit = Math.max(0, available - moreWidth - GAP);
      const visible = pickVisiblePaths(visited, widths, location.pathname, limit);
      const nextHidden = visited.filter((tag) => !visible.has(tag.path)).map((tag) => tag.path);
      setHiddenPaths((prev) => (prev.join() === nextHidden.join() ? prev : nextHidden));
    };

    const observer = new ResizeObserver(calc);
    observer.observe(wrap);
    calc();
    return () => observer.disconnect();
  }, [visited, location.pathname, t]);

  if (!tagsView || visited.length === 0) return null;

  const renderTag = (tag: TagView) => (
    <Dropdown key={tag.path} trigger={["contextMenu"]} menu={contextMenu(tag)}>
      <span
        className={`tags-view-item ${location.pathname === tag.path ? "is-active" : ""}`}
        onClick={() => goTag(tag.path)}
      >
        {resolveTitle(tag.title)}
        <CloseOutlined
          className="tags-view-close"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            closeTag(tag.path);
          }}
        />
      </span>
    </Dropdown>
  );

  return (
    <div ref={wrapRef} className={`tags-view ${tagsViewImmerse ? "is-immerse" : ""}`}>
      {visibleTags.map((tag) => renderTag(tag))}
      {hiddenTags.length ? (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: hiddenTags.map((tag) => ({
              key: tag.path,
              label: (
                <div className={`tags-view-overflow-item ${location.pathname === tag.path ? "is-active" : ""}`}>
                  <span>{resolveTitle(tag.title)}</span>
                  <CloseOutlined
                    className="tags-view-close"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      closeTag(tag.path);
                    }}
                  />
                </div>
              ),
            })),
            onClick: ({ key, domEvent }) => {
              const target = domEvent.target as HTMLElement;
              if (target.closest(".tags-view-close")) return;
              goTag(key);
            },
          }}
        >
          <span className="tags-view-item tags-view-more">
            <DownOutlined />
            <span>{hiddenTags.length}</span>
          </span>
        </Dropdown>
      ) : null}
      <div ref={measureRef} className="tags-view-measure" aria-hidden>
        {visited.map((tag) => (
          <span key={tag.path} className="tags-view-item" data-tag-path={tag.path}>
            {resolveTitle(tag.title)}
            <CloseOutlined className="tags-view-close" />
          </span>
        ))}
        <span className="tags-view-item tags-view-more">
          <DownOutlined />
          <span>99</span>
        </span>
      </div>
    </div>
  );
}
