import {createContext,useContext,useState} from "react";
const C=createContext();
export function AuthProvider({children}){const [user,setUser]=useState(()=>JSON.parse(localStorage.getItem("agc_user")||"null"));
const login=(data)=>{localStorage.setItem("agc_token",data.token);localStorage.setItem("agc_user",JSON.stringify(data.user));setUser(data.user)};
const logout=()=>{localStorage.clear();setUser(null)}; return <C.Provider value={{user,login,logout}}>{children}</C.Provider>}
export const useAuth=()=>useContext(C);