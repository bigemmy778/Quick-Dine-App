import axios from "axios";


const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    headers: {
        "Content-Type": "application/json",
    }
})

//insert token into the local storage so users can access private routes if authorized
//Request interceptor to attach Jwt token
api.interceptors.request.use(
    (config)=>{
      const token = localStorage.getItem("token");
      if(token){
        config.headers.Authorization = `Bearer ${token}`
      }
      return config;
    },
    (error)=>{
       return Promise.reject(error)
    }
)


export default api 