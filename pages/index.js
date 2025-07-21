import { useState, useEffect, useRef } from "react";

function RejectionPointAlerts({ livePrice }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const audioRef = useRef(null);
  const timeframes = ["1Min","3Min","5Min","15Min","30Min","45Min","1HR","2HR","3HR","4HR","Daily","Weekly","Monthly"];
  const [alerts, setAlerts] = useState(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("rpa_alerts") : null;
    return saved ? JSON.parse(saved) : Array(25).fill().map(() => ({
      timeframe: "1Min",
      price: "",
      enabled: false,
      message: ""
    }));
  });

  
  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/push-to-sheet");
    }, 1200); // every 1.2 seconds
    return () => clearInterval(interval);
  }, []);

useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("rpa_alerts", JSON.stringify(alerts));
    }
  }, [alerts]);

  useEffect(() => {
    alerts.forEach((a, idx) => {
      if (a.enabled && a.price !== "" && livePrice !== null) {
        if (parseFloat(livePrice) >= parseFloat(a.price)) {
          if (!a.fired) {
            audioRef.current && audioRef.current.play();
            alert(a.message || `Rejection Point Alert ${idx+1} Triggered!`);
            setAlerts(prev => {
              const updated = [...prev];
              updated[idx].fired = true;
              return updated;
            });
          }
        } else {
          if (a.fired) {
            setAlerts(prev => {
              const updated = [...prev];
              updated[idx].fired = false;
              return updated;
            });
          }
        }
      }
    });
  }, [livePrice]);

  const updateAlert = (idx, field, value) => {
    setAlerts(prev => {
      const updated = [...prev];
      updated[idx][field] = value;
      return updated;
    });
  };

  
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch("/api/qqq-price-hook");
        const data = await res.json();
        if (data && data.price) {
          setLivePrice(data.price);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchPrice(); // Initial call

    const redisInterval = setInterval(fetchPrice, 1000); // every 1s
    const sheetInterval = setInterval(() => {
      fetch("/api/push-to-sheet");
    }, 10000); // every 10s

    return () => {
      clearInterval(redisInterval);
      clearInterval(sheetInterval);
    };
  }, []);

return (
    <div className="border rounded-2xl shadow-lg bg-white p-4 mb-6">
      <div className="flex justify-between items-center mb-2"><h2 className="font-bold text-lg mb-2">Rejection Point alerts</h2><button onClick={() => setIsCollapsed(!isCollapsed)} className="px-2 py-1 bg-blue-500 text-white rounded">{isCollapsed ? "Expand" : "Collapse"}</button></div>
      {!isCollapsed && alerts.map((a, idx) => (
        <div key={idx} className="flex flex-wrap gap-2 mb-2 items-center">
          <span className="font-semibold">#{(idx + 1).toString().padStart(2, "0")}</span>
          <select
            className="border rounded p-1"
            value={a.timeframe}
            onChange={(e) => updateAlert(idx, "timeframe", e.target.value)}
          >
            {timeframes.map(tf => <option key={tf} value={tf}>{tf}</option>)}
          </select>
          <input
            className="border rounded p-1 w-20"
            type="number"
            value={a.price}
            onChange={(e) => updateAlert(idx, "price", e.target.value)}
            placeholder="Price"
          />
          <input
            className="border rounded p-1 w-40"
            type="text"
            value={a.message}
            onChange={(e) => updateAlert(idx, "message", e.target.value)}
            placeholder="Message"
          />
          <input
            type="checkbox"
            checked={a.enabled}
            onChange={() => updateAlert(idx, "enabled", !a.enabled)}
          />
          <span>Enable</span>
        </div>
      ))}
      <audio ref={audioRef}>
        <source src="/beep.mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
}

function GenericPanel({ panelNumber }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <div className="border rounded-2xl shadow-lg bg-white p-4 mb-6">
      <div className="flex justify-between items-center mb-2"><h2 className="font-bold text-lg">Panel {panelNumber}</h2><button onClick={() => setIsCollapsed(!isCollapsed)} className="px-2 py-1 bg-blue-500 text-white rounded">{isCollapsed ? "Expand" : "Collapse"}</button></div>
      <div style={{ display: isCollapsed ? "none" : "block" }}>
    {panelNumber === 3 ? <BreakTargetImageUI /> : <p className="text-sm text-gray-600">Panel content here.</p>}
    </div>
    </div>
  );
}

