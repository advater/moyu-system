import { useCallback } from "react";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { useAppDispatch, useAppSelector } from "../../hooks";

export type TagView = {
  path: string;
  title: string;
  stamp?: number;
};

export const HOME_PATH = "/home";

const tagsSlice = createSlice({
  name: "tagsView",
  initialState: {
    visited: [] as TagView[],
  },
  reducers: {
    addTag(state, action: PayloadAction<TagView>) {
      const { path, title } = action.payload;
      if (!path || path === "/login") return;
      const existing = state.visited.find((item) => item.path === path);
      if (existing) {
        if (title) existing.title = title;
        return;
      }
      state.visited.push({ path, title, stamp: 0 });
    },
    removeTag(state, action: PayloadAction<string>) {
      state.visited = state.visited.filter((item) => item.path !== action.payload);
    },
    closeOthers(state, action: PayloadAction<string>) {
      state.visited = state.visited.filter((item) => item.path === action.payload);
    },
    closeAll(state) {
      state.visited = [];
    },
    refreshTag(state, action: PayloadAction<string>) {
      const tag = state.visited.find((item) => item.path === action.payload);
      if (tag) tag.stamp = (tag.stamp || 0) + 1;
    },
  },
});

export const { addTag, removeTag, closeOthers, closeAll, refreshTag } = tagsSlice.actions;
export default tagsSlice.reducer;

export const useTagsViewStore = () => {
  const visited = useAppSelector((s) => s.tagsView.visited);
  const dispatch = useAppDispatch();
  return {
    visited,
    addTag: useCallback((tag: TagView) => dispatch(addTag(tag)), [dispatch]),
    removeTag: useCallback((path: string) => dispatch(removeTag(path)), [dispatch]),
    closeOthers: useCallback((path: string) => dispatch(closeOthers(path)), [dispatch]),
    closeAll: useCallback(() => dispatch(closeAll()), [dispatch]),
    refreshTag: useCallback((path: string) => dispatch(refreshTag(path)), [dispatch]),
  };
};
