import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import Loader from "../../components/ui/Loader";
import FormInput from "../../components/ui/FormInput";
import { loginSchema } from "../../utils/schemas/LoginSchema";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useLoginMutation } from "../../api/userApi";
import { useDispatch } from "react-redux";
import { setCredentials, setLocations } from "../../features/auth/authSlice";
import toast from "react-hot-toast";
import { useGetLocationByIdQuery } from "../../api/roleManagementApi";
import { skipToken } from "@reduxjs/toolkit/query";

const Login = () => {
  const [login, { isLoading, isError }] = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState(null);
  const { data: Location, isSuccess: isLocationLoaded } =
    useGetLocationByIdQuery(userId ? { id: userId } : skipToken);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      UserName: "",
      Password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (formData) => {
    try {
      const res = await login(formData).unwrap();
      if (res.status === "success") {
        dispatch(setCredentials(res.data));
        setUserId(res.data.Id);
        localStorage.setItem("auth", JSON.stringify(res.data.accessToken));
        toast.success(`Welcome ${res.data?.FullName}`);
      } else {
        toast.error("Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error(err?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-neutral-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-card">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-semibold text-neutral-900">
            Sign in to your account
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md space-y-4">
            <FormInput
              label="User name"
              type="UserName"
              placeholder="Enter your user name"
              required
              error={errors.UserName}
              {...register("UserName")}
            />
            <div className="relative">
              <FormInput
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                required
                error={errors.Password}
                {...register("Password")}
              />
              <div
                className="absolute top-9 right-3 cursor-pointer text-neutral-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-neutral-300 rounded"
                  {...register("rememberMe")}
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-neutral-800"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="font-medium text-primary hover:text-primary/80 focus:outline-none"
                >
                  Forgot your password?
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader /> : <>Sign in</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
