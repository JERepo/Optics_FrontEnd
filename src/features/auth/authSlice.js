import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  refreshToken: null,
  access: {},
  hasMultipleLocations: null,
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
    setRefreshTOken: (state, action) => {
      state.token = action.payload.accessToken;
    },
    setLocations: (state,action) => {
      state.hasMultipleLocations = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.access = {};
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, logout, setLocations } = authSlice.actions;
export default authSlice.reducer;
