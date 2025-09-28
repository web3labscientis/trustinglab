// ✅ TrustaLab Wallet Connection (Fixed Version)
class WalletManager {
  constructor() {
    this.accountId = null;
    this.paired = false;
    this.hashpackReady = false;
  }

  async waitForHashpack(timeout = 4000, interval = 200) {
    // Wait for window.hashpack to be injected, retrying for up to timeout ms
    const start = Date.now();
    return new Promise((resolve) => {
      const check = () => {
        if (window.hashpack) {
          this.hashpackReady = true;
          resolve(true);
        } else if (Date.now() - start > timeout) {
          resolve(false);
        } else {
          setTimeout(check, interval);
        }
      };
      check();
    });
  }

  async init() {
    const detected = await this.waitForHashpack();
    if (!detected) {
      this.showError("HashPack not detected. Please install the HashPack extension.");
      // Detailed error logging
      console.group("[HashPack Detection Error]");
      console.log("HashPack not found. Visit https://www.hashpack.app/download");
      console.log("Browser:", navigator.userAgent);
      console.log("Page URL:", window.location.href);
      console.log("Is HTTPS:", window.location.protocol === "https:");
      console.log("Is Incognito/Private Mode: (cannot detect reliably, check manually)");
      if (window.hashpack) {
        console.log("window.hashpack exists but may not be initialized correctly.");
      } else {
        console.log("window.hashpack is undefined.");
      }
      console.groupEnd();
      return false;
    }

    // Initialize dApp metadata
    this.appMetadata = {
      name: "TrustaLab",
      description: "Decentralized health data verification platform",
      icon: window.location.origin + "/images/trustalab_logo.png",
    };

    console.log("✅ HashPack detected");
    return true;
  }

  async connectWallet() {
    const ready = await this.init();
    if (!ready) return;

    try {
      console.log("🔗 Connecting to HashPack...");

      const response = await window.hashpack.connectToWallet(this.appMetadata);

      if (response && response.accountIds && response.accountIds.length > 0) {
        this.accountId = response.accountIds[0];
        this.paired = true;
        this.updateUI();
        this.showSuccess(`Connected: ${this.accountId}`);
        console.log("✅ Connected Account:", this.accountId);
      } else {
        throw new Error("No accounts returned");
      }
    } catch (err) {
      console.error("❌ Connection Error:", err);
      this.showError("Failed to connect HashPack. Please approve the connection in your wallet.");
    }
  }

  disconnectWallet() {
    this.paired = false;
    this.accountId = null;
    this.updateUI();
    this.showInfo("Wallet disconnected");
  }

  updateUI() {
    const btn = document.getElementById("connectWallet");
    if (!btn) return;

    if (this.paired && this.accountId) {
      btn.textContent = `${this.accountId.slice(0, 8)}...`;
      btn.classList.add("bg-green-500", "hover:bg-green-600");
      btn.onclick = () => this.disconnectWallet();
    } else {
      btn.textContent = "Connect HashPack";
      btn.classList.remove("bg-green-500", "hover:bg-green-600");
      btn.onclick = () => this.connectWallet();
    }
  }

  // Notifications
  showNotification(message, type = "info") {
    const div = document.createElement("div");
    div.className = `fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 text-white ${
      type === "error"
        ? "bg-red-500"
        : type === "success"
        ? "bg-green-500"
        : "bg-blue-500"
    }`;
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 4000);
  }

  showError(msg) {
    this.showNotification(msg, "error");
  }
  showSuccess(msg) {
    this.showNotification(msg, "success");
  }
  showInfo(msg) {
    this.showNotification(msg, "info");
  }
}

// ✅ Initialize wallet on page load
window.addEventListener("DOMContentLoaded", () => {
  window.walletManager = new WalletManager();
  const connectBtn = document.getElementById("connectWallet");
  if (connectBtn) connectBtn.onclick = () => walletManager.connectWallet();
});
