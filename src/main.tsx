import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

const rootEl = document.getElementById("root")!;

try {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (error) {
  console.error("AqarTenpo failed to start:", error);
  rootEl.innerHTML = `
    <div style="min-height:100vh;display:grid;place-items:center;background:#f7f6f3;font-family:system-ui;padding:24px">
      <div style="max-width:420px;text-align:center;background:#fff;border:1px solid #e2e8f0;border-radius:24px;padding:32px">
        <h1 style="font-size:20px;font-weight:800;color:#0f172a;margin:0">تعذر فتح عقار تينبو</h1>
        <p style="color:#64748b;font-size:14px;margin:12px 0 20px">حصل خطأ أثناء تحميل التطبيق. جرّب تحديث الصفحة.</p>
        <button onclick="location.reload()" style="background:#0f172a;color:#fff;border:0;border-radius:999px;padding:12px 24px;font-weight:700;cursor:pointer">تحديث الصفحة</button>
      </div>
    </div>`;
}
