import { createSlice } from "@reduxjs/toolkit";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { getSimpleDictDataList } from "@/api/system/dict/dict.data";
import type { DictOption } from "@/utils/dict";
import { setServerDictMap } from "@/utils/dict";

type DictMap = Record<string, DictOption[]>;

function buildDictMap(list: any[] = []): DictMap {
  const map: DictMap = {};
  list.forEach((item) => {
    const type = item.dictType;
    if (!type) return;
    if (!map[type]) map[type] = [];
    map[type].push({
      label: item.label,
      value: item.value,
      color: item.colorType,
    });
  });
  return map;
}

const dictSlice = createSlice({
  name: "dict",
  initialState: {
    dictMap: {} as DictMap,
    isSetDict: false,
  },
  reducers: {
    setDictMap: (state, action) => {
      state.dictMap = action.payload || {};
      state.isSetDict = true;
    },
    resetDict: (state) => {
      state.dictMap = {};
      state.isSetDict = false;
    },
  },
});

export const { setDictMap, resetDict } = dictSlice.actions;
export default dictSlice.reducer;

let loading: Promise<void> | null = null;

export async function loadDictMap() {
  if (loading) return loading;
  loading = (async () => {
    try {
      const list = await getSimpleDictDataList();
      const map = buildDictMap(Array.isArray(list) ? list : []);
      setServerDictMap(map);
      const { store } = await import("@/store");
      store.dispatch(setDictMap(map));
    } finally {
      loading = null;
    }
  })();
  return loading;
}

export const useDictStore = () => {
  const dictMap = useAppSelector((state) => state.dict.dictMap);
  const isSetDict = useAppSelector((state) => state.dict.isSetDict);
  const dispatch = useAppDispatch();
  return {
    dictMap,
    isSetDict,
    loadDictMap,
    resetDict: () => {
      setServerDictMap({});
      dispatch(resetDict());
    },
  };
};
