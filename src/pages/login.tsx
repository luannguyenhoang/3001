"use client"

import type React from "react"

import { useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Lock, LogIn, Shield } from "lucide-react"
import { AuthContext } from "@/componet/auth-context"


export default function Page() {
  const { setToken, decodeUser } = useContext(AuthContext)
  const router = useRouter()
  const [mode, setMode] = useState<"choose" | "api" | "keycloak">("choose")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const FE_DOMAIN = typeof window !== "undefined" ? window.location.host : ""

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get("code")

    if (code) {
      exchangeCodeForToken(code)
    }
  }, [])

  const exchangeCodeForToken = async (code: string) => {
    try {
      setLoading(true)
      const res = await fetch("https://keycloak.devlab.info.vn/realms/master/protocol/openid-connect/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: "ome_ecm",
          code,
          redirect_uri: "http://localhost:3001",
        }),
      })

      const data = await res.json()

      if (!data.access_token) {
        setMessage("❌ Không thể đổi code sang token")
        setLoading(false)
        return
      }

      checkPermission(data.access_token)
    } catch (err: any) {
      setMessage("❌ Lỗi khi đổi code → token: " + err.message)
      setLoading(false)
    }
  }

  const checkPermission = async (accessToken: string) => {
    try {
      const res = await fetch("/api/check-permission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: accessToken,
          domain: FE_DOMAIN,
        }),
      });

      const data = await res.json();
      console.log("🟦 Permission result:", data);

      if (!data.status) {
        setMessage("❌ Không đủ quyền truy cập website này!");
        return;
      }

      localStorage.setItem("access_token", accessToken);
      setToken(accessToken);
      decodeUser(accessToken)
      router.push("/");
    } catch (err: any) {
      setMessage("❌ Lỗi check-permission: " + err.message);
    }
  };


  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const res = await fetch("https://keycloak.devlab.info.vn/realms/master/protocol/openid-connect/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "password",
        client_id: "ome_ecm",
        username,
        password,
      }),
    })

    const data = await res.json()

    if (data.access_token) {
      checkPermission(data.access_token)
    } else {
      setMessage("❌ Sai tài khoản hoặc mật khẩu")
      setLoading(false)
    }
  }

  if (mode === "choose")
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-700 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="w-10 h-10 text-blue-400" />
              <h1 className="text-3xl font-bold text-white">Webiste ecm Ome </h1>
            </div>
            <p className="text-slate-400 text-lg">Chọn phương thức đăng nhập của bạn</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* API Custom Login Card */}
            <button
              onClick={() => setMode("api")}
              className="group relative bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500 rounded-lg p-8 transition-all duration-300 text-left"
            >
              <div className="flex flex-col items-start h-full">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                  <LogIn className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Đăng nhập cơ bản</h3>
                <p className="text-slate-400 text-sm flex-grow">Sử dụng tài khoản username và mật khẩu của bạn</p>
                <div className="text-blue-400 text-sm font-medium mt-4 group-hover:translate-x-1 transition-transform">
                  Tiếp tục →
                </div>
              </div>
            </button>

            {/* Keycloak OAuth Card */}
            <button
              onClick={() => router.push("/register")}
              className="group relative bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500 rounded-lg p-8 transition-all duration-300 text-left"
            >
              <div className="flex flex-col items-start h-full">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                  <Lock className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Chưa có tài khoản</h3>
                <p className="text-slate-400 text-sm flex-grow">Ấn đăng ký</p>
                <div className="text-emerald-400 text-sm font-medium mt-4 group-hover:translate-x-1 transition-transform">
                  Tiếp tục →
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Đăng nhập</h2>
            <p className="text-slate-400 text-sm">Nhập thông tin tài khoản của bạn</p>
          </div>

          {/* Form */}
          <form onSubmit={handleCustomLogin} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Tài khoản</label>
              <input
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Mật khẩu</label>
              <input
                placeholder="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-semibold py-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Đang xử lý...
                </>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          {/* Message */}
          {message && (
            <div className="mb-6 p-4 bg-slate-700/30 border border-slate-600 rounded-lg">
              <p className="text-sm text-slate-200 text-center">{message}</p>
            </div>
          )}

          {/* Back Button */}
          <button
            onClick={() => setMode("choose")}
            disabled={loading}
            className="w-full text-slate-400 hover:text-slate-300 text-sm font-medium py-2 transition-colors"
          >
            ← Quay lại
          </button>
        </div>

        {/* Footer Info */}
        <p className="text-center text-slate-500 text-xs mt-6">Đăng nhập tài khoản của bạn để truy cập hệ thống</p>

      </div>
    </div>
  )
}
