import { createSlice } from "@reduxjs/toolkit";
import Storage from "@/utils/storage";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { CACHE_KEY } from "../../cacheKey";

export type LocaleCode = "zh-CN" | "en";

const localeSlice = createSlice({
  name: "locale",
  initialState: {
    lang: (Storage.get<LocaleCode>(CACHE_KEY.LANG) || "zh-CN") as LocaleCode,
  },
  reducers: {
    setLang(state, action) {
      state.lang = action.payload;
      Storage.set(CACHE_KEY.LANG, state.lang);
    },
  },
});

export const { setLang } = localeSlice.actions;
export default localeSlice.reducer;

export const useLocaleStore = () => {
  const lang = useAppSelector((s) => s.locale.lang);
  const dispatch = useAppDispatch();
  return {
    lang,
    setLang: (value: LocaleCode) => dispatch(setLang(value)),
  };
};
