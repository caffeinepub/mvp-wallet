import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  History,
  Home,
  Loader2,
  LogOut,
  PiggyBank,
  QrCode,
  Send,
  Wallet,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { TransactionType } from "./backend.d";
import { QRCodeDisplay } from "./components/QRCodeDisplay";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useDepositCofrinho,
  useSendPix,
  useSimulateReceivePix,
  useWalletState,
  useWithdrawCofrinho,
} from "./hooks/useQueries";

type Screen = "home" | "sendPix" | "receivePix" | "cofrinho" | "history";
type SendStep = "form" | "confirm" | "success";
type CofrinhoAction = "deposit" | "withdraw" | null;

const PIX_KEY = "mvpwallet@cpf.com";

const SENDER_NAMES = [
  "João Silva",
  "Maria Oliveira",
  "Pedro Santos",
  "Ana Lima",
  "Carlos Souza",
];

function formatBRL(value: bigint): string {
  return `R$ ${(Number(value) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp / 1_000_000n);
  return new Date(ms).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function txTypeLabel(type: TransactionType): string {
  switch (type) {
    case TransactionType.sentPix:
      return "Pix enviado";
    case TransactionType.receivedPix:
      return "Pix recebido";
    case TransactionType.cofrinhoDeposit:
      return "Depósito no Cofrinho";
    case TransactionType.cofrinhoWithdrawal:
      return "Resgate do Cofrinho";
    default:
      return "Transação";
  }
}

function txIsDebit(type: TransactionType): boolean {
  return (
    type === TransactionType.sentPix || type === TransactionType.cofrinhoDeposit
  );
}

function TxIcon({ type }: { type: TransactionType }) {
  const debit = txIsDebit(type);
  if (
    type === TransactionType.cofrinhoDeposit ||
    type === TransactionType.cofrinhoWithdrawal
  ) {
    return (
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: debit ? "#FDE8E8" : "#E6F4EA" }}
      >
        <span className="text-lg">🐷</span>
      </div>
    );
  }
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: debit ? "#FDE8E8" : "#E6F4EA" }}
    >
      {debit ? (
        <ArrowUpRight className="w-5 h-5" style={{ color: "#EA4335" }} />
      ) : (
        <ArrowDownLeft className="w-5 h-5" style={{ color: "#34A853" }} />
      )}
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen() {
  const { login, isInitializing, isLoggingIn } = useInternetIdentity();
  const isLoading = isInitializing || isLoggingIn;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "#F8F9FA" }}
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-5">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #1A73E8 0%, #1557B0 100%)",
              boxShadow: "0 4px 20px rgba(26,115,232,0.35)",
            }}
          >
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <div className="text-center">
            <h1
              className="text-3xl font-medium"
              style={{
                color: "#202124",
                fontFamily: "'Google Sans', Roboto, sans-serif",
              }}
            >
              MVP Wallet
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: "#5F6368" }}>
              Sua carteira digital no ICP
            </p>
          </div>
        </div>

        {/* Features hint */}
        <div
          className="w-full rounded-2xl p-5 space-y-3"
          style={{
            background: "#ffffff",
            border: "1px solid #E8EAED",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          {[
            { emoji: "⚡", text: "Pix instantâneo" },
            { emoji: "🐷", text: "Cofrinho para guardar" },
            { emoji: "🔒", text: "Seguro com Internet Identity" },
          ].map(({ emoji, text }) => (
            <div key={text} className="flex items-center gap-3">
              <span className="text-xl">{emoji}</span>
              <span
                className="text-sm font-medium"
                style={{ color: "#5F6368" }}
              >
                {text}
              </span>
            </div>
          ))}
        </div>

        {/* Login button */}
        <button
          type="button"
          onClick={login}
          disabled={isLoading}
          className="w-full h-14 rounded-full font-medium text-white text-base flex items-center justify-center gap-3 transition-opacity hover:opacity-90 active:scale-[0.98]"
          style={{
            background: "#1A73E8",
            boxShadow: "0 2px 8px rgba(26,115,232,0.4)",
          }}
          data-ocid="login.submit_button"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Wallet className="w-5 h-5" />
              Entrar na Carteira
            </>
          )}
        </button>

        <p className="text-xs text-center" style={{ color: "#9AA0A6" }}>
          Powered by Internet Computer Protocol
        </p>
      </div>
    </div>
  );
}

// ─── Home Screen ─────────────────────────────────────────────────────────────

function HomeScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const { data: wallet, isLoading } = useWalletState();
  const { clear } = useInternetIdentity();

  const recent = wallet?.transactions
    .slice()
    .sort((a, b) => Number(b.timestamp - a.timestamp))
    .slice(0, 4);

  const quickActions = [
    {
      label: "Enviar Pix",
      icon: Send,
      screen: "sendPix" as Screen,
      bg: "#E8F0FE",
      color: "#1A73E8",
    },
    {
      label: "Receber",
      icon: QrCode,
      screen: "receivePix" as Screen,
      bg: "#E6F4EA",
      color: "#34A853",
    },
    {
      label: "Cofrinho",
      icon: PiggyBank,
      screen: "cofrinho" as Screen,
      bg: "#FEF7E0",
      color: "#F29900",
    },
    {
      label: "Histórico",
      icon: History,
      screen: "history" as Screen,
      bg: "#FCE8E6",
      color: "#EA4335",
    },
  ];

  return (
    <div className="flex flex-col gap-5 pb-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "#1A73E8" }}
          >
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span
            className="font-medium text-sm"
            style={{
              color: "#202124",
              fontFamily: "'Google Sans', Roboto, sans-serif",
            }}
          >
            MVP Wallet
          </span>
        </div>
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors hover:bg-red-50"
          style={{ color: "#5F6368" }}
          title="Sair"
          data-ocid="home.logout_button"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair</span>
        </button>
      </div>

      {/* Balance Card */}
      <div
        className="rounded-[20px] p-6 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1A73E8 0%, #1557B0 60%, #0D47A1 100%)",
          boxShadow: "0 4px 20px rgba(26,115,232,0.4)",
        }}
        data-ocid="home.card"
      >
        <div
          className="absolute -top-10 -right-10 w-36 h-36 rounded-full opacity-15"
          style={{ background: "white" }}
        />
        <div
          className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-10"
          style={{ background: "white" }}
        />
        <div className="absolute top-4 right-6 opacity-20">
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-white" />
            <div className="w-3 h-3 rounded-full bg-white" />
          </div>
        </div>
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <p className="text-white/80 text-sm font-medium">
              Saldo disponível
            </p>
            <button
              type="button"
              onClick={() => setBalanceVisible((v) => !v)}
              className="text-white/70 hover:text-white transition-colors"
              data-ocid="home.toggle"
            >
              {balanceVisible ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </button>
          </div>
          {isLoading ? (
            <Skeleton className="h-10 w-40 bg-white/20 rounded-lg mt-1" />
          ) : (
            <p
              className="text-4xl font-bold text-white mt-1 tracking-tight"
              data-ocid="home.balance_display"
            >
              {balanceVisible ? formatBRL(wallet?.balance ?? 0n) : "R$ ••••••"}
            </p>
          )}
          <p className="text-white/60 text-xs mt-2">Conta MVP Wallet</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3">
        {quickActions.map(({ label, icon: Icon, screen, bg, color }) => (
          <button
            type="button"
            key={screen}
            onClick={() => onNavigate(screen)}
            className="flex flex-col items-center gap-2 group"
            data-ocid={`home.${screen}_button`}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 group-active:scale-95"
              style={{ background: bg }}
            >
              <Icon className="w-6 h-6" style={{ color }} />
            </div>
            <span className="text-xs font-medium" style={{ color: "#5F6368" }}>
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-base" style={{ color: "#202124" }}>
            Últimas transações
          </h3>
          <button
            type="button"
            onClick={() => onNavigate("history")}
            className="text-xs font-medium flex items-center gap-1 transition-opacity hover:opacity-80"
            style={{ color: "#1A73E8" }}
            data-ocid="home.history_link"
          >
            Ver tudo <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "#ffffff",
            border: "1px solid #E8EAED",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          {isLoading ? (
            <div className="p-4 space-y-4" data-ocid="home.loading_state">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : recent && recent.length > 0 ? (
            recent.map((tx, i) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 px-4 py-3.5 border-b last:border-b-0"
                style={{ borderColor: "#F1F3F4" }}
                data-ocid={`home.item.${i + 1}`}
              >
                <TxIcon type={tx.transactionType} />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: "#202124" }}
                  >
                    {txTypeLabel(tx.transactionType)}
                  </p>
                  <p className="text-xs truncate" style={{ color: "#9AA0A6" }}>
                    {tx.description || tx.pixKey || "—"}
                  </p>
                </div>
                <p
                  className="text-sm font-semibold flex-shrink-0"
                  style={{
                    color: txIsDebit(tx.transactionType)
                      ? "#EA4335"
                      : "#34A853",
                  }}
                >
                  {txIsDebit(tx.transactionType) ? "-" : "+"}
                  {formatBRL(tx.amount)}
                </p>
              </div>
            ))
          ) : (
            <div className="py-10 text-center" data-ocid="home.empty_state">
              <p className="text-sm" style={{ color: "#9AA0A6" }}>
                Nenhuma transação ainda
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Send Pix Screen ──────────────────────────────────────────────────────────

function SendPixScreen({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<SendStep>("form");
  const [pixKey, setPixKey] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [newBalance, setNewBalance] = useState<bigint>(0n);
  const sendPix = useSendPix();
  const { data: wallet } = useWalletState();

  const parsedAmount = Math.round(
    Number.parseFloat(amount.replace(",", ".")) * 100,
  );
  const isValidAmount = !Number.isNaN(parsedAmount) && parsedAmount > 0;

  const handleConfirm = async () => {
    try {
      const newBal = await sendPix.mutateAsync({
        pixKey,
        amount: BigInt(parsedAmount),
        description,
      });
      setNewBalance(newBal);
      setStep("success");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar Pix");
    }
  };

  const handleReset = () => {
    setStep("form");
    setPixKey("");
    setAmount("");
    setDescription("");
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={step === "form" ? onBack : handleReset}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100"
          style={{ background: "#F1F3F4" }}
          data-ocid="sendpix.back_button"
        >
          <ArrowLeft className="w-4 h-4" style={{ color: "#5F6368" }} />
        </button>
        <h2 className="text-xl font-medium" style={{ color: "#202124" }}>
          Enviar Pix
        </h2>
      </div>

      {step === "form" && (
        <div
          className="rounded-2xl p-5 space-y-4 animate-scale-in"
          style={{
            background: "#ffffff",
            border: "1px solid #E8EAED",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <div className="space-y-2">
            <label
              htmlFor="pix-key-input"
              className="text-sm font-medium"
              style={{ color: "#5F6368" }}
            >
              Chave Pix
            </label>
            <Input
              id="pix-key-input"
              placeholder="CPF, telefone, e-mail ou chave aleatória"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              className="h-12 rounded-xl"
              style={{ borderColor: "#E8EAED" }}
              data-ocid="sendpix.pixkey_input"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="pix-amount-input"
              className="text-sm font-medium"
              style={{ color: "#5F6368" }}
            >
              Valor (R$)
            </label>
            <Input
              id="pix-amount-input"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="text"
              inputMode="decimal"
              className="h-12 rounded-xl text-lg font-semibold"
              style={{ borderColor: "#E8EAED" }}
              data-ocid="sendpix.amount_input"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="pix-desc-input"
              className="text-sm font-medium"
              style={{ color: "#5F6368" }}
            >
              Descrição <span style={{ color: "#9AA0A6" }}>(opcional)</span>
            </label>
            <Input
              id="pix-desc-input"
              placeholder="Ex: Almoço, conta do mês..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-12 rounded-xl"
              style={{ borderColor: "#E8EAED" }}
              data-ocid="sendpix.description_input"
            />
          </div>
          {wallet && (
            <p className="text-xs" style={{ color: "#9AA0A6" }}>
              Saldo disponível: {formatBRL(wallet.balance)}
            </p>
          )}
          <Button
            onClick={() => setStep("confirm")}
            disabled={!pixKey.trim() || !isValidAmount}
            className="w-full h-12 rounded-full font-medium text-white"
            style={{ background: "#1A73E8" }}
            data-ocid="sendpix.next_button"
          >
            Continuar
          </Button>
        </div>
      )}

      {step === "confirm" && (
        <div className="space-y-4 animate-scale-in">
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{
              background: "#ffffff",
              border: "1px solid #E8EAED",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            <h3
              className="font-medium text-center"
              style={{ color: "#202124" }}
            >
              Confirmar Pix
            </h3>
            <div className="space-y-3">
              {[
                { label: "Para", value: pixKey },
                {
                  label: "Valor",
                  value: `R$ ${Number.parseFloat(amount.replace(",", ".")).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                },
                { label: "Descrição", value: description || "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-sm" style={{ color: "#5F6368" }}>
                    {label}
                  </span>
                  <span
                    className="text-sm font-medium text-right max-w-[60%] break-all"
                    style={{ color: "#202124" }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-px" style={{ background: "#F1F3F4" }} />
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: "#5F6368" }}>
                Saldo após
              </span>
              <span
                className="text-sm font-semibold"
                style={{ color: "#34A853" }}
              >
                {wallet
                  ? formatBRL(wallet.balance - BigInt(parsedAmount))
                  : "—"}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleReset}
              variant="outline"
              className="h-12 rounded-full font-medium"
              style={{ borderColor: "#E8EAED", color: "#5F6368" }}
              data-ocid="sendpix.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={sendPix.isPending}
              className="h-12 rounded-full font-medium text-white"
              style={{ background: "#1A73E8" }}
              data-ocid="sendpix.confirm_button"
            >
              {sendPix.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Confirmar"
              )}
            </Button>
          </div>
        </div>
      )}

      {step === "success" && (
        <div
          className="rounded-2xl p-8 text-center space-y-4 animate-bounce-in"
          style={{
            background: "#ffffff",
            border: "1px solid #E8EAED",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
            style={{ background: "#E6F4EA" }}
          >
            <Check className="w-10 h-10" style={{ color: "#34A853" }} />
          </div>
          <div>
            <h3 className="text-xl font-medium" style={{ color: "#202124" }}>
              Pix enviado!
            </h3>
            <p className="text-sm mt-1" style={{ color: "#5F6368" }}>
              Transferência realizada com sucesso
            </p>
          </div>
          <div className="rounded-xl p-3" style={{ background: "#F8F9FA" }}>
            <p className="text-xs" style={{ color: "#9AA0A6" }}>
              Novo saldo
            </p>
            <p className="text-2xl font-bold mt-1" style={{ color: "#34A853" }}>
              {formatBRL(newBalance)}
            </p>
          </div>
          <Button
            onClick={onBack}
            className="w-full h-12 rounded-full font-medium text-white"
            style={{ background: "#1A73E8" }}
            data-ocid="sendpix.done_button"
          >
            Voltar ao início
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Receive Pix Screen ───────────────────────────────────────────────────────

function ReceivePixScreen({ onBack }: { onBack: () => void }) {
  const [copied, setCopied] = useState(false);
  const [qrAmount, setQrAmount] = useState("");
  const [simAmount, setSimAmount] = useState("");
  const simulateReceive = useSimulateReceivePix();

  const qrValue = qrAmount ? `${PIX_KEY}?amount=${qrAmount}` : PIX_KEY;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(PIX_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulate = async () => {
    const amountVal = Math.round(
      Number.parseFloat((simAmount || "50").replace(",", ".")) * 100,
    );
    const sender =
      SENDER_NAMES[Math.floor(Math.random() * SENDER_NAMES.length)];
    try {
      await simulateReceive.mutateAsync({
        amount: BigInt(amountVal),
        senderName: sender,
      });
      toast.success(
        `Pix recebido de ${sender}! R$ ${(amountVal / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      );
    } catch (err: any) {
      toast.error(err.message || "Erro ao simular recebimento");
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "#F1F3F4" }}
          data-ocid="receivepix.back_button"
        >
          <ArrowLeft className="w-4 h-4" style={{ color: "#5F6368" }} />
        </button>
        <h2 className="text-xl font-medium" style={{ color: "#202124" }}>
          Receber Pix
        </h2>
      </div>

      <div
        className="rounded-2xl p-5 flex flex-col items-center gap-4"
        style={{
          background: "#ffffff",
          border: "1px solid #E8EAED",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <div
          className="p-3 rounded-2xl"
          style={{ background: "white", border: "1px solid #E8EAED" }}
        >
          <QRCodeDisplay value={qrValue} size={180} />
        </div>
        <p className="text-sm font-medium" style={{ color: "#202124" }}>
          Escaneie para pagar
        </p>
      </div>

      <div
        className="rounded-2xl p-5 space-y-3"
        style={{
          background: "#ffffff",
          border: "1px solid #E8EAED",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <p className="text-sm font-medium" style={{ color: "#5F6368" }}>
          Sua chave Pix
        </p>
        <div className="flex items-center gap-3">
          <p
            className="flex-1 text-base font-medium"
            style={{ color: "#202124" }}
          >
            {PIX_KEY}
          </p>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: copied ? "#E6F4EA" : "#E8F0FE",
              color: copied ? "#34A853" : "#1A73E8",
            }}
            data-ocid="receivepix.copy_button"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
      </div>

      <div
        className="rounded-2xl p-5 space-y-3"
        style={{
          background: "#ffffff",
          border: "1px solid #E8EAED",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <label
          htmlFor="qr-amount-input"
          className="text-sm font-medium block"
          style={{ color: "#5F6368" }}
        >
          Valor específico (opcional)
        </label>
        <Input
          id="qr-amount-input"
          placeholder="R$ 0,00"
          value={qrAmount}
          onChange={(e) => setQrAmount(e.target.value)}
          inputMode="decimal"
          className="h-12 rounded-xl"
          style={{ borderColor: "#E8EAED" }}
          data-ocid="receivepix.amount_input"
        />
        <p className="text-xs" style={{ color: "#9AA0A6" }}>
          O QR code será atualizado automaticamente
        </p>
      </div>

      <div
        className="rounded-2xl p-5 space-y-3"
        style={{
          background: "#ffffff",
          border: "1px solid #E8EAED",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <label
          htmlFor="sim-amount-input"
          className="text-sm font-medium block"
          style={{ color: "#5F6368" }}
        >
          Simular recebimento
        </label>
        <Input
          id="sim-amount-input"
          placeholder="Valor a receber (ex: 150,00)"
          value={simAmount}
          onChange={(e) => setSimAmount(e.target.value)}
          inputMode="decimal"
          className="h-12 rounded-xl"
          style={{ borderColor: "#E8EAED" }}
          data-ocid="receivepix.sim_input"
        />
        <Button
          onClick={handleSimulate}
          disabled={simulateReceive.isPending}
          className="w-full h-12 rounded-full font-medium text-white"
          style={{ background: "#34A853" }}
          data-ocid="receivepix.simulate_button"
        >
          {simulateReceive.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Simular Recebimento"
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Cofrinho Screen ──────────────────────────────────────────────────────────

function CofrinhoScreen({ onBack }: { onBack: () => void }) {
  const [action, setAction] = useState<CofrinhoAction>(null);
  const [amount, setAmount] = useState("");
  const depositCofrinho = useDepositCofrinho();
  const withdrawCofrinho = useWithdrawCofrinho();
  const { data: wallet, isLoading } = useWalletState();

  const parsedAmount = Math.round(
    Number.parseFloat(amount.replace(",", ".")) * 100,
  );
  const isValid = !Number.isNaN(parsedAmount) && parsedAmount > 0;

  const handleAction = async () => {
    try {
      if (action === "deposit") {
        await depositCofrinho.mutateAsync(BigInt(parsedAmount));
        toast.success(
          `R$ ${(parsedAmount / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} depositado no cofrinho!`,
        );
      } else if (action === "withdraw") {
        await withdrawCofrinho.mutateAsync(BigInt(parsedAmount));
        toast.success(
          `R$ ${(parsedAmount / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} resgatado do cofrinho!`,
        );
      }
      setAction(null);
      setAmount("");
    } catch (err: any) {
      toast.error(err.message || "Erro na operação");
    }
  };

  const total = (wallet?.balance ?? 0n) + (wallet?.cofrinhoBalance ?? 0n);
  const cofrinhoPercent =
    total > 0n
      ? Math.min(
          100,
          Math.round(
            (Number(wallet?.cofrinhoBalance ?? 0n) * 100) / Number(total),
          ),
        )
      : 0;

  const isPending = depositCofrinho.isPending || withdrawCofrinho.isPending;

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "#F1F3F4" }}
          data-ocid="cofrinho.back_button"
        >
          <ArrowLeft className="w-4 h-4" style={{ color: "#5F6368" }} />
        </button>
        <h2 className="text-xl font-medium" style={{ color: "#202124" }}>
          Cofrinho 🐷
        </h2>
      </div>

      <div
        className="rounded-2xl p-6 text-center space-y-4"
        style={{
          background: "linear-gradient(135deg, #FEF7E0 0%, #FFF9E6 100%)",
          border: "1px solid #F9E4A0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
        data-ocid="cofrinho.card"
      >
        <div className="text-7xl animate-bounce-in">🐷</div>
        <div>
          <p className="text-sm" style={{ color: "#5F6368" }}>
            Saldo no cofrinho
          </p>
          {isLoading ? (
            <Skeleton className="h-10 w-36 mx-auto mt-1 rounded-lg" />
          ) : (
            <p className="text-3xl font-bold mt-1" style={{ color: "#F29900" }}>
              {formatBRL(wallet?.cofrinhoBalance ?? 0n)}
            </p>
          )}
        </div>

        <div>
          <div
            className="flex justify-between text-xs mb-1.5"
            style={{ color: "#9AA0A6" }}
          >
            <span>0%</span>
            <span>{cofrinhoPercent}% do patrimônio</span>
            <span>100%</span>
          </div>
          <div
            className="h-3 rounded-full overflow-hidden"
            style={{ background: "#F1F3F4" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${cofrinhoPercent}%`,
                background: "linear-gradient(90deg, #FBBC04, #F29900)",
              }}
            />
          </div>
        </div>

        <div
          className="rounded-xl p-3"
          style={{ background: "rgba(255,255,255,0.7)" }}
        >
          <p className="text-xs" style={{ color: "#9AA0A6" }}>
            Saldo na carteira
          </p>
          {isLoading ? (
            <Skeleton className="h-6 w-28 mx-auto mt-1 rounded" />
          ) : (
            <p
              className="text-lg font-semibold mt-0.5"
              style={{ color: "#202124" }}
            >
              {formatBRL(wallet?.balance ?? 0n)}
            </p>
          )}
        </div>
      </div>

      {!action && (
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setAction("deposit")}
            className="h-14 rounded-2xl font-medium text-white flex-col gap-1"
            style={{ background: "#1A73E8" }}
            data-ocid="cofrinho.deposit_button"
          >
            <span className="text-lg">💰</span>
            <span className="text-sm">Depositar</span>
          </Button>
          <Button
            onClick={() => setAction("withdraw")}
            variant="outline"
            className="h-14 rounded-2xl font-medium flex-col gap-1"
            style={{ borderColor: "#FBBC04", color: "#F29900" }}
            data-ocid="cofrinho.withdraw_button"
          >
            <span className="text-lg">💸</span>
            <span className="text-sm">Resgatar</span>
          </Button>
        </div>
      )}

      {action && (
        <div
          className="rounded-2xl p-5 space-y-4 animate-scale-in"
          style={{
            background: "#ffffff",
            border: "1px solid #E8EAED",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-medium" style={{ color: "#202124" }}>
              {action === "deposit"
                ? "💰 Depositar no Cofrinho"
                : "💸 Resgatar do Cofrinho"}
            </h3>
            <button
              type="button"
              onClick={() => {
                setAction(null);
                setAmount("");
              }}
              className="rounded-full p-1 hover:bg-gray-100 transition-colors"
              style={{ color: "#5F6368" }}
              data-ocid="cofrinho.close_button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <label htmlFor="cofrinho-amount-input" className="sr-only">
            Valor
          </label>
          <Input
            id="cofrinho-amount-input"
            placeholder="Valor (ex: 100,00)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            className="h-12 rounded-xl text-lg font-semibold"
            style={{ borderColor: "#E8EAED" }}
            data-ocid="cofrinho.amount_input"
          />
          <Button
            onClick={handleAction}
            disabled={!isValid || isPending}
            className="w-full h-12 rounded-full font-medium text-white"
            style={{ background: "#1A73E8" }}
            data-ocid="cofrinho.submit_button"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Confirmar"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── History Screen ───────────────────────────────────────────────────────────

function HistoryScreen({ onBack }: { onBack: () => void }) {
  const { data: wallet, isLoading } = useWalletState();

  const sorted = wallet?.transactions
    .slice()
    .sort((a, b) => Number(b.timestamp - a.timestamp));

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "#F1F3F4" }}
          data-ocid="history.back_button"
        >
          <ArrowLeft className="w-4 h-4" style={{ color: "#5F6368" }} />
        </button>
        <h2 className="text-xl font-medium" style={{ color: "#202124" }}>
          Histórico
        </h2>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "#ffffff",
          border: "1px solid #E8EAED",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        {isLoading ? (
          <div className="p-4 space-y-4" data-ocid="history.loading_state">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : sorted && sorted.length > 0 ? (
          <div data-ocid="history.list">
            {sorted.map((tx, i) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 px-4 py-4 border-b last:border-b-0"
                style={{ borderColor: "#F1F3F4" }}
                data-ocid={`history.item.${i + 1}`}
              >
                <TxIcon type={tx.transactionType} />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium"
                    style={{ color: "#202124" }}
                  >
                    {txTypeLabel(tx.transactionType)}
                  </p>
                  <p
                    className="text-xs mt-0.5 truncate"
                    style={{ color: "#9AA0A6" }}
                  >
                    {tx.description || tx.pixKey || "—"}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#BDC1C6" }}>
                    {formatDate(tx.timestamp)} · Saldo:{" "}
                    {formatBRL(tx.balanceAfter)}
                  </p>
                </div>
                <p
                  className="text-sm font-bold flex-shrink-0"
                  style={{
                    color: txIsDebit(tx.transactionType)
                      ? "#EA4335"
                      : "#34A853",
                  }}
                >
                  {txIsDebit(tx.transactionType) ? "-" : "+"}
                  {formatBRL(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-14 text-center" data-ocid="history.empty_state">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm" style={{ color: "#9AA0A6" }}>
              Nenhuma transação encontrada
            </p>
            <p className="text-xs mt-1" style={{ color: "#BDC1C6" }}>
              Faça sua primeira transação!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "home" as Screen, label: "Início", icon: Home },
  { id: "sendPix" as Screen, label: "Enviar", icon: Send },
  { id: "receivePix" as Screen, label: "Receber", icon: QrCode },
  { id: "cofrinho" as Screen, label: "Cofrinho", icon: PiggyBank },
  { id: "history" as Screen, label: "Histórico", icon: History },
];

function BottomNav({
  current,
  onChange,
}: { current: Screen; onChange: (s: Screen) => void }) {
  return (
    <nav
      className="flex items-center justify-around px-2 py-2"
      style={{
        background: "#ffffff",
        borderTop: "1px solid #E8EAED",
      }}
    >
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const active = current === id;
        return (
          <button
            type="button"
            key={id}
            onClick={() => onChange(id)}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all"
            style={{
              background: active ? "#E8F0FE" : "transparent",
              minWidth: "52px",
            }}
            data-ocid={`nav.${id}_tab`}
          >
            <Icon
              className="w-5 h-5 transition-colors"
              style={{ color: active ? "#1A73E8" : "#9AA0A6" }}
            />
            <span
              className="text-[10px] font-medium transition-colors"
              style={{ color: active ? "#1A73E8" : "#9AA0A6" }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const { identity, isInitializing } = useInternetIdentity();
  const handleNavigate = useCallback((s: Screen) => setScreen(s), []);
  const handleBack = useCallback(() => setScreen("home"), []);

  // Show loading while identity is being restored
  if (isInitializing) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#F8F9FA" }}
      >
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: "#1A73E8" }}
        />
      </div>
    );
  }

  // Not authenticated — show login
  if (!identity) {
    return (
      <>
        <LoginScreen />
        <Toaster
          theme="light"
          toastOptions={{
            style: {
              background: "#ffffff",
              border: "1px solid #E8EAED",
              color: "#202124",
            },
          }}
        />
      </>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center"
      style={{ background: "#F8F9FA" }}
    >
      <div className="w-full max-w-sm flex flex-col min-h-screen">
        <main className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-6 pb-4">
          {screen === "home" && <HomeScreen onNavigate={handleNavigate} />}
          {screen === "sendPix" && <SendPixScreen onBack={handleBack} />}
          {screen === "receivePix" && <ReceivePixScreen onBack={handleBack} />}
          {screen === "cofrinho" && <CofrinhoScreen onBack={handleBack} />}
          {screen === "history" && <HistoryScreen onBack={handleBack} />}
        </main>

        <div
          className="text-center py-2 text-[10px]"
          style={{ color: "#BDC1C6" }}
        >
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#9AA0A6" }}
          >
            caffeine.ai
          </a>
        </div>

        <BottomNav current={screen} onChange={handleNavigate} />
      </div>

      <Toaster
        theme="light"
        toastOptions={{
          style: {
            background: "#ffffff",
            border: "1px solid #E8EAED",
            color: "#202124",
          },
        }}
      />
    </div>
  );
}
