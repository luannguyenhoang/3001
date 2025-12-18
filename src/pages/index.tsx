"use client"

import { useContext, useEffect, useState } from "react"
import { useRouter } from "next/router"
import { LogOut, User, Shield, ShoppingBag, Mail, CreditCard, QrCode } from "lucide-react"
import { AuthContext } from "@/componet/auth-context"
import dynamic from "next/dynamic"

const QRScanner = dynamic(() => import("@/componet/QRScanner"), { ssr: false })

export default function Home() {
  const { userInfo, logout, loadingUser } = useContext(AuthContext)
  const router = useRouter()
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!loadingUser && !userInfo) {
      router.push("/login")
    }
  }, [loadingUser, userInfo, router])

  // Auto-dismiss scan message after 5 seconds
  useEffect(() => {
    if (scanMessage) {
      const timer = setTimeout(() => {
        setScanMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [scanMessage])

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!userInfo) return null

  const handleBuyCourse = async () => {
    const accessToken = localStorage.getItem("access_token")
    if (!accessToken) {
      alert("Chưa đăng nhập")
      return
    }

    const res = await fetch("/api/add-lms-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken }),
    })

    const data = await res.json()

    if (!res.ok || !data.status) {
      alert("❌ Mua khóa học thất bại")
      return
    }

    alert("✅ Đã mua khóa học. Vui lòng đăng nhập LMS để học.")
  }

  const handleQRScan = async (scannedData: string) => {
    try {
      console.log("🔍 [QR SCAN] Raw scanned data:", scannedData);

      const qrPayload = JSON.parse(scannedData)
      console.log("📦 [QR SCAN] Parsed payload:", qrPayload);

      if (qrPayload.type !== "qr_login" || !qrPayload.sessionId || !qrPayload.confirmUrl) {
        console.error("❌ [QR SCAN] Invalid QR payload");
        setScanMessage({ type: 'error', text: 'Mã QR không hợp lệ' });
        setShowQRScanner(false)
        return
      }

      const accessToken = localStorage.getItem("access_token")
      if (!accessToken) {
        console.error("❌ [QR SCAN] No access token found");
        setScanMessage({ type: 'error', text: 'Không tìm thấy token đăng nhập' });
        setShowQRScanner(false)
        return
      }

      console.log("🔑 [QR SCAN] Access token found (length):", accessToken.length);
      console.log("🌐 [QR SCAN] Confirm URL:", qrPayload.confirmUrl);
      console.log("🎫 [QR SCAN] Session ID:", qrPayload.sessionId);

      // Confirm login by sending access token to san app
      console.log("📡 [QR SCAN] Sending confirmation request to /api/confirm-qr-login...");
      const res = await fetch("/api/confirm-qr-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: qrPayload.sessionId,
          accessToken,
          confirmUrl: qrPayload.confirmUrl,
        }),
      })

      console.log("📥 [QR SCAN] API response status:", res.status, res.statusText);

      const data = await res.json()
      console.log("📄 [QR SCAN] API response data:", data);

      if (!res.ok || !data.status) {
        const errorMsg = `Status: ${res.status}\nError: ${data.error || "Unknown error"}`;
        console.error("❌ [QR SCAN] Login confirmation failed:", errorMsg);
        setScanMessage({ type: 'error', text: `Xác nhận đăng nhập thất bại: ${data.error || "Unknown error"}` });
        setShowQRScanner(false)
        return
      }

      console.log("✅ [QR SCAN] Login confirmed successfully!");
      setScanMessage({ type: 'success', text: 'Xác nhận đăng nhập thành công!' });
      setShowQRScanner(false)
    } catch (err) {
      const error = err as Error;
      const errorDetails = `${error.message}`;
      console.error("❌ [QR SCAN] Exception:", error);
      setScanMessage({ type: 'error', text: `Lỗi: ${errorDetails}` });
      setShowQRScanner(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">E-Commerce</h1>
              <p className="text-xs text-slate-500">Quản lý tài khoản</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg transition-all duration-200 font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900">
                Xin chào, <span className="text-blue-600">{userInfo.name || userInfo.preferred_username}</span>
              </h2>
              <p className="text-slate-600">Chào mừng bạn quay trở lại!</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - User Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Info Cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              {userInfo.email && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email</p>
                  </div>
                  <p className="text-slate-900 font-medium text-balance">{userInfo.email}</p>
                </div>
              )}
              {userInfo.name && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tên đầy đủ</p>
                  </div>
                  <p className="text-slate-900 font-medium">{userInfo.name}</p>
                </div>
              )}
              {userInfo.preferred_username && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tên đăng nhập</p>
                  </div>
                  <p className="text-slate-900 font-medium">{userInfo.preferred_username}</p>
                </div>
              )}
              {userInfo.sub && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-orange-600" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">User ID</p>
                  </div>
                  <p className="text-slate-700 font-mono text-xs break-all">{userInfo.sub}</p>
                </div>
              )}
            </div>

            {/* Full Info Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Chi tiết tài khoản</h3>
              <div className="bg-slate-50 rounded-lg p-4 overflow-auto max-h-96 border border-slate-200">
                <pre className="text-slate-700 text-sm font-mono whitespace-pre-wrap break-words">
                  {JSON.stringify(userInfo, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg text-white sticky top-4">
              <div className="mb-6">
                <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-4">
                  <ShoppingBag className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Khóa học của bạn</h3>
                <p className="text-blue-100 text-sm leading-relaxed">
                  Mua khóa học để truy cập đầy đủ nội dung học tập và nhận chứng chỉ
                </p>
              </div>

              <button
                onClick={handleBuyCourse}
                className="w-full px-6 py-3 bg-white hover:bg-blue-50 text-blue-600 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 mb-3"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Mua khóa học</span>
              </button>

              <button
                onClick={() => setShowQRScanner(true)}
                className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/30 hover:border-white/50 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <QrCode className="w-5 h-5" />
                <span>Quét mã QR</span>
              </button>

            </div>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          onScanSuccess={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {/* Scan Message Toast */}
      {scanMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className={`rounded-lg shadow-lg p-4 flex items-center justify-between ${scanMessage.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
            }`}>
            <span className="font-medium">{scanMessage.text}</span>
            <button
              onClick={() => setScanMessage(null)}
              className="ml-4 text-white hover:text-gray-200 text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