export default function Home() {
  const [livePrice, setLivePrice] = useState(null);

  useEffect(() => {
    async function fetchPrice() {
      try {
        const res = await fetch("/api/qqq-price-hook");
        const data = await res.json();
        if (data && data.price) {
          setLivePrice(data.price);
        }
      } catch (err) {
        console.error("Price poll error:", err);
      }
    }
    fetchPrice();
    const interval = setInterval(fetchPrice, 1000); // fetch from Redis every 1s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-xl mx-auto">
        <div className="border rounded-2xl shadow-lg bg-white p-4 mb-6">
          <h2 className="font-bold text-lg mb-2">Panel 1</h2>
          <p className="font-semibold mb-2">Live QQQ Price (Upstash): {livePrice !== null ? `$${livePrice}` : "Waiting for webhook..."}</p>
          <div className="w-full">
            <iframe
              src="https://s.tradingview.com/widgetembed/?symbol=NASDAQ%3AQQQ&interval=1&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=Light&style=1&timezone=Etc%2FUTC&withdateranges=1&hideideas=1&autosize=1"
              width="100%"
              height="400"
              frameBorder="0"
              allowFullScreen
            ></iframe>
          </div>
        </div>
        <RejectionPointAlerts livePrice={livePrice} />
        <ChanelBoundsAlerts livePrice={livePrice} />
        {[...Array(8)].map((_, idx) => (
          <GenericPanel key={idx + 3} panelNumber={idx + 3} />
        ))}
      </div>
    </div>
  );
}
function ChanelBoundsAlerts({ livePrice }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const audioRef = useRef(null);
  const timeframes = ["1Min","3Min","5Min","15Min","30Min","45Min","1HR","2HR","3HR","4HR","Daily","Weekly","Monthly"];
  const [alerts, setAlerts] = useState(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("cba_alerts") : null;
    return saved ? JSON.parse(saved) : Array(25).fill().map(() => ({
      timeframe: "1Min",
      price: "",
      enabled: false,
      message: ""
    }));
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cba_alerts", JSON.stringify(alerts));
    }
  }, [alerts]);

  useEffect(() => {
    alerts.forEach((a, idx) => {
      if (a.enabled && a.price !== "" && livePrice !== null) {
        if (parseFloat(livePrice) >= parseFloat(a.price)) {
          if (!a.fired) {
            audioRef.current && audioRef.current.play();
            alert(a.message || `Chanel Bounds Alert ${idx+1} Triggered!`);
            setAlerts(prev => {
              const updated = [...prev];
              updated[idx].fired = true;
              return updated;
            });
          }
        } else {
          if (a.fired) {
            setAlerts(prev => {
              const updated = [...prev];
              updated[idx].fired = false;
              return updated;
            });
          }
        }
      }
    });
  }, [livePrice]);

  const updateAlert = (idx, field, value) => {
    setAlerts(prev => {
      const updated = [...prev];
      updated[idx][field] = value;
      return updated;
    });
  };

  return (
    <div className="border rounded-2xl shadow-lg bg-white p-4 mb-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-bold text-lg mb-2">Chanel bounds alerts</h2>
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="px-2 py-1 bg-blue-500 text-white rounded">{isCollapsed ? "Expand" : "Collapse"}</button>
      </div>
      {!isCollapsed && alerts.map((a, idx) => (
        <div key={idx} className="flex flex-wrap gap-2 mb-2 items-center">
          <span className="font-semibold">#{(idx + 1).toString().padStart(2, "0")}</span>
          <select
            className="border rounded p-1"
            value={a.timeframe}
            onChange={(e) => updateAlert(idx, "timeframe", e.target.value)}
          >
            {timeframes.map(tf => <option key={tf} value={tf}>{tf}</option>)}
          </select>
          <input
            className="border rounded p-1 w-20"
            type="number"
            value={a.price}
            onChange={(e) => updateAlert(idx, "price", e.target.value)}
            placeholder="Price"
          />
          <input
            className="border rounded p-1 w-40"
            type="text"
            value={a.message}
            onChange={(e) => updateAlert(idx, "message", e.target.value)}
            placeholder="Message"
          />
          <input
            type="checkbox"
            checked={a.enabled}
            onChange={() => updateAlert(idx, "enabled", !a.enabled)}
          />
          <span>Enable</span>
        </div>
      ))}
      <audio ref={audioRef}>
        <source src="/beep.mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
}

function BreakTargetImageUI() {
  const [timeframe, setTimeframe] = useState("1Min");
  const [coilHigh, setCoilHigh] = useState("");
  const [coilLow, setCoilLow] = useState("");
  const [upAlertPrice, setUpAlertPrice] = useState("");
  const [downAlertPrice, setDownAlertPrice] = useState("");
  const [upAlertEnabled, setUpAlertEnabled] = useState(false);
  const [downAlertEnabled, setDownAlertEnabled] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 items-center">
        <label>Timeframe:</label>
        <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
          {["1Min","3Min","5Min","15Min","30Min","45Min","1HR","2HR","3HR","4HR","Daily","Weekly","Monthly"].map(tf => (
            <option key={tf} value={tf}>{tf}</option>
          ))}
        </select>
        <input type="number" value={coilHigh} onChange={(e) => setCoilHigh(e.target.value)} placeholder="Coil High" />
        <input type="number" value={coilLow} onChange={(e) => setCoilLow(e.target.value)} placeholder="Coil Low" />
        <button>Calculate Targets</button>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <label>Up Alert Price:</label>
        <input type="number" value={upAlertPrice} onChange={(e) => setUpAlertPrice(e.target.value)} />
        <input type="checkbox" checked={upAlertEnabled} onChange={() => setUpAlertEnabled(!upAlertEnabled)} />
        <span>{upAlertEnabled ? "Up Alert Set" : "Up Alert Off"}</span>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <label>Down Alert Price:</label>
        <input type="number" value={downAlertPrice} onChange={(e) => setDownAlertPrice(e.target.value)} />
        <input type="checkbox" checked={downAlertEnabled} onChange={() => setDownAlertEnabled(!downAlertEnabled)} />
        <span>{downAlertEnabled ? "Down Alert Set" : "Down Alert Off"}</span>
      </div>
      <div className="flex gap-2 items-center">
        <label>Alert Message:</label>
        <input type="text" value={alertMessage} onChange={(e) => setAlertMessage(e.target.value)} placeholder="Enter message" />
      </div>
    </div>
  );
}
