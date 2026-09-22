import React, { useEffect, useRef, useState } from "react";
import { Headset, LoaderCircle } from "lucide-react";

const EMBED_URL =
  "https://cdn.jsdelivr.net/npm/@chatvolt/embeds@latest/dist/chatbox/index.js";
const AGENT_ID = "cmkoa8q6501ypkh1566oeotza";
let widgetPromise;

async function loadWidget() {
  if (!widgetPromise) {
    widgetPromise = (async () => {
      let timer;
      try {
        const { default: Chatbox } = await Promise.race([
          import(/* @vite-ignore */ EMBED_URL),
          new Promise((_, reject) => {
            timer = setTimeout(
              () => reject(new Error("Tempo de carregamento excedido")),
              15000,
            );
          }),
        ]);
        const widget = await Chatbox.initBubble({
          agentId: AGENT_ID,
          interface: {
            primaryColor: "#16a34a",
            position: "right",
            isInitMessagePopupDisabled: true,
            bubbleButtonStyle: { display: "none" },
          },
        });
        // initBubble resolves before the external agent/interface has mounted.
        // Opening earlier loses the first click, so wait for the message input.
        await new Promise((resolve, reject) => {
          const root = widget.shadowRoot;
          if (!root) {
            reject(new Error("Interface do chat indisponível"));
            return;
          }
          const observer = new MutationObserver(check);
          const readyTimer = setTimeout(() => {
            observer.disconnect();
            widget.style.display = "none";
            reject(new Error("O agente não ficou disponível"));
          }, 15000);
          function check() {
            if (root.querySelector("textarea")) {
              observer.disconnect();
              clearTimeout(readyTimer);
              resolve();
            }
          }
          observer.observe(root, { childList: true, subtree: true });
          check();
        });
        return widget;
      } finally {
        clearTimeout(timer);
      }
    })().catch((error) => {
      widgetPromise = undefined;
      throw error;
    });
  }
  return widgetPromise;
}

export function SpecialistChat({ contact }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const widget = useRef(null);
  const launcher = useRef(null);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    const escape = (event) => {
      if (event.key === "Escape" && widget.current) {
        widget.current.close();
        launcher.current?.focus();
      }
    };
    document.addEventListener("keydown", escape);
    return () => {
      mounted.current = false;
      document.removeEventListener("keydown", escape);
      widget.current?.close();
      if (widget.current) widget.current.style.display = "none";
    };
  }, []);
  async function openChat() {
    setLoading(true);
    setError("");
    try {
      const instance = await loadWidget();
      if (!mounted.current) {
        instance.style.display = "none";
        return;
      }
      widget.current = instance;
      instance.style.display = "";
      instance.open();
    } catch {
      if (mounted.current)
        setError(
          "Não foi possível abrir o atendimento. Tente novamente ou fale pelo WhatsApp.",
        );
    } finally {
      if (mounted.current) setLoading(false);
    }
  }
  return (
    <div className="chat-widget fixed right-4 z-40 sm:right-5">
      {error && (
        <div className="mb-3 w-[min(340px,calc(100vw-32px))] rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <p role="alert" className="text-sm leading-6 text-slate-600">
            {error}
          </p>
          <button
            className="mt-3 text-sm font-semibold text-green-700"
            onClick={() => contact()}
          >
            Falar pelo WhatsApp
          </button>
        </div>
      )}
      <button
        ref={launcher}
        type="button"
        onClick={openChat}
        disabled={loading}
        className="ml-auto flex min-h-14 items-center gap-3 rounded-full border border-green-400/40 bg-[#0e213b] px-5 py-3 text-white shadow-lg shadow-slate-900/20 transition hover:bg-[#173454] disabled:opacity-75"
        aria-label="Chame especialista"
        aria-busy={loading}
      >
        {loading ? (
          <LoaderCircle
            size={22}
            className="animate-spin motion-reduce:animate-none"
          />
        ) : (
          <Headset size={23} />
        )}
        <span className="text-sm font-bold">
          {loading ? "Abrindo atendimento…" : "Chame especialista"}
        </span>
        <span
          className="h-2 w-2 rounded-full bg-green-400"
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
