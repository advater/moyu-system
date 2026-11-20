import { configureStore } from "@reduxjs/toolkit";

import userReducer from "./stores/user";
import permissionReducer from "./stores/permission";
import tenantReducer from "./stores/tenant";
import dictReducer from "./stores/dict";
import appReducer from "./stores/app";
import localeReducer from "./stores/locale";
import tagsViewReducer from "./stores/tagsView";

export const store = configureStore({
  reducer: {
    user: userReducer,
    permission: permissionReducer,
    tenant: tenantReducer,
    dict: dictReducer,
    app: appReducer,
    locale: localeReducer,
    tagsView: tagsViewReducer,
  },
});

export default store;
