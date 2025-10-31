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
import luxonyxlogo from '../../assets/client01.jpg'
import optics from '../../assets/JELogo.jpg'


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
        console.log("REs kjanda - -", res.data);

        const locationArray = res.data.Locations.split(",").map(Number);

        if (locationArray.length > 1) {
          // setAccLocations(locationArray);
          dispatch(setLocations(locationArray));
        } else {
          // setAccLocations(locationArray);
          // setLocation(userLocationData.data.Locations[0]);
          dispatch(setLocations(res.data.Locations));
        }

        localStorage.setItem("auth", JSON.stringify(res.data.accessToken));
        toast.success(`Welcome ${res.data?.FullName}`);
      } else {
        toast.error("Invalid Credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error(
        err?.data?.message || "Incorrect UserName or Password Entered!"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-neutral-50">
      <div className="max-w-2xl w-full space-y-8 bg-white p-6 rounded-lg shadow-card">
        {/* Logo Section */}
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-br from-primary/10 to-blue-100 p-4 rounded-2xl shadow-sm border border-primary/20">
            <img
              src={optics}
              alt="Luxonyxlogo"
              className="h-35 w-64 mx-auto object-cover rounded-lg"
              
            />
            <div className="hidden h-16 w-16 bg-gradient-to-r from-primary to-blue-600 rounded-xl items-center justify-center text-white font-bold text-xl">
              OP
            </div>
          </div>
        </div>
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-semibold text-neutral-900">
            Sign in to your account
          </h2>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
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
