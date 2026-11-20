import { createSlice } from "@reduxjs/toolkit";
import { useAppDispatch, useAppSelector } from "../../hooks";

const userSlice = createSlice({
  name: "user",
  initialState: {
    userInfo: null as Record<string, any> | null,
    roles: [] as string[],
    isSetUser: false,
  },
  reducers: {
    setUserInfo: (state, action) => {
      state.userInfo = action.payload;
      state.isSetUser = Boolean(action.payload);
    },
    setRoles: (state, action) => {
      state.roles = action.payload || [];
    },
    resetUser: (state) => {
      state.userInfo = null;
      state.roles = [];
      state.isSetUser = false;
    },
  },
});

export const { setUserInfo, setRoles, resetUser } = userSlice.actions;
export default userSlice.reducer;

export const useUserStore = () => {
  const getUserInfo = useAppSelector((state) => state.user.userInfo);
  const getRoles = useAppSelector((state) => state.user.roles);
  const getIsSetUser = useAppSelector((state) => state.user.isSetUser);
  const dispatch = useAppDispatch();

  return {
    getUserInfo,
    getRoles,
    getIsSetUser,
    setUserInfo: (value: Record<string, any> | null) => dispatch(setUserInfo(value)),
    setRoles: (value: string[]) => dispatch(setRoles(value)),
    resetUser: () => dispatch(resetUser()),
  };
};
