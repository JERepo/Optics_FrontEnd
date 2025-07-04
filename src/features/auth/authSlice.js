import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
   refreshToken: null,
  access: {},
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { accessToken, access, ...user } = action.payload;
      state.token = accessToken;
      state.user = { ...user, access };
      state.access = access || {};
      state.isAuthenticated = true;
    },
    setRefreshTOken : (state,action) =>{
      state.token = action.payload.accessToken;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.access = {};
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;

