import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import { createBrowserRouter, Navigate } from "react-router-dom";

import type { TRoute } from "./types";
import { MenuRoute, PrivateRoute } from "./private";
import { baseRoutes } from "./modules/base";
import { constantLayoutChildren } from "./modules/constant";
import { systemRoutes } from "./modules/system";
import { resolveRouterBasename } from "@/config/env";
import Layout from "@/layout/index";

const NotFound = lazy(() => import("@/views/Error/404"));

function convertRoutes(routes: TRoute[]): RouteObject[] {
  return (routes || []).map((item) => {
    const { isAuth, redirect, Component, meta, children, ...rest } = item;
    const route: RouteObject = { ...rest };
    if (redirect) {
      route.element = <Navigate to={redirect} replace />;
    } else if (Component) {
      route.element = (
        <Suspense fallback={<div>Loading...</div>}>
          <Component />
        </Suspense>
      );
    }
    if (meta?.menu) {
      route.element = <MenuRoute element={route.element} />;
    }
    if (meta?.permission) {
      route.element = (
        <PrivateRoute element={route.element} permission={meta.permission} />
      );
    } else if (isAuth) {
      route.element = <PrivateRoute element={route.element} />;
    }
    if (children) {
      route.children = convertRoutes(children);
    }
    return route;
  });
}

export function createAppRouter() {
  const layout: TRoute = {
    path: "/",
    element: <Layout />,
    isAuth: true,
    children: [
      ...constantLayoutChildren,
      ...systemRoutes,
      {
        path: "*",
        name: "fallback",
        Component: NotFound,
        meta: { hidden: true },
      },
    ],
  };
  return createBrowserRouter(convertRoutes([...baseRoutes, layout]), {
    basename: resolveRouterBasename(),
  });
}

export { convertRoutes };
export { baseRoutes };
export { isAuthPath, isCurrentAuthPath, AUTH_PATHS } from "./auth";
